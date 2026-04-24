import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

interface VerificationEntry {
  id: string;
  userId: string;
  documentUrl: string;
  selfieUrl: string | null;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionNote: string | null;
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
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="inner">
          <h1 class="page-title">ID Verifications</h1>
          <p class="page-sub">Review and approve identity documents</p>
        </div>
      </div>

      <div class="inner">

        <!-- Filter tabs -->
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

                <!-- User info -->
                <div class="card-head">
                  <div class="avatar">{{ initials(v) }}</div>
                  <div class="card-meta">
                    <span class="card-name">{{ fullName(v) }}</span>
                    <span class="card-email">{{ v.user.email }}</span>
                    <span class="card-role" [class.worker]="v.user.role === 'WORKER'">{{ v.user.role }}</span>
                  </div>
                  <div class="card-status" [class]="'status-' + v.status.toLowerCase()">
                    {{ v.status }}
                  </div>
                </div>

                <!-- Documents -->
                <div class="docs">
                  <div class="doc-box">
                    <p class="doc-label">ID Document</p>
                    <a [href]="v.documentUrl" target="_blank" class="doc-link">
                      <img [src]="v.documentUrl" alt="ID document" class="doc-img" />
                      <span class="doc-overlay">View full size ↗</span>
                    </a>
                  </div>
                  @if (v.selfieUrl) {
                    <div class="doc-box">
                      <p class="doc-label">Selfie</p>
                      <a [href]="v.selfieUrl" target="_blank" class="doc-link">
                        <img [src]="v.selfieUrl" alt="Selfie" class="doc-img" />
                        <span class="doc-overlay">View full size ↗</span>
                      </a>
                    </div>
                  }
                </div>

                <!-- Metadata -->
                <div class="card-info">
                  <span>Submitted: {{ v.submittedAt | date:'dd MMM yyyy, HH:mm' }}</span>
                  @if (v.reviewedAt) {
                    <span>Reviewed: {{ v.reviewedAt | date:'dd MMM yyyy, HH:mm' }}</span>
                  }
                  @if (v.rejectionNote) {
                    <span class="rejection-note">Note: {{ v.rejectionNote }}</span>
                  }
                </div>

                <!-- Actions -->
                @if (v.status === 'PENDING') {
                  <div class="card-actions">
                    <input class="note-input" [(ngModel)]="rejectNotes[v.userId]" placeholder="Rejection reason (optional)" />
                    <div class="btns">
                      <button class="btn-reject" (click)="reject(v.userId)" [disabled]="working()">Reject</button>
                      <button class="btn-approve" (click)="approve(v.userId)" [disabled]="working()">Approve</button>
                    </div>
                  </div>
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
    .tab-badge {
      background: #f4f4f5; color: #71717a;
      font-size: 0.7rem; font-weight: 600; padding: 0.1rem 0.4rem; border-radius: 99px;
    }
    .tab-badge.pending { background: #fef3c7; color: #92400e; }

    .empty-state { text-align: center; padding: 4rem 0; color: #a1a1aa; font-size: 0.9rem; }

    .cards { display: flex; flex-direction: column; gap: 1rem; padding-bottom: 3rem; }

    .card {
      background: #fff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden;
    }
    .card.verified { border-color: #bbf7d0; }
    .card.rejected { border-color: #fecaca; }

    .card-head {
      display: flex; align-items: center; gap: 0.875rem;
      padding: 1.25rem 1.25rem 1rem;
    }
    .avatar {
      width: 42px; height: 42px; border-radius: 50%;
      background: #18181b; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700; flex-shrink: 0;
    }
    .card-meta { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; }
    .card-name { font-size: 0.95rem; font-weight: 600; color: #18181b; }
    .card-email { font-size: 0.8rem; color: #71717a; }
    .card-role {
      display: inline-block; font-size: 0.7rem; font-weight: 600;
      background: #f4f4f5; color: #52525b;
      padding: 0.1rem 0.5rem; border-radius: 99px; width: fit-content;
    }
    .card-role.worker { background: #dbeafe; color: #1d4ed8; }

    .card-status {
      font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 99px;
    }
    .status-pending  { background: #fef3c7; color: #92400e; }
    .status-verified { background: #dcfce7; color: #166534; }
    .status-rejected { background: #fee2e2; color: #991b1b; }

    .docs {
      display: flex; gap: 1rem; padding: 0 1.25rem 1rem;
      flex-wrap: wrap;
    }
    .doc-box { display: flex; flex-direction: column; gap: 0.4rem; }
    .doc-label { font-size: 0.75rem; font-weight: 600; color: #71717a; margin: 0; text-transform: uppercase; letter-spacing: 0.05em; }
    .doc-link { position: relative; display: block; border-radius: 10px; overflow: hidden; border: 1px solid #e4e4e7; }
    .doc-img { width: 220px; height: 140px; object-fit: cover; display: block; }
    .doc-overlay {
      position: absolute; inset: 0; background: rgba(0,0,0,0.5); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 600; opacity: 0; transition: opacity 0.15s;
    }
    .doc-link:hover .doc-overlay { opacity: 1; }

    .card-info {
      display: flex; flex-wrap: wrap; gap: 0.75rem;
      padding: 0 1.25rem 1rem; font-size: 0.78rem; color: #71717a;
    }
    .rejection-note { color: #dc2626; font-style: italic; }

    .card-actions {
      padding: 1rem 1.25rem 1.25rem;
      border-top: 1px solid #f4f4f5;
      display: flex; flex-direction: column; gap: 0.75rem;
    }
    .note-input {
      width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e4e4e7; border-radius: 8px;
      font-size: 0.85rem; font-family: inherit; color: #18181b; box-sizing: border-box;
      outline: none;
    }
    .note-input:focus { border-color: #a1a1aa; }
    .btns { display: flex; gap: 0.5rem; justify-content: flex-end; }
    .btn-approve {
      background: #18181b; color: #fff; border: none;
      padding: 0.5rem 1.25rem; border-radius: 99px;
      font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: inherit;
      transition: background 0.15s;
    }
    .btn-approve:hover { background: #3f3f46; }
    .btn-approve:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-reject {
      background: transparent; color: #dc2626; border: 1.5px solid #fecaca;
      padding: 0.5rem 1.25rem; border-radius: 99px;
      font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: inherit;
      transition: background 0.15s;
    }
    .btn-reject:hover { background: #fff1f2; }
    .btn-reject:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class AdminVerificationsComponent implements OnInit {
  private api = inject(ApiService);

  verifications = signal<VerificationEntry[]>([]);
  loading = signal(true);
  working = signal(false);
  activeTab = signal<'PENDING' | 'VERIFIED' | 'REJECTED' | 'ALL'>('PENDING');
  rejectNotes: Record<string, string> = {};

  tabs = [
    { label: 'Pending', value: 'PENDING' as const },
    { label: 'Verified', value: 'VERIFIED' as const },
    { label: 'Rejected', value: 'REJECTED' as const },
    { label: 'All', value: 'ALL' as const },
  ];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getAdminVerifications().subscribe({
      next: (data: any) => { this.verifications.set(data); this.loading.set(false); },
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

  approve(userId: string) {
    this.working.set(true);
    this.api.approveVerification(userId).subscribe({
      next: () => { this.load(); this.working.set(false); },
      error: () => this.working.set(false),
    });
  }

  reject(userId: string) {
    this.working.set(true);
    const note = this.rejectNotes[userId];
    this.api.rejectVerification(userId, note).subscribe({
      next: () => { this.load(); this.working.set(false); },
      error: () => this.working.set(false),
    });
  }
}
