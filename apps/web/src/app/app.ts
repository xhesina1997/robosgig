import { Component, inject, effect, signal, HostListener } from '@angular/core';
import { RouterModule, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from './core/services/auth.service';
import { ChatService } from './core/services/chat.service';
import { ThemeService } from './core/services/theme.service';
import { NotificationsService, AppNotification } from './core/services/notifications.service';
import { ChatWidgetComponent } from './shared/chat-widget.component';

@Component({
  imports: [RouterModule, CommonModule, TranslateModule, ChatWidgetComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  auth = inject(AuthService);
  notifs = inject(NotificationsService);
  private chat = inject(ChatService);
  private router = inject(Router);

  loading = signal(false);
  menuOpen = signal(false);
  userMenuOpen = signal(false);
  notifsOpen = signal(false);

  toggleUserMenu(event: MouseEvent) {
    event.stopPropagation();
    this.userMenuOpen.update(v => !v);
    this.notifsOpen.set(false);
  }

  toggleNotifs(event: MouseEvent) {
    event.stopPropagation();
    const next = !this.notifsOpen();
    this.notifsOpen.set(next);
    this.userMenuOpen.set(false);
    if (next) this.notifs.loadList();
  }

  onNotifClick(n: AppNotification) {
    this.notifs.markRead(n.id);
    this.notifsOpen.set(false);
  }

  formatNotifTime(iso: string): string {
    const now = Date.now();
    const t = new Date(iso).getTime();
    const m = Math.round((now - t) / 60_000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.round(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(iso).toLocaleDateString();
  }

  @HostListener('document:click')
  closeMenus() {
    if (this.userMenuOpen()) this.userMenuOpen.set(false);
    if (this.notifsOpen()) this.notifsOpen.set(false);
  }

  signOut() {
    this.userMenuOpen.set(false);
    this.auth.logout();
  }

  constructor() {
    // Eager-init the ThemeService so saved theme + accent apply on boot.
    inject(ThemeService);

    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.chat.connect();
      } else {
        this.chat.disconnect();
      }
    });

    this.router.events.subscribe(e => {
      if (e instanceof NavigationStart) {
        this.loading.set(true);
        this.menuOpen.set(false);
        this.userMenuOpen.set(false);
        this.notifsOpen.set(false);
      }
      if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) {
        setTimeout(() => this.loading.set(false), 200);
      }
    });
  }
}
