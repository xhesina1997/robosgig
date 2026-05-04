import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">

      <!-- ── USER DETAIL DRAWER ── -->
      @if (selected()) {
        <div class="drawer-backdrop" (click)="selected.set(null)"></div>
        <div class="drawer">
          <div class="drawer-head">
            <div class="drawer-avatar">{{ initials(selected()) }}</div>
            <div class="drawer-title">
              <span class="drawer-name">{{ fullName(selected()) }}</span>
              <span class="drawer-email">{{ selected().email }}</span>
            </div>
            <button class="drawer-close" (click)="selected.set(null)">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="drawer-body">
            <!-- Badges row -->
            <div class="detail-row">
              <span class="badge" [class.worker]="selected().role==='WORKER'" [class.admin]="selected().role==='ADMIN'">{{ selected().role }}</span>
              @if (selected().subscription?.isActive) {
                <span class="plan-badge">{{ planLabel(selected().subscription.planType) }}</span>
              }
              @if (selected().idVerified) {
                <span class="verified-badge">✓ ID Verified</span>
              }
            </div>

            <!-- Contact info -->
            <div class="section-block">
              <p class="section-label">Contact</p>
              <div class="info-grid">
                <div class="info-item full">
                  <span class="info-key">Email</span>
                  <span class="info-val mono">{{ selected().email }}</span>
                </div>
                @if (phone(selected())) {
                  <div class="info-item full">
                    <span class="info-key">Phone</span>
                    <span class="info-val">{{ phone(selected()) }}</span>
                  </div>
                }
                <div class="info-item">
                  <span class="info-key">User ID</span>
                  <span class="info-val mono small">{{ selected().id }}</span>
                </div>
                <div class="info-item">
                  <span class="info-key">Joined</span>
                  <span class="info-val">{{ selected().createdAt | date:'d MMM yyyy' }}</span>
                </div>
              </div>
            </div>

            <!-- Location -->
            <div class="section-block">
              <p class="section-label">Location</p>
              <div class="info-grid">
                @if (address(selected())) {
                  <div class="info-item full">
                    <span class="info-key">Address</span>
                    <span class="info-val">{{ address(selected()) }}</span>
                  </div>
                }
                <div class="info-item">
                  <span class="info-key">City</span>
                  <span class="info-val">{{ city(selected()) || '—' }}</span>
                </div>
                @if (postalCode(selected())) {
                  <div class="info-item">
                    <span class="info-key">Postal code</span>
                    <span class="info-val">{{ postalCode(selected()) }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Worker profile extras -->
            @if (selected().workerProfile) {
              <div class="section-block">
                <p class="section-label">Worker details</p>
                <div class="info-grid">
                  @if (selected().workerProfile.profession) {
                    <div class="info-item">
                      <span class="info-key">Profession</span>
                      <span class="info-val">{{ selected().workerProfile.profession }}</span>
                    </div>
                  }
                  @if (selected().workerProfile.hourlyRate) {
                    <div class="info-item">
                      <span class="info-key">Hourly rate</span>
                      <span class="info-val">€{{ selected().workerProfile.hourlyRate }}/hr</span>
                    </div>
                  }
                  <div class="info-item">
                    <span class="info-key">Availability</span>
                    <span class="info-val" [class.green]="selected().workerProfile.isAvailable">
                      {{ selected().workerProfile.isAvailable ? 'Available' : 'Unavailable' }}
                    </span>
                  </div>
                  @if (selected().workerProfile.dateOfBirth) {
                    <div class="info-item">
                      <span class="info-key">Date of birth</span>
                      <span class="info-val">{{ selected().workerProfile.dateOfBirth | date:'d MMM yyyy' }}</span>
                    </div>
                  }
                  @if (selected().workerProfile.bio) {
                    <div class="info-item full">
                      <span class="info-key">Bio</span>
                      <span class="info-val bio">{{ selected().workerProfile.bio }}</span>
                    </div>
                  }
                  @if (selected().workerProfile.customSkills?.length) {
                    <div class="info-item full">
                      <span class="info-key">Skills</span>
                      <div class="skills-row">
                        @for (s of selected().workerProfile.customSkills; track s) {
                          <span class="skill-tag">{{ s }}</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Stats -->
            <div class="section-block">
              <p class="section-label">Activity</p>
              <div class="stats-row">
                <div class="stat-box">
                  <span class="stat-val">{{ selected().workerProfile?.totalJobs ?? selected()._count?.jobsPosted ?? 0 }}</span>
                  <span class="stat-key">Jobs</span>
                </div>
                <div class="stat-box">
                  <span class="stat-val">{{ selected()._count?.messages ?? 0 }}</span>
                  <span class="stat-key">Messages</span>
                </div>
                <div class="stat-box">
                  <span class="stat-val" [class.red]="selected()._count?.reports > 0">{{ selected()._count?.reports ?? 0 }}</span>
                  <span class="stat-key">Reports</span>
                </div>
                @if (selected().workerProfile?.rating) {
                  <div class="stat-box">
                    <span class="stat-val amber">★ {{ selected().workerProfile.rating | number:'1.1-1' }}</span>
                    <span class="stat-key">Rating</span>
                  </div>
                }
              </div>
            </div>

            <!-- Subscription -->
            @if (selected().subscription) {
              <div class="section-block">
                <p class="section-label">Subscription</p>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-key">Plan</span>
                    <span class="info-val">{{ planLabel(selected().subscription.planType) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-key">Status</span>
                    <span class="info-val" [class.green]="selected().subscription.isActive">{{ selected().subscription.isActive ? 'Active' : 'Inactive' }}</span>
                  </div>
                  @if (selected().subscription.currentPeriodEnd) {
                    <div class="info-item">
                      <span class="info-key">Renews</span>
                      <span class="info-val">{{ selected().subscription.currentPeriodEnd | date:'d MMM yyyy' }}</span>
                    </div>
                  }
                  @if (selected().subscription.stripeCustomerId) {
                    <div class="info-item full">
                      <span class="info-key">Stripe ID</span>
                      <span class="info-val mono">{{ selected().subscription.stripeCustomerId }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

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
                <tr class="clickable" (click)="selected.set(u)">
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
    .nav-logout { margin-left: auto; display: flex; align-items: center; gap: 0.4rem; background: none; border: 1px solid rgba(255,255,255,0.15); color: #a1a1aa; font-size: 0.78rem; font-weight: 500; padding: 0.3rem 0.75rem; border-radius: 6px; cursor: pointer; height: 30px; font-family: inherit; transition: color 0.15s, border-color 0.15s; white-space: nowrap; }
    .nav-logout:hover { color: #fff; border-color: rgba(255,255,255,0.4); }
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
    .clickable { cursor: pointer; }
    .clickable:hover { background: #f4f4f5 !important; }

    /* ── DRAWER ── */
    .drawer-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.25); z-index: 200; }
    .drawer {
      position: fixed; top: 0; right: 0; height: 100vh; width: 420px;
      background: #fff; border-left: 1px solid #e4e4e7;
      z-index: 201; display: flex; flex-direction: column;
      box-shadow: -8px 0 40px rgba(0,0,0,0.08);
      animation: slideIn 0.22s ease;
    }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

    .drawer-head {
      display: flex; align-items: center; gap: 0.875rem;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid #f0f0f0;
      background: #fafafa;
    }
    .drawer-avatar {
      width: 44px; height: 44px; border-radius: 50%;
      background: #18181b; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.82rem; font-weight: 700; flex-shrink: 0;
    }
    .drawer-title { flex: 1; min-width: 0; }
    .drawer-name { display: block; font-size: 0.95rem; font-weight: 700; color: #18181b; }
    .drawer-email { display: block; font-size: 0.78rem; color: #a1a1aa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .drawer-close {
      width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e4e4e7;
      background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: #71717a; flex-shrink: 0; transition: background 0.15s;
    }
    .drawer-close:hover { background: #f4f4f5; }

    .drawer-body { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }

    .detail-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .verified-badge { padding: 0.15rem 0.55rem; border-radius: 999px; font-size: 0.68rem; font-weight: 700; background: #dcfce7; color: #16a34a; }

    .section-block { display: flex; flex-direction: column; gap: 0.75rem; }
    .section-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #a1a1aa; }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.2rem; }
    .info-item.full { grid-column: 1 / -1; }
    .info-key { font-size: 0.7rem; color: #a1a1aa; font-weight: 500; }
    .info-val { font-size: 0.85rem; color: #18181b; font-weight: 500; }
    .info-val.bio { color: #52525b; line-height: 1.5; font-weight: 400; }
    .info-val.mono { font-family: monospace; font-size: 0.75rem; color: #71717a; word-break: break-all; }
    .info-val.small { font-size: 0.72rem; }
    .skills-row { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.25rem; }
    .skill-tag { font-size: 0.68rem; font-weight: 600; color: #52525b; background: #f4f4f5; border: 1px solid #e4e4e7; padding: 0.15rem 0.55rem; border-radius: 99px; }
    .info-val.green { color: #16a34a; }

    .stats-row { display: flex; gap: 0.75rem; }
    .stat-box {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.2rem;
      background: #f9f9f9; border: 1px solid #f0f0f0; border-radius: 12px; padding: 0.875rem 0.5rem;
    }
    .stat-val { font-size: 1.3rem; font-weight: 800; color: #18181b; letter-spacing: -0.02em; }
    .stat-val.red { color: #dc2626; }
    .stat-val.amber { color: #d97706; }
    .stat-key { font-size: 0.68rem; color: #a1a1aa; font-weight: 500; }
  `],
})
export class AdminUsersComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  users = signal<any[]>([]);
  loading = signal(true);
  search = '';
  roleFilter = signal<string>('ALL');
  selected = signal<any>(null);

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
  phone(u: any) { return (u.workerProfile ?? u.clientProfile)?.phone; }
  address(u: any) { return (u.workerProfile ?? u.clientProfile)?.address; }
  postalCode(u: any) { return (u.workerProfile ?? u.clientProfile)?.postalCode; }

  planLabel(plan: string) {
    return plan === 'WORKER_PRO' ? 'Worker Pro' : plan === 'CLIENT_BUSINESS' ? 'Client Biz' : plan;
  }
}
