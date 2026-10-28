import { InjectionToken } from '@angular/core';
import { Observable, timer } from 'rxjs';

/** Waits the given milliseconds; replaced in tests so no real time passes. */
export const IDEMPOTENCY_WAIT = new InjectionToken<(ms: number) => Observable<unknown>>(
  'IDEMPOTENCY_WAIT',
  { providedIn: 'root', factory: () => (ms: number) => timer(ms) },
);
