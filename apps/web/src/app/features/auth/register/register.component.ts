import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

type Role = 'CLIENT' | 'WORKER';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="split-root">

      <!-- ── LEFT PANEL ── -->
      <div class="left-panel">
        <div class="left-grid"></div>
        <div class="left-content">

          <div class="left-logo">
            <svg width="26" height="26" viewBox="0 0 22 22" fill="none">
              <rect width="22" height="22" rx="6" fill="rgba(255,255,255,0.15)"/>
              <path d="M12.5 4L7 12h5l-1.5 6L17 10h-5l1.5-6z" fill="white"/>
            </svg>
            <span class="left-logo-text">RobosGig</span>
          </div>

          <h1 class="left-headline">
            Start earning<br>
            <span class="left-headline-accent">today.</span>
          </h1>
          <p class="left-sub">
            Vienna's marketplace for skilled professionals
            and the clients who need them.
          </p>

          <!-- Stats grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-value">2 400+</span>
              <span class="stat-label">Active workers</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">8 900+</span>
              <span class="stat-label">Jobs completed</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">4.9 ★</span>
              <span class="stat-label">Avg. rating</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">&lt; 2 min</span>
              <span class="stat-label">Match time</span>
            </div>
          </div>

          <!-- Benefit list -->
          <ul class="left-features">
            <li class="left-feature-item">
              <span class="left-check">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <div>
                <span class="left-feature-title">Free to join</span>
                <span class="left-feature-desc">No setup fees, no monthly subscriptions</span>
              </div>
            </li>
            <li class="left-feature-item">
              <span class="left-check">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <div>
                <span class="left-feature-title">Get paid fast</span>
                <span class="left-feature-desc">Payments released within 24 hours</span>
              </div>
            </li>
            <li class="left-feature-item">
              <span class="left-check">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <div>
                <span class="left-feature-title">You set your rate</span>
                <span class="left-feature-desc">Full control over your hourly price</span>
              </div>
            </li>
          </ul>

        </div>
      </div>

      <!-- ── RIGHT PANEL ── -->
      <div class="right-panel">
        <div class="form-wrap">

          <!-- Mobile-only logo -->
          <div class="mobile-logo">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect width="22" height="22" rx="6" fill="#18181b"/>
              <path d="M12.5 4L7 12h5l-1.5 6L17 10h-5l1.5-6z" fill="white"/>
            </svg>
            <span class="mobile-logo-text">RobosGig</span>
          </div>

          <div class="form-heading">
            <h2 class="form-title">Create your account</h2>
            <p class="form-subtitle">Join thousands of people in Vienna</p>
          </div>

          <!-- Role selector -->
          <div class="role-selector">
            <button
              class="role-btn"
              [class.role-btn--active]="role() === 'CLIENT'"
              (click)="role.set('CLIENT')"
              type="button"
            >
              <svg class="role-icon-svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              <span class="role-label">I need help</span>
              <span class="role-desc">Post tasks, hire professionals</span>
            </button>
            <button
              class="role-btn"
              [class.role-btn--active]="role() === 'WORKER'"
              (click)="role.set('WORKER')"
              type="button"
            >
              <svg class="role-icon-svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
              <span class="role-label">I offer services</span>
              <span class="role-desc">Get hired, earn money</span>
            </button>
          </div>

          <form (ngSubmit)="submit()">

            <!-- Name row -->
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">First name</label>
                <input class="field-input" [(ngModel)]="firstName" name="firstName" placeholder="Maria" required/>
              </div>
              <div class="field-group">
                <label class="field-label">Last name</label>
                <input class="field-input" [(ngModel)]="lastName" name="lastName" placeholder="Muster" required/>
              </div>
            </div>

            <!-- Email -->
            <div class="field-group">
              <label class="field-label">Email address</label>
              <div class="input-wrap">
                <svg class="input-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
                <input class="field-input field-input--icon" type="email" [(ngModel)]="email" name="email" placeholder="you@example.com" required/>
              </div>
            </div>

            <!-- Password -->
            <div class="field-group">
              <label class="field-label">Password</label>
              <div class="input-wrap">
                <svg class="input-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <input class="field-input field-input--icon field-input--pw" [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" name="password" placeholder="Min. 8 characters" required/>
                <button type="button" class="pw-toggle" (click)="showPassword.set(!showPassword())">
                  @if (showPassword()) { Hide } @else { Show }
                </button>
              </div>
            </div>

            <!-- Worker-only fields -->
            @if (role() === 'WORKER') {
              <div class="worker-section">
                <div class="worker-section-header">
                  <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                  <span class="worker-section-title">Work details</span>
                </div>

                <div class="field-group">
                  <label class="field-label">City</label>
                  <input class="field-input" [(ngModel)]="city" name="city" placeholder="Vienna" required/>
                </div>
                <div class="field-group">
                  <label class="field-label">Address</label>
                  <input class="field-input" [(ngModel)]="address" name="address" placeholder="Mariahilfer Straße 1, 1060 Wien"/>
                </div>
                <div class="field-row">
                  <div class="field-group">
                    <label class="field-label">Hourly rate (€)</label>
                    <input class="field-input" type="number" [(ngModel)]="hourlyRate" name="hourlyRate" placeholder="35" min="5" max="500"/>
                  </div>
                  <div class="field-group">
                    <label class="field-label">Skills</label>
                    <input class="field-input" [(ngModel)]="skillsText" name="skillsText" placeholder="e.g. Plumber, pipe repair"/>
                  </div>
                </div>
              </div>
            }

