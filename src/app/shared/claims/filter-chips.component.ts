import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface FilterChip {
  readonly key: string;
  readonly label: string;
}

/** Active filter tags with a dismiss button (reference section 15). */
@Component({
  selector: 'app-filter-chips',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (chips().length > 0) {
      <div class="chips" role="list" aria-label="Active filters">
        @for (chip of chips(); track chip.key) {
          <span class="chip" role="listitem">
            <span>{{ chip.label }}</span>
            <button
              type="button"
              [attr.aria-label]="'Remove filter ' + chip.label"
              (click)="removed.emit(chip.key)"
            >
              &times;
            </button>
          </span>
        }
      </div>
    }
  `,
  styles: `
    .chips {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font: 400 12px/16px var(--font-mono);
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      color: var(--indigo-600);
      background: var(--indigo-50);
      border: 1px solid var(--indigo-200);
      border-radius: 8px;
    }
    button {
      margin-left: 4px;
      padding: 0 4px;
      border: 0;
      background: none;
      font: inherit;
      color: inherit;
      cursor: pointer;
    }
    button:hover {
      color: var(--red-500);
    }
  `,
})
export class FilterChipsComponent {
  readonly chips = input<readonly FilterChip[]>([]);
  readonly removed = output<string>();
}
