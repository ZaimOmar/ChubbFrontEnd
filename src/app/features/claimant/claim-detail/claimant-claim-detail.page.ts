import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClaimsClaimantClaimView } from '../../../api/model/models';
import { isStaffView } from '../../../core/claims/claim-views';
import { RecentClaimsService } from '../../../core/layout/recent-claims';
import { BreadcrumbService } from '../../../core/layout/breadcrumbs';
import { ClaimsFacade } from '../../../core/claims/claims.facade';
import { toClaimantTimeline } from '../../../core/claims/timeline-mapper';
import { AppError, isAppError } from '../../../core/http/app-error';
import { ClaimTimelineComponent } from '../../../shared/claim-timeline/claim-timeline.component';
import { TimelineEntry } from '../../../shared/claim-timeline/timeline-entry.model';
import { ErrorPanelComponent } from '../../../shared/error-panel/error-panel.component';
import { LoadingBarComponent } from '../../../shared/loading-bar/loading-bar.component';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { claimSubtitle, claimantSummaryItems } from '../../../shared/claims/summary-items';
import { PageHeaderComponent } from '../../../shared/layout/page-header.component';
import { ClaimHeaderCardComponent } from '../../../shared/claims/claim-header-card.component';
import { DecisionCardComponent } from '../../../shared/claims/decision-card.component';
import { ClaimSummaryCardComponent } from '../../../shared/claims/claim-summary-card.component';

const UNEXPECTED: AppError = {
  status: 0,
  kind: 'unexpected',
  message: 'Something went wrong. Please try again.',
};

function asAppError(error: unknown): AppError {
  return isAppError(error) ? error : UNEXPECTED;
}

@Component({
  selector: 'app-claimant-claim-detail-page',
  imports: [
    PageHeaderComponent,
    ClaimSummaryCardComponent,
    DecisionCardComponent,
    ClaimHeaderCardComponent,
    ClaimTimelineComponent,
    ErrorPanelComponent,
    LoadingBarComponent,
    MoneyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header />
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
        audience="claimant"
        [subtitle]="subtitle()"
        (refresh)="load()"
      />
      <div class="detail-layout">
        @if (c.status === 'Approved') {
          <app-decision-card class="decision" heading="Approved" icon="check_circle" tone="success">
            <p>Your claim is approved for {{ c.approvedAmount | money: c.currency }}.</p>
          </app-decision-card>
        } @else if (c.status === 'Rejected') {
          <app-decision-card class="decision" heading="Rejected" icon="cancel" tone="danger">
            <p>Your claim was not approved.</p>
            @if (c.rejectionReason; as reason) {
              <p>Reason: {{ reason.label }}. {{ reason.claimantReason }}</p>
            }
          </app-decision-card>
        } @else {
          <app-decision-card
            class="decision"
            heading="We are reviewing your claim"
            icon="hourglass_top"
            tone="info"
          >
            <p>We will update this page when there is a decision.</p>
          </app-decision-card>
        }
        <app-claim-summary-card class="summary" [items]="summaryItems()" />
        <div class="timeline">
          <app-claim-timeline
            audience="claimant"
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
export class ClaimantClaimDetailPage {
  readonly id = input.required<string>();
  private readonly recent = inject(RecentClaimsService);
  protected readonly subtitle = computed(() => {
    const c = this.claim();
    return c ? claimSubtitle(c) : '';
  });
  protected readonly summaryItems = computed(() => {
    const c = this.claim();
    return c ? claimantSummaryItems(c) : [];
  });
  private readonly breadcrumbs = inject(BreadcrumbService);
  protected readonly decisionClass = computed(() => {
    const status = this.claim()?.status;
    return status === 'Approved'
      ? 'decision-approved'
      : status === 'Rejected'
        ? 'decision-rejected'
        : 'decision-info';
  });

  private readonly facade = inject(ClaimsFacade);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly claim = signal<ClaimsClaimantClaimView | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<AppError | null>(null);
  protected readonly timeline = signal<readonly TimelineEntry[]>([]);
  protected readonly timelineLoading = signal(true);
  protected readonly timelineError = signal<AppError | null>(null);

  constructor() {
    effect(() => {
      const c = this.claim();
      if (c) this.recent.add({ id: c.id, number: c.claimNumber, base: '/claimant/claims' });
    });
    effect(() => this.breadcrumbs.leaf.set(this.claim()?.claimNumber ?? null));
    inject(DestroyRef).onDestroy(() => this.breadcrumbs.leaf.set(null));
    effect(() => {
      this.id();
      this.load();
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
          if (isStaffView(view)) this.error.set(UNEXPECTED);
          else this.claim.set(view);
          this.loading.set(false);
        },
        error: (e: unknown) => {
          this.error.set(asAppError(e));
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
        next: (items) => {
          this.timeline.set(
            toClaimantTimeline(items as { id: string; occurredAt: string; summary: string }[]),
          );
          this.timelineLoading.set(false);
        },
        error: (e: unknown) => {
          this.timelineError.set(asAppError(e));
          this.timelineLoading.set(false);
        },
      });
  }
}
