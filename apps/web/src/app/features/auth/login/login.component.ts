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
    <div class="auth-page">
      <div class="auth-split">

        <!-- ── LEFT · story panel ─────────────── -->
        <aside class="auth-left">
          <div class="auth-left-bg"></div>
          <div class="auth-left-content">
            <span class="auth-badge">
              <span class="auth-badge-dot"></span>
              2 412 pros · ~12 min avg response
            </span>

            <h1 class="auth-hd">
              Find trusted help
              <em class="auth-hd-em">fast<span class="auth-hd-dot"></span></em>
            </h1>
            <p class="auth-sub">
              Verified plumbers, electricians, cleaners and more — booked in minutes, paid through escrow.
            </p>

            <div class="auth-ticks">
              <div class="auth-tick">
                <span class="auth-tick-ic auth-tick-ic--lime">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3z"/><path d="m9 12 2 2 4-4"/></svg>
                </span>
                <div>
                  <div class="auth-tick-t">ID-verified workers</div>
                  <div class="auth-tick-s">Government ID, payment account and address confirmed before they can apply.</div>
                </div>
              </div>
              <div class="auth-tick">
                <span class="auth-tick-ic">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/></svg>
                </span>
                <div>
                  <div class="auth-tick-t">Escrow payments</div>
                  <div class="auth-tick-s">Your money is held safe until you confirm the job is done. Refund any time before.</div>
                </div>
              </div>
              <div class="auth-tick">
                <span class="auth-tick-ic">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5l3 2"/></svg>
                </span>
                <div>
                  <div class="auth-tick-t">Fast matching</div>
                  <div class="auth-tick-s">Most clients get an offer within 12 minutes. No quotes, no chasing.</div>
                </div>
              </div>
            </div>

            <div class="auth-teaser">
              <div class="auth-stack">
                <span class="auth-av" style="background:#3B82F6">H</span>
                <span class="auth-av" style="background:#10B981">A</span>
                <span class="auth-av" style="background:#0A0A0A">S</span>
                <span class="auth-av" style="background:#F59E0B">M</span>
              </div>
              <div class="auth-teaser-meta">
                <b class="auth-teaser-b">4.8 ★ · 1 240 reviews this month</b>
                <span class="auth-teaser-s">Trusted by clients across Tirana, Vienna, Berlin</span>
              </div>
            </div>
          </div>
        </aside>

        <!-- ── RIGHT · form ───────────────────── -->
        <main class="auth-right">
          <form class="auth-form" (ngSubmit)="submit()">

            <h2 class="auth-form-h">Welcome back.</h2>
            <p class="auth-form-sub">
              New here?
              <a routerLink="/register" class="auth-link-ink">Create a free account →</a>
            </p>

            <div class="auth-field">
              <label class="auth-field-lbl">Email</label>
              <div class="auth-input-wrap">
                <span class="auth-input-ic">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
                </span>
                <input class="auth-input" type="email" [(ngModel)]="email" name="email" placeholder="you@email.com" required autocomplete="email"/>
              </div>
            </div>

            <div class="auth-field">
              <label class="auth-field-lbl">Password</label>
              <div class="auth-input-wrap">
                <span class="auth-input-ic">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
                </span>
                <input class="auth-input auth-input--pw" [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" name="password" placeholder="••••••••" required autocomplete="current-password"/>
                <button type="button" class="auth-right-act" (click)="showPassword.set(!showPassword())">
                  @if (showPassword()) { Hide } @else { Show }
                </button>
              </div>
            </div>

            <div class="auth-meta-row">
              <label class="auth-check-label">
                <input type="checkbox" [(ngModel)]="keepSignedIn" name="keepSignedIn" class="auth-check-input"/>
                <span class="auth-check-box" [class.auth-check-box--on]="keepSignedIn">
                  @if (keepSignedIn) {
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                  }
                </span>
                Keep me signed in
              </label>
              <a href="#" class="auth-forgot" (click)="$event.preventDefault()">Forgot password?</a>
            </div>

            @if (error()) {
              <div class="auth-err">
                <span class="auth-err-ic">!</span>
                {{ error() }}
              </div>
            }

            <button type="submit" class="auth-cta" [disabled]="loading() || !email || !password">
              <span class="auth-cta-pip"></span>
              @if (loading()) {
                <span class="auth-spin"></span> Signing in…
              } @else {
                Sign in
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              }
            </button>

            <div class="auth-divider">
              <span class="auth-divider-line"></span>
              or continue with
              <span class="auth-divider-line"></span>
            </div>

            <div class="auth-oauth-row">
              <button type="button" class="auth-oauth" (click)="loginWithGoogle()">
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 11v3.4h4.7c-.2 1.3-1.5 3.8-4.7 3.8a5.2 5.2 0 1 1 0-10.4c1.7 0 2.8.7 3.4 1.3l2.3-2.3C16.3 5.4 14.3 4.5 12 4.5a7.5 7.5 0 1 0 0 15c4.3 0 7.2-3 7.2-7.3 0-.5 0-.8-.1-1.2H12z"/></svg>
                Google
              </button>
              <button type="button" class="auth-oauth" disabled>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 12.5c0-2.7 2.2-4 2.3-4.1-1.3-1.8-3.2-2.1-3.9-2.1-1.7-.2-3.2 1-4 1-.9 0-2.1-1-3.5-1-1.8 0-3.5 1-4.4 2.7-1.9 3.3-.5 8.1 1.3 10.7.9 1.3 2 2.7 3.4 2.6 1.4-.1 1.9-.9 3.5-.9s2.1.9 3.5.9c1.5 0 2.4-1.3 3.3-2.6 1-1.5 1.5-3 1.5-3.1-.1 0-2.9-1.1-3-4.1zM14.7 4.6c.7-.9 1.2-2.2 1.1-3.4-1.1.1-2.4.7-3.2 1.6-.7.8-1.3 2.1-1.1 3.3 1.2.1 2.5-.6 3.2-1.5z"/></svg>
                Apple
              </button>
            </div>

            <div class="auth-demos-lbl">Or try a demo account</div>
            <div class="auth-demos">
              <button type="button" class="auth-demo" (click)="loginAs('hans@example.com')">
                <span class="auth-demo-av" style="background:#3B82F6">H</span>
                <span class="auth-demo-text">
                  <span class="auth-demo-nm">Hans</span>
                  <span class="auth-demo-rl">plumber</span>
                </span>
              </button>
              <button type="button" class="auth-demo" (click)="loginAs('anna@example.com')">
                <span class="auth-demo-av" style="background:#10B981">A</span>
                <span class="auth-demo-text">
                  <span class="auth-demo-nm">Anna</span>
                  <span class="auth-demo-rl">cleaner</span>
                </span>
              </button>
              <button type="button" class="auth-demo" (click)="loginAs('stefan@example.com')">
                <span class="auth-demo-av" style="background:#0A0A0A">S</span>
                <span class="auth-demo-text">
                  <span class="auth-demo-nm">Stefan</span>
                  <span class="auth-demo-rl">electrician</span>
                </span>
              </button>
            </div>

            <div class="auth-footnote">
              By continuing you accept our
              <a routerLink="/terms" class="auth-link-ink">Terms</a>
              and
              <a routerLink="/terms" class="auth-link-ink">Privacy</a>.
            </div>

          </form>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --auth-bg: #FAFAFA;
      --auth-panel: #FFFFFF;
      --auth-ink: #0A0A0A;
      --auth-muted: #737373;
      --auth-sub: #A3A3A3;
      --auth-rule: #E8E8E5;
      --auth-accent: #84CC16;
      --auth-accent-text: #4D7C0F;
      --auth-accent-bg: #F0FAE0;
      --auth-soft: #F5F5F3;
      --auth-positive: #15803D;
      --auth-font: 'Geist', 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      --auth-mono: 'Geist Mono', 'JetBrains Mono', ui-monospace, monospace;
    }
    * { box-sizing: border-box; }

    .auth-page {
      min-height: calc(100vh - 56px);
      background: var(--auth-bg);
      color: var(--auth-ink);
      font-family: var(--auth-font);
      -webkit-font-smoothing: antialiased;
      display: flex;
      flex-direction: column;
    }
    .auth-split {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 0;
    }

    /* ── Left story panel ──────────────────── */
    .auth-left {
      position: relative;
      padding: 56px 64px 40px;
      overflow: hidden;
      background: linear-gradient(180deg, #FBFBF8 0%, #F5F5F1 100%);
      border-right: 1px solid var(--auth-rule);
      display: flex;
      flex-direction: column;
    }
    .auth-left-bg {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(10,10,10,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(10,10,10,0.04) 1px, transparent 1px);
      background-size: 32px 32px;
      mask-image: radial-gradient(ellipse 90% 70% at 30% 40%, #000, transparent 80%);
      -webkit-mask-image: radial-gradient(ellipse 90% 70% at 30% 40%, #000, transparent 80%);
      pointer-events: none;
    }
    .auth-left-content {
      position: relative;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .auth-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: var(--auth-panel);
      border: 1px solid var(--auth-rule);
      border-radius: 999px;
      font-size: 11.5px;
      color: var(--auth-muted);
      font-family: var(--auth-mono);
      align-self: flex-start;
    }
    .auth-badge-dot {
      width: 5px; height: 5px; border-radius: 3px;
      background: var(--auth-accent);
      box-shadow: 0 0 6px var(--auth-accent);
    }

    .auth-hd {
      margin: 32px 0 0;
      font-size: 60px;
      font-weight: 600;
      letter-spacing: -0.04em;
      line-height: 1.02;
      max-width: 14ch;
    }
    .auth-hd-em {
      font-style: normal;
      color: var(--auth-accent-text);
      display: inline-flex;
      align-items: flex-end;
      gap: 6px;
    }
    .auth-hd-dot {
      display: inline-block;
      width: 14px; height: 14px;
      border-radius: 8px;
      background: var(--auth-accent);
      margin-bottom: 6px;
    }
    .auth-sub {
      margin: 18px 0 0;
      font-size: 15.5px;
      color: var(--auth-muted);
      line-height: 1.55;
      max-width: 42ch;
    }

    .auth-ticks {
      margin-top: 36px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .auth-tick { display: flex; gap: 14px; align-items: flex-start; }
    .auth-tick-ic {
      flex-shrink: 0;
      width: 32px; height: 32px;
      border-radius: 10px;
      background: var(--auth-panel);
      border: 1px solid var(--auth-rule);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--auth-ink);
    }
    .auth-tick-ic--lime {
      background: var(--auth-accent-bg);
      border-color: #D6EAA0;
      color: var(--auth-accent-text);
    }
    .auth-tick-t { font-size: 14px; font-weight: 500; color: var(--auth-ink); line-height: 1.3; }
    .auth-tick-s { font-size: 12.5px; color: var(--auth-muted); margin-top: 3px; line-height: 1.4; }

    .auth-teaser {
      margin-top: auto;
      padding-top: 32px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .auth-stack { display: flex; }
    .auth-av {
      width: 30px; height: 30px;
      border-radius: 999px;
      border: 2px solid #FBFBF8;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.02em;
      margin-left: -8px;
    }
    .auth-av:first-child { margin-left: 0; }
    .auth-teaser-meta { font-size: 13px; color: var(--auth-ink); }
    .auth-teaser-b { font-family: var(--auth-mono); font-weight: 500; }
    .auth-teaser-s { display: block; font-size: 11px; color: var(--auth-muted); margin-top: 2px; }

    /* ── Right form ────────────────────────── */
    .auth-right {
      padding: 32px 64px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      overflow-y: auto;
    }
    .auth-form {
      width: 100%;
      max-width: 420px;
      padding-top: 28px;
    }

    .auth-form-h {
      font-size: 28px;
      font-weight: 600;
      letter-spacing: -0.025em;
      line-height: 1.1;
      margin: 0;
      color: var(--auth-ink);
    }
    .auth-form-sub {
      margin: 8px 0 0;
      font-size: 14px;
      color: var(--auth-muted);
      line-height: 1.5;
    }
    .auth-link-ink {
      color: var(--auth-ink);
      font-weight: 500;
      text-decoration: none;
      border-bottom: 1px solid var(--auth-ink);
    }

    .auth-field { margin-top: 18px; display: flex; flex-direction: column; gap: 6px; }
    .auth-field-lbl { font-size: 12px; color: var(--auth-muted); letter-spacing: 0.01em; }
    .auth-input-wrap { position: relative; }
    .auth-input-ic {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--auth-sub);
      display: inline-flex;
    }
    .auth-input {
      width: 100%;
      padding: 13px 14px 13px 42px;
      border-radius: 12px;
      border: 1px solid var(--auth-rule);
      background: var(--auth-panel);
      font-family: var(--auth-font);
      font-size: 14px;
      color: var(--auth-ink);
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .auth-input::placeholder { color: var(--auth-sub); }
    .auth-input:focus {
      border-color: var(--auth-ink);
      box-shadow: 0 0 0 4px rgba(10,10,10,0.06);
    }
    .auth-input--pw { padding-right: 58px; }
    .auth-right-act {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 11.5px;
      color: var(--auth-muted);
      background: transparent;
      border: none;
      padding: 6px 10px;
      border-radius: 8px;
      cursor: pointer;
      font-family: var(--auth-font);
    }
    .auth-right-act:hover { background: var(--auth-soft); color: var(--auth-ink); }

    .auth-meta-row {
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .auth-check-label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 12.5px;
      color: var(--auth-muted);
      cursor: pointer;
    }
    .auth-check-input { display: none; }
    .auth-check-box {
      width: 15px; height: 15px;
      border-radius: 4px;
      border: 1.5px solid var(--auth-rule);
      background: var(--auth-panel);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: transparent;
      transition: 0.12s;
    }
    .auth-check-box--on {
      background: var(--auth-accent);
      border-color: var(--auth-accent);
      color: var(--auth-ink);
    }
    .auth-forgot {
      font-size: 12.5px;
      color: var(--auth-ink);
      font-weight: 500;
      text-decoration: none;
    }

    .auth-err {
      margin-top: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      color: #B91C1C;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 13px;
    }
    .auth-err-ic {
      flex-shrink: 0;
      width: 17px; height: 17px;
      background: #FCA5A5;
      color: #7F1D1D;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 900;
    }

    .auth-cta {
      margin-top: 20px;
      width: 100%;
      padding: 14px 18px;
      border-radius: 12px;
      background: var(--auth-ink);
      color: #fff;
      border: none;
      font-family: var(--auth-font);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      position: relative;
      overflow: hidden;
      transition: transform 0.12s;
    }
    .auth-cta:hover:not(:disabled) { background: #1F1F1F; }
    .auth-cta:disabled { opacity: 0.5; cursor: not-allowed; }
    .auth-cta-pip {
      position: absolute;
      left: 14px;
      top: 50%;
      width: 6px; height: 6px;
      border-radius: 4px;
      background: var(--auth-accent);
      transform: translateY(-50%);
      box-shadow: 0 0 8px var(--auth-accent);
    }
    .auth-spin {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: auth-spin 0.7s linear infinite;
    }
    @keyframes auth-spin { to { transform: rotate(360deg); } }

    .auth-divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 22px 0 16px;
      color: var(--auth-sub);
      font-size: 10.5px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }
    .auth-divider-line { flex: 1; height: 1px; background: var(--auth-rule); }

    .auth-oauth-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .auth-oauth {
      padding: 12px 18px;
      border-radius: 12px;
      background: var(--auth-panel);
      border: 1px solid var(--auth-rule);
      color: var(--auth-ink);
      font-family: var(--auth-font);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: 0.12s;
    }
    .auth-oauth:hover:not(:disabled) { border-color: var(--auth-sub); box-shadow: 0 2px 8px rgba(10,10,10,0.06); }
    .auth-oauth:disabled { opacity: 0.5; cursor: not-allowed; }

    .auth-demos-lbl {
      margin-top: 32px;
      font-size: 10.5px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--auth-muted);
      font-weight: 500;
      text-align: center;
    }
    .auth-demos {
      margin-top: 12px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .auth-demo {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      padding: 12px;
      border-radius: 12px;
      background: var(--auth-panel);
      border: 1px solid var(--auth-rule);
      cursor: pointer;
      text-align: left;
      font-family: var(--auth-font);
      transition: 0.12s;
    }
    .auth-demo:hover { border-color: var(--auth-sub); box-shadow: 0 2px 8px rgba(10,10,10,0.06); }
    .auth-demo-av {
      width: 32px; height: 32px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 13px;
      font-weight: 600;
    }
    .auth-demo-text { display: flex; flex-direction: column; }
    .auth-demo-nm { font-size: 13px; font-weight: 500; color: var(--auth-ink); line-height: 1.1; }
    .auth-demo-rl { font-size: 11px; color: var(--auth-muted); font-family: var(--auth-mono); margin-top: 2px; }

    .auth-footnote {
      margin-top: 24px;
      font-size: 12px;
      color: var(--auth-muted);
      line-height: 1.55;
      text-align: center;
    }

    @media (max-width: 960px) {
      .auth-split { grid-template-columns: 1fr; }
      .auth-left { display: none; }
      .auth-right { padding: 32px 24px; }
    }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  keepSignedIn = true;
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
