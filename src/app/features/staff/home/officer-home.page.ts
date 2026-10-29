import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ClaimsFacade } from '../../../core/claims/claims.facade';
import { createBlock } from '../../../core/dashboard/block';
import { ClaimListComponent } from '../../../shared/claims/claim-list.component';
import {
  PickUpButtonComponent,
  PickUpResult,
} from '../../../shared/claims/pick-up-button.component';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ErrorPanelComponent } from '../../../shared/error-panel/error-panel.component';
import { PageHeaderComponent } from '../../../shared/layout/page-header.component';
import { StatTileComponent } from '../../../shared/layout/stat-tile.component';
import { LoadingBarComponent } from '../../../shared/loading-bar/loading-bar.component';
import { AgePipe } from '../../../shared/pipes/age.pipe';

const PREVIEW = 5;

@Component({
  selector: 'app-officer-home-page',
  imports: [
    RouterLink,
    AgePipe,
    ClaimListComponent,
    PickUpButtonComponent,
    EmptyStateComponent,
    ErrorPanelComponent,
    LoadingBarComponent,
    PageHeaderComponent,
    StatTileComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Welcome back" />
    @if (isManager()) {
      <p><a routerLink="/manager/home">Switch to Manager view</a></p>
    }
    <section class="grid" aria-label="Summary" aria-live="polite">
      <app-stat-tile
        label="Incoming claims"
        [value]="incoming.value()?.totalCount ?? '-'"
        hint="Open queue"
        link="/staff/queue"
      />
      <app-stat-tile
        label="Assigned to me"
        [value]="assigned.value()?.totalCount ?? '-'"
        hint="View"
        link="/staff/queue"
        [queryParams]="{ tab: 'mine' }"
      />
      <app-stat-tile
        label="Waiting on checker"
        [value]="waitingOnChecker()"
        hint="Of my assigned claims"
        link="/staff/queue"
        [queryParams]="{ tab: 'mine', status: 'PendingDecisionApproval' }"
      />
      @if (incoming.value()?.items?.[0]; as oldest) {
        <app-stat-tile
          label="Oldest incoming"
          [value]="oldest.submittedAt | age"
          [hint]="oldest.claimNumber"
          [link]="'/staff/claims/' + oldest.id"
        />
      }
    </section>

    <section class="card" aria-labelledby="next-heading">
      <h2 id="next-heading">
        Next in queue (oldest first) <a routerLink="/staff/queue">Open full queue</a>
      </h2>
      @if (incoming.loading()) {
        <app-loading-bar variant="table" />
      } @else if (incoming.error(); as problem) {
        <app-error-panel [message]="problem.message" (retry)="incoming.reload()" />
      } @else if (incoming.value()?.items?.length === 0) {
        <app-empty-state message="The queue is empty. Nice work." />
      } @else {
        @if (banner(); as text) {
          <div class="banner" role="alert">{{ text }}</div>
        }
        <app-claim-list
          [rows]="incoming.value()?.items?.slice(0, preview) ?? []"
          linkBase="/staff/claims"
          caption="Next in queue"
          [actions]="pickUpCell"
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

    <section class="card" aria-labelledby="mine-heading">
      <h2 id="mine-heading">My assigned claims</h2>
      @if (assigned.loading()) {
        <app-loading-bar variant="table" />
      } @else if (assigned.error(); as problem) {
        <app-error-panel [message]="problem.message" (retry)="assigned.reload()" />
      } @else if (assigned.value()?.items?.length === 0) {
        <app-empty-state message="No claims are assigned to you." />
      } @else {
        <app-claim-list
          [rows]="assigned.value()?.items?.slice(0, preview) ?? []"
          linkBase="/staff/claims"
          caption="My assigned claims"
        />
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
  `,
})
export class OfficerHomePage implements OnInit {
  private readonly facade = inject(ClaimsFacade);
  private readonly auth = inject(AuthService);
  protected readonly preview = PREVIEW;
  protected readonly isManager = () => this.auth.roles().includes('Manager');
  protected readonly banner = signal<string | null>(null);

  protected readonly incoming = createBlock(() =>
    this.facade.listOldest({ status: 'Submitted', page: 1, pageSize: PREVIEW }),
  );
  protected readonly assigned = createBlock(() =>
    this.facade.listAssigned(this.auth.user()?.id ?? ''),
  );

  ngOnInit(): void {
    this.incoming.reload();
    this.assigned.reload();
  }

  protected waitingOnChecker(): number | string {
    const items = this.assigned.value()?.items;
    return items ? items.filter((c) => c.status === 'PendingDecisionApproval').length : '-';
  }

  protected onPickedUp(result: PickUpResult): void {
    this.banner.set(result.ok ? null : result.message);
    this.incoming.reload();
    this.assigned.reload();
  }
}
