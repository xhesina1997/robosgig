import { Injectable, inject, signal, effect } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const POLL_INTERVAL_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  notifications = signal<AppNotification[]>([]);
  unread = signal(0);
  loading = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      const loggedIn = this.auth.isLoggedIn();
      if (loggedIn) {
        this.refresh();
        this.start();
      } else {
        this.stop();
        this.notifications.set([]);
        this.unread.set(0);
      }
    });
  }

  refresh() {
    this.api.getUnreadNotifications().subscribe({
      next: ({ count }) => this.unread.set(count),
    });
  }

  loadList() {
    this.loading.set(true);
    this.api.listNotifications().subscribe({
      next: (list) => {
        this.notifications.set(list as AppNotification[]);
        this.unread.set(list.filter((n: any) => !n.read).length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  markRead(id: string) {
    const before = this.notifications();
    const target = before.find((n) => n.id === id);
    if (!target || target.read) return;
    this.notifications.set(before.map((n) => n.id === id ? { ...n, read: true } : n));
    this.unread.update((c) => Math.max(0, c - 1));
    this.api.markNotificationRead(id).subscribe({ error: () => this.refresh() });
  }

  markAllRead() {
    if (this.unread() === 0) return;
    this.notifications.set(this.notifications().map((n) => ({ ...n, read: true })));
    this.unread.set(0);
    this.api.markAllNotificationsRead().subscribe({ error: () => this.refresh() });
  }

  private start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.refresh(), POLL_INTERVAL_MS);
  }

  private stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }
}
