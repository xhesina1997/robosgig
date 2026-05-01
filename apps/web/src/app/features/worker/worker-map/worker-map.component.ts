import { Component, inject, signal, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
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

        <!-- ── Filters ── -->
        <div class="filters">
          <div class="filters-head">
            <span class="filters-label">Filters</span>
            @if (activeFilterCount() > 0) {
              <button class="clear-all-btn" (click)="clearAllFilters()">
                Clear all · {{ activeFilterCount() }}
              </button>
            }
          </div>

          <!-- Distance -->
          <div class="filter-group">
            <div class="filter-group-label">Radius</div>
            <div class="chip-row">
              <button class="chip" [class.chip--on]="filterDistance() === null" (click)="setDistance(null)">Any</button>
              @for (d of [5, 10, 25, 50]; track d) {
                <button class="chip" [class.chip--on]="filterDistance() === d" (click)="setDistance(d)">{{ d }} km</button>
              }
            </div>
          </div>

          <!-- Categories -->
          @if (allCategories().length > 0) {
            <div class="filter-group">
              <div class="filter-group-label">Categories</div>
              <div class="chip-row chip-row--wrap">
                @for (cat of allCategories(); track cat) {
                  <button
                    class="chip"
                    [class.chip--on]="filterCategories().includes(cat)"
                    (click)="toggleCategory(cat)"
                  >{{ cat }}</button>
                }
              </div>
            </div>
          }

          <!-- Urgency -->
          <div class="filter-group">
            <div class="filter-group-label">Urgency</div>
            <div class="chip-row">
              <button class="chip chip--low"       [class.chip--on]="filterUrgency().includes('LOW')"       (click)="toggleUrgency('LOW')">Low</button>
              <button class="chip chip--normal"    [class.chip--on]="filterUrgency().includes('NORMAL')"    (click)="toggleUrgency('NORMAL')">Normal</button>
              <button class="chip chip--high"      [class.chip--on]="filterUrgency().includes('HIGH')"      (click)="toggleUrgency('HIGH')">High</button>
              <button class="chip chip--emergency" [class.chip--on]="filterUrgency().includes('EMERGENCY')" (click)="toggleUrgency('EMERGENCY')">Emergency</button>
            </div>
          </div>

          <!-- Budget -->
          <div class="filter-group">
            <div class="filter-group-label">Max budget</div>
            <div class="chip-row">
              <button class="chip" [class.chip--on]="filterMaxPrice() === null" (click)="filterMaxPrice.set(null)">Any</button>
              @for (p of [50, 100, 250, 500]; track p) {
                <button class="chip" [class.chip--on]="filterMaxPrice() === p" (click)="filterMaxPrice.set(p)">€{{ p }}</button>
              }
            </div>
          </div>

          <!-- Toggles -->
          <div class="toggle-row">
            <label class="toggle-label">
              <input type="checkbox" [checked]="unappliedOnly()" (change)="unappliedOnly.set(!unappliedOnly())"> Unapplied only
            </label>
            <label class="toggle-label">
              <input type="checkbox" [checked]="verifiedOnly()" (change)="verifiedOnly.set(!verifiedOnly())"> Verified clients only
            </label>
          </div>
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

        <!-- Map legend -->
        <div class="map-legend">
          <span class="legend-item"><span class="legend-dot" style="background:#ef4444"></span>Emergency</span>
          <span class="legend-item"><span class="legend-dot" style="background:#f97316"></span>High</span>
          <span class="legend-item"><span class="legend-dot" style="background:#2d9580"></span>Normal</span>
          <span class="legend-item"><span class="legend-dot" style="background:#a1a1aa"></span>Low / Applied</span>
        </div>

        <!-- Selected job overlay -->
        @if (selectedJob()) {
          <div class="map-overlay-card">
            <div class="moc-head">
              <div>
                <p class="moc-cat">{{ selectedJob()!.category?.name || 'General' }} · {{ selectedJob()!.city }}</p>
                <h3 class="moc-title">{{ selectedJob()!.title }}</h3>
              </div>
              <button class="moc-close" (click)="selectedJob.set(null)">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p class="moc-desc">{{ selectedJob()!.description }}</p>
            <div class="moc-footer">
              <span class="moc-price">
                @if (selectedJob()!.priceMin) { €{{ selectedJob()!.priceMin }}–{{ selectedJob()!.priceMax }} } @else { Negotiable }
              </span>
              @if (selectedJob()!.distanceKm !== null) {
                <span class="moc-dist">{{ selectedJob()!.distanceKm }} km away</span>
              }
              @if (selectedJob()!.alreadyApplied) {
                <span class="status-pill status-{{ selectedJob()!.applicationStatus?.toLowerCase() }}">{{ statusLabel(selectedJob()!.applicationStatus) }}</span>
              } @else if (idVerified()) {
                <button class="apply-btn" (click)="openApply(selectedJob()!)">
                  Apply <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </button>
              }
            </div>
          </div>
        }
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
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: #f8f8f8;
      font-family: system-ui, -apple-system, sans-serif;
    }

    /* ── Panel ──────────────────────────────── */
    .panel {
      width: 380px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      background: #fff;
      border-right: 1.5px solid #e4e4e7;
      overflow: hidden;
    }

    .panel-head {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.125rem;
      border-bottom: 1px solid #f4f4f5;
      flex-shrink: 0;
    }
    .back-btn {
      width: 32px; height: 32px; border-radius: 8px;
      border: 1.5px solid #e4e4e7; background: #fff;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #52525b; flex-shrink: 0;
      transition: border-color 0.15s, color 0.15s;
    }
    .back-btn:hover { border-color: #2d9580; color: #2d9580; }
    .panel-title { font-size: 1rem; font-weight: 700; color: #18181b; letter-spacing: -0.02em; }
    .panel-sub { font-size: 0.72rem; color: #a1a1aa; }
    .panel-spinner {
      width: 16px; height: 16px; margin-left: auto;
      border: 2px solid #e4e4e7; border-top-color: #2d9580;
      border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0;
    }

    /* ── AI section ─────────────────────────── */
    .ai-section {
      padding: 0.875rem 1.125rem;
      border-bottom: 1px solid #f4f4f5;
      flex-shrink: 0;
      background: linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 100%);
    }
    .ai-label {
      display: flex; align-items: center; gap: 0.35rem;
      font-size: 0.68rem; font-weight: 700; color: #2d9580;
      text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 0.5rem;
    }
    .ai-bar { display: flex; gap: 0.375rem; }
    .ai-input {
      flex: 1; padding: 0.55rem 0.75rem;
      border: 1.5px solid #d1fae5; border-radius: 8px;
      font-size: 0.82rem; outline: none; font-family: inherit;
      background: #fff; color: #18181b;
      transition: border-color 0.15s;
    }
    .ai-input:focus { border-color: #2d9580; }
    .ai-input::placeholder { color: #a1a1aa; }
    .ai-btn {
      width: 34px; height: 34px; border-radius: 8px;
      background: #2d9580; border: none; color: #fff;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0;
      transition: background 0.15s;
    }
    .ai-btn:hover:not(:disabled) { background: #257a68; }
    .ai-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .ai-spin {
      width: 13px; height: 13px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff; border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    .ai-result {
      display: flex; align-items: center; gap: 0.4rem;
      margin-top: 0.5rem; padding: 0.4rem 0.625rem;
      background: rgba(45,149,128,0.08); border: 1px solid rgba(45,149,128,0.2);
      border-radius: 8px; font-size: 0.76rem; color: #0f766e; font-weight: 500;
    }
    .ai-clear {
      margin-left: auto; background: none; border: none;
      color: #a1a1aa; cursor: pointer; font-size: 0.7rem;
      padding: 0.1rem 0.25rem; border-radius: 4px;
      transition: color 0.12s;
    }
    .ai-clear:hover { color: #ef4444; }

    /* ── Filters ────────────────────────────── */
    .filters {
      padding: 0.875rem 1.125rem;
      border-bottom: 1.5px solid #e4e4e7;
      flex-shrink: 0;
    }
    .filters-head {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .filters-label { font-size: 0.72rem; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.07em; }
    .clear-all-btn {
      font-size: 0.72rem; color: #ef4444; background: none; border: none;
      cursor: pointer; font-weight: 600; font-family: inherit;
    }
    .clear-all-btn:hover { text-decoration: underline; }

    .filter-group { margin-bottom: 0.75rem; }
    .filter-group:last-child { margin-bottom: 0; }
    .filter-group-label { font-size: 0.72rem; font-weight: 600; color: #52525b; margin-bottom: 0.375rem; }

    .chip-row { display: flex; gap: 0.3rem; flex-wrap: nowrap; }
    .chip-row--wrap { flex-wrap: wrap; }

    .chip {
      padding: 0.28rem 0.65rem; border-radius: 99px;
      border: 1.5px solid #e4e4e7; background: #fff;
      font-size: 0.73rem; font-weight: 500; color: #52525b;
      cursor: pointer; white-space: nowrap; font-family: inherit;
      transition: all 0.12s;
    }
    .chip:hover { border-color: #a1a1aa; color: #18181b; }
    .chip--on { background: #18181b; border-color: #18181b; color: #fff; }
    .chip--high.chip--on      { background: #f97316; border-color: #f97316; }
    .chip--emergency.chip--on { background: #ef4444; border-color: #ef4444; }
    .chip--low.chip--on       { background: #a1a1aa; border-color: #a1a1aa; }
    .chip--normal.chip--on    { background: #2d9580; border-color: #2d9580; }

    .toggle-row { display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.75rem; }
    .toggle-label {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.78rem; color: #3f3f46; cursor: pointer;
    }
    .toggle-label input { accent-color: #2d9580; width: 14px; height: 14px; }

    /* ── Job list ───────────────────────────── */
    .job-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.625rem;
    }
    .list-loading, .list-empty {
      display: flex; flex-direction: column; align-items: center;
      gap: 0.625rem; padding: 3rem 1rem;
      color: #a1a1aa; font-size: 0.84rem; text-align: center;
    }
    .load-ring {
      width: 24px; height: 24px;
      border: 2.5px solid #e4e4e7; border-top-color: #2d9580;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .list-card {
      padding: 0.75rem 0.875rem;
      border: 1.5px solid #e4e4e7; border-radius: 12px;
      margin-bottom: 0.4rem;
      cursor: pointer; transition: all 0.15s;
      background: #fff;
    }
    .list-card:hover { border-color: #a7f3d0; box-shadow: 0 2px 10px rgba(45,149,128,0.08); }
    .list-card--selected { border-color: #2d9580; box-shadow: 0 0 0 3px rgba(45,149,128,0.12); }
    .list-card--applied { opacity: 0.55; }

    .lc-top { display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.35rem; flex-wrap: wrap; }
    .lc-cat {
      display: inline-flex; align-items: center; gap: 0.3rem;
      font-size: 0.68rem; font-weight: 600; color: #71717a;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .lc-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--dot, #a1a1aa); flex-shrink: 0;
    }
    .lc-title { font-size: 0.84rem; font-weight: 600; color: #18181b; margin-bottom: 0.25rem; }
    .lc-meta { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.35rem; }
    .lc-meta-item { font-size: 0.7rem; color: #71717a; }
    .lc-footer { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .lc-price { font-size: 0.8rem; font-weight: 700; color: #18181b; }
    .lc-no-loc { font-size: 0.68rem; color: #a1a1aa; background: #f4f4f5; padding: 0.15rem 0.45rem; border-radius: 99px; }

    /* ── Map area ───────────────────────────── */
    .map-area { flex: 1; position: relative; }
    .map-canvas { width: 100%; height: 100%; }

    /* ── Legend ─────────────────────────────── */
    .map-legend {
      position: absolute; bottom: 24px; left: 16px;
      background: rgba(255,255,255,0.95); border: 1px solid #e4e4e7;
      border-radius: 10px; padding: 0.5rem 0.75rem;
      display: flex; flex-direction: column; gap: 0.3rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
      pointer-events: none;
    }
    .legend-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.72rem; color: #3f3f46; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

    /* ── Selected job overlay card ──────────── */
    .map-overlay-card {
      position: absolute; bottom: 24px; right: 16px;
      width: 340px; background: #fff;
      border: 1.5px solid #e4e4e7; border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      padding: 1rem 1.125rem;
      animation: slideUp 0.2s ease both;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .moc-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.5rem; }
    .moc-cat { font-size: 0.7rem; color: #a1a1aa; margin-bottom: 0.15rem; }
    .moc-title { font-size: 0.95rem; font-weight: 700; color: #18181b; letter-spacing: -0.01em; }
    .moc-close {
      width: 26px; height: 26px; border-radius: 50%;
      background: #f4f4f5; border: none; display: flex;
      align-items: center; justify-content: center;
      cursor: pointer; color: #71717a; flex-shrink: 0;
    }
    .moc-close:hover { background: #e4e4e7; }
    .moc-desc {
      font-size: 0.8rem; color: #71717a; line-height: 1.55; margin-bottom: 0.75rem;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .moc-footer { display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap; }
    .moc-price { font-size: 0.9rem; font-weight: 700; color: #18181b; }
    .moc-dist { font-size: 0.75rem; color: #71717a; }

    /* ── Urgency badges ─────────────────────── */
    .urgency-badge {
      font-size: 0.65rem; font-weight: 600;
      padding: 0.15rem 0.5rem; border-radius: 99px; white-space: nowrap;
    }
    .urgency-normal    { background: rgba(0,0,0,0.05); color: #71717a; }
    .urgency-low       { background: rgba(0,0,0,0.04); color: #a1a1aa; }
    .urgency-high      { background: rgba(245,158,11,0.1); color: #b45309; }
    .urgency-emergency { background: rgba(239,68,68,0.08); color: #dc2626; }

    .apply-btn {
      display: inline-flex; align-items: center; gap: 0.35rem;
      background: #2d9580; color: #fff; border: none;
      padding: 0.45rem 1rem; border-radius: 99px;
      font-size: 0.78rem; font-weight: 600; cursor: pointer;
      transition: background 0.15s; font-family: inherit; margin-left: auto;
    }
    .apply-btn:hover { background: #257a68; }

    .status-pill { font-size: 0.68rem; font-weight: 600; padding: 0.2rem 0.65rem; border-radius: 99px; margin-left: auto; }
    .status-applied  { background: rgba(37,99,235,0.08); color: #1d4ed8; }
    .status-accepted { background: rgba(20,184,166,0.1); color: #0f766e; }
    .status-rejected { background: rgba(239,68,68,0.08); color: #dc2626; }

    /* ── Apply modal ────────────────────────── */
    .overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.45); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      z-index: 2000; padding: 1rem;
    }
    .modal {
      background: #fff; border-radius: 20px;
      width: 100%; max-width: 480px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.18); overflow: hidden;
    }
    .modal-head {
      display: flex; align-items: flex-start; gap: 0.875rem;
      padding: 1.25rem 1.375rem 1rem; border-bottom: 1px solid #f4f4f5;
    }
    .modal-title { font-size: 0.975rem; font-weight: 700; color: #18181b; margin: 0 0 0.2rem; }
    .modal-sub   { font-size: 0.78rem; color: #a1a1aa; }
    .modal-close {
      width: 28px; height: 28px; border-radius: 50%; background: #f4f4f5;
      border: none; display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #71717a; flex-shrink: 0; margin-left: auto;
    }
    .modal-body { padding: 1rem 1.375rem; }
    .field { margin-bottom: 0.875rem; }
    label { display: block; font-size: 0.78rem; font-weight: 600; color: #18181b; margin-bottom: 0.3rem; }
    .opt { font-weight: 400; color: #a1a1aa; font-size: 0.74rem; }
    .field-input {
      width: 100%; padding: 0.65rem 0.875rem;
      border: 1.5px solid #e4e4e7; border-radius: 10px;
      font-size: 0.875rem; outline: none; font-family: inherit;
      color: #18181b; background: #fff; transition: border-color 0.15s;
    }
    .field-input:focus { border-color: #2d9580; }
    textarea.field-input { resize: vertical; }
    .modal-err {
      margin: 0 1.375rem 0.75rem;
      background: rgba(239,68,68,0.07); color: #dc2626;
      border: 1px solid rgba(239,68,68,0.15);
      padding: 0.6rem 0.875rem; border-radius: 9px; font-size: 0.82rem;
    }
    .modal-actions {
      display: flex; gap: 0.5rem; justify-content: flex-end;
      padding: 0.875rem 1.375rem 1.375rem; border-top: 1px solid #f4f4f5;
    }
    .btn-cancel {
      background: transparent; color: #71717a; border: 1.5px solid #e4e4e7;
      padding: 0.6rem 1.125rem; border-radius: 99px; font-size: 0.875rem;
      font-weight: 500; cursor: pointer; font-family: inherit;
    }
    .btn-submit {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: #2d9580; color: #fff; border: none;
      padding: 0.6rem 1.375rem; border-radius: 99px; font-size: 0.875rem;
      font-weight: 600; cursor: pointer; font-family: inherit;
    }
    .btn-submit:disabled { opacity: 0.45; cursor: not-allowed; }
    .spinner {
      width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite;
    }

    @media (max-width: 768px) {
      .map-page { flex-direction: column; height: auto; }
      .panel { width: 100%; height: auto; border-right: none; border-bottom: 1.5px solid #e4e4e7; }
      .map-area { height: 60vh; }
      .map-overlay-card { width: calc(100% - 32px); }
    }
  `],
})
export class WorkerMapComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

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
  private mapMarkers: any[] = [];
  private radiusCircle: any = null;
  private workerMarker: any = null;
  private focusJobId: string | null = null;

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
      this.mapInstance.flyTo([job.latitude, job.longitude], 15, { duration: 0.7 });
      // Highlight the marker
      this.renderMarkers(this.filteredJobs(), job.id);
    }
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

  // ── Leaflet ──────────────────────────────────────────────────────

  private async initMap() {
    const el = document.getElementById('worker-job-map');
    if (!el) return;
    this.destroyMap();

    const L = await import('leaflet');
    const lf: typeof import('leaflet') = (L as any).default ?? L;

    const center: [number, number] = this.workerLocation()
      ? [this.workerLocation()!.lat, this.workerLocation()!.lng]
      : [48.2082, 16.3738];

    this.mapInstance = lf.map(el, { center, zoom: 12, zoomControl: true });

    lf.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.mapInstance);

    // Worker location marker
    if (this.workerLocation()) {
      const wloc = this.workerLocation()!;
      const workerIcon = lf.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 4px rgba(59,130,246,0.25),0 2px 8px rgba(0,0,0,0.2)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      this.workerMarker = lf.marker([wloc.lat, wloc.lng], { icon: workerIcon }).addTo(this.mapInstance);
      this.workerMarker.bindTooltip('Your location', { permanent: false });
    }

    const jobs = this.filteredJobs();
    this.renderMarkers(jobs);

    // Focus on a specific job if requested
    if (this.focusJobId) {
      const job = jobs.find(j => j.id === this.focusJobId);
      if (job?.latitude && job?.longitude) {
        setTimeout(() => {
          this.mapInstance.flyTo([job.latitude!, job.longitude!], 15, { duration: 0.7 });
          this.selectedJob.set(job);
          this.renderMarkers(jobs, job.id);
        }, 300);
      }
    }
  }

  private renderMarkers(jobs: MapJob[], highlightId?: string) {
    this.mapMarkers.forEach(m => m.remove());
    this.mapMarkers = [];

    const L_module = (window as any).__leaflet__;
    if (!this.mapInstance) return;

    import('leaflet').then((L) => {
      const lf: typeof import('leaflet') = (L as any).default ?? L;
      const bounds: [number, number][] = [];

      jobs.forEach(job => {
        if (!job.latitude || !job.longitude) return;

        const urgencyColor: Record<string, string> = {
          EMERGENCY: '#ef4444', HIGH: '#f97316', NORMAL: '#2d9580', LOW: '#a1a1aa',
        };
        const isHighlighted = highlightId === job.id;
        const baseColor = job.alreadyApplied ? '#d4d4d8' : (urgencyColor[job.urgency] ?? '#2d9580');
        const size = isHighlighted ? 44 : 34;

        const icon = lf.divIcon({
          className: '',
          html: `<div style="
            width:${size}px;height:${size}px;border-radius:50%;
            background:${baseColor};
            border:${isHighlighted ? '3px solid #18181b' : '3px solid #fff'};
            box-shadow:${isHighlighted ? '0 0 0 3px rgba(24,24,27,0.2),' : ''}0 2px 8px rgba(0,0,0,0.2);
            display:flex;align-items:center;justify-content:center;
            font-size:${isHighlighted ? 16 : 13}px;
            cursor:pointer;
            transition:transform 0.15s;
          ">${job.category?.icon ?? '📍'}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = lf.marker([job.latitude!, job.longitude!], { icon })
          .addTo(this.mapInstance)
          .on('click', () => this.selectJob(job));

        this.mapMarkers.push(marker);
        bounds.push([job.latitude!, job.longitude!]);
      });

      if (!highlightId && bounds.length > 0) {
        if (bounds.length === 1) {
          this.mapInstance.setView(bounds[0], 14);
        } else {
          this.mapInstance.fitBounds(bounds, { padding: [40, 40] });
        }
      }
    });
  }

  private updateRadiusCircle(distKm: number | null) {
    if (this.radiusCircle) {
      this.radiusCircle.remove();
      this.radiusCircle = null;
    }
    if (!distKm || !this.workerLocation() || !this.mapInstance) return;

    import('leaflet').then((L) => {
      const lf: typeof import('leaflet') = (L as any).default ?? L;
      const wloc = this.workerLocation()!;
      this.radiusCircle = lf.circle([wloc.lat, wloc.lng], {
        radius: distKm * 1000,
        color: '#2d9580',
        fillColor: '#2d9580',
        fillOpacity: 0.04,
        weight: 1.5,
        dashArray: '6 4',
      }).addTo(this.mapInstance);
    });
  }

  private destroyMap() {
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
      this.mapMarkers = [];
      this.radiusCircle = null;
      this.workerMarker = null;
    }
  }
}
