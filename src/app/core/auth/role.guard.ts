import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { NotificationService } from '../notification/notification.service';
import { AuthService } from './auth.service';
import { isRole } from './roles';

/** Allowed role comes from route data `role`. UX only: the backend returns 403 regardless. */
export const roleGuard: CanActivateFn = (route) => {
  const required: unknown = route.data['role'];
  if (!isRole(required)) {
    throw new Error('roleGuard needs route data `role` to be Claimant, Officer or Manager.');
  }
  const auth = inject(AuthService);
  if (auth.hasRole(required)) return true;
  inject(NotificationService).show('You do not have access to that area.');
  return inject(Router).createUrlTree([auth.landingUrl()]);
};
