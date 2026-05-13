import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

type Audience = 'worker' | 'client';
type Period = 'mo' | 'yr';

interface Plan {
  id: string;
  apiId?: string;
  name: 'Free' | 'Pro' | 'Elite' | 'Business' | 'Enterprise';
  price: { mo: number; yr: number };
  fee: string;
  tagline: string;
  featured?: boolean;
  features: [string, string][];
  cta: string;
  ctaActive?: boolean;
  contact?: boolean;
}

interface CompareRow {
  label: string;
  free: string | boolean;
  pro: string | boolean;
  elite: string | boolean;
}

interface CompareGroup {
  group: string;
  rows: CompareRow[];
}

interface Faq {
  q: string;
  a: string;
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <div class="scroll">

        <!-- Hero -->
        <section class="hero">
          <div class="hero-text">
            <p class="eyebrow">Pricing</p>
            <h1 class="title">
              Simple pricing.<br>
              <span class="title-mute">You</span> keep what you earn.
            </h1>
            <p class="subtitle">
              Start free. Upgrade when the work picks up — pay less platform fee,
              get found first, cancel anytime.
            </p>
          </div>

          <div class="hero-controls">
            @if (!auth.isLoggedIn()) {
              <div class="pill">
                <button
                  class="pill-btn"
                  [class.pill-active]="audience() === 'worker'"
                  (click)="audience.set('worker')"
                  type="button"
                >I'm a worker</button>
                <button
                  class="pill-btn"
                  [class.pill-active]="audience() === 'client'"
                  (click)="audience.set('client')"
                  type="button"
                >I'm a client</button>
              </div>
            }

            @if (audience() === 'worker') {
              <div class="pill">
                <button
                  class="pill-btn"
                  [class.pill-active]="period() === 'mo'"
                  (click)="period.set('mo')"
                  type="button"
                >Monthly</button>
                <button
                  class="pill-btn"
                  [class.pill-active]="period() === 'yr'"
                  (click)="period.set('yr')"
                  type="button"
                >
                  Yearly
                  <span class="pill-badge" [class.pill-badge-active]="period() === 'yr'">2 MOS FREE</span>
                </button>
              </div>
            }
          </div>
        </section>

        <!-- Plan cards -->
        <section class="cards-wrap">
          <div class="cards">
            @for (plan of plans; track plan.id) {
              <article
                class="card"
                [class.card-dark]="plan.featured"
              >
                @if (plan.featured) {
                  <span class="popular">Most popular</span>
                }

                <div class="card-top">
                  <div class="card-head">
                    <span class="card-tier">{{ audience() === 'worker' ? 'Worker' : 'Client' }} {{ plan.name }}</span>
                    <span class="fee-chip" [class.fee-chip-lime]="plan.featured">
                      {{ plan.fee }} fee
                    </span>
                  </div>

                  <div class="price-block">
                    @if (priceFor(plan) === 0) {
                      <span class="price-big">Free</span>
                    } @else {
                      <span class="price-cur">€</span>
                      <span class="price-big">{{ priceParts(plan).whole }}</span>
                      <span class="price-dec">.{{ priceParts(plan).dec }}</span>
                      <span class="price-per">/mo</span>
                    }
                  </div>

                  <p class="price-note">
                    @if (plan.price.mo === 0) {
                      No card required
                    } @else if (period() === 'yr') {
                      billed annually · €{{ plan.price.yr }}/yr
                      <span class="save">· save {{ savePercent(plan) }}%</span>
                    } @else {
                      billed monthly · cancel anytime
                    }
                  </p>

                  <p class="card-tagline">{{ plan.tagline }}</p>
                </div>

                <div class="card-divider"></div>

                <ul class="features">
                  @for (f of plan.features; track f[0] + '|' + f[1]; let i = $index) {
                    <li class="feature" [class.feature-muted]="f[0] === '—'">
                      <span class="feat-tag">{{ f[0] }}</span>
                      <span class="feat-label">{{ f[1] }}</span>
                    </li>
                  }
                </ul>

                <button
                  class="cta"
                  [class.cta-current]="plan.ctaActive"
                  [class.cta-lime]="plan.featured && !plan.ctaActive"
                  [class.cta-ink]="!plan.featured && !plan.ctaActive"
                  [disabled]="plan.ctaActive || loading() === plan.id"
                  (click)="selectPlan(plan)"
                  type="button"
                >
                  @if (loading() === plan.id) {
                    <span class="spinner"></span> Redirecting…
                  } @else {
                    {{ plan.cta }}
                    @if (!plan.ctaActive) {
                      <span class="arrow">→</span>
                    }
                  }
                </button>
              </article>
            }
          </div>

