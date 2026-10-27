import { Role } from '../auth/roles';

export interface NavItem {
  readonly label: string;
  readonly url: string;
}

export interface NavGroup {
  /** Shown only when the user has more than one group (dual-role user). */
  readonly heading: string;
  readonly items: readonly NavItem[];
}

const CLAIMANT: NavGroup = {
  heading: 'Claimant',
  items: [
    { label: 'Report incident', url: '/claimant/report' },
    { label: 'My claims', url: '/claimant/claims' },
  ],
};

const OFFICER: NavGroup = {
  heading: 'Officer',
  items: [
    { label: 'Incoming queue', url: '/staff/queue' },
    { label: 'My workload', url: '/staff/workload' },
  ],
};

const MANAGER: NavGroup = {
  heading: 'Manager',
  items: [
    { label: 'Pending approvals', url: '/manager/pending' },
    { label: 'Outstanding', url: '/manager/outstanding' },
    { label: 'Exposure', url: '/manager/exposure' },
  ],
};

/** Mirrors 00 section 1. Navigation is UX only; the backend enforces access. */
export function navGroupsFor(roles: readonly Role[]): readonly NavGroup[] {
  const groups: NavGroup[] = [];
  if (roles.includes('Claimant')) groups.push(CLAIMANT);
  if (roles.includes('Officer')) groups.push(OFFICER);
  if (roles.includes('Manager')) groups.push(MANAGER);
  return groups;
}

const AREA_LABELS: Record<string, string> = {
  claimant: 'Claimant',
  staff: 'Officer',
  manager: 'Manager',
};

/** Label for the URL's first segment, or an empty string outside a role area. */
export function areaLabelFor(url: string): string {
  const firstSegment = url.split(/[?#]/)[0].split('/')[1] ?? '';
  return AREA_LABELS[firstSegment] ?? '';
}
