import { Routes } from '@angular/router';

export const STAFF_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'home',
    title: 'Home - Chubb Claims',
    loadComponent: () => import('./home/officer-home.page').then((m) => m.OfficerHomePage),
  },
  {
    path: 'queue',
    title: 'Incoming claims - Chubb Claims',
    loadComponent: () => import('./queue/incoming-queue.page').then((m) => m.IncomingQueuePage),
  },
  {
    path: 'claims/:id',
    title: 'Claim - Chubb Claims',
    loadComponent: () =>
      import('./claim-detail/officer-claim-detail.page').then((m) => m.OfficerClaimDetailPage),
  },
  {
    path: 'claims/:id/propose',
    title: 'Propose a decision - Chubb Claims',
    loadComponent: () =>
      import('./propose/propose-decision.page').then((m) => m.ProposeDecisionPage),
  },
  { path: '**', redirectTo: 'home' },
];
