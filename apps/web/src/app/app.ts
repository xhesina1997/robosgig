import { Component, inject, effect, signal, HostListener } from '@angular/core';
import { RouterModule, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { ChatService } from './core/services/chat.service';
import { ChatWidgetComponent } from './shared/chat-widget.component';

@Component({
  imports: [RouterModule, CommonModule, ChatWidgetComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  auth = inject(AuthService);
  private chat = inject(ChatService);
  private router = inject(Router);

  loading = signal(false);
  menuOpen = signal(false);
  userMenuOpen = signal(false);

  toggleUserMenu(event: MouseEvent) {
    event.stopPropagation();
    this.userMenuOpen.update(v => !v);
  }

  @HostListener('document:click')
  closeUserMenu() {
    if (this.userMenuOpen()) this.userMenuOpen.set(false);
  }

  signOut() {
    this.userMenuOpen.set(false);
    this.auth.logout();
  }

  constructor() {
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
      }
      if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) {
        setTimeout(() => this.loading.set(false), 200);
      }
    });
  }
}
