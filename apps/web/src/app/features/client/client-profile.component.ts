import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { VerifyIdentityComponent } from '../../shared/verify-identity.component';

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
  imports: [CommonModule, FormsModule, VerifyIdentityComponent],
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
      </div>

      @if (profile()) {
        <div class="page-body">
          <div class="inner">
            <div class="profile-grid">

              <!-- Info card -->
              <div class="card">
                <div class="avatar-row">
                  <div class="avatar-circle">{{ profile()!.firstName[0] }}{{ profile()!.lastName[0] }}</div>
                  <div>
                    <p class="avatar-name">{{ profile()!.firstName }} {{ profile()!.lastName }}</p>
                    <p class="avatar-email">{{ profile()!.email }}</p>
                  </div>
                </div>

                <div class="section-label">Personal Info</div>

                <div class="field-row">
                  <label class="field-label">First name</label>
                  <input class="field-input" [(ngModel)]="edit.firstName" />
                </div>
                <div class="field-row">
                  <label class="field-label">Last name</label>
                  <input class="field-input" [(ngModel)]="edit.lastName" />
                </div>
                <div class="field-row">
                  <label class="field-label">Phone</label>
                  <input class="field-input" [(ngModel)]="edit.phone" placeholder="Optional" />
                </div>

                <div class="section-label" style="margin-top:1.25rem">Location</div>

                <div class="field-row">
                  <label class="field-label">Search address</label>
                  <input class="field-input" [(ngModel)]="locationQuery"
                    (input)="searchLocation()"
                    placeholder="Street, city…" />
                </div>
                @if (locationSuggestions().length > 0) {
                  <ul class="suggestions">
                    @for (item of locationSuggestions(); track item.display_name) {
                      <li (click)="selectLocation(item)">{{ item.display_name }}</li>
                    }
                  </ul>
                }
                @if (locationConfirmed()) {
                  <p class="loc-confirmed">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {{ edit.city || 'Location set' }}
                  </p>
                }

                @if (saveSuccess()) {
                  <p class="save-success">Changes saved!</p>
                }
                @if (saveError()) {
                  <p class="save-error">{{ saveError() }}</p>
                }

                <button class="btn-save" (click)="saveProfile()" [disabled]="saving()">
                  {{ saving() ? 'Saving…' : 'Save changes' }}
                </button>
              </div>

              <!-- Right column -->
              <div style="display:flex;flex-direction:column;gap:1.25rem">

                <!-- Identity Verification -->
                <div class="card">
                  <div class="section-label">Identity Verification</div>
                  <app-verify-identity />
                </div>

                <!-- Delete account -->
                <div class="card">
                  <div class="section-label">Delete Account</div>
                  <p class="delete-desc">Permanently remove your account and all associated data.</p>

                  @if (!confirmDelete()) {
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
                      <p class="save-error">{{ deleteError() }}</p>
                    }
                  }
                </div>

              </div>
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

    .page-header { background: #fff; border-bottom: 1px solid #e4e4e7; padding: 2rem 0 0; }
    .header-top { padding-bottom: 1.5rem; }
    .eyebrow { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #a1a1aa; margin-bottom: 0.3rem; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #18181b; letter-spacing: -0.025em; margin: 0; }

    .page-body { padding: 2rem 0; }
    .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; align-items: start; }

    .card { background: #fff; border: 1.5px solid #e4e4e7; border-radius: 16px; padding: 1.5rem; }

    .avatar-row { display: flex; align-items: center; gap: 0.875rem; padding-bottom: 1.25rem; margin-bottom: 1.25rem; border-bottom: 1px solid #f4f4f5; }
    .avatar-circle { width: 52px; height: 52px; border-radius: 50%; background: #18181b; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.05rem; font-weight: 700; flex-shrink: 0; }
    .avatar-name { font-size: 0.95rem; font-weight: 600; color: #18181b; margin: 0 0 0.2rem; }
    .avatar-email { font-size: 0.8rem; color: #a1a1aa; margin: 0; }

    .section-label { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #a1a1aa; margin: 0 0 0.875rem; }

    .field-row { margin-bottom: 0.875rem; }
    .field-label { display: block; font-size: 0.75rem; font-weight: 600; color: #71717a; margin-bottom: 0.3rem; }
    .field-input { width: 100%; padding: 0.5rem 0.75rem; border: 1.5px solid #e4e4e7; border-radius: 8px; font-size: 0.875rem; color: #18181b; font-family: inherit; outline: none; transition: border-color 0.15s; }
    .field-input:focus { border-color: #18181b; }

    .suggestions { list-style: none; margin: 0; padding: 0; border: 1.5px solid #e4e4e7; border-radius: 8px; overflow: hidden; }
    .suggestions li { padding: 0.5rem 0.75rem; font-size: 0.8rem; cursor: pointer; color: #3f3f46; }
    .suggestions li:hover { background: #f4f4f5; }
    .loc-confirmed { display: flex; align-items: center; gap: 0.3rem; font-size: 0.8rem; color: #0f766e; margin: 0.5rem 0 0; }

    .save-success { font-size: 0.8rem; color: #16a34a; margin: 0.75rem 0 0; }
    .save-error { font-size: 0.8rem; color: #dc2626; margin: 0.75rem 0 0; }

    .btn-save { margin-top: 1.25rem; width: 100%; padding: 0.625rem; border-radius: 10px; background: #18181b; color: #fff; font-size: 0.875rem; font-weight: 600; border: none; cursor: pointer; transition: background 0.15s; }
    .btn-save:hover:not(:disabled) { background: #3f3f46; }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

    .delete-desc { font-size: 0.875rem; color: #71717a; margin: 0 0 1rem; }
    .delete-warn { font-size: 0.875rem; color: #3f3f46; margin: 0 0 1rem; }
    .delete-actions { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
    .btn-delete-account { padding: 0.5rem 1.1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600; background: #fff; border: 1.5px solid #e4e4e7; color: #dc2626; cursor: pointer; transition: background 0.15s; }
    .btn-delete-account:hover { background: #fef2f2; border-color: #fca5a5; }
    .btn-delete-confirm { padding: 0.5rem 1.1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600; background: #dc2626; border: none; color: #fff; cursor: pointer; transition: background 0.15s; }
    .btn-delete-confirm:hover:not(:disabled) { background: #b91c1c; }
    .btn-delete-confirm:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-cancel { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; background: transparent; border: 1.5px solid #e4e4e7; color: #71717a; cursor: pointer; }

    .loading { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 0; color: #a1a1aa; font-size: 0.875rem; }
    .load-ring { width: 30px; height: 30px; border: 2.5px solid #e4e4e7; border-top-color: #18181b; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 680px) {
      .inner { padding: 0 1rem; }
      .profile-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ClientProfileComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  profile = signal<ClientProfile | null>(null);
  saving = signal(false);
  saveSuccess = signal(false);
  saveError = signal<string | null>(null);
  confirmDelete = signal(false);
  deleting = signal(false);
  deleteError = signal<string | null>(null);

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
