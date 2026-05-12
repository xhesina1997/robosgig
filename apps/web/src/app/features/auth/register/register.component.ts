import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

type Role = 'CLIENT' | 'WORKER';

@Component({
  selector: 'app-register',
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
              Join RobosGig
              <em class="auth-hd-em">today<span class="auth-hd-dot"></span></em>
            </h1>
            <p class="auth-sub">
              A free account lets you post jobs, save pros, message instantly, and pay through escrow.
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

            <!-- Role toggle -->
            <div class="auth-role-toggle">
              <button
                type="button"
                class="auth-role-btn"
                [class.auth-role-btn--on]="role() === 'CLIENT'"
                (click)="role.set('CLIENT')"
              >
                <span class="auth-role-ic" [class.auth-role-ic--on]="role() === 'CLIENT'">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12 12 4l9 8M5 10v10h14V10"/></svg>
                </span>
                I need help
              </button>
              <button
                type="button"
                class="auth-role-btn"
                [class.auth-role-btn--on]="role() === 'WORKER'"
                (click)="role.set('WORKER')"
              >
                <span class="auth-role-ic" [class.auth-role-ic--on]="role() === 'WORKER'">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 7h6v6M6 17H2v-6M14 7 2 19M20 13l-6 6"/></svg>
                </span>
                I'm a pro
              </button>
            </div>

            <h2 class="auth-form-h">Create your account.</h2>
            <p class="auth-form-sub">
              Already have one?
              <a routerLink="/login" class="auth-link-ink">Sign in →</a>
            </p>

            <div class="auth-grid2">
              <div class="auth-field">
                <label class="auth-field-lbl">First name</label>
                <div class="auth-input-wrap">
                  <span class="auth-input-ic">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>
                  </span>
                  <input class="auth-input" [(ngModel)]="firstName" name="firstName" placeholder="Maria" required/>
                </div>
              </div>
              <div class="auth-field">
                <label class="auth-field-lbl">Last name</label>
                <div class="auth-input-wrap">
                  <span class="auth-input-ic">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>
                  </span>
                  <input class="auth-input" [(ngModel)]="lastName" name="lastName" placeholder="Muster" required/>
                </div>
              </div>
            </div>

            <div class="auth-field">
              <label class="auth-field-lbl">Email</label>
              <div class="auth-input-wrap">
                <span class="auth-input-ic">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
                </span>
                <input class="auth-input" type="email" [(ngModel)]="email" name="email" placeholder="you@email.com" required/>
              </div>
            </div>

            <div class="auth-field">
              <label class="auth-field-lbl">Password</label>
              <div class="auth-input-wrap">
                <span class="auth-input-ic">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
                </span>
                <input class="auth-input auth-input--pw" [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" name="password" placeholder="At least 8 characters" required/>
                <button type="button" class="auth-right-act" (click)="showPassword.set(!showPassword())">
                  @if (showPassword()) { Hide } @else { Show }
                </button>
              </div>
              <div class="auth-strength">
                <div class="auth-bars">
                  <span class="auth-bar" [class.auth-bar--on]="strength() >= 1"></span>
                  <span class="auth-bar" [class.auth-bar--on]="strength() >= 2"></span>
                  <span class="auth-bar" [class.auth-bar--on]="strength() >= 3"></span>
                  <span class="auth-bar" [class.auth-bar--on]="strength() >= 4"></span>
                </div>
                {{ strengthLabel() }}
              </div>
            </div>

            @if (role() === 'WORKER') {
              <div class="auth-worker-info">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <div>
                  <div class="auth-worker-info-t">You'll set up your work profile after signing up</div>
                  <div class="auth-worker-info-s">Add your location, profession, hourly rate, and skills — then you start appearing to nearby clients.</div>
                </div>
              </div>
            }

            <label class="auth-check-label auth-check-label--tos">
              <input type="checkbox" [(ngModel)]="termsAccepted" name="termsAccepted" class="auth-check-input"/>
              <span class="auth-check-box" [class.auth-check-box--on]="termsAccepted">
                @if (termsAccepted) {
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                }
              </span>
              <span>
                I agree to the
                <a routerLink="/terms" target="_blank" class="auth-link-ink">Terms</a>
                ·
                <a routerLink="/terms" target="_blank" class="auth-link-ink">Privacy</a>
              </span>
            </label>

            @if (error()) {
              <div class="auth-err">
                <span class="auth-err-ic">!</span>
                {{ error() }}
              </div>
            }

            <button type="submit" class="auth-cta" [disabled]="loading() || !canSubmit()">
              <span class="auth-cta-pip"></span>
              @if (loading()) {
                <span class="auth-spin"></span> Creating account…
              } @else {
                Create account
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              }
            </button>

            <div class="auth-divider">
              <span class="auth-divider-line"></span>
              or sign up with
              <span class="auth-divider-line"></span>
            </div>

            <div class="auth-oauth-row auth-oauth-row--single">
              <button type="button" class="auth-oauth" (click)="loginWithGoogle()">
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 11v3.4h4.7c-.2 1.3-1.5 3.8-4.7 3.8a5.2 5.2 0 1 1 0-10.4c1.7 0 2.8.7 3.4 1.3l2.3-2.3C16.3 5.4 14.3 4.5 12 4.5a7.5 7.5 0 1 0 0 15c4.3 0 7.2-3 7.2-7.3 0-.5 0-.8-.1-1.2H12z"/></svg>
                Continue with Google
              </button>
            </div>

            <div class="auth-footnote">
              Already have an account?
              <a routerLink="/login" class="auth-link-ink">Sign in</a>
            </div>

          </form>
        </main>
      </div>

      <!-- Email verification overlay -->
      @if (verificationStep()) {
        <div class="verify-overlay">
          <div class="verify-card">
            <div class="verify-icon">
              <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </div>
            <h2 class="verify-title">Check your email</h2>
            <p class="verify-sub">We sent a 6-digit code to <strong>{{ pendingEmail() }}</strong></p>

            @if (verifyError()) {
              <div class="verify-error">{{ verifyError() }}</div>
            }

            <div class="code-row">
              <input class="code-input" [(ngModel)]="verifyCode" placeholder="000000" maxlength="6" inputmode="numeric" (keyup.enter)="submitVerify()"/>
              <button class="btn-verify" [disabled]="verifyCode.length < 6 || verifying()" (click)="submitVerify()">
                @if (verifying()) { <span class="auth-spin"></span> } @else { Verify }
              </button>
            </div>

            <button class="resend-btn" [disabled]="resendCooldown() > 0" (click)="resendCode()">
              @if (resendCooldown() > 0) { Resend in {{ resendCooldown() }}s } @else { Resend code }
            </button>
          </div>
        </div>
      }
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
      position: relative;
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
    .auth-left-content { position: relative; display: flex; flex-direction: column; flex: 1; }

    .auth-badge {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 12px;
      background: var(--auth-panel);
      border: 1px solid var(--auth-rule);
      border-radius: 999px;
      font-size: 11.5px;
      color: var(--auth-muted);
      font-family: var(--auth-mono);
      align-self: flex-start;
    }
    .auth-badge-dot { width: 5px; height: 5px; border-radius: 3px; background: var(--auth-accent); box-shadow: 0 0 6px var(--auth-accent); }

    .auth-hd { margin: 32px 0 0; font-size: 60px; font-weight: 600; letter-spacing: -0.04em; line-height: 1.02; max-width: 14ch; }
    .auth-hd-em { font-style: normal; color: var(--auth-accent-text); display: inline-flex; align-items: flex-end; gap: 6px; }
    .auth-hd-dot { display: inline-block; width: 14px; height: 14px; border-radius: 8px; background: var(--auth-accent); margin-bottom: 6px; }
    .auth-sub { margin: 18px 0 0; font-size: 15.5px; color: var(--auth-muted); line-height: 1.55; max-width: 42ch; }

    .auth-ticks { margin-top: 36px; display: flex; flex-direction: column; gap: 18px; }
    .auth-tick { display: flex; gap: 14px; align-items: flex-start; }
    .auth-tick-ic { flex-shrink: 0; width: 32px; height: 32px; border-radius: 10px; background: var(--auth-panel); border: 1px solid var(--auth-rule); display: inline-flex; align-items: center; justify-content: center; color: var(--auth-ink); }
    .auth-tick-ic--lime { background: var(--auth-accent-bg); border-color: #D6EAA0; color: var(--auth-accent-text); }
    .auth-tick-t { font-size: 14px; font-weight: 500; color: var(--auth-ink); line-height: 1.3; }
    .auth-tick-s { font-size: 12.5px; color: var(--auth-muted); margin-top: 3px; line-height: 1.4; }

    .auth-teaser { margin-top: auto; padding-top: 32px; display: flex; align-items: center; gap: 12px; }
    .auth-stack { display: flex; }
    .auth-av { width: 30px; height: 30px; border-radius: 999px; border: 2px solid #FBFBF8; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 10px; font-weight: 600; letter-spacing: 0.02em; margin-left: -8px; }
    .auth-av:first-child { margin-left: 0; }
    .auth-teaser-meta { font-size: 13px; color: var(--auth-ink); }
    .auth-teaser-b { font-family: var(--auth-mono); font-weight: 500; }
    .auth-teaser-s { display: block; font-size: 11px; color: var(--auth-muted); margin-top: 2px; }

    /* ── Right form ────────────────────────── */
    .auth-right { padding: 32px 64px; display: flex; align-items: flex-start; justify-content: center; overflow-y: auto; }
    .auth-form { width: 100%; max-width: 420px; padding-top: 28px; }

    .auth-role-toggle {
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: var(--auth-soft);
      border-radius: 12px;
      padding: 4px;
      margin-bottom: 32px;
    }
    .auth-role-btn {
      padding: 9px 14px;
      border-radius: 9px;
      border: none;
      background: transparent;
      font-family: var(--auth-font);
      font-size: 13px;
      font-weight: 500;
      color: var(--auth-muted);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
    }
    .auth-role-btn--on {
      background: var(--auth-panel);
      color: var(--auth-ink);
      box-shadow: 0 1px 2px rgba(10,10,10,0.06), 0 0 0 1px var(--auth-rule);
    }
    .auth-role-ic { opacity: 0.6; display: inline-flex; }
    .auth-role-ic--on { opacity: 1; color: var(--auth-accent-text); }

    .auth-form-h { font-size: 28px; font-weight: 600; letter-spacing: -0.025em; line-height: 1.1; margin: 0; color: var(--auth-ink); }
    .auth-form-sub { margin: 8px 0 0; font-size: 14px; color: var(--auth-muted); line-height: 1.5; }
    .auth-link-ink { color: var(--auth-ink); font-weight: 500; text-decoration: none; border-bottom: 1px solid var(--auth-ink); }

    .auth-field { margin-top: 18px; display: flex; flex-direction: column; gap: 6px; }
    .auth-field-lbl { font-size: 12px; color: var(--auth-muted); letter-spacing: 0.01em; }
    .auth-input-wrap { position: relative; }
    .auth-input-ic { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--auth-sub); display: inline-flex; }
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
    .auth-input:focus { border-color: var(--auth-ink); box-shadow: 0 0 0 4px rgba(10,10,10,0.06); }
    .auth-input--pw { padding-right: 58px; }
    .auth-right-act {
      position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
      font-size: 11.5px; color: var(--auth-muted);
      background: transparent; border: none;
      padding: 6px 10px; border-radius: 8px;
      cursor: pointer; font-family: var(--auth-font);
    }
    .auth-right-act:hover { background: var(--auth-soft); color: var(--auth-ink); }

    .auth-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .auth-grid2 .auth-field { margin-top: 18px; }

    .auth-strength {
      margin-top: 8px;
      display: flex; align-items: center; gap: 8px;
      font-size: 11px; color: var(--auth-muted);
      font-family: var(--auth-mono);
    }
    .auth-bars { display: flex; gap: 3px; }
    .auth-bar { width: 24px; height: 4px; border-radius: 2px; background: var(--auth-rule); }
    .auth-bar--on { background: var(--auth-accent); }

    .auth-worker-info {
      margin-top: 14px;
      display: flex; gap: 10px; align-items: flex-start;
      padding: 12px 14px;
      border: 1px solid var(--auth-rule);
      background: var(--auth-soft);
      border-radius: 12px;
      color: var(--auth-muted);
    }
    .auth-worker-info-t { font-size: 12.5px; font-weight: 500; color: var(--auth-ink); }
    .auth-worker-info-s { font-size: 11.5px; color: var(--auth-muted); margin-top: 2px; line-height: 1.4; }

    .auth-check-label {
      display: inline-flex; align-items: center; gap: 8px;
      font-size: 12.5px; color: var(--auth-muted);
      cursor: pointer;
    }
    .auth-check-label--tos { margin-top: 14px; align-items: flex-start; line-height: 1.5; }
    .auth-check-input { display: none; }
    .auth-check-box {
      flex-shrink: 0;
      width: 15px; height: 15px;
      border-radius: 4px;
      border: 1.5px solid var(--auth-rule);
      background: var(--auth-panel);
      display: inline-flex; align-items: center; justify-content: center;
      color: transparent; transition: 0.12s;
      margin-top: 1px;
    }
    .auth-check-box--on { background: var(--auth-accent); border-color: var(--auth-accent); color: var(--auth-ink); }

    .auth-err {
      margin-top: 14px;
      display: flex; align-items: center; gap: 8px;
      background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C;
      padding: 10px 14px; border-radius: 10px; font-size: 13px;
    }
    .auth-err-ic {
      flex-shrink: 0; width: 17px; height: 17px;
      background: #FCA5A5; color: #7F1D1D;
      border-radius: 50%;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 900;
    }

    .auth-cta {
      margin-top: 20px;
      width: 100%;
      padding: 14px 18px;
      border-radius: 12px;
      background: var(--auth-ink); color: #fff;
      border: none;
      font-family: var(--auth-font);
      font-size: 14px; font-weight: 500;
      cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      position: relative; overflow: hidden;
      transition: transform 0.12s;
    }
    .auth-cta:hover:not(:disabled) { background: #1F1F1F; }
    .auth-cta:disabled { opacity: 0.5; cursor: not-allowed; }
    .auth-cta-pip {
      position: absolute; left: 14px; top: 50%;
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
      display: flex; align-items: center; gap: 12px;
      margin: 22px 0 16px;
      color: var(--auth-sub);
      font-size: 10.5px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }
    .auth-divider-line { flex: 1; height: 1px; background: var(--auth-rule); }

    .auth-oauth-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .auth-oauth-row--single { grid-template-columns: 1fr; }
    .auth-oauth {
      padding: 12px 18px;
      border-radius: 12px;
      background: var(--auth-panel);
      border: 1px solid var(--auth-rule);
      color: var(--auth-ink);
      font-family: var(--auth-font);
      font-size: 14px; font-weight: 500;
      cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center; gap: 10px;
      transition: 0.12s;
    }
    .auth-oauth:hover:not(:disabled) { border-color: var(--auth-sub); box-shadow: 0 2px 8px rgba(10,10,10,0.06); }
    .auth-oauth:disabled { opacity: 0.5; cursor: not-allowed; }

    .auth-footnote { margin-top: 24px; font-size: 12px; color: var(--auth-muted); line-height: 1.55; text-align: center; }

    /* ── Verification overlay ──────────────── */
    .verify-overlay {
      position: fixed; inset: 0; z-index: 200;
      background: rgba(10,10,10,0.5);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
    }
    .verify-card {
      background: #fff; border-radius: 20px;
      padding: 32px 32px 28px;
      width: 100%; max-width: 400px;
      box-shadow: 0 24px 64px rgba(10,10,10,0.18);
      display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px;
    }
    .verify-icon {
      width: 52px; height: 52px; border-radius: 999px;
      background: var(--auth-accent-bg); color: var(--auth-accent-text);
      display: flex; align-items: center; justify-content: center;
    }
    .verify-title { font-size: 19px; font-weight: 600; color: var(--auth-ink); margin: 0; }
    .verify-sub { font-size: 13.5px; color: var(--auth-muted); margin: 0; line-height: 1.5; }
    .verify-error {
      width: 100%; background: #FEF2F2; border: 1px solid #FECACA;
      color: #B91C1C; font-size: 12.5px; font-weight: 500;
      padding: 10px 14px; border-radius: 10px;
    }
    .code-row { display: flex; gap: 8px; width: 100%; }
    .code-input {
      flex: 1; padding: 11px 14px;
      border: 1.5px solid var(--auth-rule);
      border-radius: 10px;
      font-size: 18px; font-weight: 600;
      letter-spacing: 0.15em; text-align: center; outline: none;
      font-family: var(--auth-mono);
      transition: border-color 0.15s;
    }
    .code-input:focus { border-color: var(--auth-ink); }
    .btn-verify {
      background: var(--auth-ink); color: #fff;
      border: none;
      padding: 11px 20px; border-radius: 10px;
      font-size: 13px; font-weight: 500;
      cursor: pointer; font-family: var(--auth-font);
      white-space: nowrap;
      transition: background 0.15s;
    }
    .btn-verify:hover:not(:disabled) { background: #1F1F1F; }
    .btn-verify:disabled { opacity: 0.5; cursor: not-allowed; }
    .resend-btn {
      background: none; border: none;
      color: var(--auth-muted);
      font-size: 12.5px; cursor: pointer;
      font-family: var(--auth-font);
      text-decoration: underline;
      padding: 0; margin-top: 4px;
    }
    .resend-btn:disabled { opacity: 0.5; cursor: not-allowed; text-decoration: none; }

    @media (max-width: 960px) {
      .auth-split { grid-template-columns: 1fr; }
      .auth-left { display: none; }
      .auth-right { padding: 32px 24px; }
      .auth-grid2 { grid-template-columns: 1fr; }
    }
  `]
})
export class RegisterComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const verify = this.route.snapshot.queryParamMap.get('verify');
    if (verify) {
      this.pendingEmail.set(verify);
      this.verificationStep.set(true);
    }
  }

  role = signal<Role>('CLIENT');
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);
  termsAccepted = false;

  strength = computed(() => {
    const p = this.password ?? '';
    let s = 0;
    if (p.length >= 8) s++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) s++;
    return s;
  });
  strengthLabel = computed(() => {
    const s = this.strength();
    if (!this.password) return '';
    if (s <= 1) return 'Weak';
    if (s === 2) return 'OK';
    if (s === 3) return 'Good';
    return 'Strong · meets all requirements';
  });

  verificationStep = signal(false);
  pendingEmail = signal('');
  verifyCode = '';
  verifying = signal(false);
  verifyError = signal<string | null>(null);
  resendCooldown = signal(0);
  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  canSubmit() {
    return this.firstName && this.lastName && this.email && this.password.length >= 8 && this.termsAccepted;
  }

  submit() {
    if (!this.canSubmit()) return;
    this.loading.set(true);
    this.error.set(null);

    this.auth.register({
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      password: this.password,
      role: this.role(),
    }).subscribe({
      next: (res: any) => {
        if (res.requiresVerification) {
          this.pendingEmail.set(res.email);
          this.verificationStep.set(true);
          this.loading.set(false);
        } else {
          this.router.navigate([res.role === 'WORKER' ? '/worker/profile' : '/dashboard/client']);
        }
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Something went wrong. Please try again.');
        this.loading.set(false);
      },
    });
  }

  submitVerify() {
    if (this.verifyCode.length < 6) return;
    this.verifying.set(true);
    this.verifyError.set(null);
    this.auth.verifyEmail(this.pendingEmail(), this.verifyCode).subscribe({
      next: (res) => {
        this.router.navigate([res.role === 'WORKER' ? '/worker/profile' : '/dashboard/client']);
      },
      error: (err) => {
        this.verifyError.set(err?.error?.message ?? 'Invalid code. Please try again.');
        this.verifying.set(false);
      },
    });
  }

  resendCode() {
    this.auth.resendVerification(this.pendingEmail()).subscribe();
    this.resendCooldown.set(30);
    this.cooldownTimer = setInterval(() => {
      this.resendCooldown.update(n => {
        if (n <= 1) { clearInterval(this.cooldownTimer!); this.cooldownTimer = null; return 0; }
        return n - 1;
      });
    }, 1000);
  }

  loginWithGoogle() {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }
}
