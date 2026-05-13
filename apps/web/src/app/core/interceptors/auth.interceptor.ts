import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * Background-poll endpoints whose 401s should NOT log the user out.
 * (Otherwise a stale JWT during a passive poll kicks the user mid-action.)
 */
const SILENT_401_URLS = [
  '/notifications/unread-count',
  '/notifications',
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        const url = req.url;
        const isSilent = SILENT_401_URLS.some((p) => url.endsWith(p));
        if (!isSilent) {
          auth.logout();
          router.navigate(['/login']);
        }
      }
      return throwError(() => err);
    })
  );
};
