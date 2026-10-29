import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { tap } from 'rxjs';
import { ListNavService } from '../../../core/layout/list-nav';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClaimsClaimantClaimView } from '../../../api/model/models';
import { ClaimsFacade } from '../../../core/claims/claims.facade';
import { createBlock } from '../../../core/dashboard/block';
import { ClaimListComponent } from '../../../shared/claims/claim-list.component';
import { SavedViewsComponent } from '../../../shared/claims/saved-views.component';
import { ClaimFilterBarComponent } from '../../../shared/claims/claim-filter-bar.component';
import {
  ClaimFilters,
  FilterField,
  filtersFromParams,
  filtersToParams,
  listStateFromParams,
  listStateToParams,
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
    SavedViewsComponent,
    LoadingBarComponent,
    PageHeaderComponent,
    SectionCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="My claims" [hiddenTitle]="true" />
    <app-section-card title="My claims" caption="Claims you have reported.">
      <div cardActions>
        <app-saved-views listKey="my-claims" [presets]="presets" />
        <a mat-flat-button routerLink="/claimant/report">Report incident</a>
      </div>
      <app-claim-filter-bar [value]="filters()" (changed)="onFilters($event)" />
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
            [filterFields]="filterFields"
            [filters]="filters()"
            [statuses]="statuses"
            (filtersChange)="onFilters($event)"
            (refresh)="claims.reload()"
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
  private readonly listNav = inject(ListNavService);
  protected readonly statuses = STATUSES;
  protected readonly presets = [
    { name: 'Newest first', query: '' },
    { name: 'Oldest first', query: 'sort=oldest' },
    { name: 'Approved', query: 'status=Approved' },
    { name: 'Still open', query: 'status=UnderReview' },
  ];
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
    this.facade.listMine(this.pageIndex() + 1, this.pageSize(), this.sort(), this.filters()).pipe(
      tap((page) =>
        this.listNav.remember(
          this.router.url,
          page.items.map((c) => c.id),
          '/claimant/claims',
        ),
      ),
    ),
  );

  constructor() {
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.filters.set(filtersFromParams(params, STATUSES));
      const state = listStateFromParams(params, 'newest');
      this.pageIndex.set(state.page - 1);
      this.pageSize.set(state.pageSize);
      this.sort.set(state.sort);
      this.claims.reload();
    });
  }

  protected onFilters(next: ClaimFilters): void {
    this.navigate({ ...filtersToParams(next), page: null });
  }

  private navigate(params: Params): void {
    void this.router.navigate([], { queryParams: params, queryParamsHandling: 'merge' });
  }

  protected onPage(event: PageEvent): void {
    this.navigate(
      listStateToParams(
        { page: event.pageIndex + 1, pageSize: event.pageSize, sort: this.sort() },
        'newest',
      ),
    );
  }

  protected onSort(sort: Sort): void {
    this.navigate({
      ...listStateToParams(
        {
          page: 1,
          pageSize: this.pageSize(),
          sort: sort.direction === 'asc' ? 'oldest' : 'newest',
        },
        'newest',
      ),
      page: null,
    });
  }
}
