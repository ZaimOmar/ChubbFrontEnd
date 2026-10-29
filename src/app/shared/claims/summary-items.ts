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
    { section: 'Claim', label: 'Type', value: c.type },
    { section: 'Claim', label: 'Market', value: c.market },
    { section: 'Claim', label: 'Incident date', value: dates.transform(c.incidentDate, 'date') },
    { section: 'Claim', label: 'Submitted', value: dates.transform(c.submittedAt) },
    {
      section: 'Money',
      label: 'Amount claimed',
      value: money.transform(c.estimatedAmount, c.currency),
      numeric: true,
      emphasis: true,
    },
    { section: 'Description', label: 'Description', value: c.description },
  ];
}

export function staffSummaryItems(
  c: ClaimsStaffClaimView,
  currentUserId: string | undefined,
): SummaryItem[] {
  const optional = (label: string, amount: number | null | undefined): SummaryItem => ({
    section: 'Money',
    label,
    value: amount === null || amount === undefined ? '' : money.transform(amount, c.currency),
    numeric: true,
    unset: amount === null || amount === undefined,
  });
  return [
    { section: 'Claim', label: 'Type', value: c.type },
    { section: 'Claim', label: 'Market', value: c.market },
    { section: 'Claim', label: 'Incident date', value: dates.transform(c.incidentDate, 'date') },
    { section: 'Claim', label: 'Submitted', value: dates.transform(c.submittedAt) },
    {
      section: 'Money',
      label: 'Amount claimed',
      value: money.transform(c.estimatedAmount, c.currency),
      numeric: true,
      emphasis: true,
    },
    optional('Assessed amount', c.assessedAmount),
    optional('Net payable', c.netPayable),
    {
      section: 'Money',
      label: 'Reserve',
      value: money.transform(c.reserve, c.currency),
      numeric: true,
    },
    {
      section: 'Handling',
      label: 'Assigned to',
      value: partyLabel(c.assignedOfficerId, 'Officer', currentUserId) || 'Unassigned',
    },
    { section: 'Description', label: 'Description', value: c.description },
  ];
}
