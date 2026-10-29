import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ClaimFilters, chipsFor, withoutFilter } from './claim-filters';
import { FilterChipsComponent } from './filter-chips.component';

/** Table toolbar: "Filters", the active filters as chips, then "Clear all". Hidden when nothing is active. */
@Component({
  selector: 'app-claim-filter-bar',
  imports: [FilterChipsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .label {
      font: 700 10px/16px var(--font-mono);
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--slate-500);
    }
    .clear {
      height: 28px;
      padding: 0 8px;
      font: 400 12px/16px var(--font-mono);
      color: var(--indigo-600);
      background: none;
      border: 0;
      border-radius: 8px;
      cursor: pointer;
    }
    .clear:hover {
      background: var(--indigo-50);
    }
    .clear:focus-visible {
      outline: 2px solid var(--indigo-500);
      outline-offset: 1px;
    }
  `,
  template: `
    @if (chips().length > 0) {
      <div class="row" role="group" aria-label="Active filters">
        <span class="label">Filters</span>
        <app-filter-chips [chips]="chips()" (removed)="changed.emit(remove($event))" />
        <button type="button" class="clear" (click)="changed.emit({})">Clear all</button>
      </div>
    }
  `,
})
export class ClaimFilterBarComponent {
  readonly value = input.required<ClaimFilters>();
  readonly changed = output<ClaimFilters>();
  protected readonly chips = computed(() => chipsFor(this.value()));

  protected remove(key: string): ClaimFilters {
    return withoutFilter(this.value(), key);
  }
}
