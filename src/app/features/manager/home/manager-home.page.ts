import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClaimsFacade } from '../../../core/claims/claims.facade';
import { createBlock } from '../../../core/dashboard/block';
import { DashboardFacade } from '../../../core/dashboard/dashboard.facade';
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header>Overview</app-page-header>
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
        link="/manager/pending"
      />
      <app-stat-tile
        label="Exposure (USD, reporting rate)"
        [value]="exposureTotal()"
        link="/manager/pending"
      />
      @if (pending.value()?.items?.[0]?.openProposal; as oldest) {
        <app-stat-tile
          label="Oldest pending"
          [value]="oldest.proposedAt | age"
          link="/manager/pending"
        />
      }
    </section>

    <section class="card" aria-labelledby="pending-heading">
      <h2 id="pending-heading">
        Pending approvals (oldest first) <a routerLink="/manager/pending">View all</a>
      </h2>
      @if (pending.loading()) {
        <app-loading-bar variant="table" />
      } @else if (pending.error(); as problem) {
        <app-error-panel [message]="problem.message" (retry)="pending.reload()" />
      } @else if (pending.value()?.items?.length === 0) {
        <app-empty-state message="Nothing is waiting for approval." icon="task_alt" />
      } @else {
        <app-claim-list
          [rows]="pending.value()?.items ?? []"
          linkBase="/manager/claims"
          mode="pending"
          caption="Pending approvals"
        />
      }
    </section>

    <section class="card" aria-labelledby="exposure-heading">
      <h2 id="exposure-heading">Exposure by market and type</h2>
      @if (exposure.loading()) {
        <app-loading-bar variant="table" />
      } @else if (exposure.error(); as problem) {
        <app-error-panel [message]="problem.message" (retry)="exposure.reload()" />
      } @else {
        <table class="card">
          <caption class="cdk-visually-hidden-text">
            Exposure by market and type
          </caption>
          <thead>
            <tr>
              <th scope="col">Market</th>
              <th scope="col">Type</th>
              <th scope="col">Open claims</th>
              <th scope="col">Exposure (USD)</th>
            </tr>
          </thead>
          <tbody>
            @for (row of exposure.value()?.rows?.slice(0, 3); track row.market + row.type) {
              <tr>
                <td>{{ row.market }}</td>
                <td>{{ row.type }}</td>
                <td>{{ row.claimCount }}</td>
                <td>{{ row.exposureUsd }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `,
  styles: `
    section {
      margin-bottom: var(--s-5);
    }
    h2 a {
      font-size: 14px;
      margin-left: var(--s-3);
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th,
    td {
      text-align: left;
      padding: var(--s-2) var(--s-3);
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
