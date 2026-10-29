import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClaimsFacade } from '../../../core/claims/claims.facade';
import { createBlock } from '../../../core/dashboard/block';
import { DashboardFacade } from '../../../core/dashboard/dashboard.facade';
import {
  DecisionActionsComponent,
  DecisionResult,
} from '../../../shared/claims/decision-actions.component';
import { NotificationService } from '../../../core/notification/notification.service';
import { ClaimListComponent } from '../../../shared/claims/claim-list.component';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ErrorPanelComponent } from '../../../shared/error-panel/error-panel.component';
import { PageHeaderComponent } from '../../../shared/layout/page-header.component';
import { StatTileComponent } from '../../../shared/layout/stat-tile.component';
import { LoadingBarComponent } from '../../../shared/loading-bar/loading-bar.component';
import { AgePipe } from '../../../shared/pipes/age.pipe';

@Component({
  selector: 'app-manager-home-page',
  imports: [
    RouterLink,
    AgePipe,
    ClaimListComponent,
    EmptyStateComponent,
    ErrorPanelComponent,
    LoadingBarComponent,
    PageHeaderComponent,
    StatTileComponent,
    DecisionActionsComponent,
    DecimalPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Command centre" />
    <section class="grid" aria-label="Summary" aria-live="polite">
      <app-stat-tile
        label="Pending approvals"
        [value]="pending.value()?.totalCount ?? '-'"
        hint="Review"
        link="/manager/pending"
      />
      <app-stat-tile
        label="Outstanding claims"
        [value]="outstanding.value()?.total ?? '-'"
        hint="Awaiting checker: {{ outstanding.value()?.awaitingChecker ?? '-' }}"
        link="/manager/outstanding"
      />
      <app-stat-tile
        label="Exposure (USD, reporting rate)"
        [value]="exposureTotal()"
        link="/manager/home"
      />
      @if (pending.value()?.items?.[0]?.openProposal; as oldest) {
        <app-stat-tile
          label="Oldest pending"
          [value]="oldest.proposedAt | age"
          link="/manager/pending"
          [queryParams]="{ focus: 'first' }"
        />
      }
    </section>

    <div class="centre">
      <section class="card" aria-labelledby="pending-heading">
        <div class="card-head">
          <div>
            <h2 id="pending-heading">Pending approvals</h2>
            <p class="caption">Oldest first. <a routerLink="/manager/pending">View all</a></p>
          </div>
        </div>
        @if (banner(); as text) {
          <div class="banner" role="alert">{{ text }}</div>
        }
        @if (pending.loading()) {
          <app-loading-bar variant="table" />
        } @else if (pending.error(); as problem) {
          <app-error-panel [message]="problem.message" (retry)="pending.reload()" />
        } @else if (pending.value()?.items?.length === 0) {
          <app-empty-state message="Nothing is waiting for approval." icon="task_alt">
            <a routerLink="/manager/pending">Open pending approvals</a>
          </app-empty-state>
        } @else {
          <app-claim-list
            [rows]="pending.value()?.items ?? []"
            linkBase="/manager/claims"
            mode="pending"
            caption="Pending approvals"
            [actions]="decisionCell"
          />
          <ng-template #decisionCell let-row>
            <app-decision-actions [claim]="row" (finished)="onFinished($event)" />
          </ng-template>
        }
      </section>

      <section class="card" aria-labelledby="exposure-heading">
        <div class="card-head">
          <div>
            <h2 id="exposure-heading">Exposure by market and type</h2>
            <p class="caption">USD at the reporting rate.</p>
          </div>
        </div>
        @if (exposure.loading()) {
          <app-loading-bar />
        } @else if (exposure.error(); as problem) {
          <app-error-panel [message]="problem.message" (retry)="exposure.reload()" />
        } @else {
          <ul class="bars">
            @for (row of exposure.value()?.rows ?? []; track row.market + row.type) {
              <li>
                <span class="k">{{ row.market }} {{ row.type }}</span>
                <span class="bar" aria-hidden="true"
                  ><span [style.width.%]="barWidth(row.exposureUsd)"></span
                ></span>
                <span class="v">{{ row.exposureUsd | number: '1.0-0' }}</span>
              </li>
            }
          </ul>
        }
      </section>
    </div>
  `,
  styles: `
    .centre {
      display: grid;
      gap: 16px;
      grid-template-columns: 1fr;
      align-items: start;
    }
    @media (min-width: 1100px) {
      .centre {
        grid-template-columns: 3fr 2fr;
      }
    }
    .centre .card {
      margin-bottom: 0;
    }
    .bars {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 8px;
      font: 400 12px/16px var(--font-mono);
    }
    .bars li {
      display: grid;
      grid-template-columns: 120px 1fr 80px;
      align-items: center;
      gap: 8px;
    }
    .bar {
      height: 8px;
      background: var(--slate-100);
      border-radius: 9999px;
      overflow: hidden;
    }
    .bar span {
      display: block;
      height: 100%;
      background: var(--indigo-600);
    }
    .v {
      text-align: right;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class ManagerHomePage implements OnInit {
  private readonly claims = inject(ClaimsFacade);
  private readonly dashboard = inject(DashboardFacade);
  protected readonly pending = createBlock(() =>
    this.claims.listOldest({ status: 'PendingDecisionApproval', page: 1, pageSize: 5 }),
  );
  protected readonly outstanding = createBlock(() => this.dashboard.outstanding());
  protected readonly exposure = createBlock(() => this.dashboard.exposure());

  private readonly notify = inject(NotificationService);
  protected readonly banner = signal<string | null>(null);

  protected barWidth(value: number): number {
    const max = Math.max(1, ...(this.exposure.value()?.rows ?? []).map((r) => r.exposureUsd));
    return Math.round((value / max) * 100);
  }

  protected onFinished(result: DecisionResult): void {
    if (result.ok) this.notify.show(result.message);
    this.banner.set(result.ok ? null : result.message);
    if (result.ok || result.refresh) {
      this.pending.reload();
      this.outstanding.reload();
    }
  }

  ngOnInit(): void {
    this.pending.reload();
    this.outstanding.reload();
    this.exposure.reload();
  }

  protected exposureTotal(): string {
    const total = this.exposure.value()?.totalUsd;
    return total === undefined
      ? '-'
      : `USD ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
