import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/services/api.service';

@Component({
  selector: 'app-verify-identity',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (status() === 'VERIFIED') {
      <div class="verified-badge">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        ID Verified
      </div>
    } @else {
      <div class="verify-box">
        <div class="verify-head">
          <div class="verify-icon">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="13" x2="12" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
          </div>
          <div>
            <p class="verify-title">Verify your identity</p>
            <p class="verify-sub">Upload your ID document to build trust with {{ isWorker() ? 'clients' : 'workers' }}</p>
          </div>
        </div>

        @if (status() === 'PENDING') {
          <div class="status-pill pending">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 5v5l3 3-1.5 1.5L10 13V7h2z"/></svg>
            Under review — we'll notify you once approved
          </div>
        } @else if (status() === 'REJECTED') {
          <div class="status-pill rejected">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Rejected{{ rejectionNote() ? ': ' + rejectionNote() : '' }} — please resubmit
          </div>
        }

        @if (status() !== 'PENDING') {
          <!-- Upload area -->
          <div class="upload-grid">
            <div class="upload-slot" [class.has-file]="docFile()" (click)="docInput.click()" (dragover)="$event.preventDefault()" (drop)="onDrop($event, 'doc')">
              @if (docPreview()) {
                <img [src]="docPreview()!" class="preview-img" alt="ID document" />
                <div class="preview-overlay">Change</div>
              } @else {
                <svg width="22" height="22" fill="none" stroke="#a1a1aa" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
                <p class="slot-label">ID Document <span class="req">*</span></p>
                <p class="slot-hint">Passport, ID card or driver's licence</p>
              }
              <input #docInput type="file" accept="image/jpeg,image/png,image/webp" class="file-input" (change)="onFileChange($event, 'doc')" />
            </div>

            <div class="upload-slot" [class.has-file]="selfieFile()" (click)="selfieInput.click()" (dragover)="$event.preventDefault()" (drop)="onDrop($event, 'selfie')">
              @if (selfiePreview()) {
                <img [src]="selfiePreview()!" class="preview-img" alt="Selfie" />
                <div class="preview-overlay">Change</div>
              } @else {
                <svg width="22" height="22" fill="none" stroke="#a1a1aa" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                <p class="slot-label">Selfie <span class="opt">(optional)</span></p>
                <p class="slot-hint">A clear photo of your face</p>
              }
              <input #selfieInput type="file" accept="image/jpeg,image/png,image/webp" class="file-input" (change)="onFileChange($event, 'selfie')" />
            </div>
          </div>

          @if (error()) {
            <p class="error-msg">{{ error() }}</p>
          }

          <button class="submit-btn" [disabled]="!docFile() || submitting()" (click)="submit()">
            @if (submitting()) {
              <span class="spinner"></span> Uploading...
            } @else {
              Submit for review
            }
          </button>
        }
      </div>
    }
  `,
  styles: [`
    .verified-badge {
      display: inline-flex; align-items: center; gap: 0.375rem;
      background: #dcfce7; color: #166534;
      font-size: 0.8rem; font-weight: 600; padding: 0.35rem 0.75rem; border-radius: 99px;
    }

    .verify-box {
      background: #fafafa; border: 1.5px dashed #e4e4e7;
      border-radius: 14px; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem;
    }
    .verify-head { display: flex; align-items: flex-start; gap: 0.875rem; }
    .verify-icon {
      width: 38px; height: 38px; background: #f4f4f5; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #52525b;
    }
    .verify-title { font-size: 0.9rem; font-weight: 600; color: #18181b; margin: 0 0 0.2rem; }
    .verify-sub { font-size: 0.8rem; color: #71717a; margin: 0; }

    .status-pill {
      display: inline-flex; align-items: center; gap: 0.375rem;
      font-size: 0.8rem; font-weight: 500; padding: 0.4rem 0.75rem; border-radius: 8px;
    }
    .status-pill.pending  { background: #fef3c7; color: #92400e; }
    .status-pill.rejected { background: #fee2e2; color: #991b1b; }

    .upload-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

    .upload-slot {
      border: 1.5px dashed #d4d4d8; border-radius: 12px;
      padding: 1.25rem 1rem; text-align: center;
      cursor: pointer; transition: border-color 0.15s, background 0.15s;
      display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
      position: relative; overflow: hidden; min-height: 110px; justify-content: center;
    }
    .upload-slot:hover { border-color: #a1a1aa; background: #f9f9f9; }
    .upload-slot.has-file { border-color: #18181b; border-style: solid; }

    .preview-img { width: 100%; height: 90px; object-fit: cover; border-radius: 8px; display: block; }
    .preview-overlay {
      position: absolute; inset: 0; background: rgba(0,0,0,0.45); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 600; opacity: 0; transition: opacity 0.15s; border-radius: 12px;
    }
    .upload-slot:hover .preview-overlay { opacity: 1; }

    .slot-label { font-size: 0.82rem; font-weight: 600; color: #3f3f46; margin: 0; }
    .slot-hint { font-size: 0.72rem; color: #a1a1aa; margin: 0; }
    .req { color: #dc2626; }
    .opt { font-weight: 400; color: #a1a1aa; }
    .file-input { display: none; }

    .error-msg { font-size: 0.8rem; color: #dc2626; margin: 0; }

    .submit-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
      background: #18181b; color: #fff; border: none;
      padding: 0.6rem 1.5rem; border-radius: 99px;
      font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: inherit;
      transition: background 0.15s; align-self: flex-start;
    }
    .submit-btn:hover:not(:disabled) { background: #3f3f46; }
    .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

    .spinner {
      width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff; border-radius: 50%;
      animation: spin 0.7s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class VerifyIdentityComponent implements OnInit {
  private api = inject(ApiService);

  status = signal<'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('NONE');
  rejectionNote = signal<string | null>(null);
  isWorker = signal(false);

  docFile = signal<File | null>(null);
  selfieFile = signal<File | null>(null);
  docPreview = signal<string | null>(null);
  selfiePreview = signal<string | null>(null);
  submitting = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.api.getVerifyStatus().subscribe({
      next: (data) => {
        if (data.idVerified) {
          this.status.set('VERIFIED');
        } else if (data.verification) {
          this.status.set(data.verification.status);
          this.rejectionNote.set(data.verification.rejectionNote ?? null);
        }
      },
    });
  }

  onFileChange(event: Event, slot: 'doc' | 'selfie') {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.setFile(file, slot);
  }

  onDrop(event: DragEvent, slot: 'doc' | 'selfie') {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.setFile(file, slot);
  }

  private setFile(file: File, slot: 'doc' | 'selfie') {
    if (!file.type.startsWith('image/')) { this.error.set('Please upload an image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { this.error.set('File must be under 10 MB.'); return; }
    this.error.set(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (slot === 'doc') {
        this.docFile.set(file);
        this.docPreview.set(e.target?.result as string);
      } else {
        this.selfieFile.set(file);
        this.selfiePreview.set(e.target?.result as string);
      }
    };
    reader.readAsDataURL(file);
  }

  submit() {
    const doc = this.docFile();
    if (!doc) return;
    this.submitting.set(true);
    this.error.set(null);

    const formData = new FormData();
    formData.append('files', doc);
    const selfie = this.selfieFile();
    if (selfie) formData.append('files', selfie);

    this.api.submitVerification(formData).subscribe({
      next: () => {
        this.status.set('PENDING');
        this.submitting.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Upload failed. Please try again.');
        this.submitting.set(false);
      },
    });
  }
}
