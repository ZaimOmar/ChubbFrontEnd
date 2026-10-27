import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { AuthService } from './core/auth/auth.service';
import { loginRedirectGuard } from './core/auth/login-redirect.guard';
import { roleGuard } from './core/auth/role.guard';
import { ShellContainerComponent } from './core/layout/shell-container.component';

const toLanding = () => inject(AuthService).landingUrl();

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in - Chubb Claims',
    canActivate: [loginRedirectGuard],
    loadComponent: () => import('./features/login/login.page').then((m) => m.LoginPage),
  },
  { path: '', pathMatch: 'full', redirectTo: toLanding },
  {
    path: '',
    component: ShellContainerComponent,
    canActivate: [authGuard],
    // Re-checks the session on every move between areas, so expiry is caught without a reload.
    canActivateChild: [authGuard],
    children: [
      {
        path: 'claimant',
        canActivate: [roleGuard],
        data: { role: 'Claimant' },
        loadChildren: () =>
          import('./features/claimant/claimant.routes').then((m) => m.CLAIMANT_ROUTES),
      },
      {
        path: 'staff',
        canActivate: [roleGuard],
        data: { role: 'Officer' },
        loadChildren: () => import('./features/staff/staff.routes').then((m) => m.STAFF_ROUTES),
      },
      {
        path: 'manager',
        canActivate: [roleGuard],
        data: { role: 'Manager' },
        loadChildren: () =>
          import('./features/manager/manager.routes').then((m) => m.MANAGER_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: toLanding },
];
