import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './empty-state.component.scss',
  template: `
    <div class="empty">
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      <p>{{ message() }}</p>
      <ng-content />
    </div>
  `,
})
export class EmptyStateComponent {
  readonly message = input.required<string>();
  readonly icon = input('inbox');
}
