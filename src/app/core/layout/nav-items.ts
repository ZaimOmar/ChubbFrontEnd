import { Role } from '../auth/roles';

export interface NavItem {
  readonly label: string;
  readonly url: string;
  /** Material Icons Outlined glyph shown in the rail. */
  readonly icon: string;
}

export interface NavGroup {
  /** Shown only when the user has more than one group (dual-role user). */
  readonly heading: string;
  readonly items: readonly NavItem[];
}

const CLAIMANT: NavGroup = {
  heading: 'Claimant',
  items: [
    { label: 'Home', url: '/claimant/home', icon: 'dashboard' },
    { label: 'Report incident', url: '/claimant/report', icon: 'edit_note' },
    { label: 'My claims', url: '/claimant/claims', icon: 'list_alt' },
  ],
};

const OFFICER: NavGroup = {
  heading: 'Officer',
  items: [
    { label: 'Home', url: '/staff/home', icon: 'dashboard' },
    { label: 'Incoming queue', url: '/staff/queue', icon: 'inbox' },
  ],
};

const MANAGER: NavGroup = {
  heading: 'Manager',
  items: [
    { label: 'Home', url: '/manager/home', icon: 'dashboard' },
    { label: 'Pending approvals', url: '/manager/pending', icon: 'task_alt' },
    { label: 'Outstanding claims', url: '/manager/outstanding', icon: 'pending_actions' },
  ],
};

/** Mirrors 00 v2 section 1; items whose screens are not built yet are hidden.  Navigation is UX only; the backend enforces access. */
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
