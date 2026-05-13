import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Wraps an Anthropic call and retries on transient 529/overloaded errors with
 * short exponential backoff. After exhausting retries, throws a 503 so the
 * frontend can show a friendly "AI busy" message.
 */
async function callWithRetry<T>(fn: () => Promise<T>, label = 'AI call'): Promise<T> {
  const delays = [600, 1500, 3000]; // 3 retries: 0.6s, 1.5s, 3s
  let lastErr: unknown = null;
  for (let i = 0; i <= delays.length; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const status = (err as { status?: number; error?: { type?: string } })?.status;
      const isOverloaded =
        status === 529 || (err as { error?: { type?: string } })?.error?.type === 'overloaded_error';
      const isRetryable = isOverloaded || status === 503 || status === 502;
      if (!isRetryable || i >= delays.length) break;
      await new Promise((r) => setTimeout(r, delays[i]));
    }
  }
  const e = lastErr as { status?: number; message?: string; error?: { type?: string } };
  const isOverloaded = e?.status === 529 || e?.error?.type === 'overloaded_error';
  if (isOverloaded) {
    throw new ServiceUnavailableException('AI_OVERLOADED');
  }
  throw lastErr instanceof Error ? lastErr : new Error(`${label} failed`);
}

export interface JobAnalysis {
  title: string;
  description: string;
  categorySlug: string;
  categoryName: string;
  urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  priceMin: number;
  priceMax: number;
  estimatedHours: number;
  toolsNeeded: string[];
  skillsRequired: string[];
  summary: string; // short human-readable summary for the client
}

export interface WorkerMatchScore {
  workerId: string;
  score: number;
  reasons: string[];
}

export interface MapFilters {
  categories?: string[];
  urgency?: string[];
  distanceKm?: number;
  maxPrice?: number;
  minPrice?: number;
  unappliedOnly?: boolean;
  verifiedOnly?: boolean;
  summary?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly anthropic: Anthropic;

