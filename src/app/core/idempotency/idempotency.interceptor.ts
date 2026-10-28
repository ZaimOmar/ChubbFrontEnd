import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { AppError } from '../http/app-error';
import { APP_CONFIG } from '../config/app-config';
import { IDEMPOTENCY_ATTEMPT } from './idempotency-context';

export const CLAIMS_ROUTE_PREFIX = '/claims';
const KEY_HEADER = 'Idempotency-Key';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

const DEVELOPER_ERROR: AppError = {
  status: 0,
  kind: 'unexpected',
  message: 'Something went wrong. Please try again.',
};

function parseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/** True for the Claims route by path segment, after any path prefix of the Gateway base URL. */
function isClaimsPath(pathname: string, basePath: string): boolean {
  if (!pathname.startsWith(basePath)) return false;
  const rest = pathname.slice(basePath.length);
  return rest === CLAIMS_ROUTE_PREFIX || rest.startsWith(`${CLAIMS_ROUTE_PREFIX}/`);
}

/** Writes `Idempotency-Key` on Claims commands from the attempt in the request context; never invents a key. */
export const idempotencyInterceptor: HttpInterceptorFn = (req, next) => {
  const gateway = new URL(inject(APP_CONFIG).gatewayBaseUrl);
  const target = parseUrl(req.url);
  const isCommand =
    !SAFE_METHODS.includes(req.method) &&
    target !== null &&
    target.origin === gateway.origin &&
    isClaimsPath(target.pathname, gateway.pathname.replace(/\/+$/, ''));
  if (!isCommand) return next(req);

  const attempt = req.context.get(IDEMPOTENCY_ATTEMPT);
  if (!attempt) return throwError(() => DEVELOPER_ERROR);

  const existing = req.headers.get(KEY_HEADER);
  if (existing !== null && existing !== attempt.key) return throwError(() => DEVELOPER_ERROR);

  const body = req.serializeBody();
  const bodyText = typeof body === 'string' ? body : undefined;
  if (bodyText !== undefined) {
    if (attempt.sentBodyText === undefined) attempt.sentBodyText = bodyText;
    else if (attempt.sentBodyText !== bodyText) return throwError(() => DEVELOPER_ERROR);
  }

  return next(existing === null ? req.clone({ setHeaders: { [KEY_HEADER]: attempt.key } }) : req);
};
