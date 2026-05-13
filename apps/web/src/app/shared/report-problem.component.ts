import { Component, signal, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';

@Component({
  selector: 'app-report-problem',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="overlay" (click)="onOverlayClick($event)">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button class="close-btn" (click)="closed.emit()" aria-label="Close">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        @if (submitted()) {
          <div class="success-state">
            <div class="success-icon">
              <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 class="success-title">Report submitted</h2>
            <p class="success-desc">Thank you for letting us know. We'll look into it and follow up if needed.</p>
            <button class="btn-primary" (click)="closed.emit()">Done</button>
          </div>
        } @else {
          <h2 class="modal-title" id="modal-title">Report a problem</h2>
          <p class="modal-sub">Tell us what went wrong and we'll investigate.</p>

          <div class="field">
            <label class="label">Category</label>
            <div class="chips">
              @for (cat of categories; track cat.value) {
                <button class="chip" [class.chip-on]="category() === cat.value" (click)="category.set(cat.value)" type="button">{{ cat.label }}</button>
              }
            </div>
          </div>

          <div class="field">
            <label class="label" for="rp-subject">Subject</label>
            <input id="rp-subject" class="input" [(ngModel)]="subject" placeholder="Brief summary of the issue" maxlength="120" />
          </div>

          <div class="field">
            <label class="label" for="rp-desc">Description</label>
            <textarea id="rp-desc" class="textarea" [(ngModel)]="description" rows="4" placeholder="Describe the problem in detail…" maxlength="2000"></textarea>
          </div>

          @if (error()) {
            <div class="error-msg">{{ error() }}</div>
          }

          <div class="actions">
            <button class="btn-secondary" (click)="closed.emit()" type="button">Cancel</button>
            <button class="btn-primary" (click)="submit()" [disabled]="!canSubmit() || loading()" type="button">
              @if (loading()) { Submitting… } @else { Submit report }
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,0.45); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; padding: 1.5rem;
    }
    .modal {
      position: relative;
      background: var(--rg-panel, #fff); border-radius: 20px;
      padding: 2rem; width: 100%; max-width: 500px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.18);
      display: flex; flex-direction: column; gap: 1rem;
    }
    .close-btn {
      position: absolute; top: 1.1rem; right: 1.1rem;
      background: none; border: none; cursor: pointer;
      color: var(--rg-sub, var(--rg-sub, #a1a1aa)); padding: 0.25rem; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
    }
    .close-btn:hover { color: var(--rg-ink, #18181b); background: var(--rg-soft, #F4F4F5); }
    .modal-title { font-size: 1.15rem; font-weight: 800; color: var(--rg-ink, #18181b); margin: 0; letter-spacing: -0.02em; }
    .modal-sub { font-size: 0.85rem; color: var(--rg-muted, #71717A); margin: 0; }
    .field { display: flex; flex-direction: column; gap: 0.4rem; }
    .label { font-size: 0.8rem; font-weight: 600; color: var(--rg-ink, #3F3F46); }
    .chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .chip {
      padding: 0.25rem 0.75rem; border-radius: 999px;
      border: 1.5px solid var(--rg-rule, #e4e4e7); background: var(--rg-hover, #fafafa);
      font-size: 0.78rem; font-weight: 500; color: var(--rg-ink, #3F3F46);
      cursor: pointer; transition: all 0.15s;
    }
    .chip:hover { border-color: var(--rg-sub, var(--rg-sub, #a1a1aa)); }
    .chip-on { border-color: var(--rg-ink, #18181b); background: var(--rg-invert-bg, #0A0A0A); color: var(--rg-invert-fg, #fff); }
    .input, .textarea {
      width: 100%; padding: 0.6rem 0.75rem;
      border: 1.5px solid var(--rg-rule, #e4e4e7); border-radius: 10px;
      font-size: 0.875rem; color: var(--rg-ink, #18181b);
      background: var(--rg-hover, #fafafa); outline: none;
      font-family: inherit; box-sizing: border-box;
      transition: border-color 0.15s;
    }
    .input:focus, .textarea:focus { border-color: var(--rg-ink, #18181b); background: var(--rg-panel, #fff); }
    .textarea { resize: vertical; min-height: 90px; }
    .error-msg { font-size: 0.8rem; color: #dc2626; }
    .actions { display: flex; gap: 0.75rem; justify-content: flex-end; padding-top: 0.25rem; }
    .btn-primary {
      padding: 0.55rem 1.25rem; border-radius: 10px;
      background: var(--rg-invert-bg, #0A0A0A); color: var(--rg-invert-fg, #fff); border: none;
      font-size: 0.875rem; font-weight: 600; cursor: pointer;
      transition: opacity 0.15s;
    }
    .btn-primary:hover:not(:disabled) { opacity: 0.85; }
    .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
    .btn-secondary {
      padding: 0.55rem 1.25rem; border-radius: 10px;
      background: var(--rg-soft, #F4F4F5); color: var(--rg-ink, #3F3F46); border: 1.5px solid var(--rg-rule, #e4e4e7);
      font-size: 0.875rem; font-weight: 600; cursor: pointer;
      transition: background 0.15s;
    }
    .btn-secondary:hover { background: var(--rg-rule, #e4e4e7); }
    .success-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 0.75rem; padding: 1rem 0; text-align: center;
    }
    .success-icon {
      width: 56px; height: 56px; border-radius: 50%;
      background: #dcfce7; color: #16a34a;
      display: flex; align-items: center; justify-content: center;
    }
    .success-title { font-size: 1.1rem; font-weight: 800; color: var(--rg-ink, #18181b); margin: 0; }
    .success-desc { font-size: 0.875rem; color: var(--rg-muted, #71717A); margin: 0; line-height: 1.6; }
  `],
})
export class ReportProblemComponent {
  private api = inject(ApiService);
  closed = output<void>();

  category = signal<string>('');
  subject = '';
  description = '';
  loading = signal(false);
  error = signal<string | null>(null);
  submitted = signal(false);

  categories = [
    { label: 'Payment issue', value: 'payment' },
    { label: 'Worker conduct', value: 'worker' },
    { label: 'Client conduct', value: 'client' },
    { label: 'Technical bug', value: 'technical' },
    { label: 'Other', value: 'other' },
  ];

  canSubmit() {
    return this.category() && this.subject.trim().length >= 5 && this.description.trim().length >= 10;
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('overlay')) this.closed.emit();
  }

  submit() {
    if (!this.canSubmit() || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.submitReport({
      category: this.category(),
      subject: this.subject.trim(),
      description: this.description.trim(),
    }).subscribe({
      next: () => { this.loading.set(false); this.submitted.set(true); },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Failed to submit. Please try again.');
      },
    });
  }
}
