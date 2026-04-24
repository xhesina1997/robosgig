import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-subscription-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="success-page">
      <div class="success-card">
        @if (activating()) {
          <div class="activating">
            <div class="spinner"></div>
            <p class="activating-text">Activating your plan…</p>
          </div>
        } @else if (error()) {
          <div class="state">
            <div class="state-icon-wrap state-icon-red">
              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
            </div>
            <h2>Something went wrong</h2>
            <p>{{ error() }}</p>
            <a routerLink="/pricing" class="cta-btn cta-outline">Back to Pricing</a>
          </div>
        } @else {
          <div class="state">
            <div class="state-icon-wrap state-icon-green">
              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h2>You're all set!</h2>
            <p>Your <strong>{{ planLabel() }}</strong> plan is now active.</p>

            <div class="perks-card">
              @for (perk of perks(); track perk) {
                <div class="perk-row">
                  <span class="perk-check">
                    <svg width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                  </span>
                  <span>{{ perk }}</span>
                </div>
              }
            </div>

            <a [routerLink]="dashboardLink()" class="cta-btn">
              Go to Dashboard
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .success-page {
      min-height: 100vh;
      background: #f5f5f7;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .success-card {
      background: #fff;
      border-radius: 18px;
      padding: 2.5rem 2rem;
      max-width: 440px;
      width: 100%;
      text-align: center;
      border: 1px solid #e5e5ea;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.06);
    }

    /* ── Activating ───────────────────────── */
    .activating {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
      padding: 1rem 0;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 2.5px solid #e5e5ea;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .activating-text { color: #6e6e73; font-size: 0.9rem; margin: 0; }

    /* ── State ────────────────────────────── */
    .state { display: flex; flex-direction: column; align-items: center; }

    .state-icon-wrap {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
    }
    .state-icon-green {
      background: rgba(20,184,166,0.1);
      color: #14b8a6;
      border: 1.5px solid rgba(20,184,166,0.2);
    }
    .state-icon-red {
      background: rgba(255,59,48,0.08);
      color: #ff3b30;
      border: 1.5px solid rgba(255,59,48,0.15);
    }

    h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1d1d1f;
      letter-spacing: -0.02em;
      margin: 0 0 0.5rem;
    }
    p {
      color: #6e6e73;
      font-size: 0.9rem;
      margin: 0 0 1.5rem;
      line-height: 1.5;
    }
    p strong { color: #2563eb; font-weight: 600; }

    /* ── Perks ────────────────────────────── */
    .perks-card {
      background: #f5f5f7;
      border: 1px solid #e5e5ea;
      border-radius: 12px;
      padding: 1rem 1.125rem;
      margin-bottom: 1.75rem;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
    }
    .perk-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.875rem;
      color: #1d1d1f;
    }
    .perk-check {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: rgba(20,184,166,0.12);
      color: #0f766e;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    /* ── CTA ──────────────────────────────── */
    .cta-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #18181b;
      color: #fff;
      text-decoration: none;
      padding: 0.75rem 1.75rem;
      border-radius: 980px;
      font-weight: 600;
      font-size: 0.875rem;
      transition: background 0.15s;
    }
    .cta-btn:hover { background: #27272a; }
    .cta-outline {
      background: transparent;
      color: #1d1d1f;
      border: 1px solid #d2d2d7;
      margin-top: 0.75rem;
    }
    .cta-outline:hover { background: rgba(0,0,0,0.04); }

    .error-state .cta-btn { margin-top: 1rem; }
  `]
})
export class SubscriptionSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private auth = inject(AuthService);

  activating = signal(true);
  error = signal<string | null>(null);
  planLabel = signal('');
  perks = signal<string[]>([]);

  ngOnInit() {
    const plan = this.route.snapshot.queryParamMap.get('plan') ?? '';
    const sessionId = this.route.snapshot.queryParamMap.get('session_id') ?? '';

    if (!plan || !sessionId) {
      this.router.navigate(['/pricing']);
      return;
    }

    this.planLabel.set(plan === 'WORKER_PRO' ? 'Worker Pro' : 'Client Business');
    this.perks.set(
      plan === 'WORKER_PRO'
        ? ['Unlimited job applications', '12% platform fee on earnings', 'Pro badge on your profile', 'Priority in search results']
        : ['Unlimited job posts', '10% platform fee', 'Priority worker matching', 'Dedicated support'],
    );

    this.api.activateSubscription(plan, sessionId).subscribe({
      next: () => this.activating.set(false),
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Could not activate plan. Contact support.');
        this.activating.set(false);
      },
    });
  }

  dashboardLink() {
    return this.auth.isWorker() ? '/dashboard/worker' : '/dashboard/client';
  }
}
