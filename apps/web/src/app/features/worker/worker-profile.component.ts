import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { VerifyIdentityComponent } from '../../shared/verify-identity.component';
import { ReportProblemComponent } from '../../shared/report-problem.component';
import { WorkerProfileModalComponent } from '../../shared/worker-profile-modal.component';

interface Skill { id: string; name: string; category: { name: string; icon: string } }
interface WorkerSkill { skill: Skill }
interface WorkerProfile {
  id: string; firstName: string; lastName: string; email: string; bio: string | null;
  phone: string | null; hourlyRate: number | null; city: string;
  address: string; latitude: number | null; longitude: number | null;
  isAvailable: boolean; rating: number; totalJobs: number;
  idVerified: boolean; skills: WorkerSkill[];
  dateOfBirth: string | null; profession: string | null;
  customSkills: string[];
}
interface NominatimResult { display_name: string; lat: string; lon: string; address: Record<string, string>; }

@Component({
  selector: 'app-worker-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, VerifyIdentityComponent, ReportProblemComponent, WorkerProfileModalComponent],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div class="inner">
          <div class="header-top">
            <div>
              <p class="eyebrow">Worker profile</p>
              <h1 class="page-title">My profile</h1>
            </div>
            @if (profile()) {
              <div class="header-actions">
                <button class="hdr-btn" type="button" (click)="previewOpen.set(true)">Preview as client →</button>
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
            <button class="tab-btn" [class.tab-active]="activeTab() === 'security'" (click)="activeTab.set('security')" type="button">
              Security
            </button>
            <button class="tab-btn" [class.tab-active]="activeTab() === 'earnings'" (click)="activeTab.set('earnings')" type="button">
              Earnings
            </button>
          </nav>
        </div>
      </div>

      @if (profile()) {
        @if (!profileComplete()) {
          <div class="setup-banner">
            <div class="inner">
              <div class="setup-banner-inner">
                <div class="setup-icon">
                  <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div class="setup-text">
                  <span class="setup-title">Complete your profile to start getting hired</span>
                  <span class="setup-desc">
                    Add your
                    @if (!profile()!.city) { <strong>location</strong> }
                    @if (!profile()!.city && !profile()!.profession) { and }
                    @if (!profile()!.profession) { <strong>profession</strong> }
                    — clients can't find you until your profile is complete.
                  </span>
                </div>
              </div>
            </div>
          </div>
        }
        <div class="slides-outer">
          <div class="slides-track">

            @if (activeTab() === 'profile') {
            <!-- Slide 0: Profile -->
            <div class="slide">
              <div class="page-body">
                <div class="inner">
                  <div class="wp-grid">

                    <!-- Left: Identity card -->
                    <div class="wp-card">
                      <!-- Avatar row -->
                      <div class="wp-avatar-row">
                        <div class="wp-avatar">{{ profile()!.firstName[0] }}{{ profile()!.lastName[0] }}</div>
                        <div class="wp-avatar-main">
                          <p class="wp-avatar-name">{{ profile()!.firstName }} {{ profile()!.lastName }}</p>
                          <p class="wp-avatar-email">{{ profile()!.email }}</p>
                          @if (profile()!.idVerified) {
                            <span class="wp-verified">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                              Verified
                            </span>
                          } @else {
                            <span class="wp-unverified">Not verified</span>
                          }
                        </div>
                      </div>

                      <div class="wp-divider"></div>

                      <p class="wp-eyebrow">Personal info</p>
                      <div class="wp-fields">
                        <div class="wp-field">
                          <label class="wp-label">First name</label>
                          <input class="wp-input" [(ngModel)]="edit.firstName" />
                        </div>
                        <div class="wp-field">
                          <label class="wp-label">Last name</label>
                          <input class="wp-input" [(ngModel)]="edit.lastName" />
                        </div>

                        <div class="wp-field wp-field--full">
                          <label class="wp-label">Phone</label>
                          <input class="wp-input" [(ngModel)]="edit.phone" placeholder="+43 …" />
                        </div>

                        <div class="wp-field wp-field--full">
                          <div class="wp-label-row">
                            <label class="wp-label">Date of birth</label>
                            <span class="wp-hint">Clients see your age, not the exact date</span>
                          </div>
                          <input class="wp-input" type="date" [(ngModel)]="edit.dateOfBirth" [max]="maxDob()" [min]="minDob()" />
                        </div>

                        <div class="wp-field wp-field--full">
                          <div class="wp-label-row">
                            <label class="wp-label">Bio</label>
                            <span class="wp-hint">Visible on your public profile</span>
                          </div>
                          <textarea class="wp-input wp-input--area" [(ngModel)]="edit.bio" rows="3" placeholder="Describe your experience and what makes you stand out…"></textarea>
                        </div>

                        <div class="wp-field wp-field--full">
                          <div class="wp-label-row">
                            <label class="wp-label">Area of expertise</label>
                            <span class="wp-hint">Shown prominently on your profile</span>
                          </div>
                          <select class="wp-input" [(ngModel)]="edit.profession">
                            <option value="">— Select your main profession —</option>
                            <option value="Plumbing">Plumbing</option>
                            <option value="Electrical">Electrical</option>
                            <option value="Carpentry">Carpentry</option>
                            <option value="Painting">Painting</option>
                            <option value="Cleaning">Cleaning</option>
                            <option value="Moving">Moving</option>
                            <option value="Mechanical">Mechanical</option>
                            <option value="Handyman">Handyman</option>
                            <option value="Delivery">Delivery</option>
                            <option value="Caregiving">Caregiving</option>
                            <option value="General Tasks">General Tasks</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        @if (edit.profession === 'Other') {
                          <div class="wp-field wp-field--full">
                            <label class="wp-label">Please specify</label>
                            <input class="wp-input" [(ngModel)]="edit.professionOther" placeholder="e.g. Tiling, Welding…" />
                          </div>
                        }

                        <div class="wp-field">
                          <label class="wp-label">Hourly rate (€)</label>
                          <div class="wp-input-wrap">
                            <span class="wp-input-prefix">€</span>
                            <input class="wp-input wp-input--prefix" type="number" [(ngModel)]="edit.hourlyRate" placeholder="20" />
                          </div>
                        </div>

                        <div class="wp-field">
                          <div class="wp-label-row">
                            <label class="wp-label">Location</label>
                            <span class="wp-hint">Used for distance</span>
                          </div>
                          <div class="wp-loc-wrap">
                            <div class="wp-loc-row">
                              <div class="wp-input-wrap" style="flex:1">
                                <span class="wp-input-prefix">◉</span>
                                <input class="wp-input wp-input--prefix"
                                       [(ngModel)]="locationQuery"
                                       (ngModelChange)="onLocationInput()"
                                       (blur)="onLocationBlur()"
                                       placeholder="Search address, postcode, city…" />
                              </div>
                              <button class="wp-loc-gps" (click)="useMyLocation()" [disabled]="locationLoading()" type="button" title="Use my current location">
                                @if (locationLoading()) {
                                  <span class="loc-spinner"></span>
                                } @else {
                                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
                                }
                              </button>
                            </div>
                            @if (locationSuggestions().length > 0) {
                              <div class="wp-loc-dropdown">
                                @for (item of locationSuggestions(); track item.display_name) {
                                  <button class="wp-loc-opt" (mousedown)="selectLocation(item)" type="button">
                                    {{ item.display_name }}
                                  </button>
                                }
                              </div>
                            }
                            @if (locationConfirmed() && edit.latitude) {
                              <div class="wp-loc-ok">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                                {{ edit.city }}{{ edit.address ? ' · ' + edit.address : '' }}
                              </div>
                            }
                          </div>
                        </div>

                        <!-- Availability toggle -->
                        <div class="wp-field wp-field--full">
                          <div class="wp-avail">
                            <div>
                              <p class="wp-avail-title">Available for work</p>
                              <p class="wp-avail-sub">Visible to clients · turn off when fully booked</p>
                            </div>
                            <button
                              class="wp-toggle"
                              [class.wp-toggle--on]="edit.isAvailable"
                              (click)="edit.isAvailable = !edit.isAvailable"
                              type="button"
                            >
                              <span class="wp-toggle-knob"></span>
                            </button>
                          </div>
                        </div>
                      </div>

                      @if (saveSuccess()) {
                        <div class="wp-banner wp-banner--ok">Profile saved successfully</div>
                      }
                      @if (saveError()) {
                        <div class="wp-banner wp-banner--err">{{ saveError() }}</div>
                      }
                    </div>

                    <!-- Right: Skills card -->
                    <div class="wp-card">
                      <div>
                        <p class="wp-eyebrow">My skills</p>
                        <p class="wp-card-sub">
                          These appear on your profile and help clients find you.
                          Picked <strong>{{ (profile()!.skills.length + customSkills().length) }}</strong> of any.
                        </p>
                      </div>

                      <!-- Selected skills -->
                      <div class="wp-skills-active">
                        <p class="wp-sub-eyebrow">Your active skills</p>
                        <div class="wp-chips">
                          @for (ws of profile()!.skills; track ws.skill.id) {
                            <button class="wp-chip wp-chip--active" (click)="removeSkill(ws.skill.id)" type="button">
                              <span class="wp-chip-check">✓</span>
                              {{ ws.skill.name }}
                              <span class="wp-chip-x">×</span>
                            </button>
                          }
                          @for (name of customSkills(); track name) {
                            <button class="wp-chip wp-chip--active" (click)="removeCustomSkill(name)" type="button">
                              <span class="wp-chip-check">✓</span>
                              {{ name }}
                              <span class="wp-chip-x">×</span>
                            </button>
                          }
                          @if (profile()!.skills.length === 0 && customSkills().length === 0) {
                            <p class="wp-chips-empty">No skills yet — pick a few from below.</p>
                          }
                        </div>
                      </div>

                      <!-- Add custom -->
                      <div>
                        <p class="wp-sub-eyebrow">Add a custom skill</p>
                        <div class="wp-custom-row">
                          <input class="wp-input"
                                 [(ngModel)]="customSkillInput"
                                 placeholder="e.g. Tile installation, HVAC, Welding…"
                                 (keydown.enter)="addCustomSkill()" />
                          <button class="wp-add-btn" (click)="addCustomSkill()" [disabled]="!customSkillInput.trim()" type="button">
                            + Add
                          </button>
                        </div>
                      </div>

                      <!-- Browse -->
                      <div class="wp-browse">
                        <p class="wp-sub-eyebrow">Browse skills</p>
                        @for (group of skillGroups(); track group.category) {
                          <div class="wp-browse-group">
                            <p class="wp-browse-label">
                              <span class="wp-browse-dot" [style.background]="catColor(group.category)"></span>
                              {{ group.category }}
                            </p>
                            <div class="wp-chips">
                              @for (skill of group.skills; track skill.id) {
                                <button
                                  class="wp-chip"
                                  [class.wp-chip--active]="hasSkill(skill.id)"
                                  (click)="toggleSkill(skill)"
                                  type="button"
                                >
                                  @if (hasSkill(skill.id)) { <span class="wp-chip-check">✓</span> }
                                  {{ skill.name }}
                                </button>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    </div>

                  </div><!-- /wp-grid -->

                </div>
              </div>
            </div><!-- /slide-0 -->
            }

            @if (activeTab() === 'identity') {
            <!-- Slide 1: Identity -->
            <div class="slide">
              <div class="page-body">
                <div class="inner">
                  <div class="wi-grid">

                    <!-- LEFT: progress + checklist + trust -->
                    <div class="wi-left">

                      <!-- Progress card -->
                      <div class="wi-card">
                        <div class="wi-progress-head">
                          <div>
                            <p class="wp-eyebrow" style="margin:0">Verification progress</p>
                            <div class="wi-progress-num">
                              <span class="wi-progress-done">{{ idStepsDone() }}</span><span class="wi-progress-total">/{{ idStepsRequired() }}</span>
                              <span class="wi-progress-label">steps complete</span>
                            </div>
                          </div>
                          @if (idInReviewCount() > 0) {
                            <span class="wi-review-pill">
                              <span class="wi-review-dot"></span>
                              {{ idInReviewCount() }} in review
                            </span>
                          }
                        </div>
                        <div class="wi-bar">
                          <div class="wi-bar-fill" [style.width.%]="idProgressPct()"></div>
                        </div>
                        <div class="wi-bar-meta">
                          <span>{{ idProgressPct() }}% complete</span>
                          <span>{{ profile()!.idVerified ? 'Verified' : '~5 min remaining' }}</span>
                        </div>
                      </div>

                      <!-- Checklist -->
                      <div class="wi-card wi-checklist">
                        <div class="wi-checklist-head">Checklist</div>
                        @for (step of idSteps(); track step.id; let i = $index) {
                          <div class="wi-step" [class.wi-step--focus]="step.focus && step.status === 'todo'">
                            <span class="wi-step-dot wi-step-dot--{{ step.status }}">
                              @if (step.status === 'done') {
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#84CC16" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                              } @else if (step.status === 'in-review') {
                                <span class="wi-step-pulse"></span>
                              } @else {
                                {{ i + 1 }}
                              }
                            </span>
                            <div class="wi-step-main">
                              <p class="wi-step-label">{{ step.label }}</p>
                              <p class="wi-step-hint">{{ step.hint }}</p>
                            </div>
                            <span class="wi-step-pill wi-step-pill--{{ step.status }}">{{ stepStatusLabel(step.status) }}</span>
                            @if (step.status === 'todo' && step.focus) {
                              <button class="wi-step-btn" (click)="activeTab.set('identity')" type="button">Start →</button>
                            }
                          </div>
                        }
                      </div>

                      <!-- Trust footer -->
                      <div class="wi-card wi-trust">
                        <div class="wi-trust-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 6v6c0 5 3.5 9.4 8 10 4.5-.6 8-5 8-10V6l-8-4z"/></svg>
                        </div>
                        <div class="wi-trust-main">
                          <p class="wi-trust-title">Bank-grade encryption</p>
                          <p class="wi-trust-sub">
                            Documents are stored encrypted, reviewed by a human, and deleted 30 days after verification.
                          </p>
                        </div>
                        <a routerLink="/terms" class="wi-trust-link">Privacy policy</a>
                      </div>
                    </div>

                    <!-- RIGHT: ID upload focus -->
                    <div class="wi-card wi-right">
                      <div class="wi-right-head">
                        <div>
                          <p class="wp-eyebrow" style="margin:0">Step {{ idCurrentStep() }} of {{ idStepsRequired() }}</p>
                          <p class="wi-right-title">Government-issued ID</p>
                          <p class="wi-right-sub">
                            Upload a clear photo of your passport, national ID, or driver's licence.
                            Both sides if applicable.
                          </p>
                        </div>
                        <span class="wi-step-pill wi-step-pill--{{ idMainStatus() }}">{{ stepStatusLabel(idMainStatus()) }}</span>
                      </div>

                      <div class="wi-right-body">
                        <app-verify-identity />
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div><!-- /slide-1 -->
            }

            @if (activeTab() === 'security') {
            <!-- Slide 2: Security -->
            <div class="slide">
              <div class="page-body">
                <div class="inner">
                  <div class="ws-wrap">

                    <!-- Intro -->
                    <div class="ws-intro">
                      <p class="wp-eyebrow" style="margin:0">Profile · Security</p>
                      <h2 class="ws-intro-title">Security &amp; account</h2>
                      <p class="ws-intro-sub">
                        Manage how you get paid, change your password,
                        report a problem to support, or close your account permanently.
                      </p>
                    </div>

                    <!-- Payment methods -->
                    <section class="ws-section">
                      <header class="ws-head">
                        <span class="ws-head-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/></svg>
                        </span>
                        <div class="ws-head-main">
                          <p class="ws-head-eyebrow">Payment methods</p>
                          <p class="ws-head-title">Payouts &amp; payment</p>
                          <p class="ws-head-sub">
                            Payouts go to your verified bank account, PayPal, Revolut,
                            or Stripe-connected account after each completed job.
                          </p>
                        </div>
                      </header>

                      <div class="ws-body ws-method-list">

                        <!-- Bank -->
                        <div class="ws-method" [class.ws-method--open]="openMethod() === 'bank'">
                          <button class="ws-method-row" (click)="toggleMethod('bank')" type="button">
                            <span class="ws-method-icon ws-icon-bank">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10 12 4l9 6M5 10v8M19 10v8M9 10v8M15 10v8M3 20h18"/></svg>
                            </span>
                            <div class="ws-method-main">
                              <p class="ws-method-name">
                                Bank Transfer (IBAN)
                                @if (bankEdit.iban) { <span class="ws-set-pill">✓ Set</span> }
                              </p>
                              <p class="ws-method-sub">
                                @if (bankEdit.iban) {
                                  {{ formatIban(bankEdit.iban) }}
                                } @else {
                                  Works in 30+ countries · Standard in Europe
                                }
                              </p>
                            </div>
                            <span class="ws-method-chev" [class.ws-method-chev--open]="openMethod() === 'bank'">⌄</span>
                          </button>
                          @if (openMethod() === 'bank') {
                            <div class="ws-method-form">
                              <div class="ws-field">
                                <label class="wp-label">Account holder name</label>
                                <input class="wp-input" [(ngModel)]="bankEdit.accountName" placeholder="Full name as on your bank account" />
                              </div>
                              <div class="ws-field">
                                <label class="wp-label">IBAN</label>
                                <input class="wp-input" [(ngModel)]="bankEdit.iban" placeholder="e.g. AT61 1904 3002 3457 3201" autocomplete="off" />
                              </div>
                              <div class="ws-field">
                                <div class="wp-label-row">
                                  <label class="wp-label">BIC / SWIFT</label>
                                  <span class="wp-hint">optional</span>
                                </div>
                                <input class="wp-input" [(ngModel)]="bankEdit.bic" placeholder="e.g. RLNWATWW" autocomplete="off" />
                              </div>
                              @if (bankSaved()) { <p class="ws-msg ws-msg--ok">Saved</p> }
                              @if (bankError()) { <p class="ws-msg ws-msg--err">{{ bankError() }}</p> }
                              <button class="ws-save-btn" (click)="saveBankDetails()" [disabled]="bankSaving()" type="button">
                                @if (bankSaving()) { Saving… } @else { Save bank details }
                              </button>
                            </div>
                          }
                        </div>

                        <!-- PayPal -->
                        <div class="ws-method" [class.ws-method--open]="openMethod() === 'paypal'">
                          <button class="ws-method-row" (click)="toggleMethod('paypal')" type="button">
                            <span class="ws-method-icon ws-icon-paypal">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7.144 19.532l1.049-5.751c.11-.606.691-1.002 1.304-.862 2.493.57 6.284.233 7.94-3.299 1.91-4.048-.957-6.582-5.058-6.584H6.01c-.56 0-1.038.404-1.137.957L2.532 19.37c-.088.485.285.942.781.942h3.048c.38 0 .703-.272.783-.64v-.14z"/></svg>
                            </span>
                            <div class="ws-method-main">
                              <p class="ws-method-name">
                                PayPal
                                @if (paypalEdit) { <span class="ws-set-pill">✓ Set</span> }
                              </p>
                              <p class="ws-method-sub">
                                @if (paypalEdit) { {{ paypalEdit }} } @else { Instant transfers · Available worldwide }
                              </p>
                            </div>
                            <span class="ws-method-chev" [class.ws-method-chev--open]="openMethod() === 'paypal'">⌄</span>
                          </button>
                          @if (openMethod() === 'paypal') {
                            <div class="ws-method-form">
                              <div class="ws-field">
                                <label class="wp-label">PayPal email address</label>
                                <input class="wp-input" type="email" [(ngModel)]="paypalEdit" placeholder="your@email.com" autocomplete="off" />
                              </div>
                              @if (paypalSaved()) { <p class="ws-msg ws-msg--ok">Saved</p> }
                              @if (paypalError()) { <p class="ws-msg ws-msg--err">{{ paypalError() }}</p> }
                              <button class="ws-save-btn" (click)="savePaypal()" [disabled]="paypalSaving()" type="button">
                                @if (paypalSaving()) { Saving… } @else { Save PayPal }
                              </button>
                            </div>
                          }
                        </div>

                        <!-- Revolut -->
                        <div class="ws-method" [class.ws-method--open]="openMethod() === 'revolut'">
                          <button class="ws-method-row" (click)="toggleMethod('revolut')" type="button">
                            <span class="ws-method-icon ws-icon-revolut">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3H7.5C5.015 3 3 5.015 3 7.5v9c0 2.485 2.015 4.5 4.5 4.5h9c2.485 0 4.5-2.015 4.5-4.5v-9C21 5.015 18.985 3 16.5 3zm-2.1 12.3l-2.55-3.75H9.9v3.75H7.95V8.7H12c1.8 0 3 .9 3 2.625 0 1.2-.675 2.1-1.725 2.4L16.05 15.3h-1.65z"/></svg>
                            </span>
                            <div class="ws-method-main">
                              <p class="ws-method-name">
                                Revolut
                                @if (revolutEdit) { <span class="ws-set-pill">✓ Set</span> }
                              </p>
                              <p class="ws-method-sub">
                                @if (revolutEdit) { {{ revolutEdit }} } @else { Popular in Europe · Email or phone }
                              </p>
                            </div>
                            <span class="ws-method-chev" [class.ws-method-chev--open]="openMethod() === 'revolut'">⌄</span>
                          </button>
                          @if (openMethod() === 'revolut') {
                            <div class="ws-method-form">
                              <div class="ws-field">
                                <label class="wp-label">Revolut email or phone</label>
                                <input class="wp-input" [(ngModel)]="revolutEdit" placeholder="+43 123 456 789 or you@email.com" autocomplete="off" />
                              </div>
                              @if (revolutSaved()) { <p class="ws-msg ws-msg--ok">Saved</p> }
                              @if (revolutError()) { <p class="ws-msg ws-msg--err">{{ revolutError() }}</p> }
                              <button class="ws-save-btn" (click)="saveRevolut()" [disabled]="revolutSaving()" type="button">
                                @if (revolutSaving()) { Saving… } @else { Save Revolut }
                              </button>
                            </div>
                          }
                        </div>

                        <!-- Stripe Connect -->
                        <div class="ws-method" [class.ws-method--open]="openMethod() === 'stripe'">
                          <button class="ws-method-row" (click)="toggleMethod('stripe')" type="button">
                            <span class="ws-method-icon ws-icon-stripe">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/></svg>
                            </span>
                            <div class="ws-method-main">
                              <p class="ws-method-name">
                                Stripe Connect
                                @if (connectStatus()?.payoutsEnabled) { <span class="ws-set-pill">✓ Active</span> }
                              </p>
                              <p class="ws-method-sub">Automatic instant payouts · Requires platform approval</p>
                            </div>
                            <span class="ws-method-chev" [class.ws-method-chev--open]="openMethod() === 'stripe'">⌄</span>
                          </button>
                          @if (openMethod() === 'stripe') {
                            <div class="ws-method-form">
                              @if (!connectStatus()) {
                                <p class="ws-msg">Checking status…</p>
                              } @else if (connectStatus()!.payoutsEnabled) {
                                <p class="ws-msg ws-msg--ok">
                                  Payouts enabled. Earnings are transferred automatically after each job.
                                </p>
                                <button class="ws-save-btn ws-save-btn--ghost" (click)="openConnectDashboard()" [disabled]="connectLoading()" type="button">
                                  Open Stripe dashboard
                                </button>
                              } @else if (connectStatus()!.connected) {
                                <p class="ws-msg">Your Stripe account is connected but onboarding isn't complete yet.</p>
                                <button class="ws-save-btn" (click)="startConnectOnboarding()" [disabled]="connectLoading()" type="button">
                                  @if (connectLoading()) { Loading… } @else { Continue onboarding }
                                </button>
                              } @else {
                                <p class="ws-msg">Connect your Stripe account to receive automatic instant payouts.</p>
                                <button class="ws-save-btn" (click)="startConnectOnboarding()" [disabled]="connectLoading()" type="button">
                                  @if (connectLoading()) { Loading… } @else { Connect with Stripe }
                                </button>
                              }
                              @if (connectError()) { <p class="ws-msg ws-msg--err">{{ connectError() }}</p> }
                            </div>
                          }
                        </div>
                      </div>
                    </section>

                    <!-- Password -->
                    <section class="ws-section">
                      <header class="ws-head">
                        <span class="ws-head-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/></svg>
                        </span>
                        <div class="ws-head-main">
                          <p class="ws-head-eyebrow">Sign-in</p>
                          <p class="ws-head-title">Change password</p>
                          <p class="ws-head-sub">Use at least 8 characters with a mix of letters and numbers.</p>
                        </div>
                      </header>
                      <div class="ws-body">
                        <div class="ws-fields-2">
                          <div class="ws-field">
                            <label class="wp-label">Current password</label>
                            <input class="wp-input" type="password" [(ngModel)]="pw.current" autocomplete="current-password" />
                          </div>
                          <div class="ws-field">
                            <label class="wp-label">New password</label>
                            <input class="wp-input" type="password" [(ngModel)]="pw.next" autocomplete="new-password" />
                          </div>
                          <div class="ws-field ws-field--full">
                            <label class="wp-label">Confirm new password</label>
                            <input class="wp-input" type="password" [(ngModel)]="pw.confirm" autocomplete="new-password" />
                          </div>
                        </div>
                        @if (pwError()) { <p class="ws-msg ws-msg--err">{{ pwError() }}</p> }
                        @if (pwSuccess()) { <p class="ws-msg ws-msg--ok">Password updated</p> }
                        <button class="ws-save-btn" (click)="changePassword()" [disabled]="pwSaving()" type="button">
                          {{ pwSaving() ? 'Saving…' : 'Update password' }}
                        </button>
                      </div>
                    </section>

                    <!-- Report a problem -->
                    <section class="ws-section">
                      <header class="ws-head">
                        <span class="ws-head-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.5"/></svg>
                        </span>
                        <div class="ws-head-main">
                          <p class="ws-head-eyebrow">Support</p>
                          <p class="ws-head-title">Report a problem</p>
                          <p class="ws-head-sub">
                            Tell us what's going wrong and we'll get back within one business day.
                          </p>
                        </div>
                      </header>
                      <div class="ws-body">
                        @if (reportSent()) {
                          <div class="ws-report-sent">
                            <span class="ws-report-sent-icon">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                            </span>
                            <div class="ws-report-sent-main">
                              <p class="ws-report-sent-title">Report sent</p>
                              <p class="ws-report-sent-sub">We'll email you at the address on file. Reply to that thread to add detail.</p>
                            </div>
                            <button class="ws-save-btn ws-save-btn--ghost" (click)="resetReport()" type="button">Report another</button>
                          </div>
                        } @else {
                          <p class="ws-mini-label">What's the issue?</p>
                          <div class="ws-issue-grid">
                            @for (t of issueTypes; track t.id) {
                              <button
                                class="ws-issue"
                                [class.ws-issue--active]="reportCategory() === t.id"
                                (click)="reportCategory.set(t.id)"
                                type="button"
                              >
                                <span class="ws-issue-radio">
                                  @if (reportCategory() === t.id) { <span class="ws-issue-radio-dot"></span> }
                                </span>
                                <div>
                                  <p class="ws-issue-label">{{ t.label }}</p>
                                  <p class="ws-issue-desc">{{ t.desc }}</p>
                                </div>
                              </button>
                            }
                          </div>

                          <p class="ws-mini-label" style="margin-top:14px">Describe the problem</p>
                          <textarea
                            class="wp-input wp-input--area"
                            [(ngModel)]="reportBody"
                            rows="4"
                            placeholder="What happened? Include any job IDs, transaction IDs, or details you can share."
                          ></textarea>
                          @if (reportError()) { <p class="ws-msg ws-msg--err">{{ reportError() }}</p> }
                          <div class="ws-report-foot">
                            <span class="ws-report-hint">Min. 10 characters</span>
                            <button
                              class="ws-save-btn ws-save-btn--lime"
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

                    <!-- Delete account (danger) -->
                    <section class="ws-section ws-section--danger">
                      <header class="ws-head ws-head--danger">
                        <span class="ws-head-icon ws-head-icon--danger">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>
                        </span>
                        <div class="ws-head-main">
                          <p class="ws-head-eyebrow ws-head-eyebrow--danger">Danger zone</p>
                          <p class="ws-head-title ws-head-title--danger">Delete account</p>
                          <p class="ws-head-sub">
                            This permanently removes your profile, applications, ratings, and saved jobs.
                            In-progress jobs must be completed or cancelled first. This cannot be undone.
                          </p>
                        </div>
                      </header>
                      <div class="ws-body">
                        <div class="ws-danger-list">
                          <p class="ws-danger-list-title">What gets deleted</p>
                          <ul>
                            <li><span class="ws-danger-dot"></span> Your worker profile and verification</li>
                            <li><span class="ws-danger-dot"></span> All applications, saved jobs, and message history</li>
                            <li><span class="ws-danger-dot"></span> Earnings analytics and rating history</li>
                            <li><span class="ws-danger-dot"></span> Payout methods on file (your bank stays with your bank)</li>
                          </ul>
                        </div>

                        @if (!confirmDelete()) {
                          <button class="ws-delete-btn" (click)="confirmDelete.set(true)" type="button">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>
                            Delete my account
                          </button>
                        } @else {
                          <div class="ws-delete-confirm">
                            <p class="ws-delete-typed">
                              Type <span class="ws-delete-typed-word">DELETE</span> to confirm.
                            </p>
                            <p class="ws-delete-typed-sub">Your account is queued for deletion immediately. This cannot be undone.</p>
                            <input
                              class="wp-input"
                              [(ngModel)]="deleteText"
                              placeholder="Type DELETE"
                              autocomplete="off"
                              style="margin-top:12px;font-family:var(--mono);letter-spacing:0.08em"
                            />
                            @if (deleteError()) { <p class="ws-msg ws-msg--err">{{ deleteError() }}</p> }
                            <div class="ws-delete-actions">
                              <button class="ws-save-btn ws-save-btn--ghost" (click)="confirmDelete.set(false); deleteText = ''" type="button">Cancel</button>
                              <button
                                class="ws-delete-btn ws-delete-btn--solid"
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
            </div><!-- /slide-2 -->
            }

            @if (activeTab() === 'earnings') {
            <!-- Slide 3: Earnings -->
            <div class="slide">
              <div class="page-body">
                <div class="inner">
                  <div class="we-wrap">

                    <!-- Sub-header: range filter + actions -->
                    <div class="we-subhead">
                      <div>
                        <p class="wp-eyebrow" style="margin:0">Earnings &amp; activity</p>
                        <p class="we-subhead-title">Wallet</p>
                        <p class="we-subhead-sub">Where your money sits, lands, and leaves.</p>
                      </div>
                      <div class="we-actions">
                        <div class="we-range">
                          @for (r of earningRanges; track r) {
                            <button
                              class="we-range-btn"
                              [class.we-range-btn--active]="earningsRange() === r"
                              (click)="earningsRange.set(r)"
                              type="button"
                            >{{ r }}</button>
                          }
                        </div>
                        <button class="we-btn" type="button">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M6 10l6 6 6-6"/><path d="M4 20h16"/></svg>
                          Export CSV
                        </button>
                      </div>
                    </div>

                    <!-- Hero balance + secondary stats -->
                    <div class="we-hero-grid">
                      <!-- Big balance card -->
                      <div class="wp-card we-balance-card">
                        <div class="we-balance-top">
                          <div>
                            <p class="wp-eyebrow" style="margin:0">Total earned · last 90 days</p>
                            <p class="we-balance-amount">
                              <span class="we-balance-whole">€{{ earnedWhole() }}</span><span class="we-balance-dec">.{{ earnedDec() }}</span>
                            </p>
                            @if (stats()) {
                              <p class="we-balance-growth">
                                ↑ €{{ (stats().totalEarned).toFixed(0) }} lifetime
                                <span class="we-balance-growth-dim">· {{ stats().jobsCompleted }} job{{ stats().jobsCompleted === 1 ? '' : 's' }} completed</span>
                              </p>
                            }
                          </div>
                          <!-- Spark placeholder -->
                          <svg class="we-spark" width="200" height="60" viewBox="0 0 200 60" preserveAspectRatio="none">
                            <path d="M0 50 Q40 45 60 38 T120 22 T180 12" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M0 50 Q40 45 60 38 T120 22 T180 12 L200 12 L200 60 L0 60 Z" fill="rgba(132,204,22,0.18)" stroke="none"/>
                            <circle cx="180" cy="12" r="3" fill="var(--ink)"/>
                          </svg>
                        </div>

                        <!-- Category split (visual placeholder) -->
                        <div class="we-split">
                          <div class="we-split-bar">
                            <div class="we-split-seg" style="width:62%;background:var(--ink)"></div>
                            <div class="we-split-seg" style="width:20%;background:var(--accent)"></div>
                            <div class="we-split-seg" style="width:12%;background:#F59E0B"></div>
                            <div class="we-split-seg" style="width:6%;background:#A3A3A3"></div>
                          </div>
                          <div class="we-split-legend">
                            <span><span class="we-split-dot" style="background:var(--ink)"></span> Plumbing 62%</span>
                            <span><span class="we-split-dot" style="background:var(--accent)"></span> Cleaning 20%</span>
                            <span><span class="we-split-dot" style="background:#F59E0B"></span> Electrical 12%</span>
                            <span><span class="we-split-dot" style="background:#A3A3A3"></span> General 6%</span>
                          </div>
                        </div>
                      </div>

                      <!-- 2x2 stats -->
                      <div class="we-stat-grid">
                        <div class="we-stat">
                          <p class="we-stat-label">Available to withdraw</p>
                          <p class="we-stat-val we-stat-val--accent we-stat-val--mono">€{{ stats() ? stats().totalEarned.toFixed(2) : '—' }}</p>
                          <p class="we-stat-sub">payout in 1 business day</p>
                        </div>
                        <div class="we-stat">
                          <p class="we-stat-label">In escrow</p>
                          <p class="we-stat-val we-stat-val--warn we-stat-val--mono">€{{ stats() ? stats().pendingPayout.toFixed(2) : '—' }}</p>
                          <p class="we-stat-sub">{{ stats()?.pendingPayout ? 'active job(s)' : 'none active' }}</p>
                        </div>
                        <div class="we-stat">
                          <p class="we-stat-label">Lifetime payout</p>
                          <p class="we-stat-val we-stat-val--mono">€{{ stats() ? stats().totalEarned.toFixed(0) : '—' }}</p>
                          <p class="we-stat-sub">across {{ stats()?.jobsCompleted ?? 0 }} jobs</p>
                        </div>
                        <div class="we-stat">
                          <p class="we-stat-label">Avg per job</p>
                          <p class="we-stat-val we-stat-val--mono">€{{ avgPerJob() }}</p>
                          <p class="we-stat-sub">over {{ stats()?.jobsCompleted ?? 0 }} jobs</p>
                        </div>
                      </div>
                    </div>

                    <!-- Activity stats row -->
                    <div class="we-activity-row">
                      <div class="we-stat">
                        <p class="we-stat-label">Jobs done</p>
                        <p class="we-stat-val">{{ stats()?.jobsCompleted ?? 0 }}</p>
                        <p class="we-stat-sub">all time</p>
                      </div>
                      <div class="we-stat">
                        <p class="we-stat-label">Rating</p>
                        <p class="we-stat-val">
                          {{ stats()?.rating ? stats().rating.toFixed(2) : '—' }}<span class="we-star">★</span>
                        </p>
                        <p class="we-stat-sub">{{ stats()?.totalReviews ?? 0 }} review{{ stats()?.totalReviews === 1 ? '' : 's' }}</p>
                      </div>
                      <div class="we-stat">
                        <p class="we-stat-label">Acceptance rate</p>
                        <p class="we-stat-val">{{ stats()?.acceptanceRate ?? 0 }}%</p>
                        <p class="we-stat-sub">apps accepted</p>
                      </div>
                      <div class="we-stat">
                        <p class="we-stat-label">Applications sent</p>
                        <p class="we-stat-val">{{ stats()?.totalApplications ?? 0 }}</p>
                        <p class="we-stat-sub">all time</p>
                      </div>
                      <div class="we-stat">
                        <p class="we-stat-label">Profile views</p>
                        <p class="we-stat-val">—</p>
                        <p class="we-stat-sub">coming soon</p>
                      </div>
                    </div>

                    <!-- Transactions + payout method -->
                    <div class="we-bottom-grid">
                      <!-- Transactions panel -->
                      <div class="wp-card we-tx-card">
                        <div class="we-tx-head">
                          <div class="we-tx-head-left">
                            Transactions
                            <span class="we-tx-count">0</span>
                          </div>
                          <div class="we-tx-filters">
                            <button class="we-pill we-pill--active" type="button">All</button>
                            <button class="we-pill" type="button">Income</button>
                            <button class="we-pill" type="button">Payouts</button>
                          </div>
                        </div>

                        <div class="we-tx-empty">
                          <p class="we-tx-empty-title">No transactions yet</p>
                          <p class="we-tx-empty-sub">
                            Complete a job and your earnings will land here.
                            We'll show each payout, fee, and withdrawal with a reference number you can search.
                          </p>
                        </div>
                      </div>

                      <!-- Payout method -->
                      <div class="wp-card we-payout-card">
                        <p class="we-payout-title">Payout method</p>

                        <div class="we-payout-bank">
                          <div class="we-payout-bank-glow"></div>
                          <div class="we-payout-bank-row">
                            <span class="we-payout-bank-label">
                              {{ bankEdit.iban ? 'Bank account' : (paypalEdit ? 'PayPal' : (revolutEdit ? 'Revolut' : 'No method set')) }}
                            </span>
                            @if (bankEdit.iban || paypalEdit || revolutEdit) {
                              <span class="we-payout-bank-badge">Default</span>
                            }
                          </div>
                          <p class="we-payout-bank-num">
                            @if (bankEdit.iban) {
                              {{ formatIban(bankEdit.iban) }}
                            } @else if (paypalEdit) {
                              {{ paypalEdit }}
                            } @else if (revolutEdit) {
                              {{ revolutEdit }}
                            } @else {
                              — no payout method —
                            }
                          </p>
                          <div class="we-payout-bank-foot">
                            <span>{{ bankEdit.iban && bankEdit.bic ? bankEdit.bic : (bankEdit.iban ? 'BANK' : '—') }}</span>
                            <span>{{ (bankEdit.accountName || (profile()!.firstName + ' ' + profile()!.lastName)).toUpperCase() }}</span>
                          </div>
                        </div>

                        <button class="we-payout-add" (click)="activeTab.set('security')" type="button">
                          + {{ bankEdit.iban || paypalEdit || revolutEdit ? 'Manage methods' : 'Add a method' }}
                        </button>

                        <div class="we-payout-auto">
                          <p class="we-payout-auto-label">Auto-payout</p>
                          <p class="we-payout-auto-text">
                            Funds clear from escrow 24h after job completion.
                            Auto-withdraw sweeps your balance every Monday.
                          </p>
                          <div class="we-payout-toggle-row">
                            <span class="we-payout-toggle-label">Auto-withdraw weekly</span>
                            <button
                              class="wp-toggle"
                              [class.wp-toggle--on]="autoWithdraw()"
                              (click)="autoWithdraw.set(!autoWithdraw())"
                              type="button"
                            >
                              <span class="wp-toggle-knob"></span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div><!-- /slide-3 -->
            }

          </div><!-- /slides-track -->
        </div><!-- /slides-outer -->
      } @else {
        <div class="loading">
          <div class="load-ring"></div>
          <p>Loading your profile…</p>
        </div>
      }

      @if (showReportModal()) {
        <app-report-problem (closed)="showReportModal.set(false)" />
      }

      @if (previewOpen() && profile()) {
        <app-worker-profile-modal
          [workerId]="profile()!.id"
          [preview]="true"
          (close)="previewOpen.set(false)"
        />
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
    * { box-sizing: border-box; }
    .page {
      min-height: calc(100vh - 56px);
      background: var(--bg);
      color: var(--ink);
      font-family: var(--font);
      -webkit-font-smoothing: antialiased;
    }
    .inner { max-width: 1180px; margin: 0 auto; padding: 0 40px; }

    /* ── Header ───────────────────────────── */
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
    .header-actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .hdr-btn {
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid var(--rule);
      background: var(--panel);
      font-size: 12.5px;
      font-family: var(--font);
      color: var(--ink);
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .hdr-btn:hover:not(:disabled) { border-color: var(--sub); }
    .hdr-btn--primary {
      padding: 8px 16px;
      border: none;
      background: var(--ink);
      color: #fff;
      font-weight: 500;
    }
    .hdr-btn--primary:hover:not(:disabled) { background: #262626; }
    .hdr-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Tabs ─────────────────────────────── */
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

    /* ── Security slide ─────────────────────── */
    .ws-wrap {
      padding: 20px 0 32px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .ws-intro {
      margin-bottom: 4px;
    }
    .ws-intro-title {
      font-size: 24px;
      font-weight: 500;
      letter-spacing: -0.025em;
      color: var(--ink);
      margin: 6px 0 6px;
      line-height: 1.1;
    }
    .ws-intro-sub {
      font-size: 13px;
      color: var(--muted);
      margin: 0;
      line-height: 1.55;
      max-width: 580px;
    }

    .ws-section {
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 14px;
      overflow: hidden;
    }
    .ws-section--danger {
      border-color: #FECACA;
    }
    .ws-head {
      padding: 20px 24px 16px;
      display: flex;
      gap: 14px;
      align-items: flex-start;
      border-bottom: 1px solid var(--rule);
    }
    .ws-head--danger {
      background: #FEF2F2;
      border-bottom-color: #FECACA;
    }
    .ws-head-icon {
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
    .ws-head-icon--danger {
      background: #FFFFFF;
      color: #DC2626;
    }
    .ws-head-main { flex: 1; }
    .ws-head-eyebrow {
      font-size: 10.5px;
      color: var(--muted);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0;
    }
    .ws-head-eyebrow--danger { color: #DC2626; }
    .ws-head-title {
      font-size: 18px;
      font-weight: 500;
      color: var(--ink);
      margin: 4px 0 0;
      letter-spacing: -0.015em;
    }
    .ws-head-title--danger { color: #DC2626; }
    .ws-head-sub {
      font-size: 13px;
      color: var(--muted);
      margin: 6px 0 0;
      line-height: 1.5;
      max-width: 560px;
    }

    .ws-body { padding: 18px 24px 22px; }

    /* Payout method rows */
    .ws-method-list {
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .ws-section .ws-body.ws-method-list { padding: 18px 24px 22px; }
    .ws-method {
      border: 1px solid var(--rule);
      border-radius: 12px;
      overflow: hidden;
      background: var(--panel);
      transition: border-color 0.15s;
    }
    .ws-method--open { border-color: var(--ink); }
    .ws-method-row {
      width: 100%;
      padding: 14px 16px;
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 14px;
      font-family: var(--font);
      text-align: left;
    }
    .ws-method-row:hover { background: var(--soft); }
    .ws-method-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .ws-icon-bank { background: #EFF6FF; color: #1D4ED8; }
    .ws-icon-paypal { background: #EEF2FF; color: #4338CA; }
    .ws-icon-revolut { background: #F0F9FF; color: #0369A1; }
    .ws-icon-stripe { background: #FAF5FF; color: #7C3AED; }
    .ws-method-main { flex: 1; min-width: 0; }
    .ws-method-name {
      font-size: 13.5px;
      color: var(--ink);
      font-weight: 500;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ws-method-sub {
      font-size: 11.5px;
      color: var(--muted);
      margin: 3px 0 0;
      font-family: var(--mono);
    }
    .ws-set-pill {
      padding: 2px 8px;
      border-radius: 999px;
      background: #F0FAE0;
      color: var(--accent-text);
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: 0.05em;
      font-family: var(--mono);
    }
    .ws-method-chev {
      color: var(--muted);
      font-size: 14px;
      transition: transform 0.15s;
      flex-shrink: 0;
    }
    .ws-method-chev--open { transform: rotate(180deg); }
    .ws-method-form {
      padding: 14px 16px 16px;
      border-top: 1px solid var(--rule);
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: var(--panel);
    }

    /* Fields */
    .ws-field { display: flex; flex-direction: column; gap: 6px; }
    .ws-fields-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .ws-field--full { grid-column: 1 / -1; }

    /* Save button */
    .ws-save-btn {
      align-self: flex-start;
      padding: 9px 16px;
      border-radius: 10px;
      border: none;
      background: var(--ink);
      color: #fff;
      font-size: 12.5px;
      font-family: var(--font);
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
    }
    .ws-save-btn:hover:not(:disabled) { background: #262626; }
    .ws-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .ws-save-btn--lime {
      background: var(--accent);
      color: var(--accent-ink);
      font-weight: 600;
    }
    .ws-save-btn--lime:hover:not(:disabled) { background: #a3e635; }
    .ws-save-btn--ghost {
      background: var(--panel);
      color: var(--ink);
      border: 1px solid var(--rule);
    }
    .ws-save-btn--ghost:hover:not(:disabled) { background: var(--soft); border-color: var(--sub); }

    .ws-msg {
      font-size: 12px;
      margin: 0;
      color: var(--muted);
    }
    .ws-msg--ok {
      color: var(--accent-text);
    }
    .ws-msg--err { color: #B91C1C; }

    /* Report a problem */
    .ws-mini-label {
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0 0 10px;
    }
    .ws-issue-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .ws-issue {
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
      transition: all 0.12s;
    }
    .ws-issue:hover { border-color: var(--sub); }
    .ws-issue--active {
      border-color: var(--ink);
      background: var(--soft);
    }
    .ws-issue-radio {
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
    .ws-issue--active .ws-issue-radio {
      border-color: var(--ink);
    }
    .ws-issue-radio-dot {
      width: 6px;
      height: 6px;
      border-radius: 3px;
      background: var(--ink);
    }
    .ws-issue-label {
      font-size: 13px;
      color: var(--ink);
      font-weight: 500;
      margin: 0;
    }
    .ws-issue-desc {
      font-size: 11.5px;
      color: var(--muted);
      margin: 2px 0 0;
      line-height: 1.4;
    }
    .ws-report-foot {
      margin-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .ws-report-hint {
      font-size: 11.5px;
      color: var(--sub);
    }
    .ws-report-sent {
      padding: 16px 18px;
      border: 1px solid rgba(132,204,22,0.4);
      border-radius: 12px;
      background: #F0FAE0;
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .ws-report-sent-icon {
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
    .ws-report-sent-main { flex: 1; }
    .ws-report-sent-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--ink);
      margin: 0;
    }
    .ws-report-sent-sub {
      font-size: 12.5px;
      color: var(--muted);
      margin: 2px 0 0;
    }

    /* Danger / delete */
    .ws-danger-list {
      background: #FEF2F2;
      border: 1px solid #FECACA;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .ws-danger-list-title {
      font-size: 11px;
      color: #DC2626;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 600;
      margin: 0 0 8px;
    }
    .ws-danger-list ul {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ws-danger-list li {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 13px;
      color: #7F1D1D;
    }
    .ws-danger-dot {
      width: 4px;
      height: 4px;
      border-radius: 2px;
      background: #DC2626;
      flex-shrink: 0;
    }
    .ws-delete-btn {
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
      transition: background 0.15s;
    }
    .ws-delete-btn:hover { background: #FEF2F2; }
    .ws-delete-btn--solid {
      border: none;
      background: #DC2626;
      color: #fff;
    }
    .ws-delete-btn--solid:hover:not(:disabled) { background: #B91C1C; }
    .ws-delete-btn--solid:disabled {
      background: #FCA5A5;
      cursor: not-allowed;
    }
    .ws-delete-confirm {
      margin-top: 14px;
      padding: 16px 18px;
      border: 1px solid #DC2626;
      border-radius: 10px;
      background: var(--panel);
    }
    .ws-delete-typed {
      font-size: 13.5px;
      color: var(--ink);
      font-weight: 500;
      margin: 0;
    }
    .ws-delete-typed-word {
      font-family: var(--mono);
      background: #FEF2F2;
      color: #DC2626;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .ws-delete-typed-sub {
      font-size: 12px;
      color: var(--muted);
      margin: 4px 0 0;
    }
    .ws-delete-actions {
      margin-top: 12px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    @media (max-width: 720px) {
      .ws-fields-2 { grid-template-columns: 1fr; }
      .ws-issue-grid { grid-template-columns: 1fr; }
      .ws-head { padding: 16px 18px 12px; }
      .ws-body { padding: 14px 18px 18px; }
    }

    /* ── Earnings slide ──────────────────────── */
    .we-wrap {
      padding: 20px 0 28px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .we-subhead {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
    }
    .we-subhead-title {
      font-size: 22px;
      font-weight: 500;
      letter-spacing: -0.02em;
      color: var(--ink);
      margin: 6px 0 0;
      line-height: 1;
    }
    .we-subhead-sub {
      font-size: 12.5px;
      color: var(--muted);
      margin: 6px 0 0;
    }
    .we-actions {
      display: flex;
      gap: 6px;
      align-items: center;
      flex-wrap: wrap;
    }
    .we-range {
      display: inline-flex;
      padding: 3px;
      border-radius: 999px;
      border: 1px solid var(--rule);
      background: var(--panel);
    }
    .we-range-btn {
      padding: 6px 12px;
      border-radius: 999px;
      border: none;
      background: transparent;
      color: var(--muted);
      font-size: 11.5px;
      font-family: var(--font);
      cursor: pointer;
      transition: all 0.12s;
    }
    .we-range-btn--active {
      background: var(--ink);
      color: #fff;
      font-weight: 500;
    }
    .we-btn {
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
      transition: border-color 0.15s;
    }
    .we-btn:hover { border-color: var(--sub); }
    .we-btn--primary {
      padding: 8px 16px;
      border: none;
      background: var(--ink);
      color: #fff;
      font-weight: 500;
    }
    .we-btn--primary:hover { background: #262626; }

    /* Hero grid */
    .we-hero-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 14px;
    }
    .we-balance-card {
      padding: 22px 26px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .we-balance-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    .we-balance-amount {
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
    .we-balance-whole { color: var(--ink); }
    .we-balance-dec {
      font-size: 18px;
      color: var(--muted);
      font-weight: 400;
      margin-left: 4px;
    }
    .we-balance-growth {
      font-size: 12px;
      color: var(--accent-text);
      margin: 8px 0 0;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .we-balance-growth-dim { color: var(--muted); }
    .we-spark {
      display: block;
      flex-shrink: 0;
      max-width: 200px;
    }

    .we-split {
      margin-top: 8px;
    }
    .we-split-bar {
      display: flex;
      height: 6px;
      border-radius: 999px;
      overflow: hidden;
      background: var(--soft);
    }
    .we-split-seg { height: 100%; }
    .we-split-legend {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      font-size: 11px;
      color: var(--muted);
      flex-wrap: wrap;
      gap: 8px;
    }
    .we-split-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 3px;
      margin-right: 4px;
    }

    /* Stats grid (2x2 + 5-col row) */
    .we-stat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 10px;
    }
    .we-activity-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
    }
    .we-stat {
      padding: 16px 18px;
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 12px;
    }
    .we-stat-label {
      font-size: 10.5px;
      color: var(--muted);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0;
    }
    .we-stat-val {
      font-size: 22px;
      font-weight: 500;
      color: var(--ink);
      letter-spacing: -0.02em;
      line-height: 1;
      margin: 8px 0 0;
      font-variant-numeric: tabular-nums;
    }
    .we-stat-val--accent { color: var(--positive, #15803D); }
    .we-stat-val--warn { color: #B45309; }
    .we-stat-val--mono { font-family: var(--mono); }
    .we-stat-sub {
      font-size: 11px;
      color: var(--sub);
      margin: 6px 0 0;
    }
    .we-star { color: var(--accent); margin-left: 4px; }

    /* Bottom grid: transactions + payout */
    .we-bottom-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 14px;
    }

    .we-tx-card {
      padding: 0;
      overflow: hidden;
    }
    .we-tx-head {
      padding: 16px 22px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--rule);
    }
    .we-tx-head-left {
      font-size: 12px;
      font-weight: 500;
      color: var(--ink);
      letter-spacing: -0.005em;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .we-tx-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 18px;
      padding: 0 6px;
      border-radius: 999px;
      background: var(--ink);
      color: #fff;
      font-size: 10.5px;
      font-weight: 600;
    }
    .we-tx-filters { display: flex; gap: 6px; }
    .we-pill {
      padding: 5px 10px;
      border-radius: 999px;
      border: 1px solid var(--rule);
      background: var(--panel);
      color: var(--muted);
      font-size: 11px;
      font-family: var(--font);
      cursor: pointer;
    }
    .we-pill--active {
      background: var(--ink);
      color: #fff;
      border-color: var(--ink);
    }
    .we-tx-empty {
      padding: 40px 32px;
      text-align: center;
    }
    .we-tx-empty-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--ink);
      margin: 0;
    }
    .we-tx-empty-sub {
      font-size: 12.5px;
      color: var(--muted);
      margin: 6px auto 0;
      max-width: 360px;
      line-height: 1.5;
    }

    /* Payout method card */
    .we-payout-card {
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .we-payout-title {
      font-size: 12px;
      font-weight: 500;
      color: var(--ink);
      letter-spacing: -0.005em;
      margin: 0;
    }

    .we-payout-bank {
      padding: 14px 16px;
      border-radius: 12px;
      background: var(--ink);
      color: #fff;
      display: flex;
      flex-direction: column;
      gap: 14px;
      position: relative;
      overflow: hidden;
    }
    .we-payout-bank-glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 100% 0%, rgba(132,204,22,0.2), transparent 60%);
      pointer-events: none;
    }
    .we-payout-bank > *:not(.we-payout-bank-glow) { position: relative; }
    .we-payout-bank-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .we-payout-bank-label {
      font-size: 10.5px;
      color: #A3A3A3;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .we-payout-bank-badge {
      font-size: 10.5px;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--accent);
      color: var(--accent-ink);
      font-weight: 600;
    }
    .we-payout-bank-num {
      font-size: 14px;
      font-family: var(--mono);
      letter-spacing: 0.06em;
      margin: 0;
    }
    .we-payout-bank-foot {
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      color: #A3A3A3;
    }

    .we-payout-add {
      padding: 8px;
      border-radius: 8px;
      border: 1px solid var(--rule);
      background: var(--panel);
      font-size: 11.5px;
      font-family: var(--font);
      color: var(--ink);
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .we-payout-add:hover { border-color: var(--sub); }

    .we-payout-auto {
      border-top: 1px solid var(--rule);
      padding-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .we-payout-auto-label {
      font-size: 10.5px;
      color: var(--muted);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0;
    }
    .we-payout-auto-text {
      font-size: 11.5px;
      color: var(--muted);
      line-height: 1.5;
      margin: 0;
    }
    .we-payout-toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }
    .we-payout-toggle-label {
      font-size: 12px;
      color: var(--ink);
    }

    @media (max-width: 1080px) {
      .we-hero-grid { grid-template-columns: 1fr; }
      .we-stat-grid { grid-template-columns: 1fr 1fr; }
      .we-activity-row { grid-template-columns: repeat(3, 1fr); }
      .we-bottom-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .we-activity-row { grid-template-columns: 1fr 1fr; }
      .we-subhead { flex-direction: column; align-items: flex-start; }
      .we-actions { width: 100%; flex-wrap: wrap; }
      .we-balance-amount { font-size: 42px; }
      .we-spark { display: none; }
    }

    /* ── Identity slide (redesigned) ───────── */
    .wi-grid {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 16px;
      padding: 20px 0 28px;
    }
    .wi-left {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .wi-card {
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 14px;
      padding: 20px 24px;
    }

    /* Progress card */
    .wi-progress-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }
    .wi-progress-num {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-top: 8px;
      font-variant-numeric: tabular-nums;
    }
    .wi-progress-done {
      font-size: 36px;
      font-weight: 500;
      letter-spacing: -0.03em;
      color: var(--ink);
      line-height: 1;
    }
    .wi-progress-total {
      font-size: 36px;
      font-weight: 500;
      letter-spacing: -0.03em;
      color: var(--muted);
      line-height: 1;
    }
    .wi-progress-label {
      font-size: 12px;
      color: var(--muted);
      margin-left: 4px;
    }
    .wi-review-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 999px;
      background: #FEF3C7;
      color: #92400E;
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
    }
    .wi-review-dot {
      width: 6px; height: 6px;
      border-radius: 3px;
      background: #F59E0B;
      animation: wi-pulse 1.6s infinite;
    }
    @keyframes wi-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    .wi-bar {
      margin-top: 14px;
      height: 6px;
      border-radius: 999px;
      background: var(--soft);
      overflow: hidden;
    }
    .wi-bar-fill {
      height: 100%;
      background: var(--ink);
      transition: width 0.3s;
    }
    .wi-bar-meta {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 11px;
      color: var(--muted);
      font-family: var(--mono);
    }

    /* Checklist */
    .wi-checklist { padding: 0; overflow: hidden; }
    .wi-checklist-head {
      padding: 14px 20px;
      border-bottom: 1px solid var(--rule);
      font-size: 12px;
      font-weight: 500;
      color: var(--ink);
    }
    .wi-step {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--rule);
    }
    .wi-step:last-child { border-bottom: none; }
    .wi-step--focus { background: var(--soft); }
    .wi-step-dot {
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
    .wi-step-dot--done { background: var(--ink); }
    .wi-step-dot--in-review {
      background: #FEF3C7;
      border: 1.5px solid #F59E0B;
    }
    .wi-step-dot--todo,
    .wi-step-dot--optional {
      border: 1.5px dashed var(--rule);
      background: var(--panel);
    }
    .wi-step-pulse {
      width: 7px; height: 7px;
      border-radius: 4px;
      background: #F59E0B;
      animation: wi-pulse 1.6s infinite;
    }
    .wi-step-main { flex: 1; min-width: 0; }
    .wi-step-label {
      font-size: 13px;
      color: var(--ink);
      font-weight: 500;
      letter-spacing: -0.005em;
      margin: 0;
    }
    .wi-step-hint {
      font-size: 11.5px;
      color: var(--muted);
      margin: 2px 0 0;
    }
    .wi-step-pill {
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
    .wi-step-pill--done       { background: #F0FAE0; color: var(--accent-text); }
    .wi-step-pill--in-review  { background: #FEF3C7; color: #92400E; }
    .wi-step-pill--todo       { background: var(--panel); color: var(--muted); border: 1px solid var(--rule); }
    .wi-step-pill--optional   { background: var(--soft); color: var(--muted); }
    .wi-step-btn {
      padding: 6px 12px;
      border-radius: 999px;
      border: none;
      background: var(--ink);
      color: #fff;
      font-size: 11.5px;
      font-family: var(--font);
      font-weight: 500;
      cursor: pointer;
    }
    .wi-step-btn:hover { background: #262626; }

    /* Trust footer */
    .wi-trust {
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .wi-trust-icon {
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
    .wi-trust-main { flex: 1; }
    .wi-trust-title {
      font-size: 12.5px;
      color: var(--ink);
      font-weight: 500;
      margin: 0;
    }
    .wi-trust-sub {
      font-size: 11px;
      color: var(--muted);
      margin: 2px 0 0;
      line-height: 1.5;
    }
    .wi-trust-link {
      font-size: 11.5px;
      color: var(--muted);
      text-decoration: underline;
    }

    /* Right panel */
    .wi-right {
      padding: 22px 26px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .wi-right-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }
    .wi-right-title {
      font-size: 18px;
      font-weight: 500;
      letter-spacing: -0.012em;
      color: var(--ink);
      margin: 6px 0 0;
    }
    .wi-right-sub {
      font-size: 12px;
      color: var(--muted);
      margin: 4px 0 0;
      line-height: 1.5;
    }
    .wi-right-body app-verify-identity { display: block; }

    @media (max-width: 980px) {
      .wi-grid { grid-template-columns: 1fr; }
    }

    /* ── Profile slide (redesigned) ───────── */
    .wp-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      padding: 24px 0 28px;
    }
    .wp-card {
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 14px;
      padding: 24px 26px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    .wp-avatar-row {
      display: flex;
      gap: 14px;
      align-items: center;
    }
    .wp-avatar {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: var(--ink);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 600;
      letter-spacing: -0.02em;
      flex-shrink: 0;
    }
    .wp-avatar-main { flex: 1; min-width: 0; }
    .wp-avatar-name {
      font-size: 16px;
      font-weight: 500;
      letter-spacing: -0.012em;
      color: var(--ink);
      margin: 0;
    }
    .wp-avatar-email {
      font-size: 12px;
      color: var(--muted);
      margin: 2px 0 0;
    }
    .wp-verified {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      margin-top: 8px;
      padding: 3px 9px;
      border-radius: 999px;
      background: #F0FAE0;
      color: var(--accent-text);
      font-size: 11px;
      font-weight: 500;
    }
    .wp-unverified {
      display: inline-block;
      margin-top: 8px;
      padding: 3px 9px;
      border-radius: 999px;
      background: var(--soft);
      color: var(--muted);
      font-size: 11px;
      font-weight: 500;
    }

    .wp-divider {
      height: 1px;
      background: var(--rule);
    }
    .wp-eyebrow {
      font-size: 10.5px;
      color: var(--muted);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0 0 14px;
    }
    .wp-card-sub {
      font-size: 12.5px;
      color: var(--muted);
      margin: 6px 0 0;
      line-height: 1.5;
    }
    .wp-card-sub strong { color: var(--ink); font-weight: 500; }

    .wp-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .wp-field { display: flex; flex-direction: column; gap: 6px; }
    .wp-field--full { grid-column: 1 / -1; }
    .wp-label-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
    }
    .wp-label {
      font-size: 11.5px;
      font-weight: 500;
      color: var(--ink);
      letter-spacing: -0.005em;
    }
    .wp-hint {
      font-size: 10.5px;
      color: var(--sub);
    }
    .wp-input {
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
    .wp-input:focus { border-color: var(--ink); }
    .wp-input--area { min-height: 70px; resize: vertical; }
    .wp-input--prefix { padding-left: 28px; }
    .wp-input-wrap { position: relative; }
    .wp-input-prefix {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--sub);
      font-size: 12px;
      font-family: var(--mono);
      pointer-events: none;
    }

    /* Location */
    .wp-loc-wrap { display: flex; flex-direction: column; gap: 6px; }
    .wp-loc-row { display: flex; gap: 6px; }
    .wp-loc-gps {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      border: 1px solid var(--rule);
      background: var(--panel);
      color: var(--muted);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .wp-loc-gps:hover:not(:disabled) { border-color: var(--sub); color: var(--ink); }
    .wp-loc-gps:disabled { opacity: 0.5; cursor: not-allowed; }
    .wp-loc-dropdown {
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 8px;
      max-height: 200px;
      overflow-y: auto;
      box-shadow: 0 4px 16px rgba(0,0,0,0.05);
    }
    .wp-loc-opt {
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
    .wp-loc-opt:hover { background: var(--soft); }
    .wp-loc-ok {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 8px;
      background: #F0FAE0;
      color: var(--accent-text);
      font-size: 11.5px;
    }
    .loc-spinner {
      width: 13px; height: 13px;
      border: 2px solid var(--rule);
      border-top-color: var(--ink);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Availability */
    .wp-avail {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      border: 1px solid var(--rule);
      border-radius: 10px;
      background: var(--soft);
    }
    .wp-avail-title {
      font-size: 12.5px;
      font-weight: 500;
      color: var(--ink);
      margin: 0;
    }
    .wp-avail-sub {
      font-size: 11px;
      color: var(--muted);
      margin: 2px 0 0;
    }
    .wp-toggle {
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
    .wp-toggle--on { background: var(--ink); }
    .wp-toggle-knob {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 16px;
      height: 16px;
      border-radius: 999px;
      background: #fff;
      transition: left 0.15s, background 0.15s;
    }
    .wp-toggle--on .wp-toggle-knob {
      left: 18px;
      background: var(--accent);
    }

    .wp-banner {
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 12.5px;
    }
    .wp-banner--ok { background: #F0FAE0; color: var(--accent-text); }
    .wp-banner--err { background: rgba(220,38,38,0.06); color: #B91C1C; }

    /* ── Skills card ───────────────────────── */
    .wp-skills-active {
      padding: 14px 14px 12px;
      border: 1px solid var(--rule);
      border-radius: 10px;
      background: var(--soft);
      min-height: 60px;
    }
    .wp-sub-eyebrow {
      font-size: 10.5px;
      color: var(--muted);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0 0 8px;
    }
    .wp-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .wp-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      border-radius: 999px;
      border: 1px solid var(--rule);
      background: var(--panel);
      color: var(--ink);
      font-size: 11.5px;
      font-family: var(--font);
      font-weight: 400;
      cursor: pointer;
      transition: all 0.12s;
    }
    .wp-chip:hover { border-color: var(--sub); }
    .wp-chip--active {
      border-color: var(--ink);
      background: var(--ink);
      color: #fff;
      font-weight: 500;
    }
    .wp-chip-check { color: var(--accent); font-size: 10px; }
    .wp-chip-x { opacity: 0.6; margin-left: 2px; }
    .wp-chips-empty {
      font-size: 12px;
      color: var(--sub);
      padding: 4px 0;
      margin: 0;
    }

    .wp-custom-row {
      display: flex;
      gap: 6px;
    }
    .wp-custom-row .wp-input { flex: 1; }
    .wp-add-btn {
      padding: 0 16px;
      border-radius: 8px;
      border: none;
      background: var(--accent);
      color: var(--accent-ink);
      font-size: 12.5px;
      font-family: var(--font);
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .wp-add-btn:hover:not(:disabled) { background: #a3e635; }
    .wp-add-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .wp-browse {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .wp-browse-group { display: flex; flex-direction: column; gap: 8px; }
    .wp-browse-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10.5px;
      color: var(--muted);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0;
    }
    .wp-browse-dot {
      width: 5px;
      height: 5px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    @media (max-width: 980px) {
      .wp-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .wp-fields { grid-template-columns: 1fr; }
      .wp-card { padding: 20px 18px; }
    }

    /* ── Slides ────────────────────────────── */
    .slides-outer { overflow: hidden; }
    .slides-track { display: flex; transition: transform 0.35s cubic-bezier(0.4,0,0.2,1); will-change: transform; }
    .slide { flex: 0 0 100%; min-width: 0; }
    .inner--narrow { max-width: 660px; }

    /* ── Setup banner ────────────────────── */
    .setup-banner {
      background: #fffbeb;
      border-bottom: 1.5px solid #fde68a;
      padding: 0.875rem 0;
    }
    .setup-banner-inner {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }
    .setup-icon {
      flex-shrink: 0;
      width: 28px; height: 28px;
      background: #fef3c7;
      border: 1.5px solid #fde68a;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #d97706;
      margin-top: 1px;
    }
    .setup-title {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 0.2rem;
    }
    .setup-desc {
      display: block;
      font-size: 0.8rem;
      color: #b45309;
      line-height: 1.5;
    }
    .setup-desc strong { font-weight: 700; }

    /* ── Body ─────────────────────────────── */
    .page-body { padding: 2rem 0 4rem; }

    .profile-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      align-items: start;
    }

    .right-col {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* ── Card ─────────────────────────────── */
    .card {
      background: #fff;
      border: 1.5px solid #e4e4e7;
      border-radius: 16px;
      padding: 1.5rem;
    }

    /* ── Avatar ───────────────────────────── */
    .avatar-row {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding-bottom: 1.25rem;
      margin-bottom: 1.25rem;
      border-bottom: 1px solid #f4f4f5;
    }
    .avatar-circle {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #18181b;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.05rem;
      font-weight: 700;
      flex-shrink: 0;
      letter-spacing: 0.02em;
    }
    .avatar-name { font-size: 0.95rem; font-weight: 600; color: #18181b; margin: 0 0 0.15rem; }
    .avatar-email { font-size: 0.8rem; color: #a1a1aa; margin: 0 0 0.3rem; }
    .badge-verified {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.68rem;
      font-weight: 600;
      background: rgba(20,184,166,0.1);
      color: #0f766e;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
    }
    .badge-unverified { font-size: 0.68rem; color: #a1a1aa; }

    /* ── Section label ────────────────────── */
    .section-label {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: #71717a;
      margin-bottom: 0.75rem;
    }

    /* ── Fields ───────────────────────────── */
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.625rem; }
    .field { margin-bottom: 0.75rem; }
    label { display: block; font-size: 0.78rem; font-weight: 500; color: #18181b; margin-bottom: 0.3rem; }
    .field-hint { font-weight: 400; color: #a1a1aa; margin-left: 0.35rem; }

    .input-icon-wrap { position: relative; }
    .input-icon {
      position: absolute;
      left: 0.7rem;
      top: 50%;
      transform: translateY(-50%);
      color: #a1a1aa;
      pointer-events: none;
    }
    .field-input {
      width: 100%;
      padding: 0.6rem 0.875rem;
      border: 1.5px solid #e4e4e7;
      border-radius: 10px;
      font-size: 0.875rem;
      outline: none;
      font-family: inherit;
      color: #18181b;
      background: #fff;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .field-input.with-icon { padding-left: 2rem; }
    .field-input:focus { border-color: #18181b; box-shadow: 0 0 0 3px rgba(24,24,27,0.07); }
    .field-input::placeholder { color: #a1a1aa; }
    textarea.field-input { resize: vertical; }

    /* ── Availability ─────────────────────── */
    .avail-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 0;
      margin-bottom: 1rem;
      border-top: 1px solid #f4f4f5;
      border-bottom: 1px solid #f4f4f5;
    }
    .avail-title { font-size: 0.875rem; font-weight: 600; color: #18181b; margin: 0 0 0.1rem; }
    .avail-sub { font-size: 0.72rem; color: #a1a1aa; margin: 0; }

    .toggle {
      width: 44px; height: 24px;
      background: #d4d4d8;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      position: relative;
      transition: background 0.2s;
      padding: 0;
      flex-shrink: 0;
    }
    .toggle.toggle-on { background: #14b8a6; }
    .toggle-knob {
      position: absolute;
      top: 2px; left: 2px;
      width: 20px; height: 20px;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.2s;
      box-shadow: 0 1px 4px rgba(0,0,0,0.18);
    }
    .toggle-on .toggle-knob { transform: translateX(20px); }

    /* ── Banners ──────────────────────────── */
    .banner {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.55rem 0.8rem;
      border-radius: 9px;
      font-size: 0.82rem;
      font-weight: 500;
      margin-bottom: 0.875rem;
    }
    .banner-ok { background: rgba(20,184,166,0.08); color: #0f766e; border: 1px solid rgba(20,184,166,0.2); }
    .banner-err { background: rgba(239,68,68,0.07); color: #dc2626; border: 1px solid rgba(239,68,68,0.15); }

    /* ── Save ─────────────────────────────── */
    .save-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      background: #18181b;
      color: #fff;
      border: none;
      padding: 0.7rem;
      border-radius: 99px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      font-family: inherit;
    }
    .save-btn:hover:not(:disabled) { background: #27272a; }
    .save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .spinner {
      width: 13px; height: 13px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Skills ───────────────────────────── */
    .skills-hint { font-size: 0.8rem; color: #a1a1aa; margin: -0.4rem 0 0.875rem; }

    .skills-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      min-height: 32px;
      margin-bottom: 0.25rem;
    }
    .skill-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #f4f4f5;
      border: 1.5px solid #e4e4e7;
      color: #18181b;
      padding: 0.25rem 0.5rem 0.25rem 0.65rem;
      border-radius: 99px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .skill-tag--custom {
      background: rgba(37,99,235,0.05);
      border-color: rgba(37,99,235,0.18);
      color: #1d4ed8;
    }
    .skill-x {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px; height: 16px;
      background: none;
      border: none;
      cursor: pointer;
      color: #a1a1aa;
      padding: 0;
      border-radius: 50%;
      transition: background 0.12s, color 0.12s;
    }
    .skill-x:hover { background: rgba(0,0,0,0.07); color: #18181b; }
    .no-skills { font-size: 0.82rem; color: #a1a1aa; margin: 0; }

    /* ── Custom skill input ───────────────── */
    .custom-skill-row {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }
    .custom-skill-row .field-input { flex: 1; }
    .add-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: #18181b;
      color: #fff;
      border: none;
      padding: 0.6rem 0.875rem;
      border-radius: 10px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      font-family: inherit;
      transition: background 0.15s;
      flex-shrink: 0;
    }
    .add-btn:hover:not(:disabled) { background: #27272a; }
    .add-btn:disabled { opacity: 0.35; cursor: not-allowed; }

    /* ── Predefined skill groups ──────────── */
    .skill-group { margin-bottom: 0.875rem; }
    .group-label {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #a1a1aa;
      margin: 0 0 0.35rem;
    }
    .skill-options { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .skill-opt {
      background: #f4f4f5;
      border: 1.5px solid #e4e4e7;
      border-radius: 99px;
      padding: 0.22rem 0.65rem;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      color: #3f3f46;
      transition: all 0.12s;
      font-family: inherit;
    }
    .skill-opt:hover:not(:disabled) { border-color: #18181b; color: #18181b; background: rgba(0,0,0,0.03); }
    .skill-opt--owned { opacity: 0.35; cursor: default; }

    /* ── Location picker ──────────────────── */
    .loc-wrap { display: flex; flex-direction: column; gap: 0; position: relative; }
    .loc-input-row { display: flex; gap: 0.4rem; align-items: center; }
    .loc-gps-btn {
      width: 38px; height: 38px;
      flex-shrink: 0;
      border: 1.5px solid #e4e4e7;
      border-radius: 10px;
      background: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #71717a;
      transition: border-color 0.15s, color 0.15s;
    }
    .loc-gps-btn:hover:not(:disabled) { border-color: #18181b; color: #18181b; }
    .loc-gps-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .loc-spinner {
      width: 12px; height: 12px;
      border: 2px solid #e4e4e7;
      border-top-color: #18181b;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    .loc-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0; right: 0;
      background: #fff;
      border: 1.5px solid #e4e4e7;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.1);
      z-index: 100;
      overflow: hidden;
      max-height: 220px;
      overflow-y: auto;
    }
    .loc-option {
      width: 100%;
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.625rem 0.875rem;
      background: none;
      border: none;
      border-bottom: 1px solid #f4f4f5;
      cursor: pointer;
      font-size: 0.8rem;
      color: #3f3f46;
      text-align: left;
      font-family: inherit;
      line-height: 1.4;
      transition: background 0.1s;
    }
    .loc-option:last-child { border-bottom: none; }
    .loc-option:hover { background: #f8f8f8; }
    .loc-confirmed {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin-top: 0.4rem;
      font-size: 0.75rem;
      color: #0f766e;
      font-weight: 500;
    }
    .loc-coords {
      color: #a1a1aa;
      font-weight: 400;
      font-size: 0.7rem;
      font-family: monospace;
    }

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

    .field-row { margin-bottom: 0.875rem; }
    .field-label { display: block; font-size: 0.75rem; font-weight: 600; color: #71717a; margin-bottom: 0.3rem; }
    .field-input { width: 100%; padding: 0.5rem 0.75rem; border: 1.5px solid #e4e4e7; border-radius: 8px; font-size: 0.875rem; color: #18181b; font-family: inherit; outline: none; transition: border-color 0.15s; }
    .field-input:focus { border-color: #18181b; }
    .btn-save-pw { margin-top: 0.25rem; width: 100%; padding: 0.575rem; border-radius: 10px; background: #18181b; color: #fff; font-size: 0.875rem; font-weight: 600; border: none; cursor: pointer; transition: background 0.15s; }
    .btn-save-pw:hover:not(:disabled) { background: #3f3f46; }
    .btn-save-pw:disabled { opacity: 0.5; cursor: not-allowed; }
    .pw-error { font-size: 0.8rem; color: #dc2626; margin: 0.5rem 0 0; }
    .pw-success { font-size: 0.8rem; color: #16a34a; margin: 0.5rem 0 0; }
    /* ── Stripe Connect ─────────────────────── */
    /* ── Payout methods ───────────────────────── */
    .payout-methods-header { margin-bottom: 0.875rem; }
    .payout-hint { font-size: 0.78rem; color: #a1a1aa; margin: 0.2rem 0 0; }
    .payout-card { padding: 1.125rem 1.25rem; }
    .payout-card-head { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .payout-icon {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .bank-icon    { background: #eff6ff; color: #2563eb; }
    .paypal-icon  { background: #eff6ff; color: #003087; }
    .revolut-icon { background: #f5f3ff; color: #5b21b6; }
    .stripe-icon  { background: #faf5ff; color: #7c3aed; }
    .payout-method-name { font-size: 0.875rem; font-weight: 600; color: #18181b; margin: 0 0 0.15rem; }
    .payout-method-sub  { font-size: 0.72rem; color: #a1a1aa; margin: 0; }
    .payout-set-badge {
      margin-left: auto; font-size: 0.7rem; font-weight: 700;
      color: #16a34a; background: #dcfce7; padding: 0.2rem 0.6rem;
      border-radius: 99px; white-space: nowrap;
    }
    .btn-payout-save {
      margin-top: 0.875rem;
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: #4f46e5; color: #fff; border: none;
      padding: 0.5rem 1.25rem; border-radius: 99px;
      font-size: 0.82rem; font-weight: 600; cursor: pointer;
      font-family: inherit; transition: background 0.15s;
    }
    .btn-payout-save:hover:not(:disabled) { background: #4338ca; }
    .btn-payout-save:disabled { opacity: 0.5; cursor: not-allowed; }

    .stats-card { margin-top: 1.25rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.875rem; margin-top: 0.75rem; }
    .stat-box { background: #f4f4f5; border-radius: 10px; padding: 0.875rem 1rem; display: flex; flex-direction: column; gap: 0.2rem; }
    .stat-box--green .stat-val { color: #15803d; }
    .stat-box--amber .stat-val { color: #b45309; }
    .stat-val { font-size: 1.2rem; font-weight: 700; color: #18181b; }
    .stat-lbl { font-size: 0.72rem; color: #71717a; text-transform: uppercase; letter-spacing: 0.04em; }
    .connect-desc { font-size: 0.875rem; color: #71717a; margin: 0.25rem 0 1rem; line-height: 1.6; }
    .connect-loading { display: flex; align-items: center; gap: 0.5rem; font-size: 0.84rem; color: #a1a1aa; }
    .connect-error { font-size: 0.8rem; color: #dc2626; margin-top: 0.75rem; }
    .btn-connect {
      display: inline-flex; align-items: center; gap: 0.45rem;
      background: #4f46e5; color: #fff; border: none;
      padding: 0.55rem 1.125rem; border-radius: 99px;
      font-size: 0.84rem; font-weight: 600; cursor: pointer;
      font-family: inherit; transition: background 0.15s;
    }
    .btn-connect:hover:not(:disabled) { background: #4338ca; }
    .btn-connect:disabled { opacity: 0.5; cursor: not-allowed; }
    .connect-ok {
      display: flex; align-items: flex-start; gap: 0.75rem;
      background: #f0fdf4; border: 1px solid #bbf7d0;
      border-radius: 10px; padding: 0.875rem 1rem; margin-bottom: 0.875rem;
    }
    .connect-ok-icon {
      width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
      background: #16a34a; color: #fff;
      display: flex; align-items: center; justify-content: center;
    }
    .connect-ok-title { font-size: 0.875rem; font-weight: 600; color: #15803d; margin: 0 0 0.15rem; }
    .connect-ok-sub { font-size: 0.78rem; color: #166534; margin: 0; }
    .btn-connect-dashboard {
      display: inline-flex; align-items: center; gap: 0.35rem;
      background: transparent; color: #4f46e5;
      border: 1.5px solid #e0e7ff; padding: 0.5rem 1rem;
      border-radius: 99px; font-size: 0.82rem; font-weight: 600;
      cursor: pointer; font-family: inherit; transition: background 0.15s;
    }
    .btn-connect-dashboard:hover:not(:disabled) { background: #eef2ff; }
    .btn-connect-dashboard:disabled { opacity: 0.5; cursor: not-allowed; }
    .mini-ring {
      width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff; border-radius: 50%;
      animation: spin 0.7s linear infinite; display: inline-block; flex-shrink: 0;
    }

    .delete-desc { font-size: 0.875rem; color: #71717a; margin: 0.5rem 0 1rem; }
    .delete-warn { font-size: 0.875rem; color: #3f3f46; margin: 0.5rem 0 1rem; }
    .delete-actions { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
    .btn-delete-account {
      padding: 0.5rem 1.1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600;
      background: #fff; border: 1.5px solid #e4e4e7; color: #dc2626; cursor: pointer;
      transition: background 0.15s;
    }
    .btn-delete-account:hover { background: #fef2f2; border-color: #fca5a5; }
    .btn-report {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.45rem 1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600;
      background: #fafafa; border: 1.5px solid #e4e4e7; color: #3f3f46; cursor: pointer;
      transition: all 0.15s;
    }
    .btn-report:hover { background: #f4f4f5; border-color: #a1a1aa; }
    .btn-delete-confirm {
      padding: 0.5rem 1.1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600;
      background: #dc2626; border: none; color: #fff; cursor: pointer; transition: background 0.15s;
    }
    .btn-delete-confirm:hover:not(:disabled) { background: #b91c1c; }
    .btn-delete-confirm:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-cancel {
      padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500;
      background: transparent; border: 1.5px solid #e4e4e7; color: #71717a; cursor: pointer;
    }
    .delete-error { color: #dc2626; font-size: 0.8rem; margin-top: 0.5rem; }

    @media (max-width: 680px) {
      .inner { padding: 0 1rem; }
      .profile-grid { grid-template-columns: 1fr; }
      .header-top { flex-direction: column; }
      .stat-bar { gap: 1rem; }
    }
  `]
})
export class WorkerProfileComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  profile = signal<WorkerProfile | null>(null);
  stats = signal<any | null>(null);
  profileComplete = computed(() => { const p = this.profile(); return !!(p?.city && p?.profession); });
  activeTab = signal<'profile' | 'identity' | 'security' | 'earnings'>('profile');
  previewOpen = signal(false);
  tabIndex = computed(() => (['profile', 'identity', 'security', 'earnings'] as const).indexOf(this.activeTab()));
  allSkills = signal<Skill[]>([]);
  skillGroups = signal<{ category: string; icon: string; skills: Skill[] }[]>([]);
  customSkills = signal<string[]>([]);
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

  customSkillInput = '';

  // DOB constraints: must be 18–80 years old
  maxDob() { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().substring(0, 10); }
  minDob() { const d = new Date(); d.setFullYear(d.getFullYear() - 80); return d.toISOString().substring(0, 10); }

  locationQuery = '';
  locationSuggestions = signal<NominatimResult[]>([]);
  locationLoading = signal(false);
  locationConfirmed = signal(false);
  private locationTimer: ReturnType<typeof setTimeout> | null = null;

  edit = {
    firstName: '', lastName: '', phone: '', bio: '',
    hourlyRate: null as number | null,
    city: '', address: '',
    latitude: null as number | null, longitude: null as number | null,
    isAvailable: true,
    dateOfBirth: '' as string,
    profession: '' as string,
    professionOther: '' as string,
  };

  connectStatus = signal<{ connected: boolean; onboarded: boolean; payoutsEnabled: boolean } | null>(null);
  connectLoading = signal(false);
  connectError = signal<string | null>(null);

  bankEdit = { accountName: '', iban: '', bic: '' };
  bankSaving = signal(false);
  bankSaved = signal(false);
  bankError = signal<string | null>(null);

  paypalEdit = '';
  paypalSaving = signal(false);
  paypalSaved = signal(false);
  paypalError = signal<string | null>(null);

  revolutEdit = '';
  revolutSaving = signal(false);
  revolutSaved = signal(false);
  revolutError = signal<string | null>(null);

  ngOnInit() {
    this.api.getMyWorkerProfile().subscribe({ next: (p) => this.setProfile(p as WorkerProfile) });
    this.api.getWorkerStats().subscribe({ next: (s) => this.stats.set(s) });
    this.api.getAllSkills().subscribe({ next: (skills) => this.buildSkillGroups(skills as Skill[]) });
    this.api.getConnectStatus().subscribe({ next: (s) => this.connectStatus.set(s), error: () => this.connectStatus.set({ connected: false, onboarded: false, payoutsEnabled: false }) });

    // Handle return from Stripe Connect onboarding
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connect') === 'success' || urlParams.get('connect') === 'refresh') {
      this.api.getConnectStatus().subscribe({ next: (s) => this.connectStatus.set(s) });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  startConnectOnboarding() {
    this.connectLoading.set(true);
    this.connectError.set(null);
    this.api.startConnectOnboarding().subscribe({
      next: (res) => { window.location.href = res.url; },
      error: (err) => { this.connectError.set(err?.error?.message ?? 'Could not start onboarding'); this.connectLoading.set(false); },
    });
  }

  openConnectDashboard() {
    this.connectLoading.set(true);
    this.api.getConnectDashboardLink().subscribe({
      next: (res) => { window.open(res.url, '_blank'); this.connectLoading.set(false); },
      error: (err) => { this.connectError.set(err?.error?.message ?? 'Could not open dashboard'); this.connectLoading.set(false); },
    });
  }

  saveBankDetails() {
    this.bankSaving.set(true);
    this.bankSaved.set(false);
    this.bankError.set(null);
    this.api.updateWorkerProfile({
      bankAccountName: this.bankEdit.accountName || undefined,
      bankIban: this.bankEdit.iban.replace(/\s/g, '').toUpperCase() || undefined,
      bankBic: this.bankEdit.bic.toUpperCase() || undefined,
    }).subscribe({
      next: () => { this.bankSaving.set(false); this.bankSaved.set(true); },
      error: (err: any) => { this.bankError.set(err?.error?.message ?? 'Failed to save'); this.bankSaving.set(false); },
    });
  }

  savePaypal() {
    this.paypalSaving.set(true);
    this.paypalSaved.set(false);
    this.paypalError.set(null);
    this.api.updateWorkerProfile({ paypalEmail: this.paypalEdit.trim() || undefined }).subscribe({
      next: () => { this.paypalSaving.set(false); this.paypalSaved.set(true); },
      error: (err: any) => { this.paypalError.set(err?.error?.message ?? 'Failed to save'); this.paypalSaving.set(false); },
    });
  }

  saveRevolut() {
    this.revolutSaving.set(true);
    this.revolutSaved.set(false);
    this.revolutError.set(null);
    this.api.updateWorkerProfile({ revolutContact: this.revolutEdit.trim() || undefined }).subscribe({
      next: () => { this.revolutSaving.set(false); this.revolutSaved.set(true); },
      error: (err: any) => { this.revolutError.set(err?.error?.message ?? 'Failed to save'); this.revolutSaving.set(false); },
    });
  }

  private setProfile(p: WorkerProfile) {
    this.profile.set(p);
    this.edit = {
      firstName: p.firstName, lastName: p.lastName,
      phone: p.phone ?? '', bio: p.bio ?? '',
      hourlyRate: p.hourlyRate, city: p.city,
      address: p.address,
      latitude: p.latitude, longitude: p.longitude,
      isAvailable: p.isAvailable,
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.substring(0, 10) : '',
      profession: p.profession && !['Plumbing','Electrical','Carpentry','Painting','Cleaning','Moving','Mechanical','Handyman','Delivery','Caregiving','General Tasks'].includes(p.profession) ? 'Other' : (p.profession ?? ''),
      professionOther: p.profession && !['Plumbing','Electrical','Carpentry','Painting','Cleaning','Moving','Mechanical','Handyman','Delivery','Caregiving','General Tasks'].includes(p.profession) ? p.profession : '',
    };
    this.customSkills.set(p.customSkills ?? []);
    this.bankEdit.accountName = (p as any).bankAccountName ?? '';
    this.bankEdit.iban = (p as any).bankIban ?? '';
    this.bankEdit.bic = (p as any).bankBic ?? '';
    this.paypalEdit = (p as any).paypalEmail ?? '';
    this.revolutEdit = (p as any).revolutContact ?? '';
    if (p.city || p.address) {
      this.locationQuery = [p.address, p.city].filter(Boolean).join(', ');
      this.locationConfirmed.set(p.latitude != null);
    }
  }

  private buildSkillGroups(skills: Skill[]) {
    this.allSkills.set(skills);
    const map = new Map<string, { icon: string; skills: Skill[] }>();
    for (const s of skills) {
      if (!map.has(s.category.name)) map.set(s.category.name, { icon: s.category.icon, skills: [] });
      map.get(s.category.name)!.skills.push(s);
    }
    this.skillGroups.set([...map.entries()].map(([category, v]) => ({ category, ...v })));
  }

  hasSkill(skillId: string): boolean {
    return this.profile()?.skills.some((ws) => ws.skill.id === skillId) ?? false;
  }

  catColor(category?: string | null): string {
    const map: Record<string, string> = {
      'Cleaning': '#10B981', 'Plumbing': '#3B82F6', 'Electrical': '#EAB308',
      'Moving': '#8B5CF6', 'Gardening': '#16A34A', 'Painting': '#EC4899',
      'Assembly': '#F59E0B', 'Mounting': '#10B981', 'Carpentry': '#A16207',
      'HVAC': '#0EA5E9', 'Handyman': '#737373', 'Mechanical': '#475569',
      'General Tasks': '#737373', 'General': '#737373',
    };
    return map[category ?? ''] ?? '#737373';
  }

  // ── Identity checklist ─────────────────────────
  idSteps = computed(() => {
    const p = this.profile();
    const verified = !!p?.idVerified;
    const phone = !!p?.phone;
    let firstTodoSeen = false;
    const makeStep = (id: string, label: string, hint: string, status: 'done' | 'in-review' | 'todo' | 'optional') => {
      const focus = status === 'todo' && !firstTodoSeen;
      if (focus) firstTodoSeen = true;
      return { id, label, hint, status, focus };
    };
    return [
      makeStep('email', 'Email confirmed', p?.email ?? '—', 'done'),
      makeStep('phone', 'Phone verified', phone ? p!.phone! : 'Add a number we can reach you on', phone ? 'done' : 'todo'),
      makeStep('id', 'Government ID', verified ? 'Verified ✓' : 'Passport, national ID, or driver licence', verified ? 'done' : 'todo'),
      makeStep('selfie', 'Selfie + liveness', verified ? 'Face match confirmed' : '30-second face match', verified ? 'done' : 'todo'),
      makeStep('address', 'Proof of address', 'Utility bill or bank statement, < 90 days', 'optional'),
      makeStep('skills', 'Skills verification', 'Optional · unlocks Pro badge', 'optional'),
    ];
  });

  idStepsDone     = computed(() => this.idSteps().filter(s => s.status === 'done').length);
  idStepsRequired = computed(() => this.idSteps().filter(s => s.status !== 'optional').length);
  idInReviewCount = computed(() => this.idSteps().filter(s => s.status === 'in-review').length);
  idProgressPct   = computed(() => {
    const req = this.idStepsRequired();
    return req === 0 ? 0 : Math.round((this.idStepsDone() / req) * 100);
  });
  idCurrentStep   = computed(() => {
    const idx = this.idSteps().findIndex(s => s.status === 'todo' || s.status === 'in-review');
    return idx === -1 ? this.idStepsRequired() : idx + 1;
  });
  idMainStatus    = computed<'done' | 'in-review' | 'todo' | 'optional'>(() =>
    this.profile()?.idVerified ? 'done' : 'todo'
  );

  stepStatusLabel(s: 'done' | 'in-review' | 'todo' | 'optional'): string {
    return { done: 'Verified', 'in-review': 'In review', todo: 'Required', optional: 'Optional' }[s];
  }

  // ── Earnings ────────────────────────────────────
  readonly earningRanges = ['7d', '30d', '90d', 'All'] as const;
  earningsRange = signal<'7d' | '30d' | '90d' | 'All'>('90d');
  autoWithdraw = signal(false);

  earnedWhole = computed(() => {
    const v = this.stats()?.totalEarned ?? 0;
    return Math.floor(v).toLocaleString();
  });

  earnedDec = computed(() => {
    const v = this.stats()?.totalEarned ?? 0;
    const dec = (v - Math.floor(v)).toFixed(2).slice(2);
    return dec;
  });

  avgPerJob = computed(() => {
    const s = this.stats();
    if (!s || !s.jobsCompleted) return '0';
    return (s.totalEarned / s.jobsCompleted).toFixed(0);
  });

  formatIban(iban: string): string {
    if (!iban) return '';
    const cleaned = iban.replace(/\s+/g, '').toUpperCase();
    if (cleaned.length < 8) return cleaned;
    const last4 = cleaned.slice(-4);
    return '•••• •••• •••• ' + last4;
  }

  // ── Security slide ─────────────────────────────
  openMethod = signal<'bank' | 'paypal' | 'revolut' | 'stripe' | null>(null);
  toggleMethod(id: 'bank' | 'paypal' | 'revolut' | 'stripe') {
    this.openMethod.set(this.openMethod() === id ? null : id);
  }

  readonly issueTypes = [
    { id: 'PAYMENT' as const, label: 'Payment or payout',   desc: 'Missing money, failed payout, refund request.' },
    { id: 'CLIENT'  as const, label: 'Issue with a client', desc: 'Cancellation, no-show, dispute, harassment.' },
    { id: 'BUG'     as const, label: 'Bug or app problem',  desc: 'Something looks broken or stopped working.' },
    { id: 'ACCOUNT' as const, label: 'Account or login',    desc: 'Sign-in trouble, 2FA, verification stuck.' },
    { id: 'OTHER'   as const, label: 'Something else',      desc: 'Describe it below in detail.' },
  ];
  reportCategory = signal<'PAYMENT' | 'CLIENT' | 'BUG' | 'ACCOUNT' | 'OTHER'>('PAYMENT');
  reportBody = '';
  reportSent = signal(false);
  reportSubmitting = signal(false);
  reportError = signal<string | null>(null);

  canSendReport(): boolean {
    return this.reportBody.trim().length >= 10;
  }

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

  toggleSkill(skill: Skill) {
    if (this.hasSkill(skill.id)) return;
    this.api.addSkill(skill.id).subscribe({
      next: () => this.profile.update((p) => p ? { ...p, skills: [...p.skills, { skill }] } : p),
      error: () => this.saveError.set('Failed to add skill'),
    });
  }

  removeSkill(skillId: string) {
    this.api.removeSkill(skillId).subscribe({
      next: () => this.profile.update((p) => p ? { ...p, skills: p.skills.filter((ws) => ws.skill.id !== skillId) } : p),
      error: () => this.saveError.set('Failed to remove skill'),
    });
  }

  addCustomSkill() {
    const name = this.customSkillInput.trim();
    if (!name) return;
    if (this.customSkills().includes(name)) { this.customSkillInput = ''; return; }
    this.customSkills.update((list) => [...list, name]);
    this.customSkillInput = '';
  }

  removeCustomSkill(name: string) {
    this.customSkills.update((list) => list.filter((s) => s !== name));
  }

  onLocationInput() {
    this.locationConfirmed.set(false);
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
    this.edit.latitude = parseFloat(item.lat);
    this.edit.longitude = parseFloat(item.lon);
    this.edit.city = item.address['city'] || item.address['town'] || item.address['village'] || item.address['county'] || '';
    this.edit.address = [item.address['road'], item.address['house_number'], item.address['suburb']].filter(Boolean).join(' ') || '';
    this.locationQuery = item.display_name;
    this.locationSuggestions.set([]);
    this.locationConfirmed.set(true);
  }

  async useMyLocation() {
    if (!navigator.geolocation) return;
    this.locationLoading.set(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        this.edit.latitude = latitude;
        this.edit.longitude = longitude;
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
          const res = await fetch(url);
          const data = await res.json();
          this.edit.city = data.address?.city || data.address?.town || data.address?.village || '';
          this.edit.address = [data.address?.road, data.address?.house_number].filter(Boolean).join(' ') || '';
          this.locationQuery = data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        } catch {
          this.locationQuery = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        }
        this.locationConfirmed.set(true);
        this.locationLoading.set(false);
      },
      () => this.locationLoading.set(false),
    );
  }

  saveProfile() {
    this.saving.set(true);
    this.saveSuccess.set(false);
    this.saveError.set(null);
    const { professionOther, profession, ...rest } = this.edit;
    const payload = {
      ...rest,
      profession: profession === 'Other' ? professionOther.trim() : profession,
      customSkills: this.customSkills(),
    };
    this.api.updateWorkerProfile(payload).subscribe({
      next: (p) => {
        this.setProfile(p as WorkerProfile);
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

  deleteAccount() {
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
