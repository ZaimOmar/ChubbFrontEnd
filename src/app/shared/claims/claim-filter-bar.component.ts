import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, Subject } from 'rxjs';
import { FieldComponent } from '../form/field.component';
import {
  ClaimFilters,
  chipsFor,
  FILTER_MARKETS,
  FILTER_TYPES,
  FilterField,
  hasFilters,
  withoutFilter,
} from './claim-filters';
import { FilterChipsComponent } from './filter-chips.component';

/**
 * One filter per table column, in a compact row, plus removable chips and "Clear all".
 * The parent owns the state (kept in the URL); this component only emits the next value.
 */
@Component({
  selector: 'app-claim-filter-bar',
  imports: [MatButtonModule, FieldComponent, FilterChipsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: flex-start;
    }
    .row app-field {
      width: 168px;
    }
    .row app-field.wide {
      width: 200px;
    }
    .pair {
      display: flex;
      gap: 8px;
    }
    .pair app-field {
      width: 120px;
    }
    .chips-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
  `,
  template: `
    <form class="row" role="search" aria-label="Filter claims" (submit)="$event.preventDefault()">
      @if (has('claimNumber')) {
        <app-field label="Claim number" icon="search" class="wide">
          <input
            type="search"
            [value]="value().claimNumber ?? ''"
            autocomplete="off"
            (input)="typed.next($any($event.target).value)"
            (keydown.enter)="applyText(claim.value)"
            #claim
          />
        </app-field>
      }
      @if (has('market')) {
        <app-field label="Market">
          <select #market (change)="set({ market: pick(markets, market.value) })">
            <option value="" [selected]="!value().market">All</option>
            @for (m of markets; track m) {
              <option [value]="m" [selected]="m === value().market">{{ m }}</option>
            }
          </select>
        </app-field>
      }
      @if (has('type')) {
        <app-field label="Type">
          <select #type (change)="set({ type: pick(types, type.value) })">
            <option value="" [selected]="!value().type">All</option>
            @for (t of types; track t) {
              <option [value]="t" [selected]="t === value().type">{{ t }}</option>
            }
          </select>
        </app-field>
      }
      @if (has('amount')) {
        <div class="pair">
          <app-field label="Min amount" hint="In each claim's own currency">
            <input
              type="number"
              min="0"
              step="0.01"
              [value]="value().minAmount ?? ''"
              (change)="set({ minAmount: num(minA.value) })"
              (keydown.enter)="set({ minAmount: num(minA.value) })"
              #minA
            />
          </app-field>
          <app-field label="Max amount" hint="In each claim's own currency">
            <input
              type="number"
              min="0"
              step="0.01"
              [value]="value().maxAmount ?? ''"
              (change)="set({ maxAmount: num(maxA.value) })"
              (keydown.enter)="set({ maxAmount: num(maxA.value) })"
              #maxA
            />
          </app-field>
        </div>
      }
      @if (has('age')) {
        <div class="pair">
          <app-field label="Submitted from">
            <input
              type="date"
              [value]="value().submittedFrom ?? ''"
              [max]="value().submittedTo ?? ''"
              (change)="set({ submittedFrom: from.value || undefined })"
              #from
            />
          </app-field>
          <app-field label="Submitted to">
            <input
              type="date"
              [value]="value().submittedTo ?? ''"
              [min]="value().submittedFrom ?? ''"
              (change)="set({ submittedTo: to.value || undefined })"
              #to
            />
          </app-field>
        </div>
      }
      @if (has('status')) {
        <app-field label="Status">
          <select #status (change)="set({ status: pick(statuses(), status.value) })">
            <option value="" [selected]="!value().status">All</option>
            @for (s of statuses(); track s) {
              <option [value]="s" [selected]="s === value().status">{{ s }}</option>
            }
          </select>
        </app-field>
      }
    </form>
    @if (chips().length > 0) {
      <div class="chips-row">
        <app-filter-chips [chips]="chips()" (removed)="changed.emit(remove($event))" />
        <button mat-button type="button" (click)="changed.emit({})">Clear all</button>
      </div>
    }
  `,
})
export class ClaimFilterBarComponent {
  readonly fields = input.required<readonly FilterField[]>();
  readonly value = input.required<ClaimFilters>();
  readonly statuses = input<readonly string[]>([]);
  readonly changed = output<ClaimFilters>();

  protected readonly markets = FILTER_MARKETS;
  protected readonly types = FILTER_TYPES;
  protected readonly typed = new Subject<string>();
  protected readonly chips = computed(() => chipsFor(this.value()));
  protected readonly anyActive = computed(() => hasFilters(this.value()));

  constructor() {
    this.typed
      .pipe(debounceTime(300), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((text) => this.applyText(text));
  }

  protected has(field: FilterField): boolean {
    return this.fields().includes(field);
  }

  protected set(change: Partial<ClaimFilters>): void {
    this.changed.emit({ ...this.value(), ...change });
  }

  protected applyText(text: string): void {
    const claimNumber = text.trim() || undefined;
    if (claimNumber !== this.value().claimNumber) this.set({ claimNumber });
  }

  protected remove(key: string): ClaimFilters {
    return withoutFilter(this.value(), key);
  }

  protected pick<T extends string>(options: readonly T[], raw: string): T | undefined {
    return options.find((o) => o === raw);
  }

  protected num(raw: string): number | undefined {
    const n = raw.trim() === '' ? NaN : Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  }
}
