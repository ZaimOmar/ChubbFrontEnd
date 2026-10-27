import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { NotificationService } from '../notification/notification.service';
import { AuthService } from './auth.service';
import { SESSION_EXPIRED_MESSAGE } from './messages';

/** UX only: the backend enforces access. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const status = auth.checkSession();
  if (status === 'active') return true;
  if (status === 'expired') inject(NotificationService).show(SESSION_EXPIRED_MESSAGE);
  return router.createUrlTree(['/login']);
};
