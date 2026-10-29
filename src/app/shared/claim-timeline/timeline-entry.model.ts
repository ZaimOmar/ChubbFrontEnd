import { Role } from '../../core/auth/roles';

export type TimelineAudience = 'staff' | 'claimant';
export type TimelineVisibility = 'Public' | 'Internal';
export type TimelineEntryKind = 'Standard' | 'Refused' | 'Correction';

/**
 * Local shape until the generated timeline schema exists (foundation spec 5.1, step 10); replace
 * it with the generated type then.
 */
export interface TimelineEntry {
  readonly id: string;
  /** ISO 8601 UTC. */
  readonly occurredAt: string;
  readonly summary: string;
  readonly visibility: TimelineVisibility;
  readonly kind: TimelineEntryKind;
  readonly actorName?: string;
  readonly actorRole?: Role | 'System';
  readonly reason?: string;
  readonly makerName?: string;
  readonly checkerName?: string;
  readonly proposalId?: string;
  readonly correctedBy?: string;
}
