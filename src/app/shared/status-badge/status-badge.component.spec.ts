import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClaimStatus, CLAIM_STATUSES } from './claim-status';
import { StatusBadgeComponent } from './status-badge.component';

const LABELS: Record<ClaimStatus, string> = {
  Submitted: 'Submitted',
  UnderReview: 'Under review',
  InfoRequested: 'Info requested',
  PendingDecisionApproval: 'Awaiting checker (decision)',
  Approved: 'Approved',
  Rejected: 'Rejected',
  PendingSettlementApproval: 'Awaiting checker (settlement)',
  Settling: 'Settling',
  Settled: 'Settled',
};

describe('StatusBadge', () => {
  function render(status: ClaimStatus, audience: 'staff' | 'claimant' = 'staff'): HTMLElement {
    const fixture: ComponentFixture<StatusBadgeComponent> =
      TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('status', status);
    fixture.componentRef.setInput('audience', audience);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('AllNineStatuses_ShowLabelIconAndAccessibleName', () => {
    expect(CLAIM_STATUSES.length).toBe(9);
    for (const status of CLAIM_STATUSES) {
      const el = render(status);
      const icon = el.querySelector('mat-icon');
      expect(el.textContent).toContain(LABELS[status]);
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
      expect(icon?.textContent?.trim() || icon?.getAttribute('fonticon')).toBeTruthy();
    }
  });

  it('ClaimantAudience_PendingDecisionApproval_ShowsDecisionUnderReview', () => {
    const el = render('PendingDecisionApproval', 'claimant');
    expect(el.textContent).toContain('Decision under review');
    expect(el.textContent).not.toMatch(/checker|awaiting/i);
  });

  it('ClaimantAudience_OtherStatuses_KeepStandardLabel', () => {
    expect(render('UnderReview', 'claimant').textContent).toContain('Under review');
  });
});
