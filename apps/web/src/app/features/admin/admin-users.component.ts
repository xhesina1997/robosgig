import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
            <a class="nav-link active" routerLink="/admin/users">Users</a>
            <a class="nav-link" routerLink="/admin/subscriptions">Subscriptions</a>
            <a class="nav-link" routerLink="/admin/chats">Chats</a>
            <a class="nav-link" routerLink="/admin/verifications">Verifications</a>
            <a class="nav-link" routerLink="/admin/reports">Reports</a>
          </nav>
        </div>
      </div>

      <div class="page-header">
        <div class="inner">
          <div class="header-row">
            <div>
              <h1 class="page-title">Users</h1>
              <p class="page-sub">{{ filtered().length }} of {{ users().length }} users</p>
            </div>
            <div class="filters">
              <input class="search" [(ngModel)]="search" placeholder="Search name or email…" />
              <div class="role-pills">
                @for (r of roles; track r.value) {
                  <button class="role-pill" [class.active]="roleFilter() === r.value" (click)="roleFilter.set(r.value)">{{ r.label }}</button>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="inner">
        @if (loading()) {
          <div class="empty">Loading…</div>
        } @else if (filtered().length === 0) {
          <div class="empty">No users found</div>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Location</th>
                <th>Plan</th>
                <th>Jobs</th>
                <th>Rating</th>
                <th>Verified</th>
                <th>Messages</th>
                <th>Reports</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              @for (u of filtered(); track u.id) {
                <tr>
                  <td>
                    <div class="user-cell">
                      <div class="avatar">{{ initials(u) }}</div>
                      <div>
                        <div class="u-name">{{ fullName(u) }}</div>
                        <div class="u-email">{{ u.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="badge" [class.worker]="u.role==='WORKER'" [class.admin]="u.role==='ADMIN'">{{ u.role }}</span></td>
                  <td class="muted">{{ city(u) || '—' }}</td>
                  <td>
                    @if (u.subscription?.isActive) {
                      <span class="plan-badge">{{ planLabel(u.subscription.planType) }}</span>
                    } @else { <span class="muted">Free</span> }
                  </td>
                  <td>{{ u.workerProfile?.totalJobs ?? u._count?.jobsPosted ?? 0 }}</td>
                  <td>
                    @if (u.workerProfile?.rating) {
                      <span class="rating">★ {{ u.workerProfile.rating | number:'1.1-1' }}</span>
                    } @else { <span class="muted">—</span> }
                  </td>
                  <td class="center">
                    @if (u.idVerified) { <span class="verified">✓</span> } @else { <span class="muted">—</span> }
                  </td>
                  <td class="center muted">{{ u._count?.messages ?? 0 }}</td>
                  <td class="center">
                    @if (u._count?.reports > 0) {
                      <span class="report-count">{{ u._count.reports }}</span>
                    } @else { <span class="muted">—</span> }
                  </td>
                  <td class="muted small">{{ u.createdAt | date:'d MMM y' }}</td>
                </tr>
              }
            </tbody>
          </table>
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
    .page-header { background: #fff; border-bottom: 1px solid #e4e4e7; padding: 1.5rem 0; }
    .inner { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
    .header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap; }
    .page-title { font-size: 1.4rem; font-weight: 800; color: #18181b; margin: 0 0 0.15rem; letter-spacing: -0.02em; }
    .page-sub { font-size: 0.82rem; color: #71717a; margin: 0; }
    .filters { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .search { padding: 0.45rem 0.75rem; border: 1.5px solid #e4e4e7; border-radius: 8px; font-size: 0.82rem; outline: none; min-width: 220px; }
    .search:focus { border-color: #18181b; }
    .role-pills { display: flex; gap: 0.3rem; }
    .role-pill { padding: 0.3rem 0.7rem; border-radius: 999px; border: 1.5px solid #e4e4e7; background: #fafafa; font-size: 0.75rem; font-weight: 600; color: #52525b; cursor: pointer; transition: all 0.15s; }
    .role-pill.active { background: #18181b; color: #fff; border-color: #18181b; }
    .empty { padding: 4rem; text-align: center; color: #71717a; }
    .table { width: 100%; border-collapse: collapse; font-size: 0.82rem; margin: 1.5rem 0; background: #fff; border-radius: 14px; overflow: hidden; border: 1.5px solid #e4e4e7; }
    .table th { padding: 0.65rem 1rem; text-align: left; font-size: 0.7rem; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.04em; background: #fafafa; border-bottom: 1px solid #f0f0f0; }
    .table td { padding: 0.7rem 1rem; border-bottom: 1px solid #f9f9f9; color: #3f3f46; vertical-align: middle; }
    .table tbody tr:hover { background: #fafafa; }
    .table tbody tr:last-child td { border-bottom: none; }
    .user-cell { display: flex; align-items: center; gap: 0.6rem; }
    .avatar { width: 30px; height: 30px; border-radius: 50%; background: #18181b; color: #fff; font-size: 0.62rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .u-name { font-weight: 600; color: #18181b; }
    .u-email { font-size: 0.7rem; color: #a1a1aa; }
    .badge { padding: 0.15rem 0.55rem; border-radius: 999px; font-size: 0.68rem; font-weight: 700; background: #f4f4f5; color: #52525b; }
    .badge.worker { background: #dbeafe; color: #1d4ed8; }
    .badge.admin { background: #fef3c7; color: #92400e; }
    .plan-badge { padding: 0.15rem 0.55rem; border-radius: 999px; font-size: 0.68rem; font-weight: 700; background: #ccfbf1; color: #0d9488; }
    .rating { color: #d97706; font-weight: 600; }
    .verified { color: #16a34a; font-weight: 700; }
    .report-count { background: #fee2e2; color: #dc2626; padding: 0.1rem 0.45rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; }
    .muted { color: #a1a1aa; }
    .small { font-size: 0.75rem; }
    .center { text-align: center; }
  `],
})
export class AdminUsersComponent implements OnInit {
  private api = inject(ApiService);

  users = signal<any[]>([]);
  loading = signal(true);
  search = '';
  roleFilter = signal<string>('ALL');

  roles = [
    { label: 'All', value: 'ALL' },
    { label: 'Clients', value: 'CLIENT' },
    { label: 'Workers', value: 'WORKER' },
  ];

  filtered = computed(() => {
    const q = this.search.toLowerCase();
    return this.users().filter(u => {
      const name = this.fullName(u).toLowerCase();
      const matchSearch = !q || name.includes(q) || u.email.toLowerCase().includes(q);
      const matchRole = this.roleFilter() === 'ALL' || u.role === this.roleFilter();
      return matchSearch && matchRole;
    });
  });

  ngOnInit() {
    this.api.getAdminUsers().subscribe({
      next: (d) => { this.users.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  fullName(u: any) {
    const p = u.workerProfile ?? u.clientProfile;
    return p ? `${p.firstName} ${p.lastName}` : u.email;
  }

  initials(u: any) {
    const p = u.workerProfile ?? u.clientProfile;
    return p ? `${p.firstName[0]}${p.lastName[0]}`.toUpperCase() : u.email[0].toUpperCase();
  }

  city(u: any) { return (u.workerProfile ?? u.clientProfile)?.city; }

  planLabel(plan: string) {
    return plan === 'WORKER_PRO' ? 'Worker Pro' : plan === 'CLIENT_BUSINESS' ? 'Client Biz' : plan;
  }
}
