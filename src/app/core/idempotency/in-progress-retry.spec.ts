import { fakeAsync, tick } from '@angular/core/testing';
import { Observable, Subject, defer, of, throwError, timer } from 'rxjs';
import { AppError } from '../http/app-error';
import { withInProgressRetry } from './in-progress-retry';

const inProgress = (retryAfterSeconds?: number): AppError => ({
  status: 409,
  kind: 'idempotency-in-progress',
  message: 'Still processing. Please wait.',
  retryAfterSeconds,
});

describe('WithInProgressRetry', () => {
  function run(
    errors: readonly (AppError | null)[],
    waits: number[] = [],
    onWait: () => void = () => undefined,
  ): { result: unknown[]; error: unknown; calls: () => number } {
    let calls = 0;
    const source = defer(() => {
      const next = errors[Math.min(calls, errors.length - 1)];
      calls++;
      return next ? throwError(() => next) : of('ok');
    });
    const out = { result: [] as unknown[], error: undefined as unknown, calls: () => calls };
    source
      .pipe(
        withInProgressRetry<string>((ms) => {
          waits.push(ms);
          return of(0);
        }, onWait),
      )
      .subscribe({ next: (v) => out.result.push(v), error: (e: unknown) => (out.error = e) });
    return out;
  }

  it('409InProgress_WaitsRetryAfterThenResendsSameKey', () => {
    const waits: number[] = [];
    const out = run([inProgress(3), null], waits);
    expect(waits).toEqual([3000]);
    expect(out.calls()).toBe(2);
    expect(out.result).toEqual(['ok']);
  });

  it('NoRetryAfterHeader_Waits1Second', () => {
    const waits: number[] = [];
    run([inProgress(), null], waits);
    expect(waits).toEqual([1000]);
  });

  it('RetryAfterOutOfRange_Clamped', () => {
    const waits: number[] = [];
    run([inProgress(0), inProgress(99), null], waits);
    expect(waits).toEqual([1000, 10000]);
  });

  it('FiveWaitsThenGivesUp_Exhausted', () => {
    const waits: number[] = [];
    const out = run([inProgress(1)], waits);
    expect(waits.length).toBe(5);
    expect(out.calls()).toBe(6);
    expect((out.error as AppError).kind).toBe('idempotency-in-progress');
    expect((out.error as AppError).exhausted).toBeTrue();
    expect((out.error as AppError).message).toContain('Please try again in a moment');
  });

  it('OtherErrors_PassThroughWithoutWaiting', () => {
    const waits: number[] = [];
    const business: AppError = { status: 409, kind: 'conflict', message: 'm' };
    const out = run([business], waits);
    expect(waits).toEqual([]);
    expect(out.calls()).toBe(1);
    expect(out.error).toBe(business);
  });

  it('DuringWait_CallsOnWait', () => {
    const onWait = jasmine.createSpy('onWait');
    run([inProgress(1), null], [], onWait);
    expect(onWait).toHaveBeenCalledTimes(1);
  });

  it('Unsubscribe_CancelsWait', fakeAsync(() => {
    let calls = 0;
    const source: Observable<string> = defer(() => {
      calls++;
      return throwError(() => inProgress(1));
    });
    const subscription = source
      .pipe(
        withInProgressRetry<string>(
          (ms) => timer(ms),
          () => undefined,
        ),
      )
      .subscribe({ error: () => undefined });
    subscription.unsubscribe();
    tick(20000);
    expect(calls).toBe(1);
  }));

  it('SuccessFirstTime_NoWait', () => {
    const gate = new Subject<string>();
    const out: string[] = [];
    gate
      .pipe(
        withInProgressRetry<string>(
          () => of(0),
          () => undefined,
        ),
      )
      .subscribe((v) => out.push(v));
    gate.next('a');
    expect(out).toEqual(['a']);
  });
});
