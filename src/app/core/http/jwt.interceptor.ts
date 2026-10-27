import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { APP_CONFIG } from '../config/app-config';

function parseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/** Attaches the bearer token only when the parsed request origin is the Gateway origin. */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const gatewayOrigin = new URL(inject(APP_CONFIG).gatewayBaseUrl).origin;
  const target = parseUrl(req.url);
  if (!target || target.origin !== gatewayOrigin) return next(req);

  const token = inject(AuthService).activeToken();
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
