import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { ActivatedRoute, Router } from '@angular/router';
import { ClaimsStaffClaimView } from '../../../api/model/models';
import { ClaimsFacade } from '../../../core/claims/claims.facade';
import { describeError } from '../../../core/claims/problem-messages';
import { AppError, isAppError } from '../../../core/http/app-error';
import { ClaimListComponent } from '../../../shared/claims/claim-list.component';
import { ClaimFilterBarComponent } from '../../../shared/claims/claim-filter-bar.component';
import {
  ClaimFilters,
  FilterField,
  filtersFromParams,
  filtersToParams,
  hasFilters,
} from '../../../shared/claims/claim-filters';
import {
  PickUpButtonComponent,
  PickUpResult,
} from '../../../shared/claims/pick-up-button.component';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ErrorPanelComponent } from '../../../shared/error-panel/error-panel.component';
import { PageHeaderComponent } from '../../../shared/layout/page-header.component';
import { SectionCardComponent } from '../../../shared/layout/section-card.component';
import { LoadingBarComponent } from '../../../shared/loading-bar/loading-bar.component';

@Component({
  selector: 'app-incoming-queue-page',
  imports: [
    MatButtonModule,
    ClaimListComponent,
    ClaimFilterBarComponent,
    PickUpButtonComponent,
    EmptyStateComponent,
    ErrorPanelComponent,
    LoadingBarComponent,
    PageHeaderComponent,
    SectionCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header [hidden]="true">Incoming claims</app-page-header>
    <app-section-card title="Incoming claims" caption="Submitted claims waiting for an officer.">
      <div cardActions>
        <button mat-stroked-button type="button" (click)="load()">Refresh</button>
      </div>
      <app-claim-filter-bar
        [fields]="filterFields"
        [value]="filters()"
        (changed)="onFilters($event)"
      />
      @if (banner(); as text) {
        <div class="banner" role="alert">{{ text }}</div>
      }
      @if (loading()) {
        <app-loading-bar variant="table" />
      } @else if (error(); as problem) {
        <app-error-panel
          [message]="problem.message"
          [correlationId]="problem.correlationId"
          (retry)="load()"
        />
      } @else if (rows().length === 0 && total() === 0) {
        <app-empty-state
          [message]="
            hasFilters() ? 'No incoming claims match these filters.' : 'The queue is empty.'
          "
          [hint]="hasFilters() ? 'Try adjusting your filters.' : 'Nice work.'"
        />
      } @else {
        <p class="cdk-visually-hidden-text" aria-live="polite">{{ total() }} claims</p>
        <app-claim-list
          [rows]="rows()"
          linkBase="/staff/claims"
          mode="queue"
          caption="Incoming claims"
          [actions]="pickUpCell"
          [total]="total()"
          [pageIndex]="pageIndex()"
          [pageSize]="pageSize()"
          [sortable]="true"
          [sortDirection]="sort() === 'oldest' ? 'asc' : 'desc'"
          (pageChange)="onPage($event)"
          (sortChange)="onSort($event)"
        />
        <ng-template #pickUpCell let-row>
          <app-pick-up-button
            [claimId]="row.id"
            [claimNumber]="row.claimNumber"
            (finished)="onPickedUp($event)"
          />
        </ng-template>
      }
    </app-section-card>
  `,
})
export class IncomingQueuePage {
  protected readonly filterFields: readonly FilterField[] = [
    'claimNumber',
    'market',
    'type',
    'amount',
    'age',
  ];
  protected readonly filters = signal<ClaimFilters>({});

  private readonly facade = inject(ClaimsFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly rows = signal<readonly ClaimsStaffClaimView[]>([]);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly sort = signal<'oldest' | 'newest'>('oldest');
  protected readonly loading = signal(true);
  protected readonly error = signal<AppError | null>(null);
  protected readonly banner = signal<string | null>(null);

  constructor() {
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.filters.set(filtersFromParams(params, []));
      this.pageIndex.set(0);
      this.load();
    });
  }

  protected hasFilters(): boolean {
    return hasFilters(this.filters());
  }

  protected onFilters(next: ClaimFilters): void {
    void this.router.navigate([], {
      queryParams: filtersToParams(next),
      queryParamsHandling: 'merge',
    });
  }

  protected onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  protected onSort(sort: Sort): void {
    this.sort.set(sort.direction === 'desc' ? 'newest' : 'oldest');
    this.pageIndex.set(0);
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.facade
      .listOldest({
        status: 'Submitted',
        filters: this.filters(),
        page: this.pageIndex() + 1,
        pageSize: this.pageSize(),
        sort: this.sort(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.rows.set(result.items);
          this.total.set(result.totalCount);
          this.loading.set(false);
        },
        error: (e: unknown) => {
          this.error.set(
            isAppError(e) ? e : { status: 0, kind: 'unexpected', message: describeError(e) },
          );
          this.loading.set(false);
        },
      });
  }

  protected onPickedUp(result: PickUpResult): void {
    if (result.ok) {
      this.load();
      return;
    }
    this.banner.set(result.message);
    if (result.refresh) this.load();
  }
}
