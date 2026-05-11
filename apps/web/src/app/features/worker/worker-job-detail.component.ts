import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

interface MyApplication {
  id: string;
  status: string;
  proposedPrice: number | null;
  message: string | null;
  createdAt: string;
}

interface JobDetail {
  id: string;
  title: string;
  description: string;
  urgency: string;
  status: string;
  priceMin: number | null;
  priceMax: number | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  scheduledDate: string | null;
  estimatedHours: number | null;
  toolsNeeded: string[];
  rawInput: string;
  createdAt: string;
  category: { name: string; icon: string; slug: string } | null;
  client: {
    idVerified: boolean;
    clientProfile: { firstName: string; lastName: string } | null;
  } | null;
  myApplication: MyApplication | null;
  alreadyApplied: boolean;
  applicationStatus: string | null;
  applicationCount: number;
  distanceKm: number | null;
}

@Component({
  selector: 'app-worker-job-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page">

      <!-- Breadcrumb bar -->
      <div class="crumb-bar">
        <button class="crumb-back" (click)="goBack()" type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          Back
        </button>
        @if (job()) {
          <span class="crumb-path">
            browse / {{ (job()!.category?.name || 'general').toLowerCase() }} / {{ job()!.id.slice(0, 8) }}
          </span>
        }
        <span class="crumb-spacer"></span>
        @if (job()) {
          <button class="crumb-btn" (click)="toggleSave()" type="button">
            <svg width="13" height="13" viewBox="0 0 24 24"
              [attr.fill]="isSaved() ? 'currentColor' : 'none'"
              stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 4h12v17l-6-4-6 4z"/>
            </svg>
            {{ isSaved() ? 'Saved' : 'Save' }}
          </button>
          <button class="crumb-btn" (click)="shareJob()" type="button">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 11l8-4M8 13l8 4"/></svg>
            Share
          </button>
        }
      </div>

      @if (loading()) {
        <div class="state-center">
          <div class="spinner-ring"></div>
          <span>Loading job…</span>
        </div>
      } @else if (error()) {
        <div class="state-center">
          <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p>{{ error() }}</p>
          <button class="btn-retry" (click)="load()">Try again</button>
        </div>
      } @else if (job()) {
        <div class="body">
          <div class="grid">

            <!-- LEFT column -->
            <div class="col-left">

              <!-- Hero header (compact) -->
              <div class="hero">
                <div class="hero-chips">
                  @if (job()!.category) {
                    <span class="chip">
                      <span class="chip-dot" [style.background]="catColor(job()!.category!.name)"></span>
                      {{ job()!.category!.name }}
                    </span>
                  }
                  <span class="chip chip-soft">{{ urgencyLabel(job()!.urgency).toLowerCase() }}</span>
                  <span class="chip chip-open">
                    <span class="chip-dot" style="background:#10B981"></span>
                    {{ statusLabel(job()!.status).toLowerCase() }}
                  </span>
                  @if (job()!.distanceKm !== null) {
                    <span class="chip">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>
                      {{ job()!.distanceKm }} km away
                    </span>
                  }
                </div>
                <h1 class="hero-title">{{ job()!.title }}</h1>
                <div class="hero-byline">
                  <span class="byline-avatar" [style.background]="avatarColor(clientName())">{{ clientInitials() }}</span>
                  <span>Posted by <strong>{{ clientName() }}</strong></span>
                  @if (job()!.client?.idVerified) {
                    <span class="chip chip-lime">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                      Verified
                    </span>
                  }
                  <span class="dot">·</span>
                  <span>{{ timeAgo(job()!.createdAt) }}</span>
                  <span class="dot">·</span>
                  <span>{{ job()!.applicationCount }} applicant{{ job()!.applicationCount === 1 ? '' : 's' }}</span>
                </div>
              </div>

              <!-- Description -->
              <section class="panel">
                <header class="panel-head">
                  <p class="panel-eyebrow">Description</p>
                </header>
                <p class="desc-text">{{ job()!.description }}</p>
              </section>

              <!-- Details + Map row -->
              <div class="row-2">
                <section class="panel">
                  <header class="panel-head">
                    <p class="panel-eyebrow">Details</p>
                  </header>

                  @if (job()!.city || job()!.address) {
                    <div class="detail-row">
                      <span class="detail-icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>
                      </span>
                      <span class="detail-label">Location</span>
                      <span class="detail-val">
                        <span>{{ job()!.address || job()!.city }}</span>
                        @if (job()!.city && job()!.address) {
                          <span class="detail-sub">{{ job()!.city }}</span>
                        }
                      </span>
                    </div>
                  }

                  @if (job()!.scheduledDate) {
                    <div class="detail-row">
                      <span class="detail-icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
                      </span>
                      <span class="detail-label">Scheduled</span>
                      <span class="detail-val">{{ formatDate(job()!.scheduledDate!) }}</span>
                    </div>
                  }

                  @if (job()!.estimatedHours) {
                    <div class="detail-row">
                      <span class="detail-icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                      </span>
                      <span class="detail-label">Duration</span>
                      <span class="detail-val">~{{ job()!.estimatedHours }} hour{{ job()!.estimatedHours !== 1 ? 's' : '' }}</span>
                    </div>
                  }

                  @if (job()!.category) {
                    <div class="detail-row">
                      <span class="detail-icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="8" cy="8" r="1.5"/></svg>
                      </span>
                      <span class="detail-label">Category</span>
                      <span class="detail-val detail-val-row">
                        <span class="chip-dot" [style.background]="catColor(job()!.category!.name)"></span>
                        {{ job()!.category!.name }}
                      </span>
                    </div>
                  }
                </section>

                @if (job()!.latitude && job()!.longitude) {
                  <section class="panel">
                    <header class="panel-head">
                      <p class="panel-eyebrow">Location preview</p>
                    </header>
                    <div id="detail-map" class="mini-map"></div>
                    <button
                      class="map-btn"
                      [routerLink]="['/worker/map']"
                      [queryParams]="{focus: job()!.id}"
                      type="button"
                    >Open in Maps →</button>
                  </section>
                }
              </div>

              <!-- Tools -->
              @if ((job()?.toolsNeeded?.length ?? 0) > 0) {
                <section class="panel">
                  <header class="panel-head">
                    <p class="panel-eyebrow">Tools & equipment needed</p>
                    <p class="panel-title">{{ job()!.toolsNeeded.length }} item{{ job()!.toolsNeeded.length === 1 ? '' : 's' }} the worker should bring</p>
                  </header>
                  <div class="tools-grid">
                    @for (tool of job()!.toolsNeeded; track tool) {
                      <div class="tool-row">
                        <span class="tool-check">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                        </span>
                        <span class="tool-text">{{ tool }}</span>
                      </div>
                    }
                  </div>
                </section>
              }
            </div>

            <!-- RIGHT rail -->
            <aside class="col-right">

              <!-- Pay card (dark) -->
              <div class="pay-card">
                <div class="pay-glow"></div>
                <p class="pay-eyebrow">Client's offer</p>
                @if (job()!.priceMin) {
                  <p class="pay-amount">€{{ job()!.priceMin }}–{{ job()!.priceMax }}</p>
                } @else {
                  <p class="pay-amount pay-amount--neg">Negotiable</p>
                }
                <p class="pay-sub">
                  @if (job()!.priceMin && job()!.estimatedHours) {
                    Est. <span class="pay-hourly">€{{ (job()!.priceMin! / job()!.estimatedHours!).toFixed(0) }}/hr</span>
                    · fixed price · paid via escrow
                  } @else {
                    Fixed price · paid via escrow
                  }
                </p>
                @if (job()!.priceMin) {
                  <div class="pay-fee">
                    <span>platform fee 12%</span>
                    <span class="pay-fee-keep">you keep €{{ keepLow() }}–{{ keepHigh() }}</span>
                  </div>
                }
              </div>

              <!-- Application status / Apply form -->
              @if (!job()!.alreadyApplied) {
                @if (job()!.status === 'POSTED') {
                  <div class="rail-card">
                    <p class="panel-eyebrow">Apply</p>
                    <p class="rail-title">Send your offer</p>

                    <label class="rail-label">Your price (€)</label>
                    <input
                      type="number"
                      class="rail-input rail-input--mono"
                      [(ngModel)]="proposedPrice"
                      [placeholder]="'Suggested ' + (job()!.priceMin ?? '') + (job()!.priceMin ? '–' + job()!.priceMax : '')"
                    />

                    <label class="rail-label">Quick note</label>
                    <textarea
                      class="rail-input"
                      [(ngModel)]="applyMessage"
                      rows="3"
                      placeholder="Tell the client why you're a good fit…"
                    ></textarea>

                    @if (applyError()) {
                      <p class="rail-err">{{ applyError() }}</p>
                    }

                    <button
                      class="rail-cta"
                      (click)="submitApply()"
                      [disabled]="submitting()"
                      type="button"
                    >
                      @if (submitting()) { Sending… }
                      @else { Send application → }
                    </button>
                  </div>
                } @else {
                  <div class="rail-card">
                    <p class="rail-notice">This job is no longer accepting applications.</p>
                  </div>
                }
              } @else {
                <div class="rail-card">
                  <p class="panel-eyebrow">Your application</p>

                  <!-- Stepper -->
                  <div class="stepper">
                    @for (step of steps; track step.id; let i = $index) {
                      <span
                        class="step"
                        [class.step--done]="i < appStepIndex()"
                        [class.step--current]="i === appStepIndex()"
                      >
                        <span class="step-num">
                          @if (i < appStepIndex()) {
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                          } @else {
                            {{ i + 1 }}
                          }
                        </span>
                        {{ step.label }}
                      </span>
                      @if (i < steps.length - 1) {
                        <span class="step-line"></span>
                      }
                    }
                  </div>

                  @if (job()!.myApplication?.proposedPrice) {
                    <div class="rail-meta-row">
                      <span class="rail-meta-label">Offered price</span>
                      <span class="rail-meta-val">€{{ job()!.myApplication!.proposedPrice }}</span>
                    </div>
                  }

                  @if (job()!.myApplication?.message) {
                    <div class="rail-quote">"{{ job()!.myApplication!.message }}"</div>
                  }

                  <p class="rail-applied">Applied {{ timeAgo(job()!.myApplication!.createdAt) }}</p>

                  @if (job()!.applicationStatus === 'APPLIED') {
                    <button
                      class="rail-cta rail-cta--ghost rail-cta--danger"
                      (click)="withdraw()"
                      [disabled]="withdrawing()"
                      type="button"
                    >
                      @if (withdrawing()) { Withdrawing… }
                      @else { Withdraw application }
                    </button>
                  }

                  @if (job()!.applicationStatus === 'NOTIFIED') {
                    <p class="rail-notice rail-notice--accent">
                      The client picked you for this job. Accept to confirm.
                    </p>
                    <div class="rail-actions">
                      <button class="rail-cta rail-cta--ghost" (click)="declineAssignment()" [disabled]="actioning()" type="button">Decline</button>
                      <button class="rail-cta" (click)="acceptAssignment()" [disabled]="actioning()" type="button">Accept</button>
                    </div>
                  }
                  @if (job()!.applicationStatus === 'ACCEPTED') {
                    <p class="rail-notice rail-notice--accent">You've been accepted for this job.</p>
                  }
                  @if (job()!.applicationStatus === 'REJECTED') {
                    <p class="rail-notice">Your application was not selected this time.</p>
                  }
                  @if (job()!.applicationStatus === 'WITHDRAWN') {
                    <p class="rail-notice">You withdrew your application.</p>
                  }
                </div>
              }

              <!-- About the client -->
              <div class="rail-card">
                <p class="panel-eyebrow">About the client</p>
                <div class="client-row">
                  <span class="client-avatar" [style.background]="avatarColor(clientName())">{{ clientInitials() }}</span>
                  <div>
                    <p class="client-name">{{ clientName() }}</p>
                    @if (job()!.client?.idVerified) {
                      <p class="client-verified">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                        Identity verified
                      </p>
                    } @else {
                      <p class="client-unverified">Not verified</p>
                    }
                  </div>
                </div>
              </div>

            </aside>
          </div>
        </div>
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
      --font: 'Geist', 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      --mono: 'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
      display: block;
    }
    *, *::before, *::after { box-sizing: border-box; }

    .page {
      min-height: calc(100vh - 56px);
      background: var(--bg);
      color: var(--ink);
      font-family: var(--font);
      -webkit-font-smoothing: antialiased;
    }

    /* Breadcrumb */
    .crumb-bar {
      padding: 12px 32px;
      border-bottom: 1px solid var(--rule);
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--panel);
      flex-wrap: wrap;
    }
    .crumb-back, .crumb-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 8px;
      border: 1px solid var(--rule);
      background: var(--panel);
      font-size: 12px;
      color: var(--ink);
      font-family: var(--font);
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .crumb-back:hover, .crumb-btn:hover { border-color: var(--sub); }
    .crumb-path {
      font-size: 12px;
      color: var(--sub);
      font-family: var(--mono);
    }
    .crumb-spacer { flex: 1; }

    /* State centers */
    .state-center {
      min-height: 50vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: var(--muted);
      font-size: 14px;
    }
    .spinner-ring {
      width: 28px; height: 28px;
      border: 3px solid var(--rule);
      border-top-color: var(--ink);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .btn-retry {
      padding: 8px 16px;
      border-radius: 999px;
      border: 1px solid var(--rule);
      background: var(--panel);
      color: var(--ink);
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
    }

    /* Body grid */
    .body { padding: 24px 32px; }
    .grid {
      max-width: 1180px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1.7fr 1fr;
      gap: 24px;
      align-items: start;
    }
    .col-left { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
    .col-right {
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: sticky;
      top: 16px;
    }

    /* Hero */
    .hero { padding: 4px 4px 0; }
    .hero-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 999px;
      border: 1px solid var(--rule);
      background: var(--panel);
      color: var(--ink);
      font-size: 11.5px;
      font-weight: 500;
    }
    .chip-soft { background: var(--soft); color: var(--muted); }
    .chip-open { background: #ECFDF5; color: #047857; border-color: #A7F3D0; }
    .chip-lime { background: #F0FAE0; color: var(--accent-text); border-color: #D9F0A3; }
    .chip-dot { width: 6px; height: 6px; border-radius: 3px; }

    .hero-title {
      font-size: 36px;
      font-weight: 500;
      letter-spacing: -0.025em;
      line-height: 1.08;
      margin: 0;
      color: var(--ink);
    }
    .hero-byline {
      margin-top: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12.5px;
      color: var(--muted);
      flex-wrap: wrap;
    }
    .byline-avatar {
      width: 22px; height: 22px;
      border-radius: 999px;
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 9.5px;
      font-weight: 600;
    }
    .hero-byline strong { color: var(--ink); font-weight: 500; }
    .dot { color: var(--rule); }

    /* Panels */
    .panel {
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 14px;
      padding: 20px 22px;
    }
    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 14px;
    }
    .panel-eyebrow {
      font-size: 10.5px;
      color: var(--muted);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0;
    }
    .panel-title {
      font-size: 16px;
      font-weight: 500;
      color: var(--ink);
      margin: 4px 0 0;
      letter-spacing: -0.01em;
    }
    .desc-text {
      font-size: 14px;
      color: var(--ink);
      line-height: 1.65;
      letter-spacing: -0.003em;
      margin: 0;
      white-space: pre-line;
    }

    /* Details + map row */
    .row-2 {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 16px;
    }
    .detail-row {
      display: flex;
      gap: 14px;
      padding: 12px 0;
      border-top: 1px solid var(--rule);
      align-items: center;
    }
    .detail-row:first-of-type { border-top: none; padding-top: 0; }
    .detail-icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: var(--soft);
      color: var(--muted);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .detail-label {
      flex: 1;
      font-size: 12.5px;
      color: var(--muted);
    }
    .detail-val {
      font-size: 13px;
      color: var(--ink);
      font-weight: 500;
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .detail-val-row {
      flex-direction: row;
      align-items: center;
      gap: 6px;
    }
    .detail-sub {
      font-size: 11.5px;
      color: var(--muted);
      font-weight: 400;
      margin-top: 2px;
    }
    .mini-map {
      height: 196px;
      border-radius: 10px;
      border: 1px solid var(--rule);
      background: var(--soft);
      overflow: hidden;
    }
    .map-btn {
      margin-top: 10px;
      width: 100%;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--rule);
      background: var(--panel);
      font-size: 12px;
      color: var(--ink);
      font-family: var(--font);
      font-weight: 500;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .map-btn:hover { border-color: var(--sub); }

    /* Tools */
    .tools-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .tool-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border: 1px solid var(--rule);
      border-radius: 10px;
      background: var(--bg);
    }
    .tool-check {
      width: 22px;
      height: 22px;
      border-radius: 999px;
      background: #F0FAE0;
      color: var(--accent-text);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .tool-text {
      font-size: 13px;
      color: var(--ink);
    }

    /* Pay card */
    .pay-card {
      background: var(--ink);
      color: #fff;
      border-radius: 16px;
      padding: 22px 22px 20px;
      position: relative;
      overflow: hidden;
    }
    .pay-glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 100% 0%, rgba(132,204,22,0.2), transparent 55%);
      pointer-events: none;
    }
    .pay-card > * { position: relative; }
    .pay-eyebrow {
      font-size: 10.5px;
      color: #A3A3A3;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0;
    }
    .pay-amount {
      font-size: 42px;
      font-weight: 500;
      letter-spacing: -0.035em;
      line-height: 1;
      margin: 6px 0 0;
      font-variant-numeric: tabular-nums;
    }
    .pay-amount--neg {
      font-size: 28px;
      color: #A3A3A3;
    }
    .pay-sub {
      font-size: 12px;
      color: #A3A3A3;
      margin: 6px 0 0;
    }
    .pay-hourly { color: var(--accent); font-family: var(--mono); }
    .pay-fee {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid #262626;
      display: flex;
      justify-content: space-between;
      font-size: 11.5px;
      color: #A3A3A3;
      font-family: var(--mono);
    }
    .pay-fee-keep { color: #fff; }

    /* Rail cards */
    .rail-card {
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 14px;
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
    }
    .rail-title {
      font-size: 16px;
      font-weight: 500;
      color: var(--ink);
      margin: 4px 0 0;
      letter-spacing: -0.01em;
    }
    .rail-label {
      display: block;
      margin-top: 14px;
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .rail-input {
      margin-top: 6px;
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--rule);
      border-radius: 10px;
      font-family: var(--font);
      font-size: 13px;
      color: var(--ink);
      resize: none;
      outline: none;
      background: var(--panel);
    }
    .rail-input:focus { border-color: var(--ink); }
    .rail-input--mono { font-family: var(--mono); font-size: 14px; }
    .rail-err {
      margin-top: 8px;
      font-size: 12px;
      color: #B91C1C;
    }
    .rail-cta {
      margin-top: 12px;
      width: 100%;
      padding: 12px 14px;
      border-radius: 10px;
      border: none;
      background: var(--accent);
      color: var(--accent-ink);
      font-size: 13px;
      font-weight: 600;
      font-family: var(--font);
      cursor: pointer;
      transition: background 0.15s;
    }
    .rail-cta:hover:not(:disabled) { background: #a3e635; }
    .rail-cta:disabled { opacity: 0.5; cursor: not-allowed; }
    .rail-cta--ghost {
      background: var(--panel);
      border: 1px solid var(--rule);
      color: var(--ink);
    }
    .rail-cta--ghost:hover:not(:disabled) { background: var(--soft); border-color: var(--sub); }
    .rail-cta--danger { color: #DC2626; }
    .rail-cta--danger:hover:not(:disabled) {
      border-color: rgba(220,38,38,0.3);
      background: rgba(239,68,68,0.04);
    }
    .rail-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 12px;
    }
    .rail-actions .rail-cta { margin-top: 0; }
    .rail-notice {
      margin: 12px 0 0;
      font-size: 12.5px;
      color: var(--muted);
      line-height: 1.5;
    }
    .rail-notice--accent {
      padding: 10px 12px;
      border-radius: 8px;
      background: #F0FAE0;
      color: var(--accent-text);
    }

    /* Stepper */
    .stepper {
      display: flex;
      gap: 6px;
      align-items: center;
      margin-top: 8px;
    }
    .step {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 9px;
      border-radius: 999px;
      background: var(--soft);
      color: var(--muted);
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
    }
    .step-num {
      width: 14px;
      height: 14px;
      border-radius: 999px;
      background: rgba(0,0,0,0.06);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-family: var(--mono);
    }
    .step--current {
      background: var(--ink);
      color: #fff;
    }
    .step--current .step-num { background: rgba(255,255,255,0.18); }
    .step--done {
      background: var(--accent);
      color: var(--accent-ink);
    }
    .step--done .step-num { background: rgba(0,0,0,0.06); color: var(--accent-ink); }
    .step-line {
      flex: 1;
      height: 1px;
      background: var(--rule);
    }

    .rail-meta-row {
      margin-top: 14px;
      padding: 12px 14px;
      border-radius: 10px;
      background: var(--soft);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12.5px;
    }
    .rail-meta-label { color: var(--muted); }
    .rail-meta-val { color: var(--ink); font-weight: 500; font-family: var(--mono); }

    .rail-quote {
      margin-top: 10px;
      padding: 10px 14px;
      border-radius: 10px;
      background: var(--bg);
      border: 1px solid var(--rule);
      font-size: 13px;
      color: var(--ink);
      font-style: italic;
      line-height: 1.4;
    }
    .rail-applied {
      margin: 8px 0 0;
      font-size: 11px;
      color: var(--sub);
      font-family: var(--mono);
    }

    /* About the client */
    .client-row {
      margin-top: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .client-avatar {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
    }
    .client-name {
      font-size: 14px;
      color: var(--ink);
      font-weight: 500;
      margin: 0;
    }
    .client-verified {
      margin: 2px 0 0;
      font-size: 11.5px;
      color: var(--accent-text);
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .client-unverified {
      margin: 2px 0 0;
      font-size: 11.5px;
      color: var(--sub);
    }

    /* Responsive */
    @media (max-width: 980px) {
      .grid { grid-template-columns: 1fr; }
      .col-right { position: static; order: -1; }
      .row-2 { grid-template-columns: 1fr; }
      .body { padding: 20px; }
      .crumb-bar { padding: 12px 20px; }
      .hero-title { font-size: 28px; }
    }
    @media (max-width: 640px) {
      .tools-grid { grid-template-columns: 1fr; }
      .rail-actions { grid-template-columns: 1fr; }
    }
  `],
})
export class WorkerJobDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  job = signal<JobDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Apply
  submitting = signal(false);
  applyError = signal<string | null>(null);
  proposedPrice: number | null = null;
  applyMessage = '';

  // Actions
  withdrawing = signal(false);
  actioning = signal(false);
  isSaved = signal(false);

  readonly steps = [
    { id: 'applied',  label: 'Applied' },
    { id: 'pending',  label: 'Pending review' },
    { id: 'accepted', label: 'Accepted' },
  ];

  appStepIndex(): number {
    const s = this.job()?.applicationStatus;
    if (s === 'ACCEPTED') return 2;
    if (s === 'APPLIED' || s === 'SUGGESTED' || s === 'NOTIFIED') return 1;
    return 0;
  }

  catColor(category?: string | null): string {
    const map: Record<string, string> = {
      'Cleaning': '#10B981', 'Plumbing': '#3B82F6', 'Electrical': '#EAB308',
      'Moving': '#8B5CF6', 'Gardening': '#16A34A', 'Painting': '#EC4899',
      'Assembly': '#F59E0B', 'Mounting': '#10B981', 'Carpentry': '#A16207',
      'HVAC': '#0EA5E9', 'Handyman': '#737373', 'Mechanical': '#475569',
    };
    return map[category ?? ''] ?? '#737373';
  }

  avatarColor(name?: string | null): string {
    const colors = ['#7C3AED','#0EA5E9','#0F8A5F','#D4762A','#B83D5B','#1E7A8C','#E54C84','#5A56E0'];
    const code = (name ?? '').charCodeAt(0) || 0;
    return colors[code % colors.length];
  }

  keepLow(): number {
    const lo = this.job()?.priceMin ?? 0;
    return Math.round(lo * 0.88);
  }

  keepHigh(): number {
    const hi = this.job()?.priceMax ?? this.job()?.priceMin ?? 0;
    return Math.round(hi * 0.88);
  }

  toggleSave() {
    const j = this.job();
    if (!j) return;
    if (this.isSaved()) {
      this.api.unsaveJob(j.id).subscribe({ next: () => this.isSaved.set(false) });
    } else {
      this.api.saveJob(j.id).subscribe({ next: () => this.isSaved.set(true) });
    }
  }

  shareJob() {
    const j = this.job();
    if (!j) return;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: j.title, url }).catch(() => { /* user cancelled */ });
    } else {
      navigator.clipboard?.writeText(url);
    }
  }

  private mapInstance: any = null;

  ngOnInit() {
    this.load();
  }

  load() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/worker/jobs']); return; }

    this.loading.set(true);
    this.error.set(null);

    this.api.getWorkerJobDetail(id).subscribe({
      next: (res: any) => {
        this.job.set(res as JobDetail);
        this.loading.set(false);
        if (res.latitude && res.longitude) {
          setTimeout(() => this.initMiniMap(res.longitude, res.latitude), 80);
        }
      },
      error: () => {
        this.error.set('Could not load job details.');
        this.loading.set(false);
      },
    });

    this.api.getSavedJobs().subscribe({
      next: (saved: any[]) => {
        this.isSaved.set(saved.some((s: any) => s.jobId === id));
      },
    });
  }

  goBack() {
    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'map') this.router.navigate(['/worker/map']);
    else this.router.navigate(['/worker/jobs']);
  }

  // ── Apply ────────────────────────────────────────────────────────

  submitApply() {
    const j = this.job();
    if (!j) return;
    this.submitting.set(true);
    this.applyError.set(null);

    this.api.applyToJob(j.id, {
      proposedPrice: this.proposedPrice ?? undefined,
      message: this.applyMessage || undefined,
    }).subscribe({
      next: (res: any) => {
        this.submitting.set(false);
        this.job.update(j => j ? {
          ...j,
          alreadyApplied: true,
          applicationStatus: 'APPLIED',
          applicationCount: j.applicationCount + 1,
          myApplication: {
            id: res?.id ?? '',
            status: 'APPLIED',
            proposedPrice: this.proposedPrice,
            message: this.applyMessage || null,
            createdAt: new Date().toISOString(),
          },
        } : j);
      },
      error: (err: any) => {
        this.applyError.set(err?.error?.message ?? 'Failed to submit application.');
        this.submitting.set(false);
      },
    });
  }

  // ── Withdraw ─────────────────────────────────────────────────────

  withdraw() {
    const app = this.job()?.myApplication;
    if (!app) return;
    this.withdrawing.set(true);
    this.api.workerWithdrawApplication(app.id).subscribe({
      next: () => {
        this.withdrawing.set(false);
        this.job.update(j => j ? { ...j, applicationStatus: 'WITHDRAWN', myApplication: j.myApplication ? { ...j.myApplication, status: 'WITHDRAWN' } : null } : j);
      },
      error: () => this.withdrawing.set(false),
    });
  }

  // ── Accept / Decline assignment ──────────────────────────────────

  acceptAssignment() {
    const app = this.job()?.myApplication;
    if (!app) return;
    this.actioning.set(true);
    this.api.workerAcceptAssignment(app.id).subscribe({
      next: () => {
        this.actioning.set(false);
        this.job.update(j => j ? { ...j, applicationStatus: 'ACCEPTED', myApplication: j.myApplication ? { ...j.myApplication, status: 'ACCEPTED' } : null } : j);
      },
      error: () => this.actioning.set(false),
    });
  }

  declineAssignment() {
    const app = this.job()?.myApplication;
    if (!app) return;
    this.actioning.set(true);
    this.api.workerDeclineAssignment(app.id).subscribe({
      next: () => {
        this.actioning.set(false);
        this.job.update(j => j ? { ...j, applicationStatus: 'REJECTED', myApplication: j.myApplication ? { ...j.myApplication, status: 'REJECTED' } : null } : j);
      },
      error: () => this.actioning.set(false),
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────

  clientName(): string {
    const p = this.job()?.client?.clientProfile;
    return p ? `${p.firstName} ${p.lastName}` : 'Client';
  }

  clientInitials(): string {
    const p = this.job()?.client?.clientProfile;
    if (!p) return 'C';
    return `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();
  }

  urgencyLabel(u: string): string {
    return { NORMAL: 'Normal', HIGH: 'High', EMERGENCY: 'Emergency', LOW: 'Low' }[u] ?? u;
  }

  statusLabel(s: string): string {
    return { POSTED: 'Open', ASSIGNED: 'Awaiting payment', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed', CANCELLED: 'Cancelled', DRAFT: 'Draft' }[s] ?? s;
  }

  appStatusLabel(s: string | null): string {
    return { APPLIED: 'Pending review', ACCEPTED: 'Accepted', REJECTED: 'Not selected', NOTIFIED: 'Assignment offer', WITHDRAWN: 'Withdrawn', SUGGESTED: 'Under review' }[s ?? ''] ?? (s ?? '');
  }

  timeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  }

  // ── Mini map ─────────────────────────────────────────────────────

  private async initMiniMap(lng: number, lat: number) {
    const el = document.getElementById('detail-map');
    if (!el || this.mapInstance) return;

    const ml = (await import('maplibre-gl')).default;
    this.mapInstance = new ml.Map({
      container: el,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [lng, lat],
      zoom: 14,
      interactive: false,
    });

    this.mapInstance.on('load', () => {
      const dot = document.createElement('div');
      dot.style.cssText = [
        'width:22px', 'height:22px', 'border-radius:50%',
        'background:#2563eb', 'border:3px solid #fff',
        'box-shadow:0 2px 12px rgba(37,99,235,0.5)',
      ].join(';');
      new ml.Marker({ element: dot, anchor: 'center' })
        .setLngLat([lng, lat])
        .addTo(this.mapInstance);
    });
  }
}
