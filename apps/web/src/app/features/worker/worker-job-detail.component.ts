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

      <!-- Top nav bar -->
      <header class="topbar">
        <button class="back-btn" (click)="goBack()">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back
        </button>
        <span class="topbar-crumb">Job Details</span>
      </header>

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
        <div class="content">

          <!-- Hero -->
          <div class="hero card">
            <div class="hero-meta">
              @if (job()!.category) {
                <span class="cat-chip">
                  {{ job()!.category!.icon }} {{ job()!.category!.name }}
                </span>
              }
              <span class="urgency-badge urgency-{{ job()!.urgency.toLowerCase() }}">
                {{ urgencyLabel(job()!.urgency) }}
              </span>
              <span class="status-badge status-{{ job()!.status.toLowerCase() }}">
                {{ statusLabel(job()!.status) }}
              </span>
              @if (job()!.distanceKm !== null) {
                <span class="dist-pill">
                  <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {{ job()!.distanceKm }} km away
                </span>
              }
            </div>
            <h1 class="hero-title">{{ job()!.title }}</h1>
            <div class="hero-byline">
              <span class="byline-client">
                Posted by
                <strong>{{ clientName() }}</strong>
                @if (job()!.client?.idVerified) {
                  <span class="verified-pill">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#14b8a6"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Verified
                  </span>
                }
              </span>
              <span class="byline-sep">·</span>
              <span class="byline-date">{{ timeAgo(job()!.createdAt) }}</span>
              <span class="byline-sep">·</span>
              <span class="byline-apps">{{ job()!.applicationCount }} {{ job()!.applicationCount === 1 ? 'applicant' : 'applicants' }}</span>
            </div>
          </div>

          <!-- Main layout -->
          <div class="layout">

            <!-- LEFT: details -->
            <div class="left">

              <!-- Description -->
              <section class="card section">
                <h2 class="section-title">Description</h2>
                <p class="description">{{ job()!.description }}</p>
              </section>

              <!-- Job details grid -->
              <section class="card section">
                <h2 class="section-title">Details</h2>
                <div class="details-grid">
                  @if (job()!.city || job()!.address) {
                    <div class="detail-item">
                      <span class="detail-icon">📍</span>
                      <div>
                        <span class="detail-label">Location</span>
                        <span class="detail-val">{{ job()!.address || job()!.city }}</span>
                      </div>
                    </div>
                  }
                  @if (job()!.scheduledDate) {
                    <div class="detail-item">
                      <span class="detail-icon">📅</span>
                      <div>
                        <span class="detail-label">Scheduled date</span>
                        <span class="detail-val">{{ formatDate(job()!.scheduledDate!) }}</span>
                      </div>
                    </div>
                  }
                  @if (job()!.estimatedHours) {
                    <div class="detail-item">
                      <span class="detail-icon">⏱</span>
                      <div>
                        <span class="detail-label">Estimated duration</span>
                        <span class="detail-val">~{{ job()!.estimatedHours }} hour{{ job()!.estimatedHours !== 1 ? 's' : '' }}</span>
                      </div>
                    </div>
                  }
                  @if (job()!.category) {
                    <div class="detail-item">
                      <span class="detail-icon">🏷</span>
                      <div>
                        <span class="detail-label">Category</span>
                        <span class="detail-val">{{ job()!.category!.icon }} {{ job()!.category!.name }}</span>
                      </div>
                    </div>
                  }
                </div>
              </section>

              @if (job()!.toolsNeeded?.length > 0) {
                <section class="card section">
                  <h2 class="section-title">Tools & equipment needed</h2>
                  <div class="tools-list">
                    @for (tool of job()!.toolsNeeded; track tool) {
                      <span class="tool-chip">🔧 {{ tool }}</span>
                    }
                  </div>
                </section>
              }

              <!-- Mini map -->
              @if (job()!.latitude && job()!.longitude) {
                <section class="card section map-section">
                  <h2 class="section-title">Location</h2>
                  <div id="detail-map" class="mini-map"></div>
                </section>
              }

            </div>

            <!-- RIGHT: sidebar -->
            <div class="right">

              <!-- Price card -->
              <div class="card sidebar-card">
                <div class="price-row">
                  @if (job()!.priceMin) {
                    <span class="price-val">€{{ job()!.priceMin }}–{{ job()!.priceMax }}</span>
                  } @else {
                    <span class="price-val price-neg">Negotiable</span>
                  }
                  @if (job()!.priceMin && job()!.estimatedHours) {
                    <span class="price-sub">Est. €{{ (job()!.priceMin! / job()!.estimatedHours!).toFixed(0) }}/hr</span>
                  }
                </div>

                <!-- Application state -->
                @if (!job()!.alreadyApplied) {
                  <!-- Not applied yet -->
                  @if (job()!.status === 'POSTED') {
                    <button class="btn-apply" (click)="openApply()">
                      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                      Apply now
                    </button>
                  } @else {
                    <div class="notice notice--gray">This job is no longer accepting applications.</div>
                  }
                } @else {
                  <!-- Already applied -->
                  <div class="app-status-box app-status-{{ job()!.applicationStatus?.toLowerCase() }}">
                    <div class="app-status-label">Your application</div>
                    <div class="app-status-badge">{{ appStatusLabel(job()!.applicationStatus) }}</div>
                    @if (job()!.myApplication?.proposedPrice) {
                      <div class="app-detail-row">
                        <span>Offered price</span>
                        <strong>€{{ job()!.myApplication!.proposedPrice }}</strong>
                      </div>
                    }
                    @if (job()!.myApplication?.message) {
                      <p class="app-message">{{ job()!.myApplication!.message }}</p>
                    }
                    <div class="app-meta">Applied {{ timeAgo(job()!.myApplication!.createdAt) }}</div>
                  </div>

                  @if (job()!.applicationStatus === 'APPLIED') {
                    <button class="btn-withdraw" (click)="withdraw()" [disabled]="withdrawing()">
                      @if (withdrawing()) { Withdrawing… } @else { Withdraw application }
                    </button>
                  }
                  @if (job()!.applicationStatus === 'NOTIFIED') {
                    <div class="notice notice--blue">The client has assigned this job to you.</div>
                    <div class="action-row">
                      <button class="btn-accept" (click)="acceptAssignment()" [disabled]="actioning()">Accept</button>
                      <button class="btn-decline" (click)="declineAssignment()" [disabled]="actioning()">Decline</button>
                    </div>
                  }
                  @if (job()!.applicationStatus === 'ACCEPTED') {
                    <div class="notice notice--green">You've been accepted for this job.</div>
                  }
                  @if (job()!.applicationStatus === 'REJECTED') {
                    <div class="notice notice--red">Your application was not selected.</div>
                  }
                  @if (job()!.applicationStatus === 'WITHDRAWN') {
                    <div class="notice notice--gray">You withdrew your application.</div>
                  }
                }
              </div>

              <!-- Client card -->
              <div class="card sidebar-card">
                <h3 class="sidebar-title">About the client</h3>
                <div class="client-row">
                  <div class="client-avatar">{{ clientInitials() }}</div>
                  <div>
                    <div class="client-name">{{ clientName() }}</div>
                    @if (job()!.client?.idVerified) {
                      <div class="client-verified">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#14b8a6"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        Identity verified
                      </div>
                    } @else {
                      <div class="client-unverified">Not verified</div>
                    }
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      }

      <!-- Apply modal -->
      @if (applying()) {
        <div class="overlay" (click)="closeApply()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <div>
                <h3 class="modal-title">Apply for this job</h3>
                <p class="modal-sub">{{ job()!.title }}</p>
              </div>
              <button class="modal-close" (click)="closeApply()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="field">
                <label>Price offer (€) <span class="opt">optional</span></label>
                <input type="number" class="field-input" [(ngModel)]="proposedPrice" placeholder="Leave empty to accept posted price"/>
              </div>
              <div class="field">
                <label>Message <span class="opt">optional</span></label>
                <textarea class="field-input" [(ngModel)]="applyMessage" rows="4" placeholder="Briefly describe your experience and why you're a great fit…"></textarea>
              </div>
            </div>
            @if (applyError()) {
              <div class="modal-err">{{ applyError() }}</div>
            }
            <div class="modal-actions">
              <button class="btn-cancel" (click)="closeApply()">Cancel</button>
              <button class="btn-submit" (click)="submitApply()" [disabled]="submitting()">
                @if (submitting()) { <span class="spin"></span> Sending… } @else { Send application }
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .page {
      min-height: 100vh;
      background: var(--bg, #f5f5f7);
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
    }

    /* ── Topbar ───────────────────────────── */
    .topbar {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.875rem 1.5rem;
      background: #fff; border-bottom: 1px solid #e5e5ea;
      position: sticky; top: 0; z-index: 50;
    }
    .back-btn {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: none; border: 1px solid #d2d2d7; border-radius: 8px;
      padding: 0.35rem 0.75rem; font-size: 0.82rem; font-weight: 500;
      color: #3a3a3c; cursor: pointer; font-family: inherit;
      transition: background 0.12s, border-color 0.12s;
    }
    .back-btn:hover { background: #f5f5f7; border-color: #aeaeb2; }
    .topbar-crumb { font-size: 0.82rem; color: #6e6e73; }

    /* ── Loading / error states ───────────── */
    .state-center {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 1rem; padding: 6rem 2rem; color: #6e6e73; font-size: 0.875rem;
    }
    .spinner-ring {
      width: 28px; height: 28px;
      border: 2.5px solid #e5e5ea; border-top-color: #2563eb;
      border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .btn-retry {
      padding: 0.5rem 1.25rem; border-radius: 99px;
      background: #2563eb; color: #fff; border: none;
      font-size: 0.875rem; cursor: pointer; font-family: inherit;
    }

    /* ── Content wrapper ──────────────────── */
    .content { max-width: 960px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem; }

    /* ── Card ─────────────────────────────── */
    .card {
      background: #fff; border: 1px solid #e5e5ea;
      border-radius: 18px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03);
    }
    .section { padding: 1.375rem 1.5rem; margin-bottom: 1rem; }

    /* ── Hero ─────────────────────────────── */
    .hero { padding: 1.5rem; margin-bottom: 1.25rem; }
    .hero-meta {
      display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem;
      margin-bottom: 0.875rem;
    }
    .cat-chip {
      display: inline-flex; align-items: center; gap: 0.3rem;
      background: #f0f2f5; border: 1px solid #e5e5ea;
      border-radius: 99px; padding: 0.22rem 0.7rem;
      font-size: 0.75rem; font-weight: 600; color: #3a3a3c;
    }
    .urgency-badge { font-size: 0.72rem; font-weight: 700; padding: 0.22rem 0.65rem; border-radius: 99px; }
    .urgency-normal    { background: rgba(37,99,235,.1);  color: #1d4ed8; }
    .urgency-low       { background: rgba(110,118,129,.1); color: #6e7681; }
    .urgency-high      { background: rgba(245,158,11,.12); color: #b45309; }
    .urgency-emergency { background: rgba(220,38,38,.1);  color: #dc2626; }
    .status-badge { font-size: 0.72rem; font-weight: 700; padding: 0.22rem 0.65rem; border-radius: 99px; }
    .status-posted   { background: rgba(20,184,166,.1);  color: #0f766e; }
    .status-assigned { background: rgba(37,99,235,.1);   color: #1d4ed8; }
    .status-completed { background: rgba(22,163,74,.1);  color: #15803d; }
    .status-cancelled { background: rgba(107,114,128,.1); color: #6b7280; }
    .dist-pill {
      display: inline-flex; align-items: center; gap: 0.25rem;
      font-size: 0.72rem; color: #6e6e73; background: #f5f5f7;
      border-radius: 99px; padding: 0.22rem 0.65rem; border: 1px solid #e5e5ea;
    }
    .hero-title {
      font-size: 1.65rem; font-weight: 800; color: #1d1d1f;
      letter-spacing: -0.03em; line-height: 1.2; margin-bottom: 0.75rem;
    }
    .hero-byline {
      display: flex; align-items: center; flex-wrap: wrap; gap: 0.4rem;
      font-size: 0.8rem; color: #6e6e73;
    }
    .byline-client { display: inline-flex; align-items: center; gap: 0.35rem; color: #3a3a3c; }
    .byline-sep { color: #d2d2d7; }
    .verified-pill {
      display: inline-flex; align-items: center; gap: 0.2rem;
      background: rgba(20,184,166,.1); color: #0f766e;
      border-radius: 99px; padding: 0.15rem 0.5rem; font-size: 0.68rem; font-weight: 600;
    }

    /* ── Layout ───────────────────────────── */
    .layout { display: grid; grid-template-columns: 1fr 300px; gap: 1rem; align-items: start; }

    /* ── Section ──────────────────────────── */
    .section-title { font-size: 0.8rem; font-weight: 700; color: #6e6e73; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.875rem; }
    .description { font-size: 0.925rem; color: #3a3a3c; line-height: 1.7; white-space: pre-wrap; }

    /* ── Details grid ─────────────────────── */
    .details-grid { display: flex; flex-direction: column; gap: 0.75rem; }
    .detail-item { display: flex; align-items: flex-start; gap: 0.625rem; }
    .detail-icon { font-size: 1rem; width: 22px; flex-shrink: 0; text-align: center; }
    .detail-label { display: block; font-size: 0.7rem; color: #aeaeb2; font-weight: 500; margin-bottom: 0.1rem; }
    .detail-val { display: block; font-size: 0.875rem; color: #1d1d1f; font-weight: 500; }

    /* ── Tools ────────────────────────────── */
    .tools-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .tool-chip {
      background: #f5f5f7; border: 1px solid #e5e5ea;
      border-radius: 99px; padding: 0.3rem 0.75rem;
      font-size: 0.8rem; color: #3a3a3c;
    }

    /* ── Mini map ─────────────────────────── */
    .map-section { padding-bottom: 0; overflow: hidden; }
    .mini-map { width: 100%; height: 220px; border-radius: 0 0 18px 18px; }

    /* ── Sidebar ──────────────────────────── */
    .right { display: flex; flex-direction: column; gap: 1rem; }
    .sidebar-card { padding: 1.25rem; }
    .sidebar-title { font-size: 0.8rem; font-weight: 700; color: #6e6e73; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.875rem; }

    .price-row { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 1rem; }
    .price-val { font-size: 1.6rem; font-weight: 800; color: #1d1d1f; letter-spacing: -0.02em; }
    .price-neg { font-size: 1.25rem; color: #6e6e73; }
    .price-sub { font-size: 0.78rem; color: #aeaeb2; }

    .btn-apply {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      background: #1d1d1f; color: #fff; border: none;
      padding: 0.75rem 1rem; border-radius: 12px;
      font-size: 0.9rem; font-weight: 600; cursor: pointer; font-family: inherit;
      transition: background 0.15s, transform 0.1s;
    }
    .btn-apply:hover { background: #2d2d2f; }
    .btn-apply:active { transform: scale(0.98); }

    /* ── Application status box ───────────── */
    .app-status-box {
      border-radius: 10px; padding: 0.875rem 1rem; margin-bottom: 0.75rem;
      background: #f5f5f7; border: 1px solid #e5e5ea;
    }
    .app-status-applied   { background: rgba(37,99,235,.05);  border-color: rgba(37,99,235,.15); }
    .app-status-accepted  { background: rgba(22,163,74,.05);  border-color: rgba(22,163,74,.15); }
    .app-status-rejected  { background: rgba(220,38,38,.05);  border-color: rgba(220,38,38,.12); }
    .app-status-notified  { background: rgba(245,158,11,.05); border-color: rgba(245,158,11,.15); }
    .app-status-withdrawn { background: #f5f5f7; border-color: #e5e5ea; }

    .app-status-label { font-size: 0.68rem; font-weight: 700; color: #aeaeb2; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.3rem; }
    .app-status-badge { font-size: 0.875rem; font-weight: 700; color: #1d1d1f; margin-bottom: 0.5rem; }
    .app-detail-row { display: flex; justify-content: space-between; font-size: 0.8rem; color: #6e6e73; margin-bottom: 0.25rem; }
    .app-message { font-size: 0.8rem; color: #3a3a3c; line-height: 1.55; margin-top: 0.5rem; font-style: italic; }
    .app-meta { font-size: 0.7rem; color: #aeaeb2; margin-top: 0.5rem; }

    .btn-withdraw {
      width: 100%; padding: 0.6rem; border-radius: 10px;
      background: none; border: 1px solid #d2d2d7; color: #6e6e73;
      font-size: 0.82rem; font-weight: 500; cursor: pointer; font-family: inherit;
      transition: background 0.12s, color 0.12s;
    }
    .btn-withdraw:hover:not(:disabled) { background: #fff0ee; border-color: #ff3b30; color: #ff3b30; }
    .btn-withdraw:disabled { opacity: 0.4; cursor: not-allowed; }

    .action-row { display: flex; gap: 0.5rem; margin-top: 0.625rem; }
    .btn-accept {
      flex: 1; padding: 0.6rem; border-radius: 10px;
      background: #14b8a6; color: #fff; border: none;
      font-size: 0.82rem; font-weight: 600; cursor: pointer; font-family: inherit;
      transition: opacity 0.15s;
    }
    .btn-accept:hover:not(:disabled) { opacity: 0.88; }
    .btn-accept:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-decline {
      flex: 1; padding: 0.6rem; border-radius: 10px;
      background: none; border: 1px solid #d2d2d7; color: #6e6e73;
      font-size: 0.82rem; font-weight: 600; cursor: pointer; font-family: inherit;
      transition: background 0.12s;
    }
    .btn-decline:hover:not(:disabled) { background: #f5f5f7; }
    .btn-decline:disabled { opacity: 0.4; cursor: not-allowed; }

    .notice {
      border-radius: 10px; padding: 0.625rem 0.875rem;
      font-size: 0.8rem; font-weight: 500; margin-top: 0.625rem;
    }
    .notice--blue  { background: rgba(37,99,235,.06);  color: #1d4ed8; border: 1px solid rgba(37,99,235,.15); }
    .notice--green { background: rgba(22,163,74,.06);  color: #15803d; border: 1px solid rgba(22,163,74,.15); }
    .notice--red   { background: rgba(220,38,38,.06);  color: #dc2626; border: 1px solid rgba(220,38,38,.12); }
    .notice--gray  { background: #f5f5f7; color: #6e6e73; border: 1px solid #e5e5ea; }

    /* ── Client card ──────────────────────── */
    .client-row { display: flex; align-items: center; gap: 0.75rem; }
    .client-avatar {
      width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: #fff; font-size: 0.875rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .client-name { font-size: 0.9rem; font-weight: 600; color: #1d1d1f; margin-bottom: 0.2rem; }
    .client-verified { display: flex; align-items: center; gap: 0.25rem; font-size: 0.73rem; color: #0f766e; font-weight: 500; }
    .client-unverified { font-size: 0.73rem; color: #aeaeb2; }

    /* ── Apply modal ──────────────────────── */
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.55);
      backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1rem;
    }
    .modal {
      background: #fff; border: 1px solid #e5e5ea;
      border-radius: 20px; width: 100%; max-width: 480px;
      box-shadow: 0 32px 80px rgba(0,0,0,.2); overflow: hidden;
    }
    .modal-head {
      display: flex; align-items: flex-start; gap: 0.875rem;
      padding: 1.25rem 1.375rem 1rem; border-bottom: 1px solid #f0f0f5;
    }
    .modal-title { font-size: 1rem; font-weight: 700; color: #1d1d1f; margin-bottom: 0.2rem; }
    .modal-sub   { font-size: 0.8rem; color: #6e6e73; }
    .modal-close {
      width: 28px; height: 28px; border-radius: 50%; background: #f5f5f7;
      border: 1px solid #e5e5ea; display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #6e6e73; flex-shrink: 0; margin-left: auto;
      transition: background 0.12s;
    }
    .modal-close:hover { background: #e5e5ea; }
    .modal-body { padding: 1rem 1.375rem; }
    .field { margin-bottom: 0.875rem; }
    label { display: block; font-size: 0.78rem; font-weight: 600; color: #1d1d1f; margin-bottom: 0.3rem; }
    .opt { font-weight: 400; color: #aeaeb2; font-size: 0.74rem; }
    .field-input {
      width: 100%; padding: 0.65rem 0.875rem;
      border: 1px solid #d2d2d7; border-radius: 10px;
      font-size: 0.875rem; outline: none; font-family: inherit; color: #1d1d1f;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .field-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
    .field-input::placeholder { color: #aeaeb2; }
    textarea.field-input { resize: vertical; }
    .modal-err {
      margin: 0 1.375rem 0.75rem;
      background: rgba(255,59,48,.07); color: #ff3b30;
      border: 1px solid rgba(255,59,48,.18);
      padding: 0.6rem 0.875rem; border-radius: 9px; font-size: 0.82rem;
    }
    .modal-actions {
      display: flex; gap: 0.5rem; justify-content: flex-end;
      padding: 0.875rem 1.375rem 1.375rem; border-top: 1px solid #f0f0f5;
    }
    .btn-cancel {
      background: transparent; color: #6e6e73; border: 1px solid #d2d2d7;
      padding: 0.6rem 1.125rem; border-radius: 99px; font-size: 0.875rem;
      font-weight: 500; cursor: pointer; font-family: inherit;
      transition: background 0.12s;
    }
    .btn-cancel:hover { background: #f5f5f7; }
    .btn-submit {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: #1d1d1f; color: #fff; border: none;
      padding: 0.6rem 1.375rem; border-radius: 99px; font-size: 0.875rem;
      font-weight: 600; cursor: pointer; font-family: inherit;
      transition: background 0.15s, opacity 0.15s;
    }
    .btn-submit:hover:not(:disabled) { background: #2d2d2f; }
    .btn-submit:disabled { opacity: 0.35; cursor: not-allowed; }
    .spin {
      width: 12px; height: 12px; border: 2px solid rgba(255,255,255,.3);
      border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite;
    }

    @media (max-width: 720px) {
      .layout { grid-template-columns: 1fr; }
      .right { order: -1; }
      .hero-title { font-size: 1.35rem; }
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

  // Apply modal
  applying = signal(false);
  submitting = signal(false);
  applyError = signal<string | null>(null);
  proposedPrice: number | null = null;
  applyMessage = '';

  // Actions
  withdrawing = signal(false);
  actioning = signal(false);

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
  }

  goBack() {
    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'map') this.router.navigate(['/worker/map']);
    else this.router.navigate(['/worker/jobs']);
  }

  // ── Apply ────────────────────────────────────────────────────────

  openApply() {
    this.proposedPrice = null;
    this.applyMessage = '';
    this.applyError.set(null);
    this.applying.set(true);
  }

  closeApply() { this.applying.set(false); }

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
        this.applying.set(false);
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
    return { POSTED: 'Open', ASSIGNED: 'Assigned', COMPLETED: 'Completed', CANCELLED: 'Cancelled', DRAFT: 'Draft' }[s] ?? s;
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
