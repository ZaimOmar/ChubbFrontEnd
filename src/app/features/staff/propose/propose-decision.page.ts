import { PageHeaderComponent } from '../../../shared/layout/page-header.component';
import { SectionCardComponent } from '../../../shared/layout/section-card.component';
import { FieldComponent } from '../../../shared/form/field.component';
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
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { Router, RouterLink } from '@angular/router';
import { ClaimsProposeDecisionRequest, ClaimsStaffClaimView } from '../../../api/model/models';
import { AuthService } from '../../../core/auth/auth.service';
import { isStaffView } from '../../../core/claims/claim-views';
import { BreadcrumbService } from '../../../core/layout/breadcrumbs';
import { ClaimsFacade } from '../../../core/claims/claims.facade';
import { describeError, shouldRefresh } from '../../../core/claims/problem-messages';
import { AppError, isAppError } from '../../../core/http/app-error';
import { createSubmissionGuard } from '../../../core/idempotency/submission-guard';
import { NotificationService } from '../../../core/notification/notification.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/dialogs/confirm-dialog.component';
import { ErrorPanelComponent } from '../../../shared/error-panel/error-panel.component';
import { LoadingBarComponent } from '../../../shared/loading-bar/loading-bar.component';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';

type Outcome = ClaimsProposeDecisionRequest['outcome'];
type ReasonCode = NonNullable<ClaimsProposeDecisionRequest['reasonCode']>;

const REASONS: readonly { code: ReasonCode; label: string }[] = [
  { code: 'NOT_COVERED', label: 'Not covered' },
  { code: 'POLICY_INACTIVE', label: 'Policy inactive' },
  { code: 'EXCLUSION_APPLIES', label: 'Exclusion applies' },
  { code: 'INSUFFICIENT_EVIDENCE', label: 'Insufficient evidence' },
  { code: 'DUPLICATE_CLAIM', label: 'Duplicate claim' },
  { code: 'NO_RESPONSE', label: 'No response' },
];

const UNEXPECTED: AppError = {
  status: 0,
  kind: 'unexpected',
  message: 'Something went wrong. Please try again.',
};

