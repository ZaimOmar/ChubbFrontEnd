import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-panel',
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './error-panel.component.scss',
  template: `
    <div class="panel" role="alert">
      <mat-icon aria-hidden="true">error_outline</mat-icon>
      <div class="body">
        <p class="message">{{ message() }}</p>
        @if (correlationId(); as id) {
          <p class="reference">Reference: {{ id }}</p>
        }
      </div>
      @if (canRetry()) {
        <button mat-stroked-button type="button" (click)="retry.emit()">Retry</button>
      }
    </div>
  `,
})
export class ErrorPanelComponent {
  readonly message = input.required<string>();
  readonly correlationId = input<string | undefined>();
  readonly canRetry = input(true);
  readonly retry = output<void>();
}
