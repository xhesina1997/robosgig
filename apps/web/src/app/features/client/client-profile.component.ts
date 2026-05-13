import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { loadStripe, Stripe, StripeCardElement, StripeElements } from '@stripe/stripe-js';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { VerifyIdentityComponent } from '../../shared/verify-identity.component';
import { ReportProblemComponent } from '../../shared/report-problem.component';
import { environment } from '../../../environments/environment';

interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  email: string;
  idVerified: boolean;
}
interface NominatimResult { display_name: string; lat: string; lon: string; address: Record<string, string>; }

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, VerifyIdentityComponent, ReportProblemComponent],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div class="inner">
          <div class="header-top">
            <div>
              <p class="eyebrow">Client profile</p>
              <h1 class="page-title">My profile</h1>
            </div>
            @if (profile()) {
              <div class="header-actions">
                <button class="hdr-btn hdr-btn--primary" (click)="saveProfile()" [disabled]="saving()" type="button">
                  @if (saving()) { Saving… } @else { Save changes }
                </button>
              </div>
            }
          </div>
        </div>
        <div class="inner">
          <nav class="tabs-nav">
            <button class="tab-btn" [class.tab-active]="activeTab() === 'profile'" (click)="activeTab.set('profile')" type="button">
              Profile
            </button>
            <button class="tab-btn" [class.tab-active]="activeTab() === 'identity'" (click)="activeTab.set('identity')" type="button">
              Identity
            </button>
            <button class="tab-btn" [class.tab-active]="activeTab() === 'payment'" (click)="activeTab.set('payment')" type="button">
              Payment
            </button>
            <button class="tab-btn" [class.tab-active]="activeTab() === 'spending'" (click)="activeTab.set('spending')" type="button">
              Spending
            </button>
            <button class="tab-btn" [class.tab-active]="activeTab() === 'security'" (click)="activeTab.set('security')" type="button">
              Security
            </button>
          </nav>
        </div>
      </div>

      @if (profile()) {
        <div class="slides-outer">
          <div class="slides-track">

            <!-- Slide 0: Profile -->
            @if (activeTab() === 'profile') {
            <div class="slide">
              <div class="page-body">
                <div class="inner">
                  <div class="cp-grid cp-grid--single">

                    <!-- Left: identity card -->
                    <div class="cp-card">
                      <div class="cp-avatar-row">
                        <div class="cp-avatar">{{ profile()!.firstName[0] }}{{ profile()!.lastName[0] }}</div>
                        <div class="cp-avatar-main">
                          <p class="cp-avatar-name">{{ profile()!.firstName }} {{ profile()!.lastName }}</p>
                          <p class="cp-avatar-email">{{ profile()!.email }}</p>
                          @if (profile()!.idVerified) {
                            <span class="cp-verified">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                              Verified
                            </span>
                          } @else {
                            <span class="cp-unverified">Not verified</span>
                          }
                        </div>
                      </div>

                      <div class="cp-divider"></div>

                      <p class="cp-eyebrow">Personal info</p>
                      <div class="cp-fields">
                        <div class="cp-field">
                          <label class="cp-label">First name</label>
                          <input class="cp-input" [(ngModel)]="edit.firstName" />
                        </div>
                        <div class="cp-field">
                          <label class="cp-label">Last name</label>
                          <input class="cp-input" [(ngModel)]="edit.lastName" />
                        </div>
                        <div class="cp-field cp-field--full">
                          <label class="cp-label">Phone</label>
                          <input class="cp-input" [(ngModel)]="edit.phone" placeholder="+43 …" />
                        </div>
                        <div class="cp-field cp-field--full">
                          <div class="cp-label-row">
                            <label class="cp-label">Location</label>
                            <span class="cp-hint">Used for nearby workers</span>
                          </div>
                          <div class="cp-loc-wrap">
                            <input class="cp-input"
                                   [(ngModel)]="locationQuery"
                                   (input)="searchLocation()"
                                   placeholder="Search address, postcode, city…" />
                            @if (locationSuggestions().length > 0) {
                              <div class="cp-loc-dropdown">
                                @for (item of locationSuggestions(); track item.display_name) {
                                  <button class="cp-loc-opt" (click)="selectLocation(item)" type="button">
                                    {{ item.display_name }}
                                  </button>
                                }
                              </div>
                            }
                            @if (locationConfirmed() && edit.latitude) {
                              <div class="cp-loc-ok">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                                {{ edit.city }}{{ edit.address ? ' · ' + edit.address : '' }}
                              </div>
                            }
                          </div>
                        </div>
                      </div>

                      @if (saveSuccess()) {
                        <div class="cp-banner cp-banner--ok">Profile saved successfully</div>
                      }
                      @if (saveError()) {
                        <div class="cp-banner cp-banner--err">{{ saveError() }}</div>
                      }
                    </div>

                  </div>
                </div>
              </div>
            </div>
            }

            <!-- Slide 1: Identity -->
            @if (activeTab() === 'identity') {
            <div class="slide">
              <div class="page-body">
                <div class="inner">
                  <div class="ci-grid">
                    <!-- LEFT: progress + checklist + trust -->
                    <div class="ci-left">
                      <div class="ci-card">
                        <div class="ci-progress-head">
                          <div>
                            <p class="cp-eyebrow" style="margin:0">Verification progress</p>
                            <div class="ci-progress-num">
                              <span class="ci-progress-done">{{ idStepsDone() }}</span><span class="ci-progress-total">/{{ idStepsRequired() }}</span>
                              <span class="ci-progress-label">steps complete</span>
                            </div>
                          </div>
                        </div>
                        <div class="ci-bar">
                          <div class="ci-bar-fill" [style.width.%]="idProgressPct()"></div>
                        </div>
                        <div class="ci-bar-meta">
                          <span>{{ idProgressPct() }}% complete</span>
                          <span>{{ profile()!.idVerified ? 'Verified' : '~5 min remaining' }}</span>
                        </div>
                      </div>

                      <div class="ci-card ci-checklist">
                        <div class="ci-checklist-head">Checklist</div>
                        @for (step of idSteps(); track step.id; let i = $index) {
                          <div class="ci-step" [class.ci-step--focus]="step.focus && step.status === 'todo'">
                            <span class="ci-step-dot ci-step-dot--{{ step.status }}">
                              @if (step.status === 'done') {
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--rg-accent, #84CC16)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                              } @else {
                                {{ i + 1 }}
                              }
                            </span>
                            <div class="ci-step-main">
                              <p class="ci-step-label">{{ step.label }}</p>
                              <p class="ci-step-hint">{{ step.hint }}</p>
                            </div>
                            <span class="ci-step-pill ci-step-pill--{{ step.status }}">{{ stepStatusLabel(step.status) }}</span>
                          </div>
                        }
                      </div>

                      <div class="ci-card ci-trust">
                        <div class="ci-trust-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3z"/></svg>
                        </div>
                        <div class="ci-trust-main">
                          <p class="ci-trust-title">Bank-grade encryption</p>
                          <p class="ci-trust-sub">
                            Documents are stored encrypted, reviewed by a human, and deleted 30 days after verification.
                          </p>
                        </div>
                      </div>
                    </div>

                    <!-- RIGHT: ID upload focus -->
                    <div class="ci-card ci-right">
                      <div class="ci-right-head">
                        <div>
                          <p class="cp-eyebrow" style="margin:0">Identity check</p>
                          <p class="ci-right-title">Government-issued ID</p>
                          <p class="ci-right-sub">
                            Verify your identity to start posting jobs and protect your account.
                          </p>
                        </div>
                      </div>
                      <div class="ci-right-body">
                        <app-verify-identity />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            }

            <!-- Slide 2: Payment -->
            @if (activeTab() === 'payment') {
            <div class="slide">
              <div class="page-body">
                <div class="inner">
                  <div class="cs-wrap">

                    <section class="cs-section">
                      <header class="cs-head">
                        <span class="cs-head-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/></svg>
                        </span>
                        <div class="cs-head-main">
                          <p class="cs-head-eyebrow">Payment methods</p>
                          <p class="cs-head-title">Saved cards</p>
                          <p class="cs-head-sub">
                            Add a card now or let us save it automatically next time you pay.
                            Cards are stored by Stripe — we never see your full number.
                          </p>
                        </div>
                        @if (!cardFormOpen()) {
                          <button
                            class="cp-pm-add-btn"
                            (click)="openCardForm()"
                            type="button"
                          >+ Add a card</button>
                        }
                      </header>
                      <div class="cs-body">

                        @if (cardFormOpen()) {
                          <div class="cp-card-form">
                            <label class="cp-card-form-lbl">Card details</label>
                            <div id="wpm-card-element" class="cp-card-form-field"></div>
                            <p class="cp-card-form-hint">Saved securely by Stripe — we never see your card number.</p>
                            <div class="cp-card-form-actions">
                              <button
                                class="cp-pm-add-btn cp-pm-add-btn--ghost"
                                (click)="closeCardForm()"
                                [disabled]="addingCard()"
                                type="button"
                              >Cancel</button>
                              <button
                                class="cp-pm-add-btn"
                                (click)="submitCard()"
                                [disabled]="addingCard() || !cardFormReady()"
                                type="button"
                              >
                                @if (addingCard()) { Saving… } @else { Save card }
                              </button>
                            </div>
                          </div>
                        }

                        @if (cardLoading()) {
                          <p class="cs-msg">Loading cards…</p>
                        } @else if (paymentMethods().length === 0) {
                          <div class="cp-empty">
                            <p class="cp-empty-title">No saved cards yet</p>
                            <p class="cp-empty-sub">
                              Add one now to make checkout faster, or it'll be saved automatically the first time you pay.
                            </p>
                          </div>
                        } @else {
                          <div class="cp-card-list">
                            @for (m of paymentMethods(); track m.id) {
                              <div class="cp-pm-tile">
                                <div class="cp-pm-preview cp-pm-preview--{{ m.brand }}">
                                  <div class="cp-pm-preview-top">
                                    <span class="cp-pm-preview-brand">{{ m.brand | uppercase }}</span>
                                    <span class="cp-pm-preview-chip" aria-hidden="true"></span>
                                  </div>
                                  <div class="cp-pm-preview-num">
                                    <span class="cp-pm-preview-dots">••••</span>
                                    <span class="cp-pm-preview-dots">••••</span>
                                    <span class="cp-pm-preview-dots">••••</span>
                                    <span class="cp-pm-preview-last">{{ m.last4 }}</span>
                                  </div>
                                  <div class="cp-pm-preview-bottom">
                                    <span>SAVED CARD</span>
                                    <span class="cp-pm-preview-exp">EXP {{ m.expMonth | number: '2.0' }}/{{ (m.expYear ?? 0) % 100 | number: '2.0' }}</span>
                                  </div>
                                </div>
                                <div class="cp-pm-meta-row">
                                  <span class="cp-pm-meta-check" aria-hidden="true">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                                  </span>
                                  <div class="cp-pm-meta-main">
                                    <p class="cp-pm-meta-name">{{ m.brand | titlecase }} •• {{ m.last4 }}</p>
                                    <p class="cp-pm-meta-sub">Expires {{ m.expMonth | number: '2.0' }}/{{ m.expYear }}</p>
                                  </div>
                                  <button
                                    class="cp-pm-meta-del"
                                    (click)="removeCard(m.id)"
                                    [disabled]="removingCard() === m.id"
                                    [attr.aria-label]="'Remove card ending ' + m.last4"
                                    type="button"
                                  >
                                    @if (removingCard() === m.id) {
                                      <span class="cp-pm-meta-del-text">Removing…</span>
                                    } @else {
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
                                    }
                                  </button>
                                </div>
                              </div>
                            }
                          </div>
                        }
                        @if (cardSuccess()) { <p class="cs-msg cs-msg--ok">{{ cardSuccess() }}</p> }
                        @if (cardError()) { <p class="cs-msg cs-msg--err">{{ cardError() }}</p> }
                      </div>
                    </section>

                  </div>
                </div>
              </div>
            </div>
            }

            <!-- Slide 3: Spending -->
            @if (activeTab() === 'spending') {
            <div class="slide">
              <div class="page-body">
                <div class="inner">
                  <div class="cw-wrap">

                    <!-- Sub-header: range + actions -->
                    <div class="cw-subhead">
                      <div>
                        <p class="cp-eyebrow" style="margin:0">Spending &amp; budget</p>
                        <p class="cw-subhead-title">Spending</p>
                        <p class="cw-subhead-sub">What you've paid, what's still in escrow, and where it went.</p>
                      </div>
                      <div class="cw-actions">
                        <div class="cw-range">
                          @for (r of spendRanges; track r) {
                            <button
                              class="cw-range-btn"
                              [class.cw-range-btn--active]="spendRange() === r"
                              (click)="spendRange.set(r)"
                              type="button"
                            >{{ r }}</button>
                          }
                        </div>
                        <button class="cw-btn" type="button" (click)="exportCsv()" [disabled]="exportingCsv()">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M6 10l6 6 6-6"/><path d="M4 20h16"/></svg>
                          @if (exportingCsv()) { Exporting… } @else { Export CSV }
                        </button>
                      </div>
                    </div>

                    <!-- Hero spend card + balance grid -->
                    <div class="cw-hero-grid">
                      <div class="cp-card cw-balance-card">
                        <div class="cw-balance-top">
                          <div>
                            <p class="cp-eyebrow" style="margin:0">Total spent · all time</p>
                            <p class="cw-balance-amount">
                              <span class="cw-balance-whole">€{{ spentWhole() }}</span><span class="cw-balance-dec">.{{ spentDec() }}</span>
                            </p>
                            @if (stats()) {
                              <p class="cw-balance-growth">
                                ↑ €{{ stats().totalFeesPaid.toFixed(0) }} platform fees
                                <span class="cw-balance-growth-dim">· {{ stats().jobsCompleted }} job{{ stats().jobsCompleted === 1 ? '' : 's' }} paid</span>
                              </p>
                            }
                          </div>
                          <svg class="cw-spark" width="200" height="60" viewBox="0 0 200 60" preserveAspectRatio="none">
                            <path [attr.d]="sparkLinePath()" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                            <path [attr.d]="sparkAreaPath()" fill="rgba(10,10,10,0.06)" stroke="none"/>
                            <circle [attr.cx]="sparkLastPoint().x" [attr.cy]="sparkLastPoint().y" r="3" fill="var(--ink)"/>
                          </svg>
                        </div>

                        @if (categorySplit().length > 0) {
                          <div class="cw-split">
                            <div class="cw-split-bar">
                              @for (c of categorySplit(); track c.name) {
                                <div class="cw-split-seg" [style.width.%]="c.pct" [style.background]="c.color"></div>
                              }
                            </div>
                            <div class="cw-split-legend">
                              @for (c of categorySplit(); track c.name) {
                                <span><span class="cw-split-dot" [style.background]="c.color"></span> {{ c.name }} {{ c.pct }}%</span>
                              }
                            </div>
                          </div>
                        }
                      </div>

                      <!-- 2x2 stats -->
                      <div class="cw-stat-grid">
                        <div class="cw-stat">
                          <p class="cw-stat-label">This month</p>
                          <p class="cw-stat-val cw-stat-val--accent cw-stat-val--mono">€{{ stats() ? stats().thisMonth.toFixed(2) : '—' }}</p>
                          <p class="cw-stat-sub">{{ thisMonthLabel() }}</p>
                        </div>
                        <div class="cw-stat">
                          <p class="cw-stat-label">Held in escrow</p>
                          <p class="cw-stat-val cw-stat-val--warn cw-stat-val--mono">€{{ stats() ? stats().inEscrow.toFixed(2) : '—' }}</p>
                          <p class="cw-stat-sub">{{ stats()?.jobsActive ?? 0 }} job{{ stats()?.jobsActive === 1 ? '' : 's' }} in progress</p>
                        </div>
                        <div class="cw-stat">
                          <p class="cw-stat-label">Awaiting funding</p>
                          <p class="cw-stat-val cw-stat-val--mono">€{{ stats() ? stats().awaitingFunding.toFixed(2) : '—' }}</p>
                          <p class="cw-stat-sub">{{ awaitingLabel() }}</p>
                        </div>
                        <div class="cw-stat">
                          <p class="cw-stat-label">Avg per job</p>
                          <p class="cw-stat-val cw-stat-val--mono">€{{ avgPerJob() }}</p>
                          <p class="cw-stat-sub">across {{ stats()?.jobsCompleted ?? 0 }} jobs</p>
                        </div>
                      </div>
                    </div>

                    <!-- Activity stats row -->
                    <div class="cw-activity-row">
                      <div class="cw-stat">
                        <p class="cw-stat-label">Jobs posted</p>
                        <p class="cw-stat-val">{{ stats()?.jobsPosted ?? 0 }}</p>
                        <p class="cw-stat-sub">all time</p>
                      </div>
                      <div class="cw-stat">
                        <p class="cw-stat-label">Completion rate</p>
                        <p class="cw-stat-val">{{ completionRate() }}%</p>
                        <p class="cw-stat-sub">{{ stats()?.jobsCompleted ?? 0 }} of {{ stats()?.jobsPosted ?? 0 }} finished</p>
                      </div>
                      <div class="cw-stat">
                        <p class="cw-stat-label">Active jobs</p>
                        <p class="cw-stat-val">{{ stats()?.jobsActive ?? 0 }}</p>
                        <p class="cw-stat-sub">in progress</p>
                      </div>
                      <div class="cw-stat">
                        <p class="cw-stat-label">Platform fees</p>
                        <p class="cw-stat-val cw-stat-val--mono">€{{ stats() ? stats().totalFeesPaid.toFixed(0) : '—' }}</p>
                        <p class="cw-stat-sub">all completed</p>
                      </div>
                      <div class="cw-stat">
                        <p class="cw-stat-label">Repeat hires</p>
                        <p class="cw-stat-val">—</p>
                        <p class="cw-stat-sub">coming soon</p>
                      </div>
                    </div>

                    <!-- Transactions + payment method -->
                    <div class="cw-bottom-grid">
                      <div class="cp-card cw-tx-card">
                        <div class="cw-tx-head">
                          <div class="cw-tx-head-left">
                            Transactions
                            <span class="cw-tx-count">0</span>
                          </div>
                          <div class="cw-tx-filters">
                            <button
                              class="cw-pill"
                              [class.cw-pill--active]="txFilter() === 'all'"
                              (click)="txFilter.set('all')"
                              type="button"
                            >All</button>
                            <button
                              class="cw-pill"
                              [class.cw-pill--active]="txFilter() === 'payments'"
                              (click)="txFilter.set('payments')"
                              type="button"
                            >Payments</button>
                            <button
                              class="cw-pill"
                              [class.cw-pill--active]="txFilter() === 'escrow'"
                              (click)="txFilter.set('escrow')"
                              type="button"
                            >Escrow</button>
                          </div>
                        </div>
                        <div class="cw-tx-empty">
                          <p class="cw-tx-empty-title">No transactions yet</p>
                          <p class="cw-tx-empty-sub">
                            Pay for your first job and the receipts will land here —
                            with refunds, escrow holds, and top-ups all in one searchable list.
                          </p>
                        </div>
                      </div>

                      <!-- Payment method + budget -->
                      <div class="cp-card cw-payout-card">
                        <p class="cw-payout-title">Payment method</p>

                        <div class="cw-payout-bank">
                          <div class="cw-payout-bank-glow"></div>
                          <div class="cw-payout-bank-row">
                            <span class="cw-payout-bank-label">
                              {{ defaultCard() ? (defaultCard()!.brand | titlecase) + ' · Primary' : 'No card on file' }}
                            </span>
                            @if (defaultCard()) {
                              <span class="cw-payout-bank-badge">Default</span>
                            }
                          </div>
                          <p class="cw-payout-bank-num">
                            @if (defaultCard()) {
                              •••• •••• •••• {{ defaultCard()!.last4 }}
                            } @else {
                              — add a card to start —
                            }
                          </p>
                          <div class="cw-payout-bank-foot">
                            @if (defaultCard()) {
                              <span>EXPIRES {{ defaultCard()!.expMonth }}/{{ defaultCard()!.expYear }}</span>
                              <span>{{ (profile()!.firstName + ' ' + profile()!.lastName).toUpperCase() }}</span>
                            } @else {
                              <span>—</span>
                              <span>{{ (profile()!.firstName + ' ' + profile()!.lastName).toUpperCase() }}</span>
                            }
                          </div>
                        </div>

                        <button class="cw-payout-add" (click)="activeTab.set('payment')" type="button">
                          + {{ defaultCard() ? 'Manage cards' : 'Add a card' }}
                        </button>

                        <div class="cw-payout-auto">
                          <p class="cw-payout-auto-label">Monthly budget</p>
                          <p class="cw-payout-auto-text">
                            Set a soft spend target — we'll email you when you hit it. Active jobs are never blocked.
                          </p>
                          <div class="cw-budget-row">
                            <label class="cw-budget-input-wrap">
                              <span class="cw-budget-prefix">€</span>
                              <input
                                class="cw-budget-input"
                                type="number"
                                min="0"
                                step="10"
                                placeholder="e.g. 200"
                                [(ngModel)]="budgetTarget"
                                name="budgetTarget"
                              />
                            </label>
                            <span class="cw-budget-suffix">/ month</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
            }

            <!-- Slide 4: Security -->
            @if (activeTab() === 'security') {
            <div class="slide">
              <div class="page-body">
                <div class="inner">
                  <div class="cs-wrap">

                    <!-- Password -->
                    <section class="cs-section">
                      <header class="cs-head">
                        <span class="cs-head-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/></svg>
                        </span>
                        <div class="cs-head-main">
                          <p class="cs-head-eyebrow">Sign-in</p>
                          <p class="cs-head-title">Change password</p>
                          <p class="cs-head-sub">Use at least 8 characters with a mix of letters and numbers.</p>
                        </div>
                      </header>
                      <div class="cs-body">
                        <div class="cs-fields-2">
                          <div class="cp-field">
                            <label class="cp-label">Current password</label>
                            <input class="cp-input" type="password" [(ngModel)]="pw.current" autocomplete="current-password" />
                          </div>
                          <div class="cp-field">
                            <label class="cp-label">New password</label>
                            <input class="cp-input" type="password" [(ngModel)]="pw.next" autocomplete="new-password" />
                          </div>
                          <div class="cp-field cs-field--full">
                            <label class="cp-label">Confirm new password</label>
                            <input class="cp-input" type="password" [(ngModel)]="pw.confirm" autocomplete="new-password" />
                          </div>
                        </div>
                        @if (pwError()) { <p class="cs-msg cs-msg--err">{{ pwError() }}</p> }
                        @if (pwSuccess()) { <p class="cs-msg cs-msg--ok">Password updated</p> }
                        <button class="cs-save-btn" (click)="changePassword()" [disabled]="pwSaving()" type="button">
                          {{ pwSaving() ? 'Saving…' : 'Update password' }}
                        </button>
                      </div>
                    </section>

                    <!-- Report a problem -->
                    <section class="cs-section">
                      <header class="cs-head">
                        <span class="cs-head-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.5"/></svg>
                        </span>
                        <div class="cs-head-main">
                          <p class="cs-head-eyebrow">Support</p>
                          <p class="cs-head-title">Report a problem</p>
                          <p class="cs-head-sub">
                            Tell us what's going wrong and we'll get back within one business day.
                          </p>
                        </div>
                      </header>
                      <div class="cs-body">
                        @if (reportSent()) {
                          <div class="cs-report-sent">
                            <span class="cs-report-sent-icon">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                            </span>
                            <div class="cs-report-sent-main">
                              <p class="cs-report-sent-title">Report sent</p>
                              <p class="cs-report-sent-sub">We'll email you at the address on file.</p>
                            </div>
                            <button class="cs-save-btn cs-save-btn--ghost" (click)="resetReport()" type="button">Report another</button>
                          </div>
                        } @else {
                          <p class="cs-mini-label">What's the issue?</p>
                          <div class="cs-issue-grid">
                            @for (t of issueTypes; track t.id) {
                              <button
                                class="cs-issue"
                                [class.cs-issue--active]="reportCategory() === t.id"
                                (click)="reportCategory.set(t.id)"
                                type="button"
                              >
                                <span class="cs-issue-radio">
                                  @if (reportCategory() === t.id) { <span class="cs-issue-radio-dot"></span> }
                                </span>
                                <div>
                                  <p class="cs-issue-label">{{ t.label }}</p>
                                  <p class="cs-issue-desc">{{ t.desc }}</p>
                                </div>
                              </button>
                            }
                          </div>

                          <p class="cs-mini-label" style="margin-top:14px">Describe the problem</p>
                          <textarea
                            class="cp-input cp-input--area"
                            [(ngModel)]="reportBody"
                            rows="4"
                            placeholder="What happened? Include any job IDs, transaction IDs, or details you can share."
                          ></textarea>
                          @if (reportError()) { <p class="cs-msg cs-msg--err">{{ reportError() }}</p> }
                          <div class="cs-report-foot">
                            <span class="cs-report-hint">Min. 10 characters</span>
                            <button
                              class="cs-save-btn cs-save-btn--lime"
                              (click)="sendInlineReport()"
                              [disabled]="!canSendReport() || reportSubmitting()"
                              type="button"
                            >
                              @if (reportSubmitting()) { Sending… } @else { Send report → }
                            </button>
                          </div>
                        }
                      </div>
                    </section>

                    <!-- Delete -->
                    <section class="cs-section cs-section--danger">
                      <header class="cs-head cs-head--danger">
                        <span class="cs-head-icon cs-head-icon--danger">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>
                        </span>
                        <div class="cs-head-main">
                          <p class="cs-head-eyebrow cs-head-eyebrow--danger">Danger zone</p>
                          <p class="cs-head-title cs-head-title--danger">Delete account</p>
                          <p class="cs-head-sub">
                            This permanently removes your profile, posted jobs, and message history.
                            In-progress jobs must be completed or cancelled first. This cannot be undone.
                          </p>
                        </div>
                      </header>
                      <div class="cs-body">
                        <div class="cs-danger-list">
                          <p class="cs-danger-list-title">What gets deleted</p>
                          <ul>
                            <li><span class="cs-danger-dot"></span> Your profile and verification</li>
                            <li><span class="cs-danger-dot"></span> All posted jobs and message history</li>
                            <li><span class="cs-danger-dot"></span> Saved payment methods (your bank stays with your bank)</li>
                            <li><span class="cs-danger-dot"></span> Spending analytics and rating history</li>
                          </ul>
                        </div>

                        @if (!confirmDelete()) {
                          <button class="cs-delete-btn" (click)="confirmDelete.set(true)" type="button">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>
                            Delete my account
                          </button>
                        } @else {
                          <div class="cs-delete-confirm">
                            <p class="cs-delete-typed">
                              Type <span class="cs-delete-typed-word">DELETE</span> to confirm.
                            </p>
                            <p class="cs-delete-typed-sub">Your account is queued for deletion immediately. This cannot be undone.</p>
                            <input
                              class="cp-input"
                              [(ngModel)]="deleteText"
                              placeholder="Type DELETE"
                              autocomplete="off"
                              style="margin-top:12px;font-family:var(--mono);letter-spacing:0.08em"
                            />
                            @if (deleteError()) { <p class="cs-msg cs-msg--err">{{ deleteError() }}</p> }
                            <div class="cs-delete-actions">
                              <button class="cs-save-btn cs-save-btn--ghost" (click)="confirmDelete.set(false); deleteText = ''" type="button">Cancel</button>
                              <button
                                class="cs-delete-btn cs-delete-btn--solid"
                                [disabled]="!canDelete() || deleting()"
                                (click)="deleteAccount()"
                                type="button"
                              >
                                {{ deleting() ? 'Deleting…' : 'Permanently delete account' }}
                              </button>
                            </div>
                          </div>
                        }
                      </div>
                    </section>

                  </div>
                </div>
              </div>
            </div>
            }

          </div>
        </div>
      } @else {
        <div class="loading">
          <div class="load-ring"></div>
          <p>Loading your profile…</p>
        </div>
      }

      @if (showReportModal()) {
        <app-report-problem (closed)="showReportModal.set(false)" />
      }
    </div>
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
      --soft: var(--rg-soft, #F5F5F3);
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
    .inner { max-width: 1180px; margin: 0 auto; padding: 0 40px; }
    .loading {
      min-height: 50vh;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: center;
      justify-content: center;
      color: var(--muted);
    }
    .load-ring {
      width: 28px; height: 28px;
      border: 3px solid var(--rule);
      border-top-color: var(--ink);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Header */
    .page-header {
      background: var(--bg);
      border-bottom: 1px solid var(--rule);
      padding: 26px 0 0;
    }
    .header-top {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      padding-bottom: 20px;
    }
    .eyebrow {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--muted);
      margin: 0 0 6px;
    }
    .page-title {
      font-size: 32px;
      font-weight: 500;
      color: var(--ink);
      letter-spacing: -0.025em;
      line-height: 1;
      margin: 0;
    }
    .header-actions { display: flex; gap: 6px; align-items: center; }
    .hdr-btn {
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid var(--rule);
      background: var(--panel);
      font-size: 12.5px;
      font-family: var(--font);
      color: var(--ink);
      cursor: pointer;
    }
    .hdr-btn:hover:not(:disabled) { border-color: var(--sub); }
    .hdr-btn--primary {
      padding: 8px 16px;
      border: none;
      background: var(--rg-invert-bg, #0A0A0A);
      color: var(--rg-invert-fg, #fff);
      font-weight: 500;
    }
    .hdr-btn--primary:hover:not(:disabled) { background: var(--rg-invert-hover, #262626); }
    .hdr-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Tabs */
    .tabs-nav { display: flex; gap: 22px; }
    .tab-btn {
      padding: 10px 0;
      border: none;
      background: transparent;
      border-bottom: 2px solid transparent;
      color: var(--muted);
      font-weight: 400;
      font-size: 13px;
      font-family: var(--font);
      cursor: pointer;
      white-space: nowrap;
      transition: color 0.15s, border-color 0.15s;
    }
    .tab-btn:hover { color: var(--ink); }
    .tab-active {
      color: var(--ink) !important;
      border-bottom-color: var(--ink);
      font-weight: 500;
    }

    .slides-outer { overflow: hidden; }
    .slide { flex: 0 0 100%; }
    .page-body { padding: 0; }

    /* ── Profile slide ────────────────────── */
    .cp-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      padding: 24px 0 28px;
    }
    .cp-grid--single {
      grid-template-columns: 1fr;
    }
    .cp-card {
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 14px;
      padding: 24px 26px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    .cp-avatar-row { display: flex; gap: 14px; align-items: center; }
    .cp-avatar {
      width: 56px; height: 56px;
      border-radius: 14px;
      background: var(--rg-invert-bg, #0A0A0A);
      color: var(--rg-invert-fg, #fff);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 600;
      letter-spacing: -0.02em;
      flex-shrink: 0;
    }
    .cp-avatar-main { flex: 1; min-width: 0; }
    .cp-avatar-name {
      font-size: 16px;
      font-weight: 500;
      letter-spacing: -0.012em;
      color: var(--ink);
      margin: 0;
    }
    .cp-avatar-email {
      font-size: 12px;
      color: var(--muted);
      margin: 2px 0 0;
    }
    .cp-verified {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      margin-top: 8px;
      padding: 3px 9px;
      border-radius: 999px;
      background: var(--rg-accent-bg, #F0FAE0);
      color: var(--accent-text);
      font-size: 11px;
      font-weight: 500;
    }
    .cp-unverified {
      display: inline-block;
      margin-top: 8px;
      padding: 3px 9px;
      border-radius: 999px;
      background: var(--soft);
      color: var(--muted);
      font-size: 11px;
    }
    .cp-divider { height: 1px; background: var(--rule); }
    .cp-eyebrow {
      font-size: 10.5px;
      color: var(--muted);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0 0 14px;
    }
    .cp-card-sub {
      font-size: 12.5px;
      color: var(--muted);
      margin: 6px 0 0;
      line-height: 1.5;
    }

    .cp-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .cp-field { display: flex; flex-direction: column; gap: 6px; }
    .cp-field--full { grid-column: 1 / -1; }
    .cp-label-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
    }
    .cp-label {
      font-size: 11.5px;
      font-weight: 500;
      color: var(--ink);
      letter-spacing: -0.005em;
    }
    .cp-hint {
      font-size: 10.5px;
      color: var(--sub);
    }
    .cp-input {
      padding: 10px 12px;
      border: 1px solid var(--rule);
      border-radius: 8px;
      font-size: 13px;
      font-family: var(--font);
      color: var(--ink);
      background: var(--panel);
      outline: none;
      width: 100%;
      transition: border-color 0.15s;
    }
    .cp-input:focus { border-color: var(--ink); }
    .cp-input--area { min-height: 70px; resize: vertical; }

    .cp-loc-wrap { display: flex; flex-direction: column; gap: 6px; position: relative; }
    .cp-loc-dropdown {
      position: relative;
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 8px;
      max-height: 200px;
      overflow-y: auto;
      box-shadow: 0 4px 16px var(--rg-hover, rgba(0,0,0,0.05));
      z-index: 5;
    }
    .cp-loc-opt {
      display: block;
      width: 100%;
      text-align: left;
      padding: 8px 12px;
      border: none;
      background: transparent;
      font-size: 12px;
      color: var(--ink);
      font-family: var(--font);
      cursor: pointer;
    }
    .cp-loc-opt:hover { background: var(--soft); }
    .cp-loc-ok {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 8px;
      background: var(--rg-accent-bg, #F0FAE0);
      color: var(--accent-text);
      font-size: 11.5px;
    }

    .cp-banner {
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 12.5px;
    }
    .cp-banner--ok { background: var(--rg-accent-bg, #F0FAE0); color: var(--accent-text); }
    .cp-banner--err { background: rgba(220,38,38,0.06); color: #B91C1C; }

    /* Activity stat grid */
    .cp-stat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .cp-stat {
      padding: 14px 16px;
      border: 1px solid var(--rule);
      border-radius: 12px;
      background: var(--panel);
    }
    .cp-stat--full { grid-column: 1 / -1; }
    .cp-stat-label {
      font-size: 10.5px;
      color: var(--muted);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0;
    }
    .cp-stat-val {
      font-size: 22px;
      font-weight: 500;
      color: var(--ink);
      letter-spacing: -0.02em;
      line-height: 1;
      margin: 8px 0 0;
      font-variant-numeric: tabular-nums;
    }
    .cp-stat-val--warn { color: #B45309; }
    .cp-stat-val--mono { font-family: var(--mono); }
    .cp-stat-sub {
      font-size: 11px;
      color: var(--sub);
      margin: 6px 0 0;
    }

    /* ── Spending slide ───────────────────── */
    .cw-wrap {
      padding: 20px 0 28px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .cw-subhead {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
    }
    .cw-subhead-title {
      font-size: 22px;
      font-weight: 500;
      letter-spacing: -0.02em;
      color: var(--ink);
      margin: 6px 0 0;
      line-height: 1;
    }
    .cw-subhead-sub {
      font-size: 12.5px;
      color: var(--muted);
      margin: 6px 0 0;
    }
    .cw-actions {
      display: flex;
      gap: 6px;
      align-items: center;
      flex-wrap: wrap;
    }
    .cw-range {
      display: inline-flex;
      padding: 3px;
      border-radius: 999px;
      border: 1px solid var(--rule);
      background: var(--panel);
    }
    .cw-range-btn {
      padding: 6px 12px;
      border-radius: 999px;
      border: none;
      background: transparent;
      color: var(--muted);
      font-size: 11.5px;
      font-family: var(--font);
      cursor: pointer;
    }
    .cw-range-btn--active {
      background: var(--rg-invert-bg, #0A0A0A);
      color: var(--rg-invert-fg, #fff);
      font-weight: 500;
    }
    .cw-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid var(--rule);
      background: var(--panel);
      font-size: 12.5px;
      font-family: var(--font);
      color: var(--ink);
      cursor: pointer;
    }
    .cw-btn:hover { border-color: var(--sub); }
    .cw-btn--primary {
      padding: 8px 16px;
      border: none;
      background: var(--rg-invert-bg, #0A0A0A);
      color: var(--rg-invert-fg, #fff);
      font-weight: 500;
    }
    .cw-btn--primary:hover { background: var(--rg-invert-hover, #262626); }

    .cw-hero-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 14px;
    }
    .cw-balance-card {
      padding: 22px 26px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .cw-balance-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    .cw-balance-amount {
      font-size: 56px;
      font-weight: 500;
      letter-spacing: -0.035em;
      line-height: 1;
      margin: 8px 0 0;
      color: var(--ink);
      font-variant-numeric: tabular-nums;
      display: inline-flex;
      align-items: baseline;
    }
    .cw-balance-whole { color: var(--ink); }
    .cw-balance-dec {
      font-size: 18px;
      color: var(--muted);
      font-weight: 400;
      margin-left: 4px;
    }
    .cw-balance-growth {
      font-size: 12px;
      color: #B45309;
      margin: 8px 0 0;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .cw-balance-growth-dim { color: var(--muted); }
    .cw-spark {
      display: block;
      flex-shrink: 0;
      max-width: 200px;
    }
    .cw-split { margin-top: 8px; }
    .cw-split-bar {
      display: flex;
      height: 6px;
      border-radius: 999px;
      overflow: hidden;
      background: var(--soft);
    }
    .cw-split-seg { height: 100%; }
    .cw-split-legend {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      font-size: 11px;
      color: var(--muted);
      flex-wrap: wrap;
      gap: 8px;
    }
    .cw-split-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 3px;
      margin-right: 4px;
    }

    .cw-stat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 10px;
    }
    .cw-activity-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
    }
    .cw-stat {
      padding: 16px 18px;
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 12px;
    }
    .cw-stat-label {
      font-size: 10.5px;
      color: var(--muted);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0;
    }
    .cw-stat-val {
      font-size: 22px;
      font-weight: 500;
      color: var(--ink);
      letter-spacing: -0.02em;
      line-height: 1;
      margin: 8px 0 0;
      font-variant-numeric: tabular-nums;
    }
    .cw-stat-val--accent { color: #15803D; }
    .cw-stat-val--warn { color: #B45309; }
    .cw-stat-val--mono { font-family: var(--mono); }
    .cw-stat-sub {
      font-size: 11px;
      color: var(--sub);
      margin: 6px 0 0;
    }

    .cw-bottom-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 14px;
    }
    .cw-tx-card { padding: 0; overflow: hidden; }
    .cw-tx-head {
      padding: 16px 22px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--rule);
      flex-wrap: wrap;
      gap: 10px;
    }
    .cw-tx-head-left {
      font-size: 12px;
      font-weight: 500;
      color: var(--ink);
      letter-spacing: -0.005em;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .cw-tx-count {
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
    .cw-tx-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .cw-pill {
      padding: 5px 10px;
      border-radius: 999px;
      border: 1px solid var(--rule);
      background: var(--panel);
      color: var(--muted);
      font-size: 11px;
      font-family: var(--font);
      cursor: pointer;
    }
    .cw-pill--active {
      background: var(--rg-invert-bg, #0A0A0A);
      color: var(--rg-invert-fg, #fff);
      border-color: var(--ink);
    }
    .cw-tx-empty {
      padding: 40px 32px;
      text-align: center;
    }
    .cw-tx-empty-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--ink);
      margin: 0;
    }
    .cw-tx-empty-sub {
      font-size: 12.5px;
      color: var(--muted);
      margin: 6px auto 0;
      max-width: 360px;
      line-height: 1.5;
    }

    /* Payment method (dark card) */
    .cw-payout-card {
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .cw-payout-title {
      font-size: 12px;
      font-weight: 500;
      color: var(--ink);
      letter-spacing: -0.005em;
      margin: 0;
    }
    .cw-payout-bank {
      padding: 14px 16px;
      border-radius: 12px;
      background: var(--rg-invert-bg, #0A0A0A);
      color: var(--rg-invert-fg, #fff);
      display: flex;
      flex-direction: column;
      gap: 14px;
      position: relative;
      overflow: hidden;
    }
    .cw-payout-bank-glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 100% 0%, rgba(132,204,22,0.2), transparent 60%);
      pointer-events: none;
    }
    .cw-payout-bank > *:not(.cw-payout-bank-glow) { position: relative; }
    .cw-payout-bank-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cw-payout-bank-label {
      font-size: 10.5px;
      color: var(--rg-sub, #A3A3A3);
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .cw-payout-bank-badge {
      font-size: 10.5px;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--accent);
      color: var(--accent-ink);
      font-weight: 600;
    }
    .cw-payout-bank-num {
      font-size: 14px;
      font-family: var(--mono);
      letter-spacing: 0.06em;
      margin: 0;
    }
    .cw-payout-bank-foot {
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      color: var(--rg-sub, #A3A3A3);
    }
    .cw-payout-add {
      padding: 8px;
      border-radius: 8px;
      border: 1px solid var(--rule);
      background: var(--panel);
      font-size: 11.5px;
      font-family: var(--font);
      color: var(--ink);
      cursor: pointer;
    }
    .cw-payout-add:hover { border-color: var(--sub); }
    .cw-payout-auto {
      border-top: 1px solid var(--rule);
      padding-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .cw-payout-auto-label {
      font-size: 10.5px;
      color: var(--muted);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0;
    }
    .cw-payout-auto-text {
      font-size: 11.5px;
      color: var(--muted);
      line-height: 1.5;
      margin: 0;
    }
    .cw-payout-toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }
    .cw-payout-toggle-label {
      font-size: 12px;
      color: var(--ink);
    }
    .cw-toggle {
      width: 38px;
      height: 22px;
      border-radius: 999px;
      border: none;
      background: var(--rule);
      position: relative;
      cursor: pointer;
      padding: 0;
      transition: background 0.15s;
      flex-shrink: 0;
    }
    .cw-toggle--on { background: var(--ink); }
    .cw-toggle-knob {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 16px;
      height: 16px;
      border-radius: 999px;
      background: var(--rg-panel, #fff);
      transition: left 0.15s, background 0.15s;
    }
    .cw-toggle--on .cw-toggle-knob {
      left: 18px;
      background: var(--accent);
    }

    .cw-budget-row {
      margin-top: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .cw-budget-input-wrap {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      border: 1px solid var(--rule);
      border-radius: 10px;
      background: var(--panel);
      width: 140px;
    }
    .cw-budget-input-wrap:focus-within { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(10,10,10,0.06); }
    .cw-budget-prefix {
      font-family: var(--mono, 'Geist Mono', monospace);
      color: var(--muted);
      font-size: 13px;
    }
    .cw-budget-input {
      border: none;
      outline: none;
      background: transparent;
      width: 100%;
      font-family: var(--mono, 'Geist Mono', monospace);
      font-size: 13px;
      color: var(--ink);
      padding: 0;
    }
    .cw-budget-input::placeholder { color: var(--sub); }
    .cw-budget-suffix {
      font-size: 12px;
      color: var(--muted);
    }

    @media (max-width: 1080px) {
      .cw-hero-grid { grid-template-columns: 1fr; }
      .cw-stat-grid { grid-template-columns: 1fr 1fr; }
      .cw-activity-row { grid-template-columns: repeat(3, 1fr); }
      .cw-bottom-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .cw-activity-row { grid-template-columns: 1fr 1fr; }
      .cw-subhead { flex-direction: column; align-items: flex-start; }
      .cw-actions { width: 100%; flex-wrap: wrap; }
      .cw-balance-amount { font-size: 42px; }
      .cw-spark { display: none; }
    }

    /* ── Identity slide ───────────────────── */
    .ci-grid {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 16px;
      padding: 20px 0 28px;
    }
    .ci-left { display: flex; flex-direction: column; gap: 14px; }
    .ci-card {
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 14px;
      padding: 20px 24px;
    }
    .ci-progress-num {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-top: 8px;
      font-variant-numeric: tabular-nums;
    }
    .ci-progress-done {
      font-size: 36px;
      font-weight: 500;
      letter-spacing: -0.03em;
      color: var(--ink);
      line-height: 1;
    }
    .ci-progress-total {
      font-size: 36px;
      font-weight: 500;
      letter-spacing: -0.03em;
      color: var(--muted);
      line-height: 1;
    }
    .ci-progress-label {
      font-size: 12px;
      color: var(--muted);
      margin-left: 4px;
    }
    .ci-bar {
      margin-top: 14px;
      height: 6px;
      border-radius: 999px;
      background: var(--soft);
      overflow: hidden;
    }
    .ci-bar-fill {
      height: 100%;
      background: var(--ink);
      transition: width 0.3s;
    }
    .ci-bar-meta {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 11px;
      color: var(--muted);
      font-family: var(--mono);
    }

    .ci-checklist { padding: 0; overflow: hidden; }
    .ci-checklist-head {
      padding: 14px 20px;
      border-bottom: 1px solid var(--rule);
      font-size: 12px;
      font-weight: 500;
      color: var(--ink);
    }
    .ci-step {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--rule);
    }
    .ci-step:last-child { border-bottom: none; }
    .ci-step--focus { background: var(--soft); }
    .ci-step-dot {
      width: 22px;
      height: 22px;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 10.5px;
      font-weight: 500;
      font-family: var(--mono);
      color: var(--muted);
    }
    .ci-step-dot--done { background: var(--ink); }
    .ci-step-dot--todo,
    .ci-step-dot--optional {
      border: 1.5px dashed var(--rule);
      background: var(--panel);
    }
    .ci-step-main { flex: 1; min-width: 0; }
    .ci-step-label {
      font-size: 13px;
      color: var(--ink);
      font-weight: 500;
      margin: 0;
    }
    .ci-step-hint {
      font-size: 11.5px;
      color: var(--muted);
      margin: 2px 0 0;
    }
    .ci-step-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: 10.5px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .ci-step-pill--done     { background: var(--rg-accent-bg, #F0FAE0); color: var(--accent-text); }
    .ci-step-pill--todo     { background: var(--panel); color: var(--muted); border: 1px solid var(--rule); }
    .ci-step-pill--optional { background: var(--soft); color: var(--muted); }

    .ci-trust {
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .ci-trust-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--soft);
      color: var(--ink);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .ci-trust-main { flex: 1; }
    .ci-trust-title {
      font-size: 12.5px;
      color: var(--ink);
      font-weight: 500;
      margin: 0;
    }
    .ci-trust-sub {
      font-size: 11px;
      color: var(--muted);
      margin: 2px 0 0;
      line-height: 1.5;
    }

    .ci-right {
      padding: 22px 26px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .ci-right-head { display: flex; justify-content: space-between; gap: 12px; }
    .ci-right-title {
      font-size: 18px;
      font-weight: 500;
      letter-spacing: -0.012em;
      color: var(--ink);
      margin: 6px 0 0;
    }
    .ci-right-sub {
      font-size: 12px;
      color: var(--muted);
      margin: 4px 0 0;
      line-height: 1.5;
    }
    .ci-right-body app-verify-identity { display: block; }

    /* ── Payment / Security shared section ── */
    .cs-wrap {
      padding: 20px 0 32px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .cs-section {
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 14px;
      overflow: hidden;
    }
    .cs-section--danger { border-color: var(--rg-danger-rule, #FECACA); }
    .cs-head {
      padding: 20px 24px 16px;
      display: flex;
      gap: 14px;
      align-items: flex-start;
      border-bottom: 1px solid var(--rule);
    }
    .cs-head--danger {
      background: var(--rg-danger-bg, #FEF2F2);
      border-bottom-color: var(--rg-danger-rule, #FECACA);
    }
    .cs-head-icon {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: var(--soft);
      color: var(--ink);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .cs-head-icon--danger {
      background: var(--rg-panel, #FFFFFF);
      color: #DC2626;
    }
    .cs-head-main { flex: 1; }
    .cs-head-eyebrow {
      font-size: 10.5px;
      color: var(--muted);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0;
    }
    .cs-head-eyebrow--danger { color: #DC2626; }
    .cs-head-title {
      font-size: 18px;
      font-weight: 500;
      color: var(--ink);
      margin: 4px 0 0;
      letter-spacing: -0.015em;
    }
    .cs-head-title--danger { color: #DC2626; }
    .cs-head-sub {
      font-size: 13px;
      color: var(--muted);
      margin: 6px 0 0;
      line-height: 1.5;
      max-width: 560px;
    }
    .cs-body { padding: 18px 24px 22px; }
    .cs-msg { font-size: 12px; color: var(--muted); margin: 0; }
    .cs-msg--ok { color: var(--accent-text); }
    .cs-msg--err { color: #B91C1C; }

    .cs-fields-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 12px;
    }
    .cs-field--full { grid-column: 1 / -1; }
    .cs-save-btn {
      align-self: flex-start;
      padding: 9px 16px;
      border-radius: 10px;
      border: none;
      background: var(--rg-invert-bg, #0A0A0A);
      color: var(--rg-invert-fg, #fff);
      font-size: 12.5px;
      font-family: var(--font);
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
      margin-top: 8px;
    }
    .cs-save-btn:hover:not(:disabled) { background: var(--rg-invert-hover, #262626); }
    .cs-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .cs-save-btn--lime {
      background: var(--accent);
      color: var(--accent-ink);
      font-weight: 600;
    }
    .cs-save-btn--lime:hover:not(:disabled) { background: var(--rg-accent-hover, var(--rg-accent-hover, var(--rg-accent-hover, #A3E635))); }
    .cs-save-btn--ghost {
      background: var(--panel);
      color: var(--ink);
      border: 1px solid var(--rule);
    }
    .cs-save-btn--ghost:hover:not(:disabled) { background: var(--soft); border-color: var(--sub); }

    /* Payment cards */
    .cp-empty {
      padding: 36px 24px;
      text-align: center;
      border: 1px dashed var(--rule);
      border-radius: 10px;
      background: var(--soft);
    }
    .cp-empty-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--ink);
      margin: 0;
    }
    .cp-empty-sub {
      font-size: 12.5px;
      color: var(--muted);
      margin: 6px auto 0;
      max-width: 360px;
      line-height: 1.5;
    }
    .cp-card-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 14px;
    }
    .cp-pm-tile {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* Card-shaped preview */
    .cp-pm-preview {
      position: relative;
      padding: 18px;
      border-radius: 12px;
      background: linear-gradient(135deg, #1F2937 0%, #0F172A 100%);
      color: #fff;
      display: flex;
      flex-direction: column;
      gap: 14px;
      min-height: 150px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(10,10,10,0.04);
    }
    .cp-pm-preview::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at top right, rgba(255,255,255,0.08), transparent 60%);
      pointer-events: none;
    }
    .cp-pm-preview--visa { background: linear-gradient(135deg, #1A1F71 0%, #0B1043 100%); }
    .cp-pm-preview--mastercard { background: linear-gradient(135deg, #1A1A1A 0%, #2B1212 60%, #6B0712 100%); }
    .cp-pm-preview--amex { background: linear-gradient(135deg, #0F4C81 0%, #006FCF 100%); }
    .cp-pm-preview-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      z-index: 1;
    }
    .cp-pm-preview-brand {
      font-size: 10px;
      letter-spacing: 0.22em;
      font-weight: 500;
      color: rgba(255,255,255,0.7);
      text-transform: uppercase;
    }
    .cp-pm-preview-chip {
      width: 28px;
      height: 22px;
      border-radius: 4px;
      background: linear-gradient(135deg, #C8B273 0%, #9A8453 100%);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12);
    }
    .cp-pm-preview-num {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: var(--mono);
      font-size: 15px;
      letter-spacing: 0.04em;
      color: #fff;
      position: relative;
      z-index: 1;
      margin-top: 4px;
    }
    .cp-pm-preview-dots {
      letter-spacing: 0.18em;
      color: rgba(255,255,255,0.45);
    }
    .cp-pm-preview-last {
      color: #fff;
      font-variant-numeric: tabular-nums;
    }
    .cp-pm-preview-bottom {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: 0.18em;
      color: rgba(255,255,255,0.55);
      position: relative;
      z-index: 1;
      margin-top: auto;
    }
    .cp-pm-preview-exp { color: rgba(255,255,255,0.8); }

    /* Meta row under the card (matches the ID-upload row) */
    .cp-pm-meta-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 4px 0;
    }
    .cp-pm-meta-check {
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: var(--accent);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .cp-pm-meta-main { flex: 1; min-width: 0; }
    .cp-pm-meta-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--ink);
      margin: 0;
      line-height: 1.2;
    }
    .cp-pm-meta-sub {
      font-size: 11.5px;
      color: var(--muted);
      margin: 2px 0 0;
      font-family: var(--mono);
    }
    .cp-pm-meta-del {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s, background 0.15s;
    }
    .cp-pm-meta-del:hover:not(:disabled) {
      background: rgba(239,68,68,0.08);
      color: #DC2626;
    }
    .cp-pm-meta-del:disabled { opacity: 0.5; cursor: not-allowed; }
    .cp-pm-meta-del-text {
      font-size: 11px;
      font-weight: 500;
    }
    .cp-pm-add-btn {
      flex-shrink: 0;
      align-self: flex-start;
      padding: 9px 14px;
      border-radius: 10px;
      border: none;
      background: var(--rg-invert-bg, #0A0A0A);
      color: var(--rg-invert-fg, #fff);
      font-size: 12.5px;
      font-family: var(--font);
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
    }
    .cp-pm-add-btn:hover:not(:disabled) { background: var(--rg-invert-hover, #1f1f1f); }
    .cp-pm-add-btn:disabled { opacity: 0.65; cursor: not-allowed; }
    .cp-pm-add-btn--ghost {
      background: var(--panel);
      color: var(--ink);
      border: 1px solid var(--rule);
    }
    .cp-pm-add-btn--ghost:hover:not(:disabled) { background: var(--soft); }

    .cp-card-form {
      padding: 16px;
      border: 1px solid var(--rule);
      border-radius: 12px;
      background: var(--soft);
      margin-bottom: 16px;
    }
    .cp-card-form-lbl {
      display: block;
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0 0 8px;
    }
    .cp-card-form-field {
      padding: 12px 14px;
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 10px;
      min-height: 44px;
    }
    .cp-card-form-hint {
      font-size: 11.5px;
      color: var(--muted);
      margin: 8px 0 0;
    }
    .cp-card-form-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 14px;
    }

    /* Report a problem */
    .cs-mini-label {
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0 0 10px;
    }
    .cs-issue-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .cs-issue {
      padding: 12px 14px;
      border: 1px solid var(--rule);
      border-radius: 10px;
      background: var(--panel);
      cursor: pointer;
      display: flex;
      gap: 10px;
      align-items: flex-start;
      text-align: left;
      font-family: var(--font);
    }
    .cs-issue:hover { border-color: var(--sub); }
    .cs-issue--active {
      border-color: var(--ink);
      background: var(--soft);
    }
    .cs-issue-radio {
      width: 14px;
      height: 14px;
      border-radius: 999px;
      border: 1.5px solid var(--rule);
      margin-top: 3px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .cs-issue--active .cs-issue-radio { border-color: var(--ink); }
    .cs-issue-radio-dot {
      width: 6px;
      height: 6px;
      border-radius: 3px;
      background: var(--ink);
    }
    .cs-issue-label {
      font-size: 13px;
      color: var(--ink);
      font-weight: 500;
      margin: 0;
    }
    .cs-issue-desc {
      font-size: 11.5px;
      color: var(--muted);
      margin: 2px 0 0;
      line-height: 1.4;
    }
    .cs-report-foot {
      margin-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .cs-report-hint { font-size: 11.5px; color: var(--sub); }
    .cs-report-sent {
      padding: 16px 18px;
      border: 1px solid rgba(132,204,22,0.4);
      border-radius: 12px;
      background: var(--rg-accent-bg, #F0FAE0);
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .cs-report-sent-icon {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      background: var(--accent);
      color: var(--accent-ink);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .cs-report-sent-main { flex: 1; }
    .cs-report-sent-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--ink);
      margin: 0;
    }
    .cs-report-sent-sub {
      font-size: 12.5px;
      color: var(--muted);
      margin: 2px 0 0;
    }

    /* Danger / delete */
    .cs-danger-list {
      background: var(--rg-danger-bg, #FEF2F2);
      border: 1px solid var(--rg-danger-rule, #FECACA);
      border-radius: 10px;
      padding: 14px 16px;
    }
    .cs-danger-list-title {
      font-size: 11px;
      color: #DC2626;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 600;
      margin: 0 0 8px;
    }
    .cs-danger-list ul {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .cs-danger-list li {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 13px;
      color: #7F1D1D;
    }
    .cs-danger-dot {
      width: 4px;
      height: 4px;
      border-radius: 2px;
      background: #DC2626;
      flex-shrink: 0;
    }
    .cs-delete-btn {
      margin-top: 14px;
      padding: 10px 16px;
      border-radius: 10px;
      border: 1px solid #DC2626;
      background: var(--panel);
      color: #DC2626;
      font-size: 13px;
      font-family: var(--font);
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .cs-delete-btn:hover { background: var(--rg-danger-bg, #FEF2F2); }
    .cs-delete-btn--solid {
      border: none;
      background: #DC2626;
      color: #fff;
    }
    .cs-delete-btn--solid:hover:not(:disabled) { background: #B91C1C; }
    .cs-delete-btn--solid:disabled {
      background: #FCA5A5;
      cursor: not-allowed;
    }
    .cs-delete-confirm {
      margin-top: 14px;
      padding: 16px 18px;
      border: 1px solid #DC2626;
      border-radius: 10px;
      background: var(--panel);
    }
    .cs-delete-typed {
      font-size: 13.5px;
      color: var(--ink);
      font-weight: 500;
      margin: 0;
    }
    .cs-delete-typed-word {
      font-family: var(--mono);
      background: var(--rg-danger-bg, #FEF2F2);
      color: #DC2626;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .cs-delete-typed-sub {
      font-size: 12px;
      color: var(--muted);
      margin: 4px 0 0;
    }
    .cs-delete-actions {
      margin-top: 12px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    /* Responsive */
    @media (max-width: 980px) {
      .cp-grid { grid-template-columns: 1fr; }
      .ci-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .inner { padding: 0 20px; }
      .cp-fields { grid-template-columns: 1fr; }
      .cp-stat-grid { grid-template-columns: 1fr; }
      .cs-fields-2 { grid-template-columns: 1fr; }
      .cs-issue-grid { grid-template-columns: 1fr; }
      .cp-card { padding: 20px 18px; }
    }
  `]
})
export class ClientProfileComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  profile = signal<ClientProfile | null>(null);
  activeTab = signal<'profile' | 'identity' | 'payment' | 'spending' | 'security'>('profile');
  tabIndex = computed(() => (['profile', 'identity', 'payment', 'spending', 'security'] as const).indexOf(this.activeTab()));
  saving = signal(false);
  saveSuccess = signal(false);
  saveError = signal<string | null>(null);
  confirmDelete = signal(false);
  deleting = signal(false);
  deleteError = signal<string | null>(null);
  showReportModal = signal(false);
  pwSaving = signal(false);
  pwSuccess = signal(false);
  pwError = signal<string | null>(null);
  pw = { current: '', next: '', confirm: '' };

  stats = signal<any | null>(null);

  paymentMethods = signal<any[]>([]);
  cardLoading = signal(false);
  removingCard = signal<string | null>(null);
  cardError = signal<string | null>(null);
  addingCard = signal(false);
  cardSuccess = signal<string | null>(null);
  exportingCsv = signal(false);
  cardFormOpen = signal(false);
  cardFormReady = signal(false);
  private stripe: Stripe | null = null;
  private stripeElements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;

  locationQuery = '';
  locationSuggestions = signal<NominatimResult[]>([]);
  locationConfirmed = signal(false);
  private locationTimer: ReturnType<typeof setTimeout> | null = null;

  edit = {
    firstName: '',
    lastName: '',
    phone: '',
    city: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
  };

  // ── Identity checklist ──
  idSteps = computed(() => {
    const p = this.profile();
    const verified = !!p?.idVerified;
    const phone = !!p?.phone;
    let firstTodoSeen = false;
    const makeStep = (id: string, label: string, hint: string, status: 'done' | 'todo' | 'optional') => {
      const focus = status === 'todo' && !firstTodoSeen;
      if (focus) firstTodoSeen = true;
      return { id, label, hint, status, focus };
    };
    return [
      makeStep('email', 'Email confirmed', p?.email ?? '—', 'done'),
      makeStep('phone', 'Phone verified', phone ? p!.phone! : 'Add a number we can reach you on', phone ? 'done' : 'todo'),
      makeStep('id', 'Government ID', verified ? 'Verified ✓' : 'Passport, national ID, or driver licence', verified ? 'done' : 'todo'),
      makeStep('address', 'Proof of address', 'Utility bill or bank statement, < 90 days', 'optional'),
    ];
  });
  idStepsDone     = computed(() => this.idSteps().filter(s => s.status === 'done').length);
  idStepsRequired = computed(() => this.idSteps().filter(s => s.status !== 'optional').length);
  idProgressPct   = computed(() => {
    const req = this.idStepsRequired();
    return req === 0 ? 0 : Math.round((this.idStepsDone() / req) * 100);
  });
  stepStatusLabel(s: 'done' | 'todo' | 'optional'): string {
    return { done: 'Verified', todo: 'Required', optional: 'Optional' }[s];
  }

  // ── Report ──
  readonly issueTypes = [
    { id: 'PAYMENT' as const, label: 'Payment or refund',   desc: 'Failed payment, refund request, charge dispute.' },
    { id: 'CLIENT'  as const, label: 'Issue with a worker', desc: 'No-show, quality, harassment.' },
    { id: 'BUG'     as const, label: 'Bug or app problem',  desc: 'Something looks broken or stopped working.' },
    { id: 'ACCOUNT' as const, label: 'Account or login',    desc: 'Sign-in trouble, 2FA, verification stuck.' },
    { id: 'OTHER'   as const, label: 'Something else',      desc: 'Describe it below in detail.' },
  ];
  reportCategory = signal<'PAYMENT' | 'CLIENT' | 'BUG' | 'ACCOUNT' | 'OTHER'>('PAYMENT');
  reportBody = '';
  reportSent = signal(false);
  reportSubmitting = signal(false);
  reportError = signal<string | null>(null);

  canSendReport(): boolean { return this.reportBody.trim().length >= 10; }

  sendInlineReport() {
    if (!this.canSendReport() || this.reportSubmitting()) return;
    this.reportSubmitting.set(true);
    this.reportError.set(null);
    const cat = this.reportCategory();
    const subject = this.issueTypes.find(t => t.id === cat)?.label ?? 'Support request';
    this.api.submitReport({
      category: cat,
      subject,
      description: this.reportBody.trim(),
    }).subscribe({
      next: () => {
        this.reportSubmitting.set(false);
        this.reportSent.set(true);
        this.reportBody = '';
      },
      error: (err: any) => {
        this.reportSubmitting.set(false);
        this.reportError.set(err?.error?.message ?? 'Failed to submit. Try again.');
      },
    });
  }

  resetReport() {
    this.reportSent.set(false);
    this.reportBody = '';
    this.reportError.set(null);
  }

  deleteText = '';
  canDelete(): boolean {
    return this.deleteText.trim() === 'DELETE';
  }

  // ── Spending ──
  readonly spendRanges = ['7d', '30d', '90d', 'All'] as const;
  spendRange = signal<'7d' | '30d' | '90d' | 'All'>('All');
  autoTopup = signal(false);
  budgetTarget: number | null = null;
  txFilter = signal<'all' | 'payments' | 'escrow'>('all');

  spentWhole = computed(() => {
    const v = this.stats()?.totalSpent ?? 0;
    return Math.floor(v).toLocaleString();
  });
  spentDec = computed(() => {
    const v = this.stats()?.totalSpent ?? 0;
    return (v - Math.floor(v)).toFixed(2).slice(2);
  });
  avgPerJob = computed(() => {
    const s = this.stats();
    if (!s || !s.jobsCompleted) return '0';
    return (s.totalSpent / s.jobsCompleted).toFixed(0);
  });
  completionRate = computed(() => {
    const s = this.stats();
    if (!s || !s.jobsPosted) return 0;
    return Math.round((s.jobsCompleted / s.jobsPosted) * 100);
  });
  private sparkPoints = computed(() => {
    const months = (this.stats()?.byMonth ?? []) as Array<{ amount: number; label: string }>;
    const w = 200, h = 60, pad = 6;
    if (months.length === 0) {
      return [{ x: 0, y: h - pad }, { x: w, y: h - pad }];
    }
    const max = Math.max(...months.map((m) => m.amount), 1);
    const xs = months.length > 1 ? (w / (months.length - 1)) : w;
    return months.map((m, i) => ({
      x: months.length > 1 ? Math.round(i * xs) : w,
      y: Math.round(h - pad - (m.amount / max) * (h - pad * 2)),
    }));
  });
  sparkLinePath = computed(() => {
    const pts = this.sparkPoints();
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
  });
  sparkAreaPath = computed(() => {
    const pts = this.sparkPoints();
    if (pts.length === 0) return '';
    const last = pts[pts.length - 1];
    return `${pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ')} L${last.x} 60 L0 60 Z`;
  });
  sparkLastPoint = computed(() => {
    const pts = this.sparkPoints();
    return pts[pts.length - 1] ?? { x: 0, y: 60 };
  });

  categorySplit = computed(() => {
    const palette = ['var(--rg-ink, #0A0A0A)', 'var(--rg-accent, #84CC16)', '#F59E0B', 'var(--rg-sub, #A3A3A3)'];
    const cats = (this.stats()?.byCategory ?? []) as Array<{ name: string; amount: number; pct: number }>;
    return cats.map((c, i) => ({ ...c, color: palette[i] ?? 'var(--rg-sub, #A3A3A3)' }));
  });

  thisMonthLabel = computed(() => {
    const m = new Date().toLocaleString('en-US', { month: 'long' });
    return `spent so far in ${m}`;
  });
  awaitingLabel = computed(() => {
    const s = this.stats();
    if (!s) return '—';
    const n = Math.max(0, (s.jobsActive ?? 0));
    if (s.awaitingFunding > 0) return `${n} job${n === 1 ? '' : 's'} to fund`;
    return 'all jobs funded';
  });
  defaultCard = computed(() => this.paymentMethods()[0] ?? null);

  brandLabel(brand: string): string {
    if (brand === 'mastercard') return 'MC';
    return brand.slice(0, 4).toUpperCase();
  }

  ngOnInit() {
    this.api.getClientProfile().subscribe({
      next: (p) => this.setProfile(p as ClientProfile),
    });
    this.api.getClientStats().subscribe({ next: (s) => this.stats.set(s) });
    this.loadCards();

    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'profile' || tab === 'identity' || tab === 'payment' || tab === 'spending' || tab === 'security') {
      this.activeTab.set(tab);
    }
  }

  private loadCards() {
    this.cardLoading.set(true);
    this.api.getSavedPaymentMethods().subscribe({
      next: (methods) => { this.paymentMethods.set(methods); this.cardLoading.set(false); },
      error: () => this.cardLoading.set(false),
    });
  }

  async openCardForm() {
    this.cardError.set(null);
    this.cardSuccess.set(null);
    if (this.cardFormOpen()) return;
    this.cardFormOpen.set(true);
    this.cardFormReady.set(false);

    try {
      if (!this.stripe) {
        const s = await loadStripe(environment.stripePublicKey);
        if (!s) {
          this.cardError.set('Stripe failed to load. Check your network and try again.');
          this.cardFormOpen.set(false);
          return;
        }
        this.stripe = s;
      }

      this.stripeElements = this.stripe.elements();
      this.cardElement = this.stripeElements.create('card', {
        hidePostalCode: false,
        style: {
          base: {
            fontFamily: '"Geist", "Inter", system-ui, sans-serif',
            fontSize: '14px',
            color: 'var(--rg-ink, #0A0A0A)',
            '::placeholder': { color: 'var(--rg-sub, #A3A3A3)' },
          },
          invalid: { color: '#B91C1C' },
        },
      });

      // Wait for the host div to render in the next animation frame, then mount
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      this.cardElement.mount('#wpm-card-element');
      this.cardElement.on('ready', () => this.cardFormReady.set(true));
      this.cardElement.on('change', (ev) => {
        this.cardError.set(ev.error?.message ?? null);
      });
    } catch (err: unknown) {
      this.cardError.set((err as Error)?.message ?? 'Could not load card form');
      this.cardFormOpen.set(false);
    }
  }

  closeCardForm() {
    if (this.cardElement) {
      this.cardElement.unmount();
      this.cardElement.destroy();
      this.cardElement = null;
    }
    this.stripeElements = null;
    this.cardFormOpen.set(false);
    this.cardFormReady.set(false);
    this.addingCard.set(false);
    this.cardError.set(null);
  }

  async submitCard() {
    if (!this.stripe || !this.cardElement) return;
    this.addingCard.set(true);
    this.cardError.set(null);

    try {
      const { clientSecret } = await new Promise<{ clientSecret: string }>((resolve, reject) => {
        this.api.createCardSetupIntent().subscribe({
          next: (r) => resolve(r),
          error: (e) => reject(e),
        });
      });

      const result = await this.stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: this.cardElement },
      });

      if (result.error) {
        this.cardError.set(result.error.message ?? 'Card could not be saved');
        this.addingCard.set(false);
        return;
      }

      this.cardSuccess.set('Card saved.');
      setTimeout(() => this.cardSuccess.set(null), 4000);
      this.closeCardForm();
      this.loadCards();
    } catch (err: unknown) {
      const e = err as { error?: { message?: string }; message?: string };
      this.cardError.set(e?.error?.message ?? e?.message ?? 'Could not save card');
      this.addingCard.set(false);
    }
  }

  private setProfile(p: ClientProfile) {
    this.profile.set(p);
    this.edit = {
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone ?? '',
      city: p.city ?? '',
      address: p.address ?? '',
      latitude: p.latitude,
      longitude: p.longitude,
    };
    if (p.city || p.address) {
      this.locationQuery = [p.address, p.city].filter(Boolean).join(', ');
      this.locationConfirmed.set(p.latitude != null);
    }
  }

  searchLocation() {
    if (this.locationTimer) clearTimeout(this.locationTimer);
    if (this.locationQuery.length < 3) { this.locationSuggestions.set([]); return; }
    this.locationTimer = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.locationQuery)}&limit=5&addressdetails=1`;
        const res = await fetch(url);
        this.locationSuggestions.set(await res.json());
      } catch { this.locationSuggestions.set([]); }
    }, 350);
  }

  selectLocation(item: NominatimResult) {
    this.edit.latitude = parseFloat(item.lat);
    this.edit.longitude = parseFloat(item.lon);
    this.edit.city = item.address['city'] || item.address['town'] || item.address['village'] || item.address['county'] || '';
    this.edit.address = [item.address['road'], item.address['house_number']].filter(Boolean).join(' ') || '';
    this.locationQuery = item.display_name;
    this.locationSuggestions.set([]);
    this.locationConfirmed.set(true);
  }

  saveProfile() {
    this.saving.set(true);
    this.saveSuccess.set(false);
    this.saveError.set(null);
    this.api.updateClientProfile(this.edit).subscribe({
      next: (p) => {
        this.setProfile({ ...(p as ClientProfile), email: this.profile()!.email, idVerified: this.profile()!.idVerified });
        this.saving.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: (err) => {
        this.saveError.set(err?.error?.message ?? 'Failed to save');
        this.saving.set(false);
      },
    });
  }

  changePassword() {
    if (!this.pw.current || !this.pw.next) {
      this.pwError.set('Please fill in all password fields.');
      return;
    }
    if (this.pw.next !== this.pw.confirm) {
      this.pwError.set('New passwords do not match.');
      return;
    }
    if (this.pw.next.length < 8) {
      this.pwError.set('New password must be at least 8 characters.');
      return;
    }
    this.pwSaving.set(true);
    this.pwError.set(null);
    this.api.changePassword(this.pw.current, this.pw.next).subscribe({
      next: () => {
        this.pw = { current: '', next: '', confirm: '' };
        this.pwSaving.set(false);
        this.pwSuccess.set(true);
        setTimeout(() => this.pwSuccess.set(false), 3000);
      },
      error: (err) => {
        this.pwError.set(err?.error?.message ?? 'Failed to update password');
        this.pwSaving.set(false);
      },
    });
  }

  removeCard(methodId: string) {
    this.removingCard.set(methodId);
    this.cardError.set(null);
    this.api.removePaymentMethod(methodId).subscribe({
      next: () => {
        this.paymentMethods.update(list => list.filter(m => m.id !== methodId));
        this.removingCard.set(null);
      },
      error: (err) => {
        this.cardError.set(err?.error?.message ?? 'Failed to remove card');
        this.removingCard.set(null);
      },
    });
  }

  exportCsv() {
    this.exportingCsv.set(true);
    this.api.getClientTransactions().subscribe({
      next: (rows) => {
        const headers = ['Date', 'Job', 'Category', 'Worker', 'Status', 'Total (EUR)', 'Platform fee (EUR)', 'Worker payout (EUR)'];
        const escape = (v: unknown) => {
          const s = v == null ? '' : String(v);
          return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const lines: string[] = [headers.join(',')];
        for (const r of rows ?? []) {
          lines.push([
            new Date(r.date).toISOString().slice(0, 10),
            escape(r.jobTitle),
            escape(r.category),
            escape(r.worker),
            escape(r.status),
            (r.totalAmount ?? 0).toFixed(2),
            (r.platformFee ?? 0).toFixed(2),
            (r.workerPayout ?? 0).toFixed(2),
          ].join(','));
        }
        const csv = '﻿' + lines.join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `robosgig-spending-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this.exportingCsv.set(false);
      },
      error: () => this.exportingCsv.set(false),
    });
  }

  deleteAccount() {
    if (!this.canDelete()) return;
    this.deleting.set(true);
    this.deleteError.set(null);
    this.api.deleteAccount().subscribe({
      next: () => {
        this.auth.logout();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.deleteError.set(err?.error?.message ?? 'Failed to delete account');
        this.deleting.set(false);
      },
    });
  }
}
