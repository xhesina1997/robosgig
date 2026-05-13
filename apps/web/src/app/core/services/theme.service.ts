import { Injectable, inject, signal, effect } from '@angular/core';
import { AuthService } from './auth.service';

export type ThemeMode = 'light' | 'dark' | 'glossier';

export interface AccentColor {
  key: string;
  label: string;
  accent: string;
  accentText: string;
  accentBg: string;
  accentBr: string;
  glow: string;
}

export const ACCENT_COLORS: AccentColor[] = [
  { key: 'lime',   label: 'Lime',   accent: '#84CC16', accentText: '#4D7C0F', accentBg: '#F0FAE0', accentBr: '#D6EAA0', glow: 'rgba(132,204,22,0.5)' },
  { key: 'blue',   label: 'Blue',   accent: '#3B82F6', accentText: '#1D4ED8', accentBg: '#DBEAFE', accentBr: '#BFDBFE', glow: 'rgba(59,130,246,0.5)' },
  { key: 'violet', label: 'Violet', accent: '#8B5CF6', accentText: '#6D28D9', accentBg: '#EDE9FE', accentBr: '#DDD6FE', glow: 'rgba(139,92,246,0.5)' },
  { key: 'orange', label: 'Orange', accent: '#F97316', accentText: '#C2410C', accentBg: '#FFEDD5', accentBr: '#FED7AA', glow: 'rgba(249,115,22,0.5)' },
  { key: 'rose',   label: 'Rose',   accent: '#F43F5E', accentText: '#BE123C', accentBg: '#FFE4E6', accentBr: '#FECDD3', glow: 'rgba(244,63,94,0.5)' },
  { key: 'teal',   label: 'Teal',   accent: '#14B8A6', accentText: '#0F766E', accentBg: '#CCFBF1', accentBr: '#99F6E4', glow: 'rgba(20,184,166,0.5)' },
];

const STORAGE_THEME = 'rg_theme';
const STORAGE_ACCENT = 'rg_accent';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private auth = inject(AuthService);

  mode = signal<ThemeMode>((localStorage.getItem(STORAGE_THEME) as ThemeMode) || 'light');
  accentKey = signal<string>(localStorage.getItem(STORAGE_ACCENT) || 'lime');

  readonly accents = ACCENT_COLORS;

  constructor() {
    effect(() => this.apply());
  }

  setMode(mode: ThemeMode) {
    this.mode.set(mode);
    localStorage.setItem(STORAGE_THEME, mode);
  }

  setAccent(key: string) {
    if (!ACCENT_COLORS.some((a) => a.key === key)) return;
    this.accentKey.set(key);
    localStorage.setItem(STORAGE_ACCENT, key);
  }

  private apply() {
    // Theme is a logged-in preference. For guests (login/register/public pages)
    // we force light mode + the default accent so the marketing surface is
    // consistent for everyone, regardless of someone's last saved preference.
    const isLoggedIn = this.auth.isLoggedIn();
    const mode: ThemeMode = isLoggedIn ? this.mode() : 'light';
    const accent = isLoggedIn
      ? (ACCENT_COLORS.find((a) => a.key === this.accentKey()) ?? ACCENT_COLORS[0])
      : ACCENT_COLORS[0]; // lime default for guests
    const root = document.documentElement;

    // Theme mode → swaps the base palette via [data-rg-theme] selector in styles.scss
    if (mode === 'light') root.removeAttribute('data-rg-theme');
    else root.setAttribute('data-rg-theme', mode);

    // Accent color tokens — set on :root, overriding the defaults from styles.scss
    root.style.setProperty('--rg-accent', accent.accent);
    root.style.setProperty('--rg-accent-text', accent.accentText);
    root.style.setProperty('--rg-accent-bg', accent.accentBg);
    root.style.setProperty('--rg-accent-br', accent.accentBr);
    root.style.setProperty('--rg-accent-glow', accent.glow);
  }
}
