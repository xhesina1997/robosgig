import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  role: 'WORKER' | 'CLIENT';
  color: string;
  features: string[];
  fee: string;
  cta: string;
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">

      <!-- Hero -->
      <div class="hero">
        <p class="eyebrow">Pricing</p>
        <h1 class="hero-title">Simple, fair pricing.<br>No surprises.</h1>
        <p class="hero-sub">Start free. Upgrade when you're ready. Cancel anytime.</p>

        <!-- Role toggle: only visible when not logged in -->
        @if (!auth.isLoggedIn()) {
          <div class="role-toggle">
            <button class="role-btn" [class.role-active]="view() === 'WORKER'" (click)="view.set('WORKER')">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
              For Workers
            </button>
            <button class="role-btn" [class.role-active]="view() === 'CLIENT'" (click)="view.set('CLIENT')">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
              For Clients
            </button>
          </div>
        } @else {
          <p class="role-label">{{ view() === 'WORKER' ? 'Worker plans' : 'Client plans' }}</p>
        }
      </div>

      <!-- Plans -->
      <div class="plans-wrap">
        <div class="plans-grid">
          @for (plan of visiblePlans(); track plan.id) {
            <div class="plan-card" [class.plan-dark]="plan.id !== 'worker_free' && plan.id !== 'client_free'">

              @if (plan.id !== 'worker_free' && plan.id !== 'client_free') {
                <div class="popular-tag">Most Popular</div>
              }

              <div class="plan-head">
                <p class="plan-name">{{ plan.name }}</p>
                <div class="plan-price-row">
                  @if (plan.price === 0) {
                    <span class="plan-price">Free</span>
                  } @else {
                    <span class="plan-price">€{{ plan.price }}</span>
                    <span class="plan-period">/mo</span>
                  }
                </div>
                <span class="fee-badge">{{ plan.fee }}</span>
              </div>

              <ul class="features">
                @for (f of plan.features; track f) {
                  <li class="feature-item">
                    <span class="feature-check">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                    {{ f }}
                  </li>
                }
              </ul>

              <button
                class="plan-btn"
                [disabled]="loading() === plan.id"
                (click)="selectPlan(plan)"
              >
                @if (loading() === plan.id) {
                  <span class="spinner"></span> Redirecting…
                } @else {
                  {{ plan.cta }}
                }
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Fee explainer -->
      <div class="fee-section">
        <div class="fee-inner">
          <p class="eyebrow">How it works</p>
          <h2 class="section-title">Platform fees, explained</h2>
          <p class="section-sub">We only earn when you earn — the fee comes from the job total, nothing extra from clients.</p>

          <div class="fee-table">
            <div class="fee-row fee-row-head">
              <span class="fee-col">Plan</span>
              <span class="fee-col">Fee</span>
              <span class="fee-col">Worker keeps <em>(on €100 job)</em></span>
            </div>
            <div class="fee-row">
              <span class="fee-col">
                <span class="plan-dot plan-dot-gray"></span>
                Free
              </span>
              <span class="fee-col fee-pct">15%</span>
              <span class="fee-col fee-earn">€85</span>
            </div>
            <div class="fee-row">
              <span class="fee-col">
                <span class="plan-dot plan-dot-blue"></span>
                Worker Pro
              </span>
              <span class="fee-col fee-pct">12%</span>
              <span class="fee-col fee-earn">€88</span>
            </div>
            <div class="fee-row">
              <span class="fee-col">
                <span class="plan-dot plan-dot-teal"></span>
                Client Business
              </span>
              <span class="fee-col fee-pct">10%</span>
              <span class="fee-col fee-earn fee-earn-best">€90 ✦</span>
            </div>
          </div>

          <p class="fee-note">✦ Lowest fee applies when both worker and client have a paid plan.</p>
        </div>
      </div>

      <!-- FAQ -->
      <div class="faq-wrap">
        <div class="faq-inner">
          <p class="eyebrow" style="text-align:center;margin-bottom:2rem">FAQ</p>
          <div class="faq-grid">
            <div class="faq-item">
              <div class="faq-icon">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <p class="faq-q">Can I cancel anytime?</p>
                <p class="faq-a">Yes — no lock-in. Cancel from your dashboard and you keep access until the end of your billing period.</p>
              </div>
            </div>
            <div class="faq-item">
              <div class="faq-icon">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
              <div>
                <p class="faq-q">Which fee if both sides have a plan?</p>
                <p class="faq-a">The lowest fee wins. Worker Pro + Client Business on the same job → 10% fee for the worker.</p>
              </div>
            </div>
            <div class="faq-item">
              <div class="faq-icon">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <div>
                <p class="faq-q">Is there a free trial?</p>
                <p class="faq-a">The Free tier never expires. Upgrade only when the lower fee pays for the subscription itself.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      @if (error()) {
        <div class="err-toast">{{ error() }}</div>
      }
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .page { min-height: 100vh; background: #f8f8f8; }

    /* ── Hero ─────────────────────────────── */
    .hero {
      background: #fff;
      border-bottom: 1px solid #e4e4e7;
      text-align: center;
      padding: 5rem 1.5rem 4rem;
    }
    .eyebrow {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      color: #a1a1aa;
      margin-bottom: 1rem;
    }
    .hero-title {
      font-size: clamp(2rem, 5vw, 2.75rem);
      font-weight: 700;
      line-height: 1.15;
      color: #18181b;
      letter-spacing: -0.035em;
      margin-bottom: 0.875rem;
    }
    .hero-sub {
      font-size: 1rem;
      color: #71717a;
      margin-bottom: 2.5rem;
    }

    .role-label {
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #71717a;
    }

    /* Role toggle */
    .role-toggle {
      display: inline-flex;
      background: #f4f4f5;
      border: 1.5px solid #e4e4e7;
      border-radius: 99px;
      padding: 4px;
      gap: 3px;
    }
    .role-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 1.25rem;
      border: none;
      border-radius: 99px;
      font-size: 0.84rem;
      font-weight: 500;
      cursor: pointer;
      background: transparent;
      color: #71717a;
      transition: all 0.15s;
      font-family: inherit;
    }
    .role-btn.role-active {
      background: #18181b;
      color: #fff;
    }

    /* ── Plans ───────────────────────────── */
    .plans-wrap {
      max-width: 760px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
    }
    .plans-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      align-items: start;
    }

    .plan-card {
      background: #fff;
      border: 1.5px solid #e4e4e7;
      border-radius: 20px;
      padding: 2rem;
      position: relative;
      transition: box-shadow 0.15s;
    }
    .plan-card:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.07); }

    /* Dark (featured) card */
    .plan-dark {
      background: #18181b;
      border-color: #18181b;
      color: #fff;
    }

    .popular-tag {
      position: absolute;
      top: -13px;
      left: 50%;
      transform: translateX(-50%);
      background: #d97706;
      color: #fff;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 0.22rem 0.875rem;
      border-radius: 99px;
      white-space: nowrap;
    }

    .plan-head { margin-bottom: 1.75rem; }
    .plan-name {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: #a1a1aa;
      margin-bottom: 0.875rem;
    }
    .plan-dark .plan-name { color: rgba(255,255,255,0.5); }

    .plan-price-row {
      display: flex;
      align-items: baseline;
      gap: 0.2rem;
      margin-bottom: 0.75rem;
    }
    .plan-price {
      font-size: 2.75rem;
      font-weight: 700;
      color: #18181b;
      letter-spacing: -0.04em;
      line-height: 1;
    }
    .plan-dark .plan-price { color: #fff; }
    .plan-period { font-size: 0.9rem; color: #a1a1aa; }
    .plan-dark .plan-period { color: rgba(255,255,255,0.4); }

    .fee-badge {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      background: rgba(37,99,235,0.08);
      color: #2563eb;
    }
    .plan-dark .fee-badge {
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.75);
    }

    /* Features list */
    .features {
      list-style: none;
      padding: 0;
      margin: 0 0 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.7rem;
    }
    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      font-size: 0.875rem;
      color: #3f3f46;
      line-height: 1.45;
    }
    .plan-dark .feature-item { color: rgba(255,255,255,0.8); }

    .feature-check {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 1px;
      background: rgba(20,184,166,0.12);
      color: #0f766e;
    }
    .plan-dark .feature-check {
      background: rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.9);
    }

    /* CTA button */
    .plan-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.75rem 1rem;
      border-radius: 99px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s;
      background: #f4f4f5;
      color: #18181b;
      border: 1.5px solid #e4e4e7;
    }
    .plan-btn:hover:not(:disabled) { background: #e4e4e7; }
    .plan-dark .plan-btn {
      background: #fff;
      color: #18181b;
      border-color: transparent;
    }
    .plan-dark .plan-btn:hover:not(:disabled) { background: #f0f0f0; }
    .plan-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .spinner {
      width: 13px; height: 13px;
      border: 2px solid rgba(0,0,0,0.15);
      border-top-color: #18181b;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    .plan-dark .spinner {
      border-color: rgba(255,255,255,0.2);
      border-top-color: #18181b;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Fee table ────────────────────────── */
    .fee-section {
      background: #fff;
      border-top: 1px solid #e4e4e7;
      border-bottom: 1px solid #e4e4e7;
      padding: 4rem 1.5rem;
    }
    .fee-inner {
      max-width: 600px;
      margin: 0 auto;
      text-align: center;
    }
    .section-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #18181b;
      letter-spacing: -0.025em;
      margin: 0 0 0.5rem;
    }
    .section-sub {
      font-size: 0.9rem;
      color: #71717a;
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .fee-table {
      border: 1.5px solid #e4e4e7;
      border-radius: 14px;
      overflow: hidden;
      text-align: left;
      margin-bottom: 0.875rem;
    }
    .fee-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid #f4f4f5;
      align-items: center;
    }
    .fee-row:last-child { border-bottom: none; }
    .fee-row-head {
      background: #f4f4f5;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #a1a1aa;
    }
    .fee-col {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #18181b;
      font-weight: 500;
    }
    .fee-col em { font-style: normal; font-weight: 400; color: #a1a1aa; }
    .fee-pct { color: #71717a; font-weight: 400; }
    .fee-earn { color: #0f766e; font-weight: 700; }
    .fee-earn-best { font-size: 0.95rem; }

    .plan-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .plan-dot-gray { background: #a1a1aa; }
    .plan-dot-blue { background: #2563eb; }
    .plan-dot-teal { background: #14b8a6; }

    .fee-note {
      font-size: 0.75rem;
      color: #a1a1aa;
      text-align: center;
      margin: 0;
    }

    /* ── FAQ ──────────────────────────────── */
    .faq-wrap {
      padding: 4rem 1.5rem;
    }
    .faq-inner { max-width: 860px; margin: 0 auto; }
    .faq-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }
    .faq-item {
      display: flex;
      gap: 0.875rem;
      align-items: flex-start;
    }
    .faq-icon {
      width: 32px; height: 32px;
      border-radius: 9px;
      background: #f4f4f5;
      border: 1.5px solid #e4e4e7;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #71717a;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .faq-q {
      font-size: 0.875rem;
      font-weight: 600;
      color: #18181b;
      margin: 0 0 0.35rem;
      letter-spacing: -0.01em;
    }
    .faq-a {
      font-size: 0.8rem;
      color: #71717a;
      line-height: 1.65;
      margin: 0;
    }

    /* ── Error toast ──────────────────────── */
    .err-toast {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      background: #fff;
      color: #dc2626;
      border: 1.5px solid rgba(239,68,68,0.2);
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
      z-index: 9999;
      white-space: nowrap;
    }

    @media (max-width: 640px) {
      .plans-grid { grid-template-columns: 1fr; }
      .faq-grid { grid-template-columns: 1fr; }
      .fee-row { grid-template-columns: 1.5fr 1fr 1fr; }
    }
  `]
})
export class PricingComponent implements OnInit {
  private api = inject(ApiService);
  protected auth = inject(AuthService);
  private router = inject(Router);

  view = signal<'WORKER' | 'CLIENT'>('WORKER');
  loading = signal<string | null>(null);
  error = signal<string | null>(null);

  private readonly plans: Plan[] = [
    {
      id: 'worker_free',
      name: 'Worker Free',
      price: 0,
      period: '',
      role: 'WORKER',
      color: 'gray',
      fee: '15% platform fee',
      cta: 'Current plan',
      features: [
        'Up to 5 job applications/month',
        '15% platform fee on earnings',
        'Basic profile listing',
        'Standard search ranking',
      ],
    },
    {
      id: 'WORKER_PRO',
      name: 'Worker Pro',
      price: 19.99,
      period: 'month',
      role: 'WORKER',
      color: 'indigo',
      fee: '12% platform fee',
      cta: 'Upgrade to Pro',
      features: [
        'Unlimited job applications',
        '12% platform fee (save 3%)',
        '"Pro" badge on your profile',
        'Priority in search results',
        'Advanced analytics',
      ],
    },
    {
      id: 'client_free',
      name: 'Client Free',
      price: 0,
      period: '',
      role: 'CLIENT',
      color: 'gray',
      fee: '15% platform fee',
      cta: 'Current plan',
      features: [
        'Post up to 5 jobs/month',
        'AI job analysis',
        'Worker suggestions',
        '15% platform fee',
      ],
    },
    {
      id: 'CLIENT_BUSINESS',
      name: 'Client Business',
      price: 29.99,
      period: 'month',
      role: 'CLIENT',
      color: 'indigo',
      fee: '10% platform fee',
      cta: 'Upgrade to Business',
      features: [
        'Unlimited job posts',
        '10% platform fee (save 5%)',
        'Priority worker matching',
        'Dedicated support',
        'Team billing',
      ],
    },
  ];

  visiblePlans() {
    return this.plans.filter((p) => p.role === this.view());
  }

  ngOnInit() {
    const role = this.auth.user()?.role;
    if (role === 'CLIENT') this.view.set('CLIENT');
  }

  selectPlan(plan: Plan) {
    if (plan.id === 'worker_free' || plan.id === 'client_free') return;

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/pricing' } });
      return;
    }

    this.loading.set(plan.id);
    this.error.set(null);

    this.api.createCheckoutSession(plan.id).subscribe({
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