@Component({
  selector: 'app-propose-decision-page',
  imports: [
    FieldComponent,
    PageHeaderComponent,
    SectionCardComponent,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatProgressBarModule,
    MatRadioModule,
    ErrorPanelComponent,
    LoadingBarComponent,
    MoneyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header [hidden]="true">Propose a decision</app-page-header>
    <app-section-card
      title="Propose a decision"
      caption="A manager must confirm before the claimant is told the result."
    >
      @if (loading()) {
        <app-loading-bar />
      } @else if (loadError(); as problem) {
        <app-error-panel
          [message]="problem.message"
          [correlationId]="problem.correlationId"
          (retry)="load()"
        />
      } @else if (claim(); as c) {
        @if (!canPropose()) {
          <p>Proposal is not possible in the current state of this claim.</p>
        } @else {
          <p>
            Estimated {{ c.estimatedAmount | money: c.currency }} - Assessed
            {{ c.assessedAmount | money: c.currency }} - Net payable
            {{ c.netPayable | money: c.currency }}
          </p>
          <form
            [formGroup]="form"
            (ngSubmit)="submit()"
            [attr.aria-busy]="guard.isInFlight()"
            novalidate
          >
            @if (guard.isInFlight()) {
              <mat-progress-bar mode="indeterminate" aria-label="Submitting" />
            }
            @if (errorText(); as text) {
              <p class="error" role="alert">{{ text }}</p>
            }
            <fieldset>
              <legend>Outcome</legend>
              <mat-radio-group formControlName="outcome">
                <mat-radio-button value="Approve" [disabled]="!canApprove()"
                  >Approve</mat-radio-button
                >
                <mat-radio-button value="Reject">Reject</mat-radio-button>
              </mat-radio-group>
              @if (!canApprove()) {
                <p>Approval is not possible: set an assessed amount with a net payable above 0.</p>
              }
            </fieldset>
            @if (outcome() === 'Approve') {
              <p>Amount to approve {{ c.netPayable | money: c.currency }} (net payable)</p>
            }
            @if (outcome() === 'Reject') {
              <app-field
                label="Rejection reason"
                icon="gavel"
                [control]="form.controls.reasonCode"
                [messages]="{ required: 'Choose a rejection reason.' }"
              >
                <select formControlName="reasonCode">
                  <option [ngValue]="null" disabled>Choose a reason</option>
                  @for (r of reasons; track r.code) {
                    <option [ngValue]="r.code">{{ r.label }}</option>
                  }
                </select>
              </app-field>
            }
            <app-field
              [label]="outcome() === 'Reject' ? 'Internal rationale (staff only)' : 'Rationale'"
              hint="At least 10 characters"
              [max]="2000"
              [control]="form.controls.rationale"
              [messages]="{
                required: 'Give a rationale of at least 10 characters.',
                minlength: 'Give a rationale of at least 10 characters.',
              }"
            >
              <textarea formControlName="rationale" rows="3" maxlength="2000"></textarea>
            </app-field>
            @if (outcome() === 'Reject') {
              <app-field
                label="Message to claimant"
                hint="Shown to the claimant after a manager confirms. 10 to 500 characters."
                [max]="500"
                [control]="form.controls.claimantReason"
                [messages]="{
                  required: 'Write a message to the claimant of at least 10 characters.',
                  minlength: 'Write a message to the claimant of at least 10 characters.',
                }"
              >
                <textarea formControlName="claimantReason" rows="3" maxlength="500"></textarea>
              </app-field>
            }
            @if (outcome() === 'Approve' && showJustification()) {
              <app-field
                label="Justification for amount above estimate"
                [max]="2000"
                [control]="form.controls.justification"
                [messages]="{ required: 'Explain why the amount is above the estimate.' }"
              >
                <textarea formControlName="justification" rows="2" maxlength="2000"></textarea>
              </app-field>
            }
            <div class="card-foot">
              <a mat-stroked-button [routerLink]="['/staff/claims', id()]">Cancel</a>
              <button mat-flat-button type="submit" [disabled]="guard.isInFlight()">
                Submit proposal
              </button>
            </div>
          </form>
        }
      }
    </app-section-card>
  `,
  styles: `
    form {
      display: grid;
      gap: 8px;
      max-width: 640px;
    }
    fieldset {
      border: 0;
      padding: 0;
    }
    .error {
      color: var(--mat-sys-error);
    }
  `,
})
export class ProposeDecisionPage {
  readonly id = input.required<string>();
  private readonly breadcrumbs = inject(BreadcrumbService);

  private readonly facade = inject(ClaimsFacade);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly guard = createSubmissionGuard();
  protected readonly reasons = REASONS;

  protected readonly claim = signal<ClaimsStaffClaimView | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<AppError | null>(null);
  protected readonly errorText = signal<string | null>(null);
  private readonly justificationDemanded = signal(false);

  protected readonly form = this.fb.group({
    outcome: this.fb.control<Outcome | null>(null, Validators.required),
    reasonCode: this.fb.control<ReasonCode | null>(null),
    rationale: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    claimantReason: ['', [Validators.maxLength(500)]],
    justification: [''],
  });
  protected readonly outcome = toSignal(this.form.controls.outcome.valueChanges, {
    initialValue: null,
  });

  protected readonly canPropose = computed(() => {
    const c = this.claim();
    return (
      !!c &&
      c.status === 'UnderReview' &&
      c.assignedOfficerId === this.auth.user()?.id &&
      !c.openProposal
    );
  });
  protected readonly canApprove = computed(() => {
    const c = this.claim();
    return !!c && c.assessedAmount !== null && c.assessedAmount !== undefined && !!c.netPayable;
  });
  protected readonly showJustification = computed(() => {
    const c = this.claim();
    return this.justificationDemanded() || (!!c?.netPayable && c.netPayable > c.estimatedAmount);
  });

  constructor() {
    effect(() => this.breadcrumbs.leaf.set(this.claim()?.claimNumber ?? null));
    inject(DestroyRef).onDestroy(() => this.breadcrumbs.leaf.set(null));
    effect(() => {
      this.id();
      untracked(() => this.load());
    });
    this.form.controls.outcome.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((outcome) => this.applyOutcomeValidators(outcome));
  }

  protected load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.facade
      .getClaim(this.id())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (view) => {
          if (isStaffView(view)) this.claim.set(view);
          else this.loadError.set(UNEXPECTED);
          this.loading.set(false);
        },
        error: (e: unknown) => {
          this.loadError.set(isAppError(e) ? e : UNEXPECTED);
          this.loading.set(false);
        },
      });
  }

  private applyOutcomeValidators(outcome: Outcome | null): void {
    const { reasonCode, claimantReason } = this.form.controls;
    const reject = outcome === 'Reject';
    reasonCode.setValidators(reject ? [Validators.required] : []);
    claimantReason.setValidators(
      reject
        ? [Validators.required, Validators.minLength(10), Validators.maxLength(500)]
        : [Validators.maxLength(500)],
    );
    reasonCode.updateValueAndValidity();
    claimantReason.updateValueAndValidity();
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    const raw = this.form.getRawValue();
    const outcome = raw.outcome;
    if (this.form.invalid || !outcome) {
      this.errorText.set('Choose approve or reject and complete the highlighted fields.');
      return;
    }
    const justification = raw.justification.trim();
    const request: ClaimsProposeDecisionRequest =
      outcome === 'Approve'
        ? {
            outcome,
            rationale: raw.rationale.trim(),
            ...(this.showJustification() && justification ? { justification } : {}),
          }
        : {
            outcome,
            reasonCode: raw.reasonCode,
            rationale: raw.rationale.trim(),
            claimantReason: raw.claimantReason.trim(),
          };
    const data: ConfirmDialogData = {
      title: 'Submit this proposal?',
      lines: [
        outcome === 'Approve' ? 'Outcome: Approve' : `Outcome: Reject (${raw.reasonCode})`,
        'A manager must confirm before the claimant is told the result.',
      ],
      confirmLabel: 'Submit proposal',
    };
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) this.send(request);
      });
  }

  private send(request: ClaimsProposeDecisionRequest): void {
    this.errorText.set(null);
    this.facade
      .propose(this.guard, this.id(), request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notify.show('Proposal sent for manager confirmation.');
          void this.router.navigate(['/staff/claims', this.id()]);
        },
        error: (e: unknown) => {
          if (isAppError(e) && e.problemType === 'justification-required') {
            this.justificationDemanded.set(true);
          }
          this.errorText.set(describeError(e));
          if (shouldRefresh(e)) this.load();
        },
      });
  }
}
