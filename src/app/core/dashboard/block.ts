import { DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { AppError, isAppError } from '../http/app-error';

const UNEXPECTED: AppError = {
  status: 0,
  kind: 'unexpected',
  message: 'Something went wrong. Please try again.',
};

/** One independently loading block of a page: own value, loading and error state, reloadable. */
export function createBlock<T>(fetch: () => Observable<T>) {
  const destroyRef = inject(DestroyRef);
  const value = signal<T | null>(null);
  const loading = signal(true);
  const error = signal<AppError | null>(null);

  function reload(): void {
    loading.set(true);
    error.set(null);
    fetch()
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe({
        next: (result) => {
          value.set(result);
          loading.set(false);
        },
        error: (e: unknown) => {
          error.set(isAppError(e) ? e : UNEXPECTED);
          loading.set(false);
        },
      });
  }

  return {
    value: value.asReadonly(),
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    reload,
  };
}
