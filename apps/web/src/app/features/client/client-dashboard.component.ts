import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { WorkerProfileModalComponent } from '../../shared/worker-profile-modal.component';
import { ChatService } from '../../core/services/chat.service';
import { VerifyIdentityComponent } from '../../shared/verify-identity.component';

interface Application {
  id: string; status: string; proposedPrice: number | null; message: string | null;
  worker: { id: string; firstName: string; lastName: string; avatarUrl: string | null; rating: number; hourlyRate: number | null; totalJobs: number; user: { idVerified: boolean } | null; };
}
interface Job {
  id: string; title: string; description: string | null; status: string; priceMin: number | null; priceMax: number | null;
  urgency: string; city: string | null; createdAt: string;
  category: { name: string; icon: string } | null;
  applications: Application[];
}
interface ClientDashboard {
  stats: { total: number; posted: number; inProgress: number; completed: number };
  jobs: Job[];
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, WorkerProfileModalComponent, VerifyIdentityComponent],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div class="inner">
          <div class="header-top">
            <div>
              <p class="eyebrow">Client Dashboard</p>
              <h1 class="page-title">My Jobs</h1>
            </div>
            <a routerLink="/post" class="btn-primary">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              Post new job
            </a>
          </div>

          @if (data()) {
            <div class="stat-bar">
              <button class="stat-item" [class.stat-active]="filter() === 'ALL'" (click)="setFilter('ALL')">
                <span class="stat-val">{{ data()!.stats.total }}</span>
                <span class="stat-label">All jobs</span>
              </button>
              <button class="stat-item" [class.stat-active]="filter() === 'POSTED'" (click)="setFilter('POSTED')">
                <span class="stat-val stat-open">{{ data()!.stats.posted }}</span>
                <span class="stat-label">Open</span>
              </button>
              <button class="stat-item" [class.stat-active]="filter() === 'IN_PROGRESS'" (click)="setFilter('IN_PROGRESS')">
                <span class="stat-val stat-progress">{{ data()!.stats.inProgress }}</span>
                <span class="stat-label">In progress</span>
              </button>
              <button class="stat-item" [class.stat-active]="filter() === 'COMPLETED'" (click)="setFilter('COMPLETED')">
                <span class="stat-val">{{ data()!.stats.completed }}</span>
                <span class="stat-label">Completed</span>
              </button>
            </div>
          } @else {
            <div class="stat-bar-skeleton"></div>
          }
        </div>
      </div>

      <!-- Body -->
      <div class="page-body">
        <div class="inner">

          <!-- Identity verification -->
          <div class="verify-section">
            <app-verify-identity />
          </div>

          @if (data()) {

            @if (data()!.jobs.length === 0) {
              <div class="empty-state">
                <div class="empty-icon">
                  <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                </div>
                <p class="empty-title">No jobs posted yet</p>
                <p class="empty-sub">Post your first job and let AI find the best worker for you.</p>
                <a routerLink="/post" class="btn-primary">Post a job</a>
              </div>

            } @else {
              @if (showContent()) {
              <div class="list-anim">
              <div class="section-head">
                <span class="section-title">{{ filterLabel() }}</span>
                <span class="section-badge">{{ filteredJobs().length }}</span>
              </div>

              @if (filteredJobs().length === 0) {
                <div class="filter-empty">
                  <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  No {{ filterLabel().toLowerCase() }} jobs.
                </div>
              }

              <div class="jobs-list">
                @for (job of filteredJobs(); track job.id) {
                  <div class="job-card" [class.job-open]="expandedJob() === job.id">

                    <!-- Collapsed row -->
                    <div class="job-row" (click)="toggleJob(job.id)">
                      <div class="job-cat-dot" [style.background]="catColor(job.category?.name)"></div>
                      <div class="job-info">
                        <div class="job-title-row">
                          <span class="job-title">{{ job.title }}</span>
                          <span class="status-pill status-{{ job.status.toLowerCase() }}">{{ statusLabel(job.status) }}</span>
                        </div>
                        <div class="job-meta">
                          <span>{{ job.category?.name || 'General' }}</span>
                          @if (job.city) { <span class="dot">·</span><span>{{ job.city }}</span> }
                          @if (job.priceMin) { <span class="dot">·</span><span class="job-price">€{{ job.priceMin }}–{{ job.priceMax }}</span> }
                          <span class="dot">·</span>
                          <span class="apps-count">{{ job.applications.length }} application{{ job.applications.length !== 1 ? 's' : '' }}</span>
                        </div>
                      </div>
                      <div class="chevron" [class.chevron-open]="expandedJob() === job.id">
                        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
                      </div>
                    </div>

                    <!-- Expanded body -->
                    @if (expandedJob() === job.id) {
                      <div class="job-body">

                        @if (job.description) {
                          <p class="job-desc">{{ job.description }}</p>
                        }

                        @if (job.applications.length === 0) {
                          <p class="no-apps">No applications yet — workers will find this job soon.</p>

                        } @else {
                          <div class="sub-head">
                            Applications
                            <span class="sub-badge">{{ job.applications.length }}</span>
                          </div>

                          <div class="apps-list">
                            @for (app of job.applications; track app.id) {
                              <div class="app-card">
                                <div class="app-card-top">
                                  <!-- Avatar + name -->
                                  <div class="worker-avatar">{{ app.worker.firstName[0] }}{{ app.worker.lastName[0] }}</div>
                                  <div class="worker-info">
                                    <div class="worker-name-row">
                                      <p class="worker-name">{{ app.worker.firstName }} {{ app.worker.lastName }}</p>
                                      @if (!app.worker.user?.idVerified) {
                                        <span class="unverified-tag" title="This worker has not verified their identity">
                                          <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                          Not verified
                                        </span>
                                      }
                                    </div>
                                    <div class="worker-chips">
                                      @if (app.worker.rating) {
                                        <span class="chip">
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                          {{ app.worker.rating }}
                                        </span>
                                      }
                                      <span class="chip">{{ app.worker.totalJobs }} jobs</span>
                                      @if (app.worker.hourlyRate) {
                                        <span class="chip">€{{ app.worker.hourlyRate }}/hr</span>
                                      }
                                    </div>
                                  </div>
                                  <!-- Price + actions -->
                                  <div class="app-right">
                                    @if (app.proposedPrice) {
                                      <span class="proposed-price">€{{ app.proposedPrice }}</span>
                                    }
                                    @if (app.status === 'APPLIED' && job.status === 'POSTED') {
                                      <div class="action-btns">
                                        <button class="btn-accept" (click)="accept(app.id)">Accept</button>
                                        <button class="btn-decline" (click)="reject(app.id)">Decline</button>
                                      </div>
                                    } @else {
                                      <span class="app-status app-status-{{ app.status.toLowerCase() }}">{{ statusLabel(app.status) }}</span>
                                    }
                                  </div>
                                </div>

                                @if (app.message) {
                                  <p class="app-msg">"{{ app.message }}"</p>
                                }

                                <button class="view-profile-btn" (click)="viewWorker(app, job.status)">
                                  View full profile
                                  <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                                </button>
                              </div>
                            }
                          </div>
                        }

                        <!-- Chat -->
                        @if (job.status === 'ASSIGNED' || job.status === 'IN_PROGRESS' || job.status === 'COMPLETED') {
                          <div class="chat-section">
                            <button class="chat-open-btn" (click)="chat.openChat(job.id); chat.openWidget()">
                              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                              Chat with worker
                            </button>
                          </div>
                        }

                        <!-- Pay & Complete -->
                        @if (job.status === 'ASSIGNED' || job.status === 'IN_PROGRESS') {
                          <div class="job-action-row">
                            <button class="btn-complete" (click)="payAndComplete(job.id)" [disabled]="payingJob() === job.id">
                              @if (payingJob() === job.id) {
                                <span class="load-ring-sm"></span> Redirecting…
                              } @else {
                                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/><path d="M12 6v6l4 2"/></svg>
                                Pay & complete job
                              }
                            </button>
                          </div>
                        }

                        <!-- Review -->
                        @if (job.status === 'COMPLETED' && !reviewedJobs().has(job.id)) {
                          <div class="review-section">
                            <div class="sub-head">Leave a review</div>
                            <div class="stars-row">
                              @for (star of [1,2,3,4,5]; track star) {
                                <button
                                  class="star-btn"
                                  [class.star-active]="(reviewRatings()[job.id] ?? 0) >= star"
                                  (click)="setRating(job.id, star)"
                                >
                                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                </button>
                              }
                            </div>
                            <button class="btn-review" (click)="submitReview(job)" [disabled]="!reviewRatings()[job.id]">
                              Submit review
                            </button>
                          </div>
                        }

                      </div>
                    }
                  </div>
                }
              </div>
              </div><!-- /list-anim -->
              }<!-- /showContent -->

              @if (data()!.jobs.length < total()) {
                <div class="load-more-row">
                  <button class="load-more-btn" (click)="loadMore()" [disabled]="loadingMore()">
                    @if (loadingMore()) { <span class="load-ring-sm"></span> Loading… }
                    @else { Load more jobs }
                  </button>
                  <span class="load-more-count">{{ data()!.jobs.length }} of {{ total() }}</span>
                </div>
              }
            }

          } @else {
            <!-- Skeleton -->
            @for (i of [1,2,3]; track i) {
              <div class="skeleton-card">
                <div class="skel-line w55"></div>
                <div class="skel-line w35"></div>
              </div>
            }
          }

        </div>
      </div>

      @if (selectedApp()) {
        <app-worker-profile-modal
          [workerId]="selectedApp()!.worker.id"
          [applicationId]="selectedApp()!.id"
          [applicationMessage]="selectedApp()!.message"
          [proposedPrice]="selectedApp()!.proposedPrice"
          [jobCompleted]="selectedJobCompleted()"
          (close)="selectedApp.set(null)"
          (accepted)="onModalAccept($event)"
          (declined)="onModalDecline($event)"
        />
      }
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .page { min-height: 100vh; background: #f8f8f8; }
    .inner { max-width: 860px; margin: 0 auto; padding: 0 2rem; }

    /* ── Header ───────────────────────────── */
    .page-header {
      background: #fff;
      border-bottom: 1px solid #e4e4e7;
      padding: 2rem 0 0;
    }
    .header-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      padding-bottom: 1.5rem;
    }
    .eyebrow {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #a1a1aa;
      margin-bottom: 0.3rem;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #18181b;
      letter-spacing: -0.025em;
      margin: 0;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #2d9580;
      color: #fff;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 99px;
      font-size: 0.82rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: background 0.15s, box-shadow 0.15s;
      font-family: inherit;
      white-space: nowrap;
    }
    .btn-primary:hover { background: #257a68; box-shadow: 0 2px 8px rgba(45,149,128,0.25); }

    /* ── Stat bar ─────────────────────────── */
    .stat-bar {
      display: flex;
      border-top: 1px solid #e4e4e7;
    }
    .stat-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      padding: 1rem 1.25rem;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      position: relative;
      transition: background 0.12s;
    }
    .stat-item:hover { background: rgba(0,0,0,0.02); }
    .stat-item.stat-active { background: none; }
    .stat-item.stat-active::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 2px;
      background: #2d9580;
      border-radius: 2px 2px 0 0;
    }
    .stat-val {
      font-size: 1.4rem;
      font-weight: 700;
      color: #18181b;
      letter-spacing: -0.025em;
      line-height: 1;
    }
    .stat-open { color: #2563eb; }
    .stat-progress { color: #f59e0b; }
    .stat-label { font-size: 0.72rem; color: #a1a1aa; font-weight: 500; }
    .stat-bar-skeleton {
      height: 72px;
      border-top: 1px solid #e4e4e7;
      animation: pulse 1.5s ease-in-out infinite;
    }

    /* ── Filter empty ─────────────────────── */
    .filter-empty {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.84rem;
      color: #a1a1aa;
      padding: 1.5rem 0 0.5rem;
    }

    /* ── Body ─────────────────────────────── */
    .page-body { padding: 2rem 0; }
    .verify-section { margin-bottom: 1.5rem; }

    /* ── List animation ──────────────────── */
    .list-anim {
      animation: listSlideIn 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
    }
    @keyframes listSlideIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Section head ─────────────────────── */
    .section-head {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .section-title {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: #71717a;
    }
    .section-badge {
      background: #2d9580;
      color: #fff;
      font-size: 0.6rem;
      font-weight: 700;
      padding: 0.08rem 0.42rem;
      border-radius: 99px;
    }

    /* ── Job list ─────────────────────────── */
    .jobs-list { display: flex; flex-direction: column; gap: 0.625rem; }

    .job-card {
      background: #fff;
      border: 1.5px solid #e4e4e7;
      border-radius: 14px;
      overflow: hidden;
      transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
    }
    .job-card:not(.job-open):hover {
      border-color: #a7f3d0;
      box-shadow: 0 4px 20px rgba(45,149,128,0.08);
      transform: translateY(-2px);
    }
    .job-card.job-open { border-color: #2d9580; box-shadow: 0 4px 16px rgba(45,149,128,0.1); }

    .job-row {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 1rem 1.125rem;
      cursor: pointer;
      transition: background 0.12s;
    }
    .job-row:hover { background: #fafafa; }

    .job-cat-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .job-info { flex: 1; min-width: 0; }
    .job-title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.2rem;
    }
    .job-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #18181b;
      letter-spacing: -0.01em;
    }
    .job-meta {
      font-size: 0.74rem;
      color: #a1a1aa;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      flex-wrap: wrap;
    }
    .dot { color: #d4d4d8; }
    .job-price { color: #2563eb; font-weight: 500; }
    .apps-count { color: #18181b; font-weight: 600; }

    .chevron { color: #a1a1aa; transition: transform 0.2s; flex-shrink: 0; }
    .chevron-open { transform: rotate(90deg); }

    /* Status pills */
    .status-pill {
      font-size: 0.65rem;
      font-weight: 600;
      padding: 0.18rem 0.6rem;
      border-radius: 99px;
      white-space: nowrap;
    }
    .status-posted     { background: rgba(37,99,235,0.08);  color: #1d4ed8; }
    .status-assigned,
    .status-in_progress { background: rgba(245,158,11,0.1); color: #b45309; }
    .status-completed  { background: rgba(20,184,166,0.1);  color: #0f766e; }
    .status-cancelled,
    .status-draft      { background: rgba(0,0,0,0.05);      color: #71717a; }

    /* ── Job expanded body ────────────────── */
    .job-body {
      padding: 0 1.125rem 1.125rem;
      border-top: 1px solid #f4f4f5;
    }
    .job-desc {
      font-size: 0.82rem;
      color: #71717a;
      line-height: 1.6;
      margin: 0.875rem 0 0;
      padding-bottom: 0.875rem;
      border-bottom: 1px solid #f4f4f5;
    }
    .no-apps { font-size: 0.82rem; color: #a1a1aa; padding: 0.875rem 0 0.25rem; }

    .sub-head {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #71717a;
      padding-top: 0.875rem;
      margin-bottom: 0.625rem;
    }
    .sub-badge {
      background: #2d9580;
      color: #fff;
      font-size: 0.58rem;
      font-weight: 700;
      padding: 0.08rem 0.4rem;
      border-radius: 99px;
    }

    /* ── Application cards ────────────────── */
    .apps-list { display: flex; flex-direction: column; gap: 0.5rem; }

    .app-card {
      background: #fafafa;
      border: 1.5px solid #e4e4e7;
      border-radius: 12px;
      padding: 0.875rem 1rem;
      transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
    }
    .app-card:hover { border-color: #a7f3d0; box-shadow: 0 2px 10px rgba(45,149,128,0.07); transform: translateY(-1px); }

    .app-card-top {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }
    .worker-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #2d9580;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.72rem;
      font-weight: 700;
      flex-shrink: 0;
      letter-spacing: 0.03em;
    }
    .worker-info { flex: 1; min-width: 0; }
    .worker-name-row { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.3rem; }
    .worker-name { font-size: 0.875rem; font-weight: 600; color: #18181b; margin: 0; }
    .unverified-tag {
      display: inline-flex; align-items: center; gap: 0.25rem;
      background: #fef3c7; color: #92400e;
      font-size: 0.68rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 99px;
    }
    .worker-chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      font-size: 0.7rem;
      background: #fff;
      color: #71717a;
      border: 1.5px solid #e4e4e7;
      padding: 0.12rem 0.45rem;
      border-radius: 99px;
      font-weight: 500;
    }

    .app-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.375rem;
      flex-shrink: 0;
    }
    .proposed-price {
      font-size: 0.9rem;
      font-weight: 700;
      color: #18181b;
      letter-spacing: -0.02em;
    }
    .action-btns { display: flex; gap: 0.3rem; }
    .btn-accept {
      background: #2d9580;
      color: #fff;
      border: none;
      padding: 0.3rem 0.75rem;
      border-radius: 99px;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, box-shadow 0.15s;
      font-family: inherit;
      white-space: nowrap;
    }
    .btn-accept:hover { background: #257a68; box-shadow: 0 2px 8px rgba(45,149,128,0.25); }
    .btn-decline {
      background: transparent;
      color: #a1a1aa;
      border: 1.5px solid #e4e4e7;
      padding: 0.3rem 0.75rem;
      border-radius: 99px;
      font-size: 0.72rem;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
      white-space: nowrap;
    }
    .btn-decline:hover { background: rgba(239,68,68,0.05); color: #dc2626; border-color: rgba(239,68,68,0.2); }

    .app-status {
      font-size: 0.68rem;
      font-weight: 600;
      padding: 0.18rem 0.6rem;
      border-radius: 99px;
    }
    .app-status-accepted { background: rgba(20,184,166,0.1);  color: #0f766e; }
    .app-status-rejected { background: rgba(239,68,68,0.08);  color: #dc2626; }
    .app-status-applied  { background: rgba(37,99,235,0.08);  color: #1d4ed8; }

    .app-msg {
      font-size: 0.8rem;
      color: #71717a;
      font-style: italic;
      margin: 0 0 0.5rem;
      line-height: 1.5;
      padding-left: 0.25rem;
      border-left: 2px solid #e4e4e7;
    }
    .view-profile-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: none;
      border: none;
      color: #2d9580;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      font-family: inherit;
      transition: color 0.12s;
    }
    .view-profile-btn:hover { color: #257a68; }

    /* ── Chat ─────────────────────────────── */
    .chat-section {
      padding-top: 0.875rem;
      margin-top: 0.875rem;
      border-top: 1px solid #f4f4f5;
    }
    .chat-open-btn {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: #2d9580; color: #fff;
      border: none; padding: 0.45rem 1rem; border-radius: 99px;
      font-size: 0.8rem; font-weight: 600;
      cursor: pointer; transition: background 0.15s, box-shadow 0.15s; font-family: inherit;
    }
    .chat-open-btn:hover { background: #257a68; box-shadow: 0 2px 8px rgba(45,149,128,0.25); }

    /* ── Mark complete ────────────────────── */
    .job-action-row {
      padding-top: 0.875rem;
      margin-top: 0.875rem;
      border-top: 1px solid #f4f4f5;
    }
    .btn-complete {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      background: rgba(20,184,166,0.08);
      color: #0f766e;
      border: 1.5px solid rgba(20,184,166,0.2);
      padding: 0.5rem 1rem;
      border-radius: 99px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }
    .btn-complete:hover { background: rgba(20,184,166,0.14); border-color: rgba(20,184,166,0.35); }

    /* ── Review ───────────────────────────── */
    .review-section {
      padding-top: 0.875rem;
      margin-top: 0.875rem;
      border-top: 1px solid #f4f4f5;
    }
    .stars-row { display: flex; gap: 0.125rem; margin: 0.5rem 0 0.75rem; }
    .star-btn {
      background: none;
      border: none;
      color: #e4e4e7;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      transition: color 0.1s, transform 0.1s;
      font-family: inherit;
    }
    .star-btn:hover { transform: scale(1.15); }
    .star-active { color: #f59e0b; }
    .btn-review {
      background: #2d9580;
      color: #fff;
      border: none;
      padding: 0.5rem 1.125rem;
      border-radius: 99px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, box-shadow 0.15s;
      font-family: inherit;
    }
    .btn-review:hover:not(:disabled) { background: #257a68; box-shadow: 0 2px 8px rgba(45,149,128,0.25); }
    .btn-review:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ── Load more ────────────────────────── */
    .load-more-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .load-more-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #fff;
      color: #18181b;
      border: 1.5px solid #e4e4e7;
      padding: 0.6rem 1.375rem;
      border-radius: 99px;
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      font-family: inherit;
    }
    .load-more-btn:hover:not(:disabled) { border-color: #18181b; background: #f4f4f5; }
    .load-more-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .load-more-count {
      font-size: 0.75rem;
      color: #a1a1aa;
      white-space: nowrap;
    }
    .load-ring-sm {
      width: 12px; height: 12px;
      border: 2px solid #d4d4d8;
      border-top-color: #18181b;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Empty ────────────────────────────── */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: #fff;
      border: 1.5px dashed #e4e4e7;
      border-radius: 16px;
    }
    .empty-icon {
      width: 48px; height: 48px;
      border-radius: 12px;
      background: #f4f4f5;
      color: #a1a1aa;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
    }
    .empty-title { font-size: 0.95rem; font-weight: 600; color: #18181b; margin: 0 0 0.3rem; }
    .empty-sub { font-size: 0.84rem; color: #71717a; margin: 0 0 1.25rem; }

    /* ── Skeleton ─────────────────────────── */
    .skeleton-card {
      background: #fff;
      border: 1.5px solid #e4e4e7;
      border-radius: 14px;
      padding: 1.125rem;
      margin-bottom: 0.625rem;
    }
    .skel-line {
      height: 11px;
      background: #f4f4f5;
      border-radius: 6px;
      margin-bottom: 0.625rem;
      animation: pulse 1.5s ease-in-out infinite;
    }
    .skel-line.w55 { width: 55%; }
    .skel-line.w35 { width: 35%; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

    @media (max-width: 640px) {
      .inner { padding: 0 1rem; }
      .stat-bar { flex-wrap: wrap; }
      .stat-item { min-width: 50%; }
      .app-card-top { flex-wrap: wrap; }
    }
  `]
})
export class ClientDashboardComponent implements OnInit {
  private api = inject(ApiService);
  chat = inject(ChatService);

  data = signal<ClientDashboard | null>(null);
  total = signal(0);
  loadingMore = signal(false);
  expandedJob = signal<string | null>(null);
  filter = signal<'ALL' | 'POSTED' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  showContent = signal(true);
  reviewRatings = signal<Record<string, number>>({});
  reviewedJobs = signal<Set<string>>(new Set());
  selectedApp = signal<Application | null>(null);
  selectedJobCompleted = signal(false);
  payingJob = signal<string | null>(null);

  filteredJobs(): Job[] {
    const jobs = this.data()?.jobs ?? [];
    const f = this.filter();
    if (f === 'ALL') return jobs;
    if (f === 'IN_PROGRESS') return jobs.filter(j => j.status === 'IN_PROGRESS' || j.status === 'ASSIGNED');
    return jobs.filter(j => j.status === f);
  }

  filterLabel(): string {
    const map: Record<string, string> = { ALL: 'All jobs', POSTED: 'Open jobs', IN_PROGRESS: 'In progress', COMPLETED: 'Completed jobs' };
    return map[this.filter()] ?? 'Jobs';
  }

  setFilter(f: 'ALL' | 'POSTED' | 'IN_PROGRESS' | 'COMPLETED') {
    if (this.filter() === f) return;
    this.showContent.set(false);
    setTimeout(() => {
      this.filter.set(f);
      this.expandedJob.set(null);
      this.showContent.set(true);
    }, 80);
  }

  ngOnInit() { this.load(); }

  load() {
    this.api.getClientDashboard(0).subscribe({
      next: (d: any) => {
        this.data.set({ stats: d.stats, jobs: d.jobs });
        this.total.set(d.total);
      },
    });
  }

  loadMore() {
    this.loadingMore.set(true);
    this.api.getClientDashboard(this.data()!.jobs.length).subscribe({
      next: (d: any) => {
        this.data.update(prev => prev ? { ...prev, jobs: [...prev.jobs, ...d.jobs] } : null);
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false),
    });
  }

  toggleJob(id: string) {
    this.expandedJob.set(this.expandedJob() === id ? null : id);
  }

  viewWorker(app: Application, jobStatus: string) {
    this.selectedApp.set(app);
    this.selectedJobCompleted.set(jobStatus !== 'POSTED' || app.status === 'REJECTED' || app.status === 'WITHDRAWN');
  }

  onModalAccept(appId: string) {
    this.api.acceptApplication(appId).subscribe({ next: () => this.load() });
  }

  onModalDecline(appId: string) {
    this.api.rejectApplication(appId).subscribe({ next: () => this.load() });
  }

  accept(appId: string) {
    this.api.acceptApplication(appId).subscribe({ next: () => this.load() });
  }

  reject(appId: string) {
    this.api.rejectApplication(appId).subscribe({ next: () => this.load() });
  }

  payAndComplete(jobId: string) {
    if (this.payingJob()) return;
    this.payingJob.set(jobId);
    this.api.createJobPaymentSession(jobId).subscribe({
      next: ({ url }) => { window.location.href = url!; },
      error: () => this.payingJob.set(null),
    });
  }

  setRating(jobId: string, rating: number) {
    this.reviewRatings.update((r) => ({ ...r, [jobId]: rating }));
  }

  submitReview(job: Job) {
    const rating = this.reviewRatings()[job.id];
    if (!rating) return;
    this.api.leaveReview(job.id, { rating }).subscribe({
      next: () => this.reviewedJobs.update((s) => new Set([...s, job.id])),
    });
  }

  catColor(category?: string | null): string {
    const map: Record<string, string> = {
      'Cleaning': '#14b8a6', 'Plumbing': '#2563eb', 'Electrical': '#f59e0b',
      'Moving': '#8b5cf6', 'Gardening': '#16a34a', 'Painting': '#f97316',
    };
    return map[category ?? ''] ?? '#a1a1aa';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      POSTED: 'Open', ASSIGNED: 'Assigned', IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed', CANCELLED: 'Cancelled', DRAFT: 'Draft',
      APPLIED: 'Applied', ACCEPTED: 'Accepted', REJECTED: 'Declined',
    };
    return map[status] ?? status;
  }
}
