import { HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ClaimsApi } from '../../api/api/claims.service';
import {
  ClaimsAssessedAmountRequest,
  ClaimsClaimantClaimPage,
  ClaimsClaimantClaimView,
  ClaimsClaimantTimelineItem,
  ClaimsProposeDecisionRequest,
  ClaimsSendBackRequest,
  ClaimsStaffClaimPage,
  ClaimsStaffClaimView,
  ClaimsStaffTimelineEntry,
  ClaimsSubmitClaimRequest,
} from '../../api/model/models';
import { ClaimFilters } from '../../shared/claims/claim-filters';
import { SubmissionGuard } from '../idempotency/submission-guard';
import { ClaimView } from './claim-views';

type MineStatus = Parameters<ClaimsApi['listMyClaims']>[2];

export interface ListParams {
  readonly status?: ClaimsStaffClaimView['status'];
  readonly assigneeId?: string;
  readonly outstanding?: boolean;
  readonly filters?: ClaimFilters;
  readonly page: number;
  readonly pageSize: number;
  readonly sort?: 'newest' | 'oldest';
}

/** Thin facade over the generated Claims client. Every command goes through a SubmissionGuard. */
@Injectable({ providedIn: 'root' })
export class ClaimsFacade {
  private readonly api = inject(ClaimsApi);

  getClaim(id: string): Observable<ClaimView> {
    return this.api.getClaim(id);
  }

  getTimeline(id: string): Observable<ClaimsClaimantTimelineItem[] | ClaimsStaffTimelineEntry[]> {
    return this.api.getClaimTimeline(id);
  }

  /** Oldest first is requested explicitly (BR-76); the page is never sorted on the client. */
  listOldest(params: ListParams): Observable<ClaimsStaffClaimPage> {
    const f = params.filters ?? {};
    return this.api.listClaims(
      f.market,
      f.type,
      params.status ?? (f.status as ClaimsStaffClaimView['status'] | undefined),
      params.outstanding,
      params.assigneeId,
      f.claimNumber,
      f.minAmount,
      f.maxAmount,
      f.submittedFrom,
      f.submittedTo,
      params.sort ?? 'oldest',
      params.page,
      params.pageSize,
    );
  }

  /** Claims assigned to an officer (up to 100), oldest first. */
  listAssigned(assigneeId: string): Observable<ClaimsStaffClaimPage> {
    return this.api.listClaims(
      undefined,
      undefined,
      undefined,
      undefined,
      assigneeId,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'oldest',
      1,
      100,
    );
  }

  /** The signed-in claimant's own claims, newest first. */
  listMine(
    page: number,
    pageSize: number,
    sort: 'newest' | 'oldest' = 'newest',
    filters: ClaimFilters = {},
  ): Observable<ClaimsClaimantClaimPage> {
    return this.api.listMyClaims(
      filters.market,
      filters.type,
      filters.status as MineStatus,
      filters.claimNumber,
      filters.minAmount,
      filters.maxAmount,
      filters.submittedFrom,
      filters.submittedTo,
      sort,
      page,
      pageSize,
    );
  }

  submit(
    guard: SubmissionGuard,
    request: ClaimsSubmitClaimRequest,
  ): Observable<ClaimsClaimantClaimView> {
    return guard.run('create-claim', request, (body, context, key) =>
      this.api.submitClaim(key, body, 'body', false, { context }),
    );
  }

  assign(guard: SubmissionGuard, id: string): Observable<ClaimsStaffClaimView> {
    return guard.run(`assign:${id}`, {}, (body, context, key) =>
      this.api.assignClaim(key, id, body, 'body', false, { context }),
    );
  }

  assess(
    guard: SubmissionGuard,
    id: string,
    request: ClaimsAssessedAmountRequest,
  ): Observable<ClaimsStaffClaimView> {
    return guard.run(`assess:${id}`, request, (body, context, key) =>
      this.api.recordAssessedAmount(key, id, body, 'body', false, { context }),
    );
  }

  propose(
    guard: SubmissionGuard,
    id: string,
    request: ClaimsProposeDecisionRequest,
  ): Observable<ClaimsStaffClaimView> {
    return guard.run(`propose:${id}`, request, (body, context, key) =>
      this.api.proposeDecision(key, id, body, 'body', false, { context }),
    );
  }

  /** The body is empty: the proposal id travels in the path only. */
  confirm(guard: SubmissionGuard, id: string, pid: string): Observable<ClaimsStaffClaimView> {
    return guard.run(`confirm:${id}:${pid}`, {}, (_body, context: HttpContext, key) =>
      this.api.confirmDecision(key, id, pid, 'body', false, { context }),
    );
  }

  sendBack(
    guard: SubmissionGuard,
    id: string,
    pid: string,
    request: ClaimsSendBackRequest,
  ): Observable<ClaimsStaffClaimView> {
    return guard.run(`send-back:${id}:${pid}`, request, (body, context, key) =>
      this.api.sendBackDecision(key, id, pid, body, 'body', false, { context }),
    );
  }
}
