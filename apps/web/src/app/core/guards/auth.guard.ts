import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  router.navigate(['/login']);
  return false;
};

export const clientOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) { router.navigate(['/login']); return false; }
  if (auth.isClient()) return true;

  if (auth.isWorker()) router.navigate(['/worker/jobs']);
  else router.navigate(['/admin/dashboard']);
  return false;
};

export const workerOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) { router.navigate(['/login']); return false; }
  if (auth.isWorker()) return true;

  if (auth.isClient()) router.navigate(['/post']);
  else router.navigate(['/admin/dashboard']);
  return false;
};

export const adminOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) { router.navigate(['/login']); return false; }
  if (auth.isAdmin()) return true;

  router.navigate(['/login']);
  return false;
};
