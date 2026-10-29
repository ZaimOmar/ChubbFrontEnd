import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';

/** KPI tile styled as the reference gauge card (section 14); the whole tile is a link. */
@Component({
  selector: 'app-stat-tile',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="tile" [routerLink]="link()" [queryParams]="queryParams()">
      <span class="eyebrow">{{ label() }}</span>
      <span class="value">{{ value() }}</span>
      @if (hint()) {
        <span class="hint">{{ hint() }}</span>
      }
    </a>
  `,
  styles: `
    :host {
      display: block;
    }
    .tile {
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-sizing: border-box;
      height: 100%;
      padding: 16px;
      text-decoration: none;
      color: var(--slate-900);
      background: var(--slate-50);
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      font-family: var(--font-mono);
    }
    .tile:hover {
      border-color: var(--indigo-500);
      background: #fff;
    }
    .value {
      font: 700 30px/36px var(--font-mono);
      font-variant-numeric: tabular-nums;
    }
    .hint {
      font-size: 10px;
      color: var(--slate-500);
    }
  `,
})
export class StatTileComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input<string>('');
  readonly link = input.required<string>();
  readonly queryParams = input<Params | undefined>();
}
