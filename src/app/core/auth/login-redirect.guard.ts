import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const loginRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.checkSession() === 'active'
    ? inject(Router).createUrlTree([auth.landingUrl()])
    : true;
};
