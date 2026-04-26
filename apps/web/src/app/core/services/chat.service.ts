import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { signal, computed } from '@angular/core';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  id: string;
  jobId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export interface Conversation {
  jobId: string;
  jobTitle: string;
  categoryName: string | null;
  otherPerson: string;
  lastMessage: {
    content: string;
    senderName: string;
    isMine: boolean;
    createdAt: string;
  } | null;
  unread: number;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private socket: Socket | null = null;

  // Widget state
  isOpen = signal(false);
  activeJobId = signal<string | null>(null);

  // Data
  conversations = signal<Conversation[]>([]);
  messagesByJob = signal<Record<string, ChatMessage[]>>({});
  unreadByJob = signal<Record<string, number>>({});

  totalUnread = computed(() =>
    Object.values(this.unreadByJob()).reduce((sum, n) => sum + n, 0)
  );

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(`${environment.wsUrl}/chat`, {
      auth: { token: this.auth.getToken() },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => this.loadConversations());

    this.socket.on('history', ({ jobId, messages }: { jobId: string; messages: ChatMessage[] }) => {
      this.messagesByJob.update(m => ({ ...m, [jobId]: messages }));
    });

    this.socket.on('message', (msg: ChatMessage) => {
      this.messagesByJob.update(m => ({
        ...m,
        [msg.jobId]: [...(m[msg.jobId] ?? []), msg],
      }));
      // Update last message in conversation list
      this.conversations.update(convs =>
        convs.map(c => c.jobId === msg.jobId
          ? { ...c, lastMessage: { content: msg.content, senderName: msg.senderName, isMine: msg.senderId === this.auth.getUserId(), createdAt: msg.createdAt } }
          : c
        )
      );
    });

    this.socket.on('unread', ({ jobId, count }: { jobId: string; count: number }) => {
      this.unreadByJob.update(u => ({ ...u, [jobId]: count }));
      this.conversations.update(convs =>
        convs.map(c => c.jobId === jobId ? { ...c, unread: count } : c)
      );
    });

    this.socket.on('notification', ({ jobId }: { jobId: string; senderName: string; preview: string }) => {
      // Only increment if this job chat is not currently open
      if (this.activeJobId() !== jobId) {
        this.unreadByJob.update(u => ({ ...u, [jobId]: (u[jobId] ?? 0) + 1 }));
        this.conversations.update(convs =>
          convs.map(c => c.jobId === jobId ? { ...c, unread: (c.unread ?? 0) + 1 } : c)
        );
      }
    });
  }

  loadConversations() {
    this.api.getChatConversations().subscribe({
      next: (data: any) => {
        this.conversations.set(data);
        const counts: Record<string, number> = {};
        for (const c of data) counts[c.jobId] = c.unread;
        this.unreadByJob.set(counts);
      },
    });
  }

  openWidget() { this.isOpen.set(true); }
  closeWidget() {
    if (this.activeJobId()) this.leaveJob(this.activeJobId()!);
    this.isOpen.set(false);
    this.activeJobId.set(null);
  }

  openChat(jobId: string) {
    if (this.activeJobId() && this.activeJobId() !== jobId) {
      this.leaveJob(this.activeJobId()!);
    }
    this.activeJobId.set(jobId);
    this.socket?.emit('join', jobId);
  }

  backToList() {
    if (this.activeJobId()) this.leaveJob(this.activeJobId()!);
    this.activeJobId.set(null);
  }

  send(content: string) {
    const jobId = this.activeJobId();
    if (!jobId || !content.trim()) return;
    this.socket?.emit('message', { jobId, content: content.trim() });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  private leaveJob(jobId: string) {
    this.socket?.emit('leave', jobId);
  }
}
