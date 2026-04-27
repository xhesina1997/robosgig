import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/services/api.service';
import { environment } from '../../environments/environment';
import { loadStripe } from '@stripe/stripe-js';

@Component({
  selector: 'app-verify-identity',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (status() === 'VERIFIED') {
      <div class="verified-badge">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        ID Verified
      </div>
    } @else {
      <div class="verify-box">
        <div class="verify-head">
          <div class="verify-icon">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="13" x2="12" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
          </div>
          <div>
            <p class="verify-title">Verify your identity</p>
            <p class="verify-sub">Build trust with {{ isWorker() ? 'clients' : 'workers' }} by verifying your ID</p>
          </div>
        </div>

        @if (status() === 'PENDING') {
          <div class="status-pill pending">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 5v5l3 3-1.5 1.5L10 13V7h2z"/></svg>
            Under review — Stripe is processing your documents
          </div>
        } @else if (status() === 'REJECTED') {
          <div class="status-pill rejected">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Verification failed — please try again
          </div>
        }

        @if (status() !== 'PENDING') {
          <div class="stripe-info">
            <svg width="14" height="14" fill="none" stroke="#6b7280" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            <span>Powered by <strong>Stripe Identity</strong> — your documents are never stored on our servers</span>
          </div>

          @if (error()) {
            <p class="error-msg">{{ error() }}</p>
          }

          <button class="verify-btn" [disabled]="loading()" (click)="startVerification()">
            @if (loading()) {
              <span class="spinner"></span> Opening verification…
            } @else {
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              {{ status() === 'REJECTED' ? 'Retry verification' : 'Verify my identity' }}
            }
          </button>
        }
      </div>
    }
  `,
  styles: [`
    .verified-badge {
      display: inline-flex; align-items: center; gap: 0.375rem;
      background: #dcfce7; color: #166534;
      font-size: 0.8rem; font-weight: 600; padding: 0.35rem 0.75rem; border-radius: 99px;
    }

    .verify-box {
      background: #fafafa; border: 1.5px dashed #e4e4e7;
      border-radius: 14px; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem;
    }
    .verify-head { display: flex; align-items: flex-start; gap: 0.875rem; }
    .verify-icon {
      width: 38px; height: 38px; background: #f4f4f5; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #52525b;
    }
    .verify-title { font-size: 0.9rem; font-weight: 600; color: #18181b; margin: 0 0 0.2rem; }
    .verify-sub { font-size: 0.8rem; color: #71717a; margin: 0; }

    .status-pill {
      display: inline-flex; align-items: center; gap: 0.375rem;
      font-size: 0.8rem; font-weight: 500; padding: 0.4rem 0.75rem; border-radius: 8px;
    }
    .status-pill.pending  { background: #fef3c7; color: #92400e; }
    .status-pill.rejected { background: #fee2e2; color: #991b1b; }

    .stripe-info {
      display: flex; align-items: flex-start; gap: 0.5rem;
      font-size: 0.75rem; color: #6b7280; line-height: 1.5;
      background: #f9fafb; border: 1px solid #e5e7eb;
      border-radius: 8px; padding: 0.6rem 0.75rem;
    }
    .stripe-info svg { flex-shrink: 0; margin-top: 1px; }

    .error-msg { font-size: 0.8rem; color: #dc2626; margin: 0; }

    .verify-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
      background: #18181b; color: #fff; border: none;
      padding: 0.6rem 1.5rem; border-radius: 99px;
      font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: inherit;
      transition: background 0.15s; align-self: flex-start;
    }
    .verify-btn:hover:not(:disabled) { background: #3f3f46; }
    .verify-btn:disabled { opacity: 0.55; cursor: not-allowed; }

    .spinner {
      width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff; border-radius: 50%;
      animation: spin 0.7s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class VerifyIdentityComponent implements OnInit {
  private api = inject(ApiService);

  status = signal<'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('NONE');
  isWorker = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.api.getVerifyStatus().subscribe({
      next: (data) => {
        if (data.idVerified) {
          this.status.set('VERIFIED');
        } else if (data.verification) {
          this.status.set(data.verification.status as 'PENDING' | 'VERIFIED' | 'REJECTED');
        }
      },
    });
  }

  async startVerification() {
    this.loading.set(true);
    this.error.set(null);

    this.api.createVerifySession().subscribe({
      next: async ({ clientSecret }: { clientSecret: string }) => {
        try {
          const stripe = await loadStripe(environment.stripePublicKey);
          if (!stripe) throw new Error('Stripe failed to load');

          const { error } = await stripe.verifyIdentity(clientSecret);

          if (error) {
            this.error.set(error.message ?? 'Verification cancelled.');
          } else {
            this.status.set('PENDING');
          }
        } catch (e: unknown) {
          this.error.set((e as Error)?.message ?? 'Something went wrong. Please try again.');
        }
        this.loading.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(err?.error?.message ?? 'Could not start verification. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
