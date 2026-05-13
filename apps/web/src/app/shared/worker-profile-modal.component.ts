import { Component, inject, signal, computed, input, output, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/services/api.service';

interface Review { rating: number; comment: string | null; createdAt: string; job: { title: string } }
interface WorkerFullProfile {
  id: string; firstName: string; lastName: string; bio: string | null;
  avatarUrl: string | null; phone: string | null; hourlyRate: number | null;
  city: string; rating: number; totalJobs: number; totalReviews: number;
  idVerified: boolean; backgroundChecked: boolean; isAvailable: boolean;
  dateOfBirth: string | null;
  createdAt: string;
  skills: { skill: { name: string; category: { name: string; icon: string } } }[];
  reviews: Review[];
}

const CATEGORY_COLORS: Record<string, string> = {
  cleaning: '#10B981',
  electrical: '#F59E0B',
  assembly: '#737373',
  plumbing: '#3B82F6',
  moving: '#8B5CF6',
  delivery: '#EC4899',
  gardening: '#22C55E',
  handyman: '#F97316',
  painting: '#EF4444',
  pets: '#06B6D4',
};

@Component({
  selector: 'app-worker-profile-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wpm-root" role="dialog" aria-modal="true" (click)="close.emit()">
      <div class="wpm-scrim"></div>
      <div class="wpm-modal" (click)="$event.stopPropagation()">

        @if (loading()) {
          <div class="wpm-loading">
            <div class="wpm-ring"></div>
            <p>Loading profile…</p>
          </div>

        } @else if (profile(); as w) {

          <!-- ─── Header ─────────────────────── -->
          <div class="wpm-head">
            <div class="wpm-av">
              {{ initials() }}
              @if (w.isAvailable) { <span class="wpm-online" title="Online now"></span> }
            </div>

            <div class="wpm-head-main">
              <div class="wpm-name-row">
                <span class="wpm-name">{{ w.firstName }} {{ w.lastName }}</span>
                @if (w.idVerified) {
                  <span class="wpm-verified">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                    Verified
                  </span>
                }
              </div>

              <div class="wpm-chips">
                <span class="wpm-chip">
                  <span class="wpm-chip-ic">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M8 6V4h8v2"/></svg>
                  </span>
                  {{ w.totalJobs }} jobs
                </span>
                @if (w.city) {
                  <span class="wpm-chip">
                    <span class="wpm-chip-ic">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-7.58 7-13a7 7 0 0 0-14 0c0 5.42 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>
                    </span>
                    {{ w.city }}
                  </span>
                }
                @if (w.hourlyRate) {
                  <span class="wpm-chip wpm-chip--rate">€{{ w.hourlyRate }}/hr</span>
                }
                @if (workerAge()) {
                  <span class="wpm-chip">{{ workerAge() }} yrs old</span>
                }
              </div>

              @if (w.isAvailable) {
                <div class="wpm-available">
                  <span class="wpm-avail-dot"></span>
                  Available now
                </div>
              }
            </div>

            <button class="wpm-close" (click)="close.emit()" aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6 18 18M6 18 18 6"/></svg>
            </button>
          </div>

          <!-- ─── Trust strip ─────────────────── -->
          <div class="wpm-trust">
            <div class="wpm-trust-cell wpm-trust-cell--first">
              <span class="wpm-trust-k">Rating</span>
              <span class="wpm-trust-v">
                {{ w.rating ? w.rating.toFixed(1) : '—' }}
                <span class="wpm-star">★</span>
              </span>
              <span class="wpm-trust-s">
                {{ w.totalReviews ? w.totalReviews + ' review' + (w.totalReviews === 1 ? '' : 's') : 'no reviews yet' }}
              </span>
            </div>
            <div class="wpm-trust-cell">
              <span class="wpm-trust-k">Jobs</span>
              <span class="wpm-trust-v">{{ w.totalJobs }}</span>
              <span class="wpm-trust-s">completed</span>
            </div>
            <div class="wpm-trust-cell">
              <span class="wpm-trust-k">Verified</span>
              <span class="wpm-trust-v">{{ w.idVerified ? 'Yes' : '—' }}</span>
              <span class="wpm-trust-s">{{ w.backgroundChecked ? 'background check' : 'identity check' }}</span>
            </div>
            <div class="wpm-trust-cell">
              <span class="wpm-trust-k">Joined</span>
              <span class="wpm-trust-v">{{ joinedLabel() }}</span>
              <span class="wpm-trust-s">on RobosGig</span>
            </div>
          </div>

          <!-- ─── Body ───────────────────────── -->
          <div class="wpm-body">

            @if (!preview() && (applicationMessage() || proposedPrice())) {
              <div class="wpm-section">
                <div class="wpm-lbl-row">
                  <div class="wpm-lbl">Their application</div>
                </div>
                <div class="wpm-app">
                  <div class="wpm-app-row">
                    <span class="wpm-app-k">Proposed price</span>
                    <span class="wpm-app-v">
                      €{{ proposedPrice() ?? w.hourlyRate }}/hr
                      @if (vsRatePct() !== null) {
                        <span class="wpm-app-vs" [class.wpm-app-vs--neg]="vsRatePct()! > 0">
                          {{ vsRatePct()! > 0 ? '+' : '' }}{{ vsRatePct() }}% vs their rate
                        </span>
                      }
                    </span>
                  </div>
                  @if (applicationMessage()) {
                    <div class="wpm-quote">"{{ applicationMessage() }}"</div>
                  }
                </div>
              </div>
            }

            @if (w.bio) {
              <div class="wpm-section">
                <div class="wpm-lbl-row"><div class="wpm-lbl">About</div></div>
                <div class="wpm-about">{{ w.bio }}</div>
              </div>
            }

            @if (w.skills.length > 0) {
              <div class="wpm-section">
                <div class="wpm-lbl-row"><div class="wpm-lbl">Skills</div></div>
                <div class="wpm-skills">
                  @for (ws of w.skills; track ws.skill.name) {
                    <span class="wpm-skill">
                      <span class="wpm-skill-dot" [style.background]="skillColor(ws.skill.category.name)"></span>
                      {{ ws.skill.name }}
                    </span>
                  }
                </div>
              </div>
            }

            <div class="wpm-section">
              <div class="wpm-lbl-row">
                <div class="wpm-lbl">Reviews</div>
                <span class="wpm-lbl-right">{{ w.totalReviews }} reviews</span>
              </div>

              @if (w.reviews.length > 0) {
                <div class="wpm-reviews">
                  @for (r of w.reviews; track r.createdAt) {
                    <div class="wpm-review">
                      <div class="wpm-review-h">
                        <span class="wpm-review-stars">
                          <span class="wpm-star">★</span> {{ r.rating }}
                          <span class="wpm-review-job">· {{ r.job.title }}</span>
                        </span>
                      </div>
                      @if (r.comment) {
                        <div class="wpm-review-body">{{ r.comment }}</div>
                      }
                    </div>
                  }
                </div>
              } @else {
                <div class="wpm-empty">
                  <span class="wpm-empty-ic">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5l3 2"/></svg>
                  </span>
                  <div>
                    <div class="wpm-empty-t">No reviews yet</div>
                    <div class="wpm-empty-s">
                      This worker is building their reputation. Verified ID + accepted
                      application — RobosGig holds payment in escrow until you confirm
                      the job is done.
                    </div>
                  </div>
                </div>
              }
            </div>

          </div>

          <!-- ─── Footer ─────────────────────── -->
          @if (!jobCompleted() && !preview()) {
            <div class="wpm-foot">
              <button
                class="wpm-btn-icon"
                [class.wpm-btn-icon--on]="saved()"
                (click)="toggleSave()"
                [attr.aria-label]="saved() ? 'Saved' : 'Save for later'"
                type="button"
              >
                @if (saved()) {
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12v17l-6-4-6 4z"/></svg>
                } @else {
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12v17l-6-4-6 4z"/></svg>
                }
              </button>
              <button class="wpm-btn-ghost" (click)="onDecline()" type="button">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6 18 18M6 18 18 6"/></svg>
                Decline
              </button>
              <button class="wpm-btn-primary" (click)="onAccept()" type="button">
                Accept €{{ proposedPrice() ?? w.hourlyRate ?? 0 }}/hr
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </button>
            </div>
          }
        }

      </div>
    </div>
  `,
  styles: [`
    :host {
      --bg: var(--rg-bg, #fafafa);
      --panel: var(--rg-panel, #FFFFFF);
      --ink: var(--rg-ink, #0A0A0A);
      --muted: var(--rg-muted, #737373);
      --sub: var(--rg-sub, #A3A3A3);
      --rule: var(--rg-rule, #E8E8E5);
      --accent: var(--rg-accent, #84CC16);
      --accent-text: var(--rg-accent-text, #4D7C0F);
      --accent-bg: var(--rg-accent-bg, #F0FAE0);
      --soft: var(--rg-soft, #F5F5F3);
      --positive: var(--rg-positive, #15803D);
      --rate-bg: #EEF0FF;
      --rate-br: #C7D2FE;
      --rate-ink: #3F3BC4;
    }

    * { box-sizing: border-box; }

    .wpm-root {
      position: fixed; inset: 0; z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      padding: 40px 20px;
      font-family: 'Geist', 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      animation: wpmFade 160ms ease-out both;
    }
    @keyframes wpmFade { from { opacity: 0; } to { opacity: 1; } }
    .wpm-scrim {
      position: absolute; inset: 0;
      background: rgba(10,10,10,0.45);
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
    }

    .wpm-modal {
      position: relative; z-index: 1;
      width: 560px; max-width: 100%;
      background: var(--panel);
      border-radius: 18px;
      box-shadow: 0 30px 80px rgba(10,10,10,0.25), 0 8px 22px rgba(10,10,10,0.10);
      overflow: hidden;
      display: flex; flex-direction: column;
      max-height: 90vh;
      color: var(--ink);
      animation: wpmRise 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
    }
    @keyframes wpmRise {
      from { opacity: 0; transform: translateY(14px) scale(0.985); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* ── Loading ─────────────────────────── */
    .wpm-loading {
      padding: 4rem 2rem;
      display: flex; flex-direction: column; align-items: center; gap: 1rem;
      color: var(--sub); font-size: 13px;
    }
    .wpm-ring {
      width: 28px; height: 28px;
      border: 2.5px solid var(--rule);
      border-top-color: var(--ink);
      border-radius: 50%;
      animation: wpmSpin 0.8s linear infinite;
    }
    @keyframes wpmSpin { to { transform: rotate(360deg); } }

    /* ── Header ──────────────────────────── */
    .wpm-head {
      padding: 22px 24px 18px;
      display: flex; gap: 16px; align-items: flex-start;
      border-bottom: 1px solid var(--rule);
    }
    .wpm-av {
      position: relative; flex-shrink: 0;
      width: 72px; height: 72px; border-radius: 999px;
      background: var(--rg-invert-bg, #0A0A0A); color: var(--rg-invert-fg, #fff);
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 600; letter-spacing: -0.01em;
    }
    .wpm-online {
      position: absolute; right: 1px; bottom: 3px;
      width: 14px; height: 14px; border-radius: 999px;
      background: var(--accent); border: 3px solid var(--panel);
    }
    .wpm-head-main { flex: 1; min-width: 0; }

    .wpm-name-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .wpm-name {
      font-size: 22px; font-weight: 600; letter-spacing: -0.02em;
      color: var(--ink); line-height: 1.1;
    }
    .wpm-verified {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 10px; border-radius: 999px;
      background: var(--accent-bg); color: var(--accent-text);
      font-size: 11.5px; font-weight: 600;
    }

    .wpm-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
    .wpm-chip {
      padding: 4px 10px; border-radius: 999px;
      border: 1px solid var(--rule); background: var(--panel);
      font-size: 12px; color: var(--ink);
      display: inline-flex; align-items: center; gap: 5px;
    }
    .wpm-chip-ic { color: var(--muted); display: inline-flex; align-items: center; }
    .wpm-chip--rate {
      border-color: var(--rate-br); background: var(--rate-bg); color: var(--rate-ink);
      font-family: 'Geist Mono', ui-monospace, monospace; font-weight: 500;
    }

    .wpm-available {
      margin-top: 10px; font-size: 12.5px; color: var(--positive);
      display: inline-flex; align-items: center; gap: 5px;
      font-weight: 500;
    }
    .wpm-avail-dot {
      width: 6px; height: 6px; border-radius: 3px;
      background: var(--positive);
      box-shadow: 0 0 6px rgba(21,128,61,0.5);
    }

    .wpm-close {
      flex-shrink: 0; width: 34px; height: 34px; border-radius: 999px;
      border: 1px solid var(--rule); background: var(--soft);
      color: var(--muted); cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      transition: background 0.12s, color 0.12s;
    }
    .wpm-close:hover { background: var(--rule); color: var(--ink); }

    /* ── Trust strip ─────────────────────── */
    .wpm-trust {
      padding: 14px 24px;
      display: grid; grid-template-columns: repeat(4, 1fr);
      border-bottom: 1px solid var(--rule);
      background: var(--rg-soft, #FCFCFA);
    }
    .wpm-trust-cell {
      display: flex; flex-direction: column; gap: 2px;
      padding-left: 12px; padding-right: 12px;
      border-left: 1px solid var(--rule);
    }
    .wpm-trust-cell--first { padding-left: 0; border-left: none; }
    .wpm-trust-k {
      font-size: 10px; color: var(--muted);
      letter-spacing: 0.12em; text-transform: uppercase;
      font-weight: 500;
    }
    .wpm-trust-v {
      font-size: 15px; color: var(--ink); font-weight: 500;
      font-family: 'Geist Mono', ui-monospace, monospace;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.01em; line-height: 1.2;
      display: inline-flex; align-items: center; gap: 4px;
    }
    .wpm-trust-s { font-size: 10.5px; color: var(--sub); }
    .wpm-star { color: var(--accent); font-size: 13px; }

    /* ── Body ────────────────────────────── */
    .wpm-body {
      padding: 18px 24px 20px;
      display: flex; flex-direction: column; gap: 18px;
      overflow-y: auto;
    }
    .wpm-lbl-row {
      display: flex; justify-content: space-between; align-items: baseline;
      margin-bottom: 10px;
    }
    .wpm-lbl {
      font-size: 10.5px; color: var(--muted);
      letter-spacing: 0.14em; text-transform: uppercase;
      font-weight: 500;
    }
    .wpm-lbl-right {
      font-size: 11px; color: var(--sub);
      font-family: 'Geist Mono', ui-monospace, monospace;
    }

    /* Application */
    .wpm-app {
      padding: 16px 18px;
      border: 1px solid var(--rule); border-radius: 12px;
      background: var(--soft);
    }
    .wpm-app-row {
      display: flex; justify-content: space-between; align-items: center;
      gap: 12px;
    }
    .wpm-app-k { font-size: 13.5px; color: var(--ink); }
    .wpm-app-v {
      font-size: 18px; font-weight: 600; color: var(--ink);
      font-family: 'Geist Mono', ui-monospace, monospace;
      font-variant-numeric: tabular-nums; letter-spacing: -0.01em;
      text-align: right;
    }
    .wpm-app-vs {
      display: inline-block;
      font-size: 11px; color: var(--positive);
      font-family: 'Geist', 'Inter', sans-serif;
      font-weight: 500; margin-left: 6px;
    }
    .wpm-app-vs--neg { color: #DC2626; }
    .wpm-quote {
      margin-top: 12px; padding-left: 12px;
      border-left: 2px solid var(--accent);
      font-style: italic; font-size: 13.5px;
      color: var(--rg-ink, #404040); line-height: 1.55;
    }

    /* About */
    .wpm-about { font-size: 14px; color: var(--ink); line-height: 1.55; }

    /* Skills */
    .wpm-skills { display: flex; flex-wrap: wrap; gap: 6px; }
    .wpm-skill {
      padding: 5px 11px; border-radius: 999px;
      border: 1px solid var(--rule); background: var(--panel);
      font-size: 12px; color: var(--ink);
      display: inline-flex; align-items: center; gap: 6px;
    }
    .wpm-skill-dot { width: 5px; height: 5px; border-radius: 3px; }

    /* Reviews */
    .wpm-reviews { display: flex; flex-direction: column; gap: 8px; }
    .wpm-review {
      padding: 12px 14px;
      border: 1px solid var(--rule); border-radius: 10px;
      display: flex; flex-direction: column; gap: 6px;
    }
    .wpm-review-h { display: flex; justify-content: space-between; align-items: center; }
    .wpm-review-stars {
      font-size: 12px; color: var(--ink);
      display: inline-flex; align-items: center; gap: 4px;
    }
    .wpm-review-job { color: var(--muted); margin-left: 4px; }
    .wpm-review-body { font-size: 12.5px; color: var(--rg-ink, #404040); line-height: 1.5; font-style: italic; }

    /* Empty */
    .wpm-empty {
      padding: 14px 16px;
      border: 1px dashed var(--rule); border-radius: 10px;
      font-size: 12.5px; color: var(--muted); line-height: 1.5;
      background: var(--rg-soft, #FCFCFA);
      display: flex; gap: 10px; align-items: flex-start;
    }
    .wpm-empty-ic { flex-shrink: 0; color: var(--sub); margin-top: 1px; display: inline-flex; }
    .wpm-empty-t { color: var(--ink); font-weight: 500; font-size: 13px; }
    .wpm-empty-s { margin-top: 3px; }

    /* ── Footer ──────────────────────────── */
    .wpm-foot {
      padding: 16px 24px;
      border-top: 1px solid var(--rule);
      display: flex; gap: 8px;
      background: var(--panel);
    }
    .wpm-btn-icon {
      padding: 11px 12px; border-radius: 10px;
      border: 1px solid var(--rule); background: var(--panel);
      color: var(--muted); cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      transition: all 0.15s;
    }
    .wpm-btn-icon:hover { background: var(--soft); color: var(--ink); }
    .wpm-btn-icon--on {
      color: var(--accent-text);
      background: var(--accent-bg);
      border-color: #D6EAA0;
    }
    .wpm-btn-icon--on:hover { background: var(--accent-bg); color: var(--accent-text); }

    .wpm-btn-ghost {
      padding: 11px 16px; border-radius: 10px;
      border: 1px solid var(--rule); background: var(--panel);
      font-size: 13px; color: var(--ink);
      cursor: pointer;
      display: inline-flex; align-items: center; gap: 8px;
      transition: all 0.15s;
      font-family: inherit;
    }
    .wpm-btn-ghost:hover {
      background: rgba(220,38,38,0.04);
      color: #DC2626;
      border-color: rgba(220,38,38,0.2);
    }

    .wpm-btn-primary {
      flex: 1;
      padding: 11px 18px; border-radius: 10px;
      border: none; background: var(--rg-invert-bg, #0A0A0A); color: var(--rg-invert-fg, #fff);
      font-size: 13px; font-weight: 500;
      cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      transition: background 0.15s;
      font-family: inherit;
    }
    .wpm-btn-primary:hover { background: var(--rg-invert-hover, #1f1f1f); }

    @media (max-width: 600px) {
      .wpm-root { padding: 0; }
      .wpm-modal {
        max-height: 100vh; height: 100vh;
        border-radius: 0;
        width: 100%;
      }
      .wpm-head { padding: 18px; gap: 12px; }
      .wpm-av { width: 60px; height: 60px; font-size: 18px; }
      .wpm-name { font-size: 18px; }
      .wpm-trust { padding: 12px 18px; }
      .wpm-trust-cell { padding-left: 8px; padding-right: 8px; }
      .wpm-body { padding: 16px 18px 18px; }
      .wpm-foot { padding: 14px 18px; }
    }
  `]
})
export class WorkerProfileModalComponent implements OnInit {
  private api = inject(ApiService);

  workerId = input.required<string>();
  applicationId = input<string | null>(null);
  applicationMessage = input<string | null>(null);
  proposedPrice = input<number | null>(null);
  jobCompleted = input(false);
  preview = input(false);
  close = output<void>();
  accepted = output<string>();
  declined = output<string>();

  profile = signal<WorkerFullProfile | null>(null);
  loading = signal(true);
  saved = signal(false);

  initials = computed(() => {
    const p = this.profile();
    if (!p) return '';
    return ((p.firstName?.[0] ?? '') + (p.lastName?.[0] ?? '')).toLowerCase();
  });

  workerAge = computed(() => {
    const dob = this.profile()?.dateOfBirth;
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  });

  joinedLabel = computed(() => {
    const c = this.profile()?.createdAt;
    if (!c) return '—';
    const d = new Date(c);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });

  vsRatePct = computed(() => {
    const p = this.profile();
    const proposed = this.proposedPrice();
    if (!p || !p.hourlyRate || proposed == null) return null;
    const pct = Math.round(((proposed - p.hourlyRate) / p.hourlyRate) * 100);
    return pct === 0 ? null : pct;
  });

  ngOnInit() {
    this.api.getWorkerPublicProfile(this.workerId()).subscribe({
      next: (p) => { this.profile.set(p as WorkerFullProfile); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  @HostListener('document:keydown.escape')
  onEsc() { this.close.emit(); }

  toggleSave() { this.saved.update((s) => !s); }

  onAccept() {
    const id = this.applicationId();
    if (id) this.accepted.emit(id);
    this.close.emit();
  }

  onDecline() {
    const id = this.applicationId();
    if (id) this.declined.emit(id);
    this.close.emit();
  }

  skillColor(categoryName: string): string {
    const key = (categoryName || '').toLowerCase();
    return CATEGORY_COLORS[key] ?? '#737373';
  }
}
