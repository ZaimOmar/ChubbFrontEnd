import { MonoTypeOperatorFunction, Observable, catchError, retry, throwError } from 'rxjs';
import { AppError, isAppError } from '../http/app-error';
import { TRY_LATER_MESSAGE } from './messages';

export const MAX_IN_PROGRESS_WAITS = 5;
const DEFAULT_WAIT_SECONDS = 1;
const MIN_WAIT_SECONDS = 1;
const MAX_WAIT_SECONDS = 10;

function isInProgress(error: unknown): error is AppError {
  return isAppError(error) && error.kind === 'idempotency-in-progress';
}

function waitSeconds(error: AppError): number {
  const requested = error.retryAfterSeconds ?? DEFAULT_WAIT_SECONDS;
  return Math.min(MAX_WAIT_SECONDS, Math.max(MIN_WAIT_SECONDS, requested));
}

/**
 * Resubscribes (same send closure, so same key and bytes) after a 409 in-progress, honouring
 * Retry-After. Gives up after five waits with an exhausted in-progress error. Other errors pass through.
 */
export function withInProgressRetry<T>(
  wait: (ms: number) => Observable<unknown>,
  onWait: () => void,
): MonoTypeOperatorFunction<T> {
  return (source) =>
    source.pipe(
      retry({
        count: MAX_IN_PROGRESS_WAITS,
        delay: (error: unknown) => {
          if (!isInProgress(error)) return throwError(() => error);
          onWait();
          return wait(waitSeconds(error) * 1000);
        },
      }),
      catchError((error: unknown) =>
        throwError(() =>
          isInProgress(error) ? { ...error, exhausted: true, message: TRY_LATER_MESSAGE } : error,
        ),
      ),
    );
}
