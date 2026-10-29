import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FieldComponent } from '../form/field.component';
import { ClaimFilters, FILTER_MARKETS, FILTER_TYPES, FilterField } from './claim-filters';

export interface ClaimFiltersDialogData {
  readonly fields: readonly FilterField[];
  readonly filters: ClaimFilters;
  readonly statuses: readonly string[];
}

/** Phone filter sheet: the same filters as the header row, applied together. */
@Component({
  selector: 'app-claim-filters-dialog',
  imports: [MatButtonModule, MatDialogModule, FieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Filters</h2>
    <mat-dialog-content>
      @if (has('claimNumber')) {
        <app-field label="Claim number" icon="search">
          <input
            type="search"
            [value]="draft().claimNumber ?? ''"
            (input)="set({ claimNumber: text(c.value) })"
            #c
          />
        </app-field>
      }
      @if (has('market')) {
        <app-field label="Market">
          <select #m (change)="set({ market: pick(markets, m.value) })">
            <option value="" [selected]="!draft().market">All</option>
            @for (o of markets; track o) {
              <option [value]="o" [selected]="o === draft().market">{{ o }}</option>
            }
          </select>
        </app-field>
      }
      @if (has('type')) {
        <app-field label="Type">
          <select #t (change)="set({ type: pick(types, t.value) })">
            <option value="" [selected]="!draft().type">All</option>
            @for (o of types; track o) {
              <option [value]="o" [selected]="o === draft().type">{{ o }}</option>
            }
          </select>
        </app-field>
      }
      @if (has('amount')) {
        <app-field label="Min amount" hint="In each claim's own currency">
          <input
            type="number"
            min="0"
            step="0.01"
            [value]="draft().minAmount ?? ''"
            (input)="set({ minAmount: num(a.value) })"
            #a
          />
        </app-field>
        <app-field label="Max amount">
          <input
            type="number"
            min="0"
            step="0.01"
            [value]="draft().maxAmount ?? ''"
            (input)="set({ maxAmount: num(b.value) })"
            #b
          />
        </app-field>
      }
      @if (has('age')) {
        <app-field label="Submitted from">
          <input
            type="date"
            [value]="draft().submittedFrom ?? ''"
            (change)="set({ submittedFrom: f.value || undefined })"
            #f
          />
        </app-field>
        <app-field label="Submitted to">
          <input
            type="date"
            [value]="draft().submittedTo ?? ''"
            (change)="set({ submittedTo: to.value || undefined })"
            #to
          />
        </app-field>
      }
      @if (has('status')) {
        <app-field label="Status">
          <select #s (change)="set({ status: pick(data.statuses, s.value) })">
            <option value="" [selected]="!draft().status">All</option>
            @for (o of data.statuses; track o) {
              <option [value]="o" [selected]="o === draft().status">{{ o }}</option>
            }
          </select>
        </app-field>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="ref.close({})">Clear all</button>
      <button mat-flat-button type="button" (click)="ref.close(draft())">Apply filters</button>
    </mat-dialog-actions>
  `,
})
export class ClaimFiltersDialogComponent {
  protected readonly data = inject<ClaimFiltersDialogData>(MAT_DIALOG_DATA);
  protected readonly ref =
    inject<MatDialogRef<ClaimFiltersDialogComponent, ClaimFilters>>(MatDialogRef);
  protected readonly draft = signal<ClaimFilters>(this.data.filters);
  protected readonly markets = FILTER_MARKETS;
  protected readonly types = FILTER_TYPES;

  protected has(field: FilterField): boolean {
    return this.data.fields.includes(field);
  }
  protected set(change: Partial<ClaimFilters>): void {
    this.draft.update((d) => ({ ...d, ...change }));
  }
  protected text(raw: string): string | undefined {
    return raw.trim() || undefined;
  }
  protected num(raw: string): number | undefined {
    const n = raw.trim() === '' ? NaN : Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  }
  protected pick<T extends string>(options: readonly T[], raw: string): T | undefined {
    return options.find((o) => o === raw);
  }
}
