import { Route } from '@angular/router';
import { clientOnlyGuard, workerOnlyGuard, adminOnlyGuard } from './core/guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'post',
    pathMatch: 'full',
  },
  // Client-only routes
  {
    path: 'post',
    canActivate: [clientOnlyGuard],
    loadComponent: () =>
      import('./features/job-wizard/job-wizard.component').then((m) => m.JobWizardComponent),
  },
  {
    path: 'dashboard/client',
    canActivate: [clientOnlyGuard],
    loadComponent: () =>
      import('./features/client/client-dashboard.component').then((m) => m.ClientDashboardComponent),
  },
  {
    path: 'client/profile',
    canActivate: [clientOnlyGuard],
    loadComponent: () =>
      import('./features/client/client-profile.component').then((m) => m.ClientProfileComponent),
  },
  {
    path: 'drafts',
    canActivate: [clientOnlyGuard],
    loadComponent: () =>
      import('./features/client/client-drafts.component').then((m) => m.ClientDraftsComponent),
  },
  {
    path: 'subscription/success',
    canActivate: [clientOnlyGuard],
    loadComponent: () =>
      import('./features/subscription/subscription-success.component').then((m) => m.SubscriptionSuccessComponent),
  },
  {
    path: 'payment/success',
    canActivate: [clientOnlyGuard],
    loadComponent: () =>
      import('./features/payment/payment-success.component').then((m) => m.PaymentSuccessComponent),
  },
  // Worker-only routes
  {
    path: 'dashboard/worker',
    canActivate: [workerOnlyGuard],
    loadComponent: () =>
      import('./features/dashboard/worker-dashboard.component').then((m) => m.WorkerDashboardComponent),
  },
  {
    path: 'worker/jobs',
    canActivate: [workerOnlyGuard],
    loadComponent: () =>
      import('./features/worker/worker-jobs.component').then((m) => m.WorkerJobsComponent),
  },
  {
    path: 'worker/jobs/:id',
    canActivate: [workerOnlyGuard],
    loadComponent: () =>
      import('./features/worker/worker-job-detail.component').then((m) => m.WorkerJobDetailComponent),
  },
  {
    path: 'worker/map',
    canActivate: [workerOnlyGuard],
    loadComponent: () =>
      import('./features/worker/worker-map/worker-map.component').then((m) => m.WorkerMapComponent),
  },
  {
    path: 'worker/profile',
    canActivate: [workerOnlyGuard],
    loadComponent: () =>
      import('./features/worker/worker-profile.component').then((m) => m.WorkerProfileComponent),
  },
  // Admin-only routes
  {
    path: 'admin/dashboard',
    canActivate: [adminOnlyGuard],
    loadComponent: () =>
      import('./features/admin/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
  },
  {
    path: 'admin/users',
    canActivate: [adminOnlyGuard],
    loadComponent: () =>
      import('./features/admin/admin-users.component').then((m) => m.AdminUsersComponent),
  },
  {
    path: 'admin/subscriptions',
    canActivate: [adminOnlyGuard],
    loadComponent: () =>
      import('./features/admin/admin-subscriptions.component').then((m) => m.AdminSubscriptionsComponent),
  },
  {
    path: 'admin/chats',
    canActivate: [adminOnlyGuard],
    loadComponent: () =>
      import('./features/admin/admin-chats.component').then((m) => m.AdminChatsComponent),
  },
  {
    path: 'admin/verifications',
    canActivate: [adminOnlyGuard],
    loadComponent: () =>
      import('./features/admin/admin-verifications.component').then((m) => m.AdminVerificationsComponent),
  },
  {
    path: 'admin/reports',
    canActivate: [adminOnlyGuard],
    loadComponent: () =>
      import('./features/admin/admin-reports.component').then((m) => m.AdminReportsComponent),
  },
  {
    path: 'admin/payouts',
    canActivate: [adminOnlyGuard],
    loadComponent: () =>
      import('./features/admin/admin-payouts.component').then((m) => m.AdminPayoutsComponent),
  },
  // Public routes
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth/auth-callback/auth-callback.component').then((m) => m.AuthCallbackComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'pricing',
    loadComponent: () =>
      import('./features/pricing/pricing.component').then((m) => m.PricingComponent),
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./features/legal/terms.component').then((m) => m.TermsComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
