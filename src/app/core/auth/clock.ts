import { InjectionToken } from '@angular/core';

/** Current time in epoch milliseconds; replaced in tests so expiry is deterministic. */
export const NOW = new InjectionToken<() => number>('NOW', {
  providedIn: 'root',
  factory: () => () => Date.now(),
});
