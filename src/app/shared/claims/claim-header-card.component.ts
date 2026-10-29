import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ClaimStatus } from '../status-badge/claim-status';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { ClaimStepperComponent } from './claim-stepper.component';

/** Detail header: claim number (the page h1), status chip, refresh, one-line subtitle and the stepper. */
@Component({
  selector: 'app-claim-header-card',
  imports: [MatIconModule, StatusBadgeComponent, ClaimStepperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .head {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    h1 {
      margin: 0;
    }
    .spacer {
      flex: 1;
    }
    .sub {
      margin: 4px 0 0;
      font: 400 12px/16px var(--font-mono);
      color: var(--slate-500);
    }
    .refresh {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      padding: 0;
      color: var(--slate-500);
      background: none;
      border: 0;
      border-radius: 12px;
      cursor: pointer;
    }
    .refresh:hover {
      color: var(--slate-600);
      background: var(--slate-100);
    }
    hr {
      margin: 16px 0;
      border: 0;
      border-top: 1px solid var(--slate-100);
    }
  `,
  template: `
    <section class="card header-card">
      <div class="head">
        <h1>{{ claimNumber() }}</h1>
        <app-status-badge [status]="status()" [audience]="audience()" />
        <span class="spacer"></span>
        <button type="button" class="refresh" aria-label="Refresh claim" (click)="refresh.emit()">
          <mat-icon aria-hidden="true">refresh</mat-icon>
        </button>
      </div>
      <p class="sub">{{ subtitle() }}</p>
      <hr />
      <app-claim-stepper [status]="status()" [audience]="audience()" />
    </section>
  `,
})
export class ClaimHeaderCardComponent {
  readonly claimNumber = input.required<string>();
  readonly status = input.required<ClaimStatus>();
  readonly audience = input<'staff' | 'claimant'>('staff');
  readonly subtitle = input('');
  readonly refresh = output<void>();
}
