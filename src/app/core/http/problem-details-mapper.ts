import { HttpErrorResponse } from '@angular/common/http';
import { AppError, AppErrorKind } from './app-error';

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MESSAGES: Record<AppErrorKind, string> = {
  unauthenticated: 'Your session has expired. Please log in again.',
  forbidden: 'You are not allowed to do that.',
  'not-found': 'We could not find that claim.',
  conflict: 'This item was changed by someone else. The view has been refreshed.',
  'idempotency-in-progress': 'Still processing. Please wait.',
  'idempotency-key-reused':
    'We could not safely submit this. Please review your entries and submit again.',
  'idempotency-key-invalid': 'Something went wrong. Please try again.',
  validation: 'Please check the highlighted fields.',
  server: 'Something went wrong. Please try again.',
  network: 'Something went wrong. Please try again.',
  unexpected: 'Something went wrong. Please try again.',
};

function kindFor(status: number): AppErrorKind {
  if (status === 0) return 'network';
  if (status === 401) return 'unauthenticated';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 409) return 'conflict';
  if (status === 400 || status === 422) return 'validation';
  if (status >= 500) return 'server';
  return 'unexpected';
}

function kindForProblem(status: number, type: string | undefined): AppErrorKind {
  if (status === 409 && type === 'idempotency-request-in-progress')
    return 'idempotency-in-progress';
  if (status === 422 && type === 'idempotency-key-reused') return 'idempotency-key-reused';
  if (
    status === 400 &&
    (type === 'idempotency-key-missing' || type === 'idempotency-key-invalid')
  ) {
    return 'idempotency-key-invalid';
  }
  return kindFor(status);
}

function readRetryAfter(headers: HttpErrorResponse['headers'] | undefined): number | undefined {
  const raw = headers?.get('Retry-After')?.trim() ?? '';
  if (!/^\d+$/.test(raw)) return undefined;
  const seconds = Number(raw);
  return seconds <= 3600 ? seconds : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readFieldErrors(errors: unknown): Record<string, readonly string[]> | undefined {
  const record = asRecord(errors);
  if (!record) return undefined;
  const result: Record<string, readonly string[]> = {};
  for (const [field, messages] of Object.entries(record)) {
    if (Array.isArray(messages)) {
      const texts = messages.filter((m): m is string => typeof m === 'string');
      if (texts.length > 0) result[field] = texts;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/** Maps an RFC 7807 response to a safe AppError. The correlation id comes from the header only (A-F5). */
export function mapProblemDetails(response: HttpErrorResponse): AppError {
  const body = asRecord(response.error);
  const problemType = typeof body?.['type'] === 'string' ? body['type'] : undefined;
  const kind = kindForProblem(response.status, problemType);
  const headerId = response.headers?.get('X-Correlation-Id') ?? null;

  return {
    status: response.status,
    kind,
    message: MESSAGES[kind],
    problemType,
    retryAfterSeconds:
      kind === 'idempotency-in-progress' ? readRetryAfter(response.headers) : undefined,
    fieldErrors: kind === 'validation' ? readFieldErrors(body?.['errors']) : undefined,
    correlationId: headerId !== null && GUID.test(headerId) ? headerId : undefined,
  };
}
