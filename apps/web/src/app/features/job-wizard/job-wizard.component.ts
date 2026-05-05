import { Component, signal, inject } from '@angular/core';
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
          <div class="input-bg">
            <div class="bg-orb bg-orb-1"></div>
            <div class="bg-orb bg-orb-2"></div>
          </div>
          <div class="input-inner">
            <div class="ai-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
              AI-Powered Matching
            </div>
            <h1 class="headline">What do you need<br>help with?</h1>
            <p class="sub">Describe your problem in plain language — our AI writes the post, prices it fairly, and finds the best workers near you.</p>

            <div class="prompt-container">

              <!-- Robot peeking over the top-right edge -->
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

              <div class="input-box">
              <div class="ai-prompt-header">
                <div class="ai-prompt-label">
                  <div class="ai-spark"></div>
                  Describe your task
                </div>
                <span class="ai-prompt-badge">AI-powered</span>
              </div>
              <div class="ai-prompt-wrap">
                <textarea
                  class="main-input"
                  [(ngModel)]="rawInput"
                  placeholder="e.g. My kitchen sink is leaking and there's water under the cabinet. The pipe seems cracked and I need a plumber to fix it asap…"
                  rows="6"
                  (keydown.meta.enter)="analyze()"
                ></textarea>
              </div>
              <p class="input-hint">More detail = better price estimate + closer worker matches.</p>

              <div class="examples-row">
                <span class="examples-label">Try:</span>
                @for (ex of examples; track ex) {
                  <button class="example-chip" (click)="rawInput = ex">{{ ex }}</button>
                }
              </div>

              <div class="loc-divider"></div>

              <div class="loc-field">
                <div class="loc-input-row">
                  <div class="loc-icon-wrap">
                    <svg class="loc-icon" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <input class="loc-input"
                           [(ngModel)]="locationQuery"
                           (ngModelChange)="onLocationInput()"
                           (blur)="onLocationBlur()"
                           placeholder="Your location (address, postcode…)" />
                  </div>
                  <button class="loc-gps-btn" (click)="useMyLocation()" title="Use my current location" [disabled]="locationLoading()">
                    @if (locationLoading()) {
                      <span class="loc-spinner"></span>
                    } @else {
                      <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
                    }
                  </button>
                </div>
                @if (locationSuggestions().length > 0) {
                  <div class="loc-dropdown">
                    @for (item of locationSuggestions(); track item.display_name) {
                      <button class="loc-option" (mousedown)="selectLocation(item)">
                        <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;color:#aeaeb2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {{ item.display_name }}
                      </button>
                    }
                  </div>
                }
                @if (locationConfirmed()) {
                  <div class="loc-confirmed">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {{ jobLocation.city }}{{ jobLocation.address ? ' · ' + jobLocation.address : '' }}
                    <span class="loc-coords">{{ jobLocation.latitude?.toFixed(4) }}, {{ jobLocation.longitude?.toFixed(4) }}</span>
                  </div>
                }
                @if (locationError()) {
                  <div class="loc-error">
                    <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {{ locationError() }}
                  </div>
                }
              </div>

              <div class="loc-divider"></div>

              <div class="access-section">
                <div class="access-title">
                  <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  Property details <span class="access-optional">(optional)</span>
                </div>

                <div class="access-row">
                  <span class="access-label">Type</span>
                  <div class="access-chips">
                    @for (opt of propertyTypeOpts; track opt.value) {
                      <button class="access-chip" [class.access-chip-on]="propertyType() === opt.value" (click)="propertyType.set(opt.value)">{{ opt.label }}</button>
                    }
                  </div>
                </div>

                <div class="access-row">
                  <span class="access-label">Floor</span>
                  <div class="access-chips">
                    @for (opt of floorOpts; track opt.value) {
                      <button class="access-chip" [class.access-chip-on]="floorNumber() === opt.value" (click)="floorNumber.set(opt.value)">{{ opt.label }}</button>
                    }
                  </div>
                </div>

                @if (floorNumber() !== null && floorNumber() !== 0) {
                  <div class="access-row">
                    <span class="access-label">Elevator</span>
                    <div class="access-chips">
                      <button class="access-chip" [class.access-chip-on]="hasElevator() === true" (click)="hasElevator.set(true)">Yes</button>
                      <button class="access-chip" [class.access-chip-on]="hasElevator() === false" (click)="hasElevator.set(false)">No</button>
                    </div>
                  </div>
                }

                <div class="access-row">
                  <span class="access-label">Parking</span>
                  <div class="access-chips">
                    @for (opt of parkingOpts; track opt.value) {
                      <button class="access-chip" [class.access-chip-on]="parking() === opt.value" (click)="parking.set(opt.value)">{{ opt.label }}</button>
                    }
                  </div>
                </div>
              </div>

              <button class="submit-btn" (click)="analyze()" [disabled]="!rawInput.trim() || !locationConfirmed()">
                Analyze with AI
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </button>
            </div><!-- /.input-box -->
            </div><!-- /.prompt-container -->

            <div class="footer-row">
              <span>Secure</span>
              <span class="sep">·</span>
              <span>4.9/5 avg rating</span>
              <span class="sep">·</span>
              <span>Distance-matched workers</span>
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
                          <button class="btn-assign" (click)="confirmJob(w.id, w.firstName); $event.stopPropagation()">
                            Make a request
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

    </div>
  `,
  styles: [`
    .wiz {
      min-height: calc(100vh - 52px);
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif;
      background: #f5f5f7;
    }

    /* Input step gets a rich dark background */
    .input-view {
      background: linear-gradient(135deg, #0f0c29 0%, #1a1040 40%, #0d1b3e 70%, #0a1628 100%);
    }

    /* ── Input view ───────────────────────── */
    .input-view {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 52px);
      padding: 3rem 1.5rem;
      position: relative;
      overflow: hidden;
    }
    .input-bg {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }
    .bg-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.35;
    }
    .bg-orb-1 {
      width: 600px; height: 600px;
      background: radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 65%);
      top: -150px; right: -120px;
      animation: bgFloat 8s ease-in-out infinite alternate;
    }
    .bg-orb-2 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(14,165,233,0.18) 0%, transparent 65%);
      bottom: -100px; left: -100px;
      animation: bgFloat 10s ease-in-out infinite alternate-reverse;
    }
    @keyframes bgFloat {
      from { transform: translate(0, 0); }
      to { transform: translate(20px, -20px); }
    }
    .input-inner {
      max-width: 820px;
      width: 100%;
      text-align: center;
      position: relative;
      z-index: 1;
    }
    .ai-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(99,102,241,0.15);
      color: #a5b4fc;
      border: 1px solid rgba(99,102,241,0.3);
      padding: 0.3rem 0.75rem;
      border-radius: 980px;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 1.25rem;
    }
    .headline {
      font-size: clamp(2rem, 5vw, 2.875rem);
      font-weight: 700;
      letter-spacing: -0.035em;
      color: #fff;
      margin-bottom: 1rem;
      line-height: 1.1;
    }
    .sub {
      font-size: 0.95rem;
      color: rgba(255,255,255,0.55);
      line-height: 1.65;
      max-width: 460px;
      margin: 0 auto 2rem;
    }

    .input-box {
      background: #fff;
      border-radius: 18px;
      border: 1px solid #e5e5ea;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.06);
      margin-bottom: 1.25rem;
    }
    /* Peeking robot on input step */
    .prompt-container {
      position: relative;
      margin-bottom: 1.25rem;
    }
    .prompt-container .input-box {
      position: relative;
      z-index: 1;
      margin-bottom: 0;
    }
    .peek-robot-wrap {
      position: absolute;
      top: -72px;
      right: 24px;
      transform: scale(0.46);
      transform-origin: top center;
      pointer-events: none;
      z-index: 0;
      filter: drop-shadow(0 0 10px rgba(99,102,241,0.5));
    }

    /* AI prompt section */
    .ai-prompt-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.625rem;
    }
    .ai-prompt-label {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.78rem;
      font-weight: 700;
      color: #1d1d1f;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .ai-spark {
      width: 9px; height: 9px;
      border-radius: 50%;
      background: #2563eb;
      flex-shrink: 0;
      animation: sparkPulse 2s ease-in-out infinite;
    }
    @keyframes sparkPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.5); }
      50%       { box-shadow: 0 0 0 6px rgba(37,99,235,0); }
    }
    .ai-prompt-badge {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #2563eb;
      background: rgba(37,99,235,0.08);
      border: 1px solid rgba(37,99,235,0.2);
      padding: 0.15rem 0.55rem;
      border-radius: 99px;
    }
    .ai-prompt-wrap {
      border-radius: 14px;
      padding: 2px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4, #3b82f6);
      background-size: 300% 300%;
      animation: aiBorder 5s linear infinite;
      margin-bottom: 0.5rem;
    }
    .ai-prompt-wrap:focus-within {
      animation-duration: 2s;
    }
    @keyframes aiBorder {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .main-input {
      width: 100%;
      border: none;
      border-radius: 12px;
      padding: 1rem 1.125rem;
      font-size: 0.95rem;
      resize: none;
      outline: none;
      box-sizing: border-box;
      font-family: inherit;
      color: #1d1d1f;
      line-height: 1.7;
      background: #fff;
      display: block;
    }
    .main-input::placeholder { color: #aeaeb2; }
    .input-hint {
      text-align: left;
      font-size: 0.73rem;
      color: #aeaeb2;
      margin: 0 0 0.25rem;
    }

    .examples-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.375rem;
      margin: 0.875rem 0;
    }
    .examples-label {
      font-size: 0.75rem;
      color: #aeaeb2;
      font-weight: 500;
    }
    .example-chip {
      background: #f5f5f7;
      border: 1px solid #e5e5ea;
      border-radius: 980px;
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      cursor: pointer;
      color: #6e6e73;
      font-family: inherit;
      transition: all 0.12s;
    }
    .example-chip:hover {
      background: rgba(37,99,235,0.07);
      border-color: rgba(37,99,235,0.2);
      color: #2563eb;
    }

    .submit-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: #18181b;
      color: #fff;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 980px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s;
    }
    .submit-btn:hover:not(:disabled) { background: #27272a; }
    .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .footer-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.78rem;
      color: rgba(255,255,255,0.35);
    }
    .sep { color: rgba(255,255,255,0.2); }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Loading view ─────────────────────── */
    .loading-view {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 52px);
      padding: 2rem;
      text-align: center;
      background: #f5f5f7;
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
      background: #3f3f46;
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
      background: #3f3f46;
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
      background: #fff;
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
    .r-neck { width: 18px; height: 7px; background: #27272a; border-radius: 0 0 6px 6px; }

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
      background: #27272a;
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
    .r-leg > div:first-child { width: 16px; height: 18px; background: #27272a; border-radius: 7px 7px 0 0; }
    .r-foot { width: 21px; height: 9px; background: #3f3f46; border-radius: 0 0 6px 6px; }

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
      font-size: 1.4rem;
      font-weight: 700;
      color: #1d1d1f;
      margin-bottom: 0.4rem;
      letter-spacing: -0.02em;
    }
    .loading-sub { font-size: 0.875rem; color: #6e6e73; margin-bottom: 2rem; }

    /* Phase list */
    .phase-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      text-align: left;
    }
    .phase-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      font-size: 0.875rem;
      color: #aeaeb2;
      transition: color 0.4s;
    }
    .phase-item.phase-done { color: #1d1d1f; }
    .phase-item.phase-active { color: #1d1d1f; }
    .phase-icon {
      width: 20px; height: 20px;
      border-radius: 50%;
      background: #e5e5ea;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.4s, color 0.4s;
      color: #fff;
    }
    .phase-done .phase-icon { background: #14b8a6; }
    .phase-active .phase-icon { background: #2563eb; }
    .phase-pulse-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #fff;
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
      color: #1d1d1f;
      margin-bottom: 0.5rem;
      letter-spacing: -0.025em;
    }
    .confirmed-sub {
      color: #6e6e73;
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
      color: #6e6e73;
      cursor: pointer;
      font-family: inherit;
      padding: 0;
      margin-bottom: 0.75rem;
      transition: color 0.12s;
    }
    .back-link:hover { color: #1d1d1f; }
    .preview-heading {
      font-size: 1.4rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #1d1d1f;
      margin-bottom: 0.25rem;
    }
    .preview-summary { font-size: 0.9rem; color: #6e6e73; }

    .preview-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    @media (max-width: 640px) { .preview-grid { grid-template-columns: 1fr; } }

    .pcard {
      background: #fff;
      border-radius: 16px;
      border: 1px solid #e5e5ea;
      padding: 1.375rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .card-label {
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #6e6e73;
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
    .urg-low { background: rgba(0,0,0,0.06); color: #6e6e73; }

    .edit-hint {
      font-size: 0.65rem;
      font-weight: 400;
      color: #aeaeb2;
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
      color: #1d1d1f;
      letter-spacing: -0.01em;
      font-family: inherit;
      margin-bottom: 0.4rem;
      padding: 0;
      border-bottom: 1.5px solid transparent;
      transition: border-color 0.15s;
    }
    .inline-title:hover { border-bottom-color: #e5e5ea; }
    .inline-title:focus { border-bottom-color: #6366f1; }

    .inline-desc {
      display: block;
      width: 100%;
      background: transparent;
      border: none;
      outline: none;
      font-size: 0.875rem;
      color: #6e6e73;
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
    .inline-desc:hover { border-bottom-color: #e5e5ea; }
    .inline-desc:focus { border-bottom-color: #6366f1; }

    .price-range-row {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .currency {
      font-size: 0.875rem;
      font-weight: 600;
      color: #3f3f46;
    }
    .price-sep { color: #aeaeb2; font-size: 0.875rem; padding: 0 0.1rem; }
    .inline-number {
      background: transparent;
      border: none;
      outline: none;
      font-size: 0.875rem;
      font-weight: 700;
      color: #3f3f46;
      font-family: inherit;
      width: 5ch;
      min-width: 3ch;
      max-width: 7ch;
      padding: 0;
      border-bottom: 1.5px solid transparent;
      transition: border-color 0.15s;
    }
    .inline-number:hover { border-bottom-color: #e5e5ea; }
    .inline-number:focus { border-bottom-color: #6366f1; }
    .inline-number::-webkit-inner-spin-button,
    .inline-number::-webkit-outer-spin-button { opacity: 0; }
    .inline-date {
      background: transparent;
      border: none;
      outline: none;
      font-size: 0.875rem;
      font-weight: 600;
      color: #3f3f46;
      font-family: inherit;
      padding: 0;
      border-bottom: 1.5px solid #e5e5ea;
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
      color: #aeaeb2;
    }
    .meta-value {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1d1d1f;
    }
    .price { color: #2563eb; }
    .tools-row { margin-top: 0.25rem; }
    .tools-chips { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.375rem; }
    .tool-chip {
      background: #f5f5f7;
      border: 1px solid #e5e5ea;
      border-radius: 6px;
      padding: 0.15rem 0.55rem;
      font-size: 0.75rem;
      color: #6e6e73;
    }

    /* Workers */
    .workers-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .worker-row {
      border: 1px solid #e5e5ea;
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
      background: #1d1d1f;
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
      color: #1d1d1f;
      display: flex;
      align-items: center;
      gap: 0.3rem;
      margin-bottom: 0.2rem;
    }
    .verified-tag { color: #14b8a6; font-size: 0.75rem; }
    .w-stats { font-size: 0.73rem; color: #aeaeb2; margin-bottom: 0.3rem; }
    .reasons { display: flex; flex-wrap: wrap; gap: 0.25rem; }
    .reason-chip {
      background: #f5f5f7;
      border: 1px solid #e5e5ea;
      color: #6e6e73;
      padding: 0.1rem 0.45rem;
      border-radius: 4px;
      font-size: 0.68rem;
      font-weight: 500;
    }
    .w-right { text-align: right; flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; }
    .rate { font-size: 0.8rem; font-weight: 700; color: #1d1d1f; }
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
    .no-workers { color: #aeaeb2; font-size: 0.875rem; text-align: center; padding: 1.5rem 0; }

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
      background: #18181b;
      color: #fff;
      border: none;
      padding: 0.6rem 1.375rem;
      border-radius: 980px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s;
    }
    .btn-primary-pill:hover:not(:disabled) { background: #27272a; }
    .btn-primary-pill:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-ghost-pill {
      display: inline-flex;
      align-items: center;
      background: transparent;
      border: 1px solid #d2d2d7;
      color: #1d1d1f;
      padding: 0.6rem 1.375rem;
      border-radius: 980px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.12s;
    }
    .btn-ghost-pill:hover { background: rgba(0,0,0,0.04); }

    /* ── Location picker ──────────────────── */
    .loc-divider { height: 1px; background: #f0f0f0; margin: 0.875rem 0; }
    .loc-field { position: relative; margin-bottom: 0.875rem; }
    .loc-input-row { display: flex; gap: 0.4rem; align-items: center; }
    .loc-icon-wrap { position: relative; flex: 1; }
    .loc-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #aeaeb2;
      pointer-events: none;
    }
    .loc-input {
      width: 100%;
      padding: 0.65rem 0.875rem 0.65rem 2rem;
      border: 1px solid #d2d2d7;
      border-radius: 10px;
      font-size: 0.875rem;
      outline: none;
      font-family: inherit;
      color: #1d1d1f;
      background: #fafafa;
      transition: border-color 0.15s, box-shadow 0.15s;
      box-sizing: border-box;
    }
    .loc-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); background: #fff; }
    .loc-input::placeholder { color: #aeaeb2; }
    .loc-gps-btn {
      width: 36px; height: 36px;
      flex-shrink: 0;
      border: 1px solid #d2d2d7;
      border-radius: 10px;
      background: #fafafa;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6e6e73;
      transition: border-color 0.15s, color 0.15s, background 0.15s;
    }
    .loc-gps-btn:hover:not(:disabled) { border-color: #2563eb; color: #2563eb; background: rgba(37,99,235,0.04); }
    .loc-gps-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .loc-spinner {
      width: 12px; height: 12px;
      border: 2px solid #e5e5ea;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    .loc-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0; right: 0;
      background: #fff;
      border: 1px solid #e5e5ea;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.1);
      z-index: 100;
      overflow: hidden;
      max-height: 200px;
      overflow-y: auto;
    }
    .loc-option {
      width: 100%;
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.6rem 0.875rem;
      background: none;
      border: none;
      border-bottom: 1px solid #f5f5f7;
      cursor: pointer;
      font-size: 0.8rem;
      color: #3f3f46;
      text-align: left;
      font-family: inherit;
      line-height: 1.4;
      transition: background 0.1s;
    }
    .loc-option:last-child { border-bottom: none; }
    .loc-option:hover { background: #f5f5f7; }
    .loc-confirmed {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin-top: 0.375rem;
      font-size: 0.73rem;
      color: #0f766e;
      font-weight: 500;
    }
    .loc-coords { color: #aeaeb2; font-weight: 400; font-size: 0.68rem; font-family: monospace; }
    .loc-error {
      display: flex; align-items: center; gap: 0.35rem;
      font-size: 0.75rem; color: #dc2626;
      margin-top: 0.4rem;
    }

    /* ── Access details ────────────────────── */
    .access-section {
      display: flex; flex-direction: column; gap: 0.6rem;
      padding: 0.75rem 0 0.25rem;
    }
    .access-title {
      display: flex; align-items: center; gap: 0.4rem;
      font-size: 0.72rem; font-weight: 600; color: #52525b;
      letter-spacing: 0.04em; text-transform: uppercase;
    }
    .access-optional { font-weight: 400; color: #a1a1aa; text-transform: none; letter-spacing: 0; }
    .access-row {
      display: flex; align-items: center; gap: 0.75rem;
    }
    .access-label {
      font-size: 0.75rem; color: #71717a; min-width: 52px;
    }
    .access-chips { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .access-chip {
      padding: 0.2rem 0.65rem;
      border-radius: 999px;
      border: 1.5px solid #e4e4e7;
      background: #fafafa;
      font-size: 0.75rem; font-weight: 500; color: #3f3f46;
      cursor: pointer; transition: all 0.15s;
    }
    .access-chip:hover { border-color: #a1a1aa; background: #f4f4f5; }
    .access-chip-on {
      border-color: #18181b; background: #18181b; color: #fff;
    }

    /* ── Error ────────────────────────────── */
    /* ── Job limit overlay ───────────────────── */
    .limit-overlay {
      position: fixed; inset: 0; z-index: 999;
      background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; padding: 1.5rem;
    }
    .limit-card {
      background: #fff; border-radius: 20px; padding: 2.5rem 2rem;
      max-width: 420px; width: 100%; text-align: center;
      box-shadow: 0 24px 64px rgba(0,0,0,0.2);
      display: flex; flex-direction: column; align-items: center; gap: 1rem;
    }
    .limit-icon {
      width: 64px; height: 64px; border-radius: 50%;
      background: #fef3c7; color: #d97706;
      display: flex; align-items: center; justify-content: center;
    }
    .limit-title { font-size: 1.3rem; font-weight: 800; color: #18181b; margin: 0; letter-spacing: -0.02em; }
    .limit-sub { font-size: 0.9rem; color: #71717a; line-height: 1.65; margin: 0; }
    .limit-btns { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; margin-top: 0.5rem; }
    .limit-btn-primary {
      display: flex; align-items: center; justify-content: center;
      background: #18181b; color: #fff; text-decoration: none;
      font-size: 0.9rem; font-weight: 600; padding: 0.8rem 1.5rem;
      border-radius: 99px; transition: background 0.2s;
    }
    .limit-btn-primary:hover { background: #3f3f46; }
    .limit-btn-secondary {
      display: flex; align-items: center; justify-content: center;
      color: #71717a; text-decoration: none;
      font-size: 0.875rem; font-weight: 500; padding: 0.6rem;
      border-radius: 99px; transition: color 0.2s;
    }
    .limit-btn-secondary:hover { color: #18181b; }

    .err-toast {
      position: fixed;
      bottom: 1.25rem;
      left: 50%;
      transform: translateX(-50%);
      background: #fff;
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
      color: #aeaeb2;
      font-size: 0.9rem;
      padding: 0;
      font-family: inherit;
    }
    .err-close:hover { color: #1d1d1f; }
  `]
})
export class JobWizardComponent {
  private api = inject(ApiService);
  protected auth = inject(AuthService);
  private router = inject(Router);

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
    'My kitchen sink is leaking',
    'Need help moving a sofa to another room',
    'Dog needs walking this afternoon',
    'Light switch stopped working',
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

    this.api.analyzeJob({
      rawInput: this.rawInput + this.buildAccessContext(),
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
        this.error.set(err?.error?.message ?? 'Something went wrong. Please try again.');
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
