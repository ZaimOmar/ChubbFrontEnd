export type AppErrorKind =
  | 'unauthenticated'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'validation'
  | 'server'
  | 'network'
  | 'unexpected';

export interface AppError {
  readonly status: number;
  readonly kind: AppErrorKind;
  /** Safe, user-facing text. Never the server's `detail`. */
  readonly message: string;
  /** Problem `type` as sent by the server, for screen-specific allow-lists. */
  readonly problemType?: string;
  readonly fieldErrors?: Readonly<Record<string, readonly string[]>>;
  readonly correlationId?: string;
}

export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as AppError).kind === 'string' &&
    typeof (value as AppError).status === 'number' &&
    typeof (value as AppError).message === 'string'
  );
}
