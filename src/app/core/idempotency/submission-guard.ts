import { HttpContext } from '@angular/common/http';
import { computed, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, defer, finalize, tap, throwError } from 'rxjs';
import { AppError, isAppError } from '../http/app-error';
import { deepFreeze } from './deep-freeze';
import { Attempt, withAttempt } from './idempotency-context';
import { IDEMPOTENCY_KEY_FACTORY } from './idempotency-key';
import { IDEMPOTENCY_WAIT } from './idempotency-wait';
import { withInProgressRetry } from './in-progress-retry';
import { UNKNOWN_OUTCOME_MESSAGE } from './messages';

export type SubmissionStatus = 'idle' | 'sending' | 'waiting';
export type SubmissionOutcome = 'success' | 'refused' | 'unknown' | 'rejected';

export type SendCommand<TRequest, TResult> = (
  request: Readonly<TRequest>,
  context: HttpContext,
  key: string,
) => Observable<TResult>;

function outcomeFor(error: unknown): SubmissionOutcome {
  if (!isAppError(error)) return 'rejected';
  switch (error.kind) {
    case 'network':
    case 'server':
    case 'idempotency-in-progress':
      return 'unknown';
    case 'forbidden':
    case 'conflict':
      return 'refused';
    default:
      return 'rejected';
  }
}

/**
 * Owns one submit site's pending attempt (key plus exact bytes) in memory only. Create it in an
 * injection context (a component field) so it lives and dies with the component.
 */
export class SubmissionGuard {
  private readonly newKey = inject(IDEMPOTENCY_KEY_FACTORY);
  private readonly wait = inject(IDEMPOTENCY_WAIT);
  private attempt: Attempt | null = null;

  private readonly statusState = signal<SubmissionStatus>('idle');
  private readonly pendingState = signal(false);
  private readonly outcomeState = signal<SubmissionOutcome | null>(null);

  readonly status = this.statusState.asReadonly();
  readonly isInFlight = computed(() => this.statusState() !== 'idle');
  readonly hasPendingAttempt = this.pendingState.asReadonly();
  readonly lastOutcome = this.outcomeState.asReadonly();

  /**
   * Sends one command. Ignored while another is in flight. The same key and bytes are reused only
   * when scope and serialised request are identical to a pending attempt with unknown outcome.
   */
  run<TRequest, TResult>(
    scope: string,
    request: TRequest,
    send: SendCommand<TRequest, TResult>,
  ): Observable<TResult> {
    if (this.isInFlight()) return EMPTY;
    const snapshot = deepFreeze(structuredClone(request));
    const bodyText = JSON.stringify(snapshot);

    return defer(() => {
      if (this.isInFlight()) return EMPTY;
      const attempt = this.attemptFor(scope, bodyText);
      this.outcomeState.set(null);
      return defer(() => {
        this.statusState.set('sending');
        return send(snapshot, withAttempt(attempt), attempt.key);
      }).pipe(
        withInProgressRetry<TResult>(this.wait, () => this.statusState.set('waiting')),
        tap(() => this.finish('success')),
        catchError((error: unknown) => throwError(() => this.handleFailure(error))),
        finalize(() => this.statusState.set('idle')),
      );
    });
  }

  /** Discards the pending attempt, e.g. when the form is cleared on purpose. */
  reset(): void {
    this.setAttempt(null);
  }

  private attemptFor(scope: string, bodyText: string): Attempt {
    const current = this.attempt;
    if (current && current.scope === scope && current.bodyText === bodyText) return current;
    const created: Attempt = { key: this.newKey(), scope, bodyText };
    this.setAttempt(created);
    return created;
  }

  private setAttempt(attempt: Attempt | null): void {
    this.attempt = attempt;
    this.pendingState.set(attempt !== null);
  }

  private finish(outcome: SubmissionOutcome): void {
    this.outcomeState.set(outcome);
    if (outcome !== 'unknown') this.setAttempt(null);
  }

  private handleFailure(error: unknown): unknown {
    const outcome = outcomeFor(error);
    this.finish(outcome);
    if (outcome === 'unknown' && isAppError(error) && !error.exhausted) {
      const safe: AppError = { ...error, message: UNKNOWN_OUTCOME_MESSAGE };
      return safe;
    }
    return error;
  }
}

/** Factory for a component field: `readonly guard = createSubmissionGuard();` */
export function createSubmissionGuard(): SubmissionGuard {
  return new SubmissionGuard();
}
