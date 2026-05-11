import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface NearbyJob {
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
  selector: 'app-worker-jobs',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page">

      <!-- Pool picker (fullscreen) -->
      @if (pool() === null && tab() !== 'saved') {
        <div class="pool-pick">
          <div class="pool-pick-inner">

            <div class="pool-eyebrow">
              <span class="pool-eyebrow-line"></span>
              <span class="pool-eyebrow-text">Job board</span>
              <span class="pool-eyebrow-line"></span>
            </div>

            <h1 class="pool-pick-title">
              What kind of work<br>
              are you looking for<span class="pool-title-q">?</span>
            </h1>
            <p class="pool-pick-sub">
              <span class="pool-sub-strong">{{ totalOpen() }} jobs</span>
              open near you@if (auth.city()) { in {{ auth.city() }}} · updated 2 min ago
            </p>

            <div class="pool-pick-grid">
              @for (tile of poolTiles(); track tile.id) {
                <button
                  class="pool-card"
                  [class.pool-card--hover]="hoverPool() === tile.id"
                  (mouseenter)="hoverPool.set(tile.id)"
                  (mouseleave)="hoverPool.set(null)"
                  (click)="pool.set(tile.id)"
                  type="button"
                >
                  <div class="pool-card-top">
                    <div class="pool-card-icon" [class]="'pool-card-icon--' + tile.tone">
                      @if (tile.id === 'tasks') {
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M9 11h6M9 15h4"/></svg>
                      } @else {
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2.5a5 5 0 0 0-3.7 8.4l-7.6 7.6a1.5 1.5 0 0 0 2.1 2.1l7.6-7.6a5 5 0 0 0 6.5-6.5l-2.6 2.6-2.5-.5-.5-2.5 2.7-2.6a5 5 0 0 0-2-1z"/></svg>
                      }
                    </div>
                    <div class="pool-card-count-block">
                      <div class="pool-card-count-num">{{ tile.count }}</div>
                      <div class="pool-card-count-label">Open</div>
                    </div>
                  </div>

                  <div class="pool-card-head">
                    <h3 class="pool-card-title">{{ tile.title }}</h3>
                    <p class="pool-card-desc">{{ tile.desc }}</p>
                  </div>

                  <div class="pool-card-subs">
                    @for (sub of tile.subs; track sub.label) {
                      <span class="pool-sub-pill">
                        <span class="pool-sub-dot" [style.background]="sub.color"></span>
                        {{ sub.label }}
                      </span>
                    }
                  </div>

                  <div class="pool-card-foot">
                    <div class="pool-card-stats">
                      <div>
                        <div class="pool-stat-label">Avg pay</div>
                        <div class="pool-stat-val">€{{ tile.avgPay }}</div>
                      </div>
                      <div>
                        <div class="pool-stat-label">Urgent</div>
                        <div
                          class="pool-stat-val"
                          [class.pool-stat-urgent]="tile.urgent > 0"
                        >{{ tile.urgent }}</div>
                      </div>
                    </div>
                    <span class="pool-browse">
                      Browse
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                    </span>
                  </div>
                </button>
              }
            </div>

            <div class="pool-foot">
              <button class="pool-foot-btn pool-foot-btn--lime" (click)="pool.set('all')" type="button">
                Browse all jobs
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </button>
            </div>

          </div>
        </div>
      }

      <!-- Saved jobs view -->
      @if (tab() === 'saved') {
        <div class="saved-page">
          <div class="saved-inner">

            <!-- Hero -->
            <div class="saved-hero">
              <div class="saved-hero-text">
                <p class="saved-eyebrow">Saved jobs</p>
                <h1 class="saved-title">
                  Your shortlist<span class="saved-title-accent">.</span>
                </h1>
                <p class="saved-sub">
                  Jobs you've bookmarked. They stay here until you apply, the
                  client closes them, or you remove them.
                </p>
              </div>

              <div class="saved-stats">
                <div class="saved-stat">
                  <div class="saved-stat-val">{{ savedJobs().length }}</div>
                  <div class="saved-stat-label">Saved</div>
                </div>
                <div class="saved-stat">
                  <div
                    class="saved-stat-val"
                    [class.saved-stat-val--danger]="savedUrgentCount() > 0"
                  >{{ savedUrgentCount() }}</div>
                  <div class="saved-stat-label">Urgent</div>
                </div>
                <div class="saved-stat">
                  <div class="saved-stat-val">€{{ savedAvgPay() }}</div>
                  <div class="saved-stat-label">Avg pay</div>
                </div>
              </div>
            </div>

            <!-- Toolbar -->
            @if (savedJobs().length > 0) {
              <div class="saved-toolbar">
                <div class="saved-chips">
                  @for (chip of savedCatChips(); track chip.id) {
                    <button
                      class="saved-chip"
                      [class.saved-chip--active]="savedCat() === chip.id"
                      (click)="savedCat.set(chip.id)"
                      type="button"
                    >
                      @if (chip.id !== 'all') {
                        <span class="saved-chip-dot" [style.background]="chip.color"></span>
                      }
                      {{ chip.label }}
                      <span class="saved-chip-count">{{ chip.count }}</span>
                    </button>
                  }
                </div>
                <div class="saved-sort">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h12M4 12h8M4 17h4M17 4v16m0 0 4-4m-4 4-4-4"/></svg>
                  <span class="saved-sort-label">Sort</span>
                  <select [value]="savedSort()" (change)="savedSort.set($any($event.target).value)">
                    <option value="recent">Recently saved</option>
                    <option value="pay-high">Pay (highest)</option>
                    <option value="urgent">Urgent first</option>
                  </select>
                </div>
              </div>
            }

            <!-- List or empty -->
            @if (savedJobs().length === 0) {
              <div class="saved-empty">
                <div class="saved-empty-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12v17l-6-4-6 4z"/></svg>
                </div>
                <p class="saved-empty-title">No saved jobs yet</p>
                <p class="saved-empty-sub">
                  Tap the bookmark on any job to keep it here.
                  You'll get a nudge if it's about to fill up.
                </p>
                <button class="saved-empty-cta" (click)="closeSaved()" type="button">
                  Browse jobs
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </button>
              </div>
            } @else if (filteredSavedJobs().length === 0) {
              <div class="saved-empty saved-empty--filter">
                <p class="saved-empty-sub">No saved jobs in this category. Try "All saved".</p>
              </div>
            } @else {
              <div class="saved-list">
                @for (saved of filteredSavedJobs(); track saved.id) {
                  <article
                    class="saved-card"
                    (click)="goToDetail(saved.job.id)"
                  >
                    <div
                      class="saved-avatar"
                      [style.background]="avatarColor(saved.job.client?.clientProfile?.firstName)"
                    >{{ savedInitials(saved) }}</div>

                    <div class="saved-main">
                      <div class="saved-pills">
                        <span class="saved-pill">
                          <span class="saved-pill-dot" [style.background]="catColor(saved.job.category?.name)"></span>
                          {{ saved.job.category?.name || 'General' }}
                        </span>
                        @if (isUrgent(saved.job.urgency)) {
                          <span class="saved-pill saved-pill--urgent">
                            <span class="saved-pill-dot" style="background:#EF4444"></span>
                            Urgent
                          </span>
                        }
                      </div>
                      <p class="saved-job-title">{{ saved.job.title }}</p>
                      <div class="saved-meta">
                        <span>{{ saved.job.city || auth.city() || '—' }}</span>
                        <span class="saved-meta-sep">·</span>
                        <span>Saved {{ savedRelTime(saved.createdAt || saved.job.createdAt) }}</span>
                        <span class="saved-meta-sep">·</span>
                        <span>Posted {{ saved.job.createdAt | date:'d MMM' }}</span>
                      </div>
                    </div>

                    <div class="saved-pay">
                      @if (saved.job.priceMin) {
                        <div class="saved-pay-range">€{{ saved.job.priceMin }}–{{ saved.job.priceMax }}</div>
                        <div class="saved-pay-sub">est · €{{ savedMidPay(saved) }} avg</div>
                      } @else {
                        <div class="saved-pay-range">Negotiable</div>
                      }
                    </div>

                    <div class="saved-actions">
                      <button
                        class="saved-icon-btn"
                        (click)="$event.stopPropagation(); toggleSave(saved.job.id)"
                        title="Remove from saved"
                        type="button"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12v17l-6-4-6 4z"/></svg>
                      </button>
                      <button
                        class="saved-apply-btn"
                        (click)="$event.stopPropagation(); goToDetail(saved.job.id)"
                        type="button"
                      >
                        Apply
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                      </button>
                    </div>
                  </article>
                }
              </div>

              <!-- Pro tip -->
              <div class="saved-tip">
                <span class="saved-tip-icon">💡</span>
                <span class="saved-tip-text">
                  <strong>Pro tip:</strong> Saved jobs get filled fast@if (auth.city()) { in {{ auth.city() }}} —
                  apply within an hour of posting for a 2.4× higher booking rate.
                </span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Header (when pool selected) -->
      @if (pool() !== null) {
      <div class="bj-hero">
        <div class="bj-hero-inner">
          <div class="bj-hero-left">
            <div class="bj-hero-eyebrow-row">
              <button class="bj-back" (click)="pool.set(null)" type="button">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <span class="bj-eyebrow">
                Worker · {{ pool() === 'trades' ? 'Trades & skills' : pool() === 'tasks' ? 'Everyday tasks' : 'All jobs' }}
              </span>
            </div>
            @if (!loading()) {
              <h1 class="bj-title">
                {{ filteredJobs().length }} job{{ filteredJobs().length === 1 ? '' : 's' }} near you,<br>
                <span class="bj-title-accent">ready to claim.</span>
              </h1>
            } @else {
              <h1 class="bj-title">Finding jobs near you…</h1>
            }
          </div>

          @if (!loading() && filteredJobs().length > 0) {
            <div class="bj-stats">
              <div class="bj-stat">
                <div class="bj-stat-label">Avg pay</div>
                <div class="bj-stat-val bj-stat-val--mono">€{{ filteredAvgPay() }}</div>
                <div class="bj-stat-sub">median range</div>
              </div>
              <div class="bj-stat">
                <div class="bj-stat-label">Urgent</div>
                <div class="bj-stat-val">{{ filteredUrgentCount() }}</div>
                <div class="bj-stat-sub">need cover today</div>
              </div>
              <div class="bj-stat bj-stat--last">
                <div class="bj-stat-label">Saved</div>
                <div class="bj-stat-val">{{ savedJobIds().size }}</div>
                <div class="bj-stat-sub">{{ appliedCount() }} applied</div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Filter rail -->
      @if (!loading()) {
        <div class="bj-rail">
          <div class="bj-rail-inner">
            <div class="bj-chips">
              <button
                class="bj-chip"
                [class.bj-chip--active]="filterCategory() === null"
                (click)="filterCategory.set(null)"
                type="button"
              >All</button>
              @for (cat of availableCategories(); track cat) {
                <button
                  class="bj-chip"
                  [class.bj-chip--active]="filterCategory() === cat"
                  (click)="filterCategory.set(cat)"
                  type="button"
                >{{ cat }}</button>
              }
            </div>
            <div class="bj-sort">
              <span class="bj-sort-label">Sort by</span>
              @for (s of [['newest','Newest'],['pay','Pay'],['near','Distance']]; track s[0]) {
                <button
                  class="bj-sort-btn"
                  [class.bj-sort-btn--active]="browseSort() === s[0]"
                  (click)="browseSort.set($any(s[0]))"
                  type="button"
                >{{ s[1] }}</button>
              }
              <a class="bj-map-link" routerLink="/worker/map">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
                Map view
              </a>
            </div>
          </div>
        </div>
      }


      <!-- Body (list) -->
      <div class="page-body">
        <div class="inner">

          @if (loading()) {
            <div class="loading">
              <div class="load-ring"></div>
              <p>Finding jobs near you…</p>
            </div>

          } @else if (jobs().length === 0) {
            <div class="empty-state">
              <div class="empty-icon">
                <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </div>
              <p class="empty-title">No open jobs right now</p>
              <p class="empty-sub">Check back soon — new jobs are posted every day.</p>
            </div>

          @if (!idVerified()) {
            <div class="verify-banner">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span>You must <a routerLink="/worker/profile" class="banner-link">verify your identity</a> before applying to jobs.</span>
            </div>
          }

          } @else {
            @if (filteredJobs().length === 0) {
              <div class="empty-state">
                <div class="empty-icon">
                  <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </div>
                <p class="empty-title">No jobs match your filters</p>
                <p class="empty-sub">Try adjusting or <button class="inline-clear" (click)="clearFilters()">clearing filters</button>.</p>
              </div>
            } @else {
            <div class="bj-grid">
              @for (job of filteredJobs(); track job.id) {
                <article
                  class="bj-card"
                  [class.bj-card--applied]="job.alreadyApplied"
                  (click)="goToDetail(job.id)"
                >
                  <div class="bj-card-top">
                    <span class="bj-card-cat">
                      <span class="bj-card-cat-dot" [style.background]="catColor(job.category?.name)"></span>
                      {{ job.category?.name || 'General' }}
                    </span>
                    @if (job.urgency === 'HIGH' || job.urgency === 'EMERGENCY') {
                      <span class="bj-card-urgent">● Urgent</span>
                    }
                  </div>

                  <h3 class="bj-card-title">{{ job.title }}</h3>
                  <p class="bj-card-desc">{{ job.description }}</p>

                  <div class="bj-card-pay">
                    <div class="bj-card-pay-left">
                      <div class="bj-card-pay-cur">EUR</div>
                      @if (job.priceMin) {
                        <div class="bj-card-pay-val">€{{ job.priceMin }}–{{ job.priceMax }}</div>
                      } @else {
                        <div class="bj-card-pay-val bj-card-pay-val--neg">Negotiable</div>
                      }
                      <div class="bj-card-pay-meta">
                        @if (job.distanceKm !== null) {
                          {{ job.distanceKm < 1 ? (job.distanceKm * 1000 | number:'1.0-0') + ' m' : (job.distanceKm | number:'1.1-1') + ' km' }}
                          ·
                        }
                        {{ job.createdAt | date:'d MMM' }}
                      </div>
                    </div>

                    <div class="bj-card-actions">
                      <button
                        class="bj-icon-btn"
                        [class.bj-icon-btn--saved]="savedJobIds().has(job.id)"
                        (click)="$event.stopPropagation(); toggleSave(job.id)"
                        [title]="savedJobIds().has(job.id) ? 'Remove from saved' : 'Save job'"
                        type="button"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24"
                          [attr.fill]="savedJobIds().has(job.id) ? 'currentColor' : 'none'"
                          stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M6 4h12v17l-6-4-6 4z"/>
                        </svg>
                      </button>
                      @if (job.alreadyApplied) {
                        <span class="bj-applied">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17 19 7"/></svg>
                          Applied
                        </span>
                      } @else if (!idVerified()) {
                        <button class="bj-apply-btn bj-apply-btn--locked" disabled type="button">
                          <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                          Verify
                        </button>
                      } @else {
                        <button
                          class="bj-apply-btn"
                          (click)="$event.stopPropagation(); openApply(job)"
                          type="button"
                        >
                          Apply
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                        </button>
                      }
                    </div>
                  </div>
                </article>
              }
            </div>
            }<!-- /filteredJobs else -->

            @if (jobs().length < total()) {
              <div class="load-more-row">
                <button class="load-more-btn" (click)="loadMore()" [disabled]="loadingMore()">
                  @if (loadingMore()) { <span class="load-ring-sm"></span> Loading… }
                  @else { Load more jobs }
                </button>
                <span class="load-more-count">{{ jobs().length }} of {{ total() }}</span>
              </div>
            }
          }

        </div>
      </div>

      }<!-- /pool selected -->

      <!-- Apply modal -->
      @if (applyingTo()) {
        <div class="overlay" (click)="closeApply()">
          <div class="modal" (click)="$event.stopPropagation()">

            <!-- Modal header -->
            <div class="modal-head">
              <div class="modal-cat-dot" [style.background]="catColor(applyingTo()!.category?.name)"></div>
              <div class="modal-head-text">
                <h3 class="modal-title">{{ applyingTo()!.title }}</h3>
                <p class="modal-sub">
                  {{ applyingTo()!.category?.name || 'General' }}
                  @if (applyingTo()!.city) { · {{ applyingTo()!.city }} }
                  @if (applyingTo()!.priceMin) { · Budget €{{ applyingTo()!.priceMin }}–{{ applyingTo()!.priceMax }} }
                </p>
              </div>
              <button class="modal-close" (click)="closeApply()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <!-- Modal body -->
            <div class="modal-body">
              <div class="field">
                <label>Your price offer (€) <span class="opt">optional</span></label>
                <input type="number" class="field-input" [(ngModel)]="proposedPrice" placeholder="Leave empty to accept posted price" />
              </div>
              <div class="field">
                <label>Message to client <span class="opt">optional</span></label>
                <textarea class="field-input" [(ngModel)]="message" rows="3" placeholder="Briefly describe your experience and availability…"></textarea>
              </div>
            </div>

            @if (applyError()) {
              <div class="modal-err">{{ applyError() }}</div>
            }

            <div class="modal-actions">
              <button class="btn-cancel" (click)="closeApply()">Cancel</button>
              <button class="btn-submit" (click)="submitApply()" [disabled]="applying()">
                @if (applying()) { <span class="spinner"></span> Sending… }
                @else { Send application }
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .page { min-height: 100vh; background: #f8f8f8; }
    .inner { max-width: 1100px; margin: 0 auto; padding: 0 1.25rem; }

    /* ── Header ───────────────────────────── */
    .page-header {
      background: #fff;
      padding: 1.1rem 0 0;
      border-bottom: 1px solid #f0f0f0;
    }

    /* top line */
    .ph-topline {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 0.875rem;
    }
    .ph-topline-left { display: flex; align-items: center; gap: 1rem; }
    .ph-back {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border: none; background: none;
      color: #9ca3af; cursor: pointer; padding: 0; flex-shrink: 0;
      transition: color 0.15s;
    }
    .ph-back:hover { color: #111827; }
    .ph-section {
      font-size: 0.78rem; font-weight: 500; color: #9ca3af;
      letter-spacing: 0.01em;
    }
    .ph-map-link {
      display: inline-flex; align-items: center; gap: 0.35rem;
      font-size: 0.95rem; font-weight: 600; color: #374151;
      text-decoration: none; transition: color 0.15s;
    }
    .ph-map-link:hover { color: #111827; }

    /* title block */
    .ph-title-block { margin-bottom: 1rem; }
    .ph-title {
      font-size: 1.65rem; font-weight: 700; color: #111827;
      letter-spacing: -0.035em; margin: 0 0 0.3rem; line-height: 1.1;
    }
    .ph-sub {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.82rem; color: #9ca3af; margin: 0;
    }
    .ph-live-dot {
      width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
      background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.18);
    }

    /* filter tab row — no overflow hidden so dropdowns show */
    .ph-filters {
      display: flex; align-items: stretch; gap: 0;
    }

    /* ── Body ─────────────────────────────── */
    .page-body { padding: 2rem 0; }

    /* ── Loading ──────────────────────────── */
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 6rem 2rem;
      color: #a1a1aa;
      font-size: 0.875rem;
    }
    .load-ring {
      width: 30px; height: 30px;
      border: 2.5px solid #e4e4e7;
      border-top-color: #18181b;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
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
    .empty-sub { font-size: 0.84rem; color: #71717a; margin: 0; }

    /* ── Job list ─────────────────────────── */
    .jobs-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .job-card {
      background: #fff;
      border-radius: 20px;
      padding: 1.125rem 1.125rem 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 6px 24px rgba(0,0,0,0.05);
      cursor: pointer;
      transition: box-shadow 0.2s, transform 0.15s;
    }
    .job-card:hover:not(.job-applied) {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.08);
      transform: translateY(-2px);
    }
    .job-card.job-applied { opacity: 0.55; }

    /* ── Header row ───────────────────────── */
    .jc-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 0.625rem;
    }
    .jc-header-left { display: flex; align-items: center; gap: 0.4rem; }
    .jc-cat {
      display: inline-flex; align-items: center; gap: 0.3rem;
      font-size: 0.65rem; font-weight: 700; color: #6b7280;
      letter-spacing: 0.07em;
    }
    .jc-cat-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--dot, #a1a1aa); flex-shrink: 0;
    }
    .jc-sep { font-size: 0.7rem; color: #d1d5db; }
    .jc-date { font-size: 0.7rem; color: #9ca3af; }

    .urgency-pill {
      font-size: 0.65rem; font-weight: 700;
      padding: 0.2rem 0.55rem; border-radius: 99px;
    }
    .urgency-normal    { background: #f3f4f6; color: #6b7280; }
    .urgency-low       { background: #f3f4f6; color: #9ca3af; }
    .urgency-high      { background: rgba(245,158,11,0.1); color: #b45309; }
    .urgency-emergency { background: rgba(239,68,68,0.09); color: #dc2626; }

    /* ── Body box ─────────────────────────── */
    .jc-body {
      background: #f7f8fa;
      border-radius: 13px;
      padding: 0.875rem 1rem;
      margin-bottom: 0.625rem;
    }
    .jc-title {
      font-size: 0.975rem; font-weight: 700; color: #111827;
      margin: 0 0 0.3rem; letter-spacing: -0.015em; line-height: 1.3;
    }
    .jc-desc {
      font-size: 0.82rem; color: #6b7280; line-height: 1.6; margin: 0;
      display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden;
    }

    /* ── Client row ───────────────────────── */
    .jc-client {
      display: flex; align-items: center; gap: 0.625rem;
      background: #f7f8fa; border-radius: 13px;
      padding: 0.625rem 0.875rem; margin-bottom: 0.75rem;
    }
    .jc-avatar {
      width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
      color: #fff; font-size: 0.7rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .jc-client-info { flex: 1; min-width: 0; }
    .jc-client-name {
      display: block; font-size: 0.8rem; font-weight: 600;
      color: #111827; margin-bottom: 0.15rem; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis;
    }
    .jc-client-meta {
      display: flex; align-items: center; gap: 0.4rem;
      font-size: 0.7rem; color: #9ca3af; flex-wrap: wrap;
    }
    .jc-client-meta span + span::before { content: '·'; margin-right: 0.4rem; }
    .jc-verified {
      display: inline-flex; align-items: center; gap: 0.2rem;
      color: #0d9488; font-weight: 600;
    }
    .jc-open-pill {
      flex-shrink: 0; font-size: 0.68rem; font-weight: 700;
      padding: 0.22rem 0.65rem; border-radius: 99px;
      background: #ecfdf5; color: #059669;
    }

    /* ── Footer ───────────────────────────── */
    .jc-footer {
      display: flex; align-items: center;
      justify-content: space-between; gap: 0.75rem;
    }
    .jc-price { display: flex; align-items: baseline; gap: 0.4rem; }
    .price-val { font-size: 1rem; font-weight: 800; color: #111827; letter-spacing: -0.02em; }
    .price-neg { font-size: 0.875rem; color: #9ca3af; font-weight: 500; }
    .jc-actions { display: flex; align-items: center; gap: 0.4rem; }

    .jc-map-btn {
      display: inline-flex; align-items: center; gap: 0.3rem;
      background: #f3f4f6; color: #6b7280;
      border: none; padding: 0.45rem 0.8rem; border-radius: 99px;
      font-size: 0.75rem; font-weight: 600; cursor: pointer;
      font-family: inherit; transition: background 0.12s, color 0.12s;
    }
    .jc-map-btn:hover { background: #e5e7eb; color: #374151; }

    .save-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.3rem;
      background: #f3f4f6; color: #9ca3af; border: none;
      width: 30px; height: 30px; border-radius: 50%;
      cursor: pointer; font-family: inherit; transition: background 0.12s, color 0.12s;
    }
    .save-btn:hover { background: #e5e7eb; color: #4f46e5; }
    .save-btn--saved { background: #ede9fe; color: #4f46e5; }
    .save-btn--saved:hover { background: #ddd6fe; }

    .saved-tab-btn {
      display: inline-flex; align-items: center; gap: 0.5rem;
      background: transparent; border: 1px solid #e5e7eb; color: #6b7280;
      padding: 0.55rem 1.1rem; border-radius: 99px;
      font-size: 0.82rem; font-weight: 500; cursor: pointer;
      font-family: inherit; transition: border-color 0.12s, color 0.12s;
      margin-top: 1rem;
    }
    .saved-tab-btn:hover { border-color: #4f46e5; color: #4f46e5; }
    .saved-tab-count {
      background: #4f46e5; color: #fff;
      font-size: 0.68rem; font-weight: 700;
      padding: 0.1rem 0.45rem; border-radius: 99px;
    }

    .apply-btn {
      display: inline-flex; align-items: center;
      background: #4f46e5; color: #fff; border: none;
      padding: 0.5rem 1.1rem; border-radius: 99px;
      font-size: 0.78rem; font-weight: 600; cursor: pointer;
      transition: background 0.15s, box-shadow 0.15s; white-space: nowrap; font-family: inherit;
    }
    .apply-btn:hover { background: #4338ca; box-shadow: 0 2px 10px rgba(79,70,229,0.3); }
    .apply-btn--locked {
      background: #f3f4f6 !important; color: #9ca3af !important;
      cursor: not-allowed !important;
    }

    .verify-banner {
      display: flex; align-items: center; gap: 0.625rem;
      background: #fef3c7; border: 1px solid #fde68a;
      color: #92400e; font-size: 0.84rem; font-weight: 500;
      padding: 0.75rem 1rem; border-radius: 10px; margin-bottom: 1rem;
    }
    .banner-link { color: #92400e; font-weight: 700; text-decoration: underline; }
    .banner-link:hover { color: #78350f; }

    .status-pill {
      font-size: 0.68rem;
      font-weight: 600;
      padding: 0.2rem 0.65rem;
      border-radius: 99px;
    }
    .status-applied  { background: rgba(37,99,235,0.08);  color: #1d4ed8; }
    .status-accepted { background: rgba(20,184,166,0.1);  color: #0f766e; }
    .status-rejected { background: rgba(239,68,68,0.08);  color: #dc2626; }

    /* ── Modal overlay ────────────────────── */
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
    }
    .modal {
      background: #fff;
      border-radius: 20px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.18);
      overflow: hidden;
    }

    .modal-head {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      padding: 1.375rem 1.375rem 1.125rem;
      border-bottom: 1px solid #f4f4f5;
    }
    .modal-cat-dot {
      width: 12px; height: 12px;
      border-radius: 50%;
      margin-top: 0.35rem;
      flex-shrink: 0;
    }
    .modal-head-text { flex: 1; }
    .modal-title { font-size: 0.975rem; font-weight: 700; color: #18181b; margin: 0 0 0.25rem; letter-spacing: -0.01em; }
    .modal-sub { font-size: 0.78rem; color: #a1a1aa; margin: 0; }

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

    .modal-body { padding: 1.125rem 1.375rem; }

    .field { margin-bottom: 0.875rem; }
    label { display: block; font-size: 0.78rem; font-weight: 600; color: #18181b; margin-bottom: 0.3rem; }
    .opt { font-weight: 400; color: #a1a1aa; font-size: 0.74rem; }

    .field-input {
      width: 100%;
      padding: 0.65rem 0.875rem;
      border: 1.5px solid #e4e4e7;
      border-radius: 10px;
      font-size: 0.875rem;
      outline: none;
      font-family: inherit;
      color: #18181b;
      background: #fff;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .field-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
    .field-input::placeholder { color: #a1a1aa; }
    textarea.field-input { resize: vertical; }

    .modal-err {
      margin: 0 1.375rem 0.75rem;
      background: rgba(239,68,68,0.07);
      color: #dc2626;
      border: 1px solid rgba(239,68,68,0.15);
      padding: 0.6rem 0.875rem;
      border-radius: 9px;
      font-size: 0.82rem;
    }

    .modal-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      padding: 0.875rem 1.375rem 1.375rem;
      border-top: 1px solid #f4f4f5;
    }
    .btn-cancel {
      background: transparent;
      color: #71717a;
      border: 1.5px solid #e4e4e7;
      padding: 0.6rem 1.125rem;
      border-radius: 99px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
      font-family: inherit;
    }
    .btn-cancel:hover { background: rgba(0,0,0,0.03); }
    .btn-submit {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #4f46e5;
      color: #fff;
      border: none;
      padding: 0.6rem 1.375rem;
      border-radius: 99px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, box-shadow 0.15s;
      font-family: inherit;
    }
    .btn-submit:hover:not(:disabled) { background: #4338ca; box-shadow: 0 2px 10px rgba(79,70,229,0.3); }
    .btn-submit:disabled { opacity: 0.45; cursor: not-allowed; }
    .spinner {
      width: 12px; height: 12px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }

    /* ── Pool picker fullscreen ───────────── */
    .pool-pick {
      min-height: calc(100vh - 60px);
      display: flex; align-items: center; justify-content: center;
      background: #FAFAFA;
      padding: 24px 32px;
      font-family: 'Geist', 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      color: #0A0A0A;
    }
    .pool-pick-inner { max-width: 920px; width: 100%; }

    .pool-eyebrow {
      display: flex; align-items: center; gap: 10px;
      justify-content: center; margin-bottom: 18px;
    }
    .pool-eyebrow-line { width: 24px; height: 1px; background: #E8E8E5; }
    .pool-eyebrow-text {
      font-size: 11px; color: #737373; letter-spacing: 0.22em;
      text-transform: uppercase; font-weight: 500;
    }

    .pool-pick-title {
      font-size: clamp(2.25rem, 5vw, 56px); font-weight: 500;
      letter-spacing: -0.035em; line-height: 1.05; margin: 0;
      color: #0A0A0A; text-align: center;
    }
    .pool-title-q { color: #4D7C0F; }

    .pool-pick-sub {
      font-size: 15px; color: #737373; margin: 14px 0 0;
      text-align: center; line-height: 1.5;
    }
    .pool-sub-strong { color: #0A0A0A; font-weight: 500; }

    .pool-pick-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
      margin-top: 44px;
    }

    .pool-card {
      background: #FFFFFF; border: 1px solid #E8E8E5; border-radius: 18px;
      padding: 32px 32px 28px;
      cursor: pointer; display: flex; flex-direction: column;
      gap: 24px; position: relative; overflow: hidden;
      transition: all 0.18s; text-align: left;
      font-family: inherit; color: inherit;
    }
    .pool-card--hover,
    .pool-card:hover {
      border-color: #0A0A0A;
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.06);
    }

    .pool-card-top {
      display: flex; justify-content: space-between; align-items: flex-start;
    }
    .pool-card-icon {
      width: 56px; height: 56px; border-radius: 14px;
      display: inline-flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .pool-card-icon--blue { background: #EBF2FE; color: #1D4ED8; }
    .pool-card-icon--lime { background: #F0FAE0; color: #4D7C0F; }
    .pool-card-count-block { text-align: right; }
    .pool-card-count-num {
      font-size: 32px; font-weight: 500; line-height: 1;
      letter-spacing: -0.025em; color: #0A0A0A;
      font-variant-numeric: tabular-nums;
    }
    .pool-card-count-label {
      font-size: 11px; color: #737373; margin-top: 4px;
      letter-spacing: 0.06em; text-transform: uppercase;
    }

    .pool-card-head { margin: 0; }
    .pool-card-title {
      font-size: 28px; font-weight: 500; letter-spacing: -0.022em;
      line-height: 1.1; margin: 0; color: #0A0A0A;
    }
    .pool-card-desc {
      font-size: 14px; color: #737373; margin: 8px 0 0; line-height: 1.5;
    }

    .pool-card-subs {
      display: flex; gap: 6px; flex-wrap: wrap;
    }
    .pool-sub-pill {
      padding: 5px 10px; border-radius: 999px; border: 1px solid #E8E8E5;
      font-size: 11.5px; color: #737373;
      display: inline-flex; align-items: center; gap: 5px;
    }
    .pool-sub-dot {
      width: 5px; height: 5px; border-radius: 3px; flex-shrink: 0;
    }

    .pool-card-foot {
      margin-top: auto; padding-top: 20px;
      border-top: 1px solid #E8E8E5;
      display: flex; justify-content: space-between; align-items: center;
    }
    .pool-card-stats {
      display: flex; gap: 18px;
    }
    .pool-stat-label {
      font-size: 10.5px; color: #A3A3A3; letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .pool-stat-val {
      font-size: 14px; font-weight: 500; color: #0A0A0A;
      margin-top: 2px; font-variant-numeric: tabular-nums;
    }
    .pool-stat-urgent { color: #DC2626; }

    .pool-browse {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 14px; border-radius: 999px;
      background: transparent; color: #0A0A0A;
      border: 1px solid #E8E8E5;
      font-size: 12.5px; font-weight: 500;
      transition: all 0.15s;
    }
    .pool-card--hover .pool-browse,
    .pool-card:hover .pool-browse {
      background: #0A0A0A; color: #fff; border-color: #0A0A0A;
    }

    .pool-foot {
      display: flex; justify-content: center; margin-top: 28px; gap: 8px;
      flex-wrap: wrap;
    }
    .pool-foot-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 18px; border-radius: 999px;
      background: #FFFFFF; border: 1px solid #E8E8E5;
      font-size: 13px; color: #0A0A0A; font-weight: 500;
      font-family: inherit; cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .pool-foot-btn:hover { border-color: #A3A3A3; }
    .pool-foot-count {
      font-size: 11px; color: #737373; margin-left: 4px;
    }
    .pool-foot-btn--lime {
      background: #84CC16; border-color: #84CC16; color: #0A0A0A; font-weight: 600;
    }
    .pool-foot-btn--lime:hover { background: #a3e635; border-color: #a3e635; }
    .pool-foot-btn--lime .pool-foot-count { color: #0A0A0A; }

    @media (max-width: 720px) {
      .pool-pick-grid { grid-template-columns: 1fr; }
      .pool-card { padding: 24px 22px 22px; }
      .pool-card-title { font-size: 22px; }
    }

    /* ── Filter tabs ───────────────────────── */
    .fd { position: relative; flex-shrink: 0; }

    .fd-tab {
      display: inline-flex; align-items: center; gap: 0.3rem;
      background: none; border: none;
      border-bottom: 2px solid transparent;
      padding: 0.7rem 1.1rem;
      font-size: 0.82rem; font-weight: 500; color: #9ca3af;
      cursor: pointer; font-family: inherit; white-space: nowrap;
      transition: color 0.15s, border-color 0.15s;
    }
    .fd-tab:hover { color: #374151; }
    .fd--set .fd-tab { color: #111827; font-weight: 600; border-bottom-color: #111827; }

    .fd-caret { transition: transform 0.18s; flex-shrink: 0; }
    .fd-caret--open { transform: rotate(180deg); }

    .fd-chevron { transition: transform 0.18s; flex-shrink: 0; opacity: 0.5; }
    .fd--set .fd-chevron { opacity: 1; }
    .fd-chevron--open { transform: rotate(180deg); }

    .fd-menu {
      position: absolute;
      top: calc(100% + 5px);
      left: 0;
      background: #fff;
      border: 1px solid #e4e4e7;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.05);
      min-width: 160px;
      z-index: 300;
      overflow: hidden;
      animation: menuPop 130ms cubic-bezier(0.25,0.46,0.45,0.94) both;
    }
    @keyframes menuPop {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .fd-opt {
      display: flex;
      align-items: center;
      width: 100%;
      background: none;
      border: none;
      padding: 0.55rem 0.875rem;
      font-size: 0.8rem;
      font-weight: 400;
      color: #3f3f46;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      transition: background 0.1s;
    }
    .fd-opt:hover { background: #f4f4f5; color: #18181b; }
    .fd-opt--on { font-weight: 600; color: #18181b; }
    .fd-opt--high     { color: #b45309; }
    .fd-opt--emergency { color: #dc2626; }

    .fd-backdrop { position: fixed; inset: 0; z-index: 299; }

    .fd-reset {
      margin-left: 0.5rem; background: none; border: none;
      border-bottom: 2px solid transparent;
      padding: 0.7rem 0.75rem;
      font-size: 0.78rem; font-weight: 500; color: #d1d5db;
      cursor: pointer; font-family: inherit; white-space: nowrap;
      transition: color 0.15s;
    }
    .fd-reset:hover { color: #ef4444; }

    .inline-clear {
      background: none;
      border: none;
      color: #2563eb;
      font-size: inherit;
      font-family: inherit;
      cursor: pointer;
      padding: 0;
      text-decoration: underline;
    }

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
    .map-btn {
      display: inline-flex; align-items: center; gap: 0.25rem;
      background: #f4f4f5; color: #52525b;
      border: 1.5px solid #e4e4e7; border-radius: 99px;
      padding: 0.3rem 0.65rem; font-size: 0.7rem; font-weight: 600;
      cursor: pointer; font-family: inherit;
      transition: border-color 0.15s, color 0.15s;
      text-decoration: none;
    }
    .map-btn:hover { border-color: #d4ff3a; color: #d4ff3a; }

    .load-ring-sm {
      width: 12px; height: 12px;
      border: 2px solid #d4d4d8;
      border-top-color: #18181b;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }


    @media (max-width: 640px) {
      .inner { padding: 0 1rem; }
      .header-top { flex-direction: column; align-items: flex-start; }
      .map-canvas { height: 340px; }
    }

    /* ── Browse-jobs redesigned (pool selected) ─────────── */
    .bj-hero {
      background: #FAFAFA;
      padding: 32px 32px 22px;
      font-family: 'Geist', 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      color: #0A0A0A;
    }
    .bj-hero-inner {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 32px;
      flex-wrap: wrap;
    }
    .bj-hero-eyebrow-row {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .bj-back {
      width: 28px; height: 28px;
      border-radius: 999px;
      border: 1px solid #E8E8E5;
      background: #FFFFFF;
      color: #737373;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.15s, color 0.15s;
    }
    .bj-back:hover { border-color: #A3A3A3; color: #0A0A0A; }
    .bj-eyebrow {
      font-size: 11.5px;
      color: #737373;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 500;
    }
    .bj-title {
      font-size: clamp(2rem, 4.5vw, 48px);
      font-weight: 500;
      letter-spacing: -0.03em;
      line-height: 1;
      margin: 0;
      color: #0A0A0A;
    }
    .bj-title-accent { color: #4D7C0F; }

    .bj-stats {
      display: flex;
      align-items: center;
      border: 1px solid #E8E8E5;
      border-radius: 12px;
      background: #FFFFFF;
      overflow: hidden;
    }
    .bj-stat {
      padding: 14px 18px;
      border-right: 1px solid #E8E8E5;
      min-width: 120px;
    }
    .bj-stat--last { border-right: none; }
    .bj-stat-label {
      font-size: 10.5px;
      color: #737373;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .bj-stat-val {
      font-size: 22px;
      font-weight: 500;
      color: #0A0A0A;
      margin-top: 4px;
      letter-spacing: -0.015em;
      font-variant-numeric: tabular-nums;
    }
    .bj-stat-val--mono {
      font-family: 'Geist Mono', 'JetBrains Mono', ui-monospace, monospace;
    }
    .bj-stat-sub {
      font-size: 11px;
      color: #737373;
      margin-top: 2px;
    }

    .bj-rail {
      background: #FFFFFF;
      border-top: 1px solid #E8E8E5;
      border-bottom: 1px solid #E8E8E5;
      font-family: 'Geist', 'Inter', -apple-system, system-ui, sans-serif;
    }
    .bj-rail-inner {
      padding: 12px 32px;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .bj-chips {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      flex: 1;
      min-width: 0;
    }
    .bj-chip {
      height: 28px;
      padding: 0 12px;
      border-radius: 8px;
      border: 1px solid #E8E8E5;
      background: transparent;
      color: #0A0A0A;
      font-size: 12px;
      font-family: inherit;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.12s;
    }
    .bj-chip:hover { border-color: #A3A3A3; }
    .bj-chip--active {
      background: #84CC16;
      border-color: #84CC16;
      color: #0A0A0A;
    }

    .bj-sort {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }
    .bj-sort-label {
      font-size: 11.5px;
      color: #737373;
      margin-right: 4px;
    }
    .bj-sort-btn {
      height: 26px;
      padding: 0 10px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: #737373;
      font-size: 12px;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.12s;
    }
    .bj-sort-btn:hover { color: #0A0A0A; }
    .bj-sort-btn--active {
      background: #E8E8E5;
      color: #0A0A0A;
    }
    .bj-map-link {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      height: 28px;
      padding: 0 12px;
      border-radius: 999px;
      border: 1px solid #E8E8E5;
      background: #FFFFFF;
      color: #0A0A0A;
      font-size: 12px;
      font-family: inherit;
      font-weight: 500;
      text-decoration: none;
      margin-left: 6px;
    }
    .bj-map-link:hover { border-color: #A3A3A3; }

    .bj-grid {
      padding: 20px 32px 32px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
      background: #FAFAFA;
    }

    .bj-card {
      background: #FFFFFF;
      border: 1px solid #E8E8E5;
      border-radius: 16px;
      padding: 28px 28px 24px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: border-color 0.15s, box-shadow 0.15s;
      font-family: 'Geist', 'Inter', -apple-system, system-ui, sans-serif;
    }
    .bj-card:hover {
      border-color: #D4D4D1;
      box-shadow: 0 6px 18px rgba(0,0,0,0.04);
    }
    .bj-card--applied { opacity: 0.6; }

    .bj-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }
    .bj-card-cat {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #737373;
      font-weight: 500;
    }
    .bj-card-cat-dot {
      width: 6px;
      height: 6px;
      border-radius: 3px;
    }
    .bj-card-urgent {
      font-size: 10px;
      color: #DC2626;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .bj-card-title {
      font-size: 18px;
      font-weight: 500;
      line-height: 1.3;
      letter-spacing: -0.012em;
      color: #0A0A0A;
      margin: 0;
    }
    .bj-card-desc {
      font-size: 13.5px;
      color: #737373;
      line-height: 1.55;
      margin: 8px 0 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 64px;
    }

    .bj-card-pay {
      margin-top: 22px;
      padding-top: 18px;
      border-top: 1px solid #E8E8E5;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 12px;
    }
    .bj-card-pay-cur {
      font-size: 10px;
      color: #A3A3A3;
      font-family: 'Geist Mono', 'JetBrains Mono', ui-monospace, monospace;
      letter-spacing: 0.1em;
    }
    .bj-card-pay-val {
      font-size: 28px;
      font-weight: 500;
      color: #0A0A0A;
      letter-spacing: -0.022em;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    .bj-card-pay-val--neg {
      font-size: 16px;
      color: #737373;
      font-weight: 500;
      letter-spacing: 0;
    }
    .bj-card-pay-meta {
      font-size: 11px;
      color: #737373;
      margin-top: 6px;
    }

    .bj-card-actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }
    .bj-icon-btn {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      border: 1px solid #E8E8E5;
      background: transparent;
      color: #737373;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.12s;
    }
    .bj-icon-btn:hover { border-color: #A3A3A3; color: #0A0A0A; }
    .bj-icon-btn--saved {
      background: #84CC16;
      border-color: #84CC16;
      color: #0A0A0A;
    }
    .bj-icon-btn--saved:hover { background: #a3e635; border-color: #a3e635; }

    .bj-apply-btn {
      height: 30px;
      padding: 0 12px;
      border-radius: 8px;
      border: none;
      background: #84CC16;
      color: #0A0A0A;
      font-size: 12px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: background 0.12s;
    }
    .bj-apply-btn:hover { background: #a3e635; }
    .bj-apply-btn--locked {
      background: #F5F5F3;
      color: #737373;
      cursor: not-allowed;
    }
    .bj-applied {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 30px;
      padding: 0 12px;
      border-radius: 8px;
      background: #16A34A;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
    }

    @media (max-width: 1080px) {
      .bj-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .bj-hero-inner { flex-direction: column; align-items: flex-start; }
      .bj-stats { width: 100%; overflow-x: auto; }
    }
    @media (max-width: 720px) {
      .bj-hero { padding: 24px 20px 16px; }
      .bj-rail-inner { padding: 12px 20px; }
      .bj-grid { grid-template-columns: 1fr; padding: 16px 20px 24px; }
      .bj-card { padding: 22px 22px 18px; }
    }

    /* ── Saved view (redesigned) ────────────────────────── */
    .saved-page {
      min-height: calc(100vh - 56px);
      background: #FAFAFA;
      font-family: 'Geist', 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      color: #0A0A0A;
    }
    .saved-inner {
      max-width: 1080px;
      margin: 0 auto;
      padding: 40px 40px 28px;
    }

    .saved-hero {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 32px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }
    .saved-eyebrow {
      font-size: 11px;
      color: #737373;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      margin: 0 0 10px;
      font-weight: 500;
    }
    .saved-title {
      font-size: 44px;
      font-weight: 500;
      letter-spacing: -0.035em;
      margin: 0;
      line-height: 1.02;
      color: #0A0A0A;
    }
    .saved-title-accent { color: #4D7C0F; }
    .saved-sub {
      font-size: 14px;
      color: #737373;
      margin: 12px 0 0;
      max-width: 540px;
      line-height: 1.55;
    }

    .saved-stats {
      display: flex;
      background: #FFFFFF;
      border: 1px solid #E8E8E5;
      border-radius: 14px;
      padding: 12px 0;
      flex-shrink: 0;
    }
    .saved-stat {
      padding: 0 22px;
      text-align: center;
      border-right: 1px solid #E8E8E5;
    }
    .saved-stat:last-child { border-right: none; }
    .saved-stat-val {
      font-size: 22px;
      font-weight: 500;
      color: #0A0A0A;
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;
    }
    .saved-stat-val--danger { color: #DC2626; }
    .saved-stat-label {
      font-size: 10px;
      color: #A3A3A3;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-top: 3px;
    }

    .saved-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .saved-chips {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .saved-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 13px;
      border-radius: 999px;
      border: 1px solid #E8E8E5;
      background: #FFFFFF;
      color: #0A0A0A;
      font-size: 12px;
      font-family: inherit;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }
    .saved-chip:hover { border-color: #A3A3A3; }
    .saved-chip--active {
      background: #0A0A0A;
      border-color: #0A0A0A;
      color: #fff;
    }
    .saved-chip-dot {
      width: 6px;
      height: 6px;
      border-radius: 3px;
      flex-shrink: 0;
    }
    .saved-chip-count {
      font-size: 10.5px;
      color: #A3A3A3;
      margin-left: 2px;
      font-family: 'Geist Mono', 'JetBrains Mono', ui-monospace, monospace;
      font-variant-numeric: tabular-nums;
    }
    .saved-chip--active .saved-chip-count { color: rgba(255,255,255,0.6); }

    .saved-sort {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 10px 5px 12px;
      border: 1px solid #E8E8E5;
      border-radius: 999px;
      background: #FFFFFF;
      color: #737373;
    }
    .saved-sort-label {
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-weight: 500;
    }
    .saved-sort select {
      border: none;
      background: transparent;
      font-family: inherit;
      font-size: 12.5px;
      color: #0A0A0A;
      font-weight: 500;
      cursor: pointer;
      outline: none;
      padding-right: 4px;
    }

    .saved-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .saved-card {
      background: #FFFFFF;
      border: 1px solid #E8E8E5;
      border-radius: 14px;
      padding: 18px 20px;
      display: grid;
      grid-template-columns: auto 1fr auto auto;
      align-items: center;
      gap: 18px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .saved-card:hover {
      border-color: #D4D4D1;
      box-shadow: 0 6px 20px rgba(0,0,0,0.05);
    }

    .saved-avatar {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.02em;
      flex-shrink: 0;
    }

    .saved-main { min-width: 0; }
    .saved-pills {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      flex-wrap: wrap;
    }
    .saved-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 8px;
      border-radius: 999px;
      background: #F5F5F3;
      font-size: 10.5px;
      color: #737373;
      font-family: 'Geist Mono', 'JetBrains Mono', ui-monospace, monospace;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      font-weight: 500;
    }
    .saved-pill--urgent {
      background: rgba(220,38,38,0.08);
      color: #DC2626;
    }
    .saved-pill-dot {
      width: 5px;
      height: 5px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .saved-job-title {
      font-size: 15px;
      font-weight: 500;
      color: #0A0A0A;
      letter-spacing: -0.012em;
      line-height: 1.3;
      margin: 0 0 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .saved-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #737373;
      font-family: 'Geist Mono', 'JetBrains Mono', ui-monospace, monospace;
      font-variant-numeric: tabular-nums;
      flex-wrap: wrap;
    }
    .saved-meta-sep { color: #E8E8E5; }

    .saved-pay {
      text-align: right;
      padding-right: 8px;
    }
    .saved-pay-range {
      font-size: 18px;
      font-weight: 500;
      color: #0A0A0A;
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;
    }
    .saved-pay-sub {
      font-size: 10.5px;
      color: #A3A3A3;
      font-family: 'Geist Mono', 'JetBrains Mono', ui-monospace, monospace;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-top: 2px;
    }

    .saved-actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .saved-icon-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: 1px solid #E8E8E5;
      background: #FFFFFF;
      color: #4D7C0F;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.12s;
    }
    .saved-icon-btn:hover { border-color: #A3A3A3; }
    .saved-apply-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0 16px;
      height: 36px;
      border-radius: 10px;
      background: #0A0A0A;
      color: #fff;
      border: none;
      font-size: 12.5px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      letter-spacing: -0.005em;
      transition: background 0.15s;
    }
    .saved-apply-btn:hover { background: #262626; }

    .saved-empty {
      background: #FFFFFF;
      border: 1px dashed #E8E8E5;
      border-radius: 14px;
      padding: 56px 32px;
      text-align: center;
    }
    .saved-empty--filter { padding: 32px; }
    .saved-empty-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: #F5F5F3;
      color: #737373;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .saved-empty-title {
      font-size: 18px;
      font-weight: 500;
      color: #0A0A0A;
      letter-spacing: -0.015em;
      margin: 0 0 6px;
    }
    .saved-empty-sub {
      font-size: 13px;
      color: #737373;
      max-width: 380px;
      margin: 0 auto 18px;
      line-height: 1.5;
    }
    .saved-empty-cta {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 999px;
      background: #84CC16;
      border: none;
      font-size: 13px;
      color: #0A0A0A;
      font-family: inherit;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .saved-empty-cta:hover { background: #a3e635; }

    .saved-tip {
      margin-top: 24px;
      padding: 14px 18px;
      border-radius: 12px;
      background: #F0FAE0;
      border: 1px solid rgba(132,204,22,0.3);
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 12.5px;
      color: #4D7C0F;
    }
    .saved-tip-icon { font-size: 16px; }
    .saved-tip-text { flex: 1; line-height: 1.5; }
    .saved-tip-text strong { font-weight: 600; }

    @media (max-width: 820px) {
      .saved-inner { padding: 24px 20px; }
      .saved-hero { flex-direction: column; align-items: flex-start; }
      .saved-stats { width: 100%; justify-content: space-between; }
      .saved-card {
        grid-template-columns: auto 1fr;
        grid-template-areas:
          "avatar main"
          "pay    pay"
          "actions actions";
        gap: 12px;
      }
      .saved-avatar { grid-area: avatar; }
      .saved-main { grid-area: main; }
      .saved-pay { grid-area: pay; text-align: left; padding-right: 0; }
      .saved-actions { grid-area: actions; }
      .saved-apply-btn { flex: 1; justify-content: center; }
    }
  `]
})
export class WorkerJobsComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected auth = inject(AuthService);

  jobs = signal<NearbyJob[]>([]);
  total = signal(0);
  loading = signal(true);
  loadingMore = signal(false);
  idVerified = signal(false);

  // Filters
  openDropdown = signal<string | null>(null);
  filterDistance = signal<number | null>(null);
  filterCategory = signal<string | null>(null);
  filterUrgency = signal<string | null>(null);
  filterMaxPrice = signal<number | null>(null);

  toggleDropdown(name: string) {
    this.openDropdown.set(this.openDropdown() === name ? null : name);
  }
  closeDropdown() { this.openDropdown.set(null); }

  activeFilterCount = computed(() =>
    [this.filterDistance(), this.filterCategory(), this.filterUrgency(), this.filterMaxPrice()]
      .filter(v => v !== null).length
  );


  pool = signal<'tasks' | 'trades' | 'all' | null>(null);
  hoverPool = signal<'tasks' | 'trades' | null>(null);
  tab = signal<'browse' | 'saved'>('browse');
  savedJobs = signal<any[]>([]);
  savedJobIds = computed(() => new Set(this.savedJobs().map((s: any) => s.jobId)));

  savedCat = signal<string>('all');
  savedSort = signal<'recent' | 'pay-high' | 'urgent'>('recent');
  browseSort = signal<'newest' | 'pay' | 'near'>('newest');

  private jobMidPay(j: NearbyJob): number {
    const lo = j.priceMin ?? 0;
    const hi = j.priceMax ?? lo;
    if (!lo && !hi) return 0;
    return Math.round((lo + hi) / 2);
  }

  filteredAvgPay = computed(() => {
    const list = this.filteredJobs();
    if (!list.length) return 0;
    const sum = list.reduce((s, j) => s + this.jobMidPay(j), 0);
    return Math.round(sum / list.length);
  });

  filteredUrgentCount = computed(() =>
    this.filteredJobs().filter(j => j.urgency === 'HIGH' || j.urgency === 'EMERGENCY').length
  );

  appliedCount = computed(() => this.jobs().filter(j => j.alreadyApplied).length);

  isUrgent(u?: string | null): boolean {
    return u === 'HIGH' || u === 'EMERGENCY' || u === 'urgent';
  }

  savedMidPay(saved: any): number {
    const lo = saved?.job?.priceMin ?? 0;
    const hi = saved?.job?.priceMax ?? lo;
    if (!lo && !hi) return 0;
    return Math.round((lo + hi) / 2);
  }

  savedUrgentCount = computed(() =>
    this.savedJobs().filter((s: any) => this.isUrgent(s.job?.urgency)).length
  );

  savedAvgPay = computed(() => {
    const arr = this.savedJobs();
    if (!arr.length) return 0;
    const sum = arr.reduce((s: number, j: any) => s + this.savedMidPay(j), 0);
    return Math.round(sum / arr.length);
  });

  savedCatChips = computed(() => {
    const all = this.savedJobs();
    const seen = new Map<string, { id: string; label: string; color: string; count: number }>();
    for (const s of all) {
      const name = s.job?.category?.name ?? 'General';
      const e = seen.get(name);
      if (e) e.count++;
      else seen.set(name, { id: name, label: name, color: this.catColor(name), count: 1 });
    }
    return [
      { id: 'all', label: 'All saved', color: '#0A0A0A', count: all.length },
      ...Array.from(seen.values()),
    ];
  });

  filteredSavedJobs = computed(() => {
    const list = this.savedJobs();
    const cat = this.savedCat();
    let result = cat === 'all'
      ? [...list]
      : list.filter((s: any) => (s.job?.category?.name ?? 'General') === cat);

    const sort = this.savedSort();
    if (sort === 'pay-high') {
      result.sort((a: any, b: any) => this.savedMidPay(b) - this.savedMidPay(a));
    } else if (sort === 'urgent') {
      result.sort((a: any, b: any) => {
        const au = this.isUrgent(a.job?.urgency) ? 1 : 0;
        const bu = this.isUrgent(b.job?.urgency) ? 1 : 0;
        return bu - au;
      });
    } else {
      result.sort((a: any, b: any) => {
        const at = new Date(a.createdAt || a.job?.createdAt || 0).getTime();
        const bt = new Date(b.createdAt || b.job?.createdAt || 0).getTime();
        return bt - at;
      });
    }
    return result;
  });

  savedInitials(saved: any): string {
    const p = saved?.job?.client?.clientProfile;
    if (!p) return '?';
    return `${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  }

  savedRelTime(iso?: string): string {
    if (!iso) return 'recently';
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return 'just now';
    if (h < 24) return h + 'h ago';
    const days = Math.floor(h / 24);
    if (days === 1) return 'yesterday';
    if (days < 7) return days + ' days ago';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  totalOpen = computed(() => this.jobs().length);

  poolTiles = computed(() => {
    const tasks = this.jobs().filter(j => !this.isTrade(j));
    const trades = this.jobs().filter(j =>  this.isTrade(j));
    return [
      {
        id: 'tasks' as const,
        tone: 'blue',
        title: 'Everyday tasks',
        desc: 'Cleaning, delivery, pet care, moving, assembly, mounting.',
        count: tasks.length,
        avgPay: this.avgPay(tasks),
        urgent: this.urgentCount(tasks),
        subs: [
          { label: 'General',  color: '#737373' },
          { label: 'Assembly', color: '#F59E0B' },
          { label: 'Mounting', color: '#10B981' },
        ],
      },
      {
        id: 'trades' as const,
        tone: 'lime',
        title: 'Trades & skills',
        desc: 'Plumbing, electrical, painting, HVAC, carpentry — licensed work.',
        count: trades.length,
        avgPay: this.avgPay(trades),
        urgent: this.urgentCount(trades),
        subs: [
          { label: 'Plumbing',   color: '#3B82F6' },
          { label: 'Electrical', color: '#EAB308' },
          { label: 'Painting',   color: '#EC4899' },
        ],
      },
    ];
  });

  private avgPay(jobs: NearbyJob[]): number {
    if (!jobs.length) return 0;
    const total = jobs.reduce((s, j) => {
      const lo = j.priceMin ?? 0;
      const hi = j.priceMax ?? lo;
      return s + Math.round((lo + hi) / 2);
    }, 0);
    return Math.round(total / jobs.length);
  }

  private urgentCount(jobs: NearbyJob[]): number {
    return jobs.filter(j => j.urgency === 'HIGH' || j.urgency === 'EMERGENCY').length;
  }

  closeSaved() {
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  openSaved() {
    this.tab.set('saved');
    this.api.getSavedJobs().subscribe({ next: (s) => this.savedJobs.set(s) });
  }

  toggleSave(jobId: string) {
    if (this.savedJobIds().has(jobId)) {
      this.api.unsaveJob(jobId).subscribe({
        next: () => this.savedJobs.update(s => s.filter((x: any) => x.jobId !== jobId)),
      });
    } else {
      this.api.saveJob(jobId).subscribe({
        next: (saved: any) => this.savedJobs.update(s => [...s, saved]),
      });
    }
  }

  private readonly TRADE_CATEGORIES = new Set([
    'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Mechanical', 'Handyman', 'HVAC',
  ]);

  private isTrade(job: NearbyJob) {
    return job.category ? this.TRADE_CATEGORIES.has(job.category.name) : false;
  }

  taskPoolCount  = computed(() => this.jobs().filter(j => !this.isTrade(j)).length);
  tradePoolCount = computed(() => this.jobs().filter(j =>  this.isTrade(j)).length);

  filteredByPool = computed(() => {
    const p = this.pool();
    if (p === null) return [];
    if (p === 'all') return this.jobs();
    return p === 'trades'
      ? this.jobs().filter(j =>  this.isTrade(j))
      : this.jobs().filter(j => !this.isTrade(j));
  });

  filteredJobs = computed(() => {
    let list = this.filteredByPool();
    const dist = this.filterDistance();
    const cat  = this.filterCategory();
    const urg  = this.filterUrgency();
    const price = this.filterMaxPrice();
    if (dist  !== null) list = list.filter(j => j.distanceKm !== null && j.distanceKm <= dist);
    if (cat)            list = list.filter(j => j.category?.name === cat);
    if (urg)            list = list.filter(j => j.urgency === urg);
    if (price !== null) list = list.filter(j => j.priceMin !== null && j.priceMin <= price);

    const sort = this.browseSort();
    if (sort === 'pay') {
      list = [...list].sort((a, b) => this.jobMidPay(b) - this.jobMidPay(a));
    } else if (sort === 'near') {
      list = [...list].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }
    return list;
  });

  availableCategories = computed(() =>
    [...new Set(this.filteredByPool().map(j => j.category?.name).filter(Boolean))] as string[]
  );

  goToDetail(id: string) {
    this.router.navigate(['/worker/jobs', id]);
  }

  clearFilters() {
    this.filterDistance.set(null);
    this.filterCategory.set(null);
    this.filterUrgency.set(null);
    this.filterMaxPrice.set(null);
  }

  applyingTo = signal<NearbyJob | null>(null);
  proposedPrice: number | null = null;
  message = '';
  applying = signal(false);
  applyError = signal<string | null>(null);

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      this.tab.set(params.get('tab') === 'saved' ? 'saved' : 'browse');
    });
    this.api.getVerifyStatus().subscribe({
      next: (s) => this.idVerified.set(s.idVerified),
    });
    this.api.getSavedJobs().subscribe({ next: (s) => this.savedJobs.set(s) });
    this.api.getNearbyJobs(0).subscribe({
      next: (res: any) => {
        this.jobs.set(res.jobs);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadMore() {
    this.loadingMore.set(true);
    this.api.getNearbyJobs(this.jobs().length).subscribe({
      next: (res: any) => {
        this.jobs.update(j => [...j, ...res.jobs]);
        this.total.set(res.total);
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false),
    });
  }

  openApply(job: NearbyJob) {
    this.applyingTo.set(job);
    this.proposedPrice = null;
    this.message = '';
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
      message: this.message || undefined,
    }).subscribe({
      next: () => {
        this.jobs.update((jobs) =>
          jobs.map((j) => j.id === job.id ? { ...j, alreadyApplied: true, applicationStatus: 'APPLIED' } : j)
        );
        this.applying.set(false);
        this.closeApply();
      },
      error: (err) => {
        this.applyError.set(err?.error?.message ?? 'Failed to apply. Please try again.');
        this.applying.set(false);
      },
    });
  }

  catColor(category?: string | null): string {
    const map: Record<string, string> = {
      'Cleaning': '#14b8a6', 'Plumbing': '#2563eb', 'Electrical': '#f59e0b',
      'Moving': '#8b5cf6', 'Gardening': '#16a34a', 'Painting': '#f97316',
    };
    return map[category ?? ''] ?? '#a1a1aa';
  }

  urgencyLabel(urgency: string): string {
    const map: Record<string, string> = { NORMAL: 'Normal', HIGH: 'High priority', EMERGENCY: 'Emergency', LOW: 'Low priority' };
    return map[urgency] ?? urgency;
  }

  statusLabel(status: string | null): string {
    const map: Record<string, string> = { APPLIED: 'Applied', ACCEPTED: 'Accepted', REJECTED: 'Rejected' };
    return status ? (map[status] ?? status) : '';
  }

  clientInitials(job: NearbyJob): string {
    const p = job.client?.clientProfile;
    if (!p) return '?';
    return `${p.firstName[0] ?? ''}${p.lastName[0] ?? ''}`.toUpperCase();
  }

  clientFullName(job: NearbyJob): string {
    const p = job.client?.clientProfile;
    return p ? `${p.firstName} ${p.lastName}` : 'Client';
  }

  avatarColor(firstName?: string | null): string {
    const colors = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777'];
    const i = (firstName?.charCodeAt(0) ?? 0) % colors.length;
    return colors[i];
  }
}
