import { DatePipe, NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  effect,
  Injector,
  signal,
  ElementRef,
  HostListener,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  TemplateRef,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { partyLabel } from '../../core/claims/party-label';
import { debounceTime, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import {
  ClaimFiltersDialogComponent,
  ClaimFiltersDialogData,
} from './claim-filters-dialog.component';
import { ClaimFilters, FILTER_MARKETS, FILTER_TYPES, FilterField } from './claim-filters';
import { AgePipe } from '../pipes/age.pipe';
import { MoneyPipe } from '../pipes/money.pipe';
import { ClaimStatus } from '../status-badge/claim-status';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

/** The fields every list needs; both the staff and claimant views satisfy it structurally. */
export interface ClaimRow {
  readonly id: string;
  readonly claimNumber: string;
  readonly market: string;
  readonly type: string;
  readonly currency: string;
  readonly status: ClaimStatus;
  readonly estimatedAmount: number;
  readonly submittedAt: string;
  readonly assessedAmount?: number | null;
  readonly openProposal?: {
    readonly outcome: string;
    readonly amount?: number | null;
    readonly reasonCode?: string | null;
    readonly makerId: string;
    readonly proposedAt: string;
  };
}

export type ClaimListMode = 'queue' | 'pending' | 'compact';

/**
 * Clickable claims table (mockup 19). The claim number is the single tab stop and a real link;
 * a CSS overlay stretches it over the row. Action buttons sit above the overlay.
 */
@Component({
  selector: 'app-claim-list',
  imports: [
    NgTemplateOutlet,
    DatePipe,
    RouterLink,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    AgePipe,
    MoneyPipe,
    StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './claim-list.component.scss',
  template: `
    <div
      class="scroll"
      tabindex="0"
      [attr.aria-label]="caption() + ' (scrollable)'"
      (keydown)="onKey($event)"
      #scroller
    >
      <table>
        <caption class="cdk-visually-hidden-text">
          {{
            caption()
          }}
        </caption>
        <thead>
          <tr
            matSort
            [matSortActive]="sortable() ? 'submittedAt' : ''"
            [matSortDirection]="sortDirection()"
            matSortDisableClear
            (matSortChange)="sortChange.emit($event)"
          >
            <th scope="col" [class.filtered]="!!filters().claimNumber">Claim number</th>
            <th scope="col" [class.filtered]="!!filters().market">Market</th>
            <th scope="col" [class.filtered]="!!filters().type">Type</th>
            @if (mode() === 'pending') {
              <th scope="col">Proposed</th>
            }
            <th
              scope="col"
              class="num"
              [class.filtered]="
                filters().minAmount !== undefined || filters().maxAmount !== undefined
              "
            >
              Amount
            </th>
            @if (mode() === 'pending') {
              <th scope="col">Maker</th>
            }
            @if (sortable()) {
              <th
                scope="col"
                mat-sort-header="submittedAt"
                [start]="sortDirection() === 'asc' ? 'asc' : 'desc'"
                [class.filtered]="!!filters().submittedFrom || !!filters().submittedTo"
              >
                Age
              </th>
            } @else {
              <th scope="col">{{ mode() === 'pending' ? 'Waiting' : 'Age' }}</th>
            }
            <th scope="col" [class.filtered]="!!filters().status">Status</th>
            @if (actions()) {
              <th scope="col"><span class="cdk-visually-hidden-text">Actions</span></th>
            }
          </tr>
          @if (filterFields().length > 0) {
            <tr class="filters">
              <td>
                @if (has('claimNumber')) {
                  <input
                    class="hf"
                    type="search"
                    aria-label="Filter by claim number"
                    placeholder="Search"
                    autocomplete="off"
                    [value]="filters().claimNumber ?? ''"
                    (input)="typed.next(claimBox.value)"
                    (keydown.enter)="applyText(claimBox.value)"
                    #claimBox
                  />
                }
              </td>
              <td>
                @if (has('market')) {
                  <select
                    class="hf"
                    aria-label="Filter by market"
                    #marketBox
                    (change)="set({ market: pick(markets, marketBox.value) })"
                  >
                    <option value="" [selected]="!filters().market">All</option>
                    @for (m of markets; track m) {
                      <option [value]="m" [selected]="m === filters().market">{{ m }}</option>
                    }
                  </select>
                }
              </td>
              <td>
                @if (has('type')) {
                  <select
                    class="hf"
                    aria-label="Filter by type"
                    #typeBox
                    (change)="set({ type: pick(types, typeBox.value) })"
                  >
                    <option value="" [selected]="!filters().type">All</option>
                    @for (t of types; track t) {
                      <option [value]="t" [selected]="t === filters().type">{{ t }}</option>
                    }
                  </select>
                }
              </td>
              @if (mode() === 'pending') {
                <td></td>
              }
              <td>
                @if (has('amount')) {
                  <span class="pair">
                    <input
                      class="hf"
                      type="number"
                      min="0"
                      step="0.01"
                      aria-label="Minimum amount, in each claim's own currency"
                      placeholder="Min"
                      title="In each claim's own currency"
                      [value]="filters().minAmount ?? ''"
                      (change)="set({ minAmount: num(minBox.value) })"
                      (keydown.enter)="set({ minAmount: num(minBox.value) })"
                      #minBox
                    />
                    <input
                      class="hf"
                      type="number"
                      min="0"
                      step="0.01"
                      aria-label="Maximum amount, in each claim's own currency"
                      placeholder="Max"
                      title="In each claim's own currency"
                      [value]="filters().maxAmount ?? ''"
                      (change)="set({ maxAmount: num(maxBox.value) })"
                      (keydown.enter)="set({ maxAmount: num(maxBox.value) })"
                      #maxBox
                    />
                  </span>
                }
              </td>
              @if (mode() === 'pending') {
                <td></td>
              }
              <td>
                @if (has('age')) {
                  <span class="pair">
                    <input
                      class="hf"
                      type="date"
                      aria-label="Submitted from"
                      [value]="filters().submittedFrom ?? ''"
                      [max]="filters().submittedTo ?? ''"
                      (change)="set({ submittedFrom: fromBox.value || undefined })"
                      #fromBox
                    />
                    <input
                      class="hf"
                      type="date"
                      aria-label="Submitted to"
                      [value]="filters().submittedTo ?? ''"
                      [min]="filters().submittedFrom ?? ''"
                      (change)="set({ submittedTo: toBox.value || undefined })"
                      #toBox
                    />
                  </span>
                }
              </td>
              <td>
                @if (has('status')) {
                  <select
                    class="hf"
                    aria-label="Filter by status"
                    #statusBox
                    (change)="set({ status: pick(statuses(), statusBox.value) })"
                  >
                    <option value="" [selected]="!filters().status">All</option>
                    @for (s of statuses(); track s) {
                      <option [value]="s" [selected]="s === filters().status">{{ s }}</option>
                    }
                  </select>
                }
              </td>
              @if (actions()) {
                <td></td>
              }
            </tr>
          }
        </thead>
        <tbody>
          @for (row of rows(); track row.id) {
            <tr
              [class.selected]="row.id === selectedId()"
              [attr.aria-selected]="selectable() ? row.id === selectedId() : null"
              (click)="onRow($event, row.id)"
            >
              <td>
                <a
                  class="row-link"
                  [routerLink]="[linkBase(), row.id]"
                  [attr.data-id]="row.id"
                  (click)="onLink($event, row.id)"
                  >{{ row.claimNumber }}</a
                >
              </td>
              <td data-label="Market">{{ row.market }}</td>
              <td data-label="Type">{{ row.type }}</td>
              @if (mode() === 'pending') {
                <td data-label="Proposed">
                  {{ row.openProposal?.outcome }}
                  @if (row.openProposal?.reasonCode; as code) {
                    ({{ code }})
                  }
                </td>
              }
              <td class="num" data-label="Amount">{{ amountOf(row) | money: row.currency }}</td>
              @if (mode() === 'pending') {
                <td data-label="Maker">{{ makerOf(row) }}</td>
              }
              <td
                [title]="
                  (mode() === 'pending' ? row.openProposal?.proposedAt : row.submittedAt)
                    | date: 'd MMM yyyy, HH:mm z'
                "
              >
                {{ (mode() === 'pending' ? row.openProposal?.proposedAt : row.submittedAt) | age }}
              </td>
              <td data-label="Status" class="status-cell">
                <app-status-badge [status]="row.status" [audience]="audience()" />
              </td>
              @if (actions(); as tpl) {
                <td class="row-actions" data-label="">
                  <ng-container
                    [ngTemplateOutlet]="tpl"
                    [ngTemplateOutletContext]="{ $implicit: row }"
                  />
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
    @if (total() !== null) {
      <mat-paginator
        class="pager"
        [length]="total() ?? 0"
        [pageIndex]="pageIndex()"
        [pageSize]="pageSize()"
        [pageSizeOptions]="pageSizeOptions"
        showFirstLastButtons
        aria-label="Select page of claims"
        (page)="pageChange.emit($event)"
      />
    }
  `,
})
export class ClaimListComponent {
  readonly rows = input.required<readonly ClaimRow[]>();
  /** Detail route prefix by role, e.g. `/staff/claims`. */
  readonly linkBase = input.required<string>();
  readonly mode = input<ClaimListMode>('queue');
  readonly audience = input<'staff' | 'claimant'>('staff');
  readonly caption = input('Claims');
  readonly actions = input<TemplateRef<{ $implicit: ClaimRow }>>();
  /** Server-side paging: set `total` to show the paginator. */
  readonly total = input<number | null>(null);
  readonly pageIndex = input(0);
  readonly pageSize = input(10);
  readonly sortable = input(false);
  readonly sortDirection = input<'asc' | 'desc'>('asc');
  /** Columns that get a header filter; empty hides the filter row. */
  readonly filterFields = input<readonly FilterField[]>([]);
  readonly filters = input<ClaimFilters>({});
  readonly statuses = input<readonly string[]>([]);
  /** Master-detail: a click selects the claim instead of navigating. */
  readonly selectable = input(false);
  readonly selectedId = input<string | null>(null);
  readonly selected = output<string>();
  /** Focus the first row after the rows load (e.g. the manager Oldest tile). */
  readonly focusFirst = input(false);
  readonly refresh = output<void>();
  protected readonly marked = signal<ReadonlySet<string>>(new Set());
  readonly pageChange = output<PageEvent>();
  readonly sortChange = output<Sort>();
  readonly filtersChange = output<ClaimFilters>();
  protected readonly pageSizeOptions = [10, 20, 50];
  protected readonly markets = FILTER_MARKETS;
  protected readonly types = FILTER_TYPES;
  protected readonly typed = new Subject<string>();

  private readonly me = inject(AuthService).user;
  protected readonly myId = computed(() => this.me()?.id);

  constructor() {
    effect(() => {
      if (this.focusFirst() && this.rows().length > 0) {
        afterNextRender(
          () => this.host.nativeElement.querySelector<HTMLElement>('a.row-link')?.focus(),
          { injector: this.injector },
        );
      }
    });
    this.typed
      .pipe(debounceTime(300), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((text) => this.applyText(text));
  }

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialog = inject(MatDialog);
  private readonly injector = inject(Injector);

  private canSelect(): boolean {
    return this.selectable() && window.innerWidth >= 1100;
  }

  protected onLink(event: Event, id: string): void {
    if (!this.canSelect()) return;
    event.preventDefault();
    this.selected.emit(id);
  }

  protected onRow(event: Event, id: string): void {
    if (!this.canSelect()) return;
    if ((event.target as HTMLElement).closest('a, button, select, input')) return;
    this.selected.emit(id);
  }

  /** j/k or arrows move between rows; Enter on a row link opens it (native). */
  protected onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName) || event.ctrlKey || event.metaKey) return;
    const row = (document.activeElement as HTMLElement | null)?.closest('tr');
    if (event.key === 'x' && row) {
      const id = row.querySelector<HTMLElement>('a.row-link')?.getAttribute('data-id');
      if (id) {
        event.preventDefault();
        this.marked.update((set) => {
          const next = new Set(set);
          if (!next.delete(id)) next.add(id);
          return next;
        });
      }
      return;
    }
    if (event.key === 'p' && row) {
      const button = row.querySelector<HTMLButtonElement>('button[aria-label^="Pick up"]');
      if (button && !button.disabled) {
        event.preventDefault();
        button.click();
      }
      return;
    }
    const down = event.key === 'j' || event.key === 'ArrowDown';
    const up = event.key === 'k' || event.key === 'ArrowUp';
    if (!down && !up) return;
    const links = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('a.row-link'));
    if (links.length === 0) return;
    const current = links.findIndex((l) => l === document.activeElement);
    const next = Math.min(links.length - 1, Math.max(0, current + (down ? 1 : -1)));
    event.preventDefault();
    links[current < 0 ? 0 : next].focus();
    if (this.canSelect())
      this.selected.emit(
        links[current < 0 ? 0 : next].textContent?.trim()
          ? this.idOf(links[current < 0 ? 0 : next])
          : '',
      );
  }

  private idOf(link: HTMLElement): string {
    return link.getAttribute('data-id') ?? '';
  }

  protected openFilters(): void {
    this.dialog
      .open<ClaimFiltersDialogComponent, ClaimFiltersDialogData, ClaimFilters>(
        ClaimFiltersDialogComponent,
        {
          data: { fields: this.filterFields(), filters: this.filters(), statuses: this.statuses() },
          width: '420px',
          maxWidth: '96vw',
        },
      )
      .afterClosed()
      .subscribe((result) => {
        if (result) this.filtersChange.emit(result);
      });
  }

  /** `r` refreshes the list (not while typing or with a dialog open). */
  @HostListener('document:keydown', ['$event'])
  protected onRefreshKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (event.key !== 'r' || event.ctrlKey || event.metaKey || event.altKey) return;
    if (
      /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName) ||
      document.querySelector('.cdk-overlay-pane')
    )
      return;
    this.refresh.emit();
  }

  /** `/` jumps to the claim number filter. */
  @HostListener('document:keydown', ['$event'])
  protected onSlash(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (event.key !== '/' || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) return;
    const box = this.host.nativeElement.querySelector<HTMLInputElement>('input[type="search"]');
    if (box) {
      event.preventDefault();
      box.focus();
    }
  }

  protected has(field: FilterField): boolean {
    return this.filterFields().includes(field);
  }

  protected set(change: Partial<ClaimFilters>): void {
    this.filtersChange.emit({ ...this.filters(), ...change });
  }

  protected applyText(text: string): void {
    const claimNumber = text.trim() || undefined;
    if (claimNumber !== this.filters().claimNumber) this.set({ claimNumber });
  }

  protected pick<T extends string>(options: readonly T[], raw: string): T | undefined {
    return options.find((o) => o === raw);
  }

  protected num(raw: string): number | undefined {
    const n = raw.trim() === '' ? NaN : Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  }

  protected amountOf(row: ClaimRow): number | null | undefined {
    return this.mode() === 'pending' ? row.openProposal?.amount : row.estimatedAmount;
  }

  protected makerOf(row: ClaimRow): string {
    return partyLabel(row.openProposal?.makerId, 'Officer', this.myId());
  }
}
