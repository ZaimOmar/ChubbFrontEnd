import { isAppError } from '../http/app-error';

const GENERIC = 'Something went wrong. Please try again.';

/** Screen text by problem `type` (claims-screens spec 5.3). Classification is by type, never by status alone. */
const BY_TYPE: Readonly<Record<string, string>> = {
  'claim-already-assigned':
    'This claim was already picked up by another officer. The list has been refreshed.',
  'invalid-transition': 'This claim changed while you were working. The page has been refreshed.',
  'concurrency-conflict': 'This claim changed while you were working. The page has been refreshed.',
  'proposal-pending': 'A proposal is already waiting for a manager.',
  'proposal-not-open':
    'This decision was already handled (confirmed, sent back or withdrawn). The queue has been refreshed.',
  'maker-cannot-check': 'You cannot confirm your own proposal. Another manager must check it.',
  'not-assigned-officer': 'You are not the assigned officer for this claim.',
  'policy-not-found': 'Policy not found for this market.',
  'market-mismatch': 'The market does not match the policy.',
  'incident-date-in-future': 'Incident date cannot be in the future.',
  'incident-outside-policy-period': 'The incident date is outside the policy period.',
  'currency-mismatch': 'The currency does not match the policy.',
  'assessed-amount-required': 'Set an assessed amount before proposing an approval.',
  'payable-zero': 'Net payable is 0, approval is not possible. Reject instead.',
  'justification-required': 'Explain why the amount is above the estimate.',
  'reason-code-invalid': 'Choose a valid rejection reason.',
  'same-officer': 'The same officer cannot do both steps.',
  'phase-2-not-enabled': 'This action is not available yet.',
};

/** Problem types after which the screen should reload because the claim moved on. */
const REFRESH_TYPES: readonly string[] = [
  'claim-already-assigned',
  'invalid-transition',
  'concurrency-conflict',
  'proposal-pending',
  'proposal-not-open',
];

export function describeError(error: unknown): string {
  if (!isAppError(error)) return GENERIC;
  return (error.problemType && BY_TYPE[error.problemType]) || error.message;
}

export function shouldRefresh(error: unknown): boolean {
  return isAppError(error) && !!error.problemType && REFRESH_TYPES.includes(error.problemType);
}

export function fieldMessages(error: unknown): readonly string[] {
  if (!isAppError(error) || !error.fieldErrors) return [];
  return Object.values(error.fieldErrors).flat();
}
