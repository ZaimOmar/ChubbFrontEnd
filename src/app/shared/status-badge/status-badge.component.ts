import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ClaimStatus, StatusAudience } from './claim-status';

interface BadgeStyle {
  readonly label: string;
  readonly icon: string;
  readonly tone: string;
}

const BADGES: Record<ClaimStatus, BadgeStyle> = {
  Submitted: { label: 'Submitted', icon: 'inbox', tone: 'grey' },
  UnderReview: { label: 'Under review', icon: 'search', tone: 'blue' },
  InfoRequested: { label: 'Info requested', icon: 'help_outline', tone: 'amber' },
  PendingDecisionApproval: {
    label: 'Awaiting checker (decision)',
    icon: 'hourglass_top',
    tone: 'purple',
  },
  Approved: { label: 'Approved', icon: 'check_circle', tone: 'green' },
  Rejected: { label: 'Rejected', icon: 'cancel', tone: 'red' },
  PendingSettlementApproval: {
    label: 'Awaiting checker (settlement)',
    icon: 'hourglass_top',
    tone: 'purple-hatched',
  },
  Settling: { label: 'Settling', icon: 'sync', tone: 'teal' },
  Settled: { label: 'Settled', icon: 'paid', tone: 'dark-green' },
};

/** BR-33: the claimant never sees "checker" or "awaiting" for a pending decision. */
const CLAIMANT_LABELS: Partial<Record<ClaimStatus, string>> = {
  PendingDecisionApproval: 'Decision under review',
};

@Component({
  selector: 'app-status-badge',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './status-badge.component.scss',
  template: `
    <span class="badge" [class]="'tone-' + style().tone">
      <mat-icon aria-hidden="true" [fontIcon]="style().icon" />
      {{ label() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<ClaimStatus>();
  readonly audience = input.required<StatusAudience>();

  protected readonly style = computed(() => BADGES[this.status()]);
  protected readonly label = computed(
    () =>
      (this.audience() === 'claimant' ? CLAIMANT_LABELS[this.status()] : undefined) ??
      this.style().label,
  );
}
