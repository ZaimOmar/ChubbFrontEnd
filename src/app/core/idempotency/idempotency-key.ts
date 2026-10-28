import { InjectionToken } from '@angular/core';

const HEX = '0123456789abcdef';

/** Builds a v4 UUID from `getRandomValues` for contexts where `randomUUID` is missing (plain http). */
function uuidFromRandomValues(source: Crypto): string {
  const bytes = source.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  let text = '';
  bytes.forEach((byte, index) => {
    if (index === 4 || index === 6 || index === 8 || index === 10) text += '-';
    text += HEX[byte >> 4] + HEX[byte & 0x0f];
  });
  return text;
}

/** One opaque key per user action (BR-79). Always from a CSPRNG, never `Math.random`. */
export function createIdempotencyKey(source: Crypto = globalThis.crypto): string {
  return typeof source.randomUUID === 'function'
    ? source.randomUUID()
    : uuidFromRandomValues(source);
}

/** Replaced in tests so keys are deterministic. */
export const IDEMPOTENCY_KEY_FACTORY = new InjectionToken<() => string>('IDEMPOTENCY_KEY_FACTORY', {
  providedIn: 'root',
  factory: () => () => createIdempotencyKey(),
});
