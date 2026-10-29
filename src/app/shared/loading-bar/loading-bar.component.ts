import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Skeleton shimmer placeholder (reference section 23); `table` shows five row bars. */
@Component({
  selector: 'app-loading-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton" aria-hidden="true">
      @if (variant() === 'table') {
        @for (row of rows; track row) {
          <div class="row shimmer-bg"></div>
        }
      } @else {
        <div class="bar h4 w33 shimmer-bg"></div>
        <div class="bar h3 w100 shimmer-bg"></div>
        <div class="bar h3 w66 shimmer-bg"></div>
      }
    </div>
    <p class="cdk-visually-hidden-text" aria-live="polite">Loading...</p>
  `,
  styles: `
    .skeleton {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      margin-bottom: 24px;
      background: #fff;
      border: 1px solid var(--slate-200);
      border-radius: 16px;
    }
    .bar,
    .row {
      border-radius: 4px;
    }
    .h4 {
      height: 16px;
    }
    .h3 {
      height: 12px;
    }
    .row {
      height: 40px;
    }
    .w33 {
      width: 33.333%;
    }
    .w100 {
      width: 100%;
    }
    .w66 {
      width: 66.666%;
    }
  `,
})
export class LoadingBarComponent {
  readonly variant = input<'card' | 'table'>('card');
  protected readonly rows = [1, 2, 3, 4, 5];
}
