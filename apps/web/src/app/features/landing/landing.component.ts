import {
  Component, inject, AfterViewInit, OnDestroy, ElementRef, ViewChild, PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="land" #land>

      <!-- ── HERO ──────────────────────────────────────────────── -->
      <section class="hero" #hero>
        <!-- Grid overlay -->
        <div class="grid-overlay"></div>
        <!-- Background glows -->
        <div class="glow glow-1"></div>
        <div class="glow glow-2"></div>
        <div class="glow glow-3"></div>

        <div class="hero-inner">
          <div class="hero-text">
            <div class="eyebrow" #eyebrow>
              <span class="eyebrow-dot"></span>
              AI-powered task marketplace
            </div>

            <h1 class="hero-headline" #headline>
              <span class="line" #line1>Find trusted help.</span>
              <span class="line line-accent" #line2>Get it done.</span>
            </h1>

            <p class="hero-sub" #heroSub>
              Describe any task in plain language — our AI instantly finds verified,
              nearby workers who are ready to help. Fast, safe, and hassle-free.
            </p>

            <div class="hero-ctas" #heroCtas>
              <a routerLink="/register" class="cta-primary">
                Post a job
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </a>
              <a routerLink="/register" class="cta-secondary">Find work</a>
            </div>

            <div class="trust-row" #trustRow>
              <div class="trust-item">
                <span class="trust-num" data-target="1200">0</span>
                <span class="trust-label">Jobs completed</span>
              </div>
              <div class="trust-div"></div>
              <div class="trust-item">
                <span class="trust-num" data-target="480">0</span>
                <span class="trust-label">Verified workers</span>
              </div>
              <div class="trust-div"></div>
              <div class="trust-item">
                <span class="trust-num trust-rating">4.9</span>
                <span class="trust-label">Avg. rating</span>
              </div>
            </div>
          </div>

          <!-- Floating cards visual -->
          <div class="hero-visual" #heroVisual>
            <div class="card-stack">
              <div class="job-card-demo jc-1" #jc1>
                <div class="jc-head">
                  <span class="jc-cat">🔧 Plumbing</span>
                  <span class="jc-urgent">Urgent</span>
                </div>
                <p class="jc-title">Fix leaking pipe under kitchen sink</p>
                <div class="jc-footer">
                  <span class="jc-price">€40–€80</span>
                  <span class="jc-dist">1.2 km away</span>
                </div>
              </div>

              <div class="job-card-demo jc-2" #jc2>
                <div class="jc-head">
                  <span class="jc-cat">🌿 Gardening</span>
                  <span class="jc-badge">3 matches</span>
                </div>
                <p class="jc-title">Weekly lawn mowing & hedge trimming</p>
                <div class="jc-footer">
                  <span class="jc-price">€30–€60</span>
                  <span class="jc-dist">0.8 km away</span>
                </div>
              </div>

              <div class="job-card-demo jc-3" #jc3>
                <div class="jc-head">
                  <span class="jc-cat">🐾 Pet Care</span>
                </div>
                <p class="jc-title">Daily dog walking, 2× per day</p>
                <div class="jc-footer">
                  <span class="jc-price">€20–€35</span>
                  <span class="jc-dist">0.3 km away</span>
                </div>
              </div>

              <!-- AI badge -->
              <div class="ai-badge" #aiBadge>
                <div class="ai-pulse"></div>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                AI matched in 0.4s
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── HOW IT WORKS ──────────────────────────────────────── -->
      <section class="section how" #howSection>
        <div class="section-inner">
          <div class="section-label-row" #howLabel>
            <span class="section-eyebrow">How it works</span>
          </div>
          <h2 class="section-title" #howTitle>Three steps to done</h2>

          <div class="steps" #steps>
            <div class="step" #step>
              <div class="step-num">01</div>
              <div class="step-icon">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <h3 class="step-title">Describe your task</h3>
              <p class="step-desc">Type one sentence about what you need — our AI handles the rest: category, pricing, urgency.</p>
            </div>

            <div class="step-arrow" #stepArrow>
              <svg width="32" height="32" fill="none" stroke="#1e3a5f" stroke-width="1.5" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </div>

            <div class="step" #step>
              <div class="step-num">02</div>
              <div class="step-icon">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
              </div>
              <h3 class="step-title">AI finds your match</h3>
              <p class="step-desc">We scan nearby verified workers and rank them by skill, distance, rating, and availability.</p>
            </div>

            <div class="step-arrow" #stepArrow>
              <svg width="32" height="32" fill="none" stroke="#1e3a5f" stroke-width="1.5" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </div>

            <div class="step" #step>
              <div class="step-num">03</div>
              <div class="step-icon">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h3 class="step-title">Hire, chat, pay</h3>
              <p class="step-desc">Pick your worker, coordinate via chat, and pay securely only when the job is done.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ── CATEGORIES ────────────────────────────────────────── -->
      <section class="section cats" #catsSection>
        <div class="section-inner">
          <div class="section-label-row" #catsLabel>
            <span class="section-eyebrow">What we cover</span>
          </div>
          <h2 class="section-title" #catsTitle>Any task, any time</h2>

          <div class="cat-grid" #catGrid>
            @for (cat of categories; track cat.name) {
              <div class="cat-card">
                <span class="cat-emoji">{{ cat.icon }}</span>
                <span class="cat-name">{{ cat.name }}</span>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- ── WORKER CTA ─────────────────────────────────────────── -->
      <section class="section worker-cta" #workerSection>
        <div class="section-inner worker-cta-inner">
          <div class="worker-text" #workerText>
            <span class="section-eyebrow eyebrow-blue">For workers</span>
            <h2 class="worker-title">Turn your skills into income</h2>
            <p class="worker-sub">Join hundreds of verified workers already earning on RobosGig. Set your own hours, pick your jobs, and get paid fast.</p>
            <ul class="worker-perks">
              <li #perk>
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                Free to join — no subscription required
              </li>
              <li #perk>
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                AI matches you with nearby jobs automatically
              </li>
              <li #perk>
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                Build your reputation with verified reviews
              </li>
              <li #perk>
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                Upgrade to Pro for lower fees & priority placement
              </li>
            </ul>
            <a routerLink="/register" class="cta-primary">
              Start earning today
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
          </div>

          <div class="worker-graphic" #workerGraphic>
            <div class="earning-card">
              <p class="ec-label">This week</p>
              <p class="ec-amount">€ <span class="ec-num">347</span></p>
              <div class="ec-bars">
                <div class="ec-bar" style="height:40%"></div>
                <div class="ec-bar" style="height:65%"></div>
                <div class="ec-bar" style="height:50%"></div>
                <div class="ec-bar" style="height:80%"></div>
                <div class="ec-bar" style="height:60%"></div>
                <div class="ec-bar ec-bar-active" style="height:90%"></div>
                <div class="ec-bar" style="height:55%"></div>
              </div>
              <div class="ec-jobs">
                <span>6 jobs</span>
                <span class="ec-up">↑ 24% vs last week</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── FINAL CTA ──────────────────────────────────────────── -->
      <section class="section final-cta" #finalSection>
        <div class="final-glow"></div>
        <div class="section-inner final-inner">
          <h2 class="final-title" #finalTitle>Ready to get started?</h2>
          <p class="final-sub" #finalSub>Join thousands of people already using RobosGig every day.</p>
          <div class="final-btns" #finalBtns>
            <a routerLink="/register" class="cta-primary cta-large">Post your first job — it's free</a>
            <a routerLink="/login" class="cta-ghost">Sign in</a>
          </div>
        </div>
      </section>

      <!-- ── FOOTER ─────────────────────────────────────────────── -->
      <footer class="footer">
        <div class="footer-inner">
          <div class="footer-brand">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none"><rect width="22" height="22" rx="6" fill="#0ea5e9"/><path d="M12.5 4L7 12h5l-1.5 6L17 10h-5l1.5-6z" fill="white"/></svg>
            <span>RobosGig</span>
          </div>
          <p class="footer-copy">© 2026 RobosGig. All rights reserved.</p>
          <div class="footer-links">
            <a routerLink="/pricing">Pricing</a>
            <a routerLink="/login">Sign in</a>
            <a routerLink="/register">Get started</a>
          </div>
        </div>
      </footer>

    </div>
  `,
  styles: [`
    /* ── Reset & base ──────────────────────────────── */
    :host { display: block; }
    .land { overflow-x: hidden; background: #060d1a; color: #e2e8f0; }

    /* ── HERO ──────────────────────────────────────── */
    .hero {
      min-height: 100vh;
      display: flex; align-items: center;
      position: relative; overflow: hidden;
      padding: 5rem 1.5rem 4rem;
      background: #060d1a;
    }

    /* Grid overlay */
    .grid-overlay {
      position: absolute; inset: 0; pointer-events: none;
      background-image:
        linear-gradient(rgba(14,165,233,0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(14,165,233,0.06) 1px, transparent 1px);
      background-size: 60px 60px;
      mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 100%);
    }

    /* Glows */
    .glow {
      position: absolute; border-radius: 50%;
      filter: blur(100px); pointer-events: none;
    }
    .glow-1 { width: 700px; height: 500px; background: rgba(14,165,233,0.18); top: -150px; right: -100px; }
    .glow-2 { width: 500px; height: 400px; background: rgba(56,189,248,0.1); bottom: -80px; left: -100px; }
    .glow-3 { width: 350px; height: 350px; background: rgba(6,182,212,0.08); top: 40%; left: 35%; }

    .hero-inner {
      max-width: 1160px; margin: 0 auto; width: 100%;
      display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center;
      position: relative; z-index: 1;
    }

    /* Eyebrow */
    .eyebrow {
      display: inline-flex; align-items: center; gap: 0.5rem;
      font-size: 0.78rem; font-weight: 600; color: #38bdf8;
      text-transform: uppercase; letter-spacing: 0.1em;
      margin-bottom: 1.5rem; opacity: 0;
    }
    .eyebrow-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #38bdf8;
      box-shadow: 0 0 8px #38bdf8;
      animation: pulse-dot 2s ease-in-out infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { transform: scale(1); opacity: 1; box-shadow: 0 0 8px #38bdf8; }
      50%       { transform: scale(1.5); opacity: 0.5; box-shadow: 0 0 16px #38bdf8; }
    }

    /* Headline */
    .hero-headline {
      font-size: clamp(2.6rem, 5vw, 4.2rem);
      font-weight: 800; line-height: 1.06;
      letter-spacing: -0.03em; color: #f0f9ff;
      margin: 0 0 1.5rem; display: flex; flex-direction: column;
    }
    .line { display: block; overflow: hidden; }
    .line-accent {
      background: linear-gradient(90deg, #38bdf8, #0ea5e9, #818cf8);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-sub {
      font-size: 1.05rem; color: #7dd3fc; line-height: 1.75;
      max-width: 480px; margin: 0 0 2.5rem; opacity: 0;
    }

    /* CTAs */
    .hero-ctas { display: flex; gap: 0.875rem; flex-wrap: wrap; opacity: 0; }
    .cta-primary {
      display: inline-flex; align-items: center; gap: 0.5rem;
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      color: #fff; text-decoration: none;
      font-size: 0.9rem; font-weight: 600;
      padding: 0.75rem 1.5rem; border-radius: 99px;
      transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
      box-shadow: 0 4px 20px rgba(14,165,233,0.4);
    }
    .cta-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(14,165,233,0.55);
      filter: brightness(1.1);
    }
    .cta-secondary {
      display: inline-flex; align-items: center;
      color: #bae6fd; text-decoration: none; font-size: 0.9rem; font-weight: 600;
      padding: 0.75rem 1.5rem; border-radius: 99px;
      border: 1.5px solid rgba(56,189,248,0.3);
      transition: border-color 0.2s, background 0.2s, transform 0.2s;
      backdrop-filter: blur(4px);
    }
    .cta-secondary:hover {
      border-color: #38bdf8; background: rgba(56,189,248,0.08);
      transform: translateY(-2px);
    }
    .cta-large { font-size: 1rem; padding: 0.9rem 2rem; }
    .cta-ghost {
      display: inline-flex; align-items: center;
      color: rgba(186,230,253,0.7); text-decoration: none; font-size: 0.9rem; font-weight: 500;
      padding: 0.75rem 1.5rem; border-radius: 99px;
      border: 1.5px solid rgba(56,189,248,0.2);
      transition: border-color 0.2s, color 0.2s;
    }
    .cta-ghost:hover { border-color: rgba(56,189,248,0.5); color: #bae6fd; }

    /* Trust row */
    .trust-row { display: flex; align-items: center; gap: 1.5rem; margin-top: 2.5rem; opacity: 0; }
    .trust-item { display: flex; flex-direction: column; gap: 0.2rem; }
    .trust-num {
      font-size: 1.5rem; font-weight: 800; color: #f0f9ff; letter-spacing: -0.03em;
    }
    .trust-num::after { content: '+'; font-size: 1rem; color: #38bdf8; }
    .trust-rating::after { content: '★'; font-size: 0.9rem; color: #fbbf24; }
    .trust-label { font-size: 0.72rem; color: #64748b; font-weight: 500; }
    .trust-div { width: 1px; height: 36px; background: rgba(56,189,248,0.15); }

    /* Hero visual */
    .hero-visual { position: relative; opacity: 0; }
    .card-stack { position: relative; height: 380px; }

    .job-card-demo {
      position: absolute;
      background: rgba(11,25,50,0.85);
      border: 1px solid rgba(56,189,248,0.2);
      border-radius: 16px;
      padding: 1.1rem 1.25rem; width: 280px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(56,189,248,0.1);
      backdrop-filter: blur(12px);
    }
    .jc-1 { top: 0; left: 40px; z-index: 3; border-color: rgba(56,189,248,0.35); box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(56,189,248,0.1), inset 0 1px 0 rgba(56,189,248,0.15); }
    .jc-2 { top: 110px; left: 0; z-index: 2; }
    .jc-3 { top: 220px; left: 60px; z-index: 1; }

    .jc-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; }
    .jc-cat { font-size: 0.75rem; font-weight: 600; color: #94a3b8; }
    .jc-urgent { font-size: 0.68rem; font-weight: 700; background: rgba(239,68,68,0.15); color: #f87171; padding: 0.15rem 0.5rem; border-radius: 99px; border: 1px solid rgba(239,68,68,0.25); }
    .jc-badge { font-size: 0.68rem; font-weight: 700; background: rgba(14,165,233,0.15); color: #38bdf8; padding: 0.15rem 0.5rem; border-radius: 99px; border: 1px solid rgba(14,165,233,0.25); }
    .jc-title { font-size: 0.875rem; font-weight: 600; color: #e2e8f0; margin: 0 0 0.75rem; line-height: 1.4; }
    .jc-footer { display: flex; justify-content: space-between; align-items: center; }
    .jc-price { font-size: 0.82rem; font-weight: 700; color: #38bdf8; }
    .jc-dist { font-size: 0.72rem; color: #475569; }

    .ai-badge {
      position: absolute; bottom: 20px; right: -10px;
      display: inline-flex; align-items: center; gap: 0.5rem;
      background: linear-gradient(135deg, #0c2340, #0f3460);
      border: 1px solid rgba(56,189,248,0.4);
      color: #bae6fd;
      font-size: 0.75rem; font-weight: 600;
      padding: 0.5rem 0.875rem; border-radius: 99px;
      box-shadow: 0 4px 20px rgba(14,165,233,0.3);
      z-index: 10;
    }
    .ai-pulse {
      width: 8px; height: 8px; border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 8px #4ade80;
      animation: pulse-dot 1.5s ease-in-out infinite;
    }

    /* ── SECTIONS ───────────────────────────────────── */
    .section { padding: 6rem 1.5rem; }
    .section-inner { max-width: 1100px; margin: 0 auto; }
    .section-label-row { margin-bottom: 0.75rem; }
    .section-eyebrow {
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.12em; color: #38bdf8;
    }
    .section-title {
      font-size: clamp(1.8rem, 3vw, 2.75rem); font-weight: 800;
      letter-spacing: -0.03em; color: #f0f9ff; margin: 0 0 3rem;
    }

    /* ── HOW IT WORKS ───────────────────────────────── */
    .how {
      background: #080f1e;
      border-top: 1px solid rgba(56,189,248,0.08);
      border-bottom: 1px solid rgba(56,189,248,0.08);
    }
    .steps {
      display: flex; align-items: flex-start;
      justify-content: space-between; flex-wrap: wrap; gap: 1rem;
    }
    .step {
      flex: 1; min-width: 220px; max-width: 300px;
      display: flex; flex-direction: column; gap: 1rem;
    }
    .step-num {
      font-size: 0.7rem; font-weight: 800; color: #1e3a5f;
      letter-spacing: 0.1em;
    }
    .step-icon {
      width: 52px; height: 52px;
      background: rgba(14,165,233,0.1);
      border: 1px solid rgba(56,189,248,0.2);
      border-radius: 14px; display: flex; align-items: center; justify-content: center;
      color: #38bdf8;
    }
    .step-title { font-size: 1.05rem; font-weight: 700; color: #f0f9ff; margin: 0; }
    .step-desc { font-size: 0.875rem; color: #64748b; line-height: 1.65; margin: 0; }
    .step-arrow { display: flex; align-items: center; padding-top: 1.5rem; flex-shrink: 0; }

    /* ── CATEGORIES ─────────────────────────────────── */
    .cats { background: #060d1a; }
    .cat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.875rem;
    }
    .cat-card {
      display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
      background: rgba(11,25,50,0.7);
      border: 1px solid rgba(56,189,248,0.1);
      border-radius: 14px;
      padding: 1.25rem 1rem; cursor: default;
      transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
      backdrop-filter: blur(4px);
    }
    .cat-card:hover {
      border-color: rgba(56,189,248,0.4);
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(14,165,233,0.15);
    }
    .cat-emoji { font-size: 1.75rem; }
    .cat-name { font-size: 0.78rem; font-weight: 600; color: #94a3b8; text-align: center; }

    /* ── WORKER CTA ──────────────────────────────────── */
    .worker-cta {
      background: #080f1e;
      border-top: 1px solid rgba(56,189,248,0.08);
      position: relative; overflow: hidden;
    }
    .worker-cta-inner {
      display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center;
      position: relative; z-index: 1;
    }
    .eyebrow-blue { color: #38bdf8; }
    .worker-title { font-size: clamp(1.8rem, 3vw, 2.5rem); font-weight: 800; color: #f0f9ff; margin: 0.5rem 0 1rem; letter-spacing: -0.03em; }
    .worker-sub { font-size: 0.95rem; color: #64748b; line-height: 1.7; margin: 0 0 1.5rem; }
    .worker-perks { list-style: none; padding: 0; margin: 0 0 2rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .worker-perks li { display: flex; align-items: center; gap: 0.625rem; font-size: 0.875rem; color: #94a3b8; }
    .worker-perks li svg { color: #4ade80; flex-shrink: 0; }

    /* Earning card */
    .worker-graphic { display: flex; justify-content: center; }
    .earning-card {
      background: rgba(11,25,50,0.9);
      border: 1px solid rgba(56,189,248,0.2);
      border-radius: 20px; padding: 1.75rem;
      width: 260px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(56,189,248,0.05);
      backdrop-filter: blur(12px);
    }
    .ec-label { font-size: 0.75rem; font-weight: 600; color: #475569; margin: 0 0 0.4rem; text-transform: uppercase; letter-spacing: 0.08em; }
    .ec-amount { font-size: 2.25rem; font-weight: 800; color: #f0f9ff; margin: 0 0 1.5rem; letter-spacing: -0.04em; }
    .ec-bars { display: flex; align-items: flex-end; gap: 0.4rem; height: 80px; margin-bottom: 1rem; }
    .ec-bar { flex: 1; background: rgba(56,189,248,0.12); border-radius: 4px; }
    .ec-bar-active {
      background: linear-gradient(to top, #0284c7, #38bdf8);
      box-shadow: 0 0 12px rgba(56,189,248,0.4);
    }
    .ec-jobs { display: flex; justify-content: space-between; font-size: 0.78rem; color: #475569; }
    .ec-up { color: #4ade80; font-weight: 600; }

    /* ── FINAL CTA ───────────────────────────────────── */
    .final-cta {
      background: #060d1a;
      text-align: center;
      position: relative; overflow: hidden;
      border-top: 1px solid rgba(56,189,248,0.08);
    }
    .final-glow {
      position: absolute; inset: 0; pointer-events: none;
      background: radial-gradient(ellipse 70% 60% at 50% 100%, rgba(14,165,233,0.18) 0%, transparent 70%);
    }
    .final-inner { max-width: 600px; position: relative; z-index: 1; }
    .final-title {
      font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; color: #f0f9ff;
      margin: 0 0 1rem; letter-spacing: -0.03em;
    }
    .final-sub { font-size: 1rem; color: #64748b; margin: 0 0 2.5rem; }
    .final-btns { display: flex; flex-direction: column; align-items: center; gap: 1rem; }

    /* ── FOOTER ─────────────────────────────────────── */
    .footer {
      background: #040a14;
      padding: 2rem 1.5rem;
      border-top: 1px solid rgba(56,189,248,0.08);
    }
    .footer-inner {
      max-width: 1100px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;
    }
    .footer-brand { display: flex; align-items: center; gap: 0.5rem; color: #f0f9ff; font-weight: 700; font-size: 0.9rem; }
    .footer-copy { font-size: 0.78rem; color: #1e3a5f; margin: 0; }
    .footer-links { display: flex; gap: 1.5rem; }
    .footer-links a { font-size: 0.78rem; color: #334155; text-decoration: none; transition: color 0.15s; }
    .footer-links a:hover { color: #38bdf8; }

    /* ── Responsive ─────────────────────────────────── */
    @media (max-width: 768px) {
      .hero-inner { grid-template-columns: 1fr; gap: 3rem; }
      .hero-visual { display: none; }
      .worker-cta-inner { grid-template-columns: 1fr; gap: 2rem; }
      .worker-graphic { display: none; }
      .steps { flex-direction: column; }
      .step-arrow { display: none; }
      .step { max-width: 100%; }
    }
  `],
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  auth = inject(AuthService);

  @ViewChild('land') land!: ElementRef;
  @ViewChild('eyebrow') eyebrow!: ElementRef;
  @ViewChild('line1') line1!: ElementRef;
  @ViewChild('line2') line2!: ElementRef;
  @ViewChild('heroSub') heroSub!: ElementRef;
  @ViewChild('heroCtas') heroCtas!: ElementRef;
  @ViewChild('trustRow') trustRow!: ElementRef;
  @ViewChild('heroVisual') heroVisual!: ElementRef;
  @ViewChild('jc1') jc1!: ElementRef;
  @ViewChild('jc2') jc2!: ElementRef;
  @ViewChild('jc3') jc3!: ElementRef;
  @ViewChild('aiBadge') aiBadge!: ElementRef;

  private ctx: any;

  categories = [
    { icon: '🔧', name: 'Plumbing' },
    { icon: '⚡', name: 'Electrical' },
    { icon: '🌿', name: 'Gardening' },
    { icon: '🧹', name: 'Cleaning' },
    { icon: '🐾', name: 'Pet Care' },
    { icon: '🚚', name: 'Moving' },
    { icon: '🎨', name: 'Painting' },
    { icon: '🪵', name: 'Carpentry' },
    { icon: '❄️', name: 'HVAC' },
    { icon: '📦', name: 'Assembly' },
    { icon: '🏗️', name: 'Renovation' },
    { icon: '🔒', name: 'Locksmith' },
  ];

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Redirect logged-in users
    if (this.auth.isLoggedIn()) {
      if (this.auth.isWorker()) {
        this.router.navigate(['/worker/jobs']);
      } else {
        this.router.navigate(['/post']);
      }
      return;
    }

    import('gsap').then(({ gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);
        this.ctx = gsap.context(() => this.initAnimations(gsap), this.land.nativeElement);
      });
    });
  }

  private initAnimations(gsap: any) {
    const ease = 'power3.out';

    // ── Hero sequence ─────────────────────────────────────────────
    const tl = gsap.timeline({ defaults: { ease, duration: 0.9 } });

    tl.fromTo(this.eyebrow.nativeElement,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0 }
    )
    .fromTo(this.line1.nativeElement,
      { y: '110%', opacity: 0 },
      { y: '0%', opacity: 1 }, '-=0.5'
    )
    .fromTo(this.line2.nativeElement,
      { y: '110%', opacity: 0 },
      { y: '0%', opacity: 1 }, '-=0.7'
    )
    .fromTo(this.heroSub.nativeElement,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.8 }, '-=0.5'
    )
    .fromTo(this.heroCtas.nativeElement,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0 }, '-=0.6'
    )
    .fromTo(this.trustRow.nativeElement,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0 }, '-=0.6'
    )
    .fromTo(this.heroVisual.nativeElement,
      { opacity: 0 },
      { opacity: 1, duration: 0.5 }, '-=1'
    )
    .fromTo([this.jc1.nativeElement, this.jc2.nativeElement, this.jc3.nativeElement],
      { opacity: 0, y: 40, scale: 0.92 },
      { opacity: 1, y: 0, scale: 1, stagger: 0.12, ease: 'back.out(1.4)' }, '-=0.3'
    )
    .fromTo(this.aiBadge.nativeElement,
      { opacity: 0, scale: 0.8, y: 10 },
      { opacity: 1, scale: 1, y: 0, ease: 'back.out(2)' }, '-=0.2'
    );

    // Floating cards loop
    gsap.to(this.jc1.nativeElement, { y: -10, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0 });
    gsap.to(this.jc2.nativeElement, { y: -7, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.5 });
    gsap.to(this.jc3.nativeElement, { y: -12, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1 });
    gsap.to(this.aiBadge.nativeElement, { y: -5, duration: 2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.3 });

    // Count-up for trust numbers
    document.querySelectorAll('.trust-num[data-target]').forEach((el: any) => {
      const target = parseInt(el.dataset['target']);
      gsap.to({ val: 0 }, {
        val: target, duration: 2, ease: 'power2.out', delay: 1,
        onUpdate: function() { el.textContent = Math.round(this.targets()[0].val).toString(); },
      });
    });

    // ── ScrollTrigger sections ─────────────────────────────────────

    // Steps
    gsap.fromTo('.step',
      { opacity: 0, y: 50 },
      {
        opacity: 1, y: 0, duration: 0.7, stagger: 0.15, ease,
        scrollTrigger: { trigger: '.how', start: 'top 75%' },
      }
    );
    gsap.fromTo('.step-arrow',
      { opacity: 0, x: -10 },
      {
        opacity: 1, x: 0, duration: 0.5, stagger: 0.2,
        scrollTrigger: { trigger: '.how', start: 'top 70%' },
      }
    );

    // Section titles
    gsap.utils.toArray('.section-title').forEach((el: any) => {
      gsap.fromTo(el,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease, scrollTrigger: { trigger: el, start: 'top 85%' } }
      );
    });
    gsap.utils.toArray('.section-eyebrow').forEach((el: any) => {
      gsap.fromTo(el,
        { opacity: 0, x: -15 },
        { opacity: 1, x: 0, duration: 0.6, ease, scrollTrigger: { trigger: el, start: 'top 88%' } }
      );
    });

    // Category cards
    gsap.fromTo('.cat-card',
      { opacity: 0, y: 30, scale: 0.95 },
      {
        opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.04, ease: 'back.out(1.2)',
        scrollTrigger: { trigger: '.cat-grid', start: 'top 80%' },
      }
    );

    // Worker section
    gsap.fromTo('.worker-text',
      { opacity: 0, x: -50 },
      {
        opacity: 1, x: 0, duration: 0.9, ease,
        scrollTrigger: { trigger: '.worker-cta', start: 'top 75%' },
      }
    );
    gsap.fromTo('.earning-card',
      { opacity: 0, x: 50, y: 20 },
      {
        opacity: 1, x: 0, y: 0, duration: 0.9, ease: 'back.out(1.3)',
        scrollTrigger: { trigger: '.worker-cta', start: 'top 75%' },
      }
    );
    gsap.fromTo('.worker-perks li',
      { opacity: 0, x: -20 },
      {
        opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease,
        scrollTrigger: { trigger: '.worker-perks', start: 'top 80%' },
      }
    );

    // Final CTA
    gsap.fromTo('.final-title',
      { opacity: 0, y: 40, scale: 0.96 },
      {
        opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.2)',
        scrollTrigger: { trigger: '.final-cta', start: 'top 80%' },
      }
    );
    gsap.fromTo('.final-sub',
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0, duration: 0.7, ease,
        scrollTrigger: { trigger: '.final-cta', start: 'top 78%' },
      }
    );
    gsap.fromTo('.final-btns',
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0, duration: 0.7, ease,
        scrollTrigger: { trigger: '.final-cta', start: 'top 75%' },
      }
    );

    // Glow parallax
    gsap.to('.glow-1', {
      y: -140, ease: 'none',
      scrollTrigger: { trigger: '.hero', scrub: 1.5 },
    });
    gsap.to('.glow-2', {
      y: -80, ease: 'none',
      scrollTrigger: { trigger: '.hero', scrub: 2 },
    });
  }

  ngOnDestroy() {
    if (this.ctx) this.ctx.revert();
    import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
      ScrollTrigger.getAll().forEach((t: any) => t.kill());
    });
  }
}
