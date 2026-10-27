export const FIXED_NOW_MS = Date.UTC(2026, 9, 28, 12, 0, 0);
export const FIXED_NOW_SECONDS = FIXED_NOW_MS / 1000;

function base64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Unsigned test token: the client only reads the payload. */
export function makeJwt(claims: Record<string, unknown>): string {
  const payload = {
    sub: 'u-1',
    name: 'Aisha Tan',
    market: 'SG',
    role: 'Officer',
    exp: FIXED_NOW_SECONDS + 1800,
    ...claims,
  };
  return `${base64Url('{"alg":"none"}')}.${base64Url(JSON.stringify(payload))}.sig`;
}
