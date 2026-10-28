import { HttpContext, HttpContextToken } from '@angular/common/http';

/** One user action: its key and the exact bytes it was created for. */
export interface Attempt {
  readonly key: string;
  readonly scope: string;
  readonly bodyText: string;
  /** Bytes of the first send, recorded by the interceptor to detect a rebuilt body on resend. */
  sentBodyText?: string;
}

export const IDEMPOTENCY_ATTEMPT = new HttpContextToken<Attempt | null>(() => null);

export function withAttempt(attempt: Attempt): HttpContext {
  return new HttpContext().set(IDEMPOTENCY_ATTEMPT, attempt);
}
