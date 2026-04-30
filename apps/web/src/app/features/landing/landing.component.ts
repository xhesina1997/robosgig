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

      <!-- ── NAV ──────────────────────────────────────────────── -->
      <nav class="nav">
        <div class="nav-inner">
          <a class="nav-brand" routerLink="/">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect width="22" height="22" rx="6" fill="#18181b"/><path d="M12.5 4L7 12h5l-1.5 6L17 10h-5l1.5-6z" fill="white"/></svg>
            RobosGig
          </a>
          <div class="nav-links">
            <a class="nav-link" routerLink="/pricing">Pricing</a>
            <a class="nav-link" routerLink="/login">Sign in</a>
          </div>
          <a class="nav-cta" routerLink="/register">Get started</a>
        </div>
      </nav>

      <!-- ── HERO ──────────────────────────────────────────────── -->
      <section class="hero" #hero>
        <div class="hero-bg-mesh"></div>
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
              nearby workers who are ready to help. Fast, safe, hassle-free.
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

              <div class="ai-badge" #aiBadge>
                <div class="ai-pulse"></div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                AI matched in 0.4s
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── LOGOS / TRUST STRIP ───────────────────────────────── -->
      <div class="trust-strip">
        <div class="trust-strip-inner">
          <span class="ts-label">Trusted by people across</span>
          @for (city of cities; track city) {
            <span class="ts-city">{{ city }}</span>
          }
        </div>
      </div>

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
                <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <h3 class="step-title">Describe your task</h3>
              <p class="step-desc">Type one sentence about what you need — our AI handles category, pricing, and urgency automatically.</p>
            </div>

            <div class="step-arrow" #stepArrow>
              <svg width="28" height="28" fill="none" stroke="#d1d5db" stroke-width="1.5" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </div>

            <div class="step" #step>
              <div class="step-num">02</div>
              <div class="step-icon">
                <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              </div>
              <h3 class="step-title">AI finds your match</h3>
              <p class="step-desc">We scan nearby verified workers and rank them by skill, distance, rating, and availability.</p>
            </div>

            <div class="step-arrow" #stepArrow>
              <svg width="28" height="28" fill="none" stroke="#d1d5db" stroke-width="1.5" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </div>

            <div class="step" #step>
              <div class="step-num">03</div>
              <div class="step-icon">
                <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
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

      <!-- ── STATS DARK BANNER ─────────────────────────────────── -->
      <section class="stats-banner">
        <div class="stats-inner">
          <div class="stat-block">
            <span class="stat-num">1,200+</span>
            <span class="stat-label">Jobs completed</span>
          </div>
          <div class="stat-sep"></div>
          <div class="stat-block">
            <span class="stat-num">480+</span>
            <span class="stat-label">Verified workers</span>
          </div>
          <div class="stat-sep"></div>
          <div class="stat-block">
            <span class="stat-num">4.9 ★</span>
            <span class="stat-label">Average rating</span>
          </div>
          <div class="stat-sep"></div>
          <div class="stat-block">
            <span class="stat-num">50+</span>
            <span class="stat-label">Cities covered</span>
          </div>
        </div>
      </section>

      <!-- ── WORKER CTA ─────────────────────────────────────────── -->
      <section class="section worker-cta" #workerSection>
        <div class="section-inner worker-cta-inner">
          <div class="worker-text" #workerText>
            <span class="section-eyebrow eyebrow-green">For workers</span>
            <h2 class="worker-title">Turn your skills into income</h2>
            <p class="worker-sub">Join hundreds of verified workers already earning on RobosGig. Set your own hours, pick your jobs, and get paid fast.</p>
            <ul class="worker-perks">
              <li #perk>
                <div class="perk-check"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
                Free to join — no subscription required
              </li>
              <li #perk>
                <div class="perk-check"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
                AI matches you with nearby jobs automatically
              </li>
              <li #perk>
                <div class="perk-check"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
                Build your reputation with verified reviews
              </li>
              <li #perk>
                <div class="perk-check"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
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
              <div class="ec-top">
                <div>
                  <p class="ec-label">This week's earnings</p>
                  <p class="ec-amount">€<span class="ec-num">347</span></p>
                </div>
                <span class="ec-badge">↑ 24%</span>
              </div>
              <div class="ec-bars">
                <div class="ec-bar" style="height:40%"></div>
                <div class="ec-bar" style="height:65%"></div>
                <div class="ec-bar" style="height:50%"></div>
                <div class="ec-bar" style="height:80%"></div>
                <div class="ec-bar" style="height:60%"></div>
                <div class="ec-bar ec-bar-active" style="height:90%"></div>
                <div class="ec-bar" style="height:55%"></div>
              </div>
              <div class="ec-footer">
                <span class="ec-jobs-label">6 jobs completed</span>
                <span class="ec-week">This week</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── FINAL CTA ──────────────────────────────────────────── -->
      <section class="section final-cta" #finalSection>
        <div class="final-glow"></div>
        <div class="section-inner final-inner">
          <div class="final-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
            Join today — it's free
          </div>
          <h2 class="final-title" #finalTitle>Ready to get started?</h2>
          <p class="final-sub" #finalSub>Thousands of people already use RobosGig every day to get things done.</p>
          <div class="final-btns" #finalBtns>
            <a routerLink="/register" class="cta-primary cta-large">Post your first job</a>
            <a routerLink="/login" class="cta-ghost">Sign in →</a>
          </div>
        </div>
      </section>

      <!-- ── FOOTER ─────────────────────────────────────────────── -->
      <footer class="footer">
        <div class="footer-inner">
          <div class="footer-top">
            <div class="footer-brand">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect width="22" height="22" rx="6" fill="#fff"/><path d="M12.5 4L7 12h5l-1.5 6L17 10h-5l1.5-6z" fill="#18181b"/></svg>
              <span>RobosGig</span>
            </div>
            <p class="footer-tagline">AI-powered task marketplace</p>
          </div>
          <div class="footer-bottom">
            <p class="footer-copy">© 2026 RobosGig. All rights reserved.</p>
            <div class="footer-links">
              <a routerLink="/pricing">Pricing</a>
              <a routerLink="/terms">Terms</a>
              <a routerLink="/login">Sign in</a>
              <a routerLink="/register">Get started</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  `,
  styles: [`
    :host { display: block; }
    * { box-sizing: border-box; }
    .land { overflow-x: hidden; background: #fff; color: #18181b; font-family: inherit; }

    /* ── NAV ─────────────────────────────────────────── */
    .nav {
      position: sticky; top: 0; z-index: 100;
      background: rgba(255,255,255,0.9); backdrop-filter: blur(12px);
      border-bottom: 1px solid #f0f0f0;
    }
    .nav-inner {
      max-width: 1160px; margin: 0 auto; padding: 0 1.5rem;
      display: flex; align-items: center; height: 60px; gap: 2rem;
    }
    .nav-brand {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 1rem; font-weight: 800; color: #18181b;
      text-decoration: none; letter-spacing: -0.02em; flex-shrink: 0;
    }
    .nav-links { display: flex; gap: 0.25rem; margin-left: auto; }
    .nav-link {
      color: #52525b; font-size: 0.875rem; font-weight: 500;
      text-decoration: none; padding: 0.4rem 0.75rem; border-radius: 8px;
      transition: background 0.15s, color 0.15s;
    }
    .nav-link:hover { background: #f4f4f5; color: #18181b; }
    .nav-cta {
      display: inline-flex; align-items: center;
      background: #18181b; color: #fff; text-decoration: none;
      font-size: 0.85rem; font-weight: 600;
      padding: 0.5rem 1.1rem; border-radius: 8px;
      transition: opacity 0.15s; flex-shrink: 0;
    }
    .nav-cta:hover { opacity: 0.85; }

    /* ── HERO ─────────────────────────────────────────── */
    .hero {
      min-height: calc(100vh - 60px);
      display: flex; align-items: center;
      position: relative; overflow: hidden;
      padding: 5rem 1.5rem 4rem;
      background: #fff;
    }
    .hero-bg-mesh {
      position: absolute; inset: 0; pointer-events: none;
      background:
        radial-gradient(ellipse 70% 50% at 80% 20%, rgba(99,102,241,0.06) 0%, transparent 60%),
        radial-gradient(ellipse 50% 40% at 10% 80%, rgba(14,165,233,0.05) 0%, transparent 60%);
    }
    .hero-inner {
      max-width: 1160px; margin: 0 auto; width: 100%;
      display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center;
      position: relative; z-index: 1;
    }

    .eyebrow {
      display: inline-flex; align-items: center; gap: 0.5rem;
      font-size: 0.76rem; font-weight: 700; color: #0ea5e9;
      text-transform: uppercase; letter-spacing: 0.1em;
      margin-bottom: 1.25rem; opacity: 0;
    }
    .eyebrow-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #0ea5e9;
      animation: pulse-dot 2s ease-in-out infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { transform: scale(1); opacity: 1; }
      50%       { transform: scale(1.6); opacity: 0.5; }
    }

    .hero-headline {
      font-size: clamp(2.8rem, 5.5vw, 4.4rem);
      font-weight: 900; line-height: 1.05;
      letter-spacing: -0.04em; color: #18181b;
      margin: 0 0 1.5rem; display: flex; flex-direction: column;
    }
    .line { display: block; overflow: hidden; }
    .line-accent {
      background: linear-gradient(90deg, #0ea5e9 0%, #6366f1 60%, #8b5cf6 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-sub {
      font-size: 1.05rem; color: #71717a; line-height: 1.75;
      max-width: 460px; margin: 0 0 2.5rem; opacity: 0;
    }

    .hero-ctas { display: flex; gap: 0.75rem; flex-wrap: wrap; opacity: 0; }
    .cta-primary {
      display: inline-flex; align-items: center; gap: 0.5rem;
      background: #18181b; color: #fff; text-decoration: none;
      font-size: 0.9rem; font-weight: 600;
      padding: 0.75rem 1.5rem; border-radius: 10px;
      transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    }
    .cta-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.18);
    }
    .cta-secondary {
      display: inline-flex; align-items: center;
      color: #18181b; text-decoration: none; font-size: 0.9rem; font-weight: 600;
      padding: 0.75rem 1.5rem; border-radius: 10px;
      border: 1.5px solid #e4e4e7;
      transition: border-color 0.15s, background 0.15s, transform 0.18s;
    }
    .cta-secondary:hover { border-color: #18181b; background: #fafafa; transform: translateY(-2px); }
    .cta-large { font-size: 1rem; padding: 0.875rem 2rem; }
    .cta-ghost {
      display: inline-flex; align-items: center;
      color: #a1a1aa; text-decoration: none; font-size: 0.9rem; font-weight: 500;
      padding: 0.75rem 1.25rem; border-radius: 10px;
      transition: color 0.15s;
    }
    .cta-ghost:hover { color: #fff; }

    .trust-row { display: flex; align-items: center; gap: 1.5rem; margin-top: 2.5rem; opacity: 0; }
    .trust-item { display: flex; flex-direction: column; gap: 0.15rem; }
    .trust-num { font-size: 1.4rem; font-weight: 800; color: #18181b; letter-spacing: -0.03em; }
    .trust-num::after { content: '+'; font-size: 0.9rem; color: #0ea5e9; }
    .trust-rating::after { content: ' ★'; font-size: 0.9rem; color: #f59e0b; }
    .trust-label { font-size: 0.7rem; color: #a1a1aa; font-weight: 500; }
    .trust-div { width: 1px; height: 32px; background: #e4e4e7; }

    /* Hero visual */
    .hero-visual { position: relative; opacity: 0; }
    .card-stack { position: relative; height: 380px; }
    .job-card-demo {
      position: absolute;
      background: #fff;
      border: 1.5px solid #e4e4e7;
      border-radius: 16px;
      padding: 1.1rem 1.25rem; width: 290px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .jc-1 { top: 0; left: 40px; z-index: 3; border-color: #c7d2fe; box-shadow: 0 8px 32px rgba(99,102,241,0.12); }
    .jc-2 { top: 115px; left: 0; z-index: 2; }
    .jc-3 { top: 230px; left: 60px; z-index: 1; }

    .jc-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; }
    .jc-cat { font-size: 0.75rem; font-weight: 600; color: #71717a; }
    .jc-urgent { font-size: 0.68rem; font-weight: 700; background: #fef2f2; color: #ef4444; padding: 0.15rem 0.5rem; border-radius: 99px; border: 1px solid #fecaca; }
    .jc-badge { font-size: 0.68rem; font-weight: 700; background: #eff6ff; color: #3b82f6; padding: 0.15rem 0.5rem; border-radius: 99px; border: 1px solid #bfdbfe; }
    .jc-title { font-size: 0.875rem; font-weight: 600; color: #18181b; margin: 0 0 0.75rem; line-height: 1.4; }
    .jc-footer { display: flex; justify-content: space-between; align-items: center; }
    .jc-price { font-size: 0.82rem; font-weight: 700; color: #0ea5e9; }
    .jc-dist { font-size: 0.72rem; color: #a1a1aa; }

    .ai-badge {
      position: absolute; bottom: 20px; right: -10px;
      display: inline-flex; align-items: center; gap: 0.45rem;
      background: #18181b; color: #fff;
      font-size: 0.73rem; font-weight: 600;
      padding: 0.45rem 0.875rem; border-radius: 99px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      z-index: 10;
    }
    .ai-pulse {
      width: 7px; height: 7px; border-radius: 50%;
      background: #4ade80;
      animation: pulse-dot 1.5s ease-in-out infinite;
    }

    /* ── TRUST STRIP ──────────────────────────────────── */
    .trust-strip {
      background: #fafafa; border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0;
      padding: 1rem 1.5rem;
    }
    .trust-strip-inner {
      max-width: 1100px; margin: 0 auto;
      display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;
    }
    .ts-label { font-size: 0.78rem; color: #a1a1aa; font-weight: 500; }
    .ts-city {
      font-size: 0.78rem; font-weight: 600; color: #52525b;
      padding: 0.2rem 0.65rem; background: #fff; border: 1px solid #e4e4e7; border-radius: 999px;
    }

    /* ── SECTIONS BASE ────────────────────────────────── */
    .section { padding: 6rem 1.5rem; }
    .section-inner { max-width: 1100px; margin: 0 auto; }
    .section-label-row { margin-bottom: 0.75rem; }
    .section-eyebrow {
      font-size: 0.74rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.12em; color: #0ea5e9;
    }
    .eyebrow-green { color: #16a34a; }
    .section-title {
      font-size: clamp(1.8rem, 3vw, 2.6rem); font-weight: 800;
      letter-spacing: -0.03em; color: #18181b; margin: 0 0 3rem;
    }

    /* ── HOW IT WORKS ─────────────────────────────────── */
    .how { background: #f9f9f9; }
    .steps {
      display: flex; align-items: flex-start;
      justify-content: space-between; flex-wrap: wrap; gap: 1rem;
    }
    .step {
      flex: 1; min-width: 200px; max-width: 280px;
      display: flex; flex-direction: column; gap: 1rem;
      background: #fff; border: 1.5px solid #f0f0f0;
      border-radius: 16px; padding: 1.75rem;
    }
    .step-num { font-size: 0.68rem; font-weight: 800; color: #d1d5db; letter-spacing: 0.12em; }
    .step-icon {
      width: 48px; height: 48px;
      background: #f0f9ff; border: 1.5px solid #bae6fd;
      border-radius: 12px; display: flex; align-items: center; justify-content: center;
      color: #0ea5e9;
    }
    .step-title { font-size: 1rem; font-weight: 700; color: #18181b; margin: 0; }
    .step-desc { font-size: 0.85rem; color: #71717a; line-height: 1.65; margin: 0; }
    .step-arrow { display: flex; align-items: center; padding-top: 3.5rem; flex-shrink: 0; }

    /* ── CATEGORIES ───────────────────────────────────── */
    .cats { background: #fff; }
    .cat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 0.75rem;
    }
    .cat-card {
      display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
      background: #f9f9f9; border: 1.5px solid #f0f0f0;
      border-radius: 14px; padding: 1.25rem 1rem;
      cursor: default; transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
    }
    .cat-card:hover {
      border-color: #e0e7ff; transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(99,102,241,0.08); background: #fff;
    }
    .cat-emoji { font-size: 1.75rem; }
    .cat-name { font-size: 0.75rem; font-weight: 600; color: #52525b; text-align: center; }

    /* ── STATS DARK BANNER ────────────────────────────── */
    .stats-banner {
      background: #0f0f13;
      padding: 4rem 1.5rem;
    }
    .stats-inner {
      max-width: 900px; margin: 0 auto;
      display: flex; align-items: center; justify-content: center;
      gap: 0; flex-wrap: wrap;
    }
    .stat-block {
      display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
      padding: 1.5rem 3rem; text-align: center;
    }
    .stat-num { font-size: 2.4rem; font-weight: 900; color: #fff; letter-spacing: -0.04em; }
    .stat-label { font-size: 0.8rem; color: #52525b; font-weight: 500; }
    .stat-sep { width: 1px; height: 60px; background: #27272a; flex-shrink: 0; }

    /* ── WORKER CTA ───────────────────────────────────── */
    .worker-cta { background: #f9fafb; }
    .worker-cta-inner {
      display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center;
    }
    .worker-title { font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 800; color: #18181b; margin: 0.5rem 0 1rem; letter-spacing: -0.03em; }
    .worker-sub { font-size: 0.95rem; color: #71717a; line-height: 1.7; margin: 0 0 1.5rem; }
    .worker-perks { list-style: none; padding: 0; margin: 0 0 2rem; display: flex; flex-direction: column; gap: 0.65rem; }
    .worker-perks li { display: flex; align-items: center; gap: 0.625rem; font-size: 0.875rem; color: #3f3f46; }
    .perk-check {
      width: 22px; height: 22px; border-radius: 50%;
      background: #dcfce7; color: #16a34a;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }

    /* Earning card */
    .worker-graphic { display: flex; justify-content: center; }
    .earning-card {
      background: #fff; border: 1.5px solid #e4e4e7;
      border-radius: 20px; padding: 1.75rem;
      width: 280px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.08);
    }
    .ec-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; }
    .ec-label { font-size: 0.72rem; font-weight: 600; color: #a1a1aa; margin: 0 0 0.3rem; text-transform: uppercase; letter-spacing: 0.06em; }
    .ec-amount { font-size: 2.25rem; font-weight: 900; color: #18181b; margin: 0; letter-spacing: -0.04em; }
    .ec-badge { background: #dcfce7; color: #15803d; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 999px; white-space: nowrap; margin-top: 0.25rem; }
    .ec-bars { display: flex; align-items: flex-end; gap: 0.35rem; height: 80px; margin-bottom: 1.25rem; }
    .ec-bar { flex: 1; background: #f4f4f5; border-radius: 4px; }
    .ec-bar-active { background: linear-gradient(to top, #16a34a, #4ade80); }
    .ec-footer { display: flex; justify-content: space-between; font-size: 0.78rem; }
    .ec-jobs-label { color: #52525b; font-weight: 500; }
    .ec-week { color: #a1a1aa; }

    /* ── FINAL CTA ────────────────────────────────────── */
    .final-cta {
      background: #0f0f13;
      text-align: center;
      position: relative; overflow: hidden;
    }
    .final-glow {
      position: absolute; inset: 0; pointer-events: none;
      background: radial-gradient(ellipse 70% 60% at 50% 100%, rgba(99,102,241,0.12) 0%, transparent 70%);
    }
    .final-inner { max-width: 580px; position: relative; z-index: 1; }
    .final-badge {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
      color: #a1a1aa; font-size: 0.75rem; font-weight: 600;
      padding: 0.35rem 0.875rem; border-radius: 99px;
      margin-bottom: 1.5rem;
    }
    .final-title {
      font-size: clamp(2rem, 4vw, 3rem); font-weight: 900; color: #fff;
      margin: 0 0 1rem; letter-spacing: -0.04em;
    }
    .final-sub { font-size: 1rem; color: #52525b; margin: 0 0 2.5rem; line-height: 1.65; }
    .final-btns { display: flex; align-items: center; justify-content: center; gap: 1rem; flex-wrap: wrap; }
    .final-btns .cta-primary { background: #fff; color: #18181b; }
    .final-btns .cta-primary:hover { background: #f4f4f5; }

    /* ── FOOTER ───────────────────────────────────────── */
    .footer { background: #0a0a0a; padding: 3rem 1.5rem; }
    .footer-inner { max-width: 1100px; margin: 0 auto; }
    .footer-top { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid #1c1c1c; }
    .footer-brand { display: flex; align-items: center; gap: 0.5rem; color: #fff; font-weight: 800; font-size: 0.95rem; letter-spacing: -0.01em; }
    .footer-tagline { font-size: 0.78rem; color: #3f3f46; margin: 0 0 0 0.5rem; }
    .footer-bottom { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
    .footer-copy { font-size: 0.78rem; color: #3f3f46; margin: 0; }
    .footer-links { display: flex; gap: 1.5rem; }
    .footer-links a { font-size: 0.78rem; color: #52525b; text-decoration: none; transition: color 0.15s; }
    .footer-links a:hover { color: #a1a1aa; }

    /* ── Responsive ───────────────────────────────────── */
    @media (max-width: 768px) {
      .hero-inner { grid-template-columns: 1fr; gap: 3rem; }
      .hero-visual { display: none; }
      .worker-cta-inner { grid-template-columns: 1fr; gap: 2.5rem; }
      .worker-graphic { display: none; }
      .steps { flex-direction: column; }
      .step-arrow { display: none; }
      .step { max-width: 100%; }
      .stats-inner { flex-direction: column; gap: 0; }
      .stat-sep { width: 80px; height: 1px; }
      .stat-block { padding: 1.25rem; }
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

  cities = ['Vienna', 'Berlin', 'Zurich', 'Amsterdam', 'Prague', 'Budapest'];

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

    const tl = gsap.timeline({ defaults: { ease, duration: 0.9 } });
    tl.fromTo(this.eyebrow.nativeElement, { opacity: 0, y: 20 }, { opacity: 1, y: 0 })
      .fromTo(this.line1.nativeElement, { y: '110%', opacity: 0 }, { y: '0%', opacity: 1 }, '-=0.5')
      .fromTo(this.line2.nativeElement, { y: '110%', opacity: 0 }, { y: '0%', opacity: 1 }, '-=0.7')
      .fromTo(this.heroSub.nativeElement, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
      .fromTo(this.heroCtas.nativeElement, { opacity: 0, y: 20 }, { opacity: 1, y: 0 }, '-=0.6')
      .fromTo(this.trustRow.nativeElement, { opacity: 0, y: 16 }, { opacity: 1, y: 0 }, '-=0.6')
      .fromTo(this.heroVisual.nativeElement, { opacity: 0 }, { opacity: 1, duration: 0.5 }, '-=1')
      .fromTo(
        [this.jc1.nativeElement, this.jc2.nativeElement, this.jc3.nativeElement],
        { opacity: 0, y: 40, scale: 0.92 },
        { opacity: 1, y: 0, scale: 1, stagger: 0.12, ease: 'back.out(1.4)' }, '-=0.3'
      )
      .fromTo(this.aiBadge.nativeElement, { opacity: 0, scale: 0.8, y: 10 }, { opacity: 1, scale: 1, y: 0, ease: 'back.out(2)' }, '-=0.2');

    gsap.to(this.jc1.nativeElement, { y: -10, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0 });
    gsap.to(this.jc2.nativeElement, { y: -7, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.5 });
    gsap.to(this.jc3.nativeElement, { y: -12, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1 });
    gsap.to(this.aiBadge.nativeElement, { y: -5, duration: 2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.3 });

    document.querySelectorAll('.trust-num[data-target]').forEach((el: any) => {
      const target = parseInt(el.dataset['target']);
      gsap.to({ val: 0 }, {
        val: target, duration: 2, ease: 'power2.out', delay: 1,
        onUpdate: function() { el.textContent = Math.round(this.targets()[0].val).toString(); },
      });
    });

    gsap.fromTo('.step', { opacity: 0, y: 40 }, {
      opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease,
      scrollTrigger: { trigger: '.how', start: 'top 75%' },
    });

    gsap.utils.toArray('.section-title').forEach((el: any) => {
      gsap.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease, scrollTrigger: { trigger: el, start: 'top 85%' } });
    });
    gsap.utils.toArray('.section-eyebrow').forEach((el: any) => {
      gsap.fromTo(el, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.6, ease, scrollTrigger: { trigger: el, start: 'top 88%' } });
    });

    gsap.fromTo('.cat-card', { opacity: 0, y: 24, scale: 0.96 }, {
      opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.04, ease: 'back.out(1.2)',
      scrollTrigger: { trigger: '.cat-grid', start: 'top 80%' },
    });

    gsap.fromTo('.stat-block', { opacity: 0, y: 30 }, {
      opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease,
      scrollTrigger: { trigger: '.stats-banner', start: 'top 75%' },
    });

    gsap.fromTo('.worker-text', { opacity: 0, x: -40 }, {
      opacity: 1, x: 0, duration: 0.9, ease,
      scrollTrigger: { trigger: '.worker-cta', start: 'top 75%' },
    });
    gsap.fromTo('.earning-card', { opacity: 0, x: 40, y: 20 }, {
      opacity: 1, x: 0, y: 0, duration: 0.9, ease: 'back.out(1.3)',
      scrollTrigger: { trigger: '.worker-cta', start: 'top 75%' },
    });
    gsap.fromTo('.worker-perks li', { opacity: 0, x: -16 }, {
      opacity: 1, x: 0, duration: 0.45, stagger: 0.08, ease,
      scrollTrigger: { trigger: '.worker-perks', start: 'top 82%' },
    });

    gsap.fromTo('.final-title, .final-sub, .final-btns, .final-badge', { opacity: 0, y: 30 }, {
      opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease,
      scrollTrigger: { trigger: '.final-cta', start: 'top 80%' },
    });
  }

  ngOnDestroy() {
    if (this.ctx) this.ctx.revert();
    import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
      ScrollTrigger.getAll().forEach((t: any) => t.kill());
    });
  }
}
