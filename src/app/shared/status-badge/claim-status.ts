/** Literal values from mockup 00 until the generated ClaimStatus type exists (spec 5.1). */
export const CLAIM_STATUSES = [
  'Submitted',
  'UnderReview',
  'InfoRequested',
  'PendingDecisionApproval',
  'Approved',
  'Rejected',
  'PendingSettlementApproval',
  'Settling',
  'Settled',
] as const;

export type ClaimStatus = (typeof CLAIM_STATUSES)[number];
export type StatusAudience = 'staff' | 'claimant';
