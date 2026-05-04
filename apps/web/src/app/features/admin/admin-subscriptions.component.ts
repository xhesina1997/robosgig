import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-subscriptions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="admin-nav">
        <div class="nav-inner">
          <span class="nav-brand">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
            Admin
          </span>
          <nav class="nav-links">
            <a class="nav-link" routerLink="/admin/dashboard">Dashboard</a>
            <a class="nav-link" routerLink="/admin/users">Users</a>
            <a class="nav-link active" routerLink="/admin/subscriptions">Subscriptions</a>
            <a class="nav-link" routerLink="/admin/chats">Chats</a>
            <a class="nav-link" routerLink="/admin/verifications">Verifications</a>
            <a class="nav-link" routerLink="/admin/payouts">Payouts</a>
            <a class="nav-link" routerLink="/admin/reports">Reports</a>
          </nav>
          <button class="nav-logout" (click)="auth.logout()">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign out
          </button>
        </div>
      </div>

      <div class="page-header">
        <div class="inner">
          <div class="header-row">
            <div>
              <h1 class="page-title">Subscriptions</h1>
              <p class="page-sub">{{ active() }} active · {{ total() }} total</p>
            </div>
            <div class="summary-pills">
              <div class="sum-pill teal">
                <span class="sum-num">{{ countByPlan('WORKER_PRO') }}</span>
                <span class="sum-label">Worker Pro</span>
              </div>
              <div class="sum-pill blue">
                <span class="sum-num">{{ countByPlan('CLIENT_BUSINESS') }}</span>
                <span class="sum-label">Client Biz</span>
              </div>
              <div class="sum-pill green">
                <span class="sum-num">{{ revenue() | currency:'EUR':'symbol':'1.0-0' }}</span>
                <span class="sum-label">Est. MRR</span>
              </div>
            </div>
          </div>
          <div class="tabs">
            @for (t of tabs; track t.value) {
              <button class="tab" [class.active]="activeTab() === t.value" (click)="activeTab.set(t.value)">
                {{ t.label }}
                @if (countByTab(t.value) > 0) {
                  <span class="tab-badge" [class.active-badge]="t.value === 'active'">{{ countByTab(t.value) }}</span>
                }
              </button>
            }
          </div>
        </div>
      </div>

      <div class="inner" style="padding-top:1.5rem">
        @if (loading()) {
          <div class="empty">Loading…</div>
        } @else if (filtered().length === 0) {
          <div class="empty">No {{ activeTab() }} subscriptions</div>
        } @else {
          <div class="sub-list">
            @for (s of filtered(); track s.id) {
              <div class="sub-card" [class.inactive]="!s.isActive">
                <div class="sub-user">
                  <div class="avatar">{{ initials(s) }}</div>
                  <div>
                    <div class="s-name">{{ fullName(s) }}</div>
                    <div class="s-email">{{ s.user.email }}</div>
                  </div>
                  <span class="role-badge" [class.worker]="s.user.role === 'WORKER'">{{ s.user.role }}</span>
                </div>
                <div class="sub-details">
                  <div class="detail-item">
                    <span class="detail-label">Plan</span>
                    <span class="plan-badge" [class.teal]="s.planType === 'WORKER_PRO'" [class.blue]="s.planType === 'CLIENT_BUSINESS'">
                      {{ planLabel(s.planType) }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Status</span>
                    <span class="status-badge" [class.active-status]="s.isActive">{{ s.isActive ? 'Active' : 'Inactive' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Renews</span>
                    <span class="detail-val">{{ s.currentPeriodEnd ? (s.currentPeriodEnd | date:'d MMM y') : '—' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Since</span>
                    <span class="detail-val">{{ s.createdAt | date:'d MMM y' }}</span>
                  </div>
                  @if (s.stripeCustomerId) {
                    <div class="detail-item">
                      <span class="detail-label">Stripe</span>
                      <span class="mono">{{ s.stripeCustomerId }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .page { min-height: 100vh; background: #f4f4f5; }
    .admin-nav { background: #18181b; padding: 0 1.5rem; }
    .nav-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; gap: 2rem; height: 48px; }
    .nav-brand { color: #fff; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; display: flex; align-items: center; gap: 0.4rem; }
    .nav-links { display: flex; }
    .nav-link { color: #a1a1aa; font-size: 0.82rem; font-weight: 500; text-decoration: none; padding: 0 0.75rem; height: 48px; display: flex; align-items: center; border-bottom: 2px solid transparent; transition: color 0.15s; white-space: nowrap; }
    .nav-link:hover { color: #e4e4e7; }
    .nav-link.active { color: #fff; border-bottom-color: #fff; }
    .nav-logout { margin-left: auto; display: flex; align-items: center; gap: 0.4rem; background: none; border: 1px solid rgba(255,255,255,0.15); color: #a1a1aa; font-size: 0.78rem; font-weight: 500; padding: 0.3rem 0.75rem; border-radius: 6px; cursor: pointer; height: 30px; font-family: inherit; transition: color 0.15s, border-color 0.15s; white-space: nowrap; }
    .nav-logout:hover { color: #fff; border-color: rgba(255,255,255,0.4); }
    .page-header { background: #fff; border-bottom: 1px solid #e4e4e7; padding: 1.5rem 0 0; }
    .inner { max-width: 900px; margin: 0 auto; padding: 0 1.5rem; }
    .header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .page-title { font-size: 1.4rem; font-weight: 800; color: #18181b; margin: 0 0 0.15rem; letter-spacing: -0.02em; }
    .page-sub { font-size: 0.82rem; color: #71717a; margin: 0; }
    .summary-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .sum-pill { display: flex; flex-direction: column; align-items: center; padding: 0.5rem 1rem; border-radius: 10px; min-width: 80px; }
    .sum-pill.teal { background: #ccfbf1; }
    .sum-pill.blue { background: #dbeafe; }
    .sum-pill.green { background: #dcfce7; }
    .sum-num { font-size: 1.1rem; font-weight: 800; color: #18181b; }
    .sum-label { font-size: 0.65rem; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.04em; }
    .tabs { display: flex; border-top: 1px solid #f0f0f0; margin: 0 -1.5rem; padding: 0 1.5rem; }
    .tab { display: flex; align-items: center; gap: 0.35rem; padding: 0.65rem 0.9rem; background: none; border: none; font-size: 0.83rem; font-weight: 500; color: #71717a; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 0.15s; }
    .tab:hover { color: #18181b; }
    .tab.active { color: #18181b; font-weight: 700; border-bottom-color: #18181b; }
    .tab-badge { padding: 0.1rem 0.4rem; border-radius: 999px; font-size: 0.68rem; font-weight: 700; background: #f4f4f5; color: #52525b; }
    .tab-badge.active-badge { background: #dcfce7; color: #15803d; }
    .empty { padding: 4rem; text-align: center; color: #71717a; }
    .sub-list { display: flex; flex-direction: column; gap: 0.75rem; padding-bottom: 2rem; }
    .sub-card { background: #fff; border: 1.5px solid #e4e4e7; border-radius: 14px; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
    .sub-card.inactive { opacity: 0.6; }
    .sub-user { display: flex; align-items: center; gap: 0.75rem; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; background: #18181b; color: #fff; font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .s-name { font-weight: 700; color: #18181b; font-size: 0.9rem; }
    .s-email { font-size: 0.75rem; color: #a1a1aa; }
    .role-badge { margin-left: auto; padding: 0.15rem 0.55rem; border-radius: 999px; font-size: 0.68rem; font-weight: 700; background: #f4f4f5; color: #52525b; }
    .role-badge.worker { background: #dbeafe; color: #1d4ed8; }
    .sub-details { display: flex; gap: 1.5rem; flex-wrap: wrap; border-top: 1px solid #f4f4f5; padding-top: 0.75rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.2rem; }
    .detail-label { font-size: 0.68rem; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.04em; }
    .detail-val { font-size: 0.82rem; color: #3f3f46; }
    .plan-badge { padding: 0.2rem 0.65rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; background: #f4f4f5; color: #52525b; }
    .plan-badge.teal { background: #ccfbf1; color: #0d9488; }
    .plan-badge.blue { background: #dbeafe; color: #1d4ed8; }
    .status-badge { font-size: 0.78rem; font-weight: 600; color: #71717a; }
    .status-badge.active-status { color: #16a34a; }
    .mono { font-family: monospace; font-size: 0.72rem; color: #a1a1aa; }
  `],
})
export class AdminSubscriptionsComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  subs = signal<any[]>([]);
  loading = signal(true);
  activeTab = signal<string>('active');

  tabs = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'All', value: 'all' },
  ];

  filtered = computed(() => {
    const t = this.activeTab();
    return this.subs().filter(s =>
      t === 'all' ? true : t === 'active' ? s.isActive : !s.isActive
    );
  });

  total = computed(() => this.subs().length);
  active = computed(() => this.subs().filter(s => s.isActive).length);
  revenue = computed(() => {
    const prices: Record<string, number> = { WORKER_PRO: 19.99, CLIENT_BUSINESS: 29.99 };
    return this.subs().filter(s => s.isActive).reduce((sum, s) => sum + (prices[s.planType] ?? 0), 0);
  });

  ngOnInit() {
    this.api.getAdminSubscriptions().subscribe({
      next: (d) => { this.subs.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  countByPlan(plan: string) { return this.subs().filter(s => s.isActive && s.planType === plan).length; }
  countByTab(t: string) { return t === 'all' ? this.subs().length : t === 'active' ? this.active() : this.subs().length - this.active(); }

  fullName(s: any) {
    const p = s.user.workerProfile ?? s.user.clientProfile;
    return p ? `${p.firstName} ${p.lastName}` : s.user.email;
  }

  initials(s: any) {
    const p = s.user.workerProfile ?? s.user.clientProfile;
    return p ? `${p.firstName[0]}${p.lastName[0]}`.toUpperCase() : s.user.email[0].toUpperCase();
  }

  planLabel(plan: string) {
    return plan === 'WORKER_PRO' ? 'Worker Pro' : plan === 'CLIENT_BUSINESS' ? 'Client Business' : plan;
  }
}
