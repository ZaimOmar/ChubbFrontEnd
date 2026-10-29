import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { ClaimsFacade } from '../../../core/claims/claims.facade';
import { createBlock } from '../../../core/dashboard/block';
import { ClaimListComponent } from '../../../shared/claims/claim-list.component';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ErrorPanelComponent } from '../../../shared/error-panel/error-panel.component';
import { PageHeaderComponent } from '../../../shared/layout/page-header.component';
import { LoadingBarComponent } from '../../../shared/loading-bar/loading-bar.component';

@Component({
  selector: 'app-claimant-home-page',
  imports: [
    RouterLink,
    MatButtonModule,
    ClaimListComponent,
    EmptyStateComponent,
    ErrorPanelComponent,
    LoadingBarComponent,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Welcome back" />
    <section class="card" aria-labelledby="report-heading">
      <h2 id="report-heading">Something happened?</h2>
      <p>Report an incident in about 5 minutes.</p>
      <a mat-flat-button routerLink="/claimant/report">Report incident</a>
    </section>
    <section class="card" aria-labelledby="claims-heading">
      <h2 id="claims-heading">My claims <a routerLink="/claimant/claims">View all</a></h2>
      @if (claims.loading()) {
        <app-loading-bar variant="table" />
      } @else if (claims.error(); as problem) {
        <app-error-panel [message]="problem.message" (retry)="claims.reload()" />
      } @else if (claims.value()?.items?.length === 0) {
        <app-empty-state message="You have no claims yet." />
      } @else {
        <app-claim-list
          [rows]="claims.value()?.items ?? []"
          linkBase="/claimant/claims"
          audience="claimant"
          mode="compact"
          caption="My latest claims"
        />
      }
    </section>
  `,
  styles: `
    h2 a {
      font-size: 14px;
      margin-left: var(--s-3);
    }
  `,
})
export class ClaimantHomePage implements OnInit {
  private readonly claimsFacade = inject(ClaimsFacade);
  protected readonly claims = createBlock(() => this.claimsFacade.listMine(1, 5));

  ngOnInit(): void {
    this.claims.reload();
  }
}
