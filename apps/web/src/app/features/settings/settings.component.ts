import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ThemeService, ThemeMode, ACCENT_COLORS } from '../../core/services/theme.service';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'sq', label: 'Albanian', native: 'Shqip' },
  { code: 'it', label: 'Italian', native: 'Italiano' },
];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="inner">
          <p class="eyebrow">{{ 'settings.eyebrow' | translate }}</p>
          <h1 class="page-title">{{ 'settings.title' | translate }}</h1>
          <p class="page-sub">{{ 'settings.subtitle' | translate }}</p>
        </div>
        <div class="inner">
          <nav class="tabs-nav">
            <button class="tab-btn" [class.tab-active]="activeTab() === 'appearance'" (click)="activeTab.set('appearance')" type="button">
              {{ 'settings.tabs.appearance' | translate }}
            </button>
            <button class="tab-btn" [class.tab-active]="activeTab() === 'language'" (click)="activeTab.set('language')" type="button">
              {{ 'settings.tabs.language' | translate }}
            </button>
            <button class="tab-btn" [class.tab-active]="activeTab() === 'account'" (click)="activeTab.set('account')" type="button">
              {{ 'settings.tabs.account' | translate }}
            </button>
          </nav>
        </div>
      </div>

      <div class="page-body">
        <div class="inner">

          <!-- ── APPEARANCE ── -->
          @if (activeTab() === 'appearance') {
            <div class="cards-stack">

              <section class="card">
                <header class="card-head">
                  <span class="card-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
                  </span>
                  <div>
                    <p class="card-eyebrow">{{ 'settings.appearance.theme.eyebrow' | translate }}</p>
                    <p class="card-title">{{ 'settings.appearance.theme.title' | translate }}</p>
                    <p class="card-sub">{{ 'settings.appearance.theme.sub' | translate }}</p>
                  </div>
                </header>
                <div class="card-body">
                  <div class="theme-grid">
                    @for (m of themeModes; track m.value) {
                      <button
                        class="theme-card"
                        [class.theme-card--active]="theme.mode() === m.value"
                        (click)="theme.setMode(m.value)"
                        type="button"
                      >
                        <div class="theme-preview" [attr.data-rg-theme]="m.value === 'light' ? null : m.value">
                          <div class="theme-preview-bar"></div>
                          <div class="theme-preview-row">
                            <div class="theme-preview-dot"></div>
                            <div class="theme-preview-line"></div>
                          </div>
                          <div class="theme-preview-row">
                            <div class="theme-preview-line"></div>
                            <div class="theme-preview-pill"></div>
                          </div>
                        </div>
                        <div class="theme-card-meta">
                          <span class="theme-card-name">{{ ('settings.appearance.theme.' + m.value) | translate }}</span>
                          @if (theme.mode() === m.value) {
                            <span class="theme-card-tick">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                            </span>
                          }
                        </div>
                      </button>
                    }
                  </div>
                </div>
              </section>

              <section class="card">
                <header class="card-head">
                  <span class="card-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
                  </span>
                  <div>
                    <p class="card-eyebrow">{{ 'settings.appearance.accent.eyebrow' | translate }}</p>
                    <p class="card-title">{{ 'settings.appearance.accent.title' | translate }}</p>
                    <p class="card-sub">{{ 'settings.appearance.accent.sub' | translate }}</p>
                  </div>
                </header>
                <div class="card-body">
                  <div class="accent-row">
                    @for (a of theme.accents; track a.key) {
                      <button
                        class="accent-swatch"
                        [class.accent-swatch--active]="theme.accentKey() === a.key"
                        [style.background]="a.accent"
                        [attr.aria-label]="a.label"
                        (click)="theme.setAccent(a.key)"
                        type="button"
                      >
                        @if (theme.accentKey() === a.key) {
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                        }
                      </button>
                    }
                  </div>
                  <p class="accent-current">
                    {{ 'settings.appearance.accent.current' | translate }}:
                    <strong>{{ currentAccentLabel() }}</strong>
                  </p>
                </div>
              </section>

            </div>
          }

          <!-- ── LANGUAGE ── -->
          @if (activeTab() === 'language') {
            <div class="cards-stack">
              <section class="card">
                <header class="card-head">
                  <span class="card-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  </span>
                  <div>
                    <p class="card-eyebrow">{{ 'settings.language.eyebrow' | translate }}</p>
                    <p class="card-title">{{ 'settings.language.title' | translate }}</p>
                    <p class="card-sub">{{ 'settings.language.sub' | translate }}</p>
                  </div>
                </header>
                <div class="card-body">
                  <div class="lang-list">
                    @for (l of languages; track l.code) {
                      <button
                        class="lang-row"
                        [class.lang-row--active]="currentLang() === l.code"
                        (click)="setLanguage(l.code)"
                        type="button"
                      >
                        <span class="lang-row-name">
                          <span class="lang-row-native">{{ l.native }}</span>
                          <span class="lang-row-label">{{ l.label }}</span>
                        </span>
                        @if (currentLang() === l.code) {
                          <span class="lang-row-tick">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                          </span>
                        }
                      </button>
                    }
                  </div>
                </div>
              </section>
            </div>
          }

          <!-- ── ACCOUNT ── -->
          @if (activeTab() === 'account') {
            <div class="cards-stack">
              <section class="card">
                <header class="card-head">
                  <span class="card-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>
                  </span>
                  <div>
                    <p class="card-eyebrow">{{ 'settings.account.eyebrow' | translate }}</p>
                    <p class="card-title">{{ 'settings.account.title' | translate }}</p>
                    <p class="card-sub">{{ 'settings.account.sub' | translate }}</p>
                  </div>
                </header>
                <div class="card-body">
                  <a class="acct-link" [routerLink]="auth.isWorker() ? '/worker/profile' : '/client/profile'">
                    {{ 'settings.account.openProfile' | translate }} →
                  </a>
                </div>
              </section>
            </div>
          }

        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --font: 'Geist', 'Inter', system-ui, sans-serif;
    }
    * { box-sizing: border-box; }

    .page {
      min-height: 100vh;
      background: var(--rg-bg, #fafafa);
      color: var(--rg-ink, #0A0A0A);
      font-family: var(--font);
    }

    .page-header {
      background: var(--rg-panel, #fff);
      border-bottom: 1px solid var(--rg-rule, #E8E8E5);
      padding-top: 36px;
      padding-bottom: 0;
    }
    .inner { max-width: 960px; margin: 0 auto; padding: 0 24px; }
    .eyebrow {
      font-size: 11px;
      color: var(--rg-muted, #737373);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0;
    }
    .page-title {
      font-size: 30px;
      font-weight: 600;
      letter-spacing: -0.025em;
      margin: 6px 0 6px;
    }
    .page-sub {
      font-size: 14px;
      color: var(--rg-muted, #737373);
      margin: 0 0 24px;
      max-width: 56ch;
    }

    .tabs-nav {
      display: flex;
      gap: 24px;
      border-top: 1px solid transparent;
      padding-top: 4px;
    }
    .tab-btn {
      padding: 12px 0;
      border: none;
      background: transparent;
      font-family: inherit;
      font-size: 14px;
      font-weight: 500;
      color: var(--rg-muted, #737373);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: color 0.15s;
    }
    .tab-btn:hover { color: var(--rg-ink, #0A0A0A); }
    .tab-active {
      color: var(--rg-ink, #0A0A0A);
      border-bottom-color: var(--rg-ink, #0A0A0A);
    }

    .page-body { padding: 28px 0 60px; }
    .cards-stack { display: flex; flex-direction: column; gap: 16px; }

    .card {
      background: var(--rg-panel, #fff);
      border: 1px solid var(--rg-rule, #E8E8E5);
      border-radius: 14px;
      overflow: hidden;
    }
    .card-head {
      padding: 20px 24px 16px;
      display: flex;
      gap: 14px;
      align-items: flex-start;
      border-bottom: 1px solid var(--rg-rule, #E8E8E5);
    }
    .card-icon {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: var(--rg-soft, #F5F5F3);
      color: var(--rg-ink, #0A0A0A);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .card-eyebrow {
      font-size: 10.5px;
      color: var(--rg-muted, #737373);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0;
    }
    .card-title {
      font-size: 17px;
      font-weight: 500;
      letter-spacing: -0.015em;
      margin: 4px 0 0;
    }
    .card-sub {
      font-size: 13px;
      color: var(--rg-muted, #737373);
      margin: 6px 0 0;
      line-height: 1.5;
      max-width: 56ch;
    }
    .card-body { padding: 22px 24px; }

    /* Theme cards */
    .theme-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    @media (max-width: 720px) { .theme-grid { grid-template-columns: 1fr; } }
    .theme-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 12px;
      border: 1.5px solid var(--rg-rule, #E8E8E5);
      border-radius: 14px;
      background: var(--rg-panel, #fff);
      cursor: pointer;
      font-family: inherit;
      transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
      text-align: left;
    }
    .theme-card:hover { border-color: var(--rg-sub, #A3A3A3); }
    .theme-card--active {
      border-color: var(--rg-accent, #84CC16);
      box-shadow: 0 0 0 3px var(--rg-accent-bg, #F0FAE0);
    }
    .theme-preview {
      height: 110px;
      border-radius: 10px;
      overflow: hidden;
      background: var(--rg-bg, #fafafa);
      border: 1px solid var(--rg-rule, #E8E8E5);
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .theme-preview-bar {
      height: 8px;
      width: 60%;
      border-radius: 4px;
      background: var(--rg-ink, #0A0A0A);
      opacity: 0.85;
    }
    .theme-preview-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .theme-preview-dot {
      width: 12px; height: 12px;
      border-radius: 999px;
      background: var(--rg-accent, #84CC16);
    }
    .theme-preview-line {
      flex: 1;
      height: 6px;
      border-radius: 3px;
      background: var(--rg-rule, #E8E8E5);
    }
    .theme-preview-pill {
      width: 30px; height: 16px;
      border-radius: 999px;
      background: var(--rg-accent-bg, #F0FAE0);
      border: 1px solid var(--rg-accent-br, #D6EAA0);
    }
    .theme-card-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 2px;
    }
    .theme-card-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--rg-ink, #0A0A0A);
    }
    .theme-card-tick {
      width: 18px; height: 18px;
      border-radius: 999px;
      background: var(--rg-accent, #84CC16);
      color: var(--rg-ink, #0A0A0A);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    /* Accent swatches */
    .accent-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .accent-swatch {
      width: 44px; height: 44px;
      border-radius: 14px;
      border: 2px solid transparent;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.15s, box-shadow 0.15s;
      padding: 0;
      box-shadow: 0 2px 4px var(--rg-hover, rgba(0,0,0,0.06));
    }
    .accent-swatch:hover { transform: translateY(-2px); }
    .accent-swatch--active {
      border-color: var(--rg-ink, #0A0A0A);
      box-shadow: 0 0 0 2px var(--rg-panel, #fff), 0 0 0 4px var(--rg-ink, #0A0A0A);
    }
    .accent-current {
      margin: 16px 0 0;
      font-size: 13px;
      color: var(--rg-muted, #737373);
    }
    .accent-current strong { color: var(--rg-ink, #0A0A0A); font-weight: 500; }

    /* Language */
    .lang-list { display: flex; flex-direction: column; gap: 6px; }
    .lang-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid var(--rg-rule, #E8E8E5);
      background: var(--rg-panel, #fff);
      cursor: pointer;
      font-family: inherit;
      transition: background 0.12s, border-color 0.12s;
    }
    .lang-row:hover { background: var(--rg-soft, #F5F5F3); }
    .lang-row--active {
      border-color: var(--rg-accent, #84CC16);
      background: var(--rg-accent-bg, #F0FAE0);
    }
    .lang-row-name { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
    .lang-row-native {
      font-size: 14px;
      font-weight: 500;
      color: var(--rg-ink, #0A0A0A);
    }
    .lang-row-label {
      font-size: 11px;
      color: var(--rg-muted, #737373);
      letter-spacing: 0.04em;
    }
    .lang-row-tick {
      width: 22px; height: 22px;
      border-radius: 999px;
      background: var(--rg-accent, #84CC16);
      color: var(--rg-ink, #0A0A0A);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .acct-link {
      display: inline-block;
      font-size: 14px;
      color: var(--rg-ink, #0A0A0A);
      text-decoration: none;
      border-bottom: 1px solid var(--rg-ink, #0A0A0A);
      padding-bottom: 2px;
      font-weight: 500;
    }
  `]
})
export class SettingsComponent {
  theme = inject(ThemeService);
  auth = inject(AuthService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);

  activeTab = signal<'appearance' | 'language' | 'account'>('appearance');
  languages = LANGUAGES;

  themeModes: Array<{ value: ThemeMode }> = [
    { value: 'light' },
    { value: 'dark' },
    { value: 'glossier' },
  ];

  currentLang = signal(this.translate.getCurrentLang?.() || localStorage.getItem('rg_lang') || 'en');

  currentAccentLabel = computed(() => {
    return ACCENT_COLORS.find((a) => a.key === this.theme.accentKey())?.label ?? 'Lime';
  });

  setLanguage(code: string) {
    this.currentLang.set(code);
    this.translate.use(code);
    localStorage.setItem('rg_lang', code);
    // Persist to backend (silent — fail gracefully if endpoint not yet wired)
    this.api.updateLanguage?.(code).subscribe?.({ error: () => {} });
  }
}