<!-- ToS checkbox -->
            <label class="tos-label">
              <input type="checkbox" class="tos-check" [(ngModel)]="termsAccepted" name="termsAccepted"/>
              <span>
                I agree to the
                <a routerLink="/terms" target="_blank" class="tos-link">Terms of Service & Platform Agreement</a>,
                including the fee schedule and the <strong>non-circumvention policy</strong> (no off-platform transactions).
              </span>
            </label>

            <!-- Error -->
            @if (error()) {
              <div class="error-banner">
                <span class="error-icon">!</span>
                {{ error() }}
              </div>
            }

            <!-- Submit -->
            <button type="submit" class="btn-submit" [disabled]="loading() || !canSubmit()">
              @if (loading()) {
                <span class="spinner"></span>
                Creating account…
              } @else {
                Create account →
              }
            </button>

          </form>

          <p class="switch-link">
            Already have an account?
            <a routerLink="/login" class="switch-link-a">Sign in</a>
          </p>

        </div>
      </div>

    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .split-root {
      display: flex;
      min-height: 100vh;
      width: 100%;
    }

    /* ── Left panel ────────────────────────────────────────── */
    .left-panel {
      position: relative;
      width: 50%;
      background: linear-gradient(160deg, #0f2d52 0%, #134e7a 55%, #0e6b7a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 3.5rem;
      overflow: hidden;
    }

    .left-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
      background-size: 44px 44px;
      pointer-events: none;
    }

    .left-content {
      position: relative;
      z-index: 1;
      max-width: 400px;
      width: 100%;
    }

    .left-logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 2.25rem;
    }
    .left-logo-text {
      font-size: 1.15rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.02em;
    }

    .left-headline {
      font-size: clamp(2rem, 3vw, 2.8rem);
      font-weight: 800;
      line-height: 1.15;
      color: rgba(255,255,255,0.97);
      letter-spacing: -0.03em;
      margin-bottom: 0.75rem;
    }
    .left-headline-accent {
      color: #5eead4;
    }

    .left-sub {
      font-size: 0.93rem;
      color: rgba(255,255,255,0.6);
      line-height: 1.65;
      margin-bottom: 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.6rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 12px;
      padding: 0.9rem 1rem;
    }
    .stat-value {
      display: block;
      font-size: 1.15rem;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.02em;
    }
    .stat-label {
      display: block;
      font-size: 0.7rem;
      color: rgba(255,255,255,0.5);
      margin-top: 2px;
      font-weight: 500;
    }

    .left-features {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
    }
    .left-feature-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }
    .left-check {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      background: rgba(94,234,212,0.15);
      border: 1px solid rgba(94,234,212,0.35);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 1px;
    }
    .left-feature-title {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: rgba(255,255,255,0.92);
    }
    .left-feature-desc {
      display: block;
      font-size: 0.76rem;
      color: rgba(255,255,255,0.48);
      margin-top: 1px;
    }

    /* ── Right panel ───────────────────────────────────────── */
    .right-panel {
      width: 50%;
      background: #f8f8f8;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 2.5rem 2.5rem;
      overflow-y: auto;
    }

    .form-wrap {
      width: 100%;
      max-width: 430px;
      animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .mobile-logo {
      display: none;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .mobile-logo-text { font-size: 1rem; font-weight: 700; color: #18181b; }

    .form-heading { margin-bottom: 1.5rem; }
    .form-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #18181b;
      letter-spacing: -0.025em;
      margin-bottom: 0.25rem;
    }
    .form-subtitle { font-size: 0.875rem; color: #a1a1aa; }

    /* Role selector */
    .role-selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.6rem;
      margin-bottom: 1.25rem;
    }
    .role-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.875rem 0.75rem;
      border: 1.5px solid #e4e4e7;
      border-radius: 12px;
      background: #fff;
      cursor: pointer;
      text-align: center;
      transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
      font-family: inherit;
    }
    .role-btn:hover {
      border-color: #a1a1aa;
      background: #fafafa;
    }
    .role-btn--active {
      border-color: #18181b;
      background: #fff;
      box-shadow: 0 0 0 3px rgba(24,24,27,0.08);
    }
    .role-icon-svg {
      color: #71717a;
      margin-bottom: 0.1rem;
    }
    .role-btn--active .role-icon-svg { color: #18181b; }
    .role-label {
      font-size: 0.84rem;
      font-weight: 600;
      color: #18181b;
    }
    .role-desc { font-size: 0.7rem; color: #a1a1aa; }

    /* Form fields */
    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.6rem;
    }
    .field-group { margin-bottom: 0.875rem; }
    .field-label {
      display: block;
      font-size: 0.78rem;
      font-weight: 600;
      color: #3f3f46;
      margin-bottom: 0.35rem;
    }
    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-icon {
      position: absolute;
      left: 0.85rem;
      color: #a1a1aa;
      pointer-events: none;
      transition: color 0.15s;
    }
    .field-input {
      width: 100%;
      padding: 0.68rem 0.875rem;
      border: 1.5px solid #e4e4e7;
      border-radius: 10px;
      font-size: 0.9rem;
      color: #18181b;
      background: #fff;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      font-family: inherit;
    }
    .field-input::placeholder { color: #a1a1aa; }
    .field-input:focus {
      border-color: #18181b;
      box-shadow: 0 0 0 3px rgba(24,24,27,0.08);
    }
    .input-wrap:focus-within .input-icon { color: #52525b; }
    .field-input--icon { padding-left: 2.3rem; }
    .field-input--pw  { padding-right: 4rem; }

    .pw-toggle {
      position: absolute;
      right: 0.75rem;
      background: none;
      border: none;
      cursor: pointer;
      color: #71717a;
      font-size: 0.73rem;
      font-weight: 600;
      padding: 0.2rem 0.35rem;
      border-radius: 5px;
      transition: background 0.12s, color 0.12s;
      font-family: inherit;
      letter-spacing: 0.02em;
    }
    .pw-toggle:hover { background: rgba(0,0,0,0.05); color: #18181b; }

    /* Worker section */
    .worker-section {
      background: #f4faf9;
      border: 1.5px solid #ccede8;
      border-radius: 12px;
      padding: 1rem 1rem 0.25rem;
      margin-bottom: 0.875rem;
    }
    .worker-section-header {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 0.875rem;
      color: #0f766e;
    }
    .worker-section-title {
      font-size: 0.7rem;
      font-weight: 700;
      color: #0f766e;
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }
    .worker-section .field-group { margin-bottom: 0.7rem; }
    .worker-section .field-input { background: #fff; }

    /* Fee notice */
    .fee-notice {
      display: flex; align-items: flex-start; gap: 0.5rem;
      background: #eff6ff; border: 1px solid #bfdbfe;
      color: #1e40af; border-radius: 8px;
      padding: 0.65rem 0.875rem; font-size: 0.78rem; line-height: 1.55;
      margin-bottom: 0.75rem;
    }
    .fee-notice svg { flex-shrink: 0; margin-top: 1px; }

    /* ToS checkbox */
    .tos-label {
      display: flex; align-items: flex-start; gap: 0.6rem;
      font-size: 0.8rem; color: #52525b; line-height: 1.55;
      margin-bottom: 0.875rem; cursor: pointer;
    }
    .tos-check {
      flex-shrink: 0; width: 15px; height: 15px;
      margin-top: 2px; cursor: pointer; accent-color: #18181b;
    }
    .tos-link {
      color: #18181b; font-weight: 600; text-decoration: underline;
    }
    .tos-link:hover { color: #3f3f46; }

    /* Error */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 0.6rem 0.875rem;
      border-radius: 8px;
      font-size: 0.83rem;
      margin-bottom: 0.875rem;
    }
    .error-icon {
      flex-shrink: 0;
      width: 17px;
      height: 17px;
      background: #fca5a5;
      color: #7f1d1d;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.68rem;
      font-weight: 900;
    }

    /* Submit */
    .btn-submit {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: #18181b;
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 0.8rem 1.5rem;
      font-size: 0.93rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      font-family: inherit;
      margin-top: 0.25rem;
    }
    .btn-submit:hover:not(:disabled) { background: #27272a; }
    .btn-submit:disabled { opacity: 0.45; cursor: not-allowed; }

    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .switch-link {
      text-align: center;
      margin-top: 1.1rem;
      font-size: 0.84rem;
      color: #71717a;
    }
    .switch-link-a {
      color: #18181b;
      font-weight: 600;
      text-decoration: none;
    }
    .switch-link-a:hover { text-decoration: underline; }

    @media (max-width: 768px) {
      .split-root { flex-direction: column; }
      .left-panel  { display: none; }
      .right-panel { width: 100%; min-height: 100vh; padding: 2rem 1.5rem; background: #fff; }
      .mobile-logo { display: flex; }
      .field-row   { grid-template-columns: 1fr; }
    }
  `]
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  role = signal<Role>('CLIENT');
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  city = 'Vienna';
  address = '';
  hourlyRate: number | null = null;
  skillsText = '';
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);
  termsAccepted = false;

  canSubmit() {
    return this.firstName && this.lastName && this.email && this.password.length >= 8 && this.termsAccepted;
  }

  submit() {
    if (!this.canSubmit()) return;
    this.loading.set(true);
    this.error.set(null);

    const data: Record<string, unknown> = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      password: this.password,
      role: this.role(),
    };

    if (this.role() === 'WORKER') {
      data['city'] = this.city || 'Vienna';
      data['address'] = this.address;
      data['hourlyRate'] = this.hourlyRate;
      // Default Vienna coordinates — in production we'd geocode the address
      data['latitude'] = 48.2082;
      data['longitude'] = 16.3738;
    }

    this.auth.register(data).subscribe({
      next: (res) => {
        const role = (res as { role: string }).role;
        // Workers go to profile to complete setup, clients to their dashboard
        this.router.navigate([role === 'WORKER' ? '/worker/profile' : '/dashboard/client']);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Something went wrong. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
