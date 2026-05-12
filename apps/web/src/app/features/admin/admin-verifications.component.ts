import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface VerificationEntry {
  id: string;
  userId: string;
  stripeSessionId: string | null;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  method: 'STRIPE' | 'MANUAL';
  country: string | null;
  idFrontUrl: string | null;
  idBackUrl: string | null;
  selfieUrl: string | null;
  rejectionReason: string | null;
  documentType: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  user: {
    id: string;
    email: string;
    role: string;
    workerProfile: { firstName: string; lastName: string; avatarUrl: string | null } | null;
    clientProfile: { firstName: string; lastName: string; avatarUrl: string | null } | null;
  };
}

@Component({
  selector: 'app-admin-verifications',
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
            <a class="nav-link" routerLink="/admin/users">Users</a>
            <a class="nav-link" routerLink="/admin/subscriptions">Subscriptions</a>
            <a class="nav-link" routerLink="/admin/chats">Chats</a>
            <a class="nav-link active" routerLink="/admin/verifications">Verifications</a>
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
          <h1 class="page-title">ID Verifications</h1>
          <p class="page-sub">Stripe-supported countries auto-verify; manual submissions wait for your review.</p>
        </div>
      </div>

      <div class="inner">
        <div class="tabs">
          @for (tab of tabs; track tab.value) {
            <button class="tab" [class.active]="activeTab() === tab.value" (click)="activeTab.set(tab.value)">
              {{ tab.label }}
              @if (countByStatus(tab.value) > 0) {
                <span class="tab-badge" [class.pending]="tab.value === 'PENDING'">{{ countByStatus(tab.value) }}</span>
              }
            </button>
          }
        </div>

        @if (loading()) {
          <div class="empty-state">Loading...</div>
        } @else if (filtered().length === 0) {
          <div class="empty-state">No {{ activeTab().toLowerCase() }} verifications</div>
        } @else {
          <div class="cards">
            @for (v of filtered(); track v.id) {
              <div class="card" [class.verified]="v.status === 'VERIFIED'" [class.rejected]="v.status === 'REJECTED'">
                <div class="card-head">
                  <div class="avatar">{{ initials(v) }}</div>
                  <div class="card-meta">
                    <span class="card-name">{{ fullName(v) }}</span>
                    <span class="card-email">{{ v.user.email }}</span>
                    <div class="card-pills">
                      <span class="card-role" [class.worker]="v.user.role === 'WORKER'">{{ v.user.role }}</span>
                      <span class="card-method" [class.manual]="v.method === 'MANUAL'">
                        {{ v.method === 'MANUAL' ? 'Manual' : 'Stripe' }}
                      </span>
                      @if (v.country) {
                        <span class="card-country">{{ v.country }}</span>
                      }
                    </div>
                  </div>
                  <div class="card-status" [class]="'status-' + v.status.toLowerCase()">
                    {{ v.status }}
                  </div>
                </div>

                @if (v.method === 'MANUAL' && (v.idFrontUrl || v.idBackUrl || v.selfieUrl)) {
                  <div class="doc-grid">
                    @if (v.idFrontUrl) {
                      <a class="doc-tile" [href]="v.idFrontUrl" target="_blank" rel="noopener">
                        <img [src]="v.idFrontUrl" alt="ID front"/>
                        <span class="doc-tile-lbl">ID front</span>
                      </a>
                    }
                    @if (v.idBackUrl) {
                      <a class="doc-tile" [href]="v.idBackUrl" target="_blank" rel="noopener">
                        <img [src]="v.idBackUrl" alt="ID back"/>
                        <span class="doc-tile-lbl">ID back</span>
                      </a>
                    }
                    @if (v.selfieUrl) {
                      <a class="doc-tile" [href]="v.selfieUrl" target="_blank" rel="noopener">
                        <img [src]="v.selfieUrl" alt="Selfie"/>
                        <span class="doc-tile-lbl">Selfie</span>
                      </a>
                    }
                  </div>
                }

                <div class="card-info">
                  <span>Submitted: {{ v.submittedAt | date:'dd MMM yyyy, HH:mm' }}</span>
                  @if (v.reviewedAt) {
                    <span>Reviewed: {{ v.reviewedAt | date:'dd MMM yyyy, HH:mm' }}</span>
                  }
                  @if (v.rejectionReason) {
                    <span class="reason">Reason: {{ v.rejectionReason }}</span>
                  }
                  @if (v.stripeSessionId) {
                    <span class="session-id">Session: {{ v.stripeSessionId }}</span>
                  }
                </div>

                @if (v.method === 'MANUAL' && v.status === 'PENDING') {
                  @if (rejectingId() === v.id) {
                    <div class="card-reject-row">
                      <input
                        class="card-reject-input"
                        type="text"
                        placeholder="Reason (shown to the user)"
                        [(ngModel)]="rejectReason"
                        name="rejectReason"
                      />
                      <button class="card-btn card-btn--cancel" (click)="cancelReject()" [disabled]="acting() === v.id" type="button">Cancel</button>
                      <button class="card-btn card-btn--reject" (click)="confirmReject(v.id)" [disabled]="acting() === v.id" type="button">
                        @if (acting() === v.id) { Rejecting… } @else { Confirm reject }
                      </button>
                    </div>
                  } @else {
                    <div class="card-actions">
                      <select class="card-doc-select" [(ngModel)]="approveDocType[v.id]" [name]="'docType-' + v.id">
                        <option value="">Document type…</option>
                        <option value="passport">Passport</option>
                        <option value="id_card">National ID card</option>
                        <option value="driving_license">Driver's licence</option>
                      </select>
                      <button class="card-btn card-btn--reject" (click)="startReject(v.id)" [disabled]="acting() === v.id" type="button">Reject</button>
                      <button class="card-btn card-btn--approve" (click)="approve(v.id)" [disabled]="acting() === v.id || !approveDocType[v.id]" type="button">
                        @if (acting() === v.id) { Approving… } @else { Approve }
                      </button>
                    </div>
                  }
                }

              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #fafafa; }
    .admin-nav { background: #18181b; padding: 0 1.5rem; }
    .nav-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; gap: 2rem; height: 48px; }
    .nav-brand { color: #fff; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; display: flex; align-items: center; gap: 0.4rem; }
    .nav-links { display: flex; }
    .nav-link { color: #a1a1aa; font-size: 0.82rem; font-weight: 500; text-decoration: none; padding: 0 0.85rem; height: 48px; display: flex; align-items: center; border-bottom: 2px solid transparent; transition: color 0.15s; }
    .nav-link:hover { color: #e4e4e7; }
    .nav-link.active { color: #fff; border-bottom-color: #fff; }
    .nav-logout { margin-left: auto; display: flex; align-items: center; gap: 0.4rem; background: none; border: 1px solid rgba(255,255,255,0.15); color: #a1a1aa; font-size: 0.78rem; font-weight: 500; padding: 0.3rem 0.75rem; border-radius: 6px; cursor: pointer; height: 30px; font-family: inherit; transition: color 0.15s, border-color 0.15s; white-space: nowrap; }
    .nav-logout:hover { color: #fff; border-color: rgba(255,255,255,0.4); }
    .page-header { background: #fff; border-bottom: 1px solid #f0f0f0; padding: 2rem 0 1.5rem; }
    .inner { max-width: 900px; margin: 0 auto; padding: 0 1.5rem; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #18181b; margin: 0 0 0.25rem; }
    .page-sub { font-size: 0.875rem; color: #71717a; margin: 0; }

    .tabs { display: flex; gap: 0.25rem; padding: 1.5rem 0 0; border-bottom: 1px solid #f0f0f0; margin-bottom: 1.5rem; }
    .tab {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.5rem 1rem; border: none; background: transparent;
      font-size: 0.875rem; font-weight: 500; color: #71717a;
      cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px;
      transition: color 0.15s; font-family: inherit;
    }
    .tab.active { color: #18181b; border-bottom-color: #18181b; }
    .tab-badge { background: #f4f4f5; color: #71717a; font-size: 0.7rem; font-weight: 600; padding: 0.1rem 0.4rem; border-radius: 99px; }
    .tab-badge.pending { background: #fef3c7; color: #92400e; }

    .empty-state { text-align: center; padding: 4rem 0; color: #a1a1aa; font-size: 0.9rem; }
    .cards { display: flex; flex-direction: column; gap: 1rem; padding-bottom: 3rem; }

    .card { background: #fff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden; }
    .card.verified { border-color: #bbf7d0; }
    .card.rejected { border-color: #fecaca; }

    .card-head { display: flex; align-items: center; gap: 0.875rem; padding: 1.25rem; }
    .avatar {
      width: 42px; height: 42px; border-radius: 50%;
      background: #18181b; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700; flex-shrink: 0;
    }
    .card-meta { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; }
    .card-name { font-size: 0.95rem; font-weight: 600; color: #18181b; }
    .card-email { font-size: 0.8rem; color: #71717a; }
    .card-role { display: inline-block; font-size: 0.7rem; font-weight: 600; background: #f4f4f5; color: #52525b; padding: 0.1rem 0.5rem; border-radius: 99px; width: fit-content; }
    .card-role.worker { background: #dbeafe; color: #1d4ed8; }

    .card-status { font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 99px; }
    .status-pending  { background: #fef3c7; color: #92400e; }
    .status-verified { background: #dcfce7; color: #166534; }
    .status-rejected { background: #fee2e2; color: #991b1b; }

    .card-info { display: flex; flex-wrap: wrap; gap: 0.75rem; padding: 0 1.25rem 1.25rem; font-size: 0.78rem; color: #71717a; }
    .session-id { font-family: monospace; font-size: 0.72rem; color: #a1a1aa; }
    .reason { color: #b91c1c; font-weight: 500; }

    .card-pills { display: inline-flex; gap: 0.35rem; flex-wrap: wrap; margin-top: 0.15rem; }
    .card-method {
      display: inline-flex; align-items: center;
      font-size: 0.68rem; font-weight: 600;
      background: #f4f4f5; color: #52525b;
      padding: 0.1rem 0.5rem; border-radius: 99px;
    }
    .card-method.manual { background: #fef3c7; color: #92400e; }
    .card-country {
      font-size: 0.68rem; font-weight: 600;
      background: #ecfeff; color: #0e7490;
      padding: 0.1rem 0.5rem; border-radius: 99px;
      font-family: monospace;
    }

    .doc-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      padding: 0 1.25rem 1rem;
    }
    @media (max-width: 600px) { .doc-grid { grid-template-columns: 1fr 1fr; } }
    .doc-tile {
      display: block;
      border: 1px solid #e4e4e7;
      border-radius: 10px;
      overflow: hidden;
      text-decoration: none;
      background: #fafafa;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .doc-tile:hover { border-color: #a1a1aa; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .doc-tile img { display: block; width: 100%; height: 110px; object-fit: cover; }
    .doc-tile-lbl {
      display: block;
      padding: 0.35rem 0.6rem;
      font-size: 0.7rem;
      color: #71717a;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      font-weight: 500;
    }

    .card-actions {
      display: flex; gap: 0.5rem; justify-content: flex-end;
      padding: 0 1.25rem 1.25rem;
    }
    .card-reject-row {
      display: flex; gap: 0.5rem; align-items: center;
      padding: 0 1.25rem 1.25rem;
    }
    .card-reject-input {
      flex: 1;
      padding: 0.5rem 0.75rem;
      border: 1px solid #e4e4e7;
      border-radius: 8px;
      font-size: 0.8rem;
      font-family: inherit;
      outline: none;
    }
    .card-reject-input:focus { border-color: #18181b; }

    .card-btn {
      padding: 0.45rem 0.9rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      border: 1px solid transparent;
      transition: background 0.15s;
    }
    .card-btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .card-btn--approve {
      background: #18181b; color: #fff; border-color: #18181b;
    }
    .card-btn--approve:hover:not(:disabled) { background: #3f3f46; }
    .card-btn--reject {
      background: #fff; color: #b91c1c; border-color: #fecaca;
    }
    .card-btn--reject:hover:not(:disabled) { background: #fef2f2; }
    .card-btn--cancel {
      background: #fff; color: #52525b; border-color: #e4e4e7;
    }
    .card-btn--cancel:hover:not(:disabled) { background: #f4f4f5; }

    .card-doc-select {
      margin-right: auto;
      padding: 0.4rem 0.7rem;
      border: 1px solid #e4e4e7;
      border-radius: 8px;
      font-size: 0.8rem;
      font-family: inherit;
      background: #fff;
      color: #18181b;
      outline: none;
      cursor: pointer;
    }
    .card-doc-select:focus { border-color: #18181b; }
  `],
})
export class AdminVerificationsComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  verifications = signal<VerificationEntry[]>([]);
  loading = signal(true);
  activeTab = signal<'PENDING' | 'VERIFIED' | 'REJECTED' | 'ALL'>('PENDING');
  acting = signal<string | null>(null);
  rejectingId = signal<string | null>(null);
  rejectReason = '';
  approveDocType: Record<string, string> = {};

  tabs = [
    { label: 'Pending',  value: 'PENDING'  as const },
    { label: 'Verified', value: 'VERIFIED' as const },
    { label: 'Rejected', value: 'REJECTED' as const },
    { label: 'All',      value: 'ALL'      as const },
  ];

  ngOnInit() {
    this.api.getAdminVerifications().subscribe({
      next: (data: VerificationEntry[]) => { this.verifications.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  filtered() {
    const tab = this.activeTab();
    if (tab === 'ALL') return this.verifications();
    return this.verifications().filter(v => v.status === tab);
  }

  countByStatus(status: string) {
    if (status === 'ALL') return this.verifications().length;
    return this.verifications().filter(v => v.status === status).length;
  }

  fullName(v: VerificationEntry) {
    const p = v.user.workerProfile ?? v.user.clientProfile;
    return p ? `${p.firstName} ${p.lastName}` : v.user.email;
  }

  initials(v: VerificationEntry) {
    const p = v.user.workerProfile ?? v.user.clientProfile;
    return p ? `${p.firstName[0]}${p.lastName[0]}`.toUpperCase() : '?';
  }

  approve(id: string) {
    const docType = this.approveDocType[id] || undefined;
    if (!docType) return;
    this.acting.set(id);
    this.api.approveVerification(id, docType).subscribe({
      next: () => {
        this.verifications.update(list =>
          list.map(v => v.id === id ? { ...v, status: 'VERIFIED' as const, reviewedAt: new Date().toISOString(), documentType: docType } : v),
        );
        this.acting.set(null);
      },
      error: () => this.acting.set(null),
    });
  }

  startReject(id: string) {
    this.rejectingId.set(id);
    this.rejectReason = '';
  }

  cancelReject() {
    this.rejectingId.set(null);
    this.rejectReason = '';
  }

  confirmReject(id: string) {
    this.acting.set(id);
    const reason = this.rejectReason.trim() || undefined;
    this.api.rejectVerification(id, reason).subscribe({
      next: () => {
        this.verifications.update(list =>
          list.map(v => v.id === id ? { ...v, status: 'REJECTED' as const, reviewedAt: new Date().toISOString(), rejectionReason: reason ?? null } : v),
        );
        this.acting.set(null);
        this.rejectingId.set(null);
        this.rejectReason = '';
      },
      error: () => this.acting.set(null),
    });
  }
}
