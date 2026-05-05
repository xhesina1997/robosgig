import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

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
            <p class="pool-pick-eyebrow">Job Board</p>
            <h1 class="pool-pick-title">What kind of work<br>are you looking for?</h1>
            <p class="pool-pick-sub">Choose a category to browse matching jobs near you.</p>
            <div class="pool-pick-grid">
              <button class="pool-card" (click)="pool.set('tasks')">
                <div class="pool-card-icon pool-card-icon--tasks">
                  <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
                </div>
                <span class="pool-card-label">Everyday Tasks</span>
                <span class="pool-card-desc">Cleaning, delivery, pet care, moving & more</span>
                @if (!loading()) {
                  <span class="pool-card-count">{{ taskPoolCount() }} open</span>
                }
              </button>
              <button class="pool-card" (click)="pool.set('trades')">
                <div class="pool-card-icon pool-card-icon--trades">
                  <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                </div>
                <span class="pool-card-label">Trades & Skills</span>
                <span class="pool-card-desc">Plumbing, electrical, carpentry, HVAC & more</span>
                @if (!loading()) {
                  <span class="pool-card-count">{{ tradePoolCount() }} open</span>
                }
              </button>
            </div>
            <button class="saved-tab-btn" (click)="openSaved()">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
              Saved jobs
              @if (savedJobIds().size > 0) {
                <span class="saved-tab-count">{{ savedJobIds().size }}</span>
              }
            </button>
          </div>
        </div>
      }

      <!-- Saved jobs view -->
      @if (tab() === 'saved') {
        <div class="page-header">
          <div class="inner">
            <div class="ph-topline">
              <div class="ph-topline-left">
                <button class="ph-back" (click)="tab.set('browse')">
                  <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                </button>
                <span class="ph-section">Saved Jobs</span>
              </div>
            </div>
            <div class="ph-title-block">
              <h1 class="ph-title">Saved Jobs</h1>
              <p class="ph-sub">{{ savedJobs().length }} saved</p>
            </div>
          </div>
        </div>
        <div class="page-body">
          <div class="inner">
            @if (savedJobs().length === 0) {
              <div class="empty-state">
                <div class="empty-icon">
                  <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                </div>
                <p class="empty-title">No saved jobs yet</p>
                <p class="empty-sub">Bookmark jobs you're interested in to find them here.</p>
              </div>
            } @else {
              <div class="jobs-list">
                @for (saved of savedJobs(); track saved.id) {
                  <div class="job-card" (click)="goToDetail(saved.job.id)">
                    <div class="jc-header">
                      <div class="jc-header-left">
                        <span class="jc-cat" [style.--dot]="catColor(saved.job.category?.name)">
                          <span class="jc-cat-dot"></span>
                          {{ (saved.job.category?.name || 'General').toUpperCase() }}
                        </span>
                        <span class="jc-sep">·</span>
                        <span class="urgency-pill urgency-{{ saved.job.urgency?.toLowerCase() }}">{{ urgencyLabel(saved.job.urgency) }}</span>
                      </div>
                      <span class="jc-date">{{ saved.job.createdAt | date:'d MMM' }}</span>
                    </div>
                    <div class="jc-body">
                      <h3 class="jc-title">{{ saved.job.title }}</h3>
                      <p class="jc-desc">{{ saved.job.description }}</p>
                    </div>
                    <div class="jc-footer">
                      <div class="jc-price">
                        @if (saved.job.priceMin) {
                          <span class="price-val">€{{ saved.job.priceMin }}–{{ saved.job.priceMax }}</span>
                        } @else {
                          <span class="price-neg">Negotiable</span>
                        }
                      </div>
                      <button class="save-btn save-btn--saved" (click)="$event.stopPropagation(); toggleSave(saved.job.id)">
                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                        Saved
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Header (when pool selected) -->
      @if (pool() !== null) {
      <div class="page-header">
        <div class="inner">

          <!-- Top line: back + section label + saved + map link -->
          <div class="ph-topline">
            <div class="ph-topline-left">
              <button class="ph-back" (click)="pool.set(null)">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <span class="ph-section">{{ pool() === 'trades' ? 'Trades & Skills' : 'Everyday Tasks' }}</span>
            </div>
            <div style="display:flex;align-items:center;gap:0.5rem">
              <button class="saved-tab-btn" (click)="openSaved()" style="margin-top:0">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                Saved
                @if (savedJobIds().size > 0) {
                  <span class="saved-tab-count">{{ savedJobIds().size }}</span>
                }
              </button>
            <a class="ph-map-link" routerLink="/worker/map">
              <!-- Compass icon -->
              <svg class="ph-compass" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill="currentColor" stroke="none" opacity="0.25"/>
                <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill="none" stroke="currentColor" stroke-width="1.4"/>
                <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
              </svg>
              Map view
            </a>
            </div>
          </div>

          <!-- Title + count -->
          <div class="ph-title-block">
            <h1 class="ph-title">Browse Jobs</h1>
            @if (!loading()) {
              <p class="ph-sub">
                <span class="ph-live-dot"></span>
                {{ filteredByPool().length }} open position{{ filteredByPool().length !== 1 ? 's' : '' }} near you
              </p>
            }
          </div>

          <!-- Filter tabs (text with underline indicator) -->
          @if (!loading()) {
            <div class="ph-filters">

              <div class="fd" [class.fd--set]="filterDistance() !== null">
                <button class="fd-tab" (click)="toggleDropdown('distance')">
                  {{ filterDistance() !== null ? 'Within ' + filterDistance() + ' km' : 'Distance' }}
                  <svg class="fd-caret" [class.fd-caret--open]="openDropdown() === 'distance'" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                @if (openDropdown() === 'distance') {
                  <div class="fd-menu">
                    <button class="fd-opt" [class.fd-opt--on]="filterDistance() === null" (click)="filterDistance.set(null); closeDropdown()">Any distance</button>
                    @for (d of [5, 10, 25, 50]; track d) {
                      <button class="fd-opt" [class.fd-opt--on]="filterDistance() === d" (click)="filterDistance.set(d); closeDropdown()">Within {{ d }} km</button>
                    }
                  </div>
                }
              </div>

              @if (availableCategories().length > 0) {
                <div class="fd" [class.fd--set]="filterCategory() !== null">
                  <button class="fd-tab" (click)="toggleDropdown('category')">
                    {{ filterCategory() ?? 'Category' }}
                    <svg class="fd-caret" [class.fd-caret--open]="openDropdown() === 'category'" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                  @if (openDropdown() === 'category') {
                    <div class="fd-menu">
                      <button class="fd-opt" [class.fd-opt--on]="filterCategory() === null" (click)="filterCategory.set(null); closeDropdown()">All categories</button>
                      @for (cat of availableCategories(); track cat) {
                        <button class="fd-opt" [class.fd-opt--on]="filterCategory() === cat" (click)="filterCategory.set(cat); closeDropdown()">{{ cat }}</button>
                      }
                    </div>
                  }
                </div>
              }

              <div class="fd" [class.fd--set]="filterUrgency() !== null">
                <button class="fd-tab" (click)="toggleDropdown('urgency')">
                  {{ filterUrgency() ? urgencyLabel(filterUrgency()!) : 'Urgency' }}
                  <svg class="fd-caret" [class.fd-caret--open]="openDropdown() === 'urgency'" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                @if (openDropdown() === 'urgency') {
                  <div class="fd-menu">
                    <button class="fd-opt" [class.fd-opt--on]="filterUrgency() === null" (click)="filterUrgency.set(null); closeDropdown()">Any urgency</button>
                    <button class="fd-opt" [class.fd-opt--on]="filterUrgency() === 'LOW'" (click)="filterUrgency.set('LOW'); closeDropdown()">Low priority</button>
                    <button class="fd-opt" [class.fd-opt--on]="filterUrgency() === 'NORMAL'" (click)="filterUrgency.set('NORMAL'); closeDropdown()">Normal</button>
                    <button class="fd-opt fd-opt--high" [class.fd-opt--on]="filterUrgency() === 'HIGH'" (click)="filterUrgency.set('HIGH'); closeDropdown()">High priority</button>
                    <button class="fd-opt fd-opt--emergency" [class.fd-opt--on]="filterUrgency() === 'EMERGENCY'" (click)="filterUrgency.set('EMERGENCY'); closeDropdown()">Emergency</button>
                  </div>
                }
              </div>

              <div class="fd" [class.fd--set]="filterMaxPrice() !== null">
                <button class="fd-tab" (click)="toggleDropdown('budget')">
                  {{ filterMaxPrice() !== null ? '≤ €' + filterMaxPrice() : 'Budget' }}
                  <svg class="fd-caret" [class.fd-caret--open]="openDropdown() === 'budget'" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                @if (openDropdown() === 'budget') {
                  <div class="fd-menu">
                    <button class="fd-opt" [class.fd-opt--on]="filterMaxPrice() === null" (click)="filterMaxPrice.set(null); closeDropdown()">Any budget</button>
                    @for (p of [50, 100, 250, 500]; track p) {
                      <button class="fd-opt" [class.fd-opt--on]="filterMaxPrice() === p" (click)="filterMaxPrice.set(p); closeDropdown()">Up to €{{ p }}</button>
                    }
                  </div>
                }
              </div>

              @if (activeFilterCount() > 0) {
                <button class="fd-reset" (click)="clearFilters()">Clear</button>
              }
            </div>
          }

        </div>
      </div>

      <!-- Dropdown backdrop (covers full page) -->
      @if (openDropdown()) {
        <div class="fd-backdrop" (click)="closeDropdown()"></div>
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
            <div class="jobs-list">
              @for (job of filteredJobs(); track job.id) {
                <div class="job-card" [class.job-applied]="job.alreadyApplied" (click)="goToDetail(job.id)">

                  <!-- Header: category · urgency · date -->
                  <div class="jc-header">
                    <div class="jc-header-left">
                      <span class="jc-cat" [style.--dot]="catColor(job.category?.name)">
                        <span class="jc-cat-dot"></span>
                        {{ (job.category?.name || 'General').toUpperCase() }}
                      </span>
                      <span class="jc-sep">·</span>
                      <span class="urgency-pill urgency-{{ job.urgency.toLowerCase() }}">{{ urgencyLabel(job.urgency) }}</span>
                    </div>
                    <span class="jc-date">{{ job.createdAt | date:'d MMM' }}</span>
                  </div>

                  <!-- Body box: title + description -->
                  <div class="jc-body">
                    <h3 class="jc-title">{{ job.title }}</h3>
                    <p class="jc-desc">{{ job.description }}</p>
                  </div>

                  <!-- Client row -->
                  <div class="jc-client">
                    <div class="jc-avatar" [style.background]="avatarColor(job.client?.clientProfile?.firstName)">
                      {{ clientInitials(job) }}
                    </div>
                    <div class="jc-client-info">
                      <span class="jc-client-name">{{ clientFullName(job) }}</span>
                      <div class="jc-client-meta">
                        @if (job.city) { <span>{{ job.city }}</span> }
                        @if (job.distanceKm !== null) { <span>{{ job.distanceKm }} km away</span> }
                        @if (job.client?.idVerified) {
                          <span class="jc-verified">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="#14b8a6"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            Verified
                          </span>
                        }
                      </div>
                    </div>
                    @if (job.alreadyApplied) {
                      <span class="status-pill status-{{ job.applicationStatus?.toLowerCase() }}">{{ statusLabel(job.applicationStatus) }}</span>
                    } @else {
                      <span class="jc-open-pill">Open</span>
                    }
                  </div>

                  <!-- Footer: price + actions -->
                  <div class="jc-footer">
                    <div class="jc-price">
                      @if (job.priceMin) {
                        <span class="price-val">€{{ job.priceMin }}–{{ job.priceMax }}</span>
                      } @else {
                        <span class="price-neg">Negotiable</span>
                      }
                    </div>
                    <div class="jc-actions">
                      <button class="save-btn" [class.save-btn--saved]="savedJobIds().has(job.id)" (click)="$event.stopPropagation(); toggleSave(job.id)" [title]="savedJobIds().has(job.id) ? 'Remove from saved' : 'Save job'">
                        <svg width="12" height="12" [attr.fill]="savedJobIds().has(job.id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                      </button>
                      @if (job.latitude && job.longitude) {
                        <button class="jc-map-btn" [routerLink]="['/worker/map']" [queryParams]="{focus: job.id}" (click)="$event.stopPropagation()">
                          <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
                          Map
                        </button>
                      }
                      @if (!job.alreadyApplied) {
                        @if (!idVerified()) {
                          <button class="apply-btn apply-btn--locked" disabled>
                            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                            Verify first
                          </button>
                        } @else {
                          <button class="apply-btn" (click)="$event.stopPropagation(); openApply(job)">
                            Apply
                          </button>
                        }
                      }
                    </div>
                  </div>
                </div>
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
      background: #f8f8f8; padding: 2rem 1.5rem;
    }
    .pool-pick-inner { max-width: 640px; width: 100%; text-align: center; }
    .pool-pick-eyebrow {
      font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em;
      text-transform: uppercase; color: #a1a1aa; margin: 0 0 0.75rem;
    }
    .pool-pick-title {
      font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 800;
      color: #09090b; letter-spacing: -0.03em; line-height: 1.15;
      margin: 0 0 0.75rem;
    }
    .pool-pick-sub {
      font-size: 0.95rem; color: #71717a; margin: 0 0 2.5rem; line-height: 1.6;
    }
    .pool-pick-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
    }
    .pool-card {
      display: flex; flex-direction: column; align-items: center;
      gap: 0.75rem; padding: 2rem 1.5rem;
      background: #fff; border: 1.5px solid #e4e4e7; border-radius: 20px;
      cursor: pointer; text-align: center; font-family: inherit;
      transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
    }
    .pool-card:hover {
      border-color: #d4ff3a;
      box-shadow: 0 8px 32px rgba(212,255,58,0.12);
      transform: translateY(-3px);
    }
    .pool-card-icon {
      width: 72px; height: 72px; border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
    }
    .pool-card-icon--tasks  { background: #eff6ff; color: #2563eb; }
    .pool-card-icon--trades { background: #fef3c7; color: #d97706; }
    .pool-card-label {
      font-size: 1.05rem; font-weight: 700; color: #18181b;
    }
    .pool-card-desc {
      font-size: 0.8rem; color: #71717a; line-height: 1.5;
    }
    .pool-card-count {
      font-size: 0.75rem; font-weight: 700;
      background: #f4f4f5; color: #52525b;
      padding: 0.2rem 0.65rem; border-radius: 99px;
    }
    @media (max-width: 480px) {
      .pool-pick-grid { grid-template-columns: 1fr; }
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
  `]
})
export class WorkerJobsComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

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


  pool = signal<'tasks' | 'trades' | null>(null);
  tab = signal<'browse' | 'saved'>('browse');
  savedJobs = signal<any[]>([]);
  savedJobIds = computed(() => new Set(this.savedJobs().map((s: any) => s.jobId)));

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
