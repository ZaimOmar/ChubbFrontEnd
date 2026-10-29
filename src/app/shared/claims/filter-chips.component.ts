import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export interface FilterChip {
  readonly key: string;
  readonly label: string;
}

/** Active filter tags with a dismiss button (reference section 15). */
@Component({
  selector: 'app-filter-chips',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (chip of chips(); track chip.key) {
      <span class="chip">
        <span>{{ chip.label }}</span>
        <button
          type="button"
          [attr.aria-label]="'Remove filter: ' + chip.label"
          (click)="removed.emit(chip.key)"
        >
          <mat-icon aria-hidden="true">close</mat-icon>
        </button>
      </span>
    }
  `,
  styles: `
    :host {
      display: contents;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      box-sizing: border-box;
      height: 28px;
      padding: 0 4px 0 12px;
      font: 400 12px/16px var(--font-mono);
      color: var(--indigo-700);
      background: var(--indigo-50);
      border: 1px solid var(--indigo-200);
      border-radius: 9999px;
    }
    button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      padding: 0;
      color: inherit;
      background: none;
      border: 0;
      border-radius: 9999px;
      cursor: pointer;
    }
    button:hover {
      color: var(--red-500);
      background: #fff;
    }
    button:focus-visible {
      outline: 2px solid var(--indigo-500);
      outline-offset: 1px;
    }
    mat-icon {
      width: 14px;
      height: 14px;
      font-size: 14px;
    }
  `,
})
export class FilterChipsComponent {
  readonly chips = input<readonly FilterChip[]>([]);
  readonly removed = output<string>();
}
