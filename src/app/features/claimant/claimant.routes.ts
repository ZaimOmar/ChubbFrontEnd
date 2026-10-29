import { Routes } from '@angular/router';

export const CLAIMANT_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'home',
    title: 'Home - Chubb Claims',
    loadComponent: () => import('./home/claimant-home.page').then((m) => m.ClaimantHomePage),
  },
  {
    path: 'report',
    title: 'Report an incident - Chubb Claims',
    loadComponent: () => import('./report/report-incident.page').then((m) => m.ReportIncidentPage),
  },
  {
    path: 'claims',
    pathMatch: 'full',
    title: 'My claims - Chubb Claims',
    loadComponent: () => import('./my-claims/my-claims.page').then((m) => m.MyClaimsPage),
  },
  {
    path: 'claims/:id',
    title: 'Claim - Chubb Claims',
    loadComponent: () =>
      import('./claim-detail/claimant-claim-detail.page').then((m) => m.ClaimantClaimDetailPage),
  },
  { path: '**', redirectTo: 'home' },
];
