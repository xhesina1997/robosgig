import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

interface ReportEntry {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    role: string;
    workerProfile: { firstName: string; lastName: string } | null;
    clientProfile: { firstName: string; lastName: string } | null;
  };
}

@Component({
  selector: 'app-admin-reports',
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
            <a class="nav-link" routerLink="/admin/verifications">Verifications</a>
            <a class="nav-link active" routerLink="/admin/reports">Reports</a>
          </nav>
        </div>
      </div>
      <div class="page-header">
        <div class="inner">
          <div class="header-top">
            <div>
              <h1 class="page-title">Problem Reports</h1>
              <p class="page-sub">User-submitted issues requiring review</p>
            </div>
            <div class="header-stats">
              <div class="stat-pill stat-open">{{ countByStatus('OPEN') }} Open</div>
              <div class="stat-pill stat-review">{{ countByStatus('IN_REVIEW') }} In review</div>
            </div>
          </div>
          <div class="tabs">
            @for (tab of tabs; track tab.value) {
              <button class="tab" [class.active]="activeTab() === tab.value" (click)="activeTab.set(tab.value)">
                {{ tab.label }}
                @if (countByStatus(tab.value) > 0) {
                  <span class="tab-badge" [class.open]="tab.value === 'OPEN'" [class.review]="tab.value === 'IN_REVIEW'">{{ countByStatus(tab.value) }}</span>
                }
              </button>
            }
          </div>
        </div>
      </div>

      <div class="inner">
        @if (loading()) {
          <div class="empty-state">Loading…</div>
        } @else if (filtered().length === 0) {
          <div class="empty-state">No {{ activeTab().toLowerCase().replace('_', ' ') }} reports</div>
        } @else {
          <div class="report-list">
            @for (r of filtered(); track r.id) {
              <div class="report-card" [class.open]="r.status === 'OPEN'" [class.resolved]="r.status === 'RESOLVED'" [class.dismissed]="r.status === 'DISMISSED'">
                <div class="report-head">
                  <div class="report-meta">
                    <span class="category-badge">{{ categoryLabel(r.category) }}</span>
                    <span class="report-subject">{{ r.subject }}</span>
                  </div>
                  <span class="status-badge" [class]="'status-' + r.status.toLowerCase()">{{ r.status.replace('_', ' ') }}</span>
                </div>

                <p class="report-desc">{{ r.description }}</p>

                <div class="report-footer">
                  <div class="reporter-info">
                    <div class="avatar">{{ initials(r) }}</div>
                    <div>
                      <span class="reporter-name">{{ fullName(r) }}</span>
                      <span class="reporter-email">{{ r.user.email }}</span>
                    </div>
                    <span class="role-badge" [class.worker]="r.user.role === 'WORKER'">{{ r.user.role }}</span>
                  </div>
                  <span class="report-date">{{ r.createdAt | date:'d MMM y, HH:mm' }}</span>
                </div>

                @if (r.adminNotes) {
                  <div class="admin-notes">
                    <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    {{ r.adminNotes }}
                  </div>
                }

                <div class="report-actions">
                  @if (expandedId() === r.id) {
                    <div class="notes-edit">
                      <textarea class="notes-input" [(ngModel)]="editNotes" rows="2" placeholder="Add internal note (optional)…"></textarea>
                      <div class="notes-btns">
                        <button class="action-btn" (click)="expandedId.set(null)">Cancel</button>
                        @if (r.status !== 'IN_REVIEW') {
                          <button class="action-btn accent" (click)="setStatus(r, 'IN_REVIEW')">Mark in review</button>
                        }
                        @if (r.status !== 'RESOLVED') {
                          <button class="action-btn green" (click)="setStatus(r, 'RESOLVED')">Resolve</button>
                        }
                        @if (r.status !== 'DISMISSED') {
                          <button class="action-btn muted" (click)="setStatus(r, 'DISMISSED')">Dismiss</button>
                        }
                        @if (r.status !== 'OPEN') {
                          <button class="action-btn" (click)="setStatus(r, 'OPEN')">Reopen</button>
                        }
                      </div>
                    </div>
                  } @else {
                    <button class="manage-btn" (click)="openManage(r)">Manage</button>
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
    .page { min-height: 100vh; background: #f9f9f9; }
    .admin-nav { background: #18181b; padding: 0 1.5rem; }
    .nav-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; gap: 2rem; height: 48px; }
    .nav-brand { color: #fff; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; display: flex; align-items: center; gap: 0.4rem; }
    .nav-links { display: flex; }
    .nav-link { color: #a1a1aa; font-size: 0.82rem; font-weight: 500; text-decoration: none; padding: 0 0.85rem; height: 48px; display: flex; align-items: center; border-bottom: 2px solid transparent; transition: color 0.15s; }
    .nav-link:hover { color: #e4e4e7; }
    .nav-link.active { color: #fff; border-bottom-color: #fff; }
    .page-header { background: #fff; border-bottom: 1px solid #e4e4e7; padding: 1.5rem 0 0; }
    .inner { max-width: 860px; margin: 0 auto; padding: 0 1.5rem; }
    .header-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
    .page-title { font-size: 1.4rem; font-weight: 800; color: #18181b; margin: 0 0 0.2rem; letter-spacing: -0.02em; }
    .page-sub { font-size: 0.85rem; color: #71717a; margin: 0; }
    .header-stats { display: flex; gap: 0.5rem; flex-shrink: 0; margin-top: 0.25rem; }
    .stat-pill {
      padding: 0.25rem 0.75rem; border-radius: 999px;
      font-size: 0.75rem; font-weight: 600;
    }
    .stat-open { background: #fef3c7; color: #92400e; }
    .stat-review { background: #dbeafe; color: #1e40af; }
    .tabs { display: flex; gap: 0; border-top: 1px solid #f0f0f0; margin: 0 -1.5rem; padding: 0 1.5rem; }
    .tab {
      display: flex; align-items: center; gap: 0.4rem;
      padding: 0.7rem 1rem; background: none; border: none;
      font-size: 0.85rem; font-weight: 500; color: #71717a;
      cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px;
      transition: color 0.15s;
    }
    .tab:hover { color: #18181b; }
    .tab.active { color: #18181b; font-weight: 700; border-bottom-color: #18181b; }
    .tab-badge {
      padding: 0.1rem 0.45rem; border-radius: 999px;
      font-size: 0.7rem; font-weight: 700;
      background: #e4e4e7; color: #52525b;
    }
    .tab-badge.open { background: #fef3c7; color: #92400e; }
    .tab-badge.review { background: #dbeafe; color: #1e40af; }
    .empty-state { padding: 4rem 0; text-align: center; color: #71717a; font-size: 0.9rem; }
    .report-list { display: flex; flex-direction: column; gap: 0.75rem; padding: 1.5rem 0; }
    .report-card {
      background: #fff; border: 1.5px solid #e4e4e7; border-radius: 14px;
      padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem;
    }
    .report-card.open { border-left: 3px solid #f59e0b; }
    .report-card.resolved { border-left: 3px solid #22c55e; }
    .report-card.dismissed { border-left: 3px solid #d1d5db; opacity: 0.7; }
    .report-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
    .report-meta { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
    .category-badge {
      padding: 0.15rem 0.6rem; border-radius: 999px;
      background: #f4f4f5; color: #52525b;
      font-size: 0.72rem; font-weight: 600; text-transform: capitalize;
      white-space: nowrap;
    }
    .report-subject { font-size: 0.9rem; font-weight: 700; color: #18181b; }
    .status-badge {
      padding: 0.2rem 0.65rem; border-radius: 999px;
      font-size: 0.72rem; font-weight: 700;
      white-space: nowrap; text-transform: capitalize;
    }
    .status-open { background: #fef3c7; color: #92400e; }
    .status-in_review { background: #dbeafe; color: #1e40af; }
    .status-resolved { background: #dcfce7; color: #15803d; }
    .status-dismissed { background: #f4f4f5; color: #71717a; }
    .report-desc { font-size: 0.85rem; color: #52525b; line-height: 1.6; margin: 0; }
    .report-footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .reporter-info { display: flex; align-items: center; gap: 0.6rem; }
    .avatar {
      width: 28px; height: 28px; border-radius: 50%;
      background: #18181b; color: #fff;
      font-size: 0.65rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .reporter-name { font-size: 0.8rem; font-weight: 600; color: #18181b; display: block; }
    .reporter-email { font-size: 0.72rem; color: #71717a; display: block; }
    .role-badge {
      padding: 0.15rem 0.5rem; border-radius: 6px;
      background: #f4f4f5; color: #71717a;
      font-size: 0.68rem; font-weight: 600;
    }
    .role-badge.worker { background: #eff6ff; color: #1d4ed8; }
    .report-date { font-size: 0.75rem; color: #a1a1aa; white-space: nowrap; }
    .admin-notes {
      display: flex; align-items: flex-start; gap: 0.4rem;
      font-size: 0.78rem; color: #52525b;
      background: #f9f9f9; border-radius: 8px; padding: 0.5rem 0.75rem;
    }
    .report-actions { border-top: 1px solid #f4f4f5; padding-top: 0.75rem; }
    .manage-btn {
      padding: 0.35rem 0.85rem; border-radius: 8px;
      border: 1.5px solid #e4e4e7; background: #fafafa;
      font-size: 0.78rem; font-weight: 600; color: #3f3f46;
      cursor: pointer; transition: all 0.15s;
    }
    .manage-btn:hover { border-color: #18181b; color: #18181b; }
    .notes-edit { display: flex; flex-direction: column; gap: 0.5rem; }
    .notes-input {
      width: 100%; padding: 0.5rem 0.65rem;
      border: 1.5px solid #e4e4e7; border-radius: 8px;
      font-size: 0.8rem; color: #18181b; background: #fafafa;
      font-family: inherit; resize: vertical; outline: none; box-sizing: border-box;
    }
    .notes-input:focus { border-color: #18181b; background: #fff; }
    .notes-btns { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    .action-btn {
      padding: 0.3rem 0.75rem; border-radius: 8px;
      border: 1.5px solid #e4e4e7; background: #fafafa;
      font-size: 0.78rem; font-weight: 600; color: #3f3f46;
      cursor: pointer; transition: all 0.15s;
    }
    .action-btn:hover { background: #f4f4f5; }
    .action-btn.accent { border-color: #3b82f6; color: #1d4ed8; background: #eff6ff; }
    .action-btn.green { border-color: #22c55e; color: #15803d; background: #dcfce7; }
    .action-btn.muted { border-color: #d1d5db; color: #9ca3af; }
  `],
})
export class AdminReportsComponent implements OnInit {
  private api = inject(ApiService);

  reports = signal<ReportEntry[]>([]);
  loading = signal(true);
  activeTab = signal<string>('OPEN');
  expandedId = signal<string | null>(null);
  editNotes = '';

  tabs = [
    { label: 'Open', value: 'OPEN' },
    { label: 'In review', value: 'IN_REVIEW' },
    { label: 'Resolved', value: 'RESOLVED' },
    { label: 'Dismissed', value: 'DISMISSED' },
  ];

  filtered = computed(() => this.reports().filter(r => r.status === this.activeTab()));

  countByStatus(status: string) {
    return this.reports().filter(r => r.status === status).length;
  }

  ngOnInit() {
    this.api.getAdminReports().subscribe({
      next: (data) => { this.reports.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  fullName(r: ReportEntry) {
    const p = r.user.workerProfile ?? r.user.clientProfile;
    return p ? `${p.firstName} ${p.lastName}` : r.user.email;
  }

  initials(r: ReportEntry) {
    const p = r.user.workerProfile ?? r.user.clientProfile;
    if (p) return `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();
    return r.user.email[0].toUpperCase();
  }

  categoryLabel(cat: string) {
    const map: Record<string, string> = {
      payment: 'Payment', worker: 'Worker', client: 'Client',
      technical: 'Technical', other: 'Other',
    };
    return map[cat] ?? cat;
  }

  openManage(r: ReportEntry) {
    this.editNotes = r.adminNotes ?? '';
    this.expandedId.set(r.id);
  }

  setStatus(r: ReportEntry, status: string) {
    this.api.updateReportStatus(r.id, status, this.editNotes.trim() || undefined).subscribe({
      next: (updated: any) => {
        this.reports.update(list => list.map(x => x.id === r.id ? { ...x, status: updated.status, adminNotes: updated.adminNotes } : x));
        this.expandedId.set(null);
      },
    });
  }
}
