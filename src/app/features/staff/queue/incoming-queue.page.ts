import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { map } from 'rxjs';
import { ClaimsStaffClaimView } from '../../../api/model/models';
import { AuthService } from '../../../core/auth/auth.service';
import { ClaimsFacade } from '../../../core/claims/claims.facade';
import { describeError } from '../../../core/claims/problem-messages';
import { AppError, isAppError } from '../../../core/http/app-error';
import { ListNavService } from '../../../core/layout/list-nav';
import { createBlock } from '../../../core/dashboard/block';
import { StatTileComponent } from '../../../shared/layout/stat-tile.component';
import { AgePipe } from '../../../shared/pipes/age.pipe';
import { ClaimFilterBarComponent } from '../../../shared/claims/claim-filter-bar.component';
import {
  ClaimFilters,
  FilterField,
  filtersFromParams,
  filtersToParams,
  hasFilters,
  listStateFromParams,
  listStateToParams,
} from '../../../shared/claims/claim-filters';
import { ClaimListComponent } from '../../../shared/claims/claim-list.component';
import {
  PickUpButtonComponent,
  PickUpResult,
} from '../../../shared/claims/pick-up-button.component';
import { SavedViewsComponent } from '../../../shared/claims/saved-views.component';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ErrorPanelComponent } from '../../../shared/error-panel/error-panel.component';
import { PageHeaderComponent } from '../../../shared/layout/page-header.component';
import { LoadingBarComponent } from '../../../shared/loading-bar/loading-bar.component';
import { OfficerClaimDetailPage } from '../claim-detail/officer-claim-detail.page';

type Tab = 'incoming' | 'mine';

const ALL_STATUSES = [
  'Submitted',
  'UnderReview',
  'InfoRequested',
  'PendingDecisionApproval',
  'Approved',
  'Rejected',
];

const PRESETS = [
  { name: 'Oldest first', query: '' },
  { name: 'Newest first', query: 'sort=newest' },
  { name: 'Motor', query: 'type=Motor' },
  { name: 'High value (over 10,000)', query: 'minAmount=10000' },
];

