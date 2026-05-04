import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-payouts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">

      <!-- Admin Nav -->
      <div class="admin-nav">
        <div class="nav-inner">
          <span class="nav-brand">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
            Admin
          </span>
          <nav class="nav-links">
            <a class="nav-link" routerLink="/admin/dashboard">Dashboard</a>
            <a class="nav-link" routerLink="/admin/users">Users</a>
            <a class="nav-link" routerLink="/admin/subscriptions">Subscriptions</a>
            <a class="nav-link" routerLink="/admin/chats">Chats</a>
            <a class="nav-link" routerLink="/admin/verifications">Verifications</a>
            <a class="nav-link active" routerLink="/admin/payouts">Payouts</a>
            <a class="nav-link" routerLink="/admin/reports">Reports</a>
          </nav>
          <button class="nav-logout" (click)="auth.logout()">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign out
          </button>
        </div>
      </div>

      <div class="inner">

        <div class="page-header">
          <h1 class="page-title">Payouts</h1>
        </div>

        <!-- Summary strip -->
        @if (payouts()) {
          <div class="summary-strip">
            <div class="summary-item">
              <span class="summary-val">€{{ totalRevenue().toFixed(2) }}</span>
              <span class="summary-label">Total revenue</span>
            </div>
            <div class="summary-item">
              <span class="summary-val">€{{ totalFees().toFixed(2) }}</span>
              <span class="summary-label">Platform fees collected</span>
            </div>
            <div class="summary-item">
              <span class="summary-val">€{{ pendingPayoutTotal().toFixed(2) }}</span>
              <span class="summary-label">Pending worker payouts</span>
            </div>
            <div class="summary-item">
              <span class="summary-val">€{{ sentPayoutTotal().toFixed(2) }}</span>
              <span class="summary-label">Payouts sent</span>
            </div>
          </div>
        }

        <!-- Fee settings card -->
        <div class="card settings-card">
          <p class="section-label">Fee Configuration</p>
          @if (settings()) {
            <div class="fee-grid">
              <div class="fee-field">
                <label>Default fee (%)</label>
                <input type="number" class="fee-input" [(ngModel)]="feeEdit.default" min="0" max="100" />
              </div>
              <div class="fee-field">
                <label>Worker Pro fee (%)</label>
                <input type="number" class="fee-input" [(ngModel)]="feeEdit.workerPro" min="0" max="100" />
              </div>
              <div class="fee-field">
                <label>Client Business fee (%)</label>
                <input type="number" class="fee-input" [(ngModel)]="feeEdit.clientBusiness" min="0" max="100" />
              </div>
              <div class="fee-save">
                @if (settingsSaved()) { <span class="saved-msg">Saved!</span> }
                <button class="btn-save" (click)="saveSettings()" [disabled]="settingsSaving()">
                  {{ settingsSaving() ? 'Saving…' : 'Save fees' }}
                </button>
              </div>
            </div>
          } @else {
            <div class="loading-row"><div class="ring"></div> Loading…</div>
          }
        </div>

        <!-- Payouts table -->
        <div class="card">
          <div class="table-head-row">
            <p class="section-label" style="margin:0">Worker Payouts</p>
            <div class="filter-tabs">
              <button class="ftab" [class.ftab--on]="showFilter() === 'all'" (click)="showFilter.set('all')">All</button>
              <button class="ftab" [class.ftab--on]="showFilter() === 'pending'" (click)="showFilter.set('pending')">
                Pending
                @if (pendingCount() > 0) { <span class="ftab-badge">{{ pendingCount() }}</span> }
              </button>
              <button class="ftab" [class.ftab--on]="showFilter() === 'sent'" (click)="showFilter.set('sent')">Sent</button>
            </div>
          </div>

          @if (!payouts()) {
            <div class="loading-row"><div class="ring"></div> Loading…</div>
          } @else if (filteredPayouts().length === 0) {
            <div class="empty">No payouts found.</div>
          } @else {
            <div class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th>Worker</th>
                    <th>Job</th>
                    <th>Bank details</th>
                    <th>Total paid</th>
                    <th>Fee ({{ '' }})</th>
                    <th>Worker receives</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of filteredPayouts(); track p.id) {
                    <tr [class.row--sent]="p.payoutSent">
                      <td>
                        <p class="worker-name">{{ p.worker?.name ?? '—' }}</p>
                        <p class="worker-email">{{ p.worker?.email ?? '' }}</p>
                      </td>
                      <td class="job-title">{{ p.jobTitle }}</td>
                      <td>
                        @if (p.worker?.bankIban) {
                          <p class="iban">{{ p.worker.bankIban }}</p>
                          @if (p.worker.bankAccountName) { <p class="bank-name">{{ p.worker.bankAccountName }}</p> }
                          @if (p.worker.bankBic) { <p class="bank-bic">BIC: {{ p.worker.bankBic }}</p> }
                        }
                        @if (p.worker?.paypalEmail) {
                          <p class="payout-method-row">
                            <span class="payout-tag paypal-tag">PayPal</span> {{ p.worker.paypalEmail }}
                          </p>
                        }
                        @if (p.worker?.revolutContact) {
                          <p class="payout-method-row">
                            <span class="payout-tag revolut-tag">Revolut</span> {{ p.worker.revolutContact }}
                          </p>
                        }
                        @if (!p.worker?.bankIban && !p.worker?.paypalEmail && !p.worker?.revolutContact) {
                          <span class="no-bank">No payout method</span>
                        }
                      </td>
                      <td class="amount">€{{ p.totalAmount.toFixed(2) }}</td>
                      <td class="fee">
                        <span class="fee-val">€{{ p.platformFeeAmount.toFixed(2) }}</span>
                        <span class="fee-pct">({{ p.platformFeePercent }}%)</span>
                      </td>
                      <td class="payout-amount">€{{ p.workerPayout.toFixed(2) }}</td>
                      <td class="date">{{ p.completedAt | date:'d MMM y' }}</td>
                      <td>
                        @if (p.status === 'ESCROWED') {
                          <span class="badge badge--escrow">
                            <svg width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                            In escrow
                          </span>
                        } @else if (p.payoutSent) {
                          <span class="badge badge--sent">
                            <svg width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                            Sent {{ p.payoutSentAt | date:'d MMM' }}
                          </span>
                        } @else {
                          <button class="btn-mark" (click)="markSent(p)" [disabled]="marking() === p.id">
                            @if (marking() === p.id) { … }
                            @else { Mark as sent }
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .page { min-height: 100vh; background: #f8f8f8; padding-bottom: 4rem; }
    .inner { max-width: 1100px; margin: 0 auto; padding: 0 2rem; }

    .admin-nav { background: #18181b; padding: 0 1.5rem; }
    .nav-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; gap: 2rem; height: 48px; }
    .nav-brand { color: #fff; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; display: flex; align-items: center; gap: 0.4rem; }
    .nav-links { display: flex; gap: 0; }
    .nav-link { color: #a1a1aa; font-size: 0.82rem; font-weight: 500; text-decoration: none; padding: 0 0.75rem; height: 48px; display: flex; align-items: center; border-bottom: 2px solid transparent; transition: color 0.15s; white-space: nowrap; }
    .nav-link:hover { color: #e4e4e7; }
    .nav-link.active { color: #fff; border-bottom-color: #fff; }
    .nav-logout { margin-left: auto; display: flex; align-items: center; gap: 0.4rem; background: none; border: 1px solid rgba(255,255,255,0.15); color: #a1a1aa; font-size: 0.78rem; font-weight: 500; padding: 0.3rem 0.75rem; border-radius: 6px; cursor: pointer; height: 30px; font-family: inherit; transition: color 0.15s, border-color 0.15s; white-space: nowrap; }
    .nav-logout:hover { color: #fff; border-color: rgba(255,255,255,0.4); }

    .page-header { padding: 2rem 0 1.5rem; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #18181b; letter-spacing: -0.025em; margin: 0; }

    /* Summary */
    .summary-strip {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;
    }
    .summary-item {
      background: #fff; border: 1.5px solid #e4e4e7; border-radius: 14px;
      padding: 1.125rem 1.25rem;
    }
    .summary-val { display: block; font-size: 1.4rem; font-weight: 700; color: #18181b; letter-spacing: -0.025em; }
    .summary-label { font-size: 0.72rem; color: #a1a1aa; font-weight: 500; margin-top: 0.2rem; display: block; }

    /* Cards */
    .card { background: #fff; border: 1.5px solid #e4e4e7; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.25rem; }
    .section-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #a1a1aa; margin: 0 0 1.25rem; }

    /* Fee settings */
    .settings-card { }
    .fee-grid { display: flex; align-items: flex-end; gap: 1.25rem; flex-wrap: wrap; }
    .fee-field { display: flex; flex-direction: column; gap: 0.3rem; }
    .fee-field label { font-size: 0.78rem; font-weight: 600; color: #3f3f46; }
    .fee-input {
      width: 120px; padding: 0.55rem 0.75rem;
      border: 1.5px solid #e4e4e7; border-radius: 10px;
      font-size: 0.9rem; font-family: inherit; color: #18181b;
      outline: none; transition: border-color 0.15s;
    }
    .fee-input:focus { border-color: #4f46e5; }
    .fee-save { display: flex; align-items: center; gap: 0.75rem; }
    .saved-msg { font-size: 0.8rem; color: #16a34a; font-weight: 600; }
    .btn-save {
      background: #4f46e5; color: #fff; border: none;
      padding: 0.55rem 1.25rem; border-radius: 99px;
      font-size: 0.82rem; font-weight: 600; cursor: pointer;
      font-family: inherit; transition: background 0.15s;
    }
    .btn-save:hover:not(:disabled) { background: #4338ca; }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Table header */
    .table-head-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
    .filter-tabs { display: flex; gap: 0.25rem; }
    .ftab {
      background: none; border: none; padding: 0.35rem 0.75rem; border-radius: 99px;
      font-size: 0.78rem; font-weight: 500; color: #71717a; cursor: pointer;
      font-family: inherit; transition: background 0.12s, color 0.12s;
      display: inline-flex; align-items: center; gap: 0.35rem;
    }
    .ftab:hover { background: #f4f4f5; color: #18181b; }
    .ftab--on { background: #18181b; color: #fff; font-weight: 600; }
    .ftab--on:hover { background: #27272a; }
    .ftab-badge {
      background: #ef4444; color: #fff; font-size: 0.6rem; font-weight: 700;
      padding: 0.1rem 0.35rem; border-radius: 99px;
    }

    /* Table */
    .table-wrap { overflow-x: auto; }
    .table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    .table th {
      text-align: left; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.05em;
      text-transform: uppercase; color: #a1a1aa; padding: 0 0.75rem 0.75rem;
      border-bottom: 1px solid #f4f4f5; white-space: nowrap;
    }
    .table td { padding: 0.875rem 0.75rem; border-bottom: 1px solid #f9f9f9; vertical-align: middle; }
    .table tr:last-child td { border-bottom: none; }
    .row--sent td { opacity: 0.55; }

    .worker-name { font-weight: 600; color: #18181b; margin: 0 0 0.15rem; }
    .worker-email { font-size: 0.72rem; color: #a1a1aa; margin: 0; }
    .job-title { font-weight: 500; color: #3f3f46; max-width: 180px; }
    .iban { font-family: monospace; font-size: 0.78rem; color: #18181b; margin: 0 0 0.15rem; letter-spacing: 0.03em; }
    .bank-name { font-size: 0.72rem; color: #71717a; margin: 0 0 0.1rem; }
    .bank-bic { font-size: 0.7rem; color: #a1a1aa; margin: 0; }
    .no-bank { font-size: 0.75rem; color: #f59e0b; font-weight: 500; }
    .amount { font-weight: 700; color: #18181b; white-space: nowrap; }
    .fee { white-space: nowrap; }
    .fee-val { font-weight: 600; color: #dc2626; }
    .fee-pct { font-size: 0.7rem; color: #a1a1aa; margin-left: 0.25rem; }
    .payout-amount { font-weight: 700; color: #16a34a; white-space: nowrap; }
    .date { font-size: 0.75rem; color: #a1a1aa; white-space: nowrap; }

    .badge--escrow {
      display: inline-flex; align-items: center; gap: 0.3rem;
      background: #fef3c7; color: #92400e; font-size: 0.72rem; font-weight: 600;
      padding: 0.25rem 0.6rem; border-radius: 99px;
    }
    .badge--sent {
      display: inline-flex; align-items: center; gap: 0.3rem;
      background: #dcfce7; color: #16a34a; font-size: 0.72rem; font-weight: 600;
      padding: 0.25rem 0.6rem; border-radius: 99px;
    }
    .btn-mark {
      background: #4f46e5; color: #fff; border: none;
      padding: 0.4rem 0.875rem; border-radius: 99px;
      font-size: 0.75rem; font-weight: 600; cursor: pointer;
      font-family: inherit; transition: background 0.15s; white-space: nowrap;
    }
    .btn-mark:hover:not(:disabled) { background: #4338ca; }
    .btn-mark:disabled { opacity: 0.5; cursor: not-allowed; }

    .loading-row { display: flex; align-items: center; gap: 0.75rem; padding: 1.5rem 0; color: #a1a1aa; font-size: 0.84rem; }
    .ring {
      width: 18px; height: 18px; border: 2px solid #e4e4e7;
      border-top-color: #18181b; border-radius: 50%;
      animation: spin 0.8s linear infinite; flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty { padding: 2rem 0; color: #a1a1aa; font-size: 0.84rem; }

    @media (max-width: 768px) {
      .summary-strip { grid-template-columns: repeat(2, 1fr); }
      .inner { padding: 0 1rem; }
    }
  `],
})
export class AdminPayoutsComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  payouts = signal<any[] | null>(null);
  settings = signal<{ feeDefault: number; feeWorkerPro: number; feeClientBusiness: number } | null>(null);
  showFilter = signal<'all' | 'pending' | 'sent'>('all');
  marking = signal<string | null>(null);
  settingsSaving = signal(false);
  settingsSaved = signal(false);

  feeEdit = { default: 15, workerPro: 12, clientBusiness: 10 };

  ngOnInit() {
    this.api.getAdminPayouts().subscribe({ next: (data) => this.payouts.set(data) });
    this.api.getAdminSettings().subscribe({
      next: (s) => {
        this.settings.set(s);
        this.feeEdit.default = s.feeDefault;
        this.feeEdit.workerPro = s.feeWorkerPro;
        this.feeEdit.clientBusiness = s.feeClientBusiness;
      },
    });
  }

  filteredPayouts() {
    const list = this.payouts() ?? [];
    const f = this.showFilter();
    if (f === 'pending') return list.filter(p => !p.payoutSent);
    if (f === 'sent') return list.filter(p => p.payoutSent);
    return list;
  }

  pendingCount() { return (this.payouts() ?? []).filter(p => !p.payoutSent).length; }

  totalRevenue() { return (this.payouts() ?? []).reduce((s: number, p: any) => s + p.totalAmount, 0); }
  totalFees()    { return (this.payouts() ?? []).reduce((s: number, p: any) => s + p.platformFeeAmount, 0); }
  pendingPayoutTotal() { return (this.payouts() ?? []).filter((p: any) => !p.payoutSent).reduce((s: number, p: any) => s + p.workerPayout, 0); }
  sentPayoutTotal()    { return (this.payouts() ?? []).filter((p: any) =>  p.payoutSent).reduce((s: number, p: any) => s + p.workerPayout, 0); }

  markSent(payout: any) {
    this.marking.set(payout.id);
    this.api.markPayoutSent(payout.id).subscribe({
      next: () => {
        this.payouts.update(list => list!.map(p => p.id === payout.id ? { ...p, payoutSent: true, payoutSentAt: new Date().toISOString() } : p));
        this.marking.set(null);
      },
      error: () => this.marking.set(null),
    });
  }

  saveSettings() {
    this.settingsSaving.set(true);
    this.settingsSaved.set(false);
    this.api.updateAdminSettings({
      feeDefault: this.feeEdit.default,
      feeWorkerPro: this.feeEdit.workerPro,
      feeClientBusiness: this.feeEdit.clientBusiness,
    }).subscribe({
      next: (s) => { this.settings.set(s); this.settingsSaving.set(false); this.settingsSaved.set(true); },
      error: () => this.settingsSaving.set(false),
    });
  }
}
