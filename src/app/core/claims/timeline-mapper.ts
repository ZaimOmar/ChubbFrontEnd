import { ClaimsClaimantTimelineItem, ClaimsStaffTimelineEntry } from '../../api/model/models';
import { TimelineEntry } from '../../shared/claim-timeline/timeline-entry.model';
import { partyLabel } from './party-label';

export function toClaimantTimeline(items: readonly ClaimsClaimantTimelineItem[]): TimelineEntry[] {
  return items.map((item) => ({
    id: item.id,
    occurredAt: item.occurredAt,
    summary: item.summary,
    visibility: 'Public',
    kind: 'Standard',
  }));
}

export function toStaffTimeline(
  entries: readonly ClaimsStaffTimelineEntry[],
  currentUserId: string | undefined,
): TimelineEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    occurredAt: entry.occurredAt,
    summary: entry.summary,
    visibility: entry.visibility,
    kind:
      entry.eventType === 'Refused'
        ? 'Refused'
        : entry.eventType === 'Correction'
          ? 'Correction'
          : 'Standard',
    actorRole: entry.actorRole,
    actorName: partyLabel(entry.actorId, entry.actorRole, currentUserId),
    reason: entry.reason ?? undefined,
    makerName: entry.makerId ? partyLabel(entry.makerId, 'Officer', currentUserId) : undefined,
    checkerName: entry.checkerId
      ? partyLabel(entry.checkerId, 'Manager', currentUserId)
      : undefined,
    proposalId: entry.proposalId ?? undefined,
    correctedBy: entry.referencedEntryId ?? undefined,
  }));
}
