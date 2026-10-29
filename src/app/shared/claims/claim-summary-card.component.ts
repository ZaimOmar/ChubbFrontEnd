import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface SummaryItem {
  readonly label: string;
  readonly value: string;
}

/** Claim summary as a label/value list: small uppercase labels, values in the body font. */
@Component({
  selector: 'app-claim-summary-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
    h2 {
      margin-bottom: 16px;
    }
    dl {
      margin: 0;
      display: grid;
      gap: 12px;
    }
    dt {
      font: 700 10px/16px var(--font-mono);
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--slate-400);
    }
    dd {
      margin: 0;
      font: 400 14px/20px var(--font-sans);
      color: var(--slate-800);
      overflow-wrap: anywhere;
    }
  `,
  template: `
    <section class="card" aria-labelledby="summary-title">
      <h2 id="summary-title">Claim summary</h2>
      <dl>
        @for (item of items(); track item.label) {
          <div>
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
          </div>
        }
      </dl>
    </section>
  `,
})
export class ClaimSummaryCardComponent {
  readonly items = input.required<readonly SummaryItem[]>();
}
