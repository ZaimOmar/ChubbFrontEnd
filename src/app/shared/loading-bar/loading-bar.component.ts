import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-loading-bar',
  imports: [MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-progress-bar mode="indeterminate" aria-label="Loading" />
    <p class="cdk-visually-hidden-text" aria-live="polite">Loading...</p>
  `,
})
export class LoadingBarComponent {}
