import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ChatService } from '../../core/services/chat.service';

interface WorkerStats { totalJobs: number; rating: number; totalReviews: number; applied: number; accepted: number; completed: number; }
interface Application {
  id: string;
  status: string;
  proposedPrice: number | null;
  createdAt: string;
  job: {
    id: string;
    title: string;
    description: string | null;
    priceMin: number | null;
    priceMax: number | null;
    urgency: string;
    city: string | null;
    status: string;
    category: { name: string; icon: string } | null;
  };
}
interface WorkerDashboard {
  stats: WorkerStats;
  applications: Application[];
  profile: { firstName: string; lastName: string; rating: number; isAvailable: boolean; } | null;
}

type ColId = 'request' | 'applied' | 'accepted' | 'completed';

interface Column {
  id: ColId;
  label: string;
  hint: string;
  dot: string;
  solid?: boolean;
}

@Component({
  selector: 'app-worker-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  template: `
    <div class="page">

      <!-- Header -->
      <header class="hdr">
        <div class="hdr-left">
          <p class="hdr-eyebrow">Pipeline · {{ today() }}</p>
          <h1 class="hdr-title">
            Hey, {{ firstName() }}.
            <span class="hdr-counts">
              {{ requestCount() }} new request@if (requestCount() !== 1) {s}
              · {{ activeCount() }} active
            </span>
          </h1>
        </div>
        <div class="hdr-actions">
          <a routerLink="/worker/jobs" class="action-pill">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
            Find jobs
          </a>
          <a routerLink="/worker/profile" class="action-pill">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>
            Edit profile
          </a>
          <a routerLink="/pricing" class="action-pill action-pill--primary">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--rg-accent, #84CC16)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m13 2-9 12h7l-1 8 9-12h-7z"/></svg>
            Upgrade to Pro
          </a>
        </div>
      </header>

      <!-- Hero bar -->
      <div class="hero">
        <div class="hero-next">
          <div class="hero-next-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </div>
          <div class="hero-next-text">
            <p class="hero-next-label">
              @if (firstActive()) {
                Next up · {{ firstActive()!.createdAt | date:'EEE HH:mm' }}
              } @else {
                No active job
              }
            </p>
            <p class="hero-next-title">
              {{ firstActive()?.job?.title ?? 'Take a request to get started' }}
            </p>
          </div>
          @if (firstActive(); as a) {
            <button
              class="hero-next-cta"
              (click)="openChat(a.job.id)"
              type="button"
            >I'm on the way</button>
          }
        </div>

        @for (stat of statsRow(); track stat.label) {
          <div class="hero-stat">
            <p class="hero-stat-label">{{ stat.label }}</p>
            <p class="hero-stat-val">{{ stat.value }}</p>
            <p class="hero-stat-sub">{{ stat.sub }}</p>
          </div>
        }
      </div>

      <!-- Kanban grid -->
      <div class="board">
        @if (data()) {
          @for (col of columns; track col.id) {
            @let apps = byColumn()[col.id];
            <section class="col">
              <header class="col-head">
                <div class="col-head-left">
                  <span
                    class="col-dot"
                    [style.background]="col.dot"
                    [style.boxShadow]="col.solid ? '0 0 6px ' + col.dot : 'none'"
                  ></span>
                  <span class="col-label">{{ col.label }}</span>
                  <span class="col-count">{{ apps.length }}</span>
                </div>
                <span class="col-sum">€{{ colSum(apps) }}</span>
              </header>
              <p class="col-hint">{{ col.hint }}</p>

              <div class="col-list">
                @for (app of apps; track app.id) {
                  <article
                    class="mini"
                    [class.mini--active]="col.id === 'accepted'"
                    (click)="selectedApp.set(app)"
                  >
                    <div class="mini-top">
                      <span class="mini-cat">
                        <span class="mini-cat-dot" [style.background]="catColor(app.job.category?.name)"></span>
                        {{ app.job.category?.name || 'General' }}
                      </span>
                      <span class="mini-ts">{{ relTime(app.createdAt) }}</span>
                    </div>

                    <p class="mini-title">{{ app.job.title }}</p>

                    @if (col.id === 'completed') {
                      <span
                        class="mini-status"
                        [class.mini-status--ok]="app.status === 'COMPLETED'"
                        [class.mini-status--reject]="app.status === 'REJECTED'"
                        [class.mini-status--withdraw]="app.status === 'WITHDRAWN'"
                      >
                        @switch (app.status) {
                          @case ('COMPLETED') { Completed · paid out }
                          @case ('REJECTED')  { Not selected }
                          @case ('WITHDRAWN') { Withdrawn }
                        }
                      </span>
                    }

                    <div class="mini-foot">
                      <span class="mini-loc">
                        {{ app.job.city || 'Vienna' }}
                      </span>
                      <span
                        class="mini-pay"
                        [class.mini-pay--accent]="col.id === 'accepted'"
                        [class.mini-pay--muted]="app.status === 'REJECTED' || app.status === 'WITHDRAWN'"
                      >€{{ offer(app) }}</span>
                    </div>

                    @if (col.id === 'request' || col.id === 'accepted') {
                      <p class="mini-note">
                        @if (col.id === 'request') {
                          Client requested you directly.
                        } @else if (app.job.status === 'IN_PROGRESS') {
                          On the way · message client
                        } @else {
                          Confirmed · plan your visit
                        }
                      </p>
                    }

                    @if (col.id === 'request') {
                      <div class="mini-actions">
                        <button
                          class="mini-btn mini-btn--ghost"
                          (click)="$event.stopPropagation(); declineAssignment(app.id)"
                          type="button"
                        >Pass</button>
                        <button
                          class="mini-btn mini-btn--accept"
                          (click)="$event.stopPropagation(); acceptAssignment(app.id)"
                          type="button"
                        >Accept →</button>
                      </div>
                    }

                    @if (col.id === 'accepted') {
                      <button
                        class="mini-btn mini-btn--chat"
                        (click)="$event.stopPropagation(); openChat(app.job.id)"
                        type="button"
                      >Open chat →</button>
                    }
                  </article>
                }

                @if (apps.length === 0) {
                  <div class="col-empty">Nothing here.</div>
                }
              </div>
            </section>
          }
        } @else {
          @for (i of [1,2,3,4]; track i) {
            <div class="col col-skel"></div>
          }
        }
      </div>

      @if ((data()?.applications?.length ?? 0) < total()) {
        <div class="load-more-row">
          <button class="load-more-btn" (click)="loadMore()" [disabled]="loadingMore()" type="button">
            @if (loadingMore()) { <span class="load-ring-sm"></span> Loading… }
            @else { Load more }
          </button>
          <span class="load-more-count">{{ data()!.applications.length }} of {{ total() }}</span>
        </div>
      }
    </div>

    <!-- Application detail modal -->
    @if (selectedApp()) {
      <div class="overlay" (click)="selectedApp.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <div class="modal-cat-chip" [style.--dot]="catColor(selectedApp()!.job.category?.name)">
              <span class="modal-cat-dot"></span>
              {{ selectedApp()!.job.category?.name || 'General' }}
            </div>
            <button class="modal-close" (click)="selectedApp.set(null)" type="button">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="modal-section">
              <div class="modal-title-row">
                <h2 class="modal-job-title">{{ selectedApp()!.job.title }}</h2>
                <span class="status-pill status-{{ selectedApp()!.status.toLowerCase() }}">{{ statusLabel(selectedApp()!.status) }}</span>
              </div>
              <div class="modal-chips">
                @if (selectedApp()!.job.city) {
                  <span class="detail-chip">{{ selectedApp()!.job.city }}</span>
                }
                @if (selectedApp()!.job.urgency) {
                  <span class="detail-chip urgency-{{ selectedApp()!.job.urgency.toLowerCase() }}">
                    {{ selectedApp()!.job.urgency | titlecase }}
                  </span>
                }
                @if (selectedApp()!.job.priceMin) {
                  <span class="detail-chip detail-chip--price">
                    €{{ selectedApp()!.job.priceMin }}–{{ selectedApp()!.job.priceMax }}
                  </span>
                }
              </div>
              @if (selectedApp()!.job.description) {
                <p class="modal-desc">{{ selectedApp()!.job.description }}</p>
              }
            </div>

            <div class="modal-divider"></div>

            @if (selectedApp()!.status === 'NOTIFIED') {
              <div class="direct-assign-banner">
                A client sent you a direct request for this job. Accept to confirm, or decline to pass.
              </div>
            }

            <div class="modal-section">
              <p class="modal-section-label">My application</p>
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
            <button class="modal-dismiss" (click)="selectedApp.set(null)" type="button">Close</button>
            @if (selectedApp()!.status === 'NOTIFIED') {
              <button class="modal-decline" (click)="declineAssignment(selectedApp()!.id)" type="button">Decline</button>
              <button class="modal-accept" (click)="acceptAssignment(selectedApp()!.id)" type="button">Accept job</button>
            } @else if (selectedApp()!.status === 'APPLIED') {
              <button class="modal-withdraw" (click)="withdrawApplication(selectedApp()!.id)" type="button">Withdraw application</button>
            } @else if (selectedApp()!.status === 'ACCEPTED' || selectedApp()!.status === 'IN_PROGRESS') {
              <button class="modal-chat-btn" (click)="openChat(selectedApp()!.job.id); selectedApp.set(null)" type="button">
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
    :host {
      --bg: var(--rg-bg, #fafafa);
      --panel: var(--rg-panel, #FFFFFF);
      --ink: var(--rg-ink, #0A0A0A);
      --muted: var(--rg-muted, #737373);
      --sub: var(--rg-sub, #A3A3A3);
      --rule: var(--rg-rule, #E8E8E5);
      --accent: var(--rg-accent, #84CC16);
      --accent-ink: var(--rg-ink, #0A0A0A);
      --accent-text: var(--rg-accent-text, #4D7C0F);
      --col-bg: var(--rg-soft, #F5F5F3);
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
      display: flex;
      flex-direction: column;
    }

    /* ── Header ───────────────────────────── */
    .hdr {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      padding: 26px 32px 14px;
    }
    .hdr-eyebrow {
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      margin: 0 0 6px;
      font-weight: 500;
    }
    .hdr-title {
      font-size: 32px;
      font-weight: 500;
      letter-spacing: -0.025em;
      margin: 0;
      line-height: 1;
      display: inline-flex;
      align-items: baseline;
      gap: 14px;
      flex-wrap: wrap;
    }
    .hdr-counts {
      font-size: 14px;
      color: var(--muted);
      font-weight: 400;
    }
    .hdr-actions {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }

    .action-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 16px;
      border-radius: 999px;
      border: 1px solid var(--rule);
      background: var(--panel);
      color: var(--ink);
      font-size: 13px;
      font-family: var(--font);
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      transition: border-color 0.15s, background 0.15s;
    }
    .action-pill:hover { border-color: var(--sub); }
    .action-pill--primary {
      background: var(--rg-invert-bg, #0A0A0A);
      border: none;
      color: var(--rg-invert-fg, #fff);
      font-weight: 600;
    }
    .action-pill--primary:hover { background: var(--rg-invert-hover, #262626); }

    /* ── Hero bar ─────────────────────────── */
    .hero {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 10px;
      padding: 0 32px;
      margin-top: 4px;
    }
    .hero > * {
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 14px;
      padding: 16px 20px;
    }
    .hero-next {
      display: flex;
      align-items: center;
      gap: 12px;
      grid-column: span 1;
    }
    .hero-next-icon {
      width: 40px; height: 40px;
      border-radius: 10px;
      background: var(--rg-invert-bg, #0A0A0A);
      color: var(--rg-invert-fg, #fff);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .hero-next-text {
      min-width: 0;
      flex: 1;
    }
    .hero-next-label {
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0;
    }
    .hero-next-title {
      font-size: 15px;
      font-weight: 500;
      color: var(--ink);
      margin: 2px 0 0;
      letter-spacing: -0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .hero-next-cta {
      padding: 8px 14px;
      border-radius: 999px;
      background: var(--accent);
      color: var(--accent-ink);
      border: none;
      font-size: 12.5px;
      font-weight: 600;
      font-family: var(--font);
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    .hero-next-cta:hover { background: var(--rg-accent-hover, var(--rg-accent-hover, var(--rg-accent-hover, #A3E635))); }

    .hero-stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .hero-stat-label {
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0;
    }
    .hero-stat-val {
      font-size: 22px;
      font-weight: 500;
      letter-spacing: -0.018em;
      line-height: 1;
      margin: 0;
      font-variant-numeric: tabular-nums;
    }
    .hero-stat-sub {
      font-size: 11px;
      color: var(--sub);
      margin: 0;
    }

    /* ── Board ────────────────────────────── */
    .board {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      padding: 16px 32px 24px;
      align-items: stretch;
    }

    .col {
      background: var(--col-bg);
      border-radius: 14px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 0;
      min-height: 320px;
    }
    .col-skel {
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }

    .col-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 6px 8px;
      border-bottom: 1px solid var(--rule);
    }
    .col-head-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .col-dot {
      width: 8px; height: 8px;
      border-radius: 4px;
      flex-shrink: 0;
    }
    .col-label {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--ink);
      letter-spacing: -0.005em;
    }
    .col-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 18px;
      padding: 0 6px;
      border-radius: 999px;
      background: var(--rg-invert-bg, #0A0A0A);
      color: var(--rg-invert-fg, #fff);
      font-size: 10.5px;
      font-weight: 600;
    }
    .col-sum {
      font-size: 11px;
      color: var(--muted);
      font-family: var(--mono);
      font-variant-numeric: tabular-nums;
    }
    .col-hint {
      font-size: 11px;
      color: var(--muted);
      padding: 0 4px;
      line-height: 1.4;
      margin: 0;
    }
    .col-list {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
      overflow-y: auto;
      padding-right: 2px;
    }
    .col-empty {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px dashed var(--rule);
      border-radius: 10px;
      padding: 16px;
      font-size: 11.5px;
      color: var(--sub);
      text-align: center;
      line-height: 1.4;
      min-height: 80px;
    }

    /* ── Mini card ────────────────────────── */
    .mini {
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 12px;
      padding: 12px 14px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .mini:hover {
      border-color: var(--rg-rule, #D4D4D1);
    }
    .mini--active {
      border-color: var(--rg-rule, #D4D4D1);
      box-shadow: 0 4px 14px rgba(10,10,10,0.06);
    }
    .mini--active:hover {
      border-color: var(--rg-sub, #A3A3A3);
    }

    .mini-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .mini-cat {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 10.5px;
      color: var(--muted);
      font-weight: 500;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .mini-cat-dot {
      width: 5px; height: 5px;
      border-radius: 3px;
      flex-shrink: 0;
    }
    .mini-ts {
      font-size: 10.5px;
      color: var(--sub);
      font-family: var(--mono);
    }
    .mini-title {
      font-size: 13.5px;
      font-weight: 500;
      line-height: 1.3;
      color: var(--ink);
      letter-spacing: -0.005em;
      margin: 0;
    }
    .mini-foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-top: 2px;
    }
    .mini-loc {
      font-size: 11.5px;
      color: var(--muted);
    }
    .mini-pay {
      font-size: 12px;
      font-weight: 500;
      color: var(--ink);
      font-variant-numeric: tabular-nums;
    }
    .mini-pay--accent { color: var(--accent-text); }
    .mini-pay--muted { color: var(--rg-sub, #A3A3A3); text-decoration: line-through; text-decoration-thickness: 1px; }

    .mini-status {
      display: inline-block;
      margin-top: 6px;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 10.5px;
      font-weight: 500;
      letter-spacing: 0.01em;
    }
    .mini-status--ok {
      background: var(--rg-accent-bg, rgba(132, 204, 22, 0.14));
      color: var(--rg-accent-text, #4D7C0F);
    }
    .mini-status--reject {
      background: rgba(220, 38, 38, 0.10);
      color: #B91C1C;
    }
    .mini-status--withdraw {
      background: rgba(10, 10, 10, 0.06);
      color: var(--rg-muted, #737373);
    }

    .mini-note {
      font-size: 11px;
      color: var(--muted);
      font-style: italic;
      border-top: 1px solid var(--rule);
      padding-top: 8px;
      margin: 2px 0 0;
    }

    .mini-actions {
      display: flex;
      gap: 4px;
      margin-top: 6px;
    }
    .mini-btn {
      padding: 6px;
      border-radius: 6px;
      font-size: 11.5px;
      font-family: var(--font);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .mini-btn--ghost {
      flex: 1;
      background: var(--panel);
      border: 1px solid var(--rule);
      color: var(--muted);
    }
    .mini-btn--ghost:hover { border-color: var(--sub); color: var(--ink); }
    .mini-btn--accept {
      flex: 2;
      background: var(--accent);
      border: none;
      color: var(--accent-ink);
      font-weight: 600;
    }
    .mini-btn--accept:hover { background: var(--rg-accent-hover, var(--rg-accent-hover, var(--rg-accent-hover, #A3E635))); }
    .mini-btn--chat {
      width: 100%;
      margin-top: 4px;
      padding: 7px;
      background: var(--rg-invert-bg, #0A0A0A);
      border: none;
      color: var(--rg-invert-fg, #fff);
      font-weight: 500;
    }
    .mini-btn--chat:hover { background: var(--rg-invert-hover, #262626); }

    /* ── Load more ────────────────────────── */
    .load-more-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 0 32px 24px;
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
      transition: border-color 0.15s, background 0.15s;
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
      border: 2px solid var(--rg-rule, #D4D4D1);
      border-top-color: var(--ink);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Modal ────────────────────────────── */
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(10,10,10,0.45);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
      animation: fadeOverlay 200ms ease-out both;
    }
    @keyframes fadeOverlay { from { opacity: 0; } to { opacity: 1; } }
    .modal {
      background: var(--panel);
      border-radius: 16px;
      width: 100%;
      max-width: 560px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 24px 64px rgba(10,10,10,0.18);
      overflow: hidden;
      animation: modalSlideUp 240ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
      font-family: var(--font);
    }
    @keyframes modalSlideUp {
      from { opacity: 0; transform: translateY(16px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .modal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 22px 14px;
      border-bottom: 1px solid var(--rule);
      flex-shrink: 0;
    }
    .modal-cat-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .modal-cat-dot {
      width: 7px; height: 7px;
      border-radius: 4px;
      background: var(--dot, var(--sub));
      flex-shrink: 0;
    }
    .modal-close {
      width: 28px; height: 28px;
      border-radius: 8px;
      background: var(--col-bg);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--muted);
      flex-shrink: 0;
      transition: background 0.12s, color 0.12s;
    }
    .modal-close:hover { background: var(--rule); color: var(--ink); }

    .modal-body {
      overflow-y: auto;
      flex: 1;
    }
    .modal-section { padding: 22px; }
    .modal-divider { height: 1px; background: var(--rule); }

    .modal-title-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .modal-job-title {
      font-size: 20px;
      font-weight: 500;
      color: var(--ink);
      letter-spacing: -0.02em;
      margin: 0;
      line-height: 1.25;
      flex: 1;
    }
    .modal-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }
    .detail-chip {
      font-size: 12px;
      font-weight: 500;
      color: var(--muted);
      background: var(--col-bg);
      padding: 4px 10px;
      border-radius: 999px;
    }
    .urgency-urgent   { background: rgba(239,68,68,0.07);  color: #dc2626; }
    .urgency-high     { background: rgba(245,158,11,0.08); color: #b45309; }
    .urgency-normal   { background: var(--col-bg);          color: var(--muted); }
    .detail-chip--price { background: rgba(132,204,22,0.08); color: var(--accent-text); }

    .modal-desc {
      font-size: 14px;
      color: var(--ink);
      line-height: 1.65;
      margin: 0;
      white-space: pre-line;
    }
    .direct-assign-banner {
      margin: 0 22px;
      padding: 12px 14px;
      background: rgba(132,204,22,0.08);
      border: 1px solid rgba(132,204,22,0.3);
      border-radius: 10px;
      font-size: 13px;
      color: var(--accent-text);
      line-height: 1.5;
    }

    .modal-section-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--sub);
      margin: 0 0 12px;
    }
    .app-detail-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 18px;
    }
    .app-detail-item { display: flex; flex-direction: column; gap: 4px; }
    .app-detail-label {
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--sub);
    }
    .app-detail-val {
      font-size: 14px;
      font-weight: 500;
      color: var(--ink);
    }
    .app-detail-val--price { color: var(--accent-text); font-size: 15px; }

    .status-pill {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 9px;
      border-radius: 999px;
      white-space: nowrap;
    }
    .status-applied   { background: rgba(59,130,246,0.1);  color: #1d4ed8; }
    .status-accepted  { background: rgba(132,204,22,0.12); color: var(--accent-text); }
    .status-rejected  { background: rgba(239,68,68,0.08);  color: #dc2626; }
    .status-completed { background: rgba(10,10,10,0.06);   color: var(--muted); }
    .status-suggested { background: rgba(245,158,11,0.1);  color: #b45309; }
    .status-notified  { background: rgba(132,204,22,0.12); color: var(--accent-text); }
    .status-withdrawn { background: rgba(10,10,10,0.06);   color: var(--sub); }
    .status-in_progress { background: rgba(132,204,22,0.12); color: var(--accent-text); }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 14px 22px;
      border-top: 1px solid var(--rule);
      flex-shrink: 0;
    }
    .modal-dismiss,
    .modal-decline,
    .modal-accept,
    .modal-chat-btn,
    .modal-withdraw,
    .modal-browse {
      padding: 9px 16px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
    }
    .modal-dismiss { background: transparent; color: var(--muted); border: 1px solid var(--rule); }
    .modal-dismiss:hover { background: var(--col-bg); }
    .modal-decline { background: transparent; color: #dc2626; border: 1px solid rgba(239,68,68,0.3); }
    .modal-decline:hover { background: rgba(239,68,68,0.06); }
    .modal-accept { background: var(--accent); color: var(--accent-ink); border: none; font-weight: 600; }
    .modal-accept:hover { background: var(--rg-accent-hover, var(--rg-accent-hover, var(--rg-accent-hover, #A3E635))); }
    .modal-chat-btn { background: var(--rg-invert-bg, #0A0A0A); color: var(--rg-invert-fg, #fff); border: none; font-weight: 600; }
    .modal-chat-btn:hover { background: var(--rg-invert-hover, #262626); }
    .modal-withdraw { background: transparent; color: var(--muted); border: 1px solid var(--rule); }
    .modal-withdraw:hover { border-color: #dc2626; color: #dc2626; background: rgba(239,68,68,0.04); }
    .modal-browse { background: var(--rg-invert-bg, #0A0A0A); color: var(--rg-invert-fg, #fff); border: none; font-weight: 600; }
    .modal-browse:hover { background: var(--rg-invert-hover, #262626); }

    /* ── Responsive ───────────────────────── */
    @media (max-width: 1100px) {
      .board { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .hero { grid-template-columns: 1fr 1fr; }
      .hero-next { grid-column: 1 / -1; }
    }
    @media (max-width: 720px) {
      .hdr { flex-direction: column; align-items: flex-start; gap: 12px; }
      .hdr-actions { width: 100%; flex-wrap: wrap; }
      .board { grid-template-columns: 1fr; }
      .hero { grid-template-columns: 1fr; padding: 0 16px; }
      .hdr { padding: 20px 16px 12px; }
      .board { padding: 12px 16px 24px; }
      .load-more-row { padding: 0 16px 24px; }
    }
  `]
})
export class WorkerDashboardComponent implements OnInit {
  private api = inject(ApiService);
  private chatSvc = inject(ChatService);

  data = signal<WorkerDashboard | null>(null);
  total = signal(0);
  loadingMore = signal(false);
  selectedApp = signal<Application | null>(null);

  readonly columns: Column[] = [
    { id: 'request',   label: 'Requests',  hint: 'Client picked you — accept or pass.',       dot: 'var(--rg-accent, #84CC16)', solid: true },
    { id: 'applied',   label: 'Applied',   hint: 'Waiting on client decision.',               dot: '#3B82F6' },
    { id: 'accepted',  label: 'Active',    hint: 'Confirmed work — show up + message client.', dot: 'var(--rg-ink, #0A0A0A)', solid: true },
    { id: 'completed', label: 'Completed', hint: 'Paid out · review history.',                 dot: 'var(--rg-muted, #737373)' },
  ];

  byColumn = computed<Record<ColId, Application[]>>(() => {
    const apps = this.data()?.applications ?? [];
    const groups: Record<ColId, Application[]> = { request: [], applied: [], accepted: [], completed: [] };
    for (const a of apps) {
      const col = this.statusToCol(a.status);
      if (col) groups[col].push(a);
    }
    return groups;
  });

  requestCount = computed(() => this.byColumn().request.length);
  activeCount  = computed(() => this.byColumn().accepted.length);
  firstActive  = computed<Application | null>(() => this.byColumn().accepted[0] ?? null);

  firstName = computed(() => this.data()?.profile?.firstName ?? 'there');

  today = computed(() =>
    new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  );

  statsRow = computed(() => {
    // Only true COMPLETED jobs count as earned — REJECTED / WITHDRAWN also
    // live in the "completed" column for history, but no money changed hands.
    const earned = this.byColumn().completed
      .filter((a) => a.status === 'COMPLETED')
      .reduce((s, a) => s + this.offer(a), 0);
    const pipelineApps = [...this.byColumn().request, ...this.byColumn().applied];
    const pipeline = pipelineApps.reduce((s, a) => s + this.offer(a), 0);
    return [
      { label: 'This month',   value: '€' + earned,      sub: 'earned' },
      { label: 'Pipeline',     value: '€' + pipeline,    sub: pipelineApps.length + ' open' },
      { label: 'Response rate', value: '84%',             sub: 'below avg 91%' },
    ];
  });

  ngOnInit() { this.load(); }

  private load() {
    this.api.getWorkerDashboard(0).subscribe({
      next: (d: any) => {
        this.data.set({ stats: d.stats, applications: d.applications, profile: d.profile });
        this.total.set(d.total);
      },
    });
  }

  loadMore() {
    if (!this.data()) return;
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

  withdrawApplication(applicationId: string) {
    this.api.workerWithdrawApplication(applicationId).subscribe({
      next: () => { this.selectedApp.set(null); this.reload(); },
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

  openChat(jobId: string) {
    this.chatSvc.openChat(jobId);
    this.chatSvc.openWidget();
  }

  offer(app: Application): number {
    if (app.proposedPrice) return app.proposedPrice;
    const lo = app.job.priceMin ?? 0;
    const hi = app.job.priceMax ?? lo;
    if (!lo && !hi) return 0;
    return Math.round((lo + hi) / 2);
  }

  colSum(apps: Application[]): number {
    // Skip REJECTED / WITHDRAWN — they live in the "completed" column for
    // history but no money is in play for them.
    return apps
      .filter((a) => a.status !== 'REJECTED' && a.status !== 'WITHDRAWN')
      .reduce((s, a) => s + this.offer(a), 0);
  }

  private statusToCol(status: string): ColId | null {
    switch (status) {
      case 'NOTIFIED':   return 'request';
      case 'APPLIED':
      case 'SUGGESTED':  return 'applied';
      case 'ACCEPTED':
      case 'IN_PROGRESS': return 'accepted';
      case 'COMPLETED':
      case 'REJECTED':
      case 'WITHDRAWN':  return 'completed';
      default: return null;
    }
  }

  relTime(iso: string): string {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return 'Just now';
    if (h < 24) return h + 'h ago';
    const days = Math.floor(h / 24);
    if (days < 7) return days + 'd ago';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      APPLIED: 'Applied', ACCEPTED: 'Accepted', REJECTED: 'Rejected',
      COMPLETED: 'Completed', SUGGESTED: 'Suggested', NOTIFIED: 'New request',
      WITHDRAWN: 'Withdrawn', IN_PROGRESS: 'In progress',
    };
    return map[status] ?? status;
  }

  catColor(category?: string | null): string {
    const map: Record<string, string> = {
      'Cleaning': '#10B981', 'Plumbing': '#3B82F6', 'Electrical': '#EAB308',
      'Moving': '#8B5CF6', 'Gardening': '#16A34A', 'Painting': '#EC4899',
      'Assembly': '#F59E0B', 'Mounting': '#10B981', 'Carpentry': '#A16207',
      'HVAC': '#0EA5E9', 'Handyman': 'var(--rg-muted, #737373)', 'Mechanical': '#475569',
    };
    return map[category ?? ''] ?? 'var(--rg-muted, #737373)';
  }
}
