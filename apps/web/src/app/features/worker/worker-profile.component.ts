import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { VerifyIdentityComponent } from '../../shared/verify-identity.component';
import { ReportProblemComponent } from '../../shared/report-problem.component';

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
  imports: [CommonModule, FormsModule, VerifyIdentityComponent, ReportProblemComponent],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div class="inner">
          <div class="header-top">
            <div>
              <p class="eyebrow">Worker Profile</p>
              <h1 class="page-title">My Profile</h1>
            </div>
            @if (profile()) {
              <div class="stat-bar">
                <div class="stat-item">
                  <span class="stat-val">{{ profile()!.rating || '—' }}</span>
                  <span class="stat-label">Rating</span>
                </div>
                <div class="stat-item">
                  <span class="stat-val">{{ profile()!.totalJobs }}</span>
                  <span class="stat-label">Jobs done</span>
                </div>
                <div class="stat-item">
                  <span class="stat-val" [class.avail-on]="profile()!.isAvailable">
                    {{ profile()!.isAvailable ? 'Active' : 'Busy' }}
                  </span>
                  <span class="stat-label">Status</span>
                </div>
              </div>
            }
          </div>
        </div>
        <div class="inner">
          <nav class="tabs-nav">
            <button class="tab-btn" [class.tab-active]="activeTab() === 'profile'" (click)="activeTab.set('profile')">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              Profile
            </button>
            <button class="tab-btn" [class.tab-active]="activeTab() === 'identity'" (click)="activeTab.set('identity')">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M13 11h5M13 15h3"/></svg>
              Identity
            </button>
            <button class="tab-btn" [class.tab-active]="activeTab() === 'security'" (click)="activeTab.set('security')">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              Security
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
          <div class="slides-track" [style.transform]="'translateX(-' + tabIndex() * 100 + '%)'">

            <!-- Slide 0: Profile -->
            <div class="slide">
              <div class="page-body">
                <div class="inner">
                  <div class="profile-grid">

              <!-- Left: Info -->
              <div class="card">

                <!-- Avatar row -->
                <div class="avatar-row">
                  <div class="avatar-circle">{{ profile()!.firstName[0] }}{{ profile()!.lastName[0] }}</div>
                  <div>
                    <p class="avatar-name">{{ profile()!.firstName }} {{ profile()!.lastName }}</p>
                    <p class="avatar-email">{{ profile()!.email }}</p>
                    @if (profile()!.idVerified) {
                      <span class="badge-verified">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Verified
                      </span>
                    } @else {
                      <span class="badge-unverified">Not verified</span>
                    }
                  </div>
                </div>

                <div class="section-label">Personal Info</div>

                <div class="field-row">
                  <div class="field">
                    <label>First name</label>
                    <input class="field-input" [(ngModel)]="edit.firstName" />
                  </div>
                  <div class="field">
                    <label>Last name</label>
                    <input class="field-input" [(ngModel)]="edit.lastName" />
                  </div>
                </div>

                <div class="field">
                  <label>Phone</label>
                  <div class="input-icon-wrap">
                    <svg class="input-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 010 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                    <input class="field-input with-icon" [(ngModel)]="edit.phone" placeholder="+43 …" />
                  </div>
                </div>

                <div class="field">
                  <label>Date of birth <span class="field-hint">Clients see your age, not the exact date</span></label>
                  <input class="field-input" type="date" [(ngModel)]="edit.dateOfBirth"
                         [max]="maxDob()" [min]="minDob()" />
                </div>

                <div class="field">
                  <label>Bio</label>
                  <textarea class="field-input" [(ngModel)]="edit.bio" rows="3" placeholder="Describe your experience and what makes you stand out…"></textarea>
                </div>

                <div class="section-label" style="margin-top:1.25rem">Work Details</div>

                <div class="field">
                  <label>Area of expertise <span class="field-hint">Shown prominently on your profile</span></label>
                  <select class="field-input" [(ngModel)]="edit.profession">
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
                  <div class="field">
                    <label>Please specify</label>
                    <input class="field-input" [(ngModel)]="edit.professionOther" placeholder="e.g. Tiling, Welding…" />
                  </div>
                }

                <div class="field">
                  <label>Hourly rate (€)</label>
                  <div class="input-icon-wrap">
                    <svg class="input-icon" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                    <input class="field-input with-icon" type="number" [(ngModel)]="edit.hourlyRate" placeholder="35" />
                  </div>
                </div>

                <div class="field">
                  <label>Location</label>
                  <div class="loc-wrap">
                    <div class="loc-input-row">
                      <div class="input-icon-wrap" style="flex:1">
                        <svg class="input-icon" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <input class="field-input with-icon"
                               [(ngModel)]="locationQuery"
                               (ngModelChange)="onLocationInput()"
                               (blur)="onLocationBlur()"
                               placeholder="Search address, postcode, city…" />
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
                            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;color:#a1a1aa"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {{ item.display_name }}
                          </button>
                        }
                      </div>
                    }
                    @if (locationConfirmed() && edit.latitude) {
                      <div class="loc-confirmed">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        {{ edit.city }}{{ edit.address ? ' · ' + edit.address : '' }}
                        <span class="loc-coords">{{ edit.latitude.toFixed(5) }}, {{ edit.longitude!.toFixed(5) }}</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Availability toggle -->
                <div class="avail-row">
                  <div>
                    <p class="avail-title">Available for work</p>
                    <p class="avail-sub">{{ edit.isAvailable ? 'Visible to clients' : 'Hidden from search' }}</p>
                  </div>
                  <button class="toggle" [class.toggle-on]="edit.isAvailable" (click)="edit.isAvailable = !edit.isAvailable">
                    <span class="toggle-knob"></span>
                  </button>
                </div>

                @if (saveSuccess()) {
                  <div class="banner banner-ok">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Profile saved successfully
                  </div>
                }
                @if (saveError()) {
                  <div class="banner banner-err">{{ saveError() }}</div>
                }

                <button class="save-btn" (click)="saveProfile()" [disabled]="saving()">
                  @if (saving()) { <span class="spinner"></span> Saving… }
                  @else { Save changes }
                </button>
              </div>

              <!-- Right column: stacked cards -->
              <div class="right-col">

                <!-- Skills -->
                <div class="card">
                  <div class="section-label">My Skills</div>
                  <p class="skills-hint">These appear on your profile and help clients find you.</p>

                  <div class="skills-wrap">
                    @for (ws of profile()!.skills; track ws.skill.id) {
                      <span class="skill-tag">
                        {{ ws.skill.name }}
                        <button class="skill-x" (click)="removeSkill(ws.skill.id)" title="Remove">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </span>
                    }
                    @for (name of customSkills(); track name) {
                      <span class="skill-tag skill-tag--custom">
                        {{ name }}
                        <button class="skill-x" (click)="removeCustomSkill(name)" title="Remove">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </span>
                    }
                    @if (profile()!.skills.length === 0 && customSkills().length === 0) {
                      <p class="no-skills">No skills yet — add from the list below or type your own.</p>
                    }
                  </div>

                  <div class="section-label" style="margin-top:1.5rem">Add a custom skill</div>
                  <div class="custom-skill-row">
                    <input class="field-input" [(ngModel)]="customSkillInput" placeholder="e.g. Tile installation, HVAC, Welding…" (keydown.enter)="addCustomSkill()" />
                    <button class="add-btn" (click)="addCustomSkill()" [disabled]="!customSkillInput.trim()">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Add
                    </button>
                  </div>

                  <div class="section-label" style="margin-top:1.5rem">Browse skills</div>
                  @for (group of skillGroups(); track group.category) {
                    <div class="skill-group">
                      <p class="group-label">{{ group.category }}</p>
                      <div class="skill-options">
                        @for (skill of group.skills; track skill.id) {
                          <button class="skill-opt" [class.skill-opt--owned]="hasSkill(skill.id)" (click)="toggleSkill(skill)" [disabled]="hasSkill(skill.id)">{{ skill.name }}</button>
                        }
                      </div>
                    </div>
                  }
                </div>

              </div><!-- /right-col -->

                  </div><!-- /profile-grid -->

                  <!-- Earnings Stats -->
                  @if (stats()) {
                    <div class="card stats-card">
                      <div class="section-label">Earnings & Activity</div>
                      <div class="stats-grid">
                        <div class="stat-box stat-box--green">
                          <span class="stat-val">€{{ stats().totalEarned.toFixed(2) }}</span>
                          <span class="stat-lbl">Total earned</span>
                        </div>
                        <div class="stat-box stat-box--amber">
                          <span class="stat-val">€{{ stats().pendingPayout.toFixed(2) }}</span>
                          <span class="stat-lbl">In escrow</span>
                        </div>
                        <div class="stat-box">
                          <span class="stat-val">{{ stats().jobsCompleted }}</span>
                          <span class="stat-lbl">Jobs done</span>
                        </div>
                        <div class="stat-box">
                          <span class="stat-val">{{ stats().rating > 0 ? stats().rating.toFixed(1) : '—' }} ★</span>
                          <span class="stat-lbl">Rating ({{ stats().totalReviews }} reviews)</span>
                        </div>
                        <div class="stat-box">
                          <span class="stat-val">{{ stats().totalApplications }}</span>
                          <span class="stat-lbl">Applications sent</span>
                        </div>
                        <div class="stat-box">
                          <span class="stat-val">{{ stats().acceptanceRate }}%</span>
                          <span class="stat-lbl">Acceptance rate</span>
                        </div>
                      </div>
                    </div>
                  }

                </div>
              </div>
            </div><!-- /slide-0 -->

            <!-- Slide 1: Identity -->
            <div class="slide">
              <div class="page-body">
                <div class="inner inner--narrow">
                  <div class="card">
                    <p class="section-label">Identity Verification</p>
                    <app-verify-identity />
                  </div>
                </div>
              </div>
            </div><!-- /slide-1 -->

            <!-- Slide 2: Security -->
            <div class="slide">
              <div class="page-body">
                <div class="inner inner--narrow">

                  <!-- Payout methods -->
                  <div class="payout-methods-header">
                    <p class="section-label" style="margin:0">Payout Methods</p>
                    <p class="payout-hint">Add at least one — admin will send your earnings here after each job.</p>
                  </div>

                  <!-- Bank Transfer -->
                  <div class="card payout-card" style="margin-bottom:0.875rem">
                    <div class="payout-card-head">
                      <div class="payout-icon bank-icon">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 9l9-6 9 6"/><line x1="9" y1="21" x2="9" y2="9"/><line x1="15" y1="21" x2="15" y2="9"/></svg>
                      </div>
                      <div>
                        <p class="payout-method-name">Bank Transfer (IBAN)</p>
                        <p class="payout-method-sub">Works in 30+ countries · Standard in Europe</p>
                      </div>
                      @if (bankEdit.iban) { <span class="payout-set-badge">✓ Set</span> }
                    </div>
                    <div class="field-row">
                      <label class="field-label">Account holder name</label>
                      <input class="field-input" [(ngModel)]="bankEdit.accountName" placeholder="Full name as on your bank account" />
                    </div>
                    <div class="field-row">
                      <label class="field-label">IBAN</label>
                      <input class="field-input" [(ngModel)]="bankEdit.iban" placeholder="e.g. AT61 1904 3002 3457 3201" autocomplete="off" />
                    </div>
                    <div class="field-row">
                      <label class="field-label">BIC / SWIFT <span class="opt">optional</span></label>
                      <input class="field-input" [(ngModel)]="bankEdit.bic" placeholder="e.g. RLNWATWW" autocomplete="off" />
                    </div>
                    @if (bankSaved()) { <p class="pw-success">Saved!</p> }
                    @if (bankError()) { <p class="connect-error">{{ bankError() }}</p> }
                    <button class="btn-payout-save" (click)="saveBankDetails()" [disabled]="bankSaving()">
                      @if (bankSaving()) { <span class="mini-ring"></span> Saving… } @else { Save bank details }
                    </button>
                  </div>

                  <!-- PayPal -->
                  <div class="card payout-card" style="margin-bottom:0.875rem">
                    <div class="payout-card-head">
                      <div class="payout-icon paypal-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.144 19.532l1.049-5.751c.11-.606.691-1.002 1.304-.862 2.493.57 6.284.233 7.94-3.299 1.91-4.048-.957-6.582-5.058-6.584H6.01c-.56 0-1.038.404-1.137.957L2.532 19.37c-.088.485.285.942.781.942h3.048c.38 0 .703-.272.783-.64v-.14z"/><path d="M17.222 8.072c.332 2.015-.354 3.734-1.737 4.948-1.31 1.149-3.197 1.64-5.457 1.64H8.55l-1.017 5.568a.8.8 0 01-.783.641H3.703c-.496 0-.87-.457-.782-.943l2.342-13.27c.1-.553.577-.957 1.137-.957h6.37c1.97.001 3.648.456 4.704 1.362.25.214.47.447.657.697"/></svg>
                      </div>
                      <div>
                        <p class="payout-method-name">PayPal</p>
                        <p class="payout-method-sub">Instant transfers · Available worldwide</p>
                      </div>
                      @if (paypalEdit) { <span class="payout-set-badge">✓ Set</span> }
                    </div>
                    <div class="field-row">
                      <label class="field-label">PayPal email address</label>
                      <input class="field-input" type="email" [(ngModel)]="paypalEdit" placeholder="your@email.com" autocomplete="off" />
                    </div>
                    @if (paypalSaved()) { <p class="pw-success">Saved!</p> }
                    @if (paypalError()) { <p class="connect-error">{{ paypalError() }}</p> }
                    <button class="btn-payout-save" (click)="savePaypal()" [disabled]="paypalSaving()">
                      @if (paypalSaving()) { <span class="mini-ring"></span> Saving… } @else { Save PayPal }
                    </button>
                  </div>

                  <!-- Revolut -->
                  <div class="card payout-card" style="margin-bottom:0.875rem">
                    <div class="payout-card-head">
                      <div class="payout-icon revolut-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3H7.5C5.015 3 3 5.015 3 7.5v9c0 2.485 2.015 4.5 4.5 4.5h9c2.485 0 4.5-2.015 4.5-4.5v-9C21 5.015 18.985 3 16.5 3zm-2.1 12.3l-2.55-3.75H9.9v3.75H7.95V8.7H12c1.8 0 3 .9 3 2.625 0 1.2-.675 2.1-1.725 2.4L16.05 15.3h-1.65z"/></svg>
                      </div>
                      <div>
                        <p class="payout-method-name">Revolut</p>
                        <p class="payout-method-sub">Popular in Europe · Email or phone</p>
                      </div>
                      @if (revolutEdit) { <span class="payout-set-badge">✓ Set</span> }
                    </div>
                    <div class="field-row">
                      <label class="field-label">Revolut email or phone</label>
                      <input class="field-input" [(ngModel)]="revolutEdit" placeholder="+43 123 456 789 or you@email.com" autocomplete="off" />
                    </div>
                    @if (revolutSaved()) { <p class="pw-success">Saved!</p> }
                    @if (revolutError()) { <p class="connect-error">{{ revolutError() }}</p> }
                    <button class="btn-payout-save" (click)="saveRevolut()" [disabled]="revolutSaving()">
                      @if (revolutSaving()) { <span class="mini-ring"></span> Saving… } @else { Save Revolut }
                    </button>
                  </div>

                  <!-- Stripe Connect -->
                  <div class="card payout-card" style="margin-bottom:1.25rem">
                    <div class="payout-card-head">
                      <div class="payout-icon stripe-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/></svg>
                      </div>
                      <div>
                        <p class="payout-method-name">Stripe Connect</p>
                        <p class="payout-method-sub">Automatic instant payouts · Requires platform approval</p>
                      </div>
                      @if (connectStatus()?.payoutsEnabled) { <span class="payout-set-badge">✓ Active</span> }
                    </div>
                    @if (!connectStatus()) {
                      <div class="connect-loading"><span class="mini-ring"></span> Checking status…</div>
                    } @else if (connectStatus()!.payoutsEnabled) {
                      <div class="connect-ok">
                        <p class="connect-ok-title">Payouts enabled</p>
                        <p class="connect-ok-sub">Earnings are transferred automatically to your bank after each job.</p>
                        <button class="btn-payout-save" (click)="openConnectDashboard()" [disabled]="connectLoading()" style="margin-top:0.75rem">
                          Open Stripe dashboard
                        </button>
                      </div>
                    } @else if (connectStatus()!.connected) {
                      <p class="connect-desc">Your Stripe account is connected but onboarding isn't complete yet.</p>
                      <button class="btn-payout-save" (click)="startConnectOnboarding()" [disabled]="connectLoading()">
                        @if (connectLoading()) { <span class="mini-ring"></span> Loading… } @else { Continue onboarding }
                      </button>
                    } @else {
                      <p class="connect-desc">Connect your Stripe account to receive automatic instant payouts directly to your bank.</p>
                      <button class="btn-payout-save" (click)="startConnectOnboarding()" [disabled]="connectLoading()">
                        @if (connectLoading()) { <span class="mini-ring"></span> Loading… } @else { Connect with Stripe }
                      </button>
                    }
                    @if (connectError()) { <p class="connect-error">{{ connectError() }}</p> }
                  </div>

                  <div class="card">
                    <p class="section-label">Change Password</p>
                    <div class="field-row">
                      <label class="field-label">Current password</label>
                      <input class="field-input" type="password" [(ngModel)]="pw.current" autocomplete="current-password" />
                    </div>
                    <div class="field-row">
                      <label class="field-label">New password</label>
                      <input class="field-input" type="password" [(ngModel)]="pw.next" autocomplete="new-password" />
                    </div>
                    <div class="field-row">
                      <label class="field-label">Confirm new password</label>
                      <input class="field-input" type="password" [(ngModel)]="pw.confirm" autocomplete="new-password" />
                    </div>
                    @if (pwError()) { <p class="pw-error">{{ pwError() }}</p> }
                    @if (pwSuccess()) { <p class="pw-success">Password updated!</p> }
                    <button class="btn-save-pw" (click)="changePassword()" [disabled]="pwSaving()">
                      {{ pwSaving() ? 'Saving…' : 'Update password' }}
                    </button>
                  </div>

                  <div class="card" style="margin-top:1.25rem">
                    <p class="section-label">Delete Account</p>
                    @if (!confirmDelete()) {
                      <p class="delete-desc">Permanently remove your account and all associated data.</p>
                      <button class="btn-delete-account" (click)="confirmDelete.set(true)">Delete my account</button>
                    } @else {
                      <p class="delete-warn">This cannot be undone. All your jobs, profile, and data will be erased.</p>
                      <div class="delete-actions">
                        <button class="btn-delete-confirm" (click)="deleteAccount()" [disabled]="deleting()">
                          {{ deleting() ? 'Deleting…' : 'Yes, delete everything' }}
                        </button>
                        <button class="btn-cancel" (click)="confirmDelete.set(false)">Cancel</button>
                      </div>
                      @if (deleteError()) { <p class="delete-error">{{ deleteError() }}</p> }
                    }
                  </div>

                  <div class="card" style="margin-top:1.25rem">
                    <p class="section-label">Report a Problem</p>
                    <p class="delete-desc">Experiencing an issue? Let us know and we'll look into it.</p>
                    <button class="btn-report" (click)="showReportModal.set(true)">
                      <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      Report a problem
                    </button>
                  </div>

                </div>
              </div>
            </div><!-- /slide-2 -->

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
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .page { min-height: 100vh; background: #f8f8f8; }
    .inner { max-width: 1100px; margin: 0 auto; padding: 0 1.25rem; }

    /* ── Header ───────────────────────────── */
    .page-header {
      background: #fff;
      border-bottom: 1px solid #e4e4e7;
      padding: 2rem 0 0;
    }
    .header-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      padding-bottom: 1.5rem;
    }
    .eyebrow {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #a1a1aa;
      margin-bottom: 0.3rem;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #18181b;
      letter-spacing: -0.025em;
      margin: 0;
    }

    .stat-bar {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      background: #f4f4f5;
      border: 1.5px solid #e4e4e7;
      border-radius: 12px;
      padding: 0.625rem 1.25rem;
    }
    .stat-item { text-align: center; }
    .stat-val { display: block; font-size: 0.95rem; font-weight: 700; color: #18181b; margin-bottom: 0.1rem; }
    .avail-on { color: #14b8a6; }
    .stat-label { font-size: 0.68rem; color: #a1a1aa; font-weight: 500; }

    /* ── Tabs ─────────────────────────────── */
    .tabs-nav { display: flex; gap: 0; }
    .tab-btn {
      display: flex; align-items: center; gap: 0.4rem;
      padding: 0.75rem 1.1rem;
      border: none; background: none; cursor: pointer;
      font-size: 0.855rem; font-weight: 500; color: #71717a;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: color 0.15s, border-color 0.15s;
      font-family: inherit; white-space: nowrap;
    }
    .tab-btn:hover { color: #3f3f46; }
    .tab-active { color: #18181b !important; border-bottom-color: #18181b; font-weight: 600; }
    .tab-active svg { stroke: #18181b; }

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
  activeTab = signal<'profile' | 'identity' | 'security'>('profile');
  tabIndex = computed(() => (['profile', 'identity', 'security'] as const).indexOf(this.activeTab()));
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
