import { isRole, Role } from './roles';

export interface DecodedToken {
  readonly sub: string;
  readonly name: string;
  readonly market: string | null;
  readonly roles: readonly Role[];
  /** Expiry in epoch seconds. */
  readonly exp: number;
}

function readPayload(jwt: string): Record<string, unknown> | null {
  const parts = jwt.split('.');
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return typeof payload === 'object' && payload !== null && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/**
 * Reads the payload only; the signature is not verified (the backend does that).
 * The result is for display and routing, never an authorisation decision.
 */
export function decodeToken(jwt: string): DecodedToken | null {
  const payload = readPayload(jwt);
  if (!payload) return null;
  const { sub, name, market, role, exp } = payload;
  if (typeof sub !== 'string' || sub === '' || typeof exp !== 'number') return null;

  const rawRoles: unknown[] = Array.isArray(role) ? role : [role];
  const roles = [...new Set(rawRoles.filter(isRole))];
  if (roles.length === 0) return null;

  return {
    sub,
    name: typeof name === 'string' && name !== '' ? name : sub,
    market: typeof market === 'string' ? market : null,
    roles,
    exp,
  };
}
