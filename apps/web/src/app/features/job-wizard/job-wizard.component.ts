import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, AnalyzeJobResponse } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

type WizardStep = 'input' | 'loading' | 'preview' | 'confirmed';
interface NominatimResult { display_name: string; lat: string; lon: string; address: Record<string, string>; }

@Component({
  selector: 'app-job-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="wiz">

      <!-- STEP 1: Input -->
      @if (step() === 'input') {
        <div class="input-view">
          <div class="input-inner">

            <!-- Page header -->
            <header class="pj-header">
              <div>
                <p class="pj-eyebrow">Post a job</p>
                <h1 class="pj-title">Tell us what you need — we'll write the post.</h1>
                <p class="pj-sub">
                  Describe the problem in plain language. Our AI drafts the listing,
                  suggests a fair price band, and matches workers near you.
                  You stay in control — review, edit, then publish.
                </p>
              </div>
            </header>

            <div class="pj-grid">

              <!-- MAIN: composer -->
              <div class="pj-main">
                <div class="pj-composer-wrap">

                  <!-- Robot peeking over the top-right edge of the composer -->
                  <div class="peek-robot-wrap">
                    <div class="robot-scene">
                      <div class="think-dot think-1"></div>
                      <div class="think-dot think-2"></div>
                      <div class="think-dot think-3"></div>
                      <div class="robot">
                        <div class="ant-ball"></div>
                        <div class="ant-stick"></div>
                        <div class="r-head">
                          <div class="r-ear r-ear-l"></div>
                          <div class="r-ear r-ear-r"></div>
                          <div class="r-face">
                            <div class="r-eyes-row">
                              <div class="r-eye r-eye-l"><div class="r-pupil"></div></div>
                              <div class="r-eye r-eye-r"><div class="r-pupil"></div></div>
                            </div>
                            <div class="r-mouth"></div>
                          </div>
                        </div>
                        <div class="r-neck"></div>
                        <div class="r-body">
                          <div class="r-arm r-arm-l"></div>
                          <div class="r-arm r-arm-r"></div>
                          <div class="r-panel">
                            <div class="r-led led-1"></div>
                            <div class="r-led led-2"></div>
                            <div class="r-led led-3"></div>
                          </div>
                        </div>
                        <div class="r-legs">
                          <div class="r-leg"><div class="r-foot"></div></div>
                          <div class="r-leg"><div class="r-foot"></div></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="pj-composer">
                    <!-- Composer head -->
                    <div class="pj-comp-head">
                      <div class="pj-comp-head-left">
                        <span class="pj-step-num">1</span>
                        <span class="pj-comp-title">Describe your task</span>
                      </div>
                      <span class="pj-ai-pill">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z"/></svg>
                        AI-powered
                      </span>
                    </div>

                    <div class="pj-comp-body">
                      <label class="pj-label">What's going on?</label>
                      <textarea
                        class="pj-textarea"
                        [(ngModel)]="rawInput"
                        maxlength="600"
                        placeholder="e.g. My kitchen sink is leaking and there's water under the cabinet. The pipe seems cracked and I need a plumber to fix it asap…"
                        (keydown.meta.enter)="analyze()"
                      ></textarea>

                      <div class="pj-hint-row">
                        <span class="pj-hint-text">More detail = better price + closer matches.</span>
                        <span class="pj-counter">{{ rawInput.length }} / 600</span>
                      </div>

                      <!-- Try chips -->
                      <div class="pj-try-row">
                        <span class="pj-try-label">Try:</span>
                        @for (ex of examples; track ex) {
                          <button class="pj-try-chip" (click)="rawInput = ex" type="button">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                            {{ ex }}
                          </button>
                        }
                      </div>

                      <!-- Meta row: location / photos / urgency -->
                      <div class="pj-meta-row">
                        <!-- Location -->
                        <div class="pj-meta-field">
                          <span class="pj-meta-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-7.58 7-13a7 7 0 0 0-14 0c0 5.42 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>
                          </span>
                          <input
                            class="pj-meta-input"
                            [(ngModel)]="locationQuery"
                            (ngModelChange)="onLocationInput()"
                            (blur)="onLocationBlur()"
                            placeholder="Address or postcode…"
                          />
                          <button class="pj-meta-action" (click)="useMyLocation()" [disabled]="locationLoading()" type="button">
                            @if (locationLoading()) { … } @else { Use current }
                          </button>
                          @if (locationSuggestions().length > 0) {
                            <div class="pj-loc-dropdown">
                              @for (item of locationSuggestions(); track item.display_name) {
                                <button class="pj-loc-opt" (mousedown)="selectLocation(item)" type="button">
                                  {{ item.display_name }}
                                </button>
                              }
                            </div>
                          }
                        </div>

                        <!-- Urgency segmented -->
                        <div class="pj-urg">
                          @for (u of urgencyOpts; track u.id) {
                            <button
                              class="pj-urg-btn"
                              [class.pj-urg-btn--on]="urgency() === u.id"
                              (click)="urgency.set(u.id)"
                              type="button"
                            >
                              <span class="pj-urg-label">{{ u.label }}</span>
                              <span class="pj-urg-sub">{{ u.ti }}</span>
                            </button>
                          }
                        </div>
                      </div>

                      @if (locationConfirmed()) {
                        <div class="pj-loc-confirmed">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                          {{ jobLocation.city }}{{ jobLocation.address ? ' · ' + jobLocation.address : '' }}
                        </div>
                      }
                      @if (locationError()) {
                        <div class="pj-loc-error">{{ locationError() }}</div>
                      }
                    </div>

                    <!-- Composer footer -->
                    <div class="pj-comp-foot">
                      <span class="pj-foot-note">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></svg>
                        Nothing is published yet — you'll review the draft first.
                      </span>
                      <div class="pj-foot-actions">
                        <button
                          class="pj-btn pj-btn--primary"
                          (click)="analyze()"
                          [disabled]="!rawInput.trim() || !locationConfirmed()"
                          type="button"
                        >
                          <span class="pj-btn-spark">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z"/></svg>
                          </span>
                          Generate listing
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- RIGHT RAIL -->
              <aside class="pj-rail">
                <div class="pj-rail-card">
                  <p class="pj-rail-heading">How it works</p>
                  <div class="pj-rail-step">
                    <span class="pj-rail-num pj-rail-num--active">1</span>
                    <div>
                      <p class="pj-rail-step-label">Describe the task</p>
                      <p class="pj-rail-step-det">Plain language is fine — typos, fragments. The more you give us, the tighter the price band.</p>
                    </div>
                  </div>
                  <div class="pj-rail-step">
                    <span class="pj-rail-num">2</span>
                    <div>
                      <p class="pj-rail-step-label pj-rail-muted">Review the AI draft</p>
                      <p class="pj-rail-step-det">Edit the title, description, category, and price band before anything goes live.</p>
                    </div>
                  </div>
                  <div class="pj-rail-step">
                    <span class="pj-rail-num">3</span>
                    <div>
                      <p class="pj-rail-step-label pj-rail-muted">Choose a worker</p>
                      <p class="pj-rail-step-det">Top matches arrive within minutes. Chat, accept, and payment holds in escrow until done.</p>
                    </div>
                  </div>
                </div>

                <div class="pj-rail-card">
                  <p class="pj-rail-heading">Tips for a better draft</p>
                  <ul class="pj-rail-tips">
                    <li><span class="pj-rail-dot"></span>Include rough size or count (e.g. "3 m² of tile", "12 frames")</li>
                    <li><span class="pj-rail-dot"></span>Mention access — stairs, parking, pets, lift</li>
                    <li><span class="pj-rail-dot"></span>If you have a deadline, say when ("before Friday 6pm")</li>
                    <li><span class="pj-rail-dot"></span>Add details visible to you (leak, broken item, layout)</li>
                  </ul>
                </div>

                <div class="pj-rail-card">
                  <p class="pj-rail-heading">Privacy</p>
                  <div class="pj-privacy">
                    <span class="pj-privacy-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3z"/></svg>
                    </span>
                    <div>
                      <p class="pj-privacy-title">Your address stays hidden</p>
                      <p class="pj-privacy-sub">Workers only see the neighbourhood until you accept their offer. We don't train on your messages.</p>
                    </div>
                  </div>
                </div>
              </aside>

            </div>
          </div>
        </div>
      }

      <!-- STEP 2: Loading -->
      @if (step() === 'loading') {
        <div class="loading-view">

          <div class="robot-scene">
            <!-- thinking bubbles -->
            <div class="think-dot think-1"></div>
            <div class="think-dot think-2"></div>
            <div class="think-dot think-3"></div>

            <div class="robot">
              <!-- antenna -->
              <div class="ant-ball"></div>
              <div class="ant-stick"></div>

              <!-- head -->
              <div class="r-head">
                <div class="r-ear r-ear-l"></div>
                <div class="r-ear r-ear-r"></div>
                <div class="r-face">
                  <div class="r-eyes-row">
                    <div class="r-eye r-eye-l"><div class="r-pupil"></div></div>
                    <div class="r-eye r-eye-r"><div class="r-pupil"></div></div>
                  </div>
                  <div class="r-mouth"></div>
                </div>
              </div>

              <!-- neck -->
              <div class="r-neck"></div>

              <!-- body -->
              <div class="r-body">
                <div class="r-arm r-arm-l"></div>
                <div class="r-arm r-arm-r"></div>
                <div class="r-panel">
                  <div class="r-led led-1"></div>
                  <div class="r-led led-2"></div>
                  <div class="r-led led-3"></div>
                </div>
              </div>

              <!-- legs -->
              <div class="r-legs">
                <div class="r-leg"><div class="r-foot"></div></div>
                <div class="r-leg"><div class="r-foot"></div></div>
              </div>
            </div>
          </div>

          <h2 class="loading-title">Hang tight!</h2>
          <p class="loading-sub">Our AI is reading your request and finding workers nearby</p>

          <div class="phase-list">
            <div class="phase-item" [class.phase-done]="loadingPhase() >= 1" [class.phase-active]="loadingPhase() === 0">
              <div class="phase-icon">
                @if (loadingPhase() >= 1) {
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                } @else {
                  <div class="phase-pulse-dot"></div>
                }
              </div>
              <span>Understanding your problem</span>
            </div>
            <div class="phase-item" [class.phase-done]="loadingPhase() >= 2" [class.phase-active]="loadingPhase() === 1">
              <div class="phase-icon">
                @if (loadingPhase() >= 2) {
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                } @else {
                  <div class="phase-pulse-dot"></div>
                }
              </div>
              <span>Estimating fair price</span>
            </div>
            <div class="phase-item" [class.phase-done]="loadingPhase() >= 3" [class.phase-active]="loadingPhase() === 2">
              <div class="phase-icon">
                @if (loadingPhase() >= 3) {
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                } @else {
                  <div class="phase-pulse-dot"></div>
                }
              </div>
              <span>Finding best workers nearby</span>
            </div>
          </div>
        </div>
      }

      <!-- STEP 3: Preview -->
      @if (step() === 'preview' && result()) {
        <div class="preview-view">
          <div class="preview-top">
            <button class="back-link" (click)="reset()">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
              Edit
            </button>
            <div>
              <h2 class="preview-heading">Here's what we understood</h2>
              <p class="preview-summary">{{ result()!.jobPreview.summary }}</p>
            </div>
          </div>

          <div class="preview-grid">
            <!-- Job details -->
            <div class="pcard">
              <p class="card-label">
                Job Details
                <span class="edit-hint">Click any field to edit</span>
              </p>
              <div class="badge-row">
                <span class="badge-cat">{{ result()!.jobPreview.categoryName }}</span>
                <select class="urg-select urg-{{ editablePreview()!.urgency.toLowerCase() }}"
                  [value]="editablePreview()!.urgency"
                  (change)="patchPreview('urgency', $any($event.target).value)">
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>
              <input class="inline-title"
                [value]="editablePreview()!.title"
                (input)="patchPreview('title', $any($event.target).value)"
                placeholder="Job title" />
              <textarea class="inline-desc"
                [value]="editablePreview()!.description"
                (input)="patchPreview('description', $any($event.target).value); autoResize($any($event.target))"
                placeholder="Description"></textarea>
              <div class="meta-grid">
                <div class="meta-cell">
                  <span class="meta-label">Estimated price</span>
                  <div class="price-range-row">
                    <span class="currency">€</span>
                    <input class="inline-number" type="number" min="0"
                      [value]="editablePreview()!.priceMin"
                      (input)="patchPreview('priceMin', +$any($event.target).value)" />
                    <span class="price-sep">–</span>
                    <span class="currency">€</span>
                    <input class="inline-number" type="number" min="0"
                      [value]="editablePreview()!.priceMax"
                      (input)="patchPreview('priceMax', +$any($event.target).value)" />
                  </div>
                </div>
                <div class="meta-cell">
                  <span class="meta-label">Duration</span>
                  <div class="price-range-row">
                    <input class="inline-number" type="number" min="0" step="0.5"
                      [value]="editablePreview()!.estimatedHours"
                      (input)="patchPreview('estimatedHours', +$any($event.target).value)" />
                    <span class="meta-value">h</span>
                  </div>
                </div>
              </div>
              <div class="meta-cell scheduled-cell">
                <span class="meta-label">Scheduled date <span class="opt-label">(optional)</span></span>
                <input class="inline-date" type="date"
                  [min]="minDate()"
                  [value]="scheduledDate()"
                  (change)="scheduledDate.set($any($event.target).value)" />
              </div>

              @if (result()!.jobPreview.toolsNeeded.length > 0) {
                <div class="tools-row">
                  <span class="meta-label">Tools needed</span>
                  <div class="tools-chips">
                    @for (t of result()!.jobPreview.toolsNeeded; track t) {
                      <span class="tool-chip">{{ t }}</span>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Workers -->
            <div class="pcard">
              <p class="card-label">Best Matches Nearby</p>
              <div class="workers-list">
                @for (w of result()!.suggestedWorkers; track w.id; let i = $index) {
                  <div class="worker-row" [class.worker-top]="i === 0" [class.worker-selected]="selectedWorkerId() === w.id" (click)="selectedWorkerId.set(w.id)">
                    @if (i === 0) { <p class="top-tag">Best Match</p> }
                    <div class="worker-inner">
                      <div class="w-avatar">{{ w.firstName[0] }}{{ w.lastName[0] }}</div>
                      <div class="w-info">
                        <div class="w-name">{{ w.firstName }} {{ w.lastName }}
                          @if (w.idVerified) { <span class="verified-tag">✓</span> }
                        </div>
                        <div class="w-stats">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" style="vertical-align:-1px"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          {{ w.rating }} · {{ w.totalJobs }} jobs · {{ w.distanceKm }}km away
                        </div>
                        <div class="reasons">
                          @for (r of w.matchReasons.slice(0, 2); track r) {
                            <span class="reason-chip">{{ r }}</span>
                          }
                        </div>
                      </div>
                      <div class="w-right">
                        @if (w.hourlyRate) { <span class="rate">€{{ w.hourlyRate }}/hr</span> }
                        <span class="match-score">{{ w.matchScore }}%</span>
                        @if (auth.isLoggedIn()) {
                          <button class="btn-assign" (click)="requestWorker(w.id, w.firstName); $event.stopPropagation()" title="Posts your job and sends {{ w.firstName }} a direct request">
                            Hire {{ w.firstName }} →
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                }
                @if (result()!.suggestedWorkers.length === 0) {
                  <p class="no-workers">No workers found yet — post the job and workers will apply.</p>
                }
              </div>
            </div>
          </div>

          <div class="preview-actions">
            <button class="btn-ghost-pill" (click)="reset()">Edit request</button>
            @if (auth.isLoggedIn()) {
              @if (draftSaved()) {
                <span class="pj-draft-flash pj-draft-flash--ok">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                  Draft saved
                </span>
              } @else if (draftError()) {
                <span class="pj-draft-flash pj-draft-flash--err">{{ draftError() }}</span>
              }
              <button
                class="btn-ghost-pill"
                (click)="saveDraftFromPreview()"
                [disabled]="draftSaving()"
              >
                @if (draftSaving()) { Saving… } @else { Save draft }
              </button>
              <button class="btn-primary-pill" (click)="confirmJob()">Post this job</button>
            } @else {
              <div class="login-to-post">
                <span class="login-to-post-hint">You need an account to post</span>
                <a class="btn-primary-pill" routerLink="/login">Log in to post</a>
              </div>
            }
          </div>
        </div>
      }

      <!-- STEP 4: Confirmed -->
      @if (step() === 'confirmed') {
        <div class="confirmed-view">
          <div class="confirmed-visual">
            <div class="success-ring success-ring-3"></div>
            <div class="success-ring success-ring-2"></div>
            <div class="success-ring success-ring-1"></div>
            <div class="success-core">
              <svg width="26" height="26" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          @if (directAssignedWorker()) {
            <h2 class="confirmed-title">Request sent to {{ directAssignedWorker()!.firstName }}!</h2>
            <p class="confirmed-sub">{{ directAssignedWorker()!.firstName }} will review your request and confirm shortly.</p>
          } @else {
            <h2 class="confirmed-title">Job posted!</h2>
            <p class="confirmed-sub">We've notified the top matching workers nearby. You'll hear back shortly.</p>
          }
          <button class="btn-primary-pill" (click)="reset()">Post another job</button>
        </div>
      }

      <!-- Job limit upgrade prompt -->
      @if (jobLimitReached()) {
        <div class="limit-overlay">
          <div class="limit-card">
            <div class="limit-icon">
              <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h2 class="limit-title">Free plan limit reached</h2>
            <p class="limit-sub">Free accounts can post <strong>1 active job</strong> at a time. Complete or cancel your current job, or upgrade to Client Business for unlimited job posts.</p>
            <div class="limit-btns">
              <a routerLink="/pricing" class="limit-btn-primary">Upgrade to Business</a>
              <a routerLink="/dashboard/client" class="limit-btn-secondary">View my jobs</a>
            </div>
          </div>
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="err-toast">
          <span>{{ error() }}</span>
          <button class="err-close" (click)="error.set(null)">✕</button>
        </div>
      }

      @if (pendingRequest(); as p) {
        <div class="cm-overlay" (click)="cancelRequest()">
          <div class="cm-card" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
            <div class="cm-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </div>
            <h3 class="cm-title">Post job &amp; hire {{ p.firstName }}?</h3>
            <p class="cm-body">
              We'll post your job and send <strong>{{ p.firstName }}</strong> a direct request.
              They'll be the only worker contacted at first — if they decline, the job stays live for others to apply.
            </p>
            <div class="cm-actions">
              <button class="cm-btn cm-btn--ghost" (click)="cancelRequest()" type="button">Cancel</button>
              <button class="cm-btn cm-btn--primary" (click)="confirmRequest()" type="button">
                Yes, hire {{ p.firstName }}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </button>
            </div>
          </div>
        </div>
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
    .wiz {
      min-height: calc(100vh - 56px);
      font-family: var(--font);
      background: var(--bg);
      color: var(--ink);
      -webkit-font-smoothing: antialiased;
    }

    /* ── Input view ───────────────────────── */
    .input-view {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      min-height: calc(100vh - 56px);
      padding: 40px 32px 64px;
      position: relative;
      overflow: hidden;
      background: var(--bg);
    }
    .input-bg, .bg-orb { display: none; }
    .input-inner {
      max-width: 1180px;
      width: 100%;
      text-align: left;
      position: relative;
      z-index: 1;
    }
    .ai-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--rg-accent-bg, #F0FAE0);
      color: var(--accent-text);
      border: 1px solid #D9F0A3;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 14px;
    }
    .headline {
      font-size: clamp(2.25rem, 5vw, 48px);
      font-weight: 500;
      letter-spacing: -0.035em;
      color: var(--ink);
      margin: 0 0 14px;
      line-height: 1.05;
    }
    .sub {
      font-size: 14px;
      color: var(--muted);
      line-height: 1.55;
      max-width: 520px;
      margin: 0 auto 28px;
    }

    .input-box {
      background: var(--panel);
      border-radius: 16px;
      border: 1px solid var(--rule);
      padding: 22px 22px;
      box-shadow: 0 1px 0 rgba(10,10,10,0.02);
      margin-bottom: 14px;
      text-align: left;
    }
    /* Peeking robot on input step */
    .prompt-container {
      position: relative;
      margin-bottom: 14px;
      padding-top: 60px;
    }
    .prompt-container .input-box {
      position: relative;
      z-index: 1;
      margin-bottom: 0;
    }
    .peek-robot-wrap {
      position: absolute;
      top: -8px;
      right: 24px;
      transform: scale(0.46);
      transform-origin: top right;
      pointer-events: none;
      z-index: 0;
      filter: drop-shadow(0 6px 16px rgba(132,204,22,0.25));
    }

    /* AI prompt section */
    .ai-prompt-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .ai-prompt-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10.5px;
      font-weight: 500;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.14em;
    }
    .ai-spark {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--accent);
      flex-shrink: 0;
      animation: sparkPulse 2s ease-in-out infinite;
    }
    @keyframes sparkPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(132,204,22,0.5); }
      50%       { box-shadow: 0 0 0 6px rgba(132,204,22,0); }
    }
    .ai-prompt-badge {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--accent-text);
      background: var(--rg-accent-bg, #F0FAE0);
      border: 1px solid #D9F0A3;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .ai-prompt-wrap {
      border-radius: 12px;
      padding: 0;
      background: transparent;
      border: 1px solid var(--rule);
      margin-bottom: 10px;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .ai-prompt-wrap:focus-within {
      border-color: var(--ink);
      box-shadow: 0 0 0 3px rgba(132,204,22,0.15);
    }
    .main-input {
      width: 100%;
      border: none;
      border-radius: 12px;
      padding: 14px 16px;
      font-size: 14px;
      resize: none;
      outline: none;
      box-sizing: border-box;
      font-family: var(--font);
      color: var(--ink);
      line-height: 1.55;
      background: var(--panel);
      display: block;
    }
    .main-input::placeholder { color: var(--sub); }
    .input-hint {
      text-align: left;
      font-size: 11.5px;
      color: var(--sub);
      margin: 0 0 4px;
    }

    .examples-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      margin: 12px 0;
    }
    .examples-label {
      font-size: 11px;
      color: var(--sub);
      font-weight: 500;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .example-chip {
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 999px;
      padding: 5px 12px;
      font-size: 12px;
      cursor: pointer;
      color: var(--ink);
      font-family: var(--font);
      transition: all 0.12s;
    }
    .example-chip:hover {
      background: var(--rg-accent-bg, #F0FAE0);
      border-color: #D9F0A3;
      color: var(--accent-text);
    }

    .submit-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: var(--rg-invert-bg, #0A0A0A);
      color: var(--rg-invert-fg, #fff);
      border: none;
      padding: 13px 18px;
      border-radius: 12px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font);
      transition: background 0.15s, transform 0.1s;
    }
    .submit-btn:hover:not(:disabled) { background: var(--rg-invert-hover, #262626); }
    .submit-btn:active:not(:disabled) { transform: scale(0.99); }
    .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .footer-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-size: 11.5px;
      color: var(--sub);
      font-family: var(--mono);
    }
    .sep { color: var(--rule); }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Composer (new design) ──────────────── */
    .pj-header { margin-bottom: 28px; text-align: left; }
    .pj-eyebrow {
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0 0 6px;
    }
    .pj-title {
      font-size: clamp(2rem, 4vw, 32px);
      font-weight: 500;
      letter-spacing: -0.025em;
      line-height: 1.1;
      margin: 0;
      color: var(--ink);
    }
    .pj-sub {
      font-size: 13.5px;
      color: var(--muted);
      margin: 6px 0 0;
      max-width: 620px;
      line-height: 1.55;
    }

    .pj-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 20px;
      align-items: start;
      text-align: left;
    }
    .pj-main { min-width: 0; }

    .pj-composer-wrap {
      position: relative;
      padding-top: 56px;
    }
    .pj-composer-wrap .peek-robot-wrap {
      position: absolute;
      top: -8px;
      right: 32px;
      transform: scale(0.46);
      transform-origin: top right;
      pointer-events: none;
      z-index: 0;
      filter: drop-shadow(0 6px 16px rgba(132,204,22,0.25));
    }

    .pj-composer {
      position: relative;
      z-index: 1;
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 14px;
      overflow: hidden;
    }

    .pj-comp-head {
      padding: 18px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      border-bottom: 1px solid var(--rule);
    }
    .pj-comp-head-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .pj-step-num {
      width: 22px;
      height: 22px;
      border-radius: 999px;
      background: var(--rg-invert-bg, #0A0A0A);
      color: var(--rg-invert-fg, #fff);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-family: var(--mono);
      font-weight: 500;
    }
    .pj-comp-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--ink);
    }
    .pj-ai-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 999px;
      background: #EEF0FF;
      color: #3F3BC4;
      font-size: 11px;
      font-weight: 600;
    }

    .pj-comp-body { padding: 22px 22px 6px; }
    .pj-label {
      display: block;
      font-size: 10.5px;
      color: var(--muted);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 500;
      margin-bottom: 8px;
    }
    .pj-textarea {
      width: 100%;
      min-height: 160px;
      padding: 16px 18px;
      border: 1.5px solid var(--ink);
      border-radius: 12px;
      font-family: var(--font);
      font-size: 15px;
      color: var(--ink);
      line-height: 1.55;
      resize: vertical;
      outline: none;
      background: var(--panel);
      box-sizing: border-box;
    }
    .pj-textarea::placeholder { color: var(--sub); }
    .pj-textarea:focus { box-shadow: 0 0 0 3px rgba(132,204,22,0.15); }

    .pj-hint-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      font-size: 11.5px;
    }
    .pj-hint-text { color: var(--ink); }
    .pj-counter {
      font-family: var(--mono);
      color: var(--muted);
      font-variant-numeric: tabular-nums;
    }

    .pj-try-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 14px;
      align-items: center;
    }
    .pj-try-label {
      font-size: 11.5px;
      color: var(--muted);
      margin-right: 2px;
    }
    .pj-try-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: 999px;
      border: 1px solid var(--rule);
      background: var(--panel);
      color: var(--ink);
      font-size: 12px;
      font-family: var(--font);
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .pj-try-chip svg { color: var(--muted); flex-shrink: 0; }
    .pj-try-chip:hover { border-color: var(--sub); }

    .pj-meta-row {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: 10px;
      margin-top: 18px;
    }
    .pj-meta-field {
      border: 1px solid var(--rule);
      border-radius: 10px;
      padding: 10px 12px;
      background: var(--panel);
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 42px;
      position: relative;
    }
    .pj-meta-icon { color: var(--muted); display: inline-flex; flex-shrink: 0; }
    .pj-meta-input {
      flex: 1;
      min-width: 0;
      border: none;
      outline: none;
      background: transparent;
      font-family: var(--font);
      font-size: 13px;
      color: var(--ink);
    }
    .pj-meta-input::placeholder { color: var(--sub); }
    .pj-meta-action {
      border: none;
      background: transparent;
      color: var(--muted);
      font-family: var(--font);
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 6px;
      cursor: pointer;
      flex-shrink: 0;
    }
    .pj-meta-action:hover:not(:disabled) { color: var(--ink); background: var(--soft); }
    .pj-meta-action:disabled { opacity: 0.5; cursor: not-allowed; }

    .pj-loc-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(10,10,10,0.08);
      z-index: 5;
      max-height: 200px;
      overflow-y: auto;
    }
    .pj-loc-opt {
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
    .pj-loc-opt:hover { background: var(--soft); }

    .pj-loc-confirmed {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 10px;
      padding: 5px 10px;
      border-radius: 8px;
      background: var(--rg-accent-bg, #F0FAE0);
      color: var(--accent-text);
      font-size: 11.5px;
      font-weight: 500;
    }
    .pj-loc-error {
      margin-top: 10px;
      font-size: 12px;
      color: #B91C1C;
    }

    .pj-urg {
      display: flex;
      gap: 6px;
      border: 1px solid var(--rule);
      border-radius: 10px;
      padding: 4px;
      background: var(--panel);
    }
    .pj-urg-btn {
      flex: 1;
      padding: 8px 4px;
      border-radius: 7px;
      border: none;
      background: transparent;
      color: var(--muted);
      font-family: var(--font);
      font-size: 12px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      transition: background 0.15s, color 0.15s;
    }
    .pj-urg-btn--on {
      background: var(--rg-invert-bg, #0A0A0A);
      color: var(--rg-invert-fg, #fff);
    }
    .pj-urg-label { font-weight: 500; }
    .pj-urg-sub {
      font-size: 10px;
      color: var(--sub);
      font-family: var(--mono);
    }
    .pj-urg-btn--on .pj-urg-sub { color: var(--rg-sub, #A3A3A3); }

    .pj-comp-foot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 16px 22px;
      border-top: 1px solid var(--rule);
      margin-top: 22px;
      background: var(--rg-soft, #FCFCFA);
      flex-wrap: wrap;
    }
    .pj-foot-note {
      font-size: 11.5px;
      color: var(--muted);
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .pj-foot-actions { display: flex; gap: 8px; align-items: center; }
    .pj-draft-flash {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11.5px;
      font-weight: 500;
      animation: pjFlashIn 180ms ease-out both;
    }
    .pj-draft-flash--ok {
      background: var(--rg-accent-bg, #F0FAE0);
      color: var(--accent-text);
    }
    .pj-draft-flash--err {
      background: rgba(220,38,38,0.06);
      color: #B91C1C;
    }
    @keyframes pjFlashIn {
      from { opacity: 0; transform: translateY(-2px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .pj-btn {
      padding: 11px 18px;
      border-radius: 10px;
      border: none;
      font-family: var(--font);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.15s;
    }
    .pj-btn--ghost {
      background: var(--panel);
      border: 1px solid var(--rule);
      color: var(--ink);
      padding: 9px 14px;
      font-size: 12.5px;
    }
    .pj-btn--ghost:hover { border-color: var(--sub); }
    .pj-btn--primary {
      background: var(--rg-invert-bg, #0A0A0A);
      color: var(--rg-invert-fg, #fff);
    }
    .pj-btn--primary:hover:not(:disabled) { background: var(--rg-invert-hover, #262626); }
    .pj-btn--primary:disabled {
      background: var(--soft);
      color: var(--muted);
      cursor: not-allowed;
    }
    .pj-btn-spark { color: var(--accent); display: inline-flex; }
    .pj-btn--primary:disabled .pj-btn-spark { color: var(--sub); }

    /* Right rail */
    .pj-rail { display: flex; flex-direction: column; gap: 14px; }
    .pj-rail-card {
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 14px;
      padding: 18px 18px;
    }
    .pj-rail-heading {
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0 0 12px;
    }
    .pj-rail-step {
      display: flex;
      gap: 10px;
      padding: 8px 0;
    }
    .pj-rail-num {
      width: 22px;
      height: 22px;
      border-radius: 999px;
      background: var(--soft);
      color: var(--muted);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-family: var(--mono);
      font-weight: 500;
      flex-shrink: 0;
    }
    .pj-rail-num--active {
      background: var(--rg-invert-bg, #0A0A0A);
      color: var(--rg-invert-fg, #fff);
    }
    .pj-rail-step-label {
      font-size: 13px;
      color: var(--ink);
      font-weight: 500;
      margin: 0;
    }
    .pj-rail-muted { color: var(--muted); font-weight: 400; }
    .pj-rail-step-det {
      font-size: 11.5px;
      color: var(--muted);
      margin: 2px 0 0;
      line-height: 1.45;
    }
    .pj-rail-tips {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .pj-rail-tips li {
      font-size: 12.5px;
      color: var(--rg-ink, #404040);
      line-height: 1.5;
      margin-bottom: 8px;
      padding-left: 14px;
      position: relative;
    }
    .pj-rail-tips li:last-child { margin-bottom: 0; }
    .pj-rail-dot {
      position: absolute;
      left: 0;
      top: 8px;
      width: 4px;
      height: 4px;
      border-radius: 2px;
      background: var(--accent);
    }
    .pj-privacy {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      background: var(--soft);
      border-radius: 10px;
      padding: 12px;
    }
    .pj-privacy-icon {
      color: var(--muted);
      flex-shrink: 0;
      margin-top: 1px;
      display: inline-flex;
    }
    .pj-privacy-title {
      font-size: 12px;
      color: var(--ink);
      font-weight: 500;
      margin: 0;
    }
    .pj-privacy-sub {
      font-size: 11.5px;
      color: var(--muted);
      margin: 3px 0 0;
      line-height: 1.45;
    }

    @media (max-width: 980px) {
      .pj-grid { grid-template-columns: 1fr; }
      .pj-meta-row { grid-template-columns: 1fr; }
    }

    /* ── Loading view ─────────────────────── */
    .loading-view {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 52px);
      padding: 2rem;
      text-align: center;
      background: var(--rg-bg, var(--rg-bg, #F5F5F7));
    }

    /* ── Robot character ──────────────────── */
    .robot-scene {
      position: relative;
      display: flex;
      justify-content: center;
      margin-bottom: 2.5rem;
      width: 140px;
    }
    .robot {
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: robotBob 2s ease-in-out infinite;
    }
    @keyframes robotBob {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-6px); }
    }

    /* Antenna */
    .ant-ball {
      width: 14px; height: 14px;
      border-radius: 50%;
      background: #2563eb;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.2);
      margin-bottom: -1px;
      animation: antPop 1.8s ease-in-out infinite;
      z-index: 1;
    }
    @keyframes antPop {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 3px rgba(37,99,235,0.2); }
      50%       { transform: scale(1.3); box-shadow: 0 0 0 7px rgba(37,99,235,0); }
    }
    .ant-stick {
      width: 3px; height: 14px;
      background: var(--rg-ink, #3F3F46);
      border-radius: 2px;
    }

    /* Head */
    .r-head {
      width: 74px; height: 58px;
      background: #2d2d3a;
      border-radius: 18px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    }
    .r-ear {
      position: absolute;
      top: 50%; transform: translateY(-50%);
      width: 9px; height: 9px;
      border-radius: 50%;
      background: var(--rg-ink, #3F3F46);
    }
    .r-ear-l { left: -5px; }
    .r-ear-r { right: -5px; }

    .r-face {
      width: 56px; height: 42px;
      background: #0f172a;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }
    .r-eyes-row { display: flex; gap: 14px; }
    .r-eye {
      width: 13px; height: 13px;
      border-radius: 50%;
      background: #3b82f6;
      position: relative;
      transform-box: fill-box;
      transform-origin: center;
      animation: eyeBlink 3.2s ease-in-out infinite;
    }
    .r-eye-r { animation-delay: 0.12s; }
    @keyframes eyeBlink {
      0%, 88%, 100% { transform: scaleY(1); }
      93%            { transform: scaleY(0.1); }
    }
    .r-pupil {
      width: 5px; height: 5px;
      border-radius: 50%;
      background: var(--rg-panel, #fff);
      position: absolute;
      top: 2px; left: 4px;
    }
    .r-mouth {
      width: 24px; height: 9px;
      border-bottom: 2.5px solid #2563eb;
      border-left:   2.5px solid #2563eb;
      border-right:  2.5px solid #2563eb;
      border-radius: 0 0 14px 14px;
      animation: mouthSmile 3s ease-in-out infinite;
    }
    @keyframes mouthSmile {
      0%, 100% { transform: scaleX(1); }
      50%       { transform: scaleX(0.75); }
    }

    /* Neck */
    .r-neck { width: 18px; height: 7px; background: var(--rg-ink-hover, #27272a); border-radius: 0 0 6px 6px; }

    /* Body */
    .r-body {
      width: 68px; height: 48px;
      background: #2d2d3a;
      border-radius: 14px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    }
    .r-panel { display: flex; gap: 7px; align-items: center; }
    .r-led {
      width: 10px; height: 10px;
      border-radius: 50%;
      transform-box: fill-box;
      transform-origin: center;
    }
    .led-1 { background: #14b8a6; animation: ledGlow 1.2s ease-in-out infinite 0s; }
    .led-2 { background: #2563eb; animation: ledGlow 1.2s ease-in-out infinite 0.4s; }
    .led-3 { background: #8b5cf6; animation: ledGlow 1.2s ease-in-out infinite 0.8s; }
    @keyframes ledGlow {
      0%, 100% { opacity: 0.35; transform: scale(0.8); }
      50%       { opacity: 1;    transform: scale(1.25); box-shadow: 0 0 8px currentColor; }
    }

    /* Arms */
    .r-arm {
      position: absolute;
      top: 2px;
      width: 15px; height: 30px;
      background: var(--rg-ink-hover, #27272a);
      border-radius: 8px;
    }
    .r-arm-l {
      left: -18px;
      transform-origin: top center;
      animation: armL 2s ease-in-out infinite;
    }
    .r-arm-r {
      right: -18px;
      transform-origin: top center;
      animation: armR 2s ease-in-out infinite;
    }
    @keyframes armL {
      0%, 100% { transform: rotate(-10deg); }
      50%       { transform: rotate(14deg); }
    }
    @keyframes armR {
      0%, 100% { transform: rotate(10deg); }
      50%       { transform: rotate(-14deg); }
    }

    /* Legs */
    .r-legs { display: flex; gap: 10px; margin-top: 4px; }
    .r-leg { display: flex; flex-direction: column; align-items: center; }
    .r-leg > div:first-child { width: 16px; height: 18px; background: var(--rg-ink-hover, #27272a); border-radius: 7px 7px 0 0; }
    .r-foot { width: 21px; height: 9px; background: var(--rg-ink, #3F3F46); border-radius: 0 0 6px 6px; }

    /* Thinking bubbles */
    .think-dot {
      position: absolute;
      border-radius: 50%;
      background: #2563eb;
      animation: thinkFloat 2s ease-out infinite;
    }
    .think-1 { width: 9px;  height: 9px;  top: 4px;  left: 78%;  animation-delay: 0s; }
    .think-2 { width: 6px;  height: 6px;  top: -10px; left: 82%; animation-delay: 0.55s; opacity: 0.7; }
    .think-3 { width: 4px;  height: 4px;  top: -22px; left: 85%; animation-delay: 1.1s; opacity: 0.5; }
    @keyframes thinkFloat {
      0%   { opacity: 0; transform: translateY(0)    scale(0.6); }
      25%  { opacity: 1; }
      100% { opacity: 0; transform: translateY(-28px) scale(0.9); }
    }

    .loading-title {
      font-size: 28px;
      font-weight: 500;
      color: var(--ink);
      margin: 0 0 8px;
      letter-spacing: -0.025em;
    }
    .loading-sub {
      font-size: 14px;
      color: var(--muted);
      margin-bottom: 32px;
    }

    /* Phase list */
    .phase-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      text-align: left;
      padding: 14px 16px;
      border: 1px solid var(--rule);
      border-radius: 12px;
      background: var(--panel);
      min-width: 280px;
    }
    .phase-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--muted);
      transition: color 0.4s;
    }
    .phase-item.phase-done { color: var(--ink); }
    .phase-item.phase-active { color: var(--ink); font-weight: 500; }
    .phase-icon {
      width: 20px; height: 20px;
      border-radius: 50%;
      background: var(--soft);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.4s, color 0.4s;
      color: var(--accent-ink);
    }
    .phase-done .phase-icon { background: var(--accent); color: var(--accent-ink); }
    .phase-active .phase-icon { background: var(--rg-invert-bg, #0A0A0A); color: var(--rg-invert-fg, #fff); }
    .phase-pulse-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--rg-panel, #fff);
      animation: phasePulse 1s ease-in-out infinite;
    }
    @keyframes phasePulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.4; transform: scale(0.6); }
    }

    /* ── Confirmed view ────────────────────── */
    .confirmed-view {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 52px);
      padding: 2rem;
      text-align: center;
      animation: fadeIn 300ms ease-out both;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

    .confirmed-visual {
      position: relative;
      width: 140px; height: 140px;
      margin: 0 auto 2rem;
      flex-shrink: 0;
    }
    .success-ring {
      position: absolute;
      border-radius: 50%;
      background: rgba(20,184,166,0.08);
      animation: successExpand 0.6s ease-out both;
    }
    .success-ring-1 { inset: 24px; animation-delay: 0s; }
    .success-ring-2 { inset: 10px; animation-delay: 0.12s; }
    .success-ring-3 { inset: 0;    animation-delay: 0.24s; background: rgba(20,184,166,0.04); }
    @keyframes successExpand {
      from { transform: scale(0.4); opacity: 0; }
      to   { transform: scale(1);   opacity: 1; }
    }
    .success-core {
      position: absolute;
      inset: 36px;
      background: #14b8a6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: successPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    @keyframes successPop {
      from { transform: scale(0); }
      to   { transform: scale(1); }
    }
    .confirmed-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--rg-ink, var(--rg-ink, #1D1D1F));
      margin-bottom: 0.5rem;
      letter-spacing: -0.025em;
    }
    .confirmed-sub {
      color: var(--rg-muted, var(--rg-muted, #6E6E73));
      font-size: 0.95rem;
      max-width: 360px;
      margin-bottom: 1.75rem;
      line-height: 1.65;
    }

    /* ── Preview view ─────────────────────── */
    .preview-view {
      max-width: 1100px;
      margin: 0 auto;
      padding: 2rem 1.25rem;
      animation: fadeIn 280ms ease-out both;
    }
    .preview-top { margin-bottom: 1.75rem; }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: none;
      border: none;
      font-size: 0.83rem;
      font-weight: 500;
      color: var(--rg-muted, var(--rg-muted, #6E6E73));
      cursor: pointer;
      font-family: inherit;
      padding: 0;
      margin-bottom: 0.75rem;
      transition: color 0.12s;
    }
    .back-link:hover { color: var(--rg-ink, var(--rg-ink, #1D1D1F)); }
    .preview-heading {
      font-size: 1.4rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--rg-ink, var(--rg-ink, #1D1D1F));
      margin-bottom: 0.25rem;
    }
    .preview-summary { font-size: 0.9rem; color: var(--rg-muted, var(--rg-muted, #6E6E73)); }

    .preview-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    @media (max-width: 640px) { .preview-grid { grid-template-columns: 1fr; } }

    .pcard {
      background: var(--rg-panel, #fff);
      border-radius: 16px;
      border: 1px solid var(--rg-rule, var(--rg-rule, #E5E5EA));
      padding: 1.375rem;
      box-shadow: 0 1px 3px var(--rg-hover, rgba(0,0,0,0.05));
    }
    .card-label {
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--rg-muted, var(--rg-muted, #6E6E73));
      margin-bottom: 0.875rem;
    }
    .badge-row { display: flex; gap: 0.375rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
    .badge-cat {
      background: rgba(37,99,235,0.08);
      color: #1d4ed8;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 600;
    }
    .urg-select {
      appearance: none;
      border: none;
      outline: none;
      cursor: pointer;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 600;
      font-family: inherit;
      transition: opacity 0.15s;
    }
    .urg-select:hover { opacity: 0.75; }
    .urg-normal { background: rgba(20,184,166,0.1); color: #1a7f37; }
    .urg-high { background: rgba(255,159,10,0.1); color: #b25000; }
    .urg-emergency { background: rgba(255,59,48,0.08); color: #c0392b; }
    .urg-low { background: var(--rg-hover, rgba(0,0,0,0.06)); color: var(--rg-muted, var(--rg-muted, #6E6E73)); }

    .edit-hint {
      font-size: 0.65rem;
      font-weight: 400;
      color: var(--rg-sub, var(--rg-sub, #AEAEB2));
      margin-left: 0.5rem;
      letter-spacing: 0;
      text-transform: none;
    }

    .inline-title {
      display: block;
      width: 100%;
      background: transparent;
      border: none;
      outline: none;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--rg-ink, var(--rg-ink, #1D1D1F));
      letter-spacing: -0.01em;
      font-family: inherit;
      margin-bottom: 0.4rem;
      padding: 0;
      border-bottom: 1.5px solid transparent;
      transition: border-color 0.15s;
    }
    .inline-title:hover { border-bottom-color: var(--rg-rule, var(--rg-rule, #E5E5EA)); }
    .inline-title:focus { border-bottom-color: #6366f1; }

    .inline-desc {
      display: block;
      width: 100%;
      background: transparent;
      border: none;
      outline: none;
      font-size: 0.875rem;
      color: var(--rg-muted, var(--rg-muted, #6E6E73));
      line-height: 1.6;
      font-family: inherit;
      resize: none;
      overflow: hidden;
      padding: 0;
      margin-bottom: 1rem;
      border-bottom: 1.5px solid transparent;
      transition: border-color 0.15s;
      min-height: 4.8rem;
    }
    .inline-desc:hover { border-bottom-color: var(--rg-rule, var(--rg-rule, #E5E5EA)); }
    .inline-desc:focus { border-bottom-color: #6366f1; }

    .price-range-row {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .currency {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--rg-ink, #3F3F46);
    }
    .price-sep { color: var(--rg-sub, var(--rg-sub, #AEAEB2)); font-size: 0.875rem; padding: 0 0.1rem; }
    .inline-number {
      background: transparent;
      border: none;
      outline: none;
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--rg-ink, #3F3F46);
      font-family: inherit;
      width: 5ch;
      min-width: 3ch;
      max-width: 7ch;
      padding: 0;
      border-bottom: 1.5px solid transparent;
      transition: border-color 0.15s;
    }
    .inline-number:hover { border-bottom-color: var(--rg-rule, var(--rg-rule, #E5E5EA)); }
    .inline-number:focus { border-bottom-color: #6366f1; }
    .inline-number::-webkit-inner-spin-button,
    .inline-number::-webkit-outer-spin-button { opacity: 0; }
    .inline-date {
      background: transparent;
      border: none;
      outline: none;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--rg-ink, #3F3F46);
      font-family: inherit;
      padding: 0;
      border-bottom: 1.5px solid var(--rg-rule, var(--rg-rule, #E5E5EA));
      transition: border-color 0.15s;
      width: auto;
    }
    .inline-date:focus { border-bottom-color: #6366f1; }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .meta-cell { display: flex; flex-direction: column; gap: 0.2rem; }
    .meta-label {
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--rg-sub, var(--rg-sub, #AEAEB2));
    }
    .meta-value {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--rg-ink, var(--rg-ink, #1D1D1F));
    }
    .price { color: #2563eb; }
    .tools-row { margin-top: 0.25rem; }
    .tools-chips { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.375rem; }
    .tool-chip {
      background: var(--rg-bg, var(--rg-bg, #F5F5F7));
      border: 1px solid var(--rg-rule, var(--rg-rule, #E5E5EA));
      border-radius: 6px;
      padding: 0.15rem 0.55rem;
      font-size: 0.75rem;
      color: var(--rg-muted, var(--rg-muted, #6E6E73));
    }

    /* Workers */
    .workers-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .worker-row {
      border: 1px solid var(--rg-rule, var(--rg-rule, #E5E5EA));
      border-radius: 12px;
      padding: 0.875rem;
      transition: border-color 0.15s, background 0.15s;
      cursor: pointer;
    }
    .worker-row:hover { border-color: #c7c7cc; }
    .worker-top { background: rgba(37,99,235,0.02); }
    .worker-selected { border-color: #6366f1 !important; background: rgba(99,102,241,0.04) !important; }
    .top-tag {
      font-size: 0.68rem;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 0.5rem;
    }
    .worker-inner { display: flex; align-items: flex-start; gap: 0.75rem; }
    .w-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--rg-ink, var(--rg-ink, #1D1D1F));
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.72rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .w-info { flex: 1; }
    .w-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--rg-ink, var(--rg-ink, #1D1D1F));
      display: flex;
      align-items: center;
      gap: 0.3rem;
      margin-bottom: 0.2rem;
    }
    .verified-tag { color: #14b8a6; font-size: 0.75rem; }
    .w-stats { font-size: 0.73rem; color: var(--rg-sub, var(--rg-sub, #AEAEB2)); margin-bottom: 0.3rem; }
    .reasons { display: flex; flex-wrap: wrap; gap: 0.25rem; }
    .reason-chip {
      background: var(--rg-bg, var(--rg-bg, #F5F5F7));
      border: 1px solid var(--rg-rule, var(--rg-rule, #E5E5EA));
      color: var(--rg-muted, var(--rg-muted, #6E6E73));
      padding: 0.1rem 0.45rem;
      border-radius: 4px;
      font-size: 0.68rem;
      font-weight: 500;
    }
    .w-right { text-align: right; flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; }
    .rate { font-size: 0.8rem; font-weight: 700; color: var(--rg-ink, var(--rg-ink, #1D1D1F)); }
    .match-score { font-size: 0.68rem; color: #14b8a6; font-weight: 700; }
    .btn-assign {
      margin-top: 0.25rem;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.28rem 0.7rem;
      border-radius: 99px;
      border: 1.5px solid #6366f1;
      background: transparent;
      color: #6366f1;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      font-family: inherit;
      white-space: nowrap;
    }
    .btn-assign:hover { background: #6366f1; color: #fff; }
    .no-workers { color: var(--rg-sub, var(--rg-sub, #AEAEB2)); font-size: 0.875rem; text-align: center; padding: 1.5rem 0; }

    /* Actions */
    .preview-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      align-items: center;
    }
    .login-to-post {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .login-to-post-hint {
      font-size: 0.82rem;
      color: rgba(255,255,255,0.45);
    }
    .btn-primary-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: var(--rg-invert-bg, #0A0A0A);
      color: var(--rg-invert-fg, #fff);
      border: none;
      padding: 0.6rem 1.375rem;
      border-radius: 980px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s;
    }
    .btn-primary-pill:hover:not(:disabled) { background: var(--rg-invert-hover, #27272a); }
    .btn-primary-pill:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-ghost-pill {
      display: inline-flex;
      align-items: center;
      background: transparent;
      border: 1px solid #d2d2d7;
      color: var(--rg-ink, var(--rg-ink, #1D1D1F));
      padding: 0.6rem 1.375rem;
      border-radius: 980px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.12s;
    }
    .btn-ghost-pill:hover { background: var(--rg-hover, rgba(0,0,0,0.04)); }

    /* ── Location picker ──────────────────── */
    .loc-divider { height: 1px; background: var(--rule); margin: 14px 0; }
    .loc-field { position: relative; margin-bottom: 0; }
    .loc-input-row { display: flex; gap: 6px; align-items: center; }
    .loc-icon-wrap { position: relative; flex: 1; }
    .loc-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--sub);
      pointer-events: none;
    }
    .loc-input {
      width: 100%;
      padding: 10px 12px 10px 32px;
      border: 1px solid var(--rule);
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      font-family: var(--font);
      color: var(--ink);
      background: var(--panel);
      transition: border-color 0.15s, box-shadow 0.15s;
      box-sizing: border-box;
    }
    .loc-input:focus { border-color: var(--ink); }
    .loc-input::placeholder { color: var(--sub); }
    .loc-gps-btn {
      width: 38px; height: 38px;
      flex-shrink: 0;
      border: 1px solid var(--rule);
      border-radius: 8px;
      background: var(--panel);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--muted);
      transition: border-color 0.15s, color 0.15s;
    }
    .loc-gps-btn:hover:not(:disabled) { border-color: var(--sub); color: var(--ink); }
    .loc-gps-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .loc-spinner {
      width: 13px; height: 13px;
      border: 2px solid var(--rule);
      border-top-color: var(--ink);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    .loc-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0; right: 0;
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(10,10,10,0.08);
      z-index: 100;
      overflow: hidden;
      max-height: 200px;
      overflow-y: auto;
    }
    .loc-option {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: none;
      border: none;
      border-bottom: 1px solid var(--soft);
      cursor: pointer;
      font-size: 12px;
      color: var(--ink);
      text-align: left;
      font-family: var(--font);
      line-height: 1.4;
      transition: background 0.1s;
    }
    .loc-option:last-child { border-bottom: none; }
    .loc-option:hover { background: var(--soft); }
    .loc-confirmed {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      padding: 4px 10px;
      border-radius: 8px;
      background: var(--rg-accent-bg, #F0FAE0);
      font-size: 11.5px;
      color: var(--accent-text);
      font-weight: 500;
    }
    .loc-coords { color: var(--sub); font-weight: 400; font-size: 10.5px; font-family: var(--mono); margin-left: 4px; }
    .loc-error {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; color: #B91C1C;
      margin-top: 8px;
    }

    /* ── Access details ────────────────────── */
    .access-section {
      display: flex; flex-direction: column; gap: 10px;
      padding: 4px 0;
    }
    .access-title {
      display: flex; align-items: center; gap: 6px;
      font-size: 10.5px; font-weight: 500; color: var(--muted);
      letter-spacing: 0.14em; text-transform: uppercase;
    }
    .access-optional { font-weight: 400; color: var(--sub); text-transform: none; letter-spacing: 0; }
    .access-row {
      display: flex; align-items: center; gap: 12px;
    }
    .access-label {
      font-size: 12px; color: var(--muted); min-width: 60px;
    }
    .access-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .access-chip {
      padding: 5px 12px;
      border-radius: 999px;
      border: 1px solid var(--rule);
      background: var(--panel);
      font-size: 12px;
      font-weight: 400;
      color: var(--ink);
      cursor: pointer;
      transition: all 0.15s;
      font-family: var(--font);
    }
    .access-chip:hover { border-color: var(--sub); }
    .access-chip-on {
      border-color: var(--rg-invert-bg, #0A0A0A);
      background: var(--rg-invert-bg, #0A0A0A);
      color: var(--rg-invert-fg, #fff);
      font-weight: 500;
    }

    /* ── Error ────────────────────────────── */
    /* ── Job limit overlay ───────────────────── */
    .limit-overlay {
      position: fixed; inset: 0; z-index: 999;
      background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; padding: 1.5rem;
    }
    .limit-card {
      background: var(--rg-panel, #fff); border-radius: 20px; padding: 2.5rem 2rem;
      max-width: 420px; width: 100%; text-align: center;
      box-shadow: 0 24px 64px rgba(0,0,0,0.2);
      display: flex; flex-direction: column; align-items: center; gap: 1rem;
    }
    .limit-icon {
      width: 64px; height: 64px; border-radius: 50%;
      background: #fef3c7; color: #d97706;
      display: flex; align-items: center; justify-content: center;
    }
    .limit-title { font-size: 1.3rem; font-weight: 800; color: var(--rg-ink, #18181b); margin: 0; letter-spacing: -0.02em; }
    .limit-sub { font-size: 0.9rem; color: var(--rg-muted, #71717A); line-height: 1.65; margin: 0; }
    .limit-btns { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; margin-top: 0.5rem; }
    .limit-btn-primary {
      display: flex; align-items: center; justify-content: center;
      background: var(--rg-invert-bg, #0A0A0A); color: var(--rg-invert-fg, #fff); text-decoration: none;
      font-size: 0.9rem; font-weight: 600; padding: 0.8rem 1.5rem;
      border-radius: 99px; transition: background 0.2s;
    }
    .limit-btn-primary:hover { background: var(--rg-ink, #3F3F46); }
    .limit-btn-secondary {
      display: flex; align-items: center; justify-content: center;
      color: var(--rg-muted, #71717A); text-decoration: none;
      font-size: 0.875rem; font-weight: 500; padding: 0.6rem;
      border-radius: 99px; transition: color 0.2s;
    }
    .limit-btn-secondary:hover { color: var(--rg-ink, #18181b); }

    .err-toast {
      position: fixed;
      bottom: 1.25rem;
      left: 50%;
      transform: translateX(-50%);
      background: var(--rg-panel, #fff);
      border: 1px solid #ffd2d0;
      color: #c0392b;
      padding: 0.7rem 1.25rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      white-space: nowrap;
      z-index: 999;
      font-size: 0.875rem;
    }
    .err-close {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--rg-sub, var(--rg-sub, #AEAEB2));
      font-size: 0.9rem;
      padding: 0;
      font-family: inherit;
    }
    .err-close:hover { color: var(--rg-ink, var(--rg-ink, #1D1D1F)); }

    /* Confirm-request modal */
    .cm-overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(10,10,10,0.45);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      animation: cm-fade 160ms ease-out both;
    }
    @keyframes cm-fade { from { opacity: 0; } to { opacity: 1; } }
    .cm-card {
      background: var(--rg-panel, #FFFFFF);
      border: 1px solid var(--rg-rule, #E8E8E5);
      border-radius: 18px;
      width: 100%;
      max-width: 440px;
      padding: 26px 28px 22px;
      box-shadow: 0 30px 80px rgba(10,10,10,0.18), 0 8px 22px rgba(10,10,10,0.08);
      color: var(--rg-ink, #0A0A0A);
      font-family: 'Geist', 'Inter', system-ui, sans-serif;
      animation: cm-rise 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
    }
    @keyframes cm-rise {
      from { opacity: 0; transform: translateY(14px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .cm-icon {
      width: 44px; height: 44px;
      border-radius: 12px;
      background: var(--rg-accent-bg, #F0FAE0);
      border: 1px solid var(--rg-accent-br, #D6EAA0);
      color: var(--rg-accent-text, #4D7C0F);
      display: inline-flex; align-items: center; justify-content: center;
      margin-bottom: 14px;
    }
    .cm-title {
      font-size: 19px;
      font-weight: 600;
      letter-spacing: -0.02em;
      color: var(--rg-ink, #0A0A0A);
      margin: 0 0 8px;
    }
    .cm-body {
      font-size: 13.5px;
      color: var(--rg-muted, #525252);
      line-height: 1.55;
      margin: 0 0 22px;
    }
    .cm-body strong { color: var(--rg-ink, #0A0A0A); font-weight: 600; }
    .cm-actions {
      display: flex; gap: 8px; justify-content: flex-end;
    }
    .cm-btn {
      padding: 11px 16px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      display: inline-flex; align-items: center; gap: 7px;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .cm-btn--ghost {
      background: var(--rg-panel, #FFFFFF);
      border: 1px solid var(--rg-rule, #E8E8E5);
      color: var(--rg-ink, #0A0A0A);
    }
    .cm-btn--ghost:hover { background: var(--rg-soft, #F5F5F3); }
    .cm-btn--primary {
      background: var(--rg-invert-bg, #0A0A0A); color: var(--rg-invert-fg, #fff);
      border: none;
    }
    .cm-btn--primary:hover { background: var(--rg-invert-hover, #1f1f1f); }
  `]
})
export class JobWizardComponent implements OnInit {
  private api = inject(ApiService);
  protected auth = inject(AuthService);
  private router = inject(Router);

  // Draft state
  draftSaving = signal(false);
  draftSaved = signal(false);
  draftError = signal<string | null>(null);
  // Tracks an in-progress draft id when the user enters the wizard via
  // "Edit" on the Drafts page (set via query param `?draftId=...`).
  private editingDraftId: string | null = null;

  ngOnInit() {
    const draftId = new URLSearchParams(window.location.search).get('draftId');
    if (!draftId || !this.auth.isLoggedIn()) return;
    this.editingDraftId = draftId;
    this.api.listJobDrafts().subscribe({
      next: (drafts) => {
        const draft = drafts.find((d: any) => d.id === draftId);
        if (!draft) return;
        this.rawInput = draft.rawInput ?? '';
        const urg = (draft.urgency ?? 'NORMAL').toUpperCase();
        if (urg === 'EMERGENCY' || urg === 'HIGH') this.urgency.set('ASAP');
        else if (urg === 'NORMAL') this.urgency.set('SOON');
        else this.urgency.set('FLEXIBLE');
        if (draft.latitude && draft.longitude) {
          this.jobLocation = {
            latitude: draft.latitude,
            longitude: draft.longitude,
            city: draft.city ?? '',
            address: draft.address ?? '',
            country: '',
          };
          this.locationQuery = [draft.address, draft.city].filter(Boolean).join(', ');
          this.locationConfirmed.set(true);
        }
      },
    });
  }

  private mapUrgencyToBackend(u?: string): 'EMERGENCY' | 'NORMAL' | 'LOW' | 'HIGH' {
    const v = (u ?? this.editablePreview()?.urgency ?? '').toUpperCase();
    if (v === 'EMERGENCY' || v === 'HIGH' || v === 'NORMAL' || v === 'LOW') return v as any;
    // fallback from the input-step urgency signal
    if (this.urgency() === 'ASAP') return 'EMERGENCY';
    if (this.urgency() === 'SOON') return 'NORMAL';
    return 'LOW';
  }

  saveDraftFromPreview() {
    if (this.draftSaving()) return;
    const preview = this.editablePreview();
    if (!preview) return;

    this.draftSaving.set(true);
    this.draftError.set(null);

    const payload = {
      id: this.editingDraftId ?? undefined,
      rawInput: this.rawInput,
      title: preview.title,
      description: preview.description,
      urgency: this.mapUrgencyToBackend(preview.urgency),
      categorySlug: this.result()?.jobPreview.categorySlug,
      priceMin: preview.priceMin ?? undefined,
      priceMax: preview.priceMax ?? undefined,
      estimatedHours: preview.estimatedHours ?? undefined,
      toolsNeeded: this.result()?.jobPreview.toolsNeeded ?? [],
      latitude: this.jobLocation.latitude ?? undefined,
      longitude: this.jobLocation.longitude ?? undefined,
      address: this.jobLocation.address || undefined,
      city: this.jobLocation.city || undefined,
      scheduledDate: this.scheduledDate() || undefined,
    };

    this.api.saveJobDraft(payload).subscribe({
      next: () => {
        this.draftSaving.set(false);
        this.draftSaved.set(true);
        setTimeout(() => {
          this.draftSaved.set(false);
          this.router.navigate(['/drafts']);
          this.resetAfterDraft();
        }, 1200);
      },
      error: (err: any) => {
        this.draftSaving.set(false);
        this.draftError.set(err?.error?.message ?? 'Failed to save draft');
        setTimeout(() => this.draftError.set(null), 2500);
      },
    });
  }

  private resetAfterDraft() {
    this.rawInput = '';
    this.urgency.set('SOON');
    this.result.set(null);
    this.editablePreview.set(null);
    this.scheduledDate.set('');
    this.jobLocation = { latitude: null, longitude: null, city: '', address: '', country: '' };
    this.locationQuery = '';
    this.locationConfirmed.set(false);
    this.editingDraftId = null;
    this.step.set('input');
  }

  step = signal<WizardStep>('input');
  loadingPhase = signal(0);
  result = signal<AnalyzeJobResponse | null>(null);
  error = signal<string | null>(null);
  jobLimitReached = signal(false);
  scheduledDate = signal<string>('');

  minDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  rawInput = '';

  locationQuery = '';
  locationSuggestions = signal<NominatimResult[]>([]);
  locationLoading = signal(false);
  locationConfirmed = signal(false);
  locationError = signal<string | null>(null);
  jobLocation = { latitude: null as number | null, longitude: null as number | null, city: '', address: '', country: '' };
  private locationTimer: ReturnType<typeof setTimeout> | null = null;

  directAssignedWorker = signal<{ id: string; firstName: string } | null>(null);
  pendingRequest = signal<{ id: string; firstName: string } | null>(null);
  selectedWorkerId = signal<string | null>(null);

  editablePreview = signal<{
    title: string;
    description: string;
    priceMin: number | null;
    priceMax: number | null;
    urgency: string;
    estimatedHours: number | null;
  } | null>(null);

  examples = [
    'Leaky kitchen sink',
    'Move a sofa to another room',
    'Walk my dog this afternoon',
    'Light switch stopped working',
  ];

  urgency = signal<'FLEXIBLE' | 'SOON' | 'ASAP'>('SOON');
  urgencyOpts = [
    { id: 'FLEXIBLE' as const, label: 'Flexible', ti: 'this week' },
    { id: 'SOON'     as const, label: 'Soon',     ti: '1–2 days'  },
    { id: 'ASAP'     as const, label: 'ASAP',     ti: 'today'     },
  ];

  propertyType = signal<string | null>(null);
  floorNumber = signal<number | null>(null);
  hasElevator = signal<boolean | null>(null);
  parking = signal<string | null>(null);

  propertyTypeOpts = [
    { label: 'Apartment', value: 'apartment' },
    { label: 'House', value: 'house' },
    { label: 'Office', value: 'office' },
    { label: 'Other', value: 'other' },
  ];
  floorOpts = [
    { label: 'Ground', value: 0 },
    { label: '1st', value: 1 },
    { label: '2nd', value: 2 },
    { label: '3rd', value: 3 },
    { label: '4th', value: 4 },
    { label: '5th+', value: 5 },
  ];
  parkingOpts = [
    { label: 'Available', value: 'available' },
    { label: 'Street only', value: 'street' },
    { label: 'None', value: 'none' },
  ];

  private buildAccessContext(): string {
    const parts: string[] = [];
    if (this.propertyType()) parts.push(`Property type: ${this.propertyType()}`);
    const floor = this.floorNumber();
    if (floor !== null) {
      parts.push(`Floor: ${floor === 0 ? 'ground floor' : `${floor}${floor >= 5 ? '+' : ''} floor`}`);
      if (floor > 0 && this.hasElevator() !== null) {
        parts.push(`Elevator: ${this.hasElevator() ? 'yes' : 'no'}`);
      }
    }
    if (this.parking()) parts.push(`Parking: ${this.parking()}`);
    return parts.length ? `\n\nAccess details: ${parts.join(', ')}.` : '';
  }

  analyze() {
    if (!this.rawInput.trim()) return;

    this.step.set('loading');
    this.loadingPhase.set(0);
    this.error.set(null);

    const phases = [1, 2, 3];
    phases.forEach((phase, i) => {
      setTimeout(() => this.loadingPhase.set(phase), i * 800);
    });

    const urgencyHint = this.urgency() === 'ASAP'
      ? '\n\nUrgency: ASAP (today).'
      : this.urgency() === 'SOON'
        ? '\n\nUrgency: Soon (within 1–2 days).'
        : '\n\nUrgency: Flexible (this week).';

    this.api.analyzeJob({
      rawInput: this.rawInput + this.buildAccessContext() + urgencyHint,
      city: this.jobLocation.city,
      country: this.jobLocation.country,
      latitude: this.jobLocation.latitude ?? undefined,
      longitude: this.jobLocation.longitude ?? undefined,
    }).subscribe({
      next: (response) => {
        this.result.set(response);
        this.selectedWorkerId.set(response.suggestedWorkers[0]?.id ?? null);
        const p = response.jobPreview;
        this.editablePreview.set({
          title: p.title,
          description: p.description,
          priceMin: p.priceMin ?? null,
          priceMax: p.priceMax ?? null,
          urgency: p.urgency,
          estimatedHours: p.estimatedHours ?? null,
        });
        this.step.set('preview');
        this.initDescResize();
      },
      error: (err) => {
        const apiMsg = err?.error?.message ?? '';
        const isOverloaded = err?.status === 503 || apiMsg === 'AI_OVERLOADED' || /overload/i.test(JSON.stringify(err?.error ?? ''));
        const isServerErr = (err?.status ?? 0) >= 500;
        this.error.set(
          isOverloaded ? 'Our AI assistant is busy right now — give it a minute and try again.' :
          isServerErr ? 'We hit a snag analyzing that. Try again in a moment.' :
          apiMsg || 'Something went wrong. Please try again.',
        );
        this.step.set('input');
      },
    });
  }

  patchPreview(field: string, value: string | number) {
    const current = this.editablePreview();
    if (current) this.editablePreview.set({ ...current, [field]: value });
  }

  autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  initDescResize() {
    setTimeout(() => {
      const el = document.querySelector('.inline-desc') as HTMLTextAreaElement | null;
      if (el) this.autoResize(el);
    }, 0);
  }

  requestWorker(workerId: string, workerName: string) {
    this.pendingRequest.set({ id: workerId, firstName: workerName });
  }

  cancelRequest() { this.pendingRequest.set(null); }

  confirmRequest() {
    const p = this.pendingRequest();
    if (!p) return;
    this.pendingRequest.set(null);
    this.confirmJob(p.id, p.firstName);
  }

  confirmJob(directWorkerId?: string, directWorkerName?: string) {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/' } });
      return;
    }

    const preview = this.result()?.jobPreview;
    if (!preview) return;

    if (directWorkerId && directWorkerName) {
      this.directAssignedWorker.set({ id: directWorkerId, firstName: directWorkerName });
    } else {
      this.directAssignedWorker.set(null);
    }

    const edits = this.editablePreview();
    this.api.createJob({
      rawInput: this.rawInput,
      title: edits?.title ?? preview.title,
      description: edits?.description ?? preview.description,
      categorySlug: preview.categorySlug,
      urgency: edits?.urgency ?? preview.urgency,
      priceMin: edits?.priceMin ?? preview.priceMin,
      priceMax: edits?.priceMax ?? preview.priceMax,
      estimatedHours: edits?.estimatedHours ?? preview.estimatedHours,
      toolsNeeded: preview.toolsNeeded,
      city: this.jobLocation.city,
      address: this.jobLocation.address,
      latitude: this.jobLocation.latitude ?? undefined,
      longitude: this.jobLocation.longitude ?? undefined,
      ...(this.scheduledDate() ? { scheduledDate: this.scheduledDate() } : {}),
      ...(directWorkerId ? { directAssignWorkerId: directWorkerId } : {}),
    }).subscribe({
      next: () => this.step.set('confirmed'),
      error: (err) => {
        if (err?.status === 403 && err?.error?.message?.includes('limit')) {
          this.jobLimitReached.set(true);
        } else {
          this.error.set(err?.error?.message ?? 'Failed to post job. Please try again.');
        }
      },
    });
  }

  onLocationInput() {
    this.locationConfirmed.set(false);
    this.locationError.set(null);
    if (this.locationTimer) clearTimeout(this.locationTimer);
    if (this.locationQuery.trim().length < 3) { this.locationSuggestions.set([]); return; }
    this.locationTimer = setTimeout(() => this.fetchSuggestions(), 400);
  }

  onLocationBlur() {
    setTimeout(() => this.locationSuggestions.set([]), 150);
  }

  private async fetchSuggestions() {
    this.locationLoading.set(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.locationQuery)}&limit=5&addressdetails=1`;
      const res = await fetch(url);
      this.locationSuggestions.set(await res.json());
    } catch { this.locationSuggestions.set([]); }
    finally { this.locationLoading.set(false); }
  }

  selectLocation(item: NominatimResult) {
    this.jobLocation.latitude = parseFloat(item.lat);
    this.jobLocation.longitude = parseFloat(item.lon);
    this.jobLocation.city = item.address['city'] || item.address['town'] || item.address['village'] || item.address['county'] || '';
    this.jobLocation.address = [item.address['road'], item.address['house_number'], item.address['suburb']].filter(Boolean).join(' ') || '';
    this.jobLocation.country = item.address['country'] || '';
    this.locationQuery = item.display_name;
    this.locationSuggestions.set([]);
    this.locationConfirmed.set(true);
  }

  async useMyLocation(isRetry = false) {
    if (!navigator.geolocation) {
      this.locationError.set('Geolocation is not supported by your browser.');
      return;
    }
    this.locationLoading.set(true);
    this.locationError.set(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        this.jobLocation.latitude = latitude;
        this.jobLocation.longitude = longitude;
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
          const res = await fetch(url);
          const data = await res.json();
          this.jobLocation.city = data.address?.city || data.address?.town || data.address?.village || '';
          this.jobLocation.address = [data.address?.road, data.address?.house_number].filter(Boolean).join(' ') || '';
          this.jobLocation.country = data.address?.country || '';
          this.locationQuery = data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        } catch {
          this.locationQuery = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        }
        this.locationConfirmed.set(true);
        this.locationLoading.set(false);
      },
      (err) => {
        if (err.code === 2 && !isRetry) {
          // kCLErrorLocationUnknown — retry once with a fresh request and no cache
          setTimeout(() => this.useMyLocation(true), 1500);
          return;
        }
        this.locationLoading.set(false);
        if (err.code === 1) {
          this.locationError.set('Location access denied. Please allow it in your browser settings.');
        } else {
          this.locationError.set('Could not detect your location. Try searching manually.');
        }
      },
      { timeout: 15000, maximumAge: isRetry ? 0 : 60000 }
    );
  }

  reset() {
    this.rawInput = '';
    this.result.set(null);
    this.error.set(null);
    this.locationQuery = '';
    this.locationConfirmed.set(false);
    this.locationSuggestions.set([]);
    this.jobLocation = { latitude: null, longitude: null, city: '', address: '', country: '' };
    this.locationError.set(null);
    this.directAssignedWorker.set(null);
    this.selectedWorkerId.set(null);
    this.editablePreview.set(null);
    this.scheduledDate.set('');
    this.propertyType.set(null);
    this.floorNumber.set(null);
    this.hasElevator.set(null);
    this.parking.set(null);
    this.step.set('input');
  }
}
