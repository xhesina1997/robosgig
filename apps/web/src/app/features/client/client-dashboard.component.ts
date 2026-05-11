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
  urgency: string; city: string | null; createdAt: string; scheduledDate: string | null;
  category: { name: string; icon: string } | null;
  applications: Application[];
  payment: { status: string; totalAmount: number; workerPayout: number } | null;
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
      <div class="inner">

        <!-- Hero -->
        <header class="hero">
          <div class="hero-left">
            <p class="eyebrow">Client dashboard</p>
            <h1 class="title">My jobs</h1>
            <div class="hero-meta">
              @if (idVerified()) {
                <span class="verified-pill">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                  ID Verified
                </span>
                <span class="hero-meta-sep">·</span>
              }
              <span class="hero-meta-text">{{ data()?.stats?.total ?? 0 }} jobs lifetime</span>
            </div>
          </div>
          <div class="hero-actions">
            <a routerLink="/client/profile" class="action-pill">My profile</a>
            <a routerLink="/post" class="action-pill action-pill--primary">
              <span class="action-plus">+</span>
              Post new job
            </a>
          </div>
        </header>

        <!-- Identity verification (only when not yet verified) -->
        @if (!idVerified()) {
          <div class="verify-section">
            <app-verify-identity />
          </div>
        }

        <!-- Stat tabs -->
        @if (data()) {
          <div class="stat-tabs">
            <button class="stat-tab" [class.stat-tab--active]="filter() === 'ALL'" (click)="setFilter('ALL')" type="button">
              <span class="stat-val">
                {{ data()!.stats.total }}
                @if (filter() === 'ALL') { <span class="stat-dot" style="background:#0A0A0A"></span> }
              </span>
              <span class="stat-label">All jobs</span>
            </button>
            <button class="stat-tab" [class.stat-tab--active]="filter() === 'POSTED'" (click)="setFilter('POSTED')" type="button">
              <span class="stat-val" style="color:#3B82F6">
                {{ data()!.stats.posted }}
                @if (filter() === 'POSTED') { <span class="stat-dot" style="background:#3B82F6"></span> }
              </span>
              <span class="stat-label">Open</span>
            </button>
            <button class="stat-tab" [class.stat-tab--active]="filter() === 'IN_PROGRESS'" (click)="setFilter('IN_PROGRESS')" type="button">
              <span class="stat-val" style="color:#B45309">
                {{ data()!.stats.inProgress }}
                @if (filter() === 'IN_PROGRESS') { <span class="stat-dot" style="background:#B45309"></span> }
              </span>
              <span class="stat-label">In progress</span>
            </button>
            <button class="stat-tab" [class.stat-tab--active]="filter() === 'COMPLETED'" (click)="setFilter('COMPLETED')" type="button">
              <span class="stat-val" style="color:#737373">
                {{ data()!.stats.completed }}
                @if (filter() === 'COMPLETED') { <span class="stat-dot" style="background:#737373"></span> }
              </span>
              <span class="stat-label">Completed</span>
            </button>
          </div>
        } @else {
          <div class="stat-tabs-skel"></div>
        }

        @if (data()) {

          @if (data()!.jobs.length === 0) {
            <div class="empty-state">
              <p class="empty-title">No jobs posted yet</p>
              <p class="empty-sub">Post your first job and let AI find the best worker for you.</p>
              <a routerLink="/post" class="empty-cta">Post a job</a>
            </div>

          } @else {

            <!-- Section header -->
            <div class="section-head">
              <span class="section-label">
                {{ filterLabel() }}
                <span class="section-count">{{ filteredJobs().length }}</span>
              </span>
              <div class="section-tools">
                <span class="section-sort">Newest ↓</span>
              </div>
            </div>

            @if (filteredJobs().length === 0) {
              <div class="filter-empty">
                <p class="filter-empty-title">Nothing here yet.</p>
                <p class="filter-empty-sub">Try a different tab, or post a new job.</p>
              </div>
            }

            @if (showContent()) {
              <div class="jobs-list">
                @for (job of filteredJobs(); track job.id) {
                  <article class="job-card">

                    <!-- Collapsed row (toggle) -->
                    <button class="job-row" (click)="toggleJob(job.id)" type="button">
                      <div class="job-row-main">
                        <div class="job-title-row">
                          <span class="job-cat-dot" [style.background]="catColor(job.category?.name)"></span>
                          <span class="job-title">{{ job.title }}</span>
                          <span class="status-pill status-{{ statusGroup(job.status) }}">
                            <span class="status-dot"></span>
                            {{ statusLabel(job.status) }}
                          </span>
                        </div>
                        <div class="job-meta">
                          <span>{{ (job.category?.name || 'General').toLowerCase() }}</span>
                          @if (job.city) { <span>· {{ job.city }}</span> }
                          @if (job.priceMin) { <span>· €{{ job.priceMin }}–{{ job.priceMax }}</span> }
                          <span>· posted {{ job.createdAt | date:'d MMM' }}</span>
                        </div>
                      </div>

                      <div class="job-row-right">
                        @if (statusGroup(job.status) === 'open') {
                          <span
                            class="apps-chip"
                            [class.apps-chip--has]="job.applications.length > 0"
                          >{{ job.applications.length }} application{{ job.applications.length === 1 ? '' : 's' }}</span>
                        } @else if (statusGroup(job.status) === 'progress') {
                          <span class="progress-note">In progress</span>
                        } @else if (statusGroup(job.status) === 'completed') {
                          <span class="completed-note">
                            <span class="completed-amt">+€{{ jobPrice(job) || job.priceMax || 0 }} paid</span>
                          </span>
                        }
                      </div>

                      <span
                        class="chev"
                        [class.chev--open]="expandedJob() === job.id"
                      >⌄</span>
                    </button>

                    <!-- Expanded body -->
                    @if (expandedJob() === job.id) {
                      <div class="job-body">

                        @if (job.description) {
                          <p class="job-desc">{{ job.description }}</p>
                        }

                        <!-- In-progress worker card -->
                        @if (job.status === 'IN_PROGRESS' || job.status === 'ASSIGNED') {
                          @if (acceptedApp(job); as accepted) {
                            <div class="worker-strip">
                              <div class="worker-strip-left">
                                <div class="worker-avatar-sm">{{ accepted.worker.firstName[0] }}{{ accepted.worker.lastName[0] }}</div>
                                <div>
                                  <p class="worker-strip-name">{{ accepted.worker.firstName }} {{ accepted.worker.lastName }}</p>
                                  <p class="worker-strip-meta">
                                    @if (job.status === 'IN_PROGRESS') { Payment secured in escrow }
                                    @else if (job.payment?.status === 'PENDING') { Payment submitted · awaiting confirmation }
                                    @else { Awaiting payment to start }
                                  </p>
                                </div>
                              </div>
                              <div class="worker-strip-actions">
                                <button class="btn-ghost-pill" (click)="chat.openChat(job.id); chat.openWidget()" type="button">
                                  Open chat
                                </button>
                                @if (job.status === 'ASSIGNED' && job.payment?.status === 'PENDING') {
                                  <button class="btn-ink-pill" (click)="verifyPayment(job.id)" [disabled]="verifyingPayment() === job.id" type="button">
                                    @if (verifyingPayment() === job.id) { Verifying… }
                                    @else { Confirm payment }
                                  </button>
                                } @else if (job.status === 'ASSIGNED') {
                                  <button class="btn-ink-pill" (click)="fundJob(job.id)" [disabled]="payingJob() === job.id" type="button">
                                    @if (payingJob() === job.id) { Redirecting… }
                                    @else { Fund job{{ jobPrice(job) ? ' (€' + jobPrice(job) + ')' : '' }} }
                                  </button>
                                } @else if (job.status === 'IN_PROGRESS') {
                                  <button class="btn-ink-pill" (click)="releasePayment(job.id)" [disabled]="releasingJob() === job.id" type="button">
                                    @if (releasingJob() === job.id) { Processing… }
                                    @else { Mark done · release escrow }
                                  </button>
                                }
                              </div>
                            </div>
                          }
                        }

                        <!-- Applications (open status) -->
                        @if (job.status === 'POSTED') {
                          @if (job.applications.length === 0) {
                            <p class="no-apps">No applications yet — workers will find this job soon.</p>
                          } @else {
                            <div class="apps-head">
                              <span class="apps-head-label">
                                Applications · <span class="apps-head-count">{{ job.applications.length }}</span>
                              </span>
                              <span class="apps-head-sort">sorted by best match</span>
                            </div>
                            <div class="apps-list">
                              @for (app of job.applications; track app.id) {
                                <div
                                  class="app-row"
                                  [class.app-row--accepted]="app.status === 'ACCEPTED'"
                                >
                                  <div class="app-avatar">{{ app.worker.firstName[0] }}{{ app.worker.lastName[0] }}</div>

                                  <div class="app-main">
                                    <div class="app-name-line">
                                      <span class="app-name">{{ app.worker.firstName }} {{ app.worker.lastName }}</span>
                                      @if (app.worker.user?.idVerified) {
                                        <span class="app-id-pill">✓ ID</span>
                                      }
                                      @if (app.worker.rating) {
                                        <span class="app-meta-mono">★ {{ app.worker.rating | number:'1.2-2' }} · {{ app.worker.totalJobs }} jobs</span>
                                      } @else {
                                        <span class="app-meta-mono app-meta-mono--new">new · {{ app.worker.totalJobs }} jobs</span>
                                      }
                                      @if (app.worker.hourlyRate) {
                                        <span class="app-meta-mono app-meta-mono--dim">· €{{ app.worker.hourlyRate }}/hr</span>
                                      }
                                    </div>
                                    @if (app.message) {
                                      <p class="app-note">"{{ app.message }}"</p>
                                    }
                                    <button class="app-link" (click)="viewWorker(app, job.status)" type="button">
                                      View full profile →
                                    </button>
                                  </div>

                                  <div class="app-right">
                                    @if (app.proposedPrice) {
                                      <div class="app-bid">€{{ app.proposedPrice }}</div>
                                      <div class="app-bid-label">their bid</div>
                                    }
                                    @if (app.status === 'APPLIED') {
                                      <div class="app-actions">
                                        <button class="app-btn-pass" (click)="reject(app.id)" type="button">Pass</button>
                                        <button class="app-btn-accept" (click)="accept(app.id)" type="button">Accept</button>
                                      </div>
                                    } @else if (app.status === 'ACCEPTED') {
                                      <span class="app-hired">✓ Hired</span>
                                    } @else {
                                      <span class="app-passed">{{ statusLabel(app.status).toLowerCase() }}</span>
                                    }
                                  </div>
                                </div>
                              }
                            </div>
                          }
                        }

                        <!-- Completed strip -->
                        @if (job.status === 'COMPLETED') {
                          @if (acceptedApp(job); as accepted) {
                            <div class="completed-strip">
                              <div class="completed-strip-text">
                                Completed by
                                <span class="completed-strip-name">{{ accepted.worker.firstName }} {{ accepted.worker.lastName }}</span>
                                · paid €{{ jobPrice(job) || job.priceMax || 0 }} · invoice issued
                              </div>
                              <a routerLink="/post" class="btn-ghost-pill">Rebook →</a>
                            </div>
                          }
                        }

                        <!-- Review (completed) -->
                        @if (job.status === 'COMPLETED' && !reviewedJobs().has(job.id)) {
                          <div class="review-section">
                            <p class="review-label">Leave a review</p>
                            <div class="stars-row">
                              @for (star of [1,2,3,4,5]; track star) {
                                <button
                                  class="star-btn"
                                  [class.star-active]="(reviewRatings()[job.id] ?? 0) >= star"
                                  (click)="setRating(job.id, star)"
                                  type="button"
                                >
                                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                </button>
                              }
                            </div>
                            <button
                              class="btn-review"
                              (click)="submitReview(job)"
                              [disabled]="!reviewRatings()[job.id]"
                              type="button"
                            >Submit review</button>
                          </div>
                        }

                        <!-- Footer actions -->
                        <div class="job-foot">
                          @if (job.status === 'POSTED' || job.status === 'DRAFT') {
                            @if (!canDelete(job)) {
                              <span class="delete-blocked">
                                @if (hasActiveApplication(job)) {
                                  Cannot delete — accepted application in progress.
                                } @else {
                                  Cannot delete — less than 24h before scheduled date.
                                }
                              </span>
                            } @else if (confirmDeleteId() === job.id) {
                              <span class="delete-confirm">
                                Are you sure?
                                <button class="delete-confirm-yes" (click)="deleteJob(job.id)" type="button">Yes, delete</button>
                                <button class="delete-confirm-no" (click)="confirmDeleteId.set(null)" type="button">Cancel</button>
                              </span>
                            } @else {
                              <button class="btn-delete" (click)="confirmDeleteId.set(job.id)" type="button">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                Delete job
                              </button>
                            }
                          } @else {
                            <span></span>
                          }
                        </div>
                      </div>
                    }
                  </article>
                }
              </div>
            }

            @if (data()!.jobs.length < total()) {
              <div class="load-more-row">
                <button class="load-more-btn" (click)="loadMore()" [disabled]="loadingMore()" type="button">
                  @if (loadingMore()) { <span class="load-ring-sm"></span> Loading… }
                  @else { Load more jobs }
                </button>
                <span class="load-more-count">{{ data()!.jobs.length }} of {{ total() }}</span>
              </div>
            }
          }

        } @else {
          @for (i of [1,2,3]; track i) {
            <div class="skeleton-card"></div>
          }
        }

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
    :host {
      --bg: #FAFAFA;
      --panel: #FFFFFF;
      --ink: #0A0A0A;
      --muted: #737373;
      --sub: #A3A3A3;
      --rule: #E8E8E5;
      --accent: #84CC16;
      --accent-ink: #0A0A0A;
      --accent-text: #4D7C0F;
      --soft: #F5F5F3;
      --positive: #15803D;
      --warn: #B45309;
      --info: #3B82F6;
      --font: 'Geist', 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      --mono: 'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
      display: block;
    }
    * { box-sizing: border-box; }
    .page {
      min-height: calc(100vh - 56px);
      background: var(--bg);
      color: var(--ink);
      font-family: var(--font);
      -webkit-font-smoothing: antialiased;
    }
    .inner { max-width: 1180px; margin: 0 auto; padding: 28px 40px 24px; }

    /* ── Hero ─────────────────────────────── */
    .hero {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 24px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
    .eyebrow {
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0 0 6px;
    }
    .title {
      font-size: 32px;
      font-weight: 500;
      letter-spacing: -0.025em;
      margin: 0;
      line-height: 1;
      color: var(--ink);
    }
    .hero-meta {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--muted);
      margin-top: 8px;
    }
    .verified-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 999px;
      background: #F0FAE0;
      color: var(--accent-text);
      font-weight: 500;
    }
    .hero-meta-sep { color: var(--rule); }
    .hero-meta-text { font-family: var(--mono); font-variant-numeric: tabular-nums; }

    .hero-actions { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
    .action-pill {
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid var(--rule);
      background: var(--panel);
      color: var(--ink);
      font-size: 12.5px;
      font-family: var(--font);
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: border-color 0.15s, background 0.15s;
    }
    .action-pill:hover { border-color: var(--sub); }
    .action-pill--primary {
      background: var(--ink);
      border: none;
      color: #fff;
      padding: 8px 16px;
    }
    .action-pill--primary:hover { background: #262626; }
    .action-plus {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border-radius: 999px;
      background: var(--accent);
      color: var(--accent-ink);
      font-size: 11px;
      line-height: 1;
      font-weight: 700;
    }

    .verify-section { margin: 8px 0 14px; }

    /* ── Stat tabs ────────────────────────── */
    .stat-tabs {
      display: flex;
      gap: 10px;
      border-bottom: 1px solid var(--rule);
      margin: 12px 0 0;
    }
    .stat-tab {
      flex: 1;
      padding: 16px 18px;
      text-align: left;
      background: transparent;
      border: 1px solid transparent;
      border-bottom: 1px solid var(--rule);
      margin-bottom: -1px;
      border-radius: 12px 12px 0 0;
      cursor: pointer;
      font-family: var(--font);
      transition: background 0.12s, border-color 0.12s;
      position: relative;
    }
    .stat-tab:hover { background: rgba(0,0,0,0.02); }
    .stat-tab--active {
      background: var(--panel);
      border-color: var(--rule);
      border-bottom-color: var(--panel);
    }
    .stat-tab--active:hover { background: var(--panel); }
    .stat-val {
      font-size: 28px;
      font-weight: 500;
      color: var(--ink);
      letter-spacing: -0.025em;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      display: inline-flex;
      align-items: baseline;
      gap: 8px;
    }
    .stat-dot {
      width: 6px;
      height: 6px;
      border-radius: 3px;
      display: inline-block;
    }
    .stat-label {
      display: block;
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 500;
      margin-top: 8px;
    }
    .stat-tabs-skel {
      height: 90px;
      border-bottom: 1px solid var(--rule);
      margin: 12px 0 0;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }

    /* ── Section header ───────────────────── */
    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 20px 0 12px;
    }
    .section-label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 10.5px;
      color: var(--muted);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 500;
    }
    .section-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 18px;
      padding: 0 6px;
      border-radius: 999px;
      background: var(--ink);
      color: #fff;
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: 0;
    }
    .section-tools { display: flex; gap: 6px; align-items: center; }
    .section-sort {
      padding: 7px 12px;
      border-radius: 999px;
      border: 1px solid var(--rule);
      background: var(--panel);
      font-size: 11.5px;
      color: var(--muted);
      font-family: var(--font);
    }

    /* ── Jobs list ────────────────────────── */
    .jobs-list { display: flex; flex-direction: column; gap: 12px; }

    .job-card {
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 14px;
      overflow: hidden;
      transition: border-color 0.15s;
    }
    .job-card:has(.job-body) { border-color: #D4D4D1; }

    .job-row {
      width: 100%;
      padding: 18px 22px;
      border: none;
      background: transparent;
      text-align: left;
      cursor: pointer;
      font-family: var(--font);
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 18px;
      align-items: center;
    }
    .job-row:hover { background: rgba(0,0,0,0.015); }
    .job-row-main { min-width: 0; }
    .job-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .job-cat-dot {
      width: 6px; height: 6px;
      border-radius: 3px;
      flex-shrink: 0;
    }
    .job-title {
      font-size: 15.5px;
      font-weight: 500;
      color: var(--ink);
      letter-spacing: -0.012em;
    }
    .job-meta {
      margin-top: 8px;
      font-size: 12px;
      color: var(--muted);
      display: flex;
      gap: 8px;
      font-family: var(--mono);
      font-variant-numeric: tabular-nums;
      flex-wrap: wrap;
    }

    .job-row-right { text-align: right; flex-shrink: 0; }

    /* Status pills */
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: 10.5px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .status-dot { width: 5px; height: 5px; border-radius: 3px; }
    .status-open      { background: #EFF6FF; color: #1D4ED8; }
    .status-open .status-dot { background: var(--info); }
    .status-progress  { background: #FEF3C7; color: #92400E; }
    .status-progress .status-dot { background: var(--warn); }
    .status-completed { background: var(--soft); color: var(--muted); }
    .status-completed .status-dot { background: var(--muted); }

    .apps-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 999px;
      background: var(--soft);
      color: var(--muted);
      font-size: 11.5px;
      font-weight: 500;
    }
    .apps-chip--has {
      background: var(--ink);
      color: #fff;
    }
    .progress-note {
      font-size: 11.5px;
      color: var(--warn);
    }
    .completed-note {
      display: inline-flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      font-size: 11.5px;
      color: var(--muted);
    }
    .completed-amt {
      font-family: var(--mono);
      color: var(--positive);
      font-variant-numeric: tabular-nums;
    }

    .chev {
      width: 26px;
      height: 26px;
      border-radius: 999px;
      border: 1px solid var(--rule);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--muted);
      font-size: 13px;
      transition: transform 0.15s;
      flex-shrink: 0;
    }
    .chev--open { transform: rotate(180deg); }

    /* ── Expanded body ────────────────────── */
    .job-body {
      padding: 16px 22px 22px;
      border-top: 1px solid var(--rule);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .job-desc {
      font-size: 13px;
      color: var(--muted);
      line-height: 1.55;
      max-width: 880px;
      margin: 0;
    }
    .no-apps {
      font-size: 13px;
      color: var(--sub);
      margin: 0;
    }

    /* In-progress worker strip */
    .worker-strip {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 16px;
      align-items: center;
      padding: 14px 16px;
      border: 1px solid var(--rule);
      border-radius: 12px;
      background: var(--soft);
    }
    .worker-strip-left { display: flex; gap: 12px; align-items: center; min-width: 0; }
    .worker-avatar-sm {
      width: 36px; height: 36px;
      border-radius: 999px;
      background: var(--ink);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }
    .worker-strip-name {
      font-size: 13.5px;
      font-weight: 500;
      color: var(--ink);
      margin: 0;
    }
    .worker-strip-meta {
      font-size: 11.5px;
      color: var(--muted);
      font-family: var(--mono);
      margin: 2px 0 0;
    }
    .worker-strip-actions { display: flex; gap: 6px; }

    .btn-ghost-pill {
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid var(--rule);
      background: var(--panel);
      font-size: 12px;
      font-family: var(--font);
      color: var(--ink);
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
    }
    .btn-ghost-pill:hover { border-color: var(--sub); }
    .btn-ink-pill {
      padding: 8px 14px;
      border-radius: 999px;
      border: none;
      background: var(--ink);
      color: #fff;
      font-size: 12px;
      font-family: var(--font);
      font-weight: 500;
      cursor: pointer;
    }
    .btn-ink-pill:hover:not(:disabled) { background: #262626; }
    .btn-ink-pill:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Applications block */
    .apps-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 10px;
    }
    .apps-head-label {
      font-size: 10.5px;
      color: var(--muted);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 500;
    }
    .apps-head-count { color: var(--ink); }
    .apps-head-sort {
      font-size: 11px;
      color: var(--sub);
      font-family: var(--mono);
    }

    .apps-list { display: flex; flex-direction: column; gap: 10px; }

    .app-row {
      padding: 14px 16px;
      border: 1px solid var(--rule);
      border-radius: 12px;
      background: var(--panel);
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 14px;
      align-items: start;
    }
    .app-row--accepted {
      border-color: #D4D4D1;
      background: var(--soft);
    }

    .app-avatar {
      width: 40px; height: 40px;
      border-radius: 10px;
      background: var(--ink);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
    }

    .app-main { min-width: 0; }
    .app-name-line {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .app-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--ink);
      letter-spacing: -0.005em;
    }
    .app-id-pill {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 1px 7px;
      border-radius: 999px;
      background: #F0FAE0;
      color: var(--accent-text);
      font-size: 9.5px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .app-meta-mono {
      font-size: 11.5px;
      color: var(--muted);
      font-family: var(--mono);
      font-variant-numeric: tabular-nums;
    }
    .app-meta-mono--new { font-style: italic; }
    .app-meta-mono--dim { color: var(--sub); }

    .app-note {
      margin: 8px 0 0;
      padding: 8px 10px;
      border-radius: 8px;
      background: var(--soft);
      font-size: 12.5px;
      color: var(--muted);
      font-style: italic;
      line-height: 1.45;
      border-left: 2px solid var(--rule);
    }
    .app-row--accepted .app-note { background: var(--panel); }

    .app-link {
      margin-top: 10px;
      padding: 0;
      background: transparent;
      border: none;
      color: var(--ink);
      font-size: 12px;
      font-family: var(--font);
      font-weight: 500;
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 3px;
      text-decoration-color: var(--rule);
    }

    .app-right {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
      min-width: 130px;
    }
    .app-bid {
      font-size: 22px;
      font-weight: 500;
      color: var(--ink);
      letter-spacing: -0.025em;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    .app-bid-label {
      font-size: 10.5px;
      color: var(--muted);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .app-actions { display: flex; gap: 6px; margin-top: 4px; }
    .app-btn-pass {
      padding: 7px 12px;
      border-radius: 999px;
      border: 1px solid var(--rule);
      background: var(--panel);
      color: var(--muted);
      font-size: 11.5px;
      font-family: var(--font);
      cursor: pointer;
    }
    .app-btn-pass:hover { color: var(--ink); border-color: var(--sub); }
    .app-btn-accept {
      padding: 7px 14px;
      border-radius: 999px;
      border: none;
      background: var(--ink);
      color: #fff;
      font-size: 11.5px;
      font-family: var(--font);
      font-weight: 500;
      cursor: pointer;
    }
    .app-btn-accept:hover { background: #262626; }
    .app-hired {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      border-radius: 999px;
      background: var(--ink);
      color: #fff;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .app-passed {
      font-size: 11px;
      color: var(--sub);
      margin-top: 4px;
    }

    /* Completed strip */
    .completed-strip {
      padding: 14px 16px;
      border: 1px solid var(--rule);
      border-radius: 12px;
      background: var(--soft);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .completed-strip-text {
      font-size: 12.5px;
      color: var(--muted);
    }
    .completed-strip-name {
      color: var(--ink);
      font-weight: 500;
    }

    /* Review */
    .review-section {
      padding: 14px 16px;
      border: 1px solid var(--rule);
      border-radius: 12px;
      background: var(--panel);
    }
    .review-label {
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0;
    }
    .stars-row { display: flex; gap: 2px; margin: 8px 0 12px; }
    .star-btn {
      background: none;
      border: none;
      color: var(--rule);
      cursor: pointer;
      padding: 0;
      line-height: 1;
      transition: color 0.1s, transform 0.1s;
    }
    .star-btn:hover { transform: scale(1.15); }
    .star-active { color: #F59E0B; }
    .btn-review {
      background: var(--ink);
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 999px;
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      font-family: var(--font);
    }
    .btn-review:hover:not(:disabled) { background: #262626; }
    .btn-review:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Footer actions */
    .job-foot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 4px;
    }
    .btn-delete {
      padding: 7px 12px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: #B91C1C;
      font-size: 12px;
      font-family: var(--font);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .btn-delete:hover { background: rgba(220,38,38,0.06); }
    .delete-confirm {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 12.5px;
      color: var(--muted);
    }
    .delete-confirm-yes {
      padding: 5px 10px;
      border-radius: 999px;
      background: #DC2626;
      color: #fff;
      border: none;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font);
    }
    .delete-confirm-no {
      padding: 5px 10px;
      border-radius: 999px;
      background: transparent;
      color: var(--muted);
      border: 1px solid var(--rule);
      font-size: 11.5px;
      cursor: pointer;
      font-family: var(--font);
    }
    .delete-blocked {
      font-size: 11.5px;
      color: var(--sub);
    }

    /* Empty / filter empty */
    .empty-state {
      background: var(--panel);
      border: 1px dashed var(--rule);
      border-radius: 14px;
      padding: 56px 32px;
      text-align: center;
    }
    .empty-title {
      font-size: 16px;
      font-weight: 500;
      color: var(--ink);
      margin: 0 0 6px;
    }
    .empty-sub {
      font-size: 13px;
      color: var(--muted);
      margin: 0 0 18px;
    }
    .empty-cta {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 18px;
      border-radius: 999px;
      background: var(--ink);
      color: #fff;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
    }
    .empty-cta:hover { background: #262626; }
    .filter-empty {
      padding: 40px 24px;
      border: 1px dashed var(--rule);
      border-radius: 14px;
      text-align: center;
      background: var(--panel);
    }
    .filter-empty-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--ink);
      margin: 0;
    }
    .filter-empty-sub {
      font-size: 12px;
      color: var(--muted);
      margin: 4px 0 0;
    }

    /* Load more */
    .load-more-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-top: 18px;
    }
    .load-more-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--panel);
      color: var(--ink);
      border: 1px solid var(--rule);
      padding: 8px 18px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
    }
    .load-more-btn:hover:not(:disabled) { border-color: var(--sub); }
    .load-more-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .load-more-count {
      font-size: 11.5px;
      color: var(--sub);
      font-family: var(--mono);
    }
    .load-ring-sm {
      width: 12px; height: 12px;
      border: 2px solid #D4D4D1;
      border-top-color: var(--ink);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Skeleton */
    .skeleton-card {
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 14px;
      padding: 18px 22px;
      height: 80px;
      margin-bottom: 12px;
      animation: pulse 1.5s ease-in-out infinite;
    }

    /* Responsive */
    @media (max-width: 820px) {
      .inner { padding: 20px 16px 24px; }
      .hero { flex-direction: column; align-items: flex-start; }
      .hero-actions { width: 100%; }
      .stat-tabs { flex-wrap: wrap; }
      .stat-tab { min-width: calc(50% - 5px); flex: none; }
      .job-row { grid-template-columns: 1fr auto; }
      .job-row-right { grid-column: 1 / -1; text-align: left; }
      .app-row { grid-template-columns: auto 1fr; }
      .app-right { grid-column: 1 / -1; align-items: flex-start; }
      .worker-strip { grid-template-columns: 1fr; }
    }
  `]
})
export class ClientDashboardComponent implements OnInit {
  private api = inject(ApiService);
  chat = inject(ChatService);

  data = signal<ClientDashboard | null>(null);
  total = signal(0);
  loadingMore = signal(false);
  idVerified = signal(false);
  expandedJob = signal<string | null>(null);
  filter = signal<'ALL' | 'POSTED' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  showContent = signal(true);
  reviewRatings = signal<Record<string, number>>({});
  reviewedJobs = signal<Set<string>>(new Set());
  selectedApp = signal<Application | null>(null);
  selectedJobCompleted = signal(false);
  payingJob = signal<string | null>(null);
  releasingJob = signal<string | null>(null);
  verifyingPayment = signal<string | null>(null);
  confirmDeleteId = signal<string | null>(null);

  hasActiveApplication(job: Job): boolean {
    return job.applications.some(a => ['ACCEPTED', 'ASSIGNED', 'IN_PROGRESS'].includes(a.status));
  }

  canDelete(job: Job): boolean {
    if (this.hasActiveApplication(job)) return false;
    if (job.scheduledDate) {
      const hoursUntil = (new Date(job.scheduledDate).getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntil < 24) return false;
    }
    return true;
  }

  deleteJob(jobId: string) {
    this.api.deleteJob(jobId).subscribe({
      next: () => {
        this.confirmDeleteId.set(null);
        this.load();
      },
      error: (err: { error?: { message?: string } }) => {
        alert(err?.error?.message ?? 'Could not delete job.');
        this.confirmDeleteId.set(null);
      },
    });
  }

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

  ngOnInit() {
    this.load();
    this.api.getVerifyStatus().subscribe({
      next: (s) => this.idVerified.set(s.idVerified),
    });
  }

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

  fundJob(jobId: string) {
    if (this.payingJob()) return;
    this.payingJob.set(jobId);
    this.api.createJobPaymentSession(jobId).subscribe({
      next: ({ url }) => { window.location.href = url!; },
      error: () => this.payingJob.set(null),
    });
  }

  releasePayment(jobId: string) {
    if (this.releasingJob()) return;
    this.releasingJob.set(jobId);
    this.api.completeJob(jobId).subscribe({
      next: () => { this.releasingJob.set(null); this.load(); },
      error: (err: any) => {
        alert(err?.error?.message ?? 'Could not complete job');
        this.releasingJob.set(null);
      },
    });
  }

  verifyPayment(jobId: string) {
    if (this.verifyingPayment()) return;
    this.verifyingPayment.set(jobId);
    this.api.reconfirmJobPayment(jobId).subscribe({
      next: () => { this.verifyingPayment.set(null); this.load(); },
      error: (err: any) => {
        alert(err?.error?.message ?? 'Could not verify payment');
        this.verifyingPayment.set(null);
      },
    });
  }

  jobPrice(job: Job): number | null {
    const accepted = job.applications.find(a => a.status === 'ACCEPTED');
    return accepted?.proposedPrice ?? job.priceMax ?? job.priceMin ?? null;
  }

  acceptedApp(job: Job): Application | null {
    return job.applications.find(a => a.status === 'ACCEPTED') ?? null;
  }

  statusGroup(status: string): 'open' | 'progress' | 'completed' {
    if (status === 'POSTED' || status === 'DRAFT') return 'open';
    if (status === 'IN_PROGRESS' || status === 'ASSIGNED') return 'progress';
    return 'completed';
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
      POSTED: 'Open', ASSIGNED: 'Awaiting payment', IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed', CANCELLED: 'Cancelled', DRAFT: 'Draft',
      APPLIED: 'Applied', ACCEPTED: 'Accepted', REJECTED: 'Declined',
    };
    return map[status] ?? status;
  }

}
