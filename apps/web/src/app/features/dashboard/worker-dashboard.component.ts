import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ChatService } from '../../core/services/chat.service';

interface WorkerStats { totalJobs: number; rating: number; totalReviews: number; applied: number; accepted: number; completed: number; }
interface Application { id: string; status: string; proposedPrice: number | null; createdAt: string; job: { id: string; title: string; description: string | null; priceMin: number | null; priceMax: number | null; urgency: string; city: string | null; category: { name: string; icon: string } | null; }; }
interface WorkerDashboard { stats: WorkerStats; applications: Application[]; profile: { firstName: string; lastName: string; rating: number; isAvailable: boolean; } | null; }

@Component({
  selector: 'app-worker-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div class="inner">
          <div class="header-top">
            <div>
              <p class="eyebrow">Worker Dashboard</p>
              <h1 class="page-title">
                @if (data()?.profile) { Hey, {{ data()!.profile!.firstName }} }
                @else { My Dashboard }
              </h1>
            </div>
            <div class="header-actions">
              <a routerLink="/worker/jobs" class="btn-primary">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                Browse jobs
              </a>
              <a routerLink="/worker/profile" class="btn-outline">Profile</a>
            </div>
          </div>

          <!-- Stat bar -->
          @if (data()) {
            <div class="stat-bar">
              <button class="stat-item" [class.stat-active]="filter() === 'ALL'" (click)="setFilter('ALL')">
                <span class="stat-val">{{ data()!.stats.applied + directAssignmentCount() }}</span>
                <span class="stat-label">All</span>
              </button>
              <button class="stat-item" [class.stat-active]="filter() === 'NOTIFIED'" (click)="setFilter('NOTIFIED')">
                <span class="stat-val stat-notified">{{ directAssignmentCount() }}</span>
                <span class="stat-label">Requests</span>
              </button>
              <button class="stat-item" [class.stat-active]="filter() === 'APPLIED'" (click)="setFilter('APPLIED')">
                <span class="stat-val">{{ data()!.stats.applied }}</span>
                <span class="stat-label">Applied</span>
              </button>
              <button class="stat-item" [class.stat-active]="filter() === 'ACCEPTED'" (click)="setFilter('ACCEPTED')">
                <span class="stat-val stat-accepted">{{ data()!.stats.accepted }}</span>
                <span class="stat-label">Accepted</span>
              </button>
              <button class="stat-item" [class.stat-active]="filter() === 'COMPLETED'" (click)="setFilter('COMPLETED')">
                <span class="stat-val">{{ data()!.stats.totalJobs }}</span>
                <span class="stat-label">Completed</span>
              </button>
              <button class="stat-item stat-item--rating" [class.stat-active]="filter() === 'ALL'" (click)="setFilter('ALL')" style="cursor:default">
                <span class="stat-val stat-rating">
                  {{ data()!.stats.rating || '—' }}
                  @if (data()!.stats.rating) { <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> }
                </span>
                <span class="stat-label">Rating · {{ data()!.stats.totalReviews }} reviews</span>
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

          @if (data()) {

            <!-- Quick actions row -->
            <div class="quick-row">
              <a routerLink="/worker/jobs" class="quick-chip">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                Find new jobs
              </a>
              <a routerLink="/worker/profile" class="quick-chip">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Edit profile
              </a>
              <a routerLink="/pricing" class="quick-chip quick-chip--accent">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Upgrade to Pro
              </a>
            </div>

            <!-- Applications -->
            @if (showContent()) {
            <div class="list-anim">

            <div class="section-head">
              <span class="section-title">{{ filterLabel() }}</span>
              @if (filteredApps().length > 0) {
                <span class="section-badge">{{ filteredApps().length }}</span>
              }
            </div>

            @if (data()!.applications.length === 0) {
              <div class="empty-state">
                <div class="empty-icon">
                  <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                </div>
                <p class="empty-title">No applications yet</p>
                <p class="empty-sub">Browse nearby jobs and submit your first application.</p>
                <a routerLink="/worker/jobs" class="btn-primary">Browse jobs</a>
              </div>
            } @else if (filteredApps().length === 0) {
              <div class="filter-empty">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                No {{ filterLabel().toLowerCase() }}.
              </div>
            } @else {
              <div class="apps-list">
                @for (app of filteredApps(); track app.id) {
                  <div class="app-card" (click)="selectedApp.set(app)" style="cursor:pointer">
                    <!-- Top row: category + title + status -->
                    <div class="app-card-top">
                      <div class="app-cat-chip" [style.--dot]="catColor(app.job.category?.name)">
                        <span class="app-cat-dot"></span>
                        {{ app.job.category?.name || 'General' }}
                      </div>
                      @if (app.status === 'NOTIFIED') {
                        <span class="direct-badge">
                          <svg width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                          Direct request
                        </span>
                      }
                      <span class="status-pill status-{{ app.status.toLowerCase() }}">{{ statusLabel(app.status) }}</span>
                    </div>

                    <!-- Title -->
                    <p class="app-title">{{ app.job.title }}</p>

                    <!-- Description -->
                    @if (app.job.description) {
                      <p class="app-desc">{{ app.job.description }}</p>
                    }

                    <!-- Bottom meta row -->
                    <div class="app-meta">
                      @if (app.job.city) {
                        <span class="meta-chip">
                          <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          {{ app.job.city }}
                        </span>
                      }
                      @if (app.job.urgency) {
                        <span class="meta-chip urgency-{{ app.job.urgency.toLowerCase() }}">
                          <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {{ app.job.urgency | titlecase }}
                        </span>
                      }
                      @if (app.job.priceMin) {
                        <span class="meta-chip price-chip">
                          <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                          €{{ app.job.priceMin }}–{{ app.job.priceMax }}
                        </span>
                      }
                      @if (app.proposedPrice) {
                        <span class="meta-chip offer-chip">
                          Your offer €{{ app.proposedPrice }}
                        </span>
                      }
                      <span class="meta-date">Applied {{ app.createdAt | date:'d MMM y' }}</span>
                    </div>
                  </div>
                }
              </div>
            }

            </div><!-- /list-anim -->
            }<!-- /showContent -->

            @if ((data()?.applications?.length ?? 0) < total()) {
              <div class="load-more-row">
                <button class="load-more-btn" (click)="loadMore()" [disabled]="loadingMore()">
                  @if (loadingMore()) { <span class="load-ring-sm"></span> Loading… }
                  @else { Load more }
                </button>
                <span class="load-more-count">{{ data()!.applications.length }} of {{ total() }}</span>
              </div>
            }

          } @else {
            <!-- Skeleton -->
            <div class="skeleton-bar"></div>
            @for (i of [1,2,3,4,5]; track i) {
              <div class="skeleton-row"></div>
            }
          }

        </div>
      </div>
    </div>

    <!-- Application detail modal -->
    @if (selectedApp()) {
      <div class="overlay" (click)="selectedApp.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">

          <!-- Modal header -->
          <div class="modal-head">
            <div class="modal-cat-chip" [style.--dot]="catColor(selectedApp()!.job.category?.name)">
              <span class="modal-cat-dot"></span>
              {{ selectedApp()!.job.category?.name || 'General' }}
            </div>
            <button class="modal-close" (click)="selectedApp.set(null)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="modal-body">

            <!-- Job section -->
            <div class="modal-section">
              <div class="modal-title-row">
                <h2 class="modal-job-title">{{ selectedApp()!.job.title }}</h2>
                <span class="status-pill status-{{ selectedApp()!.status.toLowerCase() }}">{{ statusLabel(selectedApp()!.status) }}</span>
              </div>

              <div class="modal-chips">
                @if (selectedApp()!.job.city) {
                  <span class="detail-chip">
                    <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {{ selectedApp()!.job.city }}
                  </span>
                }
                @if (selectedApp()!.job.urgency) {
                  <span class="detail-chip urgency-{{ selectedApp()!.job.urgency.toLowerCase() }}">
                    <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {{ selectedApp()!.job.urgency | titlecase }}
                  </span>
                }
                @if (selectedApp()!.job.priceMin) {
                  <span class="detail-chip detail-chip--price">
                    <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                    €{{ selectedApp()!.job.priceMin }}–{{ selectedApp()!.job.priceMax }}
                  </span>
                }
              </div>

              @if (selectedApp()!.job.description) {
                <p class="modal-desc">{{ selectedApp()!.job.description }}</p>
              }
            </div>

            <div class="modal-divider"></div>

            <!-- Direct assignment banner -->
            @if (selectedApp()!.status === 'NOTIFIED') {
              <div class="direct-assign-banner">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                A client sent you a direct request for this job. Accept to confirm, or decline to pass.
              </div>
            }

            <!-- Application section -->
            <div class="modal-section">
              <p class="modal-section-label">My Application</p>
              <div class="app-detail-grid">
                <div class="app-detail-item">
                  <span class="app-detail-label">Status</span>
                  <span class="status-pill status-{{ selectedApp()!.status.toLowerCase() }}">{{ statusLabel(selectedApp()!.status) }}</span>
                </div>
                <div class="app-detail-item">
                  <span class="app-detail-label">Date applied</span>
                  <span class="app-detail-val">{{ selectedApp()!.createdAt | date:'d MMM y' }}</span>
                </div>
                @if (selectedApp()!.proposedPrice) {
                  <div class="app-detail-item">
                    <span class="app-detail-label">Your offer</span>
                    <span class="app-detail-val app-detail-val--price">€{{ selectedApp()!.proposedPrice }}</span>
                  </div>
                }
              </div>
            </div>


          </div>

          <div class="modal-footer">
            <button class="modal-dismiss" (click)="selectedApp.set(null)">Close</button>
            @if (selectedApp()!.status === 'NOTIFIED') {
              <button class="modal-decline" (click)="declineAssignment(selectedApp()!.id)">Decline</button>
              <button class="modal-accept" (click)="acceptAssignment(selectedApp()!.id)">Accept job</button>
            } @else if (selectedApp()!.status === 'APPLIED') {
              <button class="modal-withdraw" (click)="withdrawApplication(selectedApp()!.id)">Withdraw application</button>
            } @else if (selectedApp()!.status === 'ACCEPTED' || selectedApp()!.status === 'IN_PROGRESS') {
              <button class="modal-chat-btn" (click)="chat.openChat(selectedApp()!.job.id); chat.openWidget(); selectedApp.set(null)">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                Chat with client
              </button>
            } @else {
              <a routerLink="/worker/jobs" class="modal-browse" (click)="selectedApp.set(null)">Browse more jobs</a>
            }
          </div>

        </div>
      </div>
    }
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
    .header-actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: #18181b; color: #fff; text-decoration: none;
      padding: 0.5rem 1rem; border-radius: 99px;
      font-size: 0.82rem; font-weight: 600; border: none; cursor: pointer;
      transition: background 0.15s; font-family: inherit; white-space: nowrap;
    }
    .btn-primary:hover { background: #27272a; }

    .btn-outline {
      display: inline-flex; align-items: center;
      background: transparent; color: #3f3f46; text-decoration: none;
      padding: 0.5rem 1rem; border-radius: 99px;
      font-size: 0.82rem; font-weight: 500;
      border: 1.5px solid #e4e4e7; transition: border-color 0.15s, background 0.15s;
    }
    .btn-outline:hover { border-color: #a1a1aa; background: rgba(0,0,0,0.02); }

    /* ── Stat bar ─────────────────────────── */
    .stat-bar {
      display: flex;
      align-items: stretch;
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
      background: #18181b;
      border-radius: 2px 2px 0 0;
    }
    .stat-item--rating { cursor: default !important; }
    .stat-item--rating:hover { background: none !important; }
    .stat-val {
      font-size: 1.4rem;
      font-weight: 700;
      color: #18181b;
      letter-spacing: -0.025em;
      line-height: 1;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
    .stat-accepted { color: #0f766e; }
    .stat-rating { font-size: 1.3rem; }
    .stat-label { font-size: 0.72rem; color: #a1a1aa; font-weight: 500; }
    .stat-bar-skeleton {
      height: 72px;
      border-top: 1px solid #e4e4e7;
      animation: pulse 1.5s ease-in-out infinite;
    }

    /* ── List animation ──────────────────── */
    .list-anim {
      animation: listSlideIn 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
    }
    @keyframes listSlideIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
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

    /* ── Quick chips ──────────────────────── */
    .quick-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }
    .quick-chip {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: #fff; color: #3f3f46; text-decoration: none;
      padding: 0.45rem 0.875rem;
      border: 1.5px solid #e4e4e7; border-radius: 99px;
      font-size: 0.8rem; font-weight: 500;
      transition: border-color 0.15s, background 0.15s;
    }
    .quick-chip:hover { border-color: #a1a1aa; color: #18181b; }
    .quick-chip--accent {
      background: rgba(14,107,122,0.05);
      border-color: rgba(14,107,122,0.2);
      color: #0e6b7a;
    }
    .quick-chip--accent:hover { background: rgba(14,107,122,0.1); border-color: rgba(14,107,122,0.35); }

    /* ── Section heading ──────────────────── */
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
      background: #18181b;
      color: #fff;
      font-size: 0.6rem;
      font-weight: 700;
      padding: 0.08rem 0.42rem;
      border-radius: 99px;
    }

    /* ── App list ─────────────────────────── */
    .apps-list {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }
    .app-card {
      background: #fff;
      border: 1.5px solid #e4e4e7;
      border-radius: 14px;
      padding: 1rem 1.25rem;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .app-card:hover {
      border-color: #d4d4d8;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    }

    .app-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .app-cat-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.72rem;
      font-weight: 600;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .app-cat-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--dot, #a1a1aa);
      flex-shrink: 0;
    }

    .app-title {
      font-size: 0.925rem;
      font-weight: 600;
      color: #18181b;
      margin: 0 0 0.4rem;
      line-height: 1.35;
    }
    .app-desc {
      font-size: 0.82rem;
      color: #71717a;
      line-height: 1.55;
      margin: 0 0 0.75rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .app-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.375rem;
    }
    .meta-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.72rem;
      font-weight: 500;
      color: #71717a;
      background: #f4f4f5;
      padding: 0.2rem 0.55rem;
      border-radius: 99px;
    }
    .urgency-urgent   { background: rgba(239,68,68,0.07);  color: #dc2626; }
    .urgency-high     { background: rgba(245,158,11,0.08); color: #b45309; }
    .urgency-normal   { background: rgba(0,0,0,0.05);      color: #71717a; }
    .price-chip { background: rgba(37,99,235,0.07); color: #2563eb; }
    .offer-chip { background: rgba(15,118,110,0.08); color: #0f766e; font-weight: 600; }
    .meta-date {
      margin-left: auto;
      font-size: 0.7rem;
      color: #a1a1aa;
    }

    .status-pill {
      font-size: 0.68rem;
      font-weight: 600;
      padding: 0.18rem 0.55rem;
      border-radius: 6px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .status-applied   { background: rgba(37,99,235,0.08);   color: #1d4ed8; }
    .status-accepted  { background: rgba(20,184,166,0.1);   color: #0f766e; }
    .status-rejected  { background: rgba(239,68,68,0.08);   color: #dc2626; }
    .status-completed { background: rgba(0,0,0,0.05);       color: #71717a; }
    .status-suggested { background: rgba(245,158,11,0.1);   color: #b45309; }
    .status-notified  { background: rgba(99,102,241,0.1);   color: #4f46e5; }
    .status-withdrawn { background: rgba(0,0,0,0.05);       color: #a1a1aa; }
    .stat-notified    { color: #4f46e5; }
    .direct-badge {
      display: inline-flex; align-items: center; gap: 0.3rem;
      font-size: 0.65rem; font-weight: 700; letter-spacing: 0.04em;
      background: rgba(99,102,241,0.1); color: #4f46e5;
      padding: 0.18rem 0.5rem; border-radius: 6px;
    }

    /* ── Empty ────────────────────────────── */
    .empty-state {
      text-align: center;
      padding: 3.5rem 2rem;
      background: #fff;
      border: 1.5px dashed #e4e4e7;
      border-radius: 14px;
    }
    .empty-icon {
      width: 44px; height: 44px; border-radius: 11px;
      background: #f4f4f5; color: #a1a1aa;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1rem;
    }
    .empty-title { font-size: 0.95rem; font-weight: 600; color: #18181b; margin: 0 0 0.3rem; }
    .empty-sub { font-size: 0.84rem; color: #71717a; margin: 0 0 1.25rem; }

    /* ── Skeleton ─────────────────────────── */
    .skeleton-bar {
      height: 72px; background: #fff; border: 1.5px solid #e4e4e7;
      border-radius: 14px; margin-bottom: 1.5rem;
      animation: pulse 1.5s ease-in-out infinite;
    }
    .skeleton-row {
      height: 56px; background: #fff; border: 1.5px solid #e4e4e7;
      border-radius: 10px; margin-bottom: 0.5rem;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

    /* ── Modal ────────────────────────────── */
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
      animation: fadeOverlay 200ms ease-out both;
    }
    @keyframes fadeOverlay {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    .modal {
      background: #fff;
      border-radius: 20px;
      width: 100%;
      max-width: 560px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 24px 64px rgba(0,0,0,0.18);
      overflow: hidden;
      animation: modalSlideUp 240ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
    }
    @keyframes modalSlideUp {
      from { opacity: 0; transform: translateY(16px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .modal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.125rem 1.375rem 0.875rem;
      border-bottom: 1px solid #f4f4f5;
      flex-shrink: 0;
    }
    .modal-cat-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.72rem;
      font-weight: 700;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .modal-cat-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--dot, #a1a1aa);
      flex-shrink: 0;
    }
    .modal-close {
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
    .modal-close:hover { background: #e4e4e7; color: #18181b; }

    .modal-body {
      overflow-y: auto;
      flex: 1;
      padding: 0;
    }
    .modal-section { padding: 1.375rem; }
    .modal-divider { height: 1px; background: #f4f4f5; }
    .direct-assign-banner {
      display: flex; align-items: flex-start; gap: 0.6rem;
      margin: 0 1.375rem;
      padding: 0.875rem 1rem;
      background: rgba(99,102,241,0.07);
      border: 1px solid rgba(99,102,241,0.18);
      border-radius: 10px;
      font-size: 0.82rem; color: #4f46e5; line-height: 1.5;
      margin-bottom: 0;
    }

    .modal-title-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.875rem;
      flex-wrap: wrap;
    }
    .modal-job-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: #18181b;
      letter-spacing: -0.02em;
      margin: 0;
      line-height: 1.3;
      flex: 1;
    }

    .modal-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin-bottom: 1rem;
    }
    .detail-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #71717a;
      background: #f4f4f5;
      padding: 0.25rem 0.6rem;
      border-radius: 99px;
    }
    .urgency-urgent   { background: rgba(239,68,68,0.07);  color: #dc2626; }
    .urgency-high     { background: rgba(245,158,11,0.08); color: #b45309; }
    .urgency-normal   { background: rgba(0,0,0,0.05);      color: #71717a; }
    .detail-chip--price { background: rgba(37,99,235,0.07); color: #2563eb; }

    .modal-desc {
      font-size: 0.875rem;
      color: #3f3f46;
      line-height: 1.75;
      margin: 0;
      white-space: pre-line;
    }

    .modal-section-label {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: #a1a1aa;
      margin: 0 0 0.875rem;
    }
    .app-detail-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .app-detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .app-detail-label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #a1a1aa;
    }
    .app-detail-val {
      font-size: 0.9rem;
      font-weight: 600;
      color: #18181b;
    }
    .app-detail-val--price { color: #0f766e; font-size: 1rem; }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 0.875rem 1.375rem;
      border-top: 1px solid #f4f4f5;
      flex-shrink: 0;
    }
    .modal-dismiss {
      background: transparent;
      color: #71717a;
      border: 1.5px solid #e4e4e7;
      padding: 0.55rem 1.125rem;
      border-radius: 99px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
      font-family: inherit;
    }
    .modal-dismiss:hover { background: rgba(0,0,0,0.03); }
    .modal-browse {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #18181b;
      color: #fff;
      text-decoration: none;
      padding: 0.55rem 1.125rem;
      border-radius: 99px;
      font-size: 0.875rem;
      font-weight: 600;
      transition: background 0.15s;
    }
    .modal-browse:hover { background: #27272a; }
    .modal-decline {
      display: inline-flex; align-items: center;
      background: transparent; color: #dc2626;
      border: 1.5px solid rgba(239,68,68,0.3);
      padding: 0.55rem 1.125rem; border-radius: 99px;
      font-size: 0.875rem; font-weight: 500;
      cursor: pointer; transition: background 0.15s; font-family: inherit;
    }
    .modal-decline:hover { background: rgba(239,68,68,0.06); }
    .modal-accept {
      display: inline-flex; align-items: center;
      background: #4f46e5; color: #fff;
      border: none; padding: 0.55rem 1.25rem; border-radius: 99px;
      font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: background 0.15s; font-family: inherit;
    }
    .modal-accept:hover { background: #4338ca; }
    .modal-chat-btn {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: #18181b; color: #fff;
      border: none; padding: 0.55rem 1.25rem; border-radius: 99px;
      font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: background 0.15s; font-family: inherit;
    }
    .modal-chat-btn:hover { background: #3f3f46; }
    .modal-withdraw {
      display: inline-flex; align-items: center;
      background: transparent; color: #71717a;
      border: 1.5px solid #e4e4e7;
      padding: 0.55rem 1.125rem; border-radius: 99px;
      font-size: 0.875rem; font-weight: 500;
      cursor: pointer; transition: background 0.15s, color 0.15s, border-color 0.15s; font-family: inherit;
    }
    .modal-withdraw:hover { border-color: #dc2626; color: #dc2626; background: rgba(239,68,68,0.04); }

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

    @media (max-width: 640px) {
      .inner { padding: 0 1rem; }
      .stat-bar { flex-wrap: wrap; }
      .stat-item { min-width: 50%; }
      .modal { max-height: 100vh; border-radius: 20px 20px 0 0; align-self: flex-end; }
    }
  `]
})
export class WorkerDashboardComponent implements OnInit {
  private api = inject(ApiService);
  chat = inject(ChatService);
  data = signal<WorkerDashboard | null>(null);
  total = signal(0);
  loadingMore = signal(false);
  filter = signal<'ALL' | 'NOTIFIED' | 'APPLIED' | 'ACCEPTED' | 'COMPLETED'>('ALL');
  showContent = signal(true);
  selectedApp = signal<Application | null>(null);

  directAssignmentCount = computed(() =>
    (this.data()?.applications ?? []).filter(a => a.status === 'NOTIFIED').length
  );

  ngOnInit() { this.load(); }

  load() {
    this.api.getWorkerDashboard(0).subscribe({
      next: (d: any) => {
        this.data.set({ stats: d.stats, applications: d.applications, profile: d.profile });
        this.total.set(d.total);
      },
    });
  }

  loadMore() {
    this.loadingMore.set(true);
    this.api.getWorkerDashboard(this.data()!.applications.length).subscribe({
      next: (d: any) => {
        this.data.update(prev => prev ? { ...prev, applications: [...prev.applications, ...d.applications] } : null);
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false),
    });
  }

  private reload() {
    this.api.getWorkerDashboard(0).subscribe({
      next: (d: any) => {
        this.data.set({ stats: d.stats, applications: d.applications, profile: d.profile });
        this.total.set(d.total);
      },
    });
  }

  filteredApps(): Application[] {
    const apps = this.data()?.applications ?? [];
    const f = this.filter();
    if (f === 'ALL') return apps;
    return apps.filter(a => a.status === f);
  }

  filterLabel(): string {
    const map: Record<string, string> = {
      ALL: 'My applications', NOTIFIED: 'Direct requests', APPLIED: 'Applied', ACCEPTED: 'Accepted', COMPLETED: 'Completed',
    };
    return map[this.filter()] ?? 'Applications';
  }

  setFilter(f: 'ALL' | 'NOTIFIED' | 'APPLIED' | 'ACCEPTED' | 'COMPLETED') {
    if (this.filter() === f) return;
    this.showContent.set(false);
    setTimeout(() => {
      this.filter.set(f);
      this.showContent.set(true);
    }, 80);
  }

  withdrawApplication(applicationId: string) {
    this.api.workerWithdrawApplication(applicationId).subscribe({
      next: () => {
        this.selectedApp.set(null);
        this.reload();
      },
    });
  }

  acceptAssignment(applicationId: string) {
    this.api.workerAcceptAssignment(applicationId).subscribe({
      next: () => { this.selectedApp.set(null); this.reload(); },
    });
  }

  declineAssignment(applicationId: string) {
    this.api.workerDeclineAssignment(applicationId).subscribe({
      next: () => { this.selectedApp.set(null); this.reload(); },
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      APPLIED: 'Applied', ACCEPTED: 'Accepted', REJECTED: 'Rejected',
      COMPLETED: 'Completed', SUGGESTED: 'Suggested', NOTIFIED: 'Pending response',
      WITHDRAWN: 'Withdrawn',
    };
    return map[status] ?? status;
  }

  catColor(category?: string): string {
    const map: Record<string, string> = {
      'Cleaning': '#14b8a6', 'Plumbing': '#2563eb', 'Electrical': '#f59e0b',
      'Moving': '#8b5cf6', 'Gardening': '#16a34a', 'Painting': '#f97316',
    };
    return map[category ?? ''] ?? '#a1a1aa';
  }
}
