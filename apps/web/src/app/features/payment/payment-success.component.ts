import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <div class="card">

        @if (state() === 'loading') {
          <div class="spinner-wrap">
            <div class="spinner"></div>
            <p class="msg">Confirming your payment…</p>
          </div>
        }

        @if (state() === 'success') {
          <div class="icon-wrap success">
            <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
          </div>
          <h1 class="title">Payment confirmed!</h1>
          <p class="sub">The job has been marked as completed and the worker will be paid out shortly.</p>
          <div class="detail-row">
            <span class="detail-label">Amount paid</span>
            <span class="detail-val">€{{ result()?.totalAmount?.toFixed(2) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Platform fee ({{ result()?.platformFeePercent }}%)</span>
            <span class="detail-val">€{{ result()?.platformFeeAmount?.toFixed(2) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Worker payout</span>
            <span class="detail-val">€{{ result()?.workerPayout?.toFixed(2) }}</span>
          </div>
          <a routerLink="/dashboard/client" class="btn-primary">Back to my jobs</a>
        }

        @if (state() === 'error') {
          <div class="icon-wrap error">
            <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h1 class="title">Something went wrong</h1>
          <p class="sub">{{ errorMsg() }}</p>
          <a routerLink="/dashboard/client" class="btn-secondary">Go to dashboard</a>
        }

      </div>
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh; background: #f8f8f8;
      display: flex; align-items: center; justify-content: center;
      padding: 2rem;
    }
    .card {
      background: #fff; border-radius: 20px; border: 1px solid #e4e4e7;
      padding: 3rem 2.5rem; max-width: 420px; width: 100%;
      text-align: center; box-shadow: 0 8px 40px rgba(0,0,0,0.06);
      display: flex; flex-direction: column; align-items: center; gap: 1rem;
    }
    .spinner-wrap { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .spinner {
      width: 40px; height: 40px; border: 3px solid #e4e4e7;
      border-top-color: #18181b; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .msg { font-size: 0.9rem; color: #71717a; }

    .icon-wrap {
      width: 72px; height: 72px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .icon-wrap.success { background: #dcfce7; color: #16a34a; }
    .icon-wrap.error   { background: #fee2e2; color: #dc2626; }

    .title { font-size: 1.4rem; font-weight: 700; color: #18181b; margin: 0; }
    .sub   { font-size: 0.9rem; color: #71717a; line-height: 1.6; margin: 0; }

    .detail-row {
      width: 100%; display: flex; justify-content: space-between; align-items: center;
      padding: 0.6rem 0; border-bottom: 1px solid #f4f4f5;
      font-size: 0.875rem;
    }
    .detail-label { color: #71717a; }
    .detail-val   { font-weight: 600; color: #18181b; }

    .btn-primary {
      margin-top: 0.5rem;
      display: inline-flex; align-items: center; justify-content: center;
      background: #18181b; color: #fff; text-decoration: none;
      font-size: 0.9rem; font-weight: 600;
      padding: 0.75rem 2rem; border-radius: 99px;
      transition: background 0.2s;
    }
    .btn-primary:hover { background: #3f3f46; }
    .btn-secondary {
      margin-top: 0.5rem;
      display: inline-flex; align-items: center; justify-content: center;
      color: #18181b; text-decoration: none;
      font-size: 0.9rem; font-weight: 600;
      padding: 0.75rem 2rem; border-radius: 99px;
      border: 1.5px solid #e4e4e7;
      transition: border-color 0.2s;
    }
    .btn-secondary:hover { border-color: #18181b; }
  `],
})
export class PaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  state = signal<'loading' | 'success' | 'error'>('loading');
  result = signal<any>(null);
  errorMsg = signal('');

  ngOnInit() {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    const jobId     = this.route.snapshot.queryParamMap.get('job_id');

    if (!sessionId || !jobId) {
      this.errorMsg.set('Missing payment details. Please go back to your dashboard.');
      this.state.set('error');
      return;
    }

    this.api.confirmJobPayment(jobId, sessionId).subscribe({
      next: (res: any) => {
        this.result.set(res);
        this.state.set('success');
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.message ?? 'Payment confirmation failed. Contact support if you were charged.');
        this.state.set('error');
      },
    });
  }
}
