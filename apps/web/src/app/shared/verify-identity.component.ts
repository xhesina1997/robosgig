import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { environment } from '../../environments/environment';
import { loadStripe } from '@stripe/stripe-js';

// Stripe Identity supported (mirror of backend list) — UI shows the rest as "manual review"
const STRIPE_COUNTRIES = new Set([
  'AT','AU','BE','BG','CA','CH','CY','CZ','DE','DK','EE','ES','FI','FR','GB','GR','HR','HU','IE','IT','JP','LT','LU','LV','MT','MX','NL','NO','NZ','PL','PT','RO','SE','SG','SI','SK','US',
]);

const COUNTRIES: { code: string; name: string }[] = [
  { code: 'AL', name: 'Albania' },
  { code: 'AT', name: 'Austria' },
  { code: 'AU', name: 'Australia' },
  { code: 'BA', name: 'Bosnia & Herzegovina' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'CA', name: 'Canada' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DE', name: 'Germany' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EE', name: 'Estonia' },
  { code: 'ES', name: 'Spain' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'GR', name: 'Greece' },
  { code: 'HR', name: 'Croatia' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'XK', name: 'Kosovo' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'LV', name: 'Latvia' },
  { code: 'MD', name: 'Moldova' },
  { code: 'ME', name: 'Montenegro' },
  { code: 'MK', name: 'North Macedonia' },
  { code: 'MT', name: 'Malta' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NO', name: 'Norway' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'RS', name: 'Serbia' },
  { code: 'SE', name: 'Sweden' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'US', name: 'United States' },
];

@Component({
  selector: 'app-verify-identity',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (status() === 'VERIFIED') {
      <div class="verified-card">
        <div class="verified-card-icon">
          @switch (documentType()) {
            @case ('passport') {
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><circle cx="12" cy="11" r="3"/><path d="M8 18h8"/></svg>
            }
            @case ('id_card') {
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2.5"/><path d="M13 10h6M13 14h4"/></svg>
            }
            @case ('driving_license') {
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2.5"/><path d="M13 10h6M13 14h4"/><circle cx="18" cy="17.5" r="1"/></svg>
            }
            @default {
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3z"/><path d="m9 12 2 2 4-4"/></svg>
            }
          }
        </div>
        <div class="verified-card-main">
          <div class="verified-card-row">
            <span class="verified-card-title">ID Verified</span>
            <span class="verified-card-tick">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
            </span>
          </div>
          <div class="verified-card-sub">
            <span class="verified-card-doc">{{ documentLabel() }}</span>
            @if (country) {
              <span class="verified-card-sep">·</span>
              <span class="verified-card-country">{{ countryName() }}</span>
            }
          </div>
        </div>
      </div>
    } @else {
      <div class="verify-box">
        <div class="verify-head">
          <div class="verify-icon">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="13" x2="12" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
          </div>
          <div>
            <p class="verify-title">Verify your identity</p>
            <p class="verify-sub">Build trust by verifying your ID</p>
          </div>
        </div>

        @if (status() === 'PENDING') {
          <div class="status-pill pending">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 5v5l3 3-1.5 1.5L10 13V7h2z"/></svg>
            Under review — usually completed within 24h
          </div>
        } @else if (status() === 'REJECTED') {
          <div class="status-pill rejected">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Verification failed{{ rejectionReason() ? ' — ' + rejectionReason() : '' }}. Please try again.
          </div>
        }

        @if (status() !== 'PENDING') {

          <!-- Country picker -->
          <div class="field">
            <label class="field-lbl">Country</label>
            <select class="field-input" [(ngModel)]="country" name="country">
              <option value="" disabled>Select your country</option>
              @for (c of countries; track c.code) {
                <option [value]="c.code">{{ c.name }}</option>
              }
            </select>
          </div>

          @if (country && !usesStripe()) {
            <!-- Manual upload form -->
            <div class="manual-info">
              <svg width="14" height="14" fill="none" stroke="#6b7280" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3z"/></svg>
              <span>Your country isn't supported by automated verification, so our team will review your documents manually (usually within 24h).</span>
            </div>

            <div class="upload-grid">
              <div class="upload-slot">
                <span class="upload-lbl">ID — front</span>
                @if (idFrontUrl()) {
                  <div class="preview">
                    <img [src]="idFrontUrl()" alt="ID front"/>
                    <button class="preview-remove" (click)="idFrontUrl.set(null)" type="button">×</button>
                  </div>
                } @else {
                  <label class="upload-drop" [class.uploading]="uploading() === 'idFront'">
                    <input type="file" accept="image/*" hidden (change)="onFile($event, 'idFront')"/>
                    @if (uploading() === 'idFront') { Uploading… } @else { + Add front }
                  </label>
                }
              </div>

              <div class="upload-slot">
                <span class="upload-lbl">ID — back <span class="upload-opt">(optional)</span></span>
                @if (idBackUrl()) {
                  <div class="preview">
                    <img [src]="idBackUrl()" alt="ID back"/>
                    <button class="preview-remove" (click)="idBackUrl.set(null)" type="button">×</button>
                  </div>
                } @else {
                  <label class="upload-drop" [class.uploading]="uploading() === 'idBack'">
                    <input type="file" accept="image/*" hidden (change)="onFile($event, 'idBack')"/>
                    @if (uploading() === 'idBack') { Uploading… } @else { + Add back }
                  </label>
                }
              </div>

              <div class="upload-slot">
                <span class="upload-lbl">Selfie</span>
                @if (selfieUrl()) {
                  <div class="preview">
                    <img [src]="selfieUrl()" alt="Selfie"/>
                    <button class="preview-remove" (click)="selfieUrl.set(null)" type="button">×</button>
                  </div>
                } @else {
                  <label class="upload-drop" [class.uploading]="uploading() === 'selfie'">
                    <input type="file" accept="image/*" hidden (change)="onFile($event, 'selfie')"/>
                    @if (uploading() === 'selfie') { Uploading… } @else { + Add selfie }
                  </label>
                }
              </div>
            </div>
          } @else if (country && usesStripe()) {
            <div class="stripe-info">
              <svg width="14" height="14" fill="none" stroke="#6b7280" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <span>Powered by <strong>Stripe Identity</strong> — your documents are never stored on our servers.</span>
            </div>
          }

          @if (error()) { <p class="error-msg">{{ error() }}</p> }

          <button class="verify-btn" [disabled]="loading() || !canSubmit()" (click)="submit()">
            @if (loading()) {
              <span class="spinner"></span> Submitting…
            } @else {
              @if (!country) {
                Verify my identity
              } @else if (usesStripe()) {
                Continue with Stripe Identity
              } @else {
                Submit for review
              }
            }
          </button>
        }
      </div>
    }
  `,
  styles: [`
    :host {
      --bg: var(--rg-bg, #fafafa); --panel: var(--rg-panel, #FFFFFF); --ink: #0A0A0A;
      --muted: var(--rg-muted, #737373); --sub: #A3A3A3; --rule: #E8E8E5;
      --accent: var(--rg-accent, #84CC16); --accent-text: #4D7C0F; --accent-bg: #F0FAE0;
      --soft: var(--rg-soft, #F5F5F3);
    }
    * { box-sizing: border-box; }

    .verified-badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--accent-bg); color: var(--accent-text);
      font-size: 13px; font-weight: 600; padding: 6px 12px; border-radius: 99px;
    }

    /* Verified-card display */
    .verified-card {
      display: inline-flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      border: 1px solid #D6EAA0;
      background: linear-gradient(135deg, #F8FCEE 0%, #F0FAE0 100%);
      border-radius: 14px;
      max-width: 420px;
    }
    .verified-card-icon {
      width: 44px;
      height: 44px;
      flex-shrink: 0;
      border-radius: 12px;
      background: var(--rg-panel, #fff);
      border: 1px solid #D6EAA0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--accent-text);
    }
    .verified-card-main { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .verified-card-row {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .verified-card-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--ink);
      letter-spacing: -0.01em;
      line-height: 1.1;
    }
    .verified-card-tick {
      width: 16px;
      height: 16px;
      border-radius: 999px;
      background: var(--accent);
      color: var(--ink);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .verified-card-sub {
      font-size: 12px;
      color: var(--accent-text);
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-weight: 500;
    }
    .verified-card-doc { letter-spacing: -0.005em; }
    .verified-card-sep { color: var(--muted); }
    .verified-card-country {
      font-family: 'Geist Mono', ui-monospace, monospace;
      letter-spacing: 0.02em;
    }

    .verify-box {
      background: var(--panel); border: 1px solid var(--rule);
      border-radius: 14px; padding: 18px;
      display: flex; flex-direction: column; gap: 14px;
    }
    .verify-head { display: flex; align-items: flex-start; gap: 12px; }
    .verify-icon {
      width: 36px; height: 36px; background: var(--soft); border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; color: var(--ink);
    }
    .verify-title { font-size: 14px; font-weight: 500; color: var(--ink); margin: 0 0 2px; }
    .verify-sub { font-size: 12.5px; color: var(--muted); margin: 0; }

    .status-pill {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 12.5px; font-weight: 500; padding: 8px 12px; border-radius: 10px;
    }
    .status-pill.pending  { background: #FEF3C7; color: #92400E; }
    .status-pill.rejected { background: #FEE2E2; color: #991B1B; }

    .field { display: flex; flex-direction: column; gap: 6px; }
    .field-lbl { font-size: 11.5px; color: var(--muted); letter-spacing: 0.01em; }
    .field-input {
      width: 100%;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid var(--rule);
      background: var(--panel);
      font-family: inherit;
      font-size: 13.5px;
      color: var(--ink);
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .field-input:focus { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(10,10,10,0.06); }

    .stripe-info, .manual-info {
      display: flex; align-items: flex-start; gap: 8px;
      font-size: 12px; color: var(--muted); line-height: 1.5;
      background: var(--soft); border: 1px solid var(--rule);
      border-radius: 10px; padding: 10px 12px;
    }
    .stripe-info svg, .manual-info svg { flex-shrink: 0; margin-top: 1px; }

    .upload-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    @media (max-width: 600px) { .upload-grid { grid-template-columns: 1fr; } }
    .upload-slot { display: flex; flex-direction: column; gap: 6px; }
    .upload-lbl { font-size: 11.5px; color: var(--muted); }
    .upload-opt { color: var(--sub); }
    .upload-drop {
      border: 1.5px dashed var(--rule);
      border-radius: 10px;
      background: var(--soft);
      color: var(--muted);
      font-size: 12.5px;
      padding: 24px 12px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .upload-drop:hover { border-color: var(--ink); color: var(--ink); }
    .upload-drop.uploading { background: var(--accent-bg); border-color: #D6EAA0; color: var(--accent-text); cursor: progress; }

    .preview { position: relative; border: 1px solid var(--rule); border-radius: 10px; overflow: hidden; background: var(--soft); }
    .preview img { display: block; width: 100%; height: 100px; object-fit: cover; }
    .preview-remove {
      position: absolute; top: 4px; right: 4px;
      width: 22px; height: 22px; border-radius: 999px;
      background: rgba(10,10,10,0.6); color: #fff;
      border: none; cursor: pointer; font-size: 14px; line-height: 1;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .preview-remove:hover { background: rgba(10,10,10,0.85); }

    .error-msg { font-size: 12.5px; color: #B91C1C; margin: 0; }

    .verify-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      background: var(--rg-invert-bg, #0A0A0A); color: var(--rg-invert-fg, #fff); border: none;
      padding: 11px 18px; border-radius: 10px;
      font-size: 13px; font-weight: 500; cursor: pointer;
      font-family: inherit; transition: background 0.15s;
      align-self: flex-start;
    }
    .verify-btn:hover:not(:disabled) { background: var(--rg-invert-hover, #1f1f1f); }
    .verify-btn:disabled { opacity: 0.55; cursor: not-allowed; }

    .spinner {
      width: 13px; height: 13px;
      border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
      border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class VerifyIdentityComponent implements OnInit {
  private api = inject(ApiService);

  status = signal<'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('NONE');
  rejectionReason = signal<string | null>(null);
  documentType = signal<string | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  country = '';
  countries = COUNTRIES;

  documentLabel = computed(() => {
    switch (this.documentType()) {
      case 'passport': return 'Passport';
      case 'id_card': return 'National ID card';
      case 'driving_license': return 'Driver’s licence';
      default: return 'Government-issued ID';
    }
  });

  countryName = computed(() => {
    const c = this.country;
    if (!c) return '';
    return COUNTRIES.find((x) => x.code === c)?.name ?? c;
  });

  idFrontUrl = signal<string | null>(null);
  idBackUrl = signal<string | null>(null);
  selfieUrl = signal<string | null>(null);
  uploading = signal<'idFront' | 'idBack' | 'selfie' | null>(null);

  ngOnInit() {
    this.api.getVerifyStatus().subscribe({
      next: (data: any) => {
        if (data.idVerified) {
          this.status.set('VERIFIED');
        } else if (data.verification) {
          this.status.set(data.verification.status);
          this.rejectionReason.set(data.verification.rejectionReason ?? null);
          this.documentType.set(data.verification.documentType ?? null);
          if (data.verification.country) this.country = data.verification.country;
        }
        if (data.idVerified && data.verification) {
          this.documentType.set(data.verification.documentType ?? null);
          if (data.verification.country) this.country = data.verification.country;
        }
      },
    });
  }

  usesStripe(): boolean {
    return STRIPE_COUNTRIES.has(this.country);
  }

  canSubmit(): boolean {
    if (!this.country) return false;
    if (this.usesStripe()) return true;
    return !!(this.idFrontUrl() && this.selfieUrl()) && this.uploading() === null;
  }

  async onFile(ev: Event, slot: 'idFront' | 'idBack' | 'selfie') {
    const file = (ev.target as HTMLInputElement).files?.[0];
    (ev.target as HTMLInputElement).value = '';
    if (!file) return;

    this.uploading.set(slot);
    this.error.set(null);
    try {
      const url = await this.uploadToCloudinary(file);
      if (slot === 'idFront') this.idFrontUrl.set(url);
      else if (slot === 'idBack') this.idBackUrl.set(url);
      else this.selfieUrl.set(url);
    } catch (e: unknown) {
      this.error.set((e as Error)?.message ?? 'Upload failed. Please try again.');
    } finally {
      this.uploading.set(null);
    }
  }

  private async uploadToCloudinary(file: File): Promise<string> {
    const sig = await new Promise<{ cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string }>(
      (resolve, reject) => {
        this.api.getCloudinarySignature('robosgig/identity').subscribe({ next: resolve, error: reject });
      },
    );

    const fd = new FormData();
    fd.append('file', file);
    fd.append('api_key', sig.apiKey);
    fd.append('timestamp', String(sig.timestamp));
    fd.append('folder', sig.folder);
    fd.append('signature', sig.signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, {
      method: 'POST',
      body: fd,
    });
    const json: any = await res.json();
    if (!res.ok || !json?.secure_url) {
      throw new Error(json?.error?.message ?? 'Cloudinary upload failed');
    }
    return json.secure_url as string;
  }

  async submit() {
    this.loading.set(true);
    this.error.set(null);

    if (this.usesStripe()) {
      this.api.createVerifySession(this.country).subscribe({
        next: async (res: any) => {
          if (res.method === 'MANUAL') {
            this.status.set('PENDING');
            this.loading.set(false);
            return;
          }
          try {
            const stripe = await loadStripe(environment.stripePublicKey);
            if (!stripe) throw new Error('Stripe failed to load');
            const { error } = await stripe.verifyIdentity(res.clientSecret);
            if (error) this.error.set(error.message ?? 'Verification cancelled.');
            else this.status.set('PENDING');
          } catch (e: unknown) {
            this.error.set((e as Error)?.message ?? 'Something went wrong. Please try again.');
          }
          this.loading.set(false);
        },
        error: (err: { error?: { message?: string } }) => {
          this.error.set(err?.error?.message ?? 'Could not start verification. Please try again.');
          this.loading.set(false);
        },
      });
    } else {
      this.api.submitManualVerification({
        country: this.country,
        idFrontUrl: this.idFrontUrl()!,
        idBackUrl: this.idBackUrl(),
        selfieUrl: this.selfieUrl()!,
      }).subscribe({
        next: () => {
          this.status.set('PENDING');
          this.loading.set(false);
        },
        error: (err: { error?: { message?: string } }) => {
          this.error.set(err?.error?.message ?? 'Submit failed. Please try again.');
          this.loading.set(false);
        },
      });
    }
  }
}
