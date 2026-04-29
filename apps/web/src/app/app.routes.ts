import { Route } from '@angular/router';
import { authGuard, clientOnlyGuard } from './core/guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'post',
    pathMatch: 'full',
  },
  {
    path: 'post',
    canActivate: [clientOnlyGuard],
    loadComponent: () =>
      import('./features/job-wizard/job-wizard.component').then((m) => m.JobWizardComponent),
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
  // Worker routes
  {
    path: 'dashboard/worker',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/worker-dashboard.component').then((m) => m.WorkerDashboardComponent),
  },
  {
    path: 'worker/jobs',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/worker/worker-jobs.component').then((m) => m.WorkerJobsComponent),
  },
  {
    path: 'worker/profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/worker/worker-profile.component').then((m) => m.WorkerProfileComponent),
  },
  // Client routes
  {
    path: 'dashboard/client',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/client/client-dashboard.component').then((m) => m.ClientDashboardComponent),
  },
  {
    path: 'client/profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/client/client-profile.component').then((m) => m.ClientProfileComponent),
  },
  {
    path: 'pricing',
    loadComponent: () =>
      import('./features/pricing/pricing.component').then((m) => m.PricingComponent),
  },
  {
    path: 'subscription/success',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/subscription/subscription-success.component').then((m) => m.SubscriptionSuccessComponent),
  },
  {
    path: 'payment/success',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/payment/payment-success.component').then((m) => m.PaymentSuccessComponent),
  },
  {
    path: 'admin/dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
  },
  {
    path: 'admin/users',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/admin-users.component').then((m) => m.AdminUsersComponent),
  },
  {
    path: 'admin/subscriptions',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/admin-subscriptions.component').then((m) => m.AdminSubscriptionsComponent),
  },
  {
    path: 'admin/chats',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/admin-chats.component').then((m) => m.AdminChatsComponent),
  },
  {
    path: 'admin/verifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/admin-verifications.component').then((m) => m.AdminVerificationsComponent),
  },
  {
    path: 'admin/reports',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/admin-reports.component').then((m) => m.AdminReportsComponent),
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
