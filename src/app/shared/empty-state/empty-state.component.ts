import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Empty state card (reference section 24). */
@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './empty-state.component.scss',
  template: `
    <div class="empty">
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      <p class="title">{{ message() }}</p>
      @if (hint()) {
        <p class="hint">{{ hint() }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class EmptyStateComponent {
  readonly message = input.required<string>();
  readonly icon = input('inbox');
  readonly hint = input('');
}
