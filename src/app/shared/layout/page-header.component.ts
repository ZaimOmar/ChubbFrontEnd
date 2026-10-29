import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The page's single h1. `hidden` keeps it for assistive technology when a card repeats the title. */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="title" [class.cdk-visually-hidden-text]="hidden()">
      <h1><ng-content /></h1>
      <div class="extra"><ng-content select="[headerExtra]" /></div>
    </div>
  `,
  styles: `
    .title {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }
    .title h1 {
      margin: 0;
    }
  `,
})
export class PageHeaderComponent {
  readonly hidden = input(false);
}
