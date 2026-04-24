import { Component, inject, signal, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/services/api.service';

interface Review { rating: number; comment: string | null; createdAt: string; job: { title: string } }
interface WorkerFullProfile {
  id: string; firstName: string; lastName: string; bio: string | null;
  avatarUrl: string | null; phone: string | null; hourlyRate: number | null;
  city: string; rating: number; totalJobs: number; totalReviews: number;
  idVerified: boolean; backgroundChecked: boolean; isAvailable: boolean;
  dateOfBirth: string | null;
  skills: { skill: { name: string; category: { name: string; icon: string } } }[];
  reviews: Review[];
}

@Component({
  selector: 'app-worker-profile-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" (click)="close.emit()">
      <div class="modal" (click)="$event.stopPropagation()">

        @if (loading()) {
          <div class="loading">
            <div class="load-ring"></div>
            <p>Loading profile…</p>
          </div>

        } @else if (profile()) {
          <!-- Fixed header -->
          <div class="modal-head">
            <div class="avatar-wrap">
              <div class="avatar">{{ profile()!.firstName[0] }}{{ profile()!.lastName[0] }}</div>
              <span class="avail-dot" [class.avail-dot--on]="profile()!.isAvailable"></span>
            </div>
            <div class="head-info">
              <div class="name-row">
                <h2 class="worker-name">{{ profile()!.firstName }} {{ profile()!.lastName }}</h2>
                @if (profile()!.idVerified) {
                  <span class="badge badge-teal">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    Verified
                  </span>
                }
                @if (profile()!.backgroundChecked) {
                  <span class="badge badge-blue">Background check</span>
                }
              </div>
              <div class="meta-chips">
                @if (profile()!.rating) {
                  <span class="meta-chip">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    {{ profile()!.rating }}/5
                  </span>
                }
                <span class="meta-chip">{{ profile()!.totalJobs }} jobs</span>
                @if (profile()!.city) { <span class="meta-chip">{{ profile()!.city }}</span> }
                @if (profile()!.hourlyRate) {
                  <span class="meta-chip meta-chip--price">€{{ profile()!.hourlyRate }}/hr</span>
                }
                @if (profile()!.dateOfBirth) {
                  <span class="meta-chip">{{ calcAge(profile()!.dateOfBirth!) }} yrs old</span>
                }
              </div>
              <span class="avail-label" [class.avail-label--on]="profile()!.isAvailable">
                {{ profile()!.isAvailable ? 'Available now' : 'Not available' }}
              </span>
            </div>
            <button class="close-btn" (click)="close.emit()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Scrollable body -->
          <div class="modal-body">

            @if (applicationMessage() || proposedPrice()) {
              <div class="section app-section">
                <p class="section-label">Their application</p>
                @if (proposedPrice()) {
                  <div class="app-price-row">
                    <span class="app-price-label">Proposed price</span>
                    <span class="app-price-val">€{{ proposedPrice() }}/hr</span>
                  </div>
                }
                @if (applicationMessage()) {
                  <blockquote class="app-message">{{ applicationMessage() }}</blockquote>
                }
              </div>
            }

            @if (profile()!.bio) {
              <div class="section">
                <p class="section-label">About</p>
                <p class="bio-text">{{ profile()!.bio }}</p>
              </div>
            }

            @if (profile()!.skills.length > 0) {
              <div class="section">
                <p class="section-label">Skills</p>
                <div class="skills-wrap">
                  @for (ws of profile()!.skills; track ws.skill.name) {
                    <span class="skill-tag">{{ ws.skill.name }}</span>
                  }
                </div>
              </div>
            }

            <div class="section">
              <p class="section-label">
                Reviews
                @if (profile()!.totalReviews > 0) {
                  <span class="count-badge">{{ profile()!.totalReviews }}</span>
                }
              </p>
              @if (profile()!.reviews.length > 0) {
                <div class="reviews-list">
                  @for (review of profile()!.reviews; track review.createdAt) {
                    <div class="review-card">
                      <div class="review-top">
                        <div class="stars-row">
                          @for (s of starsArray(review.rating); track s) {
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          }
                          @for (s of starsArray(5 - review.rating); track s) {
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#e4e4e7"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          }
                        </div>
                        <span class="review-job">{{ review.job.title }}</span>
                      </div>
                      @if (review.comment) {
                        <p class="review-comment">"{{ review.comment }}"</p>
                      }
                    </div>
                  }
                </div>
              } @else {
                <p class="no-reviews">No reviews yet — this worker is building their reputation.</p>
              }
            </div>

          </div>

          <!-- Fixed footer — hidden for completed jobs -->
          @if (!jobCompleted()) {
            <div class="modal-foot">
              <button class="btn-decline" (click)="onDecline()">Decline</button>
              <button class="btn-accept" (click)="onAccept()">
                Accept {{ profile()!.firstName }}
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            </div>
          }
        }

      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      animation: fadeIn 200ms ease-out both;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal {
      background: #fff;
      border-radius: 20px;
      width: 100%;
      max-width: 520px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 24px 64px rgba(0,0,0,0.18);
      overflow: hidden;
      animation: slideUp 240ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* ── Loading ──────────────────────────── */
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      gap: 1rem;
      color: #a1a1aa;
      font-size: 0.875rem;
    }
    .load-ring {
      width: 28px; height: 28px;
      border: 2.5px solid #e4e4e7;
      border-top-color: #18181b;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Header ───────────────────────────── */
    .modal-head {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.375rem;
      border-bottom: 1px solid #f4f4f5;
      flex-shrink: 0;
    }
    .avatar-wrap { position: relative; flex-shrink: 0; }
    .avatar {
      width: 60px; height: 60px;
      border-radius: 50%;
      background: #18181b;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .avail-dot {
      position: absolute;
      bottom: 2px; right: 2px;
      width: 12px; height: 12px;
      border-radius: 50%;
      background: #d4d4d8;
      border: 2px solid #fff;
    }
    .avail-dot--on { background: #14b8a6; }

    .head-info { flex: 1; min-width: 0; }
    .name-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-bottom: 0.5rem;
    }
    .worker-name {
      font-size: 1.1rem;
      font-weight: 700;
      color: #18181b;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.65rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
    }
    .badge-teal { background: rgba(20,184,166,0.1); color: #0f766e; }
    .badge-blue { background: rgba(37,99,235,0.08); color: #1d4ed8; }

    .meta-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
      margin-bottom: 0.4rem;
    }
    .meta-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      font-size: 0.72rem;
      font-weight: 500;
      background: #f4f4f5;
      color: #71717a;
      padding: 0.18rem 0.5rem;
      border-radius: 6px;
      border: 1.5px solid #e4e4e7;
    }
    .meta-chip--price { background: rgba(37,99,235,0.06); color: #2563eb; border-color: rgba(37,99,235,0.15); }

    .avail-label { font-size: 0.72rem; font-weight: 500; color: #a1a1aa; }
    .avail-label--on { color: #14b8a6; }

    .close-btn {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: #f4f4f5;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #71717a;
      flex-shrink: 0;
      transition: background 0.12s, color 0.12s;
    }
    .close-btn:hover { background: #e4e4e7; color: #18181b; }

    /* ── Body ─────────────────────────────── */
    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.25rem 1.375rem;
    }
    .section { margin-bottom: 1.5rem; }
    .section:last-child { margin-bottom: 0; }

    .section-label {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #a1a1aa;
      margin: 0 0 0.625rem;
    }
    .count-badge {
      background: #18181b;
      color: #fff;
      font-size: 0.58rem;
      font-weight: 700;
      padding: 0.08rem 0.4rem;
      border-radius: 99px;
    }

    .bio-text {
      font-size: 0.875rem;
      color: #3f3f46;
      line-height: 1.7;
      margin: 0;
    }

    .skills-wrap { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .skill-tag {
      background: #f4f4f5;
      border: 1.5px solid #e4e4e7;
      padding: 0.22rem 0.65rem;
      border-radius: 99px;
      font-size: 0.75rem;
      color: #18181b;
      font-weight: 500;
    }

    .reviews-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .review-card {
      background: #fafafa;
      border: 1.5px solid #e4e4e7;
      border-radius: 12px;
      padding: 0.875rem 1rem;
    }
    .review-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.4rem;
      gap: 0.5rem;
    }
    .stars-row { display: flex; gap: 2px; flex-shrink: 0; }
    .review-job {
      font-size: 0.72rem;
      color: #a1a1aa;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .review-comment {
      font-size: 0.82rem;
      color: #71717a;
      font-style: italic;
      margin: 0;
      line-height: 1.55;
    }
    .no-reviews { font-size: 0.82rem; color: #a1a1aa; margin: 0; }

    /* ── Application section ───────────────── */
    .app-section { background: #f8f8f8; border: 1.5px solid #e4e4e7; border-radius: 12px; padding: 0.875rem 1rem; }
    .app-price-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .app-price-label { font-size: 0.78rem; color: #71717a; font-weight: 500; }
    .app-price-val { font-size: 0.95rem; font-weight: 700; color: #18181b; }
    .app-message {
      margin: 0;
      font-size: 0.84rem;
      color: #3f3f46;
      line-height: 1.65;
      font-style: italic;
      border-left: 3px solid #e4e4e7;
      padding-left: 0.75rem;
    }

    /* ── Footer ───────────────────────────── */
    .modal-foot {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      padding: 0.875rem 1.375rem;
      border-top: 1px solid #f4f4f5;
      flex-shrink: 0;
    }
    .btn-accept {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #18181b;
      color: #fff;
      border: none;
      padding: 0.625rem 1.375rem;
      border-radius: 99px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      font-family: inherit;
    }
    .btn-accept:hover { background: #27272a; }
    .btn-decline {
      background: transparent;
      color: #71717a;
      border: 1.5px solid #e4e4e7;
      padding: 0.625rem 1.125rem;
      border-radius: 99px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }
    .btn-decline:hover { background: rgba(239,68,68,0.05); color: #dc2626; border-color: rgba(239,68,68,0.2); }

    @media (max-width: 600px) {
      .modal { max-height: 100vh; border-radius: 20px 20px 0 0; align-self: flex-end; }
    }
  `]
})
export class WorkerProfileModalComponent implements OnInit {
  private api = inject(ApiService);

  workerId = input.required<string>();
  applicationId = input.required<string>();
  applicationMessage = input<string | null>(null);
  proposedPrice = input<number | null>(null);
  jobCompleted = input(false);
  close = output<void>();
  accepted = output<string>();
  declined = output<string>();

  profile = signal<WorkerFullProfile | null>(null);
  loading = signal(true);

  ngOnInit() {
    this.api.getWorkerPublicProfile(this.workerId()).subscribe({
      next: (p) => { this.profile.set(p as WorkerFullProfile); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onAccept() {
    this.accepted.emit(this.applicationId());
    this.close.emit();
  }

  onDecline() {
    this.declined.emit(this.applicationId());
    this.close.emit();
  }

  calcAge(dob: string): number {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
    return age;
  }

  starsArray(n: number): number[] {
    return Array(Math.max(0, Math.round(n))).fill(0);
  }
}
