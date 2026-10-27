import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SESSION_EXPIRED_MESSAGE } from '../auth/messages';
import { AuthService } from '../auth/auth.service';
import { APP_CONFIG } from '../config/app-config';
import { NotificationService } from '../notification/notification.service';
import { mapProblemDetails } from './problem-details-mapper';

function parseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function isLoginCall(method: string, target: URL): boolean {
  return method === 'POST' && target.pathname === '/auth/token';
}

/** Maps failures to AppError. A 401 from the Gateway outside login ends the session once. */
export const problemDetailsInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notifications = inject(NotificationService);
  const gatewayOrigin = new URL(inject(APP_CONFIG).gatewayBaseUrl).origin;

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) return throwError(() => error);
      const appError = mapProblemDetails(error);
      const target = parseUrl(req.url);
      const endsSession =
        appError.kind === 'unauthenticated' &&
        target !== null &&
        target.origin === gatewayOrigin &&
        !isLoginCall(req.method, target) &&
        auth.isAuthenticated();
      if (endsSession) {
        auth.logout();
        notifications.show(SESSION_EXPIRED_MESSAGE);
        void router.navigateByUrl('/login');
      }
      return throwError(() => appError);
    }),
  );
};
