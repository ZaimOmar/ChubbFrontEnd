import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Section card with the reference header row (title, caption, optional actions). */
@Component({
  selector: 'app-section-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card" [attr.aria-labelledby]="id">
      <div class="card-head">
        <div>
          <h2 [id]="id">{{ title() }}</h2>
          @if (caption()) {
            <p class="caption">{{ caption() }}</p>
          }
        </div>
        <div><ng-content select="[cardActions]" /></div>
      </div>
      <ng-content />
    </section>
  `,
})
export class SectionCardComponent {
  private static next = 0;
  protected readonly id = `section-card-${SectionCardComponent.next++}`;
  readonly title = input.required<string>();
  readonly caption = input('');
}