          <p class="legal">
            All prices in EUR · VAT calculated at checkout · 30-day money-back on first upgrade
          </p>
        </section>

        <!-- Compare table -->
        <section class="compare-wrap">
          <div class="compare-panel">
            <div class="compare-head">
              <div>
                <p class="eyebrow">Compare</p>
                <p class="compare-title">What's in each plan</p>
              </div>
              <span class="compare-meta">
                worker plans · {{ period() === 'yr' ? 'yearly' : 'monthly' }}
              </span>
            </div>

            <div class="compare-col-header">
              <span></span>
              <span class="ch-cell">Free</span>
              <span class="ch-cell ch-pro">
                Pro <span class="ch-pop">POPULAR</span>
              </span>
              <span class="ch-cell">Elite</span>
            </div>

            @for (group of compareGroups; track group.group) {
              <div class="compare-group">{{ group.group }}</div>
              @for (row of group.rows; track row.label) {
                <div class="compare-row">
                  <span class="compare-label">{{ row.label }}</span>
                  <span class="compare-cell">
                    <ng-container *ngTemplateOutlet="cell; context: { $implicit: row.free, dim: true }"></ng-container>
                  </span>
                  <span class="compare-cell compare-cell-pro">
                    <ng-container *ngTemplateOutlet="cell; context: { $implicit: row.pro, dim: false }"></ng-container>
                  </span>
                  <span class="compare-cell">
                    <ng-container *ngTemplateOutlet="cell; context: { $implicit: row.elite, dim: false }"></ng-container>
                  </span>
                </div>
              }
            }

            <ng-template #cell let-val let-dim="dim">
              @if (val === false) {
                <span class="cell-dash">—</span>
              } @else if (val === true) {
                <span class="cell-check" [class.cell-check-dim]="dim">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                </span>
              } @else {
                <span class="cell-text">{{ val }}</span>
              }
            </ng-template>
          </div>
        </section>

        <!-- FAQ + dark CTA -->
        <section class="bottom-grid">
          <div class="faq">
            <p class="eyebrow">FAQ</p>
            <p class="faq-title">Questions, answered.</p>
            <div class="faq-list">
              @for (item of faqs; track item.q; let i = $index) {
                <div class="faq-item">
                  <button
                    class="faq-row"
                    (click)="toggleFaq(i)"
                    type="button"
                  >
                    <span class="faq-q">{{ item.q }}</span>
                    <span class="faq-plus" [class.faq-plus-open]="openFaq() === i">+</span>
                  </button>
                  @if (openFaq() === i) {
                    <p class="faq-a">{{ item.a }}</p>
                  }
                </div>
              }
            </div>
          </div>

          <aside class="cta-card">
            <div class="cta-glow"></div>
            <p class="eyebrow eyebrow-dark">Still deciding?</p>
            <p class="cta-title">
              Try {{ audience() === 'worker' ? 'Pro' : 'Business' }} free for 14 days.
            </p>
            <p class="cta-sub">
              No card. Auto-downgrades to Free if you don't upgrade —
              your {{ audience() === 'worker' ? 'jobs and ratings' : 'posts and team' }} stay put.
            </p>
            <button class="trial-btn" (click)="startTrial()" type="button">
              Start 14-day {{ audience() === 'worker' ? 'Pro' : 'Business' }} trial
              <span class="arrow">→</span>
            </button>
            <p class="cta-stats">
              <span>★ 4.92 avg</span><span>·</span>
              <span>{{ audience() === 'worker' ? '2,400+ workers' : '900+ clients' }}</span><span>·</span>
              <span>EU-hosted</span>
            </p>
          </aside>
        </section>

      </div>

