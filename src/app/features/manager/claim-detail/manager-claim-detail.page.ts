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
import { ClaimsStaffClaimView, ClaimsStaffTimelineEntry } from '../../../api/model/models';
import { AuthService } from '../../../core/auth/auth.service';
import { isStaffView } from '../../../core/claims/claim-views';
import { BreadcrumbService } from '../../../core/layout/breadcrumbs';
import { ClaimsFacade } from '../../../core/claims/claims.facade';
import { partyLabel } from '../../../core/claims/party-label';
import { toStaffTimeline } from '../../../core/claims/timeline-mapper';
import { AppError, isAppError } from '../../../core/http/app-error';
import { NotificationService } from '../../../core/notification/notification.service';
import { TimelineEntry } from '../../../shared/claim-timeline/timeline-entry.model';
import {
  DecisionActionsComponent,
  DecisionResult,
} from '../../../shared/claims/decision-actions.component';
import { StaffTrailComponent } from '../../../shared/claims/staff-trail.component';
import { ErrorPanelComponent } from '../../../shared/error-panel/error-panel.component';
import { LoadingBarComponent } from '../../../shared/loading-bar/loading-bar.component';
import { DateTimePipe } from '../../../shared/pipes/date-time.pipe';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
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
  selector: 'app-manager-claim-detail-page',
  imports: [
    ClaimSummaryCardComponent,
    DecisionCardComponent,
    ClaimHeaderCardComponent,
    DecisionActionsComponent,
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
      @if (banner(); as text) {
        <div class="banner" role="alert">{{ text }}</div>
      }
      <div class="detail-layout">
        @if (c.status === 'PendingDecisionApproval' && c.openProposal; as p) {
          <app-decision-card
            class="decision"
            heading="Decision awaiting check"
            icon="fact_check"
            tone="info"
          >
            <p>
              {{ p.outcome }}
              @if (p.amount !== null && p.amount !== undefined) {
                {{ p.amount | money: c.currency }}
              }
              proposed by {{ makerLabel() }}, {{ p.proposedAt | dateTime }}.
            </p>
            <p>Rationale: {{ p.rationale }}</p>
            @if (p.claimantReason) {
              <p>Message to claimant: {{ p.claimantReason }}</p>
            }
            <div cardFooter class="card-foot">
              <app-decision-actions [claim]="c" (finished)="onFinished($event)" />
            </div>
          </app-decision-card>
        } @else {
          <app-decision-card class="decision" heading="Decision" icon="info" tone="neutral">
            <p>No actions available for this status.</p>
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
export class ManagerClaimDetailPage {
  readonly id = input.required<string>();
  protected readonly subtitle = computed(() => {
    const c = this.claim();
    return c ? claimSubtitle(c) : '';
  });
  protected readonly summaryItems = computed(() => {
    const c = this.claim();
    return c ? staffSummaryItems(c, this.auth.user()?.id) : [];
  });
  private readonly breadcrumbs = inject(BreadcrumbService);

  private readonly facade = inject(ClaimsFacade);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly claim = signal<ClaimsStaffClaimView | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<AppError | null>(null);
  protected readonly banner = signal<string | null>(null);
  protected readonly timeline = signal<readonly TimelineEntry[]>([]);
  protected readonly timelineLoading = signal(true);
  protected readonly timelineError = signal<AppError | null>(null);
  protected readonly makerLabel = computed(() =>
    partyLabel(this.claim()?.openProposal?.makerId, 'Officer', this.auth.user()?.id),
  );

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
          this.timeline.set(
            toStaffTimeline(entries as ClaimsStaffTimelineEntry[], this.auth.user()?.id),
          );
          this.timelineLoading.set(false);
        },
        error: (e: unknown) => {
          this.timelineError.set(isAppError(e) ? e : UNEXPECTED);
          this.timelineLoading.set(false);
        },
      });
  }

  protected onFinished(result: DecisionResult): void {
    if (result.ok) this.notify.show(result.message);
    else this.banner.set(result.message);
    if (result.ok || result.refresh) this.load();
  }
}
