import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { VerifyIdentityComponent } from '../../shared/verify-identity.component';
import { ReportProblemComponent } from '../../shared/report-problem.component';

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

      <div class="page-header">
        <div class="inner">
          <div class="header-top">
            <div>
              <p class="eyebrow">Account</p>
              <h1 class="page-title">My Profile</h1>
            </div>
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
        <div class="slides-outer">
          <div class="slides-track" [style.transform]="'translateX(-' + tabIndex() * 100 + '%)'">
            <!-- Slide 0: Profile -->
            <div class="slide">
        <div class="page-body">
          <div class="inner inner--narrow">

              <!-- Personal Info -->
              <div class="card">
                <div class="avatar-row">
                  <div class="avatar-circle">{{ profile()!.firstName[0] }}{{ profile()!.lastName[0] }}</div>
                  <div>
                    <p class="avatar-name">{{ profile()!.firstName }} {{ profile()!.lastName }}</p>
                    <p class="avatar-email">{{ profile()!.email }}</p>
                  </div>
                </div>
                <div class="fields-grid">
                  <div class="field-col">
                    <label class="field-label">First name</label>
                    <input class="field-input" [(ngModel)]="edit.firstName" />
                  </div>
                  <div class="field-col">
                    <label class="field-label">Last name</label>
                    <input class="field-input" [(ngModel)]="edit.lastName" />
                  </div>
                  <div class="field-col">
                    <label class="field-label">Phone</label>
                    <input class="field-input" [(ngModel)]="edit.phone" placeholder="Optional" />
                  </div>
                  <div class="field-col">
                    <label class="field-label">City / Address</label>
                    <input class="field-input" [(ngModel)]="locationQuery" (input)="searchLocation()" placeholder="Search address…" />
                    @if (locationSuggestions().length > 0) {
                      <ul class="suggestions">
                        @for (item of locationSuggestions(); track item.display_name) {
                          <li (click)="selectLocation(item)">{{ item.display_name }}</li>
                        }
                      </ul>
                    }
                    @if (locationConfirmed()) {
                      <p class="loc-confirmed">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        {{ edit.city || 'Location set' }}
                      </p>
                    }
                  </div>
                </div>
                @if (saveSuccess()) { <p class="msg-ok">Changes saved!</p> }
                @if (saveError()) { <p class="msg-err">{{ saveError() }}</p> }
                <div class="card-footer">
                  <button class="btn-primary" (click)="saveProfile()" [disabled]="saving()">
                    {{ saving() ? 'Saving…' : 'Save changes' }}
                  </button>
                </div>
              </div>

          </div>
        </div>
            </div><!-- /slide-0 -->

            <!-- Slide 1: Identity -->
            <div class="slide">
              <div class="page-body">
                <div class="inner inner--narrow">
                  <div class="card">
                    <div class="section-label">Identity Verification</div>
                    <app-verify-identity />
                  </div>
                </div>
              </div>
            </div><!-- /slide-1 -->

            <!-- Slide 2: Security -->
            <div class="slide">
              <div class="page-body">
                <div class="inner inner--narrow">

                  <div class="card">
                    <div class="section-label">Change Password</div>
                    <div class="fields-grid fields-grid--single">
                      <div class="field-col">
                        <label class="field-label">Current password</label>
                        <input class="field-input" type="password" [(ngModel)]="pw.current" autocomplete="current-password" />
                      </div>
                      <div class="field-col">
                        <label class="field-label">New password</label>
                        <input class="field-input" type="password" [(ngModel)]="pw.next" autocomplete="new-password" />
                      </div>
                      <div class="field-col">
                        <label class="field-label">Confirm new password</label>
                        <input class="field-input" type="password" [(ngModel)]="pw.confirm" autocomplete="new-password" />
                      </div>
                    </div>
                    @if (pwError()) { <p class="msg-err">{{ pwError() }}</p> }
                    @if (pwSuccess()) { <p class="msg-ok">Password updated!</p> }
                    <div class="card-footer">
                      <button class="btn-primary" (click)="changePassword()" [disabled]="pwSaving()">
                        {{ pwSaving() ? 'Saving…' : 'Update password' }}
                      </button>
                    </div>
                  </div>

                  <div class="card" style="margin-top:1.25rem">
                    <div class="section-label">Delete Account</div>
                    <p class="delete-desc">Permanently remove your account and all associated data.</p>
                    @if (!confirmDelete()) {
                      <button class="btn-delete" (click)="confirmDelete.set(true)">Delete my account</button>
                    } @else {
                      <p class="delete-warn">This cannot be undone. All your jobs, profile, and data will be erased.</p>
                      <div class="delete-actions">
                        <button class="btn-delete-confirm" (click)="deleteAccount()" [disabled]="deleting()">
                          {{ deleting() ? 'Deleting…' : 'Yes, delete everything' }}
                        </button>
                        <button class="btn-cancel" (click)="confirmDelete.set(false)">Cancel</button>
                      </div>
                      @if (deleteError()) { <p class="msg-err">{{ deleteError() }}</p> }
                    }
                  </div>

                  <div class="card" style="margin-top:1.25rem">
                    <div class="section-label">Report a Problem</div>
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
    .inner { max-width: 900px; margin: 0 auto; padding: 0 2rem; }

    .page-header { background: #fff; border-bottom: 1px solid #e4e4e7; padding: 2rem 0 0; }
    .header-top { padding-bottom: 1.5rem; }
    .eyebrow { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #a1a1aa; margin-bottom: 0.3rem; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #18181b; letter-spacing: -0.025em; margin: 0; }

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

    /* ── Slides ────────────────────────────── */
    .slides-outer { overflow: hidden; }
    .slides-track { display: flex; transition: transform 0.35s cubic-bezier(0.4,0,0.2,1); will-change: transform; }
    .slide { flex: 0 0 100%; min-width: 0; }
    .inner--narrow { max-width: 660px; }

    .page-body { padding: 2rem 0 4rem; }
    .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; align-items: start; }
    .card { background: #fff; border: 1.5px solid #e4e4e7; border-radius: 16px; padding: 1.5rem; }
    .fields-grid--single { grid-template-columns: 1fr; }

    .avatar-row { display: flex; align-items: center; gap: 0.875rem; padding-bottom: 1.25rem; margin-bottom: 1.5rem; border-bottom: 1px solid #f4f4f5; }
    .avatar-circle { width: 48px; height: 48px; border-radius: 50%; background: #18181b; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 700; flex-shrink: 0; }
    .avatar-name { font-size: 0.95rem; font-weight: 600; color: #18181b; margin: 0 0 0.2rem; }
    .avatar-email { font-size: 0.8rem; color: #a1a1aa; margin: 0; }

    .section-label { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #a1a1aa; margin: 0 0 1rem; }

    .fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem 1rem; }
    .field-col { display: flex; flex-direction: column; }
    .field-label { font-size: 0.75rem; font-weight: 600; color: #71717a; margin-bottom: 0.3rem; }
    .field-input { width: 100%; padding: 0.5rem 0.75rem; border: 1.5px solid #e4e4e7; border-radius: 8px; font-size: 0.875rem; color: #18181b; font-family: inherit; outline: none; transition: border-color 0.15s; }
    .field-input:focus { border-color: #18181b; }

    .suggestions { list-style: none; margin: 0.25rem 0 0; padding: 0; border: 1.5px solid #e4e4e7; border-radius: 8px; overflow: hidden; position: absolute; z-index: 10; background: #fff; width: 100%; }
    .suggestions li { padding: 0.5rem 0.75rem; font-size: 0.8rem; cursor: pointer; color: #3f3f46; }
    .suggestions li:hover { background: #f4f4f5; }
    .loc-confirmed { display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; color: #0f766e; margin: 0.3rem 0 0; }

    .card-footer { margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid #f4f4f5; display: flex; justify-content: flex-end; }
    .btn-primary { padding: 0.55rem 1.4rem; border-radius: 10px; background: #18181b; color: #fff; font-size: 0.875rem; font-weight: 600; border: none; cursor: pointer; transition: background 0.15s; }
    .btn-primary:hover:not(:disabled) { background: #3f3f46; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .msg-ok { font-size: 0.8rem; color: #16a34a; margin: 0.75rem 0 0; }
    .msg-err { font-size: 0.8rem; color: #dc2626; margin: 0.75rem 0 0; }

    .delete-desc { font-size: 0.875rem; color: #71717a; margin: 0 0 1rem; }
    .delete-warn { font-size: 0.875rem; color: #3f3f46; margin: 0 0 1rem; }
    .delete-actions { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
    .btn-report { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600; background: #fafafa; border: 1.5px solid #e4e4e7; color: #3f3f46; cursor: pointer; transition: all 0.15s; }
    .btn-report:hover { background: #f4f4f5; border-color: #a1a1aa; }
    .btn-delete { padding: 0.5rem 1.1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600; background: #fff; border: 1.5px solid #e4e4e7; color: #dc2626; cursor: pointer; transition: background 0.15s; }
    .btn-delete:hover { background: #fef2f2; border-color: #fca5a5; }
    .btn-delete-confirm { padding: 0.5rem 1.1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600; background: #dc2626; border: none; color: #fff; cursor: pointer; }
    .btn-delete-confirm:hover:not(:disabled) { background: #b91c1c; }
    .btn-delete-confirm:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-cancel { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; background: transparent; border: 1.5px solid #e4e4e7; color: #71717a; cursor: pointer; }

    .loading { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 0; color: #a1a1aa; font-size: 0.875rem; }
    .load-ring { width: 30px; height: 30px; border: 2.5px solid #e4e4e7; border-top-color: #18181b; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 600px) {
      .inner { padding: 0 1rem; }
      .fields-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ClientProfileComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  profile = signal<ClientProfile | null>(null);
  activeTab = signal<'profile' | 'identity' | 'security'>('profile');
  tabIndex = computed(() => (['profile', 'identity', 'security'] as const).indexOf(this.activeTab()));
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

  ngOnInit() {
    this.api.getClientProfile().subscribe({
      next: (p) => this.setProfile(p as ClientProfile),
    });
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
