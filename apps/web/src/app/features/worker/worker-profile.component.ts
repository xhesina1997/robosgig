import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { VerifyIdentityComponent } from '../../shared/verify-identity.component';

interface Skill { id: string; name: string; category: { name: string; icon: string } }
interface WorkerSkill { skill: Skill }
interface WorkerProfile {
  id: string; firstName: string; lastName: string; bio: string | null;
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
  imports: [CommonModule, FormsModule, VerifyIdentityComponent],
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
      </div>

      @if (profile()) {
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

              <!-- Right: Skills -->
              <div class="card">
                <div class="section-label">My Skills</div>
                <p class="skills-hint">These appear on your profile and help clients find you.</p>

                <!-- Current skills -->
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

                <!-- Custom skill input -->
                <div class="section-label" style="margin-top:1.5rem">Add a custom skill</div>
                <div class="custom-skill-row">
                  <input
                    class="field-input"
                    [(ngModel)]="customSkillInput"
                    placeholder="e.g. Tile installation, HVAC, Welding…"
                    (keydown.enter)="addCustomSkill()"
                  />
                  <button class="add-btn" (click)="addCustomSkill()" [disabled]="!customSkillInput.trim()">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add
                  </button>
                </div>

                <!-- Predefined skills -->
                <div class="section-label" style="margin-top:1.5rem">Browse skills</div>
                @for (group of skillGroups(); track group.category) {
                  <div class="skill-group">
                    <p class="group-label">{{ group.category }}</p>
                    <div class="skill-options">
                      @for (skill of group.skills; track skill.id) {
                        <button
                          class="skill-opt"
                          [class.skill-opt--owned]="hasSkill(skill.id)"
                          (click)="toggleSkill(skill)"
                          [disabled]="hasSkill(skill.id)"
                        >{{ skill.name }}</button>
                      }
                    </div>
                  </div>
                }
              </div>

            </div>

            <!-- Identity Verification -->
            <div class="form-card">
              <p class="section-label">Identity Verification</p>
              <app-verify-identity />
            </div>

            <!-- Change password -->
            <div class="form-card">
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

            <!-- Delete account -->
            <div class="form-card">
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
                @if (deleteError()) {
                  <p class="delete-error">{{ deleteError() }}</p>
                }
              }
            </div>

          </div>
        </div>
      } @else {
        <div class="loading">
          <div class="load-ring"></div>
          <p>Loading your profile…</p>
        </div>
      }
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .page { min-height: 100vh; background: #f8f8f8; }
    .inner { max-width: 900px; margin: 0 auto; padding: 0 2rem; }

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

    /* ── Body ─────────────────────────────── */
    .page-body { padding: 2rem 0; }

    .profile-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      align-items: start;
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
    .avatar-name { font-size: 0.95rem; font-weight: 600; color: #18181b; margin: 0 0 0.3rem; }
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
    .delete-desc { font-size: 0.875rem; color: #71717a; margin: 0.5rem 0 1rem; }
    .delete-warn { font-size: 0.875rem; color: #3f3f46; margin: 0.5rem 0 1rem; }
    .delete-actions { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
    .btn-delete-account {
      padding: 0.5rem 1.1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600;
      background: #fff; border: 1.5px solid #e4e4e7; color: #dc2626; cursor: pointer;
      transition: background 0.15s;
    }
    .btn-delete-account:hover { background: #fef2f2; border-color: #fca5a5; }
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
  allSkills = signal<Skill[]>([]);
  skillGroups = signal<{ category: string; icon: string; skills: Skill[] }[]>([]);
  customSkills = signal<string[]>([]);
  saving = signal(false);
  saveSuccess = signal(false);
  saveError = signal<string | null>(null);
  confirmDelete = signal(false);
  deleting = signal(false);
  deleteError = signal<string | null>(null);
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

  ngOnInit() {
    this.api.getMyWorkerProfile().subscribe({ next: (p) => this.setProfile(p as WorkerProfile) });
    this.api.getAllSkills().subscribe({ next: (skills) => this.buildSkillGroups(skills as Skill[]) });
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
