import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ListNavService } from '../../../core/layout/list-nav';
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
import { MatButtonModule } from '@angular/material/button';
import { PageEvent } from '@angular/material/paginator';
import { ClaimsStaffClaimView } from '../../../api/model/models';
import { ClaimsFacade } from '../../../core/claims/claims.facade';
import { AppError, isAppError } from '../../../core/http/app-error';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ErrorPanelComponent } from '../../../shared/error-panel/error-panel.component';
import { LoadingBarComponent } from '../../../shared/loading-bar/loading-bar.component';
import { ClaimListComponent } from '../../../shared/claims/claim-list.component';
import { SectionCardComponent } from '../../../shared/layout/section-card.component';
import { PageHeaderComponent } from '../../../shared/layout/page-header.component';

const STATUSES = [
  'Submitted',
  'UnderReview',
  'InfoRequested',
  'PendingDecisionApproval',
  'Approved',
  'PendingSettlementApproval',
  'Settling',
];

@Component({
  selector: 'app-outstanding-claims-page',
  imports: [
    MatButtonModule,
    ClaimListComponent,
    ClaimFilterBarComponent,
    SavedViewsComponent,
    PageHeaderComponent,
    SectionCardComponent,
    EmptyStateComponent,
    ErrorPanelComponent,
    LoadingBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Outstanding claims" [hiddenTitle]="true" />
    <app-section-card
      title="Outstanding claims"
      caption="Every claim that is not yet closed (all statuses except Rejected and Settled)."
    >
      <div cardActions>
        <app-saved-views listKey="outstanding" [presets]="presets" />
        <button mat-stroked-button type="button" (click)="load()">Refresh</button>
      </div>
      <app-claim-filter-bar [value]="filters()" (changed)="onFilters($event)" />
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
      } @else if (rows().length === 0) {
        <app-empty-state message="No outstanding claims match." icon="task_alt" />
      } @else {
        <p class="cdk-visually-hidden-text" aria-live="polite">
          {{ total() }} decisions awaiting a check
        </p>
        <app-claim-list
          [statuses]="statuses"
          [total]="total()"
          [pageIndex]="pageIndex()"
          [pageSize]="pageSize()"
          (pageChange)="onPage($event)"
          [rows]="rows()"
          linkBase="/manager/claims"
          mode="queue"
          [filterFields]="filterFields"
          [filters]="filters()"
          (filtersChange)="onFilters($event)"
          (refresh)="load()"
          [focusFirst]="focusFirst()"
          caption="Outstanding claims"
        />
      }
    </app-section-card>
  `,
})
export class OutstandingClaimsPage {
  private readonly facade = inject(ClaimsFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly listNav = inject(ListNavService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly rows = signal<readonly ClaimsStaffClaimView[]>([]);
  protected readonly total = signal(0);
  protected readonly statuses = STATUSES;
  protected readonly presets = [
    { name: 'Oldest first', query: '' },
    { name: 'Awaiting checker', query: 'status=PendingDecisionApproval' },
    { name: 'Motor', query: 'type=Motor' },
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
  protected readonly focusFirst = signal(false);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly loading = signal(true);
  protected readonly error = signal<AppError | null>(null);
  protected readonly banner = signal<string | null>(null);

  constructor() {
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.focusFirst.set(params['focus'] === 'first');
      this.filters.set(filtersFromParams(params, STATUSES));
      const state = listStateFromParams(params, 'oldest');
      this.pageIndex.set(state.page - 1);
      this.pageSize.set(state.pageSize);
      this.load();
    });
  }

  protected onFilters(next: ClaimFilters): void {
    this.navigate({ ...filtersToParams(next), page: null });
  }

  private navigate(params: Params): void {
    void this.router.navigate([], { queryParams: params, queryParamsHandling: 'merge' });
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.facade
      .listOldest({
        outstanding: true,
        filters: this.filters(),
        page: this.pageIndex() + 1,
        pageSize: this.pageSize(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.rows.set(page.items);
          this.listNav.remember(
            this.router.url,
            page.items.map((r) => r.id),
            '/manager/claims',
          );
          this.total.set(page.totalCount);
          this.loading.set(false);
        },
        error: (e: unknown) => {
          this.error.set(
            isAppError(e)
              ? e
              : {
                  status: 0,
                  kind: 'unexpected',
                  message: 'Something went wrong. Please try again.',
                },
          );
          this.loading.set(false);
        },
      });
  }

  protected onPage(event: PageEvent): void {
    this.navigate(
      listStateToParams(
        { page: event.pageIndex + 1, pageSize: event.pageSize, sort: 'oldest' },
        'oldest',
      ),
    );
  }
}
