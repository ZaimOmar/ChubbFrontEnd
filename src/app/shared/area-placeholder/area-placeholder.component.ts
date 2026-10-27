import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Placeholder landing for a role area until its screens are built; replaced by later feature specs. */
@Component({
  selector: 'app-area-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>{{ title() }}</h1>
    <p>This area is ready. Its screens are not built yet.</p>
  `,
})
export class AreaPlaceholderComponent {
  /** Bound from route data through component input binding. */
  readonly title = input.required<string>();
}
