export const ROLES = ['Claimant', 'Officer', 'Manager'] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

/** Area root for a role set. Officer wins for the dual-role user (BR-32). UX routing only. */
export function landingUrlFor(roles: readonly Role[]): string {
  if (roles.includes('Officer')) return '/staff/queue';
  if (roles.includes('Manager')) return '/manager/home';
  if (roles.includes('Claimant')) return '/claimant/home';
  return '/login';
}