      @if (error()) {
        <div class="err-toast">{{ error() }}</div>
      }
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
      --accent-ink: var(--rg-ink, #0A0A0A);
      --accent-text: var(--rg-accent-text, #4D7C0F);
      --soft: var(--rg-soft, #F5F5F3);
      --font: 'Geist', 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      --mono: 'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
      display: block;
    }
    * { box-sizing: border-box; }

    .page {
      min-height: 100vh;
      background: var(--bg);
      color: var(--ink);
      font-family: var(--font);
      -webkit-font-smoothing: antialiased;
    }

    .scroll {
      max-width: 1180px;
      margin: 0 auto;
      padding: 0 40px 32px;
    }

    .eyebrow {
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0 0 10px;
    }
    .eyebrow-dark { color: var(--rg-sub, #A3A3A3); }
    .arrow { margin-left: 6px; display: inline-block; }

    /* ── Hero ──────────────────────────────── */
    .hero {
      padding: 44px 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 32px;
    }
    .hero-text { max-width: 720px; }
    .title {
      font-size: 48px;
      font-weight: 500;
      letter-spacing: -0.035em;
      margin: 0;
      line-height: 1.02;
      color: var(--ink);
    }
    .title-mute { color: var(--muted); }
    .subtitle {
      font-size: 14px;
      color: var(--muted);
      margin: 16px 0 0;
      max-width: 540px;
      line-height: 1.55;
    }

    .hero-controls {
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: flex-end;
      flex-shrink: 0;
    }
    .pill {
      display: inline-flex;
      padding: 3px;
      border-radius: 999px;
      border: 1px solid var(--rule);
      background: var(--panel);
      align-items: center;
    }
    .pill-btn {
      padding: 7px 14px;
      border-radius: 999px;
      border: none;
      background: transparent;
      color: var(--muted);
      font-size: 12px;
      font-family: var(--font);
      font-weight: 400;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }
    .pill .pill-btn.pill-active,
    .pill button.pill-btn.pill-active {
      background: var(--rg-invert-bg, #0A0A0A);
      color: var(--rg-invert-fg, #fff);
      font-weight: 500;
    }
    .pill-badge {
      padding: 1px 6px;
      border-radius: 999px;
      background: var(--rg-accent-bg, #F0FAE0);
      color: var(--accent-text);
      font-size: 9.5px;
      font-family: var(--mono);
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    .pill-badge.pill-badge-active {
      background: var(--accent);
      color: var(--accent-ink);
    }

    /* ── Plan cards ────────────────────────── */
    .cards-wrap { padding: 12px 0 24px; }
    .cards {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      align-items: stretch;
      padding-top: 12px;
    }
    .legal {
      text-align: center;
      margin: 18px 0 0;
      font-size: 11.5px;
      color: var(--sub);
      font-family: var(--mono);
      letter-spacing: 0.02em;
    }

    .card {
      position: relative;
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 18px;
      padding: 28px 26px 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      box-shadow: 0 1px 0 rgba(10,10,10,0.02);
    }
    .card-dark {
      background: var(--rg-feature-bg, #0A0A0A);
      border-color: var(--rg-feature-rule, #262626);
      color: var(--rg-feature-fg, #fff);
      box-shadow: 0 30px 60px -30px rgba(10,10,10,0.55);
      transform: translateY(-8px);
    }
    .card-dark .card-divider { background: var(--rg-feature-rule, #262626); }
    .card-dark .card-tier { color: var(--rg-feature-muted, rgba(255,255,255,0.62)); }
    .card-dark .price-cur,
    .card-dark .price-big { color: var(--rg-feature-fg, #fff); }
    .card-dark .price-dec { color: var(--rg-feature-muted, rgba(255,255,255,0.62)); }
    .card-dark .price-per { color: var(--rg-feature-muted, rgba(255,255,255,0.62)); }
    .card-dark .price-note { color: var(--rg-feature-muted, rgba(255,255,255,0.62)); }
    .card-dark .save { color: var(--accent); }
    .card-dark .card-tagline { color: var(--rg-feature-fg, #fff); }
    .card-dark .feature { color: var(--rg-feature-fg, #fff); }
    .card-dark .feat-tag { color: var(--accent); }
    .card-dark .feature-muted { color: var(--rg-feature-muted, rgba(255,255,255,0.55)); }
    .card-dark .feature-muted .feat-tag { color: var(--rg-feature-muted, rgba(255,255,255,0.55)); }

    .popular {
      position: absolute;
      top: -12px;
      left: 24px;
      padding: 5px 10px;
      border-radius: 999px;
      background: var(--accent);
      color: var(--accent-ink);
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .card-tier {
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-weight: 500;
    }
    .fee-chip {
      display: inline-flex;
      align-items: center;
      padding: 3px 9px;
      border-radius: 999px;
      background: var(--rg-accent-bg, #F0FAE0);
      color: var(--accent-text);
      font-size: 11px;
      font-weight: 600;
      font-family: var(--mono);
    }
    .fee-chip-lime {
      background: var(--accent);
      color: var(--accent-ink);
    }

    .price-block {
      margin-top: 16px;
      display: flex;
      align-items: baseline;
      gap: 4px;
      font-variant-numeric: tabular-nums;
    }
    .price-cur,
    .price-dec {
      font-size: 22px;
      font-weight: 500;
      align-self: flex-start;
      margin-top: 14px;
      font-variant-numeric: tabular-nums;
    }
    .price-cur { color: var(--ink); }
    .price-dec { color: var(--muted); }
    .price-big {
      font-size: 56px;
      font-weight: 500;
      letter-spacing: -0.04em;
      line-height: 1;
      color: var(--ink);
      font-variant-numeric: tabular-nums;
    }
    .price-per {
      font-size: 13px;
      color: var(--muted);
      margin-left: 6px;
    }
    .price-note {
      font-size: 11.5px;
      color: var(--muted);
      margin: 8px 0 0;
      min-height: 16px;
    }
    .save {
      color: var(--accent-text);
      font-weight: 500;
    }
    .card-tagline {
      font-size: 13.5px;
      color: var(--ink);
      margin: 14px 0 0;
      letter-spacing: -0.005em;
      line-height: 1.45;
    }

    .card-divider {
      height: 1px;
      background: var(--rule);
    }

    .features {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .feature {
      display: flex;
      gap: 10px;
      align-items: baseline;
      font-size: 12.5px;
      color: var(--ink);
    }
    .feature-muted { opacity: 0.55; color: var(--muted); }
    .feat-tag {
      font-family: var(--mono);
      font-size: 11px;
      color: var(--accent-text);
      min-width: 64px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }
    .feature-muted .feat-tag { color: var(--muted); }
    .feat-label {
      flex: 1;
      line-height: 1.45;
    }

    .cta {
      margin-top: auto;
      width: 100%;
      padding: 12px 16px;
      border-radius: 10px;
      border: none;
      font-size: 13px;
      font-family: var(--font);
      font-weight: 500;
      letter-spacing: -0.005em;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all 0.15s;
    }
    .cta-ink {
      background: var(--rg-invert-bg, #0A0A0A);
      color: var(--rg-invert-fg, #fff);
    }
    .cta-ink:hover:not(:disabled) { background: var(--rg-invert-hover, #262626); }
    .cta-lime {
      background: var(--accent);
      color: var(--accent-ink);
    }
    .cta-lime:hover:not(:disabled) { background: var(--rg-accent-hover, var(--rg-accent-hover, var(--rg-accent-hover, #A3E635))); }
    .cta-current {
      background: var(--soft);
      color: var(--muted);
      cursor: default;
    }
    .card-dark .cta-current {
      background: var(--rg-ink-hover, #262626);
      color: var(--rg-sub, #A3A3A3);
    }
    .cta:disabled { cursor: not-allowed; }

    .spinner {
      width: 12px; height: 12px;
      border: 2px solid rgba(0,0,0,0.18);
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Compare table ─────────────────────── */
    .compare-wrap { padding: 12px 0 24px; }
    .compare-panel {
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 14px;
      overflow: hidden;
    }
    .compare-head {
      padding: 18px 24px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .compare-title {
      font-size: 18px;
      font-weight: 500;
      letter-spacing: -0.015em;
      color: var(--ink);
      margin: 4px 0 0;
    }
    .compare-meta {
      font-size: 11px;
      color: var(--sub);
      font-family: var(--mono);
    }

    .compare-col-header {
      display: grid;
      grid-template-columns: 1.6fr 1fr 1fr 1fr;
      padding: 10px 24px;
      border-top: 1px solid var(--rule);
      border-bottom: 1px solid var(--rule);
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 500;
      align-items: center;
    }
    .ch-cell { text-align: center; }
    .ch-pro { color: var(--ink); }
    .ch-pop {
      margin-left: 4px;
      padding: 1px 6px;
      border-radius: 999px;
      background: var(--accent);
      color: var(--accent-ink);
      font-size: 9px;
      font-family: var(--mono);
      letter-spacing: 0.05em;
    }

    .compare-group {
      padding: 12px 24px 6px;
      font-size: 10.5px;
      color: var(--muted);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 500;
      background: var(--soft);
    }
    .compare-row {
      display: grid;
      grid-template-columns: 1.6fr 1fr 1fr 1fr;
      padding: 12px 24px;
      align-items: center;
      border-top: 1px solid var(--rule);
      font-size: 13px;
    }
    .compare-label { color: var(--ink); }
    .compare-cell {
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .compare-cell-pro {
      background: rgba(132,204,22,0.06);
      padding: 10px 0;
      margin: -12px 0;
      border-left: 1px solid var(--rule);
      border-right: 1px solid var(--rule);
    }
    .cell-dash {
      color: var(--sub);
      font-family: var(--mono);
      font-size: 13px;
    }
    .cell-check {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: var(--rg-accent-bg, #F0FAE0);
      color: var(--accent-text);
    }
    .cell-check-dim {
      background: var(--soft);
      color: var(--muted);
    }
    .cell-text {
      font-size: 12px;
      color: var(--ink);
    }

    /* ── FAQ + CTA grid ────────────────────── */
    .bottom-grid {
      padding: 8px 0 32px;
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 24px;
    }
    .faq-title {
      font-size: 22px;
      font-weight: 500;
      letter-spacing: -0.02em;
      color: var(--ink);
      margin: 4px 0 8px;
    }
    .faq-list { display: flex; flex-direction: column; }
    .faq-item { border-bottom: 1px solid var(--rule); }
    .faq-row {
      width: 100%;
      padding: 16px 0;
      background: transparent;
      border: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      font-family: var(--font);
      text-align: left;
    }
    .faq-q {
      font-size: 14px;
      font-weight: 500;
      color: var(--ink);
      letter-spacing: -0.005em;
    }
    .faq-plus {
      width: 22px;
      height: 22px;
      border-radius: 999px;
      border: 1px solid var(--rule);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--muted);
      font-size: 13px;
      line-height: 1;
      transition: transform 0.15s;
    }
    .faq-plus-open { transform: rotate(45deg); }
    .faq-a {
      padding: 0 0 18px;
      font-size: 13px;
      color: var(--muted);
      line-height: 1.6;
      max-width: 720px;
      margin: 0;
    }

    .cta-card {
      background: var(--rg-feature-bg, #0A0A0A);
      color: var(--rg-feature-fg, #fff);
      border-radius: 16px;
      padding: 26px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      position: relative;
      overflow: hidden;
      align-self: start;
    }
    .cta-glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 100% 0%, rgba(132,204,22,0.25), transparent 55%);
      pointer-events: none;
    }
    .cta-card > * { position: relative; }
    .cta-title {
      font-size: 22px;
      font-weight: 500;
      letter-spacing: -0.02em;
      line-height: 1.2;
      margin: 0;
    }
    .cta-sub {
      font-size: 12.5px;
      color: var(--rg-sub, #A3A3A3);
      line-height: 1.5;
      margin: 0;
    }
    .trial-btn {
      margin-top: 8px;
      padding: 12px 14px;
      border-radius: 10px;
      border: none;
      background: var(--accent);
      color: var(--accent-ink);
      font-size: 13px;
      font-family: var(--font);
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
    .trial-btn:hover { background: var(--rg-accent-hover, var(--rg-accent-hover, var(--rg-accent-hover, #A3E635))); }
    .cta-stats {
      display: flex;
      gap: 14px;
      font-size: 11px;
      color: var(--rg-muted, #737373);
      margin: 4px 0 0;
      font-family: var(--mono);
    }

    /* ── Error toast ───────────────────────── */
    .err-toast {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      background: var(--rg-panel, #fff);
      color: #b91c1c;
      border: 1px solid rgba(220,38,38,0.25);
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 6px 28px rgba(10,10,10,0.1);
      z-index: 9999;
    }

    /* ── Responsive ────────────────────────── */
    @media (max-width: 980px) {
      .hero { flex-direction: column; align-items: flex-start; }
      .hero-controls { align-items: flex-start; }
      .cards { grid-template-columns: 1fr; }
      .card-dark { transform: none; }
      .bottom-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 700px) {
      .scroll { padding: 0 20px 24px; }
      .title { font-size: 36px; }
      .compare-col-header,
      .compare-row {
        grid-template-columns: 1.4fr 1fr 1fr 1fr;
        padding-left: 16px;
        padding-right: 16px;
        font-size: 12px;
      }
    }
  `]
})
export class PricingComponent implements OnInit {
  private api = inject(ApiService);
  protected auth = inject(AuthService);
  private router = inject(Router);

  audience = signal<Audience>('worker');
  period = signal<Period>('yr');
  openFaq = signal<number | null>(0);
  loading = signal<string | null>(null);
  error = signal<string | null>(null);

  private readonly workerPlans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: { mo: 0, yr: 0 },
      fee: '15%',
      tagline: 'Pick up jobs as they come.',
      features: [
        ['5', 'applications / month'],
        ['15%', 'platform fee on earnings'],
        ['Standard', 'search ranking'],
        ['—', 'Pro badge on profile'],
        ['—', 'Advanced analytics'],
        ['Basic', 'profile listing'],
      ],
      cta: 'Current plan',
      ctaActive: true,
    },
    {
      id: 'pro',
      apiId: 'WORKER_PRO',
      name: 'Pro',
      price: { mo: 3, yr: 30 },
      fee: '12%',
      tagline: 'Get found, get booked, keep more.',
      featured: true,
      features: [
        ['Unlimited', 'job applications'],
        ['12%', 'platform fee · save 3%'],
        ['Priority', 'in search results'],
        ['Pro', 'badge on your profile'],
        ['Full', 'earnings & traffic analytics'],
        ['Featured', 'profile listing'],
      ],
      cta: 'Upgrade to Pro',
    },
    {
      id: 'elite',
      name: 'Elite',
      price: { mo: 5, yr: 50 },
      fee: '10%',
      tagline: 'For full-time pros at the top of the list.',
      features: [
        ['Unlimited', '+ direct hire requests'],
        ['10%', 'platform fee · save 5%'],
        ['Top placement', 'in your category'],
        ['Verified Elite', 'badge'],
        ['Dedicated', 'account manager'],
        ['Custom', 'scheduling & invoicing'],
      ],
      cta: 'Talk to sales',
      contact: true,
    },
  ];

  private readonly clientPlans: Plan[] = [
    {
      id: 'client_free',
      name: 'Free',
      price: { mo: 0, yr: 0 },
      fee: '5%',
      tagline: 'Post a job, pick a worker, get it done.',
      features: [
        ['5', 'job posts / month'],
        ['5%', 'platform fee per hire'],
        ['Standard', 'worker matching'],
        ['—', 'Verified Business badge'],
        ['—', 'Team seats'],
        ['Basic', 'reporting'],
      ],
      cta: 'Current plan',
      ctaActive: true,
    },
    {
      id: 'client_business',
      apiId: 'CLIENT_BUSINESS',
      name: 'Business',
      price: { mo: 3, yr: 30 },
      fee: '3%',
      tagline: 'Hire faster, manage your team, scale up.',
      featured: true,
      features: [
        ['Unlimited', 'job posts'],
        ['3%', 'platform fee · save 2%'],
        ['Priority', 'worker matching'],
        ['Verified', 'Business badge'],
        ['3 seats', 'included · add more anytime'],
        ['Advanced', 'reporting & exports'],
      ],
      cta: 'Upgrade to Business',
    },
    {
      id: 'client_enterprise',
      name: 'Enterprise',
      price: { mo: 5, yr: 50 },
      fee: '0%',
      tagline: 'Zero platform fee. White-glove sourcing.',
      features: [
        ['Unlimited', 'posts + private invites'],
        ['0%', 'platform fee · pay only the worker'],
        ['White-glove', 'worker matching'],
        ['Custom', 'SLA & legal review'],
        ['Unlimited', 'team seats + SSO'],
        ['Dedicated', 'account manager'],
      ],
      cta: 'Talk to sales',
      contact: true,
    },
  ];

  protected get plans(): Plan[] {
    return this.audience() === 'worker' ? this.workerPlans : this.clientPlans;
  }

  private readonly workerCompareGroups: CompareGroup[] = [
    { group: 'Earning', rows: [
      { label: 'Platform fee on each job', free: '15%', pro: '12%', elite: '10%' },
      { label: 'Payout speed', free: '2 business days', pro: '1 business day', elite: 'Same day' },
      { label: 'Auto-withdraw', free: false, pro: true, elite: true },
    ]},
    { group: 'Visibility', rows: [
      { label: 'Search ranking', free: 'Standard', pro: 'Priority', elite: 'Top placement' },
      { label: 'Profile badge', free: false, pro: 'Pro', elite: 'Elite ★' },
      { label: 'Featured in category', free: false, pro: 'Sometimes', elite: 'Always' },
    ]},
    { group: 'Tooling', rows: [
      { label: 'Monthly applications', free: '5', pro: 'Unlimited', elite: 'Unlimited' },
      { label: 'Earnings analytics', free: 'Basic', pro: 'Advanced', elite: 'Advanced + export' },
      { label: 'Account manager', free: false, pro: false, elite: true },
    ]},
  ];

  private readonly clientCompareGroups: CompareGroup[] = [
    { group: 'Hiring', rows: [
      { label: 'Platform fee per hire', free: '5%', pro: '3%', elite: '0%' },
      { label: 'Active job posts', free: '5 / mo', pro: 'Unlimited', elite: 'Unlimited' },
      { label: 'Private invite jobs', free: false, pro: true, elite: true },
    ]},
    { group: 'Workers', rows: [
      { label: 'Worker matching', free: 'Standard', pro: 'Priority', elite: 'White-glove' },
      { label: 'Verified badge', free: false, pro: 'Business', elite: 'Enterprise ★' },
      { label: 'Vetted talent pool', free: false, pro: 'Sometimes', elite: 'Always' },
    ]},
    { group: 'Team & ops', rows: [
      { label: 'Team seats', free: '1', pro: '3 included', elite: 'Unlimited + SSO' },
      { label: 'Reporting', free: 'Basic', pro: 'Advanced', elite: 'Advanced + export' },
      { label: 'Account manager', free: false, pro: false, elite: true },
    ]},
  ];

  protected get compareGroups(): CompareGroup[] {
    return this.audience() === 'worker' ? this.workerCompareGroups : this.clientCompareGroups;
  }

  protected readonly faqs: Faq[] = [
    { q: 'Can I cancel anytime?',
      a: `Yes. Cancel from your account; you keep Pro access until the end of the billing period — no questions, no fees.` },
    { q: 'What does the platform fee cover?',
      a: `Payment processing, escrow, dispute mediation, and the marketplace itself. There are no hidden charges on top.` },
    { q: 'Is my plan visible to others?',
      a: `Yes — your badge (Pro/Elite for workers, Business/Enterprise for clients) shows on your public profile. Billing details are never shown.` },
    { q: 'Can I switch plans later?',
      a: `Yes — upgrade or downgrade at any time. We prorate the difference automatically.` },
  ];

  ngOnInit() {
    const role = this.auth.user()?.role;
    if (role === 'CLIENT') this.audience.set('client');
  }

  priceFor(plan: Plan): number {
    if (this.period() === 'mo') return plan.price.mo;
    return plan.price.yr === 0 ? 0 : plan.price.yr / 12;
  }

  priceParts(plan: Plan): { whole: string; dec: string } {
    const v = this.priceFor(plan);
    const [whole, dec = '00'] = v.toFixed(2).split('.');
    return { whole, dec };
  }

  savePercent(plan: Plan): number {
    if (!plan.price.mo) return 0;
    return Math.round((1 - plan.price.yr / (plan.price.mo * 12)) * 100);
  }

  toggleFaq(i: number) {
    this.openFaq.set(this.openFaq() === i ? null : i);
  }

  startTrial() {
    const upgradePlan = this.plans.find((p) => p.featured);
    if (upgradePlan) this.selectPlan(upgradePlan);
  }

  selectPlan(plan: Plan) {
    if (plan.ctaActive) return;

    if (plan.contact) {
      window.location.href =
        'mailto:sales@robosgig.com?subject=' +
        encodeURIComponent(`${plan.name} plan inquiry`);
      return;
    }

    if (!plan.apiId) return;

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/pricing' } });
      return;
    }

    this.loading.set(plan.id);
    this.error.set(null);

    this.api.createCheckoutSession(plan.apiId).subscribe({
      next: (res) => {
        if (res.url) window.location.href = res.url;
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to start checkout. Please try again.');
        this.loading.set(null);
      },
    });
  }
}