  constructor(private config: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async supportChat(history: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: `You are a friendly support assistant for RobosGig, an AI-powered local task marketplace.
Help visitors understand how the platform works, answer questions about pricing, safety, and how to get started.
Keep answers short and friendly. If asked about something unrelated to RobosGig, politely redirect.

Key facts:
- Clients post any task in plain language — AI categorises and prices it automatically
- Workers apply for jobs and get paid after completion
- 15% platform fee (10% with Client Business plan, 12% with Worker Pro plan)
- Workers go through identity verification
- Available in Vienna and expanding to other cities
- Sign up at app.robosgig.com`,
      messages: history,
    });
    return (response.content[0] as { type: string; text: string }).text;
  }

  async analyzeJob(rawInput: string, city = 'Vienna', country = 'Austria'): Promise<JobAnalysis> {
    this.logger.log(`Analyzing job: "${rawInput}"`);

    const prompt = `You are an AI assistant for a local task marketplace operating in ${city}, ${country} (prices in EUR).

A client described their task in plain language. Your job is to:
1. Understand what they need, regardless of what language they wrote in
2. Generate a professional job posting — write the title, description, and summary in the SAME language the client used
3. Suggest a fair price range based on LOCAL market rates for ${city}, ${country} — not generic European rates
4. Detect urgency and required skills

Client input: "${rawInput}"

Available categories and their slugs:
- plumbing (leaks, pipes, toilets, sinks, washing machines)
- electrical (wiring, outlets, switches, lamps, fuse box)
- carpentry (furniture assembly, shelves, doors, floors)
- painting (walls, ceilings, exterior)
- cleaning (home, office, deep cleaning, move-out)
- moving (furniture moving, relocation help)
- mechanical (car repair, bike repair)
- handyman (small repairs, general fixes)
- delivery (package pickup, grocery shopping, post office)
- caregiving (dog walking, elderly assistance, babysitting)
- other

Respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "title": "concise job title (max 60 chars)",
  "description": "professional 2-3 sentence description of the work needed",
  "categorySlug": "one of the slugs above",
  "categoryName": "human-readable category name",
  "urgency": "LOW | NORMAL | HIGH | EMERGENCY",
  "priceMin": <number in EUR>,
  "priceMax": <number in EUR>,
  "estimatedHours": <number>,
  "toolsNeeded": ["tool1", "tool2"],
  "skillsRequired": ["skill1", "skill2"],
  "summary": "one friendly sentence confirming what you understood, shown to the client"
}`;

    const text = await this.runAnalyzePrompt(prompt);

    try {
      const analysis = JSON.parse(text) as JobAnalysis;
      return analysis;
    } catch {
      this.logger.error('Failed to parse AI response', text);
      throw new Error('AI returned invalid response. Please try again.');
    }
  }

  /**
   * Runs the analyze prompt against Sonnet first (best quality). If Sonnet is
   * persistently overloaded after retries, falls back to Haiku 4.5 on a
   * separate capacity pool — almost never overloaded, slightly lower quality
   * but the wizard still works.
   */
  private async runAnalyzePrompt(prompt: string): Promise<string> {
    const call = (model: string) =>
      callWithRetry(
        () => this.anthropic.messages.create({
          model,
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
        `analyzeJob:${model}`,
      );

    try {
      const r = await call('claude-sonnet-4-6');
      return (r.content[0] as { type: string; text: string }).text;
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? '';
      const isOverload = msg.includes('AI_OVERLOADED');
      if (!isOverload) throw err;
      this.logger.warn('Sonnet overloaded after retries — falling back to Haiku 4.5');
      const r = await call('claude-haiku-4-5-20251001');
      return (r.content[0] as { type: string; text: string }).text;
    }
  }

  async parseMapFilters(query: string, availableCategories: string[]): Promise<MapFilters> {
    const response = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: `You are a search filter parser for a job map. Convert natural language queries into structured filter parameters.

Available categories: ${availableCategories.join(', ')}
Available urgency levels: LOW, NORMAL, HIGH, EMERGENCY
("urgent" → HIGH or EMERGENCY, "emergency" → EMERGENCY only)

Respond ONLY with a JSON object (no markdown):
{
  "categories": string[],
  "urgency": string[],
  "distanceKm": number,
  "maxPrice": number,
  "minPrice": number,
  "unappliedOnly": boolean,
  "verifiedOnly": boolean,
  "summary": string
}
Only include fields clearly implied. "summary" max 60 chars describes what was extracted.`,
      messages: [{ role: 'user', content: query }],
    });
    const raw = (response.content[0] as { type: string; text: string }).text;
    const text = raw.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
    try {
      return JSON.parse(text) as MapFilters;
    } catch {
      this.logger.error('Failed to parse map filter response', raw);
      return { summary: 'Could not parse query' };
    }
  }

  async scoreWorkers(
    jobAnalysis: JobAnalysis,
    workers: Array<{
      id: string;
      skills: string[];
      rating: number;
      totalJobs: number;
      hourlyRate: number | null;
      distanceKm: number;
      isAvailable: boolean;
    }>
  ): Promise<WorkerMatchScore[]> {
    if (workers.length === 0) return [];

    const workerList = workers
      .map(
        (w, i) =>
          `Worker ${i + 1} (id: ${w.id}):
  - Skills: ${w.skills.join(', ')}
  - Rating: ${w.rating}/5 (${w.totalJobs} jobs completed)
  - Hourly rate: ${w.hourlyRate ? `€${w.hourlyRate}/hr` : 'negotiable'}
  - Distance: ${w.distanceKm.toFixed(1)} km
  - Available now: ${w.isAvailable}`
      )
      .join('\n\n');

    const prompt = `You are matching workers to a job on a local task marketplace.

Job details:
- Title: ${jobAnalysis.title}
- Category: ${jobAnalysis.categoryName}
- Skills required: ${jobAnalysis.skillsRequired.join(', ')}
- Budget: €${jobAnalysis.priceMin}–€${jobAnalysis.priceMax}
- Urgency: ${jobAnalysis.urgency}

Available workers:
${workerList}

Score each worker from 0–100 based on: skill match (40%), rating (25%), distance (20%), price fit (15%).
Penalize heavily if not available and urgency is HIGH or EMERGENCY.

Respond ONLY with a valid JSON array (no markdown):
[
  { "workerId": "...", "score": 85, "reasons": ["Great skill match", "Close by", "Highly rated"] },
  ...
]
Sort by score descending. Include all workers.`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as { type: string; text: string }).text;

    try {
      return JSON.parse(text) as WorkerMatchScore[];
    } catch {
      this.logger.error('Failed to parse worker scoring response', text);
      return workers.map((w) => ({ workerId: w.id, score: 50, reasons: [] }));
    }
  }
}
