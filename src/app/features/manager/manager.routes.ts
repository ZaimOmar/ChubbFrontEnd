import { Routes } from '@angular/router';

export const MANAGER_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'home',
    title: 'Overview - Chubb Claims',
    loadComponent: () => import('./home/manager-home.page').then((m) => m.ManagerHomePage),
  },
  {
    path: 'pending',
    title: 'Pending approvals - Chubb Claims',
    loadComponent: () =>
      import('./pending/pending-approvals.page').then((m) => m.PendingApprovalsPage),
  },
  {
    path: 'claims/:id',
    title: 'Claim - Chubb Claims',
    loadComponent: () =>
      import('./claim-detail/manager-claim-detail.page').then((m) => m.ManagerClaimDetailPage),
  },
  { path: '**', redirectTo: 'home' },
];
