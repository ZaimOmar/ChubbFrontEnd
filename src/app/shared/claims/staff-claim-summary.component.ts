import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ClaimsStaffClaimView } from '../../api/model/models';
import { DateTimePipe } from '../pipes/date-time.pipe';
import { MoneyPipe } from '../pipes/money.pipe';

/** Claim and money cards. Figures are shown exactly as the server returns them (no client maths). */
@Component({
  selector: 'app-staff-claim-summary',
  imports: [DateTimePipe, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let c = claim();
    <h3 class="pane-title">Claim summary</h3>
    <dl>
      <dt class="eyebrow">Type / market</dt>
      <dd>{{ c.type }} - {{ c.market }}</dd>
      <dt class="eyebrow">Incident</dt>
      <dd>{{ c.incidentDate | dateTime: 'date' }}</dd>
      <dt class="eyebrow">Submitted</dt>
      <dd>{{ c.submittedAt | dateTime }}</dd>
      <dt class="eyebrow">Estimated</dt>
      <dd>{{ c.estimatedAmount | money: c.currency }}</dd>
      <dt class="eyebrow">Assessed</dt>
      <dd>
        {{
          c.assessedAmount === null || c.assessedAmount === undefined
            ? 'Not set'
            : (c.assessedAmount | money: c.currency)
        }}
      </dd>
      <dt class="eyebrow">Net payable</dt>
      <dd>
        {{
          c.netPayable === null || c.netPayable === undefined
            ? 'Not set'
            : (c.netPayable | money: c.currency)
        }}
      </dd>
      <dt class="eyebrow">Reserve</dt>
      <dd>{{ c.reserve | money: c.currency }}</dd>
      <dt class="eyebrow">Description</dt>
      <dd class="desc">{{ c.description }}</dd>
    </dl>
  `,
  styles: `
    dl {
      margin: 0;
      display: grid;
      gap: 2px;
      font: 400 12px/16px var(--font-mono);
    }
    dd {
      margin: 0 0 8px;
      color: var(--slate-800);
      font-weight: 700;
    }
    .desc {
      font-weight: 400;
    }
  `,
})
export class StaffClaimSummaryComponent {
  readonly claim = input.required<ClaimsStaffClaimView>();
}
