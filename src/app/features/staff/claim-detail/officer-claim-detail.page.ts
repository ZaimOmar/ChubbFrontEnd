import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { ClaimsStaffClaimView, ClaimsStaffTimelineEntry } from '../../../api/model/models';
import { isStaffView } from '../../../core/claims/claim-views';
import { BreadcrumbService } from '../../../core/layout/breadcrumbs';
import { ClaimsFacade } from '../../../core/claims/claims.facade';
import { partyLabel } from '../../../core/claims/party-label';
import { toStaffTimeline } from '../../../core/claims/timeline-mapper';
import { AuthService } from '../../../core/auth/auth.service';
import { AppError, isAppError } from '../../../core/http/app-error';
import { TimelineEntry } from '../../../shared/claim-timeline/timeline-entry.model';
import { StaffTrailComponent } from '../../../shared/claims/staff-trail.component';
import { ErrorPanelComponent } from '../../../shared/error-panel/error-panel.component';
import { LoadingBarComponent } from '../../../shared/loading-bar/loading-bar.component';
import { DateTimePipe } from '../../../shared/pipes/date-time.pipe';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { AssessDialogComponent } from './assess-dialog.component';
import { ClaimHeaderCardComponent } from '../../../shared/claims/claim-header-card.component';
import { DecisionCardComponent } from '../../../shared/claims/decision-card.component';
import { ClaimSummaryCardComponent } from '../../../shared/claims/claim-summary-card.component';
import { claimSubtitle, staffSummaryItems } from '../../../shared/claims/summary-items';

const UNEXPECTED: AppError = {
  status: 0,
  kind: 'unexpected',
  message: 'Something went wrong. Please try again.',
};

