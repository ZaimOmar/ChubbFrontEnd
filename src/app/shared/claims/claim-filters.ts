import { Params } from '@angular/router';
import { FilterChip } from './filter-chips.component';

export const FILTER_MARKETS = ['SG', 'HK', 'MY', 'TH', 'ID', 'AU'] as const;
export const FILTER_TYPES = ['Motor', 'Property'] as const;

export type FilterMarket = (typeof FILTER_MARKETS)[number];
export type FilterType = (typeof FILTER_TYPES)[number];

/** Server-side list filters; each maps to a query parameter of the same name. */
export interface ClaimFilters {
  readonly claimNumber?: string;
  readonly market?: FilterMarket;
  readonly type?: FilterType;
  readonly status?: string;
  readonly minAmount?: number;
  readonly maxAmount?: number;
  /** ISO dates (yyyy-mm-dd), inclusive. */
  readonly submittedFrom?: string;
  readonly submittedTo?: string;
}

export type FilterKey = keyof ClaimFilters;
export type FilterField = 'claimNumber' | 'market' | 'type' | 'amount' | 'age' | 'status';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}
function amount(value: unknown): number | undefined {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}
function date(value: unknown): string | undefined {
  return typeof value === 'string' && ISO_DATE.test(value) ? value : undefined;
}

/** Reads filters from the URL; unknown or malformed values are dropped. */
export function filtersFromParams(params: Params, statuses: readonly string[]): ClaimFilters {
  const status = text(params['status']);
  return {
    claimNumber: text(params['claimNumber']),
    market: FILTER_MARKETS.find((m) => m === params['market']),
    type: FILTER_TYPES.find((t) => t === params['type']),
    status: status && statuses.includes(status) ? status : undefined,
    minAmount: amount(params['minAmount']),
    maxAmount: amount(params['maxAmount']),
    submittedFrom: date(params['submittedFrom']),
    submittedTo: date(params['submittedTo']),
  };
}

/** Query params for the URL; empty values are `null` so `merge` removes them. */
export function filtersToParams(filters: ClaimFilters): Params {
  return {
    claimNumber: filters.claimNumber ?? null,
    market: filters.market ?? null,
    type: filters.type ?? null,
    status: filters.status ?? null,
    minAmount: filters.minAmount ?? null,
    maxAmount: filters.maxAmount ?? null,
    submittedFrom: filters.submittedFrom ?? null,
    submittedTo: filters.submittedTo ?? null,
  };
}

export function hasFilters(filters: ClaimFilters): boolean {
  return Object.values(filters).some((v) => v !== undefined);
}

export function chipsFor(filters: ClaimFilters): readonly FilterChip[] {
  const chips: FilterChip[] = [];
  const add = (key: FilterKey, label: string, value: unknown): void => {
    if (value !== undefined) chips.push({ key, label: `${label}: ${value}` });
  };
  add('claimNumber', 'Claim', filters.claimNumber);
  add('market', 'Market', filters.market);
  add('type', 'Type', filters.type);
  add('minAmount', 'Min amount', filters.minAmount);
  add('maxAmount', 'Max amount', filters.maxAmount);
  add('submittedFrom', 'From', filters.submittedFrom);
  add('submittedTo', 'To', filters.submittedTo);
  add('status', 'Status', filters.status);
  return chips;
}

export function withoutFilter(filters: ClaimFilters, key: string): ClaimFilters {
  return { ...filters, [key]: undefined };
}