/** Officer workspace (mockup 23): queue list on the left, the selected claim on the right. */
@Component({
  selector: 'app-incoming-queue-page',
  imports: [
    MatButtonModule,
    ClaimListComponent,
    ClaimFilterBarComponent,
    PickUpButtonComponent,
    SavedViewsComponent,
    EmptyStateComponent,
    ErrorPanelComponent,
    LoadingBarComponent,
    PageHeaderComponent,
    OfficerClaimDetailPage,
    StatTileComponent,
    AgePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './incoming-queue.page.scss',
  template: `
    <app-page-header title="Queue" [hiddenTitle]="true">
      <button headerExtra mat-stroked-button type="button" (click)="load()">Refresh</button>
    </app-page-header>
    <section class="kpis" aria-label="Queue summary" aria-live="polite">
      <app-stat-tile
        label="Incoming"
        [value]="incomingCount.value()?.totalCount ?? '-'"
        hint="Unassigned"
        link="/staff/queue"
      />
      <app-stat-tile
        label="Assigned to me"
        [value]="mineCount.value()?.totalCount ?? '-'"
        hint="Mine"
        link="/staff/queue"
        [queryParams]="{ tab: 'mine' }"
      />
      <app-stat-tile
        label="Waiting on checker"
        [value]="waiting()"
        hint="Of mine"
        link="/staff/queue"
        [queryParams]="{ tab: 'mine', status: 'PendingDecisionApproval' }"
      />
      @if (incomingCount.value()?.items?.[0]; as oldest) {
        <app-stat-tile
          label="Oldest incoming"
          [value]="oldest.submittedAt | age"
          [hint]="oldest.claimNumber"
          link="/staff/queue"
          [queryParams]="{ claim: oldest.id }"
        />
      }
    </section>
    <div class="workspace" [class.split]="split()">
      <section class="card list-pane" aria-labelledby="queue-title">
        <div class="card-head">
          <div>
            <h2 id="queue-title">Queue</h2>
            <p class="caption">
              {{
                tab() === 'incoming'
                  ? 'Submitted claims waiting for an officer.'
                  : 'Claims assigned to you.'
              }}
            </p>
          </div>
          <app-saved-views listKey="queue" [presets]="presets" />
        </div>
        <div class="tabs" role="tablist" aria-label="Queue view">
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="tab() === 'incoming'"
            [class.on]="tab() === 'incoming'"
            (click)="setTab('incoming')"
          >
            Incoming
          </button>
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="tab() === 'mine'"
            [class.on]="tab() === 'mine'"
            (click)="setTab('mine')"
          >
            Mine
          </button>
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
        } @else if (rows().length === 0 && total() === 0) {
          <app-empty-state
            [message]="
              hasFilters()
                ? 'No claims match these filters.'
                : tab() === 'mine'
                  ? 'Nothing is assigned to you.'
                  : 'Queue clear.'
            "
            [hint]="hasFilters() ? 'Try adjusting your filters.' : 'Nice work.'"
          />
        } @else {
          <p class="cdk-visually-hidden-text" aria-live="polite">{{ total() }} claims</p>
          <app-claim-list
            [rows]="rows()"
            linkBase="/staff/claims"
            mode="queue"
            caption="Claims"
            [actions]="tab() === 'incoming' ? pickUpCell : undefined"
            [total]="total()"
            [pageIndex]="pageIndex()"
            [pageSize]="pageSize()"
            [sortable]="true"
            [sortDirection]="sort() === 'oldest' ? 'asc' : 'desc'"
            [filterFields]="filterFields()"
            [filters]="filters()"
            [statuses]="statuses"
            [selectable]="true"
            [selectedId]="selectedId()"
            (selected)="select($event)"
            (refresh)="load()"
            (filtersChange)="onFilters($event)"
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
      </section>
      @if (split() && selectedId(); as id) {
        <aside class="detail-pane" [attr.aria-label]="'Selected claim'">
          <div class="pane-nav">
            <button
              type="button"
              aria-label="Previous claim"
              [disabled]="!neighbour(-1)"
              (click)="step(-1)"
            >
              &lt;
            </button>
            <span>{{ position() }}</span>
            <button
              type="button"
              aria-label="Next claim"
              [disabled]="!neighbour(1)"
              (click)="step(1)"
            >
              &gt;
            </button>
          </div>
          <app-officer-claim-detail-page [id]="id" [embedded]="true" (changed)="load()" />
        </aside>
      }
    </div>
  `,
})
export class IncomingQueuePage {
  protected readonly presets = PRESETS;
  protected readonly statuses = ALL_STATUSES;

  private readonly facade = inject(ClaimsFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly listNav = inject(ListNavService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly wide = toSignal(
    inject(BreakpointObserver)
      .observe('(min-width: 1100px)')
      .pipe(map((state) => state.matches)),
    { initialValue: true },
  );

  protected readonly tab = signal<Tab>('incoming');
  protected readonly selectedId = signal<string | null>(null);
  protected readonly split = () => this.wide() && !!this.selectedId();
  protected readonly filters = signal<ClaimFilters>({});
  protected readonly rows = signal<readonly ClaimsStaffClaimView[]>([]);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly sort = signal<'oldest' | 'newest'>('oldest');
  protected readonly loading = signal(true);
  protected readonly error = signal<AppError | null>(null);
  protected readonly banner = signal<string | null>(null);

  protected readonly filterFields = (): readonly FilterField[] =>
    this.tab() === 'mine'
      ? ['claimNumber', 'market', 'type', 'amount', 'age', 'status']
      : ['claimNumber', 'market', 'type', 'amount', 'age'];

  constructor() {
    this.incomingCount.reload();
    this.mineCount.reload();
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.tab.set(params['tab'] === 'mine' ? 'mine' : 'incoming');
      this.selectedId.set(typeof params['claim'] === 'string' ? params['claim'] : null);
      this.filters.set(filtersFromParams(params, this.tab() === 'mine' ? ALL_STATUSES : []));
      const state = listStateFromParams(params, 'oldest');
      this.pageIndex.set(state.page - 1);
      this.pageSize.set(state.pageSize);
      this.sort.set(state.sort === 'newest' ? 'newest' : 'oldest');
      this.load();
    });
  }

  protected readonly incomingCount = createBlock(() =>
    this.facade.listOldest({ status: 'Submitted', page: 1, pageSize: 1 }),
  );
  protected readonly mineCount = createBlock(() =>
    this.facade.listAssigned(this.auth.user()?.id ?? ''),
  );
  protected readonly waiting = () => {
    const items = this.mineCount.value()?.items;
    return items ? items.filter((c) => c.status === 'PendingDecisionApproval').length : '-';
  };

  protected neighbour(delta: number): string | null {
    const ids = this.rows().map((r) => r.id);
    const i = ids.indexOf(this.selectedId() ?? '');
    return i < 0 ? null : (ids[i + delta] ?? null);
  }

  protected position(): string {
    const i = this.rows().findIndex((r) => r.id === this.selectedId());
    return i < 0 ? '' : `${i + 1} / ${this.rows().length}`;
  }

  protected step(delta: number): void {
    const id = this.neighbour(delta);
    if (id) this.select(id);
  }

  protected hasFilters(): boolean {
    return hasFilters(this.filters());
  }

  private navigate(params: Params): void {
    void this.router.navigate([], { queryParams: params, queryParamsHandling: 'merge' });
  }

  protected setTab(tab: Tab): void {
    this.navigate({ tab: tab === 'mine' ? 'mine' : null, claim: null, status: null, page: null });
  }

  protected select(id: string): void {
    this.navigate({ claim: id });
  }

  protected onFilters(next: ClaimFilters): void {
    this.navigate({ ...filtersToParams(next), page: null });
  }

  protected onPage(event: PageEvent): void {
    this.navigate(
      listStateToParams(
        { page: event.pageIndex + 1, pageSize: event.pageSize, sort: this.sort() },
        'oldest',
      ),
    );
  }

  protected onSort(sort: Sort): void {
    this.navigate({
      ...listStateToParams(
        {
          page: 1,
          pageSize: this.pageSize(),
          sort: sort.direction === 'desc' ? 'newest' : 'oldest',
        },
        'oldest',
      ),
      page: null,
    });
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    const mine = this.tab() === 'mine';
    this.facade
      .listOldest({
        status: mine ? undefined : 'Submitted',
        assigneeId: mine ? this.auth.user()?.id : undefined,
        filters: this.filters(),
        page: this.pageIndex() + 1,
        pageSize: this.pageSize(),
        sort: this.sort(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.rows.set(result.items);
          this.listNav.remember(
            this.router.url,
            result.items.map((r) => r.id),
            '/staff/claims',
          );
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
      this.incomingCount.reload();
      this.mineCount.reload();
      this.load();
      return;
    }
    this.banner.set(result.message);
    if (result.refresh) this.load();
  }
}
