import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type DecisionTone = 'info' | 'success' | 'danger' | 'neutral';

/** Compact status / next-action card: tinted icon circle, card-title heading, text, actions in the footer. */
@Component({
  selector: 'app-decision-card',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
    .row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .circle {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 9999px;
    }
    .info {
      background: var(--indigo-50);
      color: var(--indigo-600);
    }
    .success {
      background: var(--emerald-100);
      color: var(--emerald-800);
    }
    .danger {
      background: #fee2e2;
      color: #991b1b;
    }
    .neutral {
      background: var(--slate-100);
      color: var(--slate-600);
    }
    h2 {
      margin: 0 0 4px;
    }
    .body {
      min-width: 0;
    }
  `,
  template: `
    <section class="card" [attr.aria-labelledby]="headingId">
      <div class="row">
        <span class="circle" [class]="'circle ' + tone()" aria-hidden="true">
          <mat-icon>{{ icon() }}</mat-icon>
        </span>
        <div class="body">
          <h2 [id]="headingId">{{ heading() }}</h2>
          <ng-content />
        </div>
      </div>
      <div class="card-foot-slot"><ng-content select="[cardFooter]" /></div>
    </section>
  `,
})
export class DecisionCardComponent {
  private static next = 0;
  protected readonly headingId = `decision-card-${DecisionCardComponent.next++}`;
  readonly heading = input.required<string>();
  readonly icon = input('info');
  readonly tone = input<DecisionTone>('info');
}
