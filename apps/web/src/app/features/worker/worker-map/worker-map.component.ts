import { Component, inject, signal, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface MapJob {
  id: string;
  title: string;
  description: string;
  priceMin: number | null;
  priceMax: number | null;
  urgency: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  alreadyApplied: boolean;
  applicationStatus: string | null;
  category: { name: string; icon: string } | null;
  createdAt: string;
  client: { idVerified: boolean; clientProfile: { firstName: string; lastName: string } | null } | null;
}

@Component({
  selector: 'app-worker-map',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="map-page">

      <!-- ── LEFT PANEL ─────────────────────────────────────────── -->
      <aside class="panel">

        <!-- Panel header -->
        <div class="panel-head">
          <button class="back-btn" routerLink="/worker/jobs">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div>
            <h1 class="panel-title">Job Map</h1>
            <p class="panel-sub">{{ filteredJobs().length }} of {{ allJobs().length }} jobs shown</p>
          </div>
          @if (loading()) {
            <div class="panel-spinner"></div>
          }
        </div>

        <!-- ── AI Search ── -->
        <div class="ai-section">
          <div class="ai-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
            AI Search
          </div>
          <div class="ai-bar">
            <input
              class="ai-input"
              [(ngModel)]="aiQuery"
              placeholder="e.g. urgent plumbing under €100 within 5km…"
              (keydown.enter)="runAiSearch()"
            />
            <button class="ai-btn" (click)="runAiSearch()" [disabled]="aiLoading() || !aiQuery.trim()">
              @if (aiLoading()) {
                <span class="ai-spin"></span>
              } @else {
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              }
            </button>
          </div>
          @if (aiApplied()) {
            <div class="ai-result">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
              {{ aiApplied() }}
              <button class="ai-clear" (click)="clearAiFilters()">✕</button>
            </div>
          }
        </div>

        <!-- ── Job list ── -->
        <div class="job-list">
          @if (loading()) {
            <div class="list-loading">
              <div class="load-ring"></div>
              <span>Loading jobs…</span>
            </div>
          } @else if (filteredJobs().length === 0) {
            <div class="list-empty">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <p>No jobs match your filters</p>
            </div>
          } @else {
            @for (job of filteredJobs(); track job.id) {
              <div
                class="list-card"
                [class.list-card--selected]="selectedJob()?.id === job.id"
                [class.list-card--applied]="job.alreadyApplied"
                [style.--urgency]="urgencyHex(job.urgency)"
                (click)="selectJob(job)"
              >
                <div class="lc-top">
                  <div class="lc-cat" [style.--dot]="catColor(job.category?.name)">
                    <span class="lc-dot"></span>{{ job.category?.name || 'General' }}
                  </div>
                  <span class="urgency-badge urgency-{{ job.urgency.toLowerCase() }}">{{ urgencyLabel(job.urgency) }}</span>
                </div>
                <p class="lc-title">{{ job.title }}</p>
                <div class="lc-meta">
                  @if (job.city) { <span class="lc-meta-item">📍 {{ job.city }}</span> }
                  @if (job.distanceKm !== null) { <span class="lc-meta-item">{{ job.distanceKm }} km</span> }
                </div>
                <div class="lc-footer">
                  <span class="lc-price">
                    @if (job.priceMin) { €{{ job.priceMin }}–{{ job.priceMax }} } @else { Negotiable }
                  </span>
                  @if (!job.latitude || !job.longitude) {
                    <span class="lc-no-loc">No location</span>
                  }
                </div>
              </div>
            }
          }
        </div>

      </aside>

      <!-- ── MAP ──────────────────────────────────────────────── -->
      <div class="map-area">
        <div id="worker-job-map" class="map-canvas"></div>

        <!-- ── Filter bar (floating top) ── -->
        <div class="filter-bar">
          <div class="fb-inner">

            <!-- Radius -->
            <div class="fb-icon-group">
              <svg class="fb-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8" stroke-dasharray="3 2" opacity=".5"/></svg>
              <button class="chip chip--sm" [class.chip--on]="filterDistance() === null" (click)="setDistance(null)">Any</button>
              @for (d of [5, 10, 25, 50]; track d) {
                <button class="chip chip--sm" [class.chip--on]="filterDistance() === d" (click)="setDistance(d)">{{ d }}km</button>
              }
            </div>

            <div class="fb-sep"></div>

            <!-- Urgency -->
            <div class="fb-icon-group">
              <svg class="fb-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <button class="chip chip--sm chip--low"       [class.chip--on]="filterUrgency().includes('LOW')"       (click)="toggleUrgency('LOW')">Low</button>
              <button class="chip chip--sm chip--normal"    [class.chip--on]="filterUrgency().includes('NORMAL')"    (click)="toggleUrgency('NORMAL')">Normal</button>
              <button class="chip chip--sm chip--high"      [class.chip--on]="filterUrgency().includes('HIGH')"      (click)="toggleUrgency('HIGH')">High</button>
              <button class="chip chip--sm chip--emergency" [class.chip--on]="filterUrgency().includes('EMERGENCY')" (click)="toggleUrgency('EMERGENCY')">Emergency</button>
            </div>

            <div class="fb-sep"></div>

            <!-- Budget -->
            <div class="fb-icon-group">
              <svg class="fb-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5c0 2.5-5 2.5-5 5 0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5"/></svg>
              <button class="chip chip--sm" [class.chip--on]="filterMaxPrice() === null" (click)="filterMaxPrice.set(null)">Any</button>
              @for (p of [50, 100, 250, 500]; track p) {
                <button class="chip chip--sm" [class.chip--on]="filterMaxPrice() === p" (click)="filterMaxPrice.set(p)">€{{ p }}</button>
              }
            </div>

            @if (allCategories().length > 0) {
              <div class="fb-sep"></div>
              <!-- Categories -->
              <div class="fb-icon-group">
                <svg class="fb-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>
                @for (cat of allCategories(); track cat) {
                  <button class="chip chip--sm" [class.chip--on]="filterCategories().includes(cat)" (click)="toggleCategory(cat)">{{ cat }}</button>
                }
              </div>
            }

            <div class="fb-sep"></div>

            <!-- Toggles as icon buttons -->
            <button class="fb-toggle-btn" [class.fb-toggle-btn--on]="unappliedOnly()" (click)="unappliedOnly.set(!unappliedOnly())" title="Unapplied only">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Unapplied
            </button>
            <button class="fb-toggle-btn" [class.fb-toggle-btn--on]="verifiedOnly()" (click)="verifiedOnly.set(!verifiedOnly())" title="Verified clients only">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Verified
            </button>

            @if (activeFilterCount() > 0) {
              <button class="fb-clear" (click)="clearAllFilters()">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Clear
              </button>
            }
          </div>
        </div>

        <!-- Map legend -->
        <div class="map-legend">
          <span class="legend-item"><span class="legend-dot" style="background:#ef4444"></span>Emergency</span>
          <span class="legend-item"><span class="legend-dot" style="background:#f97316"></span>High</span>
          <span class="legend-item"><span class="legend-dot" style="background:#d4ff3a"></span>Normal</span>
          <span class="legend-item"><span class="legend-dot" style="background:#a1a1aa"></span>Low / Applied</span>
        </div>

      </div>

    </div>

    <!-- ── Apply modal ─────────────────────────────────────────── -->
    @if (applyingTo()) {
      <div class="overlay" (click)="closeApply()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <div>
              <h3 class="modal-title">{{ applyingTo()!.title }}</h3>
              <p class="modal-sub">{{ applyingTo()!.category?.name }} · {{ applyingTo()!.city }}</p>
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
              <textarea class="field-input" [(ngModel)]="applyMessage" rows="3" placeholder="Briefly describe your experience…"></textarea>
            </div>
          </div>
          @if (applyError()) {
            <div class="modal-err">{{ applyError() }}</div>
          }
          <div class="modal-actions">
            <button class="btn-cancel" (click)="closeApply()">Cancel</button>
            <button class="btn-submit" (click)="submitApply()" [disabled]="applying()">
              @if (applying()) { <span class="spinner"></span> Sending… } @else { Send application }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .map-page {
      display: flex; height: 100vh; overflow: hidden;
      background: #0d1117;
      font-family: system-ui, -apple-system, sans-serif;
    }

    /* ── Panel ──────────────────────────────── */
    .panel {
      width: 380px; flex-shrink: 0; display: flex; flex-direction: column;
      background: #0d1117; border-right: 1px solid #21262d; overflow: hidden;
    }

    .panel-head {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 1rem 1.25rem; border-bottom: 1px solid #21262d; flex-shrink: 0;
      background: linear-gradient(180deg, #161b22 0%, #0d1117 100%);
    }
    .back-btn {
      width: 32px; height: 32px; border-radius: 8px;
      border: 1px solid #30363d; background: #161b22;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #8b949e; flex-shrink: 0;
      transition: border-color 0.15s, color 0.15s, background 0.15s;
    }
    .back-btn:hover { border-color: #d4ff3a; color: #d4ff3a; background: rgba(212,255,58,0.08); }
    .panel-title { font-size: 0.95rem; font-weight: 700; color: #e6edf3; letter-spacing: -0.02em; }
    .panel-sub { font-size: 0.7rem; color: #484f58; }
    .panel-spinner {
      width: 14px; height: 14px; margin-left: auto;
      border: 2px solid #21262d; border-top-color: #d4ff3a;
      border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0;
    }

    /* ── AI section ─────────────────────────── */
    .ai-section {
      padding: 0.875rem 1.25rem; border-bottom: 1px solid #21262d; flex-shrink: 0;
      background: linear-gradient(135deg, rgba(212,255,58,0.07), rgba(59,130,246,0.04));
    }
    .ai-label {
      display: flex; align-items: center; gap: 0.35rem;
      font-size: 0.64rem; font-weight: 700; color: #d4ff3a;
      text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 0.5rem;
    }
    .ai-bar { display: flex; gap: 0.375rem; }
    .ai-input {
      flex: 1; padding: 0.55rem 0.75rem;
      border: 1px solid #30363d; border-radius: 8px;
      font-size: 0.82rem; outline: none; font-family: inherit;
      background: #161b22; color: #e6edf3;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .ai-input:focus { border-color: #d4ff3a; box-shadow: 0 0 0 3px rgba(212,255,58,0.14); }
    .ai-input::placeholder { color: #484f58; }
    .ai-btn {
      width: 34px; height: 34px; border-radius: 8px;
      background: linear-gradient(135deg, #d4ff3a, #aed62e); border: none; color: #0d1117;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0;
      box-shadow: 0 2px 10px rgba(212,255,58,0.35);
      transition: box-shadow 0.15s, opacity 0.15s;
    }
    .ai-btn:hover:not(:disabled) { box-shadow: 0 4px 16px rgba(212,255,58,0.55); opacity: 0.92; }
    .ai-btn:disabled { opacity: 0.25; cursor: not-allowed; box-shadow: none; }
    .ai-spin {
      width: 13px; height: 13px;
      border: 2px solid rgba(0,0,0,0.2); border-top-color: #0d1117;
      border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    .ai-result {
      display: flex; align-items: center; gap: 0.4rem; margin-top: 0.5rem;
      padding: 0.4rem 0.625rem;
      background: rgba(212,255,58,0.08); border: 1px solid rgba(212,255,58,0.2);
      border-radius: 8px; font-size: 0.75rem; color: #d4ff3a; font-weight: 500;
    }
    .ai-clear {
      margin-left: auto; background: none; border: none;
      color: #484f58; cursor: pointer; font-size: 0.7rem;
      padding: 0.1rem 0.25rem; border-radius: 4px; transition: color 0.12s;
    }
    .ai-clear:hover { color: #f85149; }

    /* ── Filter Bar ─────────────────────────── */
    .filter-bar {
      position: absolute; top: 12px; left: 12px; right: 12px; z-index: 100;
      background: rgba(13,17,23,0.88);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 14px;
      backdrop-filter: blur(24px) saturate(1.8);
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    }
    .fb-inner {
      display: flex; align-items: center; gap: 0.375rem;
      padding: 0.5rem 0.75rem;
      overflow-x: auto; scrollbar-width: none;
    }
    .fb-inner::-webkit-scrollbar { display: none; }

    .fb-icon-group { display: flex; align-items: center; gap: 0.2rem; flex-shrink: 0; }
    .fb-icon { color: #484f58; flex-shrink: 0; }

    .fb-sep { width: 1px; height: 16px; background: rgba(255,255,255,0.08); flex-shrink: 0; margin: 0 0.125rem; }

    .fb-toggle-btn {
      display: inline-flex; align-items: center; gap: 0.3rem; flex-shrink: 0;
      padding: 0.22rem 0.6rem; border-radius: 99px;
      border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);
      color: #6e7681; font-size: 0.72rem; font-weight: 500;
      cursor: pointer; font-family: inherit; white-space: nowrap;
      transition: color 0.15s, background 0.15s, border-color 0.15s;
    }
    .fb-toggle-btn:hover { color: #e6edf3; border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.06); }
    .fb-toggle-btn--on { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); color: #c9d1d9; }

    .fb-clear {
      display: inline-flex; align-items: center; gap: 0.25rem;
      margin-left: auto; flex-shrink: 0; background: rgba(248,81,73,0.08);
      border: 1px solid rgba(248,81,73,0.18); border-radius: 99px;
      color: #ff7b72; font-size: 0.7rem; font-weight: 500;
      cursor: pointer; font-family: inherit; white-space: nowrap;
      padding: 0.22rem 0.55rem; transition: background 0.12s, border-color 0.12s;
    }
    .fb-clear:hover { background: rgba(248,81,73,0.15); border-color: rgba(248,81,73,0.3); }

    .chip-row { display: flex; gap: 0.25rem; flex-wrap: nowrap; }
    .chip-row--wrap { flex-wrap: wrap; }

    .chip {
      padding: 0.25rem 0.625rem; border-radius: 99px;
      border: 1px solid #30363d; background: transparent;
      font-size: 0.72rem; font-weight: 500; color: #8b949e;
      cursor: pointer; white-space: nowrap; font-family: inherit;
      transition: all 0.12s;
    }
    .chip--sm { padding: 0.18rem 0.5rem; font-size: 0.7rem; }
    .chip:hover { border-color: #6e7681; color: #e6edf3; background: rgba(255,255,255,0.04); }
    .chip--on { background: rgba(212,255,58,0.15); border-color: #d4ff3a; color: #d4ff3a; }
    .chip--high.chip--on      { background: rgba(210,153,34,0.12); border-color: #d29922; color: #e3b341; }
    .chip--emergency.chip--on { background: rgba(248,81,73,0.12);  border-color: #f85149; color: #ff7b72; }
    .chip--low.chip--on       { background: rgba(110,118,129,0.12); border-color: #6e7681; color: #8b949e; }
    .chip--normal.chip--on    { background: rgba(212,255,58,0.15);  border-color: #d4ff3a; color: #d4ff3a; }

    .toggle-row { display: flex; flex-direction: column; gap: 0.375rem; margin-top: 0.625rem; }
    .toggle-label {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.76rem; color: #8b949e; cursor: pointer; transition: color 0.12s;
    }
    .toggle-label:hover { color: #e6edf3; }
    .toggle-label input { accent-color: #d4ff3a; width: 14px; height: 14px; }

    /* ── Job list ───────────────────────────── */
    .job-list { flex: 1; overflow-y: auto; padding: 0.5rem; scrollbar-color: #30363d transparent; }
    .list-loading, .list-empty {
      display: flex; flex-direction: column; align-items: center;
      gap: 0.625rem; padding: 3rem 1rem; color: #484f58; font-size: 0.83rem; text-align: center;
    }
    .load-ring {
      width: 24px; height: 24px;
      border: 2px solid #21262d; border-top-color: #d4ff3a;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .list-card {
      padding: 0.75rem 0.875rem 0.75rem 1.125rem;
      border: 1px solid #21262d; border-radius: 12px;
      margin-bottom: 0.35rem; cursor: pointer;
      transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
      background: #161b22; position: relative; overflow: hidden;
    }
    .list-card::before {
      content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
      background: var(--urgency, #30363d); border-radius: 12px 0 0 12px;
      transition: width 0.15s;
    }
    .list-card:hover { border-color: #30363d; background: #1e252e; box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
    .list-card:hover::before { width: 4px; }
    .list-card--selected {
      border-color: #d4ff3a; background: rgba(212,255,58,0.05);
      box-shadow: 0 0 0 1px rgba(212,255,58,0.2);
    }
    .list-card--selected::before { width: 4px; background: #d4ff3a; }
    .list-card--applied { opacity: 0.4; }

    .lc-top { display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.3rem; flex-wrap: wrap; }
    .lc-cat {
      display: inline-flex; align-items: center; gap: 0.3rem;
      font-size: 0.65rem; font-weight: 600; color: #6e7681;
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .lc-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--dot, #6e7681); flex-shrink: 0; }
    .lc-title { font-size: 0.84rem; font-weight: 600; color: #e6edf3; margin-bottom: 0.2rem; }
    .lc-meta { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.3rem; }
    .lc-meta-item { font-size: 0.7rem; color: #6e7681; }
    .lc-footer { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .lc-price { font-size: 0.79rem; font-weight: 700; color: #e6edf3; }
    .lc-no-loc { font-size: 0.67rem; color: #484f58; background: #1e252e; padding: 0.12rem 0.4rem; border-radius: 99px; }

    /* ── Map area ───────────────────────────── */
    .map-area { flex: 1; position: relative; }
    .map-canvas { width: 100%; height: 100%; }

    /* ── Legend ─────────────────────────────── */
    .map-legend {
      position: absolute; bottom: 20px; right: 16px;
      background: rgba(13,17,23,0.88); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px; padding: 0.5rem 0.8rem;
      display: flex; flex-direction: column; gap: 0.3rem;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      backdrop-filter: blur(16px) saturate(1.6);
      pointer-events: none;
    }
    .legend-item { display: flex; align-items: center; gap: 0.45rem; font-size: 0.69rem; color: #8b949e; }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 6px currentColor; }


    /* ── Urgency badges ─────────────────────── */
    .urgency-badge { font-size: 0.64rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 99px; white-space: nowrap; }
    .urgency-normal    { background: rgba(212,255,58,0.12);  color: #d4ff3a; }
    .urgency-low       { background: rgba(110,118,129,0.12); color: #6e7681; }
    .urgency-high      { background: rgba(210,153,34,0.12);  color: #e3b341; }
    .urgency-emergency { background: rgba(248,81,73,0.14);   color: #ff7b72; }

    .apply-btn {
      display: inline-flex; align-items: center; gap: 0.35rem;
      background: linear-gradient(135deg, #d4ff3a, #aed62e); color: #0d1117; border: none;
      padding: 0.4rem 0.875rem; border-radius: 99px;
      font-size: 0.76rem; font-weight: 600; cursor: pointer; font-family: inherit; margin-left: auto;
      box-shadow: 0 2px 10px rgba(212,255,58,0.4);
      transition: box-shadow 0.15s, opacity 0.15s;
    }
    .apply-btn:hover { box-shadow: 0 4px 16px rgba(212,255,58,0.55); opacity: 0.92; }

    .status-pill { font-size: 0.68rem; font-weight: 600; padding: 0.2rem 0.625rem; border-radius: 99px; margin-left: auto; }
    .status-applied  { background: rgba(37,99,235,0.15);  color: #79b8ff; }
    .status-accepted { background: rgba(212,255,58,0.15); color: #d4ff3a; }
    .status-rejected { background: rgba(248,81,73,0.12);  color: #ff7b72; }

    /* ── Apply modal ────────────────────────── */
    .overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.7); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center;
      z-index: 2000; padding: 1rem;
    }
    .modal {
      background: #161b22; border: 1px solid #30363d;
      border-radius: 20px; width: 100%; max-width: 480px;
      box-shadow: 0 32px 80px rgba(0,0,0,0.7); overflow: hidden;
    }
    .modal-head {
      display: flex; align-items: flex-start; gap: 0.875rem;
      padding: 1.25rem 1.375rem 1rem; border-bottom: 1px solid #21262d;
    }
    .modal-title { font-size: 0.975rem; font-weight: 700; color: #e6edf3; margin: 0 0 0.2rem; }
    .modal-sub   { font-size: 0.78rem; color: #6e7681; }
    .modal-close {
      width: 28px; height: 28px; border-radius: 50%; background: #21262d;
      border: 1px solid #30363d; display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #6e7681; flex-shrink: 0; margin-left: auto;
      transition: background 0.12s, color 0.12s;
    }
    .modal-close:hover { background: #30363d; color: #e6edf3; }
    .modal-body { padding: 1rem 1.375rem; }
    .field { margin-bottom: 0.875rem; }
    label { display: block; font-size: 0.78rem; font-weight: 600; color: #c9d1d9; margin-bottom: 0.3rem; }
    .opt { font-weight: 400; color: #484f58; font-size: 0.74rem; }
    .field-input {
      width: 100%; padding: 0.65rem 0.875rem;
      border: 1px solid #30363d; border-radius: 10px;
      font-size: 0.875rem; outline: none; font-family: inherit;
      color: #e6edf3; background: #0d1117;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .field-input:focus { border-color: #d4ff3a; box-shadow: 0 0 0 3px rgba(212,255,58,0.15); }
    .field-input::placeholder { color: #484f58; }
    textarea.field-input { resize: vertical; }
    .modal-err {
      margin: 0 1.375rem 0.75rem;
      background: rgba(248,81,73,0.08); color: #ff7b72;
      border: 1px solid rgba(248,81,73,0.2);
      padding: 0.6rem 0.875rem; border-radius: 9px; font-size: 0.82rem;
    }
    .modal-actions {
      display: flex; gap: 0.5rem; justify-content: flex-end;
      padding: 0.875rem 1.375rem 1.375rem; border-top: 1px solid #21262d;
    }
    .btn-cancel {
      background: transparent; color: #6e7681; border: 1px solid #30363d;
      padding: 0.6rem 1.125rem; border-radius: 99px; font-size: 0.875rem;
      font-weight: 500; cursor: pointer; font-family: inherit;
      transition: background 0.12s, color 0.12s;
    }
    .btn-cancel:hover { background: #1e252e; color: #e6edf3; }
    .btn-submit {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: linear-gradient(135deg, #d4ff3a, #aed62e); color: #0d1117; border: none;
      padding: 0.6rem 1.375rem; border-radius: 99px; font-size: 0.875rem;
      font-weight: 600; cursor: pointer; font-family: inherit;
      box-shadow: 0 2px 10px rgba(212,255,58,0.35);
      transition: box-shadow 0.15s, opacity 0.15s;
    }
    .btn-submit:hover:not(:disabled) { box-shadow: 0 4px 20px rgba(212,255,58,0.5); opacity: 0.9; }
    .btn-submit:disabled { opacity: 0.3; cursor: not-allowed; }
    .spinner {
      width: 12px; height: 12px; border: 2px solid rgba(0,0,0,0.2);
      border-top-color: #0d1117; border-radius: 50%; animation: spin 0.7s linear infinite;
    }

    @media (max-width: 768px) {
      .map-page { flex-direction: column; height: auto; }
      .panel { width: 100%; height: auto; border-right: none; border-bottom: 1px solid #21262d; }
      .map-area { height: 60vh; }
      .map-overlay-card { width: calc(100% - 32px); }
    }
  `],
})
export class WorkerMapComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Data
  allJobs = signal<MapJob[]>([]);
  workerLocation = signal<{ lat: number; lng: number } | null>(null);
  loading = signal(true);
  idVerified = signal(false);

  // Filter state
  filterDistance = signal<number | null>(null);
  filterCategories = signal<string[]>([]);
  filterUrgency = signal<string[]>([]);
  filterMaxPrice = signal<number | null>(null);
  unappliedOnly = signal(false);
  verifiedOnly = signal(false);

  // AI
  aiQuery = '';
  aiLoading = signal(false);
  aiApplied = signal<string | null>(null);

  // Map interaction
  selectedJob = signal<MapJob | null>(null);

  // Apply modal
  applyingTo = signal<MapJob | null>(null);
  proposedPrice: number | null = null;
  applyMessage = '';
  applying = signal(false);
  applyError = signal<string | null>(null);

  // Map internals
  private mapInstance: any = null;
  private maplibreGl: any = null;
  private mapLoaded = false;
  private mapMarkers: { remove: () => void }[] = [];
  private focusJobId: string | null = null;
  private activePopup: any = null;

  // Derived
  allCategories = computed(() =>
    [...new Set(this.allJobs().map(j => j.category?.name).filter(Boolean))] as string[]
  );

  filteredJobs = computed(() => {
    let list = this.allJobs();
    const dist  = this.filterDistance();
    const cats  = this.filterCategories();
    const urgs  = this.filterUrgency();
    const price = this.filterMaxPrice();

    if (dist  !== null) list = list.filter(j => j.distanceKm !== null && j.distanceKm <= dist);
    if (cats.length)    list = list.filter(j => j.category && cats.includes(j.category.name));
    if (urgs.length)    list = list.filter(j => urgs.includes(j.urgency));
    if (price !== null) list = list.filter(j => j.priceMin !== null && j.priceMin <= price);
    if (this.unappliedOnly()) list = list.filter(j => !j.alreadyApplied);
    if (this.verifiedOnly())  list = list.filter(j => !!j.client?.idVerified);
    return list;
  });

  activeFilterCount = computed(() =>
    [this.filterDistance(), this.filterCategories().length || null, this.filterUrgency().length || null, this.filterMaxPrice()]
      .filter(v => v !== null).length +
    (this.unappliedOnly() ? 1 : 0) + (this.verifiedOnly() ? 1 : 0)
  );

  constructor() {
    // Re-render markers whenever filtered jobs change
    effect(() => {
      const jobs = this.filteredJobs();
      if (this.mapInstance) this.renderMarkers(jobs);
    });

    // Update radius circle when distance filter changes
    effect(() => {
      const dist = this.filterDistance();
      if (this.mapInstance) this.updateRadiusCircle(dist);
    });
  }

  ngOnInit() {
    this.focusJobId = this.route.snapshot.queryParamMap.get('focus');

    this.api.getVerifyStatus().subscribe({ next: (s: any) => this.idVerified.set(s.idVerified) });

    this.api.getJobsForMap().subscribe({
      next: (res: any) => {
        this.allJobs.set(res.jobs);
        if (res.workerLocation?.lat && res.workerLocation?.lng) {
          this.workerLocation.set({ lat: res.workerLocation.lat, lng: res.workerLocation.lng });
        }
        this.loading.set(false);
        setTimeout(() => this.initMap(), 50);
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy() {
    this.destroyMap();
  }

  // ── Filters ─────────────────────────────────────────────────────

  setDistance(d: number | null) {
    this.filterDistance.set(d);
  }

  toggleCategory(cat: string) {
    this.filterCategories.update(cats =>
      cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat]
    );
  }

  toggleUrgency(u: string) {
    this.filterUrgency.update(urgs =>
      urgs.includes(u) ? urgs.filter(x => x !== u) : [...urgs, u]
    );
  }

  clearAllFilters() {
    this.filterDistance.set(null);
    this.filterCategories.set([]);
    this.filterUrgency.set([]);
    this.filterMaxPrice.set(null);
    this.unappliedOnly.set(false);
    this.verifiedOnly.set(false);
    this.aiApplied.set(null);
    this.aiQuery = '';
  }

  // ── AI search ───────────────────────────────────────────────────

  runAiSearch() {
    if (!this.aiQuery.trim() || this.aiLoading()) return;
    this.aiLoading.set(true);

    this.api.parseAiMapFilter(this.aiQuery.trim()).subscribe({
      next: (res: any) => {
        if (res.categories?.length)  this.filterCategories.set(res.categories);
        if (res.urgency?.length)     this.filterUrgency.set(res.urgency);
        if (res.distanceKm)          this.filterDistance.set(res.distanceKm);
        if (res.maxPrice)            this.filterMaxPrice.set(res.maxPrice);
        if (res.minPrice != null)    {} // TODO: min price filter
        if (res.unappliedOnly)       this.unappliedOnly.set(true);
        if (res.verifiedOnly)        this.verifiedOnly.set(true);
        this.aiApplied.set(res.summary ?? this.aiQuery.trim());
        this.aiLoading.set(false);
      },
      error: () => {
        this.aiApplied.set('Could not parse query');
        this.aiLoading.set(false);
      },
    });
  }

  clearAiFilters() {
    this.aiApplied.set(null);
    this.aiQuery = '';
    this.clearAllFilters();
  }

  // ── Map interaction ──────────────────────────────────────────────

  selectJob(job: MapJob) {
    this.selectedJob.set(job);
    if (job.latitude && job.longitude && this.mapInstance) {
      this.mapInstance.flyTo({ center: [job.longitude, job.latitude], zoom: 15, duration: 700 });
      this.renderMarkers(this.filteredJobs(), job.id);
      this.showJobPopup(job);
    }
  }

  private showJobPopup(job: MapJob) {
    if (!this.maplibreGl || !this.mapInstance || !job.latitude || !job.longitude) return;
    if (this.activePopup) { this.activePopup.remove(); this.activePopup = null; }

    const urgencyColors: Record<string, string> = {
      EMERGENCY: '#ff7b72', HIGH: '#e3b341', NORMAL: '#d4ff3a', LOW: '#8b949e',
    };
    const uc = urgencyColors[job.urgency] ?? '#8b949e';
    const price = job.priceMin ? `€${job.priceMin}–${job.priceMax}` : 'Negotiable';
    const dist = job.distanceKm !== null ? `${job.distanceKm} km away` : '';

    const wrap = document.createElement('div');
    wrap.style.cssText = [
      'font-family:system-ui,-apple-system,sans-serif',
      'width:280px',
      'background:rgba(13,17,23,0.97)',
      'border:1px solid rgba(255,255,255,0.1)',
      'border-radius:16px',
      'padding:14px 16px 12px',
      'box-shadow:0 20px 60px rgba(0,0,0,0.7),0 1px 0 rgba(255,255,255,0.05) inset',
      'color:#e6edf3',
      'animation:popup-in 0.2s cubic-bezier(0.25,0.46,0.45,0.94) both',
    ].join(';');

    wrap.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:0.65rem;color:#6e7681;font-weight:500">${job.category?.name ?? 'General'} · ${job.city ?? ''}</span>
        <span style="font-size:0.62rem;font-weight:700;padding:2px 8px;border-radius:99px;background:${uc}18;color:${uc}">${this.urgencyLabel(job.urgency)}</span>
      </div>
      <p style="font-size:0.95rem;font-weight:700;margin:0 0 5px;letter-spacing:-0.01em;line-height:1.3">${job.title}</p>
      <p style="font-size:0.76rem;color:#8b949e;margin:0 0 10px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${job.description}</p>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="font-size:0.88rem;font-weight:700;color:#e6edf3">${price}</span>
        ${dist ? `<span style="font-size:0.72rem;color:#6e7681">·</span><span style="font-size:0.72rem;color:#6e7681">${dist}</span>` : ''}
      </div>
      <button class="popup-view-btn" style="
        width:100%;padding:8px 14px;border-radius:10px;border:none;cursor:pointer;
        background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);
        color:#e6edf3;font-size:0.8rem;font-weight:600;
        font-family:system-ui,-apple-system,sans-serif;
        display:flex;align-items:center;justify-content:center;gap:6px;
        transition:background 0.15s,border-color 0.15s;
      ">
        View full job
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    `;

    const btn = wrap.querySelector('.popup-view-btn') as HTMLElement;
    btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(255,255,255,0.13)'; btn.style.borderColor = 'rgba(255,255,255,0.22)'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = 'rgba(255,255,255,0.08)'; btn.style.borderColor = 'rgba(255,255,255,0.12)'; });
    btn.addEventListener('click', () => this.router.navigate(['/worker/jobs', job.id]));

    this.activePopup = new this.maplibreGl.Popup({
      offset: 20,
      anchor: 'bottom',
      closeButton: false,
      closeOnClick: true,
      maxWidth: 'none',
    })
      .setLngLat([job.longitude, job.latitude])
      .setDOMContent(wrap)
      .addTo(this.mapInstance);

    this.activePopup.on('close', () => {
      this.activePopup = null;
      this.selectedJob.set(null);
      this.renderMarkers(this.filteredJobs());
    });
  }

  // ── Apply modal ──────────────────────────────────────────────────

  openApply(job: MapJob) {
    this.applyingTo.set(job);
    this.proposedPrice = null;
    this.applyMessage = '';
    this.applyError.set(null);
  }

  closeApply() { this.applyingTo.set(null); }

  submitApply() {
    const job = this.applyingTo();
    if (!job) return;
    this.applying.set(true);
    this.applyError.set(null);

    this.api.applyToJob(job.id, {
      proposedPrice: this.proposedPrice ?? undefined,
      message: this.applyMessage || undefined,
    }).subscribe({
      next: () => {
        this.allJobs.update(jobs =>
          jobs.map(j => j.id === job.id ? { ...j, alreadyApplied: true, applicationStatus: 'APPLIED' } : j)
        );
        this.applying.set(false);
        this.closeApply();
        this.selectedJob.update(s => s?.id === job.id ? { ...s, alreadyApplied: true, applicationStatus: 'APPLIED' } : s);
      },
      error: (err: any) => {
        this.applyError.set(err?.error?.message ?? 'Failed to apply.');
        this.applying.set(false);
      },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────

  urgencyHex(u: string): string {
    return ({ EMERGENCY: '#f85149', HIGH: '#d29922', NORMAL: '#d4ff3a', LOW: '#6e7681' } as Record<string, string>)[u] ?? '#6e7681';
  }

  catColor(category?: string | null): string {
    const map: Record<string, string> = {
      'Cleaning': '#14b8a6', 'Plumbing': '#2563eb', 'Electrical': '#f59e0b',
      'Moving': '#8b5cf6', 'Gardening': '#16a34a', 'Painting': '#f97316',
    };
    return map[category ?? ''] ?? '#a1a1aa';
  }

  urgencyLabel(u: string): string {
    return { NORMAL: 'Normal', HIGH: 'High', EMERGENCY: 'Emergency', LOW: 'Low' }[u] ?? u;
  }

  statusLabel(s: string | null): string {
    return { APPLIED: 'Applied', ACCEPTED: 'Accepted', REJECTED: 'Rejected' }[s ?? ''] ?? (s ?? '');
  }

  // ── MapLibre ─────────────────────────────────────────────────────

  private async initMap() {
    const el = document.getElementById('worker-job-map');
    if (!el) return;
    this.destroyMap();

    const ml = (await import('maplibre-gl')).default;
    this.maplibreGl = ml;

    const wloc = this.workerLocation();
    const center: [number, number] = wloc ? [wloc.lng, wloc.lat] : [16.3738, 48.2082];

    this.mapInstance = new ml.Map({
      container: el,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center,
      zoom: 12,
    });

    this.mapInstance.on('load', () => {
      this.mapLoaded = true;

      this.mapInstance.addSource('radius', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      this.mapInstance.addLayer({
        id: 'radius-fill',
        type: 'fill',
        source: 'radius',
        paint: { 'fill-color': '#d4ff3a', 'fill-opacity': 0.05 },
      });
      this.mapInstance.addLayer({
        id: 'radius-border',
        type: 'line',
        source: 'radius',
        paint: { 'line-color': '#d4ff3a', 'line-width': 1.5, 'line-dasharray': [4, 3] },
      });

      if (wloc) {
        const dot = document.createElement('div');
        dot.style.cssText = [
          'width:16px', 'height:16px', 'border-radius:50%',
          'background:#60a5fa', 'border:2.5px solid rgba(255,255,255,0.9)',
          'box-shadow:0 0 0 6px rgba(96,165,250,0.2),0 0 16px rgba(96,165,250,0.5),0 2px 6px rgba(0,0,0,0.5)',
        ].join(';');
        new ml.Marker({ element: dot, anchor: 'center' })
          .setLngLat([wloc.lng, wloc.lat])
          .addTo(this.mapInstance);
      }

      const jobs = this.filteredJobs();
      this.renderMarkers(jobs);
      this.updateRadiusCircle(this.filterDistance());

      if (this.focusJobId) {
        const job = jobs.find(j => j.id === this.focusJobId);
        const focusLng = job?.longitude ?? null;
        const focusLat = job?.latitude ?? null;
        if (job && focusLng !== null && focusLat !== null) {
          setTimeout(() => {
            this.mapInstance.flyTo({ center: [focusLng, focusLat], zoom: 15, duration: 700 });
            this.selectedJob.set(job);
            this.renderMarkers(jobs, job.id);
          }, 300);
        }
      }
    });
  }

  private renderMarkers(jobs: MapJob[], highlightId?: string) {
    this.mapMarkers.forEach(m => m.remove());
    this.mapMarkers = [];

    if (!this.mapInstance || !this.mapLoaded || !this.maplibreGl) return;

    const ml = this.maplibreGl;
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    let hasBounds = false;

    jobs.forEach(job => {
      const lng = job.longitude;
      const lat = job.latitude;
      if (!lat || !lng) return;

      const urgencyColor: Record<string, string> = {
        EMERGENCY: '#ef4444', HIGH: '#f97316', NORMAL: '#d4ff3a', LOW: '#6e7681',
      };
      const isHighlighted = highlightId === job.id;
      const isEmergency = job.urgency === 'EMERGENCY' && !job.alreadyApplied;
      const baseColor = job.alreadyApplied ? '#d4d4d8' : (urgencyColor[job.urgency] ?? '#d4ff3a');
      const size = isHighlighted ? 46 : 36;

      const glowColor = job.alreadyApplied ? '#6e7681' : baseColor;
      const baseShadow = `0 4px 20px ${glowColor}99,0 2px 6px rgba(0,0,0,0.6)`;
      const hoverShadow = `0 0 0 5px ${glowColor}33,0 10px 28px ${glowColor}bb,0 4px 8px rgba(0,0,0,0.6)`;
      const highlightShadow = `0 0 0 6px ${glowColor}44,0 8px 28px ${glowColor}cc,0 3px 8px rgba(0,0,0,0.7)`;

      // Wrapper handles events and stays fixed — visual el transforms inside it
      const wrapper = document.createElement('div');
      wrapper.style.cssText = [
        `width:${size}px`, `height:${size}px`,
        'cursor:pointer', 'user-select:none',
        'display:flex', 'align-items:center', 'justify-content:center',
      ].join(';');

      const el = document.createElement('div');
      el.style.cssText = [
        `width:${size}px`, `height:${size}px`, 'border-radius:50%',
        `background:${baseColor}`,
        `border:${isHighlighted ? `3px solid #fff` : '2.5px solid rgba(255,255,255,0.18)'}`,
        `box-shadow:${isHighlighted ? highlightShadow : baseShadow}`,
        'display:flex', 'align-items:center', 'justify-content:center',
        `font-size:${isHighlighted ? 20 : 14}px`,
        'pointer-events:none',
        'transition:transform 0.2s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.2s',
      ].join(';');
      el.innerHTML = job.category?.icon ?? '📍';

      if (isEmergency) el.classList.add('marker-pulse');
      wrapper.appendChild(el);

      wrapper.addEventListener('mouseenter', () => {
        if (!isHighlighted) {
          el.style.transform = 'scale(1.2) translateY(-3px)';
          el.style.boxShadow = hoverShadow;
        }
      });
      wrapper.addEventListener('mouseleave', () => {
        if (!isHighlighted) {
          el.style.transform = '';
          el.style.boxShadow = baseShadow;
        }
      });
      wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectJob(job);
      });

      const marker = new ml.Marker({ element: wrapper, anchor: 'center' })
        .setLngLat([lng, lat])
        .addTo(this.mapInstance);

      this.mapMarkers.push(marker);

      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
      hasBounds = true;
    });

    if (!highlightId && hasBounds) {
      if (this.mapMarkers.length === 1) {
        this.mapInstance.flyTo({ center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2], zoom: 14 });
      } else {
        this.mapInstance.fitBounds(
          [[minLng, minLat], [maxLng, maxLat]],
          { padding: 70, maxZoom: 14 },
        );
      }
    }
  }

  private updateRadiusCircle(distKm: number | null) {
    if (!this.mapInstance || !this.mapLoaded) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const src = this.mapInstance.getSource('radius') as any;
    if (!src) return;

    const wloc = this.workerLocation();
    if (!distKm || !wloc) {
      src.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const pts = 64;
    const dLat = (distKm / 6371) * (180 / Math.PI);
    const dLng = dLat / Math.cos(wloc.lat * Math.PI / 180);
    const coords: number[][] = [];
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * 2 * Math.PI;
      coords.push([wloc.lng + dLng * Math.sin(a), wloc.lat + dLat * Math.cos(a)]);
    }

    src.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
        properties: {},
      }],
    });
  }

  private destroyMap() {
    if (this.activePopup) { this.activePopup.remove(); this.activePopup = null; }
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
      this.mapLoaded = false;
      this.maplibreGl = null;
      this.mapMarkers = [];
    }
  }
}
