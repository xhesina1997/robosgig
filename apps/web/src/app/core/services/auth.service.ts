import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';

export interface AuthUser {
  accessToken: string;
  role: 'CLIENT' | 'WORKER' | 'ADMIN';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  private _user = signal<AuthUser | null>(this.loadFromStorage());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isWorker = computed(() => this._user()?.role === 'WORKER');
  readonly isClient = computed(() => this._user()?.role === 'CLIENT');
  readonly isAdmin = computed(() => {
    const token = this.getToken();
    if (!token) return false;
    try { return JSON.parse(atob(token.split('.')[1])).email === 'adm@adm.com'; } catch { return false; }
  });

  login(email: string, password: string) {
    return this.api.login(email, password).pipe(
      tap((res) => this.setUser(res as AuthUser))
    );
  }

  register(data: Record<string, unknown>) {
    return this.api.register(data).pipe(
      tap((res) => this.setUser(res as AuthUser))
    );
  }

  logout() {
    this._user.set(null);
    localStorage.removeItem('tf_user');
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return this._user()?.accessToken ?? null;
  }

  getUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub ?? null;
    } catch {
      return null;
    }
  }

  private setUser(user: AuthUser) {
    this._user.set(user);
    localStorage.setItem('tf_user', JSON.stringify(user));
  }

  private loadFromStorage(): AuthUser | null {
    try {
      const raw = localStorage.getItem('tf_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
