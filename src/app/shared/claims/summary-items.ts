import { ClaimsClaimantClaimView, ClaimsStaffClaimView } from '../../api/model/models';
import { partyLabel } from '../../core/claims/party-label';
import { DateTimePipe } from '../pipes/date-time.pipe';
import { MoneyPipe } from '../pipes/money.pipe';
import { SummaryItem } from './claim-summary-card.component';

const money = new MoneyPipe();
const dates = new DateTimePipe();

/** "Property claim - SG - Submitted 28 Oct 2026" */
export function claimSubtitle(c: { type: string; market: string; submittedAt: string }): string {
  return `${c.type} claim · ${c.market} · Submitted ${dates.transform(c.submittedAt, 'date')}`;
}

export function claimantSummaryItems(c: ClaimsClaimantClaimView): SummaryItem[] {
  return [
    { label: 'Type', value: c.type },
    { label: 'Market', value: c.market },
    { label: 'Incident date', value: dates.transform(c.incidentDate, 'date') },
    { label: 'Amount claimed', value: money.transform(c.estimatedAmount, c.currency) },
    { label: 'Submitted', value: dates.transform(c.submittedAt) },
    { label: 'Description', value: c.description },
  ];
}

export function staffSummaryItems(
  c: ClaimsStaffClaimView,
  currentUserId: string | undefined,
): SummaryItem[] {
  const optional = (amount: number | null | undefined): string =>
    amount === null || amount === undefined ? 'Not set' : money.transform(amount, c.currency);
  return [
    { label: 'Type', value: c.type },
    { label: 'Market', value: c.market },
    { label: 'Incident date', value: dates.transform(c.incidentDate, 'date') },
    { label: 'Amount claimed', value: money.transform(c.estimatedAmount, c.currency) },
    { label: 'Submitted', value: dates.transform(c.submittedAt) },
    {
      label: 'Assigned to',
      value: partyLabel(c.assignedOfficerId, 'Officer', currentUserId) || 'Unassigned',
    },
    { label: 'Assessed amount', value: optional(c.assessedAmount) },
    { label: 'Net payable', value: optional(c.netPayable) },
    { label: 'Reserve', value: money.transform(c.reserve, c.currency) },
    { label: 'Description', value: c.description },
  ];
}
