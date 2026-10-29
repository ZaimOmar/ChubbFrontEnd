import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  TemplateRef,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { partyLabel } from '../../core/claims/party-label';
import { AgePipe } from '../pipes/age.pipe';
import { MoneyPipe } from '../pipes/money.pipe';
import { ClaimStatus } from '../status-badge/claim-status';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

/** The fields every list needs; both the staff and claimant views satisfy it structurally. */
export interface ClaimRow {
  readonly id: string;
  readonly claimNumber: string;
  readonly market: string;
  readonly type: string;
  readonly currency: string;
  readonly status: ClaimStatus;
  readonly estimatedAmount: number;
  readonly submittedAt: string;
  readonly assessedAmount?: number | null;
  readonly openProposal?: {
    readonly outcome: string;
    readonly amount?: number | null;
    readonly reasonCode?: string | null;
    readonly makerId: string;
    readonly proposedAt: string;
  };
}

export type ClaimListMode = 'queue' | 'pending' | 'compact';

/**
 * Clickable claims table (mockup 19). The claim number is the single tab stop and a real link;
 * a CSS overlay stretches it over the row. Action buttons sit above the overlay.
 */
@Component({
  selector: 'app-claim-list',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    AgePipe,
    MoneyPipe,
    StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './claim-list.component.scss',
  template: `
    <div class="scroll" tabindex="0" [attr.aria-label]="caption() + ' (scrollable)'">
      <table>
        <caption class="cdk-visually-hidden-text">
          {{
            caption()
          }}
        </caption>
        <thead>
          <tr
            matSort
            [matSortActive]="sortable() ? 'submittedAt' : ''"
            [matSortDirection]="sortDirection()"
            matSortDisableClear
            (matSortChange)="sortChange.emit($event)"
          >
            <th scope="col">Claim number</th>
            <th scope="col">Market</th>
            <th scope="col">Type</th>
            @if (mode() === 'pending') {
              <th scope="col">Proposed</th>
            }
            <th scope="col" class="num">Amount</th>
            @if (mode() === 'pending') {
              <th scope="col">Maker</th>
            }
            @if (sortable()) {
              <th
                scope="col"
                mat-sort-header="submittedAt"
                [start]="sortDirection() === 'asc' ? 'asc' : 'desc'"
              >
                Age
              </th>
            } @else {
              <th scope="col">{{ mode() === 'pending' ? 'Waiting' : 'Age' }}</th>
            }
            <th scope="col">Status</th>
            @if (actions()) {
              <th scope="col"><span class="cdk-visually-hidden-text">Actions</span></th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.id) {
            <tr>
              <td>
                <a class="row-link" [routerLink]="[linkBase(), row.id]">{{ row.claimNumber }}</a>
                <mat-icon class="chevron" aria-hidden="true">chevron_right</mat-icon>
              </td>
              <td>{{ row.market }}</td>
              <td>{{ row.type }}</td>
              @if (mode() === 'pending') {
                <td>
                  {{ row.openProposal?.outcome }}
                  @if (row.openProposal?.reasonCode; as code) {
                    ({{ code }})
                  }
                </td>
              }
              <td class="num">{{ amountOf(row) | money: row.currency }}</td>
              @if (mode() === 'pending') {
                <td>{{ makerOf(row) }}</td>
              }
              <td>
                {{ (mode() === 'pending' ? row.openProposal?.proposedAt : row.submittedAt) | age }}
              </td>
              <td><app-status-badge [status]="row.status" [audience]="audience()" /></td>
              @if (actions(); as tpl) {
                <td class="row-actions">
                  <ng-container
                    [ngTemplateOutlet]="tpl"
                    [ngTemplateOutletContext]="{ $implicit: row }"
                  />
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
    @if (total() !== null) {
      <mat-paginator
        class="pager"
        [length]="total() ?? 0"
        [pageIndex]="pageIndex()"
        [pageSize]="pageSize()"
        [pageSizeOptions]="pageSizeOptions"
        showFirstLastButtons
        aria-label="Select page of claims"
        (page)="pageChange.emit($event)"
      />
    }
  `,
})
export class ClaimListComponent {
  readonly rows = input.required<readonly ClaimRow[]>();
  /** Detail route prefix by role, e.g. `/staff/claims`. */
  readonly linkBase = input.required<string>();
  readonly mode = input<ClaimListMode>('queue');
  readonly audience = input<'staff' | 'claimant'>('staff');
  readonly caption = input('Claims');
  readonly actions = input<TemplateRef<{ $implicit: ClaimRow }>>();
  /** Server-side paging: set `total` to show the paginator. */
  readonly total = input<number | null>(null);
  readonly pageIndex = input(0);
  readonly pageSize = input(10);
  readonly sortable = input(false);
  readonly sortDirection = input<'asc' | 'desc'>('asc');
  readonly pageChange = output<PageEvent>();
  readonly sortChange = output<Sort>();
  protected readonly pageSizeOptions = [10, 20, 50];

  private readonly me = inject(AuthService).user;
  protected readonly myId = computed(() => this.me()?.id);

  protected amountOf(row: ClaimRow): number | null | undefined {
    return this.mode() === 'pending' ? row.openProposal?.amount : row.estimatedAmount;
  }

  protected makerOf(row: ClaimRow): string {
    return partyLabel(row.openProposal?.makerId, 'Officer', this.myId());
  }
}
