import {
  Component, inject, signal, ViewChild,
  ElementRef, AfterViewChecked, OnInit, OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../core/services/chat.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (auth.isLoggedIn()) {

      <!-- Floating bubble -->
      @if (!chat.isOpen()) {
        <button class="bubble" (click)="chat.openWidget()">
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          @if (chat.totalUnread() > 0) {
            <span class="bubble-badge">{{ chat.totalUnread() > 9 ? '9+' : chat.totalUnread() }}</span>
          }
        </button>
      }

      <!-- Chat panel -->
      @if (chat.isOpen()) {
        <div class="widget">

          <!-- Header -->
          <div class="w-head">
            @if (chat.activeJobId()) {
              <button class="w-back" (click)="chat.backToList()">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <span class="w-head-title">{{ activeConversation()?.otherPerson }}</span>
            } @else {
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              <span class="w-head-title">Messages</span>
              @if (chat.totalUnread() > 0) {
                <span class="w-head-badge">{{ chat.totalUnread() }}</span>
              }
            }
            <button class="w-close" (click)="chat.closeWidget()">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Conversation list -->
          @if (!chat.activeJobId()) {
            <div class="w-body">
              @if (chat.conversations().length === 0) {
                <div class="w-empty">
                  <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  <p>No conversations yet</p>
                  <span>Accept a job or get hired to start chatting</span>
                </div>
              }
              @for (conv of chat.conversations(); track conv.jobId) {
                <button class="conv-row" (click)="chat.openChat(conv.jobId)">
                  <div class="conv-avatar">{{ conv.otherPerson[0] }}</div>
                  <div class="conv-info">
                    <div class="conv-top">
                      <span class="conv-name">{{ conv.otherPerson }}</span>
                      @if (conv.lastMessage) {
                        <span class="conv-time">{{ conv.lastMessage.createdAt | date:'HH:mm' }}</span>
                      }
                    </div>
                    <div class="conv-bottom">
                      <span class="conv-preview">
                        @if (conv.lastMessage) {
                          {{ conv.lastMessage.isMine ? 'You: ' : '' }}{{ conv.lastMessage.content }}
                        } @else {
                          {{ conv.jobTitle }}
                        }
                      </span>
                      @if (conv.unread > 0) {
                        <span class="conv-unread">{{ conv.unread }}</span>
                      }
                    </div>
                  </div>
                </button>
              }
            </div>
          }

          <!-- Active chat -->
          @if (chat.activeJobId()) {
            <div class="w-notice">
              <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Keep all transactions on RobosGig. Sharing contact info or paying off-platform violates our
              <a href="/terms" target="_blank" class="w-notice-link">Terms of Service</a>.
            </div>
            <div class="w-body w-messages" #scrollRef>
              @if (messages().length === 0) {
                <div class="w-empty">
                  <p>No messages yet</p>
                  <span>Say hello or share your arrival time</span>
                </div>
              }
              @for (msg of messages(); track msg.id) {
                <div class="msg-row" [class.msg-mine]="msg.senderId === myId()">
                  <div class="msg-bubble" [class.msg-bubble--mine]="msg.senderId === myId()">
                    @if (msg.senderId !== myId()) {
                      <span class="msg-name">{{ msg.senderName.split(' ')[0] }}</span>
                    }
                    <p class="msg-text">{{ msg.content }}</p>
                    @if (msg.wasFiltered) {
                      <span class="msg-filtered">
                        <svg width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        Contact info was removed
                      </span>
                    }
                    <span class="msg-time">{{ msg.createdAt | date:'HH:mm' }}</span>
                  </div>
                </div>
              }
            </div>

            <div class="w-footer">
              <input
                class="w-input"
                [(ngModel)]="draft"
                placeholder="Type a message…"
                (keydown.enter)="send()"
                autofocus
              />
              <button class="w-send" (click)="send()" [disabled]="!draft.trim()">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>
              </button>
            </div>
          }

        </div>
      }

    }
  `,
  styles: [`
    * { box-sizing: border-box; }

    /* ── Bubble ────────────────────────────── */
    .bubble {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      width: 52px; height: 52px;
      border-radius: 50%;
      background: #18181b;
      color: #fff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      z-index: 500;
      transition: transform 0.15s, background 0.15s;
    }
    .bubble:hover { background: #27272a; transform: scale(1.06); }

    .bubble-badge {
      position: absolute;
      top: 2px; right: 2px;
      background: #ef4444;
      color: #fff;
      font-size: 0.62rem;
      font-weight: 700;
      min-width: 18px; height: 18px;
      border-radius: 99px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      border: 2px solid #fff;
      line-height: 1;
    }

    /* ── Widget panel ──────────────────────── */
    .widget {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      width: 340px;
      height: 480px;
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08);
      z-index: 500;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: widgetIn 200ms cubic-bezier(0.25,0.46,0.45,0.94) both;
    }
    @keyframes widgetIn {
      from { opacity: 0; transform: translateY(16px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* ── Header ────────────────────────────── */
    .w-head {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 1rem 0.875rem;
      border-bottom: 1px solid #f4f4f5;
      flex-shrink: 0;
    }
    .w-head-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: #18181b;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .w-head-badge {
      background: #ef4444;
      color: #fff;
      font-size: 0.62rem;
      font-weight: 700;
      min-width: 18px; height: 18px;
      border-radius: 99px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }
    .w-back {
      background: none;
      border: none;
      color: #71717a;
      cursor: pointer;
      padding: 0.2rem;
      display: flex;
      align-items: center;
      border-radius: 6px;
      transition: color 0.12s;
      flex-shrink: 0;
    }
    .w-back:hover { color: #18181b; }
    .w-close {
      background: #f4f4f5;
      border: none;
      color: #71717a;
      width: 26px; height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.12s, color 0.12s;
      flex-shrink: 0;
    }
    .w-close:hover { background: #e4e4e7; color: #18181b; }

    /* ── Body ──────────────────────────────── */
    .w-body {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }
    .w-body::-webkit-scrollbar { width: 4px; }
    .w-body::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 4px; }

    /* ── Empty ─────────────────────────────── */
    .w-notice {
      display: flex; align-items: flex-start; gap: 0.4rem;
      background: #fffbeb; border-bottom: 1px solid #fde68a;
      color: #92400e; font-size: 0.7rem; line-height: 1.5;
      padding: 0.5rem 0.75rem; flex-shrink: 0;
    }
    .w-notice svg { flex-shrink: 0; margin-top: 1px; }
    .w-notice-link { color: #92400e; font-weight: 600; }

    .w-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 0.5rem;
      text-align: center;
      color: #a1a1aa;
      padding: 2rem;
    }
    .w-empty p { font-size: 0.875rem; font-weight: 600; color: #71717a; margin: 0.5rem 0 0; }
    .w-empty span { font-size: 0.78rem; }

    /* ── Conversation rows ─────────────────── */
    .conv-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      background: none;
      border: none;
      padding: 0.75rem 1rem;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      transition: background 0.1s;
      border-bottom: 1px solid #f9f9f9;
    }
    .conv-row:hover { background: #fafafa; }

    .conv-avatar {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: #18181b;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .conv-info { flex: 1; min-width: 0; }
    .conv-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.2rem;
    }
    .conv-name {
      font-size: 0.84rem;
      font-weight: 600;
      color: #18181b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .conv-time {
      font-size: 0.68rem;
      color: #a1a1aa;
      flex-shrink: 0;
      margin-left: 0.5rem;
    }
    .conv-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .conv-preview {
      font-size: 0.75rem;
      color: #71717a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }
    .conv-unread {
      background: #18181b;
      color: #fff;
      font-size: 0.62rem;
      font-weight: 700;
      min-width: 18px; height: 18px;
      border-radius: 99px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      flex-shrink: 0;
    }

    /* ── Messages ──────────────────────────── */
    .w-messages {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.875rem 1rem;
      scroll-behavior: smooth;
    }
    .msg-row { display: flex; justify-content: flex-start; }
    .msg-mine { justify-content: flex-end; }
    .msg-bubble {
      max-width: 78%;
      background: #f4f4f5;
      border-radius: 14px 14px 14px 4px;
      padding: 0.45rem 0.7rem;
    }
    .msg-bubble--mine {
      background: #18181b;
      border-radius: 14px 14px 4px 14px;
    }
    .msg-name {
      display: block;
      font-size: 0.62rem;
      font-weight: 700;
      color: #a1a1aa;
      margin-bottom: 0.15rem;
    }
    .msg-text {
      font-size: 0.82rem;
      line-height: 1.5;
      margin: 0 0 0.15rem;
      word-break: break-word;
      color: #18181b;
    }
    .msg-bubble--mine .msg-text { color: #fff; }
    .msg-filtered {
      display: flex; align-items: center; gap: 0.3rem;
      font-size: 0.64rem; color: #f59e0b; font-weight: 600;
      margin-top: 0.25rem; opacity: 0.85;
    }
    .msg-bubble--mine .msg-filtered { color: rgba(251,191,36,0.85); }

    .msg-time {
      display: block;
      font-size: 0.6rem;
      color: #a1a1aa;
      text-align: right;
    }
    .msg-bubble--mine .msg-time { color: rgba(255,255,255,0.45); }

    /* ── Footer ────────────────────────────── */
    .w-footer {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 0.875rem;
      border-top: 1px solid #f4f4f5;
      flex-shrink: 0;
    }
    .w-input {
      flex: 1;
      border: 1.5px solid #e4e4e7;
      border-radius: 99px;
      padding: 0.42rem 0.875rem;
      font-size: 0.82rem;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s;
      background: #fafafa;
    }
    .w-input:focus { border-color: #18181b; background: #fff; }
    .w-input::placeholder { color: #a1a1aa; }
    .w-send {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: #18181b;
      color: #fff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    .w-send:hover:not(:disabled) { background: #27272a; }
    .w-send:disabled { opacity: 0.35; cursor: not-allowed; }

    @media (max-width: 480px) {
      .widget {
        bottom: 0; right: 0;
        width: 100%;
        border-radius: 20px 20px 0 0;
        height: 70vh;
      }
      .bubble { bottom: 1rem; right: 1rem; }
    }
  `],
})
export class ChatWidgetComponent implements OnInit, OnDestroy, AfterViewChecked {
  protected chat = inject(ChatService);
  protected auth = inject(AuthService);
  @ViewChild('scrollRef') private scrollRef?: ElementRef<HTMLDivElement>;

  draft = '';
  private shouldScroll = false;
  myId = signal<string | null>(null);

  activeConversation = () =>
    this.chat.conversations().find(c => c.jobId === this.chat.activeJobId()) ?? null;

  messages = () =>
    this.chat.messagesByJob()[this.chat.activeJobId() ?? ''] ?? [];

  ngOnInit() {
    this.myId.set(this.auth.getUserId());
    if (this.auth.isLoggedIn()) this.chat.connect();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      const el = this.scrollRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
    if (this.chat.activeJobId() && this.messages().length > 0) {
      this.shouldScroll = true;
    }
  }

  send() {
    if (!this.draft.trim()) return;
    this.chat.send(this.draft);
    this.draft = '';
    this.shouldScroll = true;
  }

  ngOnDestroy() { this.chat.disconnect(); }
}