@Component({
  selector: 'app-officer-claim-detail-page',
  imports: [
    ClaimSummaryCardComponent,
    DecisionCardComponent,
    ClaimHeaderCardComponent,
    RouterLink,
    MatButtonModule,
    StaffTrailComponent,
    ErrorPanelComponent,
    LoadingBarComponent,
    DateTimePipe,
    MoneyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <app-loading-bar />
    } @else if (error(); as problem) {
      <app-error-panel
        [message]="problem.kind === 'not-found' ? 'We could not find that claim.' : problem.message"
        [correlationId]="problem.correlationId"
        (retry)="load()"
      />
    } @else if (claim(); as c) {
      <app-claim-header-card
        [claimNumber]="c.claimNumber"
        [status]="c.status"
        audience="staff"
        [subtitle]="subtitle()"
        (refresh)="load()"
      />
      <div class="detail-layout">
        @if (c.openProposal; as p) {
          <app-decision-card
            class="decision"
            heading="Waiting on checker"
            icon="hourglass_top"
            tone="neutral"
          >
            <p>
              Proposal {{ p.outcome }}
              @if (p.amount !== null && p.amount !== undefined) {
                {{ p.amount | money: c.currency }}
              }
              by {{ makerLabel() }} on {{ p.proposedAt | dateTime }} awaits manager confirmation.
            </p>
          </app-decision-card>
        } @else if (otherOfficer()) {
          <app-decision-card class="decision" heading="Read only" icon="lock" tone="neutral">
            <p>
              This claim is assigned to {{ assigneeLabel() }}. You can read the trail but not act on
              it.
            </p>
          </app-decision-card>
        } @else if (isAssignee()) {
          <app-decision-card class="decision" heading="Next action" icon="task_alt" tone="info">
            <p>{{ proposeHint() ?? 'Assess the claim, then propose a decision.' }}</p>
            <div cardFooter class="card-foot">
              <button
                mat-stroked-button
                type="button"
                [disabled]="!canAssess()"
                [attr.aria-disabled]="!canAssess()"
                (click)="openAssess()"
              >
                Set assessed amount
              </button>
              @if (canPropose()) {
                <a mat-flat-button [routerLink]="['/staff/claims', c.id, 'propose']"
                  >Propose decision</a
                >
              }
            </div>
          </app-decision-card>
        } @else {
          <app-decision-card class="decision" heading="Next action" icon="inbox" tone="neutral">
            <p>
              {{
                c.status === 'Submitted'
                  ? 'Pick this claim up from the incoming queue to act on it.'
                  : 'No actions available for this status.'
              }}
            </p>
          </app-decision-card>
        }
        <app-claim-summary-card class="summary" [items]="summaryItems()" />
        <div class="timeline">
          <app-staff-trail
            [entries]="timeline()"
            [loading]="timelineLoading()"
            [error]="timelineError()"
            (retry)="loadTimeline()"
          />
        </div>
      </div>
    }
  `,
})
export class OfficerClaimDetailPage {
  readonly id = input.required<string>();
  protected readonly subtitle = computed(() => {
    const c = this.claim();
    return c ? claimSubtitle(c) : '';
  });
  protected readonly summaryItems = computed(() => {
    const c = this.claim();
    return c ? staffSummaryItems(c, this.me()) : [];
  });
  private readonly breadcrumbs = inject(BreadcrumbService);

  private readonly facade = inject(ClaimsFacade);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);

  protected readonly claim = signal<ClaimsStaffClaimView | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<AppError | null>(null);
  protected readonly timeline = signal<readonly TimelineEntry[]>([]);
  protected readonly timelineLoading = signal(true);
  protected readonly timelineError = signal<AppError | null>(null);

  private readonly me = computed(() => this.auth.user()?.id);
  protected readonly isAssignee = computed(
    () => !!this.me() && this.claim()?.assignedOfficerId === this.me(),
  );
  protected readonly otherOfficer = computed(() => {
    const assignee = this.claim()?.assignedOfficerId;
    return !!assignee && assignee !== this.me();
  });
  protected readonly assigneeLabel = computed(
    () => partyLabel(this.claim()?.assignedOfficerId, 'Officer', this.me()) || 'Unassigned',
  );
  protected readonly makerLabel = computed(() =>
    partyLabel(this.claim()?.openProposal?.makerId, 'Officer', this.me()),
  );
  protected readonly canAssess = computed(
    () => this.isAssignee() && this.claim()?.status === 'UnderReview',
  );
  protected readonly canPropose = computed(() => {
    const c = this.claim();
    return (
      this.canAssess() &&
      c?.assessedAmount !== null &&
      c?.assessedAmount !== undefined &&
      !c.openProposal
    );
  });
  protected readonly proposeHint = computed(() => {
    const c = this.claim();
    if (!c || !this.isAssignee() || c.status === 'Approved' || c.status === 'Rejected') return null;
    if (c.status !== 'UnderReview') return 'No actions available for this status.';
    if (c.assessedAmount === null || c.assessedAmount === undefined)
      return 'Set an assessed amount first.';
    return c.openProposal ? 'A proposal is already waiting.' : null;
  });

  constructor() {
    effect(() => this.breadcrumbs.leaf.set(this.claim()?.claimNumber ?? null));
    inject(DestroyRef).onDestroy(() => this.breadcrumbs.leaf.set(null));
    effect(() => {
      this.id();
      untracked(() => this.load());
    });
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.facade
      .getClaim(this.id())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (view) => {
          if (isStaffView(view)) this.claim.set(view);
          else this.error.set(UNEXPECTED);
          this.loading.set(false);
        },
        error: (e: unknown) => {
          this.error.set(isAppError(e) ? e : UNEXPECTED);
          this.loading.set(false);
        },
      });
    this.loadTimeline();
  }

  protected loadTimeline(): void {
    this.timelineLoading.set(true);
    this.timelineError.set(null);
    this.facade
      .getTimeline(this.id())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (entries) => {
          this.timeline.set(toStaffTimeline(entries as ClaimsStaffTimelineEntry[], this.me()));
          this.timelineLoading.set(false);
        },
        error: (e: unknown) => {
          this.timelineError.set(isAppError(e) ? e : UNEXPECTED);
          this.timelineLoading.set(false);
        },
      });
  }

  protected openAssess(): void {
    const claim = this.claim();
    if (!claim) return;
    this.dialog
      .open<AssessDialogComponent, { claim: ClaimsStaffClaimView }, ClaimsStaffClaimView>(
        AssessDialogComponent,
        { data: { claim }, autoFocus: 'dialog' },
      )
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updated) => {
        if (updated) this.claim.set(updated);
        this.loadTimeline();
      });
  }
}
