import { Injectable, signal } from '@angular/core';

export interface Crumb {
  readonly label: string;
  readonly url?: string;
}

/** Lets a detail page name its own crumb (e.g. the claim number) once the claim has loaded. */
@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  readonly leaf = signal<string | null>(null);
}

const AREAS: Readonly<Record<string, { home: string; list?: Crumb }>> = {
  claimant: { home: '/claimant/home' },
  staff: { home: '/staff/home', list: { label: 'Incoming queue', url: '/staff/queue' } },
  manager: { home: '/manager/home', list: { label: 'Pending approvals', url: '/manager/pending' } },
};

/** Breadcrumb trail for a URL: Home, the list page, then the page itself. Display only. */
export function crumbsFor(
  url: string,
  leaf: string | null,
  listUrl: string | null = null,
): readonly Crumb[] {
  const [area, page, id, action] = url.split(/[?#]/)[0].split('/').filter(Boolean);
  const config = AREAS[area ?? ''];
  if (!config) return [];
  const home: Crumb = { label: 'Home', url: config.home };
  if (!page || page === 'home') return [{ label: 'Home' }];
  if (area === 'claimant') {
    const claims: Crumb = { label: 'My claims', url: listUrl ?? '/claimant/claims' };
    if (page === 'report') return [home, { label: 'Report incident' }];
    if (page === 'claims' && !id) return [home, { label: 'My claims' }];
    if (page === 'claims') return [home, claims, { label: leaf ?? 'Claim' }];
    return [home];
  }
  const fromOutstanding = area === 'manager' && !!listUrl?.startsWith('/manager/outstanding');
  const list =
    config.list && listUrl
      ? {
          label: fromOutstanding ? 'Outstanding claims' : config.list.label,
          url: listUrl,
        }
      : config.list;
  if (!list) return [home];
  if (page === 'outstanding' && area === 'manager') return [home, { label: 'Outstanding claims' }];
  if (page === 'queue' || page === 'pending') return [home, { label: list.label }];
  if (page === 'claims' && action === 'propose') {
    return [
      home,
      list,
      { label: leaf ?? 'Claim', url: `/${area}/claims/${id}` },
      { label: 'Propose decision' },
    ];
  }
  if (page === 'claims') return [home, list, { label: leaf ?? 'Claim' }];
  return [home];
}
