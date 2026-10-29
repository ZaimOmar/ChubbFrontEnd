import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClaimsClaimantClaimView } from '../../../api/model/models';
import { ClaimsFacade } from '../../../core/claims/claims.facade';
import { createBlock } from '../../../core/dashboard/block';
import { ClaimListComponent } from '../../../shared/claims/claim-list.component';
import { ClaimFilterBarComponent } from '../../../shared/claims/claim-filter-bar.component';
import {
  ClaimFilters,
  FilterField,
  filtersFromParams,
  filtersToParams,
} from '../../../shared/claims/claim-filters';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ErrorPanelComponent } from '../../../shared/error-panel/error-panel.component';
import { PageHeaderComponent } from '../../../shared/layout/page-header.component';
import { SectionCardComponent } from '../../../shared/layout/section-card.component';
import { LoadingBarComponent } from '../../../shared/loading-bar/loading-bar.component';

type Status = ClaimsClaimantClaimView['status'];

/** Statuses the `GET /claims/mine` filter accepts. */
const STATUSES: readonly Status[] = [
  'Submitted',
  'UnderReview',
  'InfoRequested',
  'Approved',
  'Rejected',
  'Settling',
  'Settled',
];

@Component({
  selector: 'app-my-claims-page',
  imports: [
    RouterLink,
    MatButtonModule,
    ClaimListComponent,
    EmptyStateComponent,
    ErrorPanelComponent,
    ClaimFilterBarComponent,
    LoadingBarComponent,
    PageHeaderComponent,
    SectionCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header [hidden]="true">My claims</app-page-header>
    <app-section-card title="My claims" caption="Claims you have reported.">
      <div cardActions>
        <a mat-flat-button routerLink="/claimant/report">Report incident</a>
      </div>
      <app-claim-filter-bar
        [fields]="filterFields"
        [statuses]="statuses"
        [value]="filters()"
        (changed)="onFilters($event)"
      />
      @if (claims.loading()) {
        <app-loading-bar variant="table" />
      } @else if (claims.error(); as problem) {
        <app-error-panel
          [message]="problem.message"
          [correlationId]="problem.correlationId"
          (retry)="claims.reload()"
        />
      } @else if (claims.value(); as result) {
        @if (result.totalCount === 0) {
          <app-empty-state
            message="You have no claims yet."
            hint="Try adjusting your filters or report a new incident."
          />
        } @else {
          <p class="cdk-visually-hidden-text" aria-live="polite">{{ result.totalCount }} claims</p>
          <app-claim-list
            [rows]="result.items"
            linkBase="/claimant/claims"
            audience="claimant"
            mode="compact"
            caption="My claims"
            [total]="result.totalCount"
            [pageIndex]="pageIndex()"
            [pageSize]="pageSize()"
            [sortable]="true"
            [sortDirection]="sort() === 'oldest' ? 'asc' : 'desc'"
            (pageChange)="onPage($event)"
            (sortChange)="onSort($event)"
          />
        }
      }
    </app-section-card>
  `,
})
export class MyClaimsPage {
  private readonly facade = inject(ClaimsFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly statuses = STATUSES;
  protected readonly filterFields: readonly FilterField[] = [
    'claimNumber',
    'market',
    'type',
    'amount',
    'age',
    'status',
  ];
  protected readonly filters = signal<ClaimFilters>({});
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly sort = signal<'newest' | 'oldest'>('newest');
  protected readonly claims = createBlock(() =>
    this.facade.listMine(this.pageIndex() + 1, this.pageSize(), this.sort(), this.filters()),
  );

  constructor() {
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.filters.set(filtersFromParams(params, STATUSES));
      this.pageIndex.set(0);
      this.claims.reload();
    });
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
    this.claims.reload();
  }

  protected onSort(sort: Sort): void {
    this.sort.set(sort.direction === 'asc' ? 'oldest' : 'newest');
    this.pageIndex.set(0);
    this.claims.reload();
  }
}
