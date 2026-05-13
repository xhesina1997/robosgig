import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

interface Draft {
  id: string;
  title: string;
  description: string;
  rawInput: string;
  urgency: string;
  priceMin: number | null;
  priceMax: number | null;
  city: string | null;
  address: string | null;
  estimatedHours: number | null;
  category: { name: string; icon: string } | null;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-client-drafts',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  template: `
    <div class="page">
      <div class="inner">

        <!-- Header -->
        <header class="hdr">
          <div class="hdr-left">
            <p class="eyebrow">Saved for later</p>
            <h1 class="title">Drafts</h1>
            <p class="sub">
              Drafts you've saved from the AI flow. Edit them, publish as a job,
              or delete what you no longer need. Drafts are never visible to workers.
            </p>
          </div>
          <a routerLink="/post" class="hdr-cta">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            New job
          </a>
        </header>

        @if (loading()) {
          <div class="state">
            <div class="ring"></div>
            <p>Loading drafts…</p>
          </div>
        } @else if (drafts().length === 0) {
          <div class="empty">
            <p class="empty-title">No drafts yet</p>
            <p class="empty-sub">
              Save a draft from the AI preview step and it'll show up here so you can come back to it.
            </p>
            <a routerLink="/post" class="empty-cta">Start a new job</a>
          </div>
        } @else {
          <div class="list">
            @for (d of drafts(); track d.id) {
              <article class="card">
                <div class="card-top">
                  @if (d.category?.name) {
                    <span class="card-cat">
                      <span class="card-cat-dot" [style.background]="catColor(d.category!.name)"></span>
                      {{ d.category!.name }}
                    </span>
                  } @else {
                    <span class="card-cat card-cat--draft">
                      <span class="card-cat-dot" style="background:var(--rg-sub, #A3A3A3)"></span>
                      Draft
                    </span>
                  }
                  <span class="card-saved">Saved {{ d.updatedAt | date:'d MMM y, HH:mm' }}</span>
                </div>

                <p class="card-title">{{ d.title || 'Untitled draft' }}</p>
                @if (d.description) {
                  <p class="card-desc">{{ d.description }}</p>
                } @else if (d.rawInput) {
                  <p class="card-desc card-desc--raw">"{{ d.rawInput }}"</p>
                }

                <div class="card-meta">
                  @if (d.city) {
                    <span>{{ d.city }}</span>
                  }
                  @if (d.priceMin) {
                    <span>· €{{ d.priceMin }}–{{ d.priceMax }}</span>
                  }
                  @if (d.estimatedHours) {
                    <span>· ~{{ d.estimatedHours }}h</span>
                  }
                  @if (d.urgency && d.urgency !== 'NORMAL') {
                    <span>· {{ d.urgency | titlecase }}</span>
                  }
                </div>

                @if (errorById()[d.id]) {
                  <p class="card-err">{{ errorById()[d.id] }}</p>
                }

                <div class="card-actions">
                  <button class="btn-delete" (click)="askDelete(d.id)" type="button" [disabled]="deleting() === d.id">
                    @if (deleting() === d.id) { Deleting… }
                    @else if (confirmingId() === d.id) { Sure? Tap again }
                    @else {
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>
                      Delete
                    }
                  </button>
                  <span class="card-actions-spacer"></span>
                  <a class="btn-edit" [routerLink]="['/post']" [queryParams]="{ draftId: d.id }">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                  </a>
                  <button class="btn-publish" (click)="publish(d.id)" type="button" [disabled]="publishing() === d.id">
                    @if (publishing() === d.id) { Posting… }
                    @else {
                      Post as job
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                    }
                  </button>
                </div>
              </article>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      --bg: var(--rg-bg, #fafafa);
      --panel: var(--rg-panel, #FFFFFF);
      --ink: var(--rg-ink, #0A0A0A);
      --muted: var(--rg-muted, #737373);
      --sub: var(--rg-sub, #A3A3A3);
      --rule: var(--rg-rule, #E8E8E5);
      --accent: var(--rg-accent, #84CC16);
      --accent-ink: var(--rg-ink, #0A0A0A);
      --accent-text: var(--rg-accent-text, #4D7C0F);
      --soft: var(--rg-soft, #F5F5F3);
      --font: 'Geist', 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      --mono: 'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
      display: block;
    }
    * { box-sizing: border-box; }
    .page {
      min-height: calc(100vh - 56px);
      background: var(--bg);
      color: var(--ink);
      font-family: var(--font);
      -webkit-font-smoothing: antialiased;
    }
    .inner {
      max-width: 1080px;
      margin: 0 auto;
      padding: 32px 40px 48px;
    }

    .hdr {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 24px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }
    .eyebrow {
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-weight: 500;
      margin: 0 0 6px;
    }
    .title {
      font-size: 32px;
      font-weight: 500;
      letter-spacing: -0.025em;
      line-height: 1;
      margin: 0;
      color: var(--ink);
    }
    .sub {
      font-size: 13px;
      color: var(--muted);
      margin: 8px 0 0;
      max-width: 540px;
      line-height: 1.55;
    }
    .hdr-cta {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 16px;
      border-radius: 999px;
      background: var(--rg-invert-bg, #0A0A0A);
      color: var(--rg-invert-fg, #fff);
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    .hdr-cta:hover { background: var(--rg-invert-hover, #262626); }

    /* States */
    .state {
      padding: 64px 24px;
      text-align: center;
      color: var(--muted);
      font-size: 13px;
    }
    .ring {
      width: 28px; height: 28px;
      margin: 0 auto 12px;
      border: 3px solid var(--rule);
      border-top-color: var(--ink);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty {
      background: var(--panel);
      border: 1px dashed var(--rule);
      border-radius: 14px;
      padding: 56px 32px;
      text-align: center;
    }
    .empty-title {
      font-size: 16px;
      font-weight: 500;
      color: var(--ink);
      margin: 0 0 6px;
    }
    .empty-sub {
      font-size: 13px;
      color: var(--muted);
      margin: 0 auto 18px;
      max-width: 360px;
      line-height: 1.5;
    }
    .empty-cta {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 18px;
      border-radius: 999px;
      background: var(--rg-invert-bg, #0A0A0A);
      color: var(--rg-invert-fg, #fff);
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
    }

    /* Draft cards */
    .list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .card {
      background: var(--panel);
      border: 1px solid var(--rule);
      border-radius: 14px;
      padding: 20px 22px;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .card:hover {
      border-color: var(--rg-rule, #D4D4D1);
      box-shadow: 0 4px 16px var(--rg-hover, rgba(0,0,0,0.04));
    }
    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .card-cat {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 10.5px;
      color: var(--muted);
      font-weight: 500;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .card-cat-dot {
      width: 6px; height: 6px;
      border-radius: 3px;
    }
    .card-saved {
      font-size: 11px;
      color: var(--sub);
      font-family: var(--mono);
      font-variant-numeric: tabular-nums;
    }

    .card-title {
      font-size: 17px;
      font-weight: 500;
      color: var(--ink);
      letter-spacing: -0.012em;
      margin: 0 0 6px;
      line-height: 1.3;
    }
    .card-desc {
      font-size: 13px;
      color: var(--muted);
      line-height: 1.55;
      margin: 0 0 10px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .card-desc--raw { font-style: italic; }

    .card-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 14px;
    }
    .card-err {
      font-size: 12px;
      color: #B91C1C;
      margin: 0 0 10px;
    }

    .card-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .card-actions-spacer { flex: 1; }
    .btn-delete,
    .btn-edit,
    .btn-publish {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 999px;
      font-size: 12.5px;
      font-family: inherit;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s;
    }
    .btn-delete {
      background: transparent;
      border: 1px solid var(--rule);
      color: #B91C1C;
    }
    .btn-delete:hover:not(:disabled) {
      border-color: rgba(220,38,38,0.4);
      background: rgba(220,38,38,0.04);
    }
    .btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-edit {
      background: var(--panel);
      border: 1px solid var(--rule);
      color: var(--ink);
    }
    .btn-edit:hover { border-color: var(--sub); }
    .btn-publish {
      background: var(--rg-invert-bg, #0A0A0A);
      border: none;
      color: var(--rg-invert-fg, #fff);
    }
    .btn-publish:hover:not(:disabled) { background: var(--rg-invert-hover, #262626); }
    .btn-publish:disabled {
      background: var(--soft);
      color: var(--muted);
      cursor: not-allowed;
    }

    @media (max-width: 640px) {
      .inner { padding: 24px 20px 32px; }
      .card-actions { flex-direction: column; align-items: stretch; }
      .card-actions-spacer { display: none; }
      .btn-delete, .btn-edit, .btn-publish { justify-content: center; }
    }
  `]
})
export class ClientDraftsComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  drafts = signal<Draft[]>([]);
  loading = signal(true);
  publishing = signal<string | null>(null);
  deleting = signal<string | null>(null);
  confirmingId = signal<string | null>(null);
  errorById = signal<Record<string, string>>({});

  ngOnInit() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.api.listJobDrafts().subscribe({
      next: (drafts) => {
        this.drafts.set(drafts as Draft[]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  askDelete(id: string) {
    if (this.confirmingId() === id) {
      this.doDelete(id);
      return;
    }
    this.confirmingId.set(id);
    setTimeout(() => {
      if (this.confirmingId() === id) this.confirmingId.set(null);
    }, 2500);
  }

  private doDelete(id: string) {
    this.confirmingId.set(null);
    this.deleting.set(id);
    this.api.deleteJobDraft(id).subscribe({
      next: () => {
        this.deleting.set(null);
        this.drafts.update((list) => list.filter((d) => d.id !== id));
      },
      error: (err: any) => {
        this.deleting.set(null);
        this.setErr(id, err?.error?.message ?? 'Failed to delete');
      },
    });
  }

  publish(id: string) {
    this.publishing.set(id);
    this.api.publishJobDraft(id).subscribe({
      next: () => {
        this.publishing.set(null);
        this.drafts.update((list) => list.filter((d) => d.id !== id));
        this.router.navigate(['/dashboard/client']);
      },
      error: (err: any) => {
        this.publishing.set(null);
        this.setErr(id, err?.error?.message ?? 'Failed to publish');
      },
    });
  }

  private setErr(id: string, msg: string) {
    this.errorById.update((m) => ({ ...m, [id]: msg }));
    setTimeout(() => {
      this.errorById.update((m) => {
        const c = { ...m };
        delete c[id];
        return c;
      });
    }, 3500);
  }

  catColor(category?: string | null): string {
    const map: Record<string, string> = {
      'Cleaning': '#10B981', 'Plumbing': '#3B82F6', 'Electrical': '#EAB308',
      'Moving': '#8B5CF6', 'Gardening': '#16A34A', 'Painting': '#EC4899',
      'Assembly': '#F59E0B', 'Mounting': '#10B981', 'Carpentry': '#A16207',
      'HVAC': '#0EA5E9', 'Handyman': 'var(--rg-muted, #737373)', 'Mechanical': '#475569',
    };
    return map[category ?? ''] ?? 'var(--rg-muted, #737373)';
  }
}
