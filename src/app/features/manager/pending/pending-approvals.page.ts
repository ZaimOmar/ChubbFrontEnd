import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ClaimFilterBarComponent } from '../../../shared/claims/claim-filter-bar.component';
import {
  ClaimFilters,
  FilterField,
  filtersFromParams,
  filtersToParams,
} from '../../../shared/claims/claim-filters';
import { MatButtonModule } from '@angular/material/button';
import { PageEvent } from '@angular/material/paginator';
import { ClaimsStaffClaimView } from '../../../api/model/models';
import { ClaimsFacade } from '../../../core/claims/claims.facade';
import { AppError, isAppError } from '../../../core/http/app-error';
import { NotificationService } from '../../../core/notification/notification.service';
import {
  DecisionActionsComponent,
  DecisionResult,
} from '../../../shared/claims/decision-actions.component';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ErrorPanelComponent } from '../../../shared/error-panel/error-panel.component';
import { LoadingBarComponent } from '../../../shared/loading-bar/loading-bar.component';
import { ClaimListComponent } from '../../../shared/claims/claim-list.component';
import { SectionCardComponent } from '../../../shared/layout/section-card.component';
import { PageHeaderComponent } from '../../../shared/layout/page-header.component';

@Component({
  selector: 'app-pending-approvals-page',
  imports: [
    MatButtonModule,
    ClaimListComponent,
    ClaimFilterBarComponent,
    PageHeaderComponent,
    SectionCardComponent,
    DecisionActionsComponent,
    EmptyStateComponent,
    ErrorPanelComponent,
    LoadingBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header [hidden]="true">Pending approvals</app-page-header>
    <app-section-card title="Pending approvals" caption="Decisions awaiting a check, oldest first.">
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
      } @else if (rows().length === 0) {
        <app-empty-state message="Nothing is waiting for approval." icon="task_alt" />
      } @else {
        <p class="cdk-visually-hidden-text" aria-live="polite">
          {{ total() }} decisions awaiting a check
        </p>
        <app-claim-list
          [total]="total()"
          [pageIndex]="pageIndex()"
          [pageSize]="pageSize()"
          (pageChange)="onPage($event)"
          [rows]="rows()"
          linkBase="/manager/claims"
          mode="pending"
          caption="Pending approvals, oldest first"
          [actions]="decisionCell"
        />
        <ng-template #decisionCell let-row>
          <app-decision-actions [claim]="row" (finished)="onFinished($event)" />
        </ng-template>
      }
    </app-section-card>
  `,
})
export class PendingApprovalsPage {
  private readonly facade = inject(ClaimsFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly rows = signal<readonly ClaimsStaffClaimView[]>([]);
  protected readonly total = signal(0);
  protected readonly filterFields: readonly FilterField[] = ['claimNumber', 'market', 'type'];
  protected readonly filters = signal<ClaimFilters>({});
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
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

  protected onFilters(next: ClaimFilters): void {
    void this.router.navigate([], {
      queryParams: filtersToParams(next),
      queryParamsHandling: 'merge',
    });
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.facade
      .listOldest({
        status: 'PendingDecisionApproval',
        page: this.pageIndex() + 1,
        pageSize: this.pageSize(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.rows.set(page.items);
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
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  protected onFinished(result: DecisionResult): void {
    if (result.ok) this.notify.show(result.message);
    else this.banner.set(result.message);
    if (result.ok || result.refresh) this.load();
  }
}
