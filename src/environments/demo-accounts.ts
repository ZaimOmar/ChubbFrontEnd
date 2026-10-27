import { DemoAccount } from '../app/core/config/app-config';

/**
 * Seeded dev users (mockup 01 v2). Imported only by environment.development.ts, so production
 * builds never contain these emails. Emails only: no password is ever stored.
 */
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { label: 'Claimant (SG) - Alex Claimant', email: 'claimant@chubb.test' },
  { label: 'Claimant 2 (HK) - Bao Claimant', email: 'claimant2@chubb.test' },
  { label: 'Officer - Olivia Officer', email: 'officer@chubb.test' },
  { label: 'Officer 2 - Omar Officer', email: 'officer2@chubb.test' },
  { label: 'Manager - Marcus Manager', email: 'manager@chubb.test' },
  { label: 'Officer + Manager (dual-role) - Dana Dual', email: 'officer.manager@chubb.test' },
];
