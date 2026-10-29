import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ClaimStatus } from '../status-badge/claim-status';

type Audience = 'staff' | 'claimant';

const STAFF_STEPS = ['Submitted', 'Under review', 'Decision check', 'Decided'];
const CLAIMANT_STEPS = ['Submitted', 'Under review', 'Decided'];

/** Display-only progress of a claim through the workflow (reference section 12). */
@Component({
  selector: 'app-claim-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './claim-stepper.component.scss',
  template: `
    <ol class="stepper" [attr.aria-label]="'Claim progress: ' + currentLabel()">
      @for (step of steps(); track step; let i = $index) {
        <li
          class="step"
          [class.done]="i < index()"
          [class.active]="i === index()"
          [attr.aria-current]="i === index() ? 'step' : null"
        >
          <span class="dot" aria-hidden="true">{{ i + 1 }}</span>
          <span class="label">{{ step }}</span>
        </li>
        @if (i < steps().length - 1) {
          <li class="line" [class.done]="i < index()" aria-hidden="true"></li>
        }
      }
    </ol>
  `,
})
export class ClaimStepperComponent {
  readonly status = input.required<ClaimStatus>();
  readonly audience = input<Audience>('staff');

  protected readonly steps = computed(() => {
    const base = this.audience() === 'claimant' ? [...CLAIMANT_STEPS] : [...STAFF_STEPS];
    const final = this.status();
    if (final === 'Approved' || final === 'Rejected') base[base.length - 1] = final;
    return base;
  });

  protected readonly index = computed(() => {
    const claimant = this.audience() === 'claimant';
    switch (this.status()) {
      case 'Submitted':
        return 0;
      case 'PendingDecisionApproval':
        return claimant ? 1 : 2;
      case 'UnderReview':
      case 'InfoRequested':
        return 1;
      default:
        return this.steps().length - 1;
    }
  });

  protected readonly currentLabel = computed(() => this.steps()[this.index()]);
}
