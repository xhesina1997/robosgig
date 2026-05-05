import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
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
            Find trusted<br>professionals<br>
            <span class="left-headline-accent">instantly.</span>
          </h1>
          <p class="left-sub">
            Connect with verified local experts — from plumbers to
            electricians — in minutes, not days.
          </p>

          <ul class="left-features">
            <li class="left-feature-item">
              <span class="left-check">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <div>
                <span class="left-feature-title">AI-powered matching</span>
                <span class="left-feature-desc">Smart recommendations based on location &amp; skills</span>
              </div>
            </li>
            <li class="left-feature-item">
              <span class="left-check">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <div>
                <span class="left-feature-title">Verified workers</span>
                <span class="left-feature-desc">Every professional is background-checked</span>
              </div>
            </li>
            <li class="left-feature-item">
              <span class="left-check">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <div>
                <span class="left-feature-title">Real-time booking</span>
                <span class="left-feature-desc">Confirm and schedule in one tap</span>
              </div>
            </li>
          </ul>

          <div class="left-proof">
            <div class="proof-avatars">
              <div class="proof-avatar">H</div>
              <div class="proof-avatar">A</div>
              <div class="proof-avatar">S</div>
            </div>
            <span class="proof-text">2 400+ professionals ready to help</span>
          </div>

        </div>
      </div>

      <!-- ── RIGHT PANEL ── -->
      <div class="right-panel">
        <div class="form-wrap">

          <div class="mobile-logo">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect width="22" height="22" rx="6" fill="#18181b"/>
              <path d="M12.5 4L7 12h5l-1.5 6L17 10h-5l1.5-6z" fill="white"/>
            </svg>
            <span class="mobile-logo-text">RobosGig</span>
          </div>

          <div class="form-heading">
            <h2 class="form-title">Welcome back</h2>
            <p class="form-subtitle">Sign in to your account to continue</p>
          </div>

          <form (ngSubmit)="submit()" #f="ngForm">

            <div class="field-group">
              <label class="field-label">Email address</label>
              <div class="input-wrap">
                <svg class="input-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
                <input class="field-input" type="email" [(ngModel)]="email" name="email" placeholder="you@example.com" required autocomplete="email"/>
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">Password</label>
              <div class="input-wrap">
                <svg class="input-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <input class="field-input field-input--pw" [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" name="password" placeholder="••••••••" required autocomplete="current-password"/>
                <button type="button" class="pw-toggle" (click)="showPassword.set(!showPassword())">
                  @if (showPassword()) { Hide } @else { Show }
                </button>
              </div>
            </div>

            @if (error()) {
              <div class="error-banner">
                <span class="error-icon">!</span>
                {{ error() }}
              </div>
            }

            <button type="submit" class="btn-submit" [disabled]="loading() || !email || !password">
              @if (loading()) {
                <span class="spinner"></span>
                Signing in…
              } @else {
                Sign in →
              }
            </button>

          </form>

          <div class="social-divider">
            <span class="social-divider-line"></span>
            <span class="social-divider-text">or continue with</span>
            <span class="social-divider-line"></span>
          </div>

          <button type="button" class="btn-google" (click)="loginWithGoogle()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p class="switch-link">
            Don't have an account?
            <a routerLink="/register" class="switch-link-a">Create one for free</a>
          </p>

          <div class="demo-section">
            <div class="demo-divider">
              <span class="demo-divider-line"></span>
              <span class="demo-divider-text">Try a demo account</span>
              <span class="demo-divider-line"></span>
            </div>
            <div class="demo-grid">
              <button class="demo-card" (click)="loginAs('hans@example.com')">
                <div class="demo-avatar demo-avatar--blue">H</div>
                <span class="demo-card-name">Hans</span>
                <span class="demo-card-role">Plumber</span>
              </button>
              <button class="demo-card" (click)="loginAs('anna@example.com')">
                <div class="demo-avatar demo-avatar--teal">A</div>
                <span class="demo-card-name">Anna</span>
                <span class="demo-card-role">Cleaner</span>
              </button>
              <button class="demo-card" (click)="loginAs('stefan@example.com')">
                <div class="demo-avatar demo-avatar--dark">S</div>
                <span class="demo-card-name">Stefan</span>
                <span class="demo-card-role">Electrician</span>
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .split-root { display: flex; min-height: 100vh; width: 100%; }

    /* ── Left panel ─────────────────────────────────────────── */
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
    .left-content { position: relative; z-index: 1; max-width: 400px; width: 100%; }

    .left-logo { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 2.25rem; }
    .left-logo-text { font-size: 1.15rem; font-weight: 700; color: #fff; letter-spacing: -0.02em; }

    .left-headline {
      font-size: clamp(1.9rem, 2.7vw, 2.8rem);
      font-weight: 800;
      line-height: 1.18;
      color: rgba(255,255,255,0.97);
      letter-spacing: -0.03em;
      margin-bottom: 0.875rem;
    }
    .left-headline-accent { color: #5eead4; }
    .left-sub { font-size: 0.93rem; color: rgba(255,255,255,0.6); line-height: 1.65; margin-bottom: 2rem; }

    .left-features { list-style: none; display: flex; flex-direction: column; gap: 0.9rem; margin-bottom: 2.25rem; }
    .left-feature-item { display: flex; align-items: flex-start; gap: 0.75rem; }
    .left-check {
      flex-shrink: 0;
      width: 20px; height: 20px;
      background: rgba(94,234,212,0.15);
      border: 1px solid rgba(94,234,212,0.35);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin-top: 1px;
    }
    .left-feature-title { display: block; font-size: 0.875rem; font-weight: 600; color: rgba(255,255,255,0.92); }
    .left-feature-desc  { display: block; font-size: 0.76rem; color: rgba(255,255,255,0.48); margin-top: 1px; }

    .left-proof {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 99px;
      padding: 0.45rem 1rem 0.45rem 0.45rem;
      width: fit-content;
    }
    .proof-avatars { display: flex; }
    .proof-avatar {
      width: 26px; height: 26px;
      border-radius: 50%;
      background: rgba(255,255,255,0.15);
      border: 2px solid rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.65rem; font-weight: 700; color: #fff;
      margin-right: -6px;
    }
    .proof-text { font-size: 0.78rem; color: rgba(255,255,255,0.75); font-weight: 500; white-space: nowrap; padding-left: 0.5rem; }

    /* ── Right panel ────────────────────────────────────────── */
    .right-panel {
      width: 50%;
      background: #f8f8f8;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 2.5rem;
      overflow-y: auto;
    }
    .form-wrap {
      width: 100%;
      max-width: 400px;
      animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .mobile-logo { display: none; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; }
    .mobile-logo-text { font-size: 1rem; font-weight: 700; color: #18181b; }

    .form-heading { margin-bottom: 1.75rem; }
    .form-title { font-size: 1.5rem; font-weight: 700; color: #18181b; letter-spacing: -0.025em; margin-bottom: 0.25rem; }
    .form-subtitle { font-size: 0.875rem; color: #a1a1aa; }

    .field-group { margin-bottom: 1rem; }
    .field-label { display: block; font-size: 0.78rem; font-weight: 600; color: #3f3f46; margin-bottom: 0.35rem; }
    .input-wrap { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 0.875rem; color: #a1a1aa; pointer-events: none; transition: color 0.15s; }
    .field-input {
      width: 100%;
      padding: 0.72rem 1rem 0.72rem 2.5rem;
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
    .field-input:focus { border-color: #18181b; box-shadow: 0 0 0 3px rgba(24,24,27,0.08); }
    .input-wrap:focus-within .input-icon { color: #52525b; }
    .field-input--pw { padding-right: 4rem; }

    .pw-toggle {
      position: absolute; right: 0.75rem;
      background: none; border: none; cursor: pointer;
      color: #71717a; font-size: 0.73rem; font-weight: 600;
      padding: 0.2rem 0.35rem; border-radius: 5px;
      transition: background 0.12s, color 0.12s;
      font-family: inherit; letter-spacing: 0.02em;
    }
    .pw-toggle:hover { background: rgba(0,0,0,0.05); color: #18181b; }

    .error-banner {
      display: flex; align-items: center; gap: 0.5rem;
      background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
      padding: 0.6rem 0.875rem; border-radius: 8px; font-size: 0.83rem; margin-bottom: 0.875rem;
    }
    .error-icon {
      flex-shrink: 0; width: 17px; height: 17px;
      background: #fca5a5; color: #7f1d1d; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.68rem; font-weight: 900;
    }

    .btn-submit {
      width: 100%;
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      background: #18181b; color: #fff;
      border: none; border-radius: 10px;
      padding: 0.8rem 1.5rem;
      font-size: 0.93rem; font-weight: 600;
      cursor: pointer; transition: background 0.15s;
      font-family: inherit; margin-top: 0.25rem;
    }
    .btn-submit:hover:not(:disabled) { background: #27272a; }
    .btn-submit:disabled { opacity: 0.45; cursor: not-allowed; }

    .spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .switch-link { text-align: center; margin-top: 1.1rem; font-size: 0.84rem; color: #71717a; }
    .switch-link-a { color: #18181b; font-weight: 600; text-decoration: none; }
    .switch-link-a:hover { text-decoration: underline; }

    /* Social auth */
    .social-divider { display: flex; align-items: center; gap: 0.75rem; margin: 1.1rem 0 0.875rem; }
    .social-divider-line { flex: 1; height: 1px; background: #e4e4e7; }
    .social-divider-text { font-size: 0.7rem; color: #a1a1aa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; white-space: nowrap; }

    .btn-google {
      width: 100%;
      display: flex; align-items: center; justify-content: center; gap: 0.625rem;
      background: #fff; color: #18181b;
      border: 1.5px solid #e4e4e7; border-radius: 10px;
      padding: 0.75rem 1.5rem;
      font-size: 0.9rem; font-weight: 600;
      cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s;
      font-family: inherit; margin-bottom: 0.25rem;
    }
    .btn-google:hover { border-color: #a1a1aa; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }

    /* Demo section */
    .demo-section { margin-top: 1.5rem; }
    .demo-divider { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.875rem; }
    .demo-divider-line { flex: 1; height: 1px; background: #e4e4e7; }
    .demo-divider-text {
      font-size: 0.7rem; color: #a1a1aa; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.07em; white-space: nowrap;
    }
    .demo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; }
    .demo-card {
      display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
      padding: 0.75rem 0.5rem;
      background: #fff; border: 1.5px solid #e4e4e7; border-radius: 10px;
      cursor: pointer; font-family: inherit;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .demo-card:hover { border-color: #a1a1aa; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
    .demo-avatar {
      width: 36px; height: 36px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700; color: #fff;
    }
    .demo-avatar--blue { background: #2563eb; }
    .demo-avatar--teal { background: #0d9488; }
    .demo-avatar--dark { background: #18181b; }
    .demo-card-name { font-size: 0.8rem; font-weight: 600; color: #18181b; }
    .demo-card-role  { font-size: 0.7rem; color: #a1a1aa; }

    @media (max-width: 768px) {
      .split-root { flex-direction: column; }
      .left-panel { display: none; }
      .right-panel { width: 100%; min-height: 100vh; padding: 2rem 1.5rem; background: #fff; align-items: flex-start; }
      .mobile-logo { display: flex; }
    }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  submit() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        const role = (res as { role: string }).role;
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else {
          if (role === 'ADMIN') this.router.navigate(['/admin/dashboard']);
          else this.router.navigate([role === 'WORKER' ? '/dashboard/worker' : '/dashboard/client']);
        }
      },
      error: (err) => {
        const msg = err?.error?.message ?? '';
        try {
          const parsed = JSON.parse(msg);
          if (parsed.requiresVerification) {
            this.router.navigate(['/register'], { queryParams: { verify: parsed.email } });
            return;
          }
        } catch { /* not JSON */ }
        this.error.set(msg || 'Invalid email or password');
        this.loading.set(false);
      },
    });
  }

  loginAs(email: string) {
    this.email = email;
    this.password = 'Password123';
    this.submit();
  }

  loginWithGoogle() {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }
}
