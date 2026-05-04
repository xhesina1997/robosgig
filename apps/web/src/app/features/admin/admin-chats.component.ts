import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-chats',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="admin-nav">
        <div class="nav-inner">
          <span class="nav-brand">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
            Admin
          </span>
          <nav class="nav-links">
            <a class="nav-link" routerLink="/admin/dashboard">Dashboard</a>
            <a class="nav-link" routerLink="/admin/users">Users</a>
            <a class="nav-link" routerLink="/admin/subscriptions">Subscriptions</a>
            <a class="nav-link active" routerLink="/admin/chats">Chats</a>
            <a class="nav-link" routerLink="/admin/verifications">Verifications</a>
            <a class="nav-link" routerLink="/admin/payouts">Payouts</a>
            <a class="nav-link" routerLink="/admin/reports">Reports</a>
          </nav>
          <button class="nav-logout" (click)="auth.logout()">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign out
          </button>
        </div>
      </div>

      <div class="page-header">
        <div class="inner">
          <h1 class="page-title">Conversations</h1>
          <p class="page-sub">{{ conversations().length }} conversations with messages</p>
        </div>
      </div>

      <div class="content">
        @if (loading()) {
          <div class="empty">Loading…</div>
        } @else if (conversations().length === 0) {
          <div class="empty">No conversations yet</div>
        } @else {
          <div class="layout">
            <!-- Conversation list -->
            <div class="conv-list">
              @for (c of conversations(); track c.jobId) {
                <button class="conv-item" [class.selected]="selectedId() === c.jobId" (click)="selectConversation(c.jobId)">
                  <div class="conv-head">
                    <span class="conv-title">{{ c.title }}</span>
                    <span class="conv-count">{{ c._count.messages }}</span>
                  </div>
                  <div class="conv-participants">
                    <span class="participant client-p">{{ clientName(c) }}</span>
                    <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>
                    <span class="participant worker-p">{{ workerName(c) }}</span>
                  </div>
                  @if (c.messages[0]) {
                    <div class="conv-last">{{ c.messages[0].content | slice:0:60 }}{{ c.messages[0].content.length > 60 ? '…' : '' }}</div>
                  }
                  <div class="conv-meta">
                    @if (c.category) { <span class="cat-tag">{{ c.category.name }}</span> }
                    <span class="conv-date">{{ c.updatedAt | date:'d MMM, HH:mm' }}</span>
                  </div>
                </button>
              }
            </div>

            <!-- Message thread -->
            <div class="thread-panel">
              @if (!selectedId()) {
                <div class="thread-empty">
                  <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  <p>Select a conversation to read messages</p>
                </div>
              } @else if (messagesLoading()) {
                <div class="thread-empty">Loading messages…</div>
              } @else {
                <div class="thread-header">
                  <div>
                    <div class="thread-title">{{ selectedConv()?.title }}</div>
                    <div class="thread-meta">{{ clientName(selectedConv()) }} ↔ {{ workerName(selectedConv()) }}</div>
                  </div>
                  <span class="msg-count">{{ messages().length }} messages</span>
                </div>
                <div class="messages-scroll">
                  @for (m of messages(); track m.id) {
                    <div class="msg" [class.client-msg]="m.senderRole === 'CLIENT'" [class.worker-msg]="m.senderRole === 'WORKER'">
                      <div class="msg-header">
                        <span class="msg-sender">{{ m.senderName }}</span>
                        <span class="sender-role" [class.worker-role]="m.senderRole === 'WORKER'">{{ m.senderRole }}</span>
                        <span class="msg-time">{{ m.createdAt | date:'d MMM, HH:mm' }}</span>
                        @if (m.readAt) {
                          <span class="read-tick">✓ read</span>
                        }
                      </div>
                      <div class="msg-body">{{ m.content }}</div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .page { min-height: 100vh; background: #f4f4f5; display: flex; flex-direction: column; }
    .admin-nav { background: #18181b; padding: 0 1.5rem; flex-shrink: 0; }
    .nav-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; gap: 2rem; height: 48px; }
    .nav-brand { color: #fff; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; display: flex; align-items: center; gap: 0.4rem; }
    .nav-links { display: flex; }
    .nav-link { color: #a1a1aa; font-size: 0.82rem; font-weight: 500; text-decoration: none; padding: 0 0.75rem; height: 48px; display: flex; align-items: center; border-bottom: 2px solid transparent; transition: color 0.15s; white-space: nowrap; }
    .nav-link:hover { color: #e4e4e7; }
    .nav-link.active { color: #fff; border-bottom-color: #fff; }
    .nav-logout { margin-left: auto; display: flex; align-items: center; gap: 0.4rem; background: none; border: 1px solid rgba(255,255,255,0.15); color: #a1a1aa; font-size: 0.78rem; font-weight: 500; padding: 0.3rem 0.75rem; border-radius: 6px; cursor: pointer; height: 30px; font-family: inherit; transition: color 0.15s, border-color 0.15s; white-space: nowrap; }
    .nav-logout:hover { color: #fff; border-color: rgba(255,255,255,0.4); }
    .page-header { background: #fff; border-bottom: 1px solid #e4e4e7; padding: 1.25rem 0; flex-shrink: 0; }
    .inner { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
    .page-title { font-size: 1.4rem; font-weight: 800; color: #18181b; margin: 0 0 0.15rem; letter-spacing: -0.02em; }
    .page-sub { font-size: 0.82rem; color: #71717a; margin: 0; }
    .content { flex: 1; max-width: 1200px; width: 100%; margin: 0 auto; padding: 1.5rem; }
    .empty { padding: 4rem; text-align: center; color: #71717a; }
    .layout { display: grid; grid-template-columns: 340px 1fr; gap: 1rem; height: calc(100vh - 160px); }
    @media (max-width: 768px) { .layout { grid-template-columns: 1fr; height: auto; } }

    /* Conversation list */
    .conv-list { background: #fff; border-radius: 14px; border: 1.5px solid #e4e4e7; overflow-y: auto; }
    .conv-item {
      display: block; width: 100%; text-align: left;
      padding: 0.9rem 1rem; border: none; border-bottom: 1px solid #f4f4f5;
      background: none; cursor: pointer; transition: background 0.12s;
    }
    .conv-item:hover { background: #fafafa; }
    .conv-item.selected { background: #f0f0ff; border-left: 3px solid #18181b; }
    .conv-item:last-child { border-bottom: none; }
    .conv-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.3rem; }
    .conv-title { font-size: 0.82rem; font-weight: 700; color: #18181b; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .conv-count { background: #f4f4f5; color: #71717a; font-size: 0.65rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 999px; flex-shrink: 0; margin-left: 0.5rem; }
    .conv-participants { display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.3rem; }
    .participant { font-size: 0.72rem; font-weight: 600; }
    .client-p { color: #2563eb; }
    .worker-p { color: #16a34a; }
    .conv-last { font-size: 0.75rem; color: #71717a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 0.3rem; }
    .conv-meta { display: flex; align-items: center; justify-content: space-between; }
    .cat-tag { font-size: 0.65rem; background: #f4f4f5; color: #71717a; padding: 0.1rem 0.4rem; border-radius: 4px; }
    .conv-date { font-size: 0.68rem; color: #a1a1aa; }

    /* Thread panel */
    .thread-panel { background: #fff; border-radius: 14px; border: 1.5px solid #e4e4e7; display: flex; flex-direction: column; overflow: hidden; }
    .thread-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; height: 100%; color: #a1a1aa; font-size: 0.875rem; }
    .thread-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid #f4f4f5; flex-shrink: 0; }
    .thread-title { font-size: 0.9rem; font-weight: 700; color: #18181b; }
    .thread-meta { font-size: 0.75rem; color: #71717a; margin-top: 0.1rem; }
    .msg-count { font-size: 0.75rem; color: #a1a1aa; white-space: nowrap; }
    .messages-scroll { flex: 1; overflow-y: auto; padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .msg { display: flex; flex-direction: column; gap: 0.25rem; max-width: 75%; }
    .client-msg { align-self: flex-end; }
    .worker-msg { align-self: flex-start; }
    .msg-header { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .msg-sender { font-size: 0.72rem; font-weight: 700; color: #3f3f46; }
    .sender-role { font-size: 0.62rem; font-weight: 600; padding: 0.05rem 0.35rem; border-radius: 4px; background: #f4f4f5; color: #71717a; }
    .sender-role.worker-role { background: #dcfce7; color: #15803d; }
    .msg-time { font-size: 0.68rem; color: #a1a1aa; }
    .read-tick { font-size: 0.65rem; color: #22c55e; }
    .msg-body {
      padding: 0.6rem 0.875rem; border-radius: 12px;
      font-size: 0.84rem; line-height: 1.55; color: #18181b;
      background: #f4f4f5; word-break: break-word;
    }
    .client-msg .msg-body { background: #18181b; color: #fff; border-radius: 12px 12px 2px 12px; }
    .worker-msg .msg-body { border-radius: 12px 12px 12px 2px; }
  `],
})
export class AdminChatsComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  conversations = signal<any[]>([]);
  loading = signal(true);
  selectedId = signal<string | null>(null);
  messages = signal<any[]>([]);
  messagesLoading = signal(false);

  selectedConv = computed(() => this.conversations().find(c => c.jobId === this.selectedId()));

  ngOnInit() {
    this.api.getAdminConversations().subscribe({
      next: (d) => {
        this.conversations.set(d.map(c => ({ ...c, jobId: c.id })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  selectConversation(jobId: string) {
    if (this.selectedId() === jobId) return;
    this.selectedId.set(jobId);
    this.messages.set([]);
    this.messagesLoading.set(true);
    this.api.getAdminConversationMessages(jobId).subscribe({
      next: (msgs) => {
        this.messages.set(msgs.map(m => ({
          ...m,
          senderName: this.senderName(m),
        })));
        this.messagesLoading.set(false);
      },
      error: () => this.messagesLoading.set(false),
    });
  }

  clientName(c: any) {
    if (!c) return '—';
    const p = c.client?.clientProfile;
    return p ? `${p.firstName} ${p.lastName}` : (c.client?.email ?? 'Client');
  }

  workerName(c: any) {
    if (!c) return '—';
    const w = c.applications?.[0]?.worker;
    return w ? `${w.firstName} ${w.lastName}` : 'Worker';
  }

  senderName(m: any) {
    const p = m.sender?.workerProfile ?? m.sender?.clientProfile;
    return p ? `${p.firstName} ${p.lastName}` : m.sender?.email ?? 'Unknown';
  }
}
