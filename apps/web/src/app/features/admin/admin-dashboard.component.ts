import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DecimalPipe],
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
            <a class="nav-link active" routerLink="/admin/dashboard">Dashboard</a>
            <a class="nav-link" routerLink="/admin/users">Users</a>
            <a class="nav-link" routerLink="/admin/subscriptions">Subscriptions</a>
            <a class="nav-link" routerLink="/admin/chats">Chats</a>
            <a class="nav-link" routerLink="/admin/verifications">Verifications</a>
            <a class="nav-link" routerLink="/admin/payouts">Payouts</a>
            <a class="nav-link" routerLink="/admin/reports">
              Reports
              @if (data()?.reports?.open > 0) {
                <span class="nav-badge">{{ data()?.reports?.open }}</span>
              }
            </a>
          </nav>
          <button class="nav-logout" (click)="auth.logout()">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign out
          </button>
        </div>
      </div>

      <div class="inner">
        @if (loading()) {
          <div class="loading-state">Loading dashboard…</div>
        } @else if (data()) {

          <!-- KPI row -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-icon blue">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
              <div class="kpi-body">
                <span class="kpi-value">{{ data().users.total | number }}</span>
                <span class="kpi-label">Total users</span>
                <span class="kpi-sub">+{{ data().users.newThisMonth }} this month</span>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon green">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              </div>
              <div class="kpi-body">
                <span class="kpi-value">{{ data().revenue.total | currency:'EUR':'symbol':'1.0-0' }}</span>
                <span class="kpi-label">Total volume</span>
                <span class="kpi-sub">{{ data().revenue.thisMonth | currency:'EUR':'symbol':'1.0-0' }} this month</span>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon amber">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
              </div>
              <div class="kpi-body">
                <span class="kpi-value">{{ data().revenue.fees | currency:'EUR':'symbol':'1.0-0' }}</span>
                <span class="kpi-label">Platform fees</span>
                <span class="kpi-sub">{{ data().revenue.feesThisMonth | currency:'EUR':'symbol':'1.0-0' }} this month</span>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon purple">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div class="kpi-body">
                <span class="kpi-value">{{ data().jobs.total | number }}</span>
                <span class="kpi-label">Total jobs</span>
                <span class="kpi-sub">{{ data().jobs.completed }} completed</span>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon teal">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>
              </div>
              <div class="kpi-body">
                <span class="kpi-value">{{ data().subscriptions.active | number }}</span>
                <span class="kpi-label">Active subscriptions</span>
                <span class="kpi-sub">{{ subBreakdown() }}</span>
              </div>
            </div>
            <div class="kpi-card" [class.kpi-alert]="data().reports.open > 0">
              <div class="kpi-icon red">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div class="kpi-body">
                <span class="kpi-value">{{ data().reports.open }}</span>
                <span class="kpi-label">Open reports</span>
                <a class="kpi-link" routerLink="/admin/reports">View all →</a>
              </div>
            </div>
          </div>

          <!-- Charts row -->
          <div class="charts-row">

            <!-- Revenue bar chart -->
            <div class="chart-card">
              <div class="chart-title">Revenue — last 6 months</div>
              <div class="bar-chart">
                @for (m of data().revenue.byMonth; track m.month) {
                  <div class="bar-col">
                    <div class="bar-wrap">
                      <div class="bar-fee" [style.height.%]="barPct(m.fees)" title="Fees: €{{ m.fees | number:'1.0-0' }}"></div>
                      <div class="bar-vol" [style.height.%]="barPct(m.revenue - m.fees)" title="Volume: €{{ m.revenue | number:'1.0-0' }}"></div>
                    </div>
                    <span class="bar-label">{{ m.month }}</span>
                  </div>
                }
              </div>
              <div class="chart-legend">
                <span class="legend-dot vol"></span> Volume
                <span class="legend-dot fee"></span> Fees
              </div>
            </div>

            <!-- Job status breakdown -->
            <div class="chart-card">
              <div class="chart-title">Jobs by status</div>
              <div class="status-list">
                @for (s of jobStatuses; track s.key) {
                  <div class="status-row">
                    <div class="status-info">
                      <span class="status-dot" [class]="'dot-' + s.key.toLowerCase()"></span>
                      <span class="status-name">{{ s.label }}</span>
                    </div>
                    <div class="status-bar-wrap">
                      <div class="status-bar" [class]="'bar-' + s.key.toLowerCase()" [style.width.%]="statusPct(s.key)"></div>
                    </div>
                    <span class="status-count">{{ data().jobs.byStatus[s.key] || 0 }}</span>
                  </div>
                }
              </div>

              <div class="chart-title" style="margin-top:1.5rem">Users breakdown</div>
              <div class="user-split">
                <div class="split-item">
                  <span class="split-num">{{ data().users.workers }}</span>
                  <span class="split-label">Workers</span>
                </div>
                <div class="split-divider"></div>
                <div class="split-item">
                  <span class="split-num">{{ data().users.clients }}</span>
                  <span class="split-label">Clients</span>
                </div>
                <div class="split-divider"></div>
                <div class="split-item">
                  <span class="split-num">{{ data().subscriptions.byPlan['WORKER_PRO'] || 0 }}</span>
                  <span class="split-label">Worker Pro</span>
                </div>
                <div class="split-divider"></div>
                <div class="split-item">
                  <span class="split-num">{{ data().subscriptions.byPlan['CLIENT_BUSINESS'] || 0 }}</span>
                  <span class="split-label">Client Biz</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Recent users table -->
          <div class="table-card">
            <div class="table-title">Recent sign-ups</div>
            <table class="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Location</th>
                  <th>Jobs</th>
                  <th>Rating</th>
                  <th>Verified</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                @for (u of data().recentUsers; track u.id) {
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="u-avatar">{{ userInitials(u) }}</div>
                        <div>
                          <div class="u-name">{{ userName(u) }}</div>
                          <div class="u-email">{{ u.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="role-pill" [class.worker]="u.role === 'WORKER'">{{ u.role }}</span></td>
                    <td class="u-city">{{ userCity(u) || '—' }}</td>
                    <td>{{ u.workerProfile?.totalJobs ?? '—' }}</td>
                    <td>
                      @if (u.workerProfile?.rating) {
                        <span class="rating">★ {{ u.workerProfile.rating | number:'1.1-1' }}</span>
                      } @else { — }
                    </td>
                    <td>
                      @if (u.idVerified) {
                        <span class="verified-yes">✓</span>
                      } @else {
                        <span class="verified-no">—</span>
                      }
                    </td>
                    <td class="u-date">{{ u.createdAt | date:'d MMM y' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

        }
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .page { min-height: 100vh; background: #f4f4f5; }

    /* Nav */
    .admin-nav { background: #18181b; padding: 0 1.5rem; }
    .nav-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; gap: 2rem; height: 48px; }
    .nav-brand { color: #fff; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; display: flex; align-items: center; gap: 0.4rem; }
    .nav-links { display: flex; gap: 0; }
    .nav-link { color: #a1a1aa; font-size: 0.82rem; font-weight: 500; text-decoration: none; padding: 0 0.85rem; height: 48px; display: flex; align-items: center; gap: 0.4rem; border-bottom: 2px solid transparent; transition: color 0.15s; }
    .nav-link:hover { color: #e4e4e7; }
    .nav-link.active { color: #fff; border-bottom-color: #fff; }
    .nav-logout { margin-left: auto; display: flex; align-items: center; gap: 0.4rem; background: none; border: 1px solid rgba(255,255,255,0.15); color: #a1a1aa; font-size: 0.78rem; font-weight: 500; padding: 0.3rem 0.75rem; border-radius: 6px; cursor: pointer; height: 30px; font-family: inherit; transition: color 0.15s, border-color 0.15s; white-space: nowrap; }
    .nav-logout:hover { color: #fff; border-color: rgba(255,255,255,0.4); }
    .nav-badge { background: #ef4444; color: #fff; font-size: 0.65rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 999px; }

    .inner { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem; }
    .loading-state { padding: 4rem; text-align: center; color: #71717a; }

    /* KPI */
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    .kpi-card {
      background: #fff; border-radius: 14px; border: 1.5px solid #e4e4e7;
      padding: 1.25rem; display: flex; align-items: flex-start; gap: 1rem;
    }
    .kpi-card.kpi-alert { border-color: #fca5a5; }
    .kpi-icon {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .kpi-icon.blue   { background: #dbeafe; color: #1d4ed8; }
    .kpi-icon.green  { background: #dcfce7; color: #16a34a; }
    .kpi-icon.amber  { background: #fef3c7; color: #d97706; }
    .kpi-icon.purple { background: #f3e8ff; color: #7c3aed; }
    .kpi-icon.teal   { background: #ccfbf1; color: #0d9488; }
    .kpi-icon.red    { background: #fee2e2; color: #dc2626; }
    .kpi-body { display: flex; flex-direction: column; gap: 0.1rem; }
    .kpi-value { font-size: 1.5rem; font-weight: 800; color: #18181b; letter-spacing: -0.03em; line-height: 1; }
    .kpi-label { font-size: 0.8rem; font-weight: 600; color: #52525b; margin-top: 0.2rem; }
    .kpi-sub { font-size: 0.72rem; color: #a1a1aa; }
    .kpi-link { font-size: 0.72rem; color: #2563eb; text-decoration: none; }
    .kpi-link:hover { text-decoration: underline; }

    /* Charts */
    .charts-row { display: grid; grid-template-columns: 1.4fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
    @media (max-width: 800px) { .charts-row { grid-template-columns: 1fr; } }
    .chart-card { background: #fff; border-radius: 14px; border: 1.5px solid #e4e4e7; padding: 1.5rem; }
    .chart-title { font-size: 0.82rem; font-weight: 700; color: #52525b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.25rem; }

    /* Bar chart */
    .bar-chart { display: flex; align-items: flex-end; gap: 0.5rem; height: 140px; }
    .bar-col { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; flex: 1; }
    .bar-wrap { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; width: 100%; height: 120px; gap: 0; }
    .bar-vol { width: 100%; background: #18181b; border-radius: 4px 4px 0 0; min-height: 2px; transition: height 0.4s; }
    .bar-fee { width: 100%; background: #a1a1aa; min-height: 2px; transition: height 0.4s; }
    .bar-label { font-size: 0.65rem; color: #a1a1aa; white-space: nowrap; }
    .chart-legend { display: flex; align-items: center; gap: 1rem; margin-top: 0.75rem; font-size: 0.72rem; color: #71717a; }
    .legend-dot { width: 10px; height: 10px; border-radius: 2px; display: inline-block; margin-right: 0.3rem; }
    .legend-dot.vol { background: #18181b; }
    .legend-dot.fee { background: #a1a1aa; }

    /* Status bars */
    .status-list { display: flex; flex-direction: column; gap: 0.6rem; }
    .status-row { display: flex; align-items: center; gap: 0.75rem; }
    .status-info { display: flex; align-items: center; gap: 0.4rem; min-width: 90px; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .dot-posted { background: #3b82f6; }
    .dot-assigned { background: #8b5cf6; }
    .dot-in_progress { background: #f59e0b; }
    .dot-completed { background: #22c55e; }
    .dot-cancelled { background: #ef4444; }
    .dot-draft { background: #d1d5db; }
    .status-name { font-size: 0.75rem; color: #52525b; text-transform: capitalize; }
    .status-bar-wrap { flex: 1; background: #f4f4f5; border-radius: 999px; height: 6px; overflow: hidden; }
    .status-bar { height: 100%; border-radius: 999px; transition: width 0.4s; }
    .bar-posted { background: #3b82f6; }
    .bar-assigned { background: #8b5cf6; }
    .bar-in_progress { background: #f59e0b; }
    .bar-completed { background: #22c55e; }
    .bar-cancelled { background: #ef4444; }
    .bar-draft { background: #d1d5db; }
    .status-count { font-size: 0.75rem; font-weight: 700; color: #18181b; min-width: 24px; text-align: right; }

    /* User split */
    .user-split { display: flex; gap: 0; align-items: stretch; }
    .split-item { flex: 1; text-align: center; padding: 0.75rem 0; }
    .split-num { display: block; font-size: 1.4rem; font-weight: 800; color: #18181b; letter-spacing: -0.02em; }
    .split-label { font-size: 0.7rem; color: #71717a; font-weight: 500; }
    .split-divider { width: 1px; background: #e4e4e7; margin: 0.5rem 0; }

    /* Table */
    .table-card { background: #fff; border-radius: 14px; border: 1.5px solid #e4e4e7; overflow: hidden; }
    .table-title { font-size: 0.82rem; font-weight: 700; color: #52525b; text-transform: uppercase; letter-spacing: 0.05em; padding: 1.25rem 1.5rem 0; }
    .users-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-top: 1rem; }
    .users-table th { padding: 0.6rem 1rem; text-align: left; font-size: 0.7rem; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #f4f4f5; background: #fafafa; }
    .users-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f9f9f9; color: #3f3f46; vertical-align: middle; }
    .users-table tbody tr:hover { background: #fafafa; }
    .users-table tbody tr:last-child td { border-bottom: none; }
    .user-cell { display: flex; align-items: center; gap: 0.65rem; }
    .u-avatar { width: 30px; height: 30px; border-radius: 50%; background: #18181b; color: #fff; font-size: 0.65rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .u-name { font-weight: 600; color: #18181b; font-size: 0.82rem; }
    .u-email { font-size: 0.72rem; color: #a1a1aa; }
    .u-city { color: #71717a; font-size: 0.78rem; }
    .u-date { color: #a1a1aa; font-size: 0.75rem; white-space: nowrap; }
    .role-pill { padding: 0.15rem 0.55rem; border-radius: 999px; font-size: 0.68rem; font-weight: 700; background: #f4f4f5; color: #52525b; }
    .role-pill.worker { background: #dbeafe; color: #1d4ed8; }
    .rating { color: #d97706; font-size: 0.78rem; font-weight: 600; }
    .verified-yes { color: #16a34a; font-weight: 700; }
    .verified-no { color: #d1d5db; }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  data = signal<any>(null);
  loading = signal(true);

  jobStatuses = [
    { key: 'POSTED',      label: 'Posted' },
    { key: 'ASSIGNED',    label: 'Assigned' },
    { key: 'IN_PROGRESS', label: 'In progress' },
    { key: 'COMPLETED',   label: 'Completed' },
    { key: 'CANCELLED',   label: 'Cancelled' },
    { key: 'DRAFT',       label: 'Draft' },
  ];

  ngOnInit() {
    this.api.getAdminDashboard().subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  subBreakdown() {
    const p = this.data()?.subscriptions?.byPlan ?? {};
    const parts = [];
    if (p['WORKER_PRO']) parts.push(`${p['WORKER_PRO']} Pro`);
    if (p['CLIENT_BUSINESS']) parts.push(`${p['CLIENT_BUSINESS']} Biz`);
    return parts.join(' · ') || 'None active';
  }

  barPct(val: number): number {
    const max = Math.max(...(this.data()?.revenue?.byMonth ?? []).map((m: any) => m.revenue), 1);
    return Math.round((val / max) * 100);
  }

  statusPct(key: string): number {
    const total = this.data()?.jobs?.total || 1;
    return Math.round(((this.data()?.jobs?.byStatus?.[key] ?? 0) / total) * 100);
  }

  userName(u: any) {
    const p = u.workerProfile ?? u.clientProfile;
    return p ? `${p.firstName} ${p.lastName}` : u.email;
  }

  userInitials(u: any) {
    const p = u.workerProfile ?? u.clientProfile;
    return p ? `${p.firstName[0]}${p.lastName[0]}`.toUpperCase() : u.email[0].toUpperCase();
  }

  userCity(u: any) {
    return (u.workerProfile ?? u.clientProfile)?.city;
  }
}
