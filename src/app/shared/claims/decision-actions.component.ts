import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ClaimsStaffClaimView } from '../../api/model/models';
import { AuthService } from '../../core/auth/auth.service';
import { ClaimsFacade } from '../../core/claims/claims.facade';
import { partyLabel } from '../../core/claims/party-label';
import { describeError, shouldRefresh } from '../../core/claims/problem-messages';
import { createSubmissionGuard } from '../../core/idempotency/submission-guard';
import { ConfirmDialogComponent, ConfirmDialogData } from '../dialogs/confirm-dialog.component';
import { SendBackDialogComponent } from '../dialogs/send-back-dialog.component';

export interface DecisionResult {
  readonly message: string;
  /** True when the claim moved on and the parent should reload. */
  readonly refresh: boolean;
  readonly ok: boolean;
}

/**
 * Confirm / Send back for one pending proposal. Confirm sends the proposal id only (empty body).
 * The maker's buttons are hidden as a UX hint; the backend answers 403 maker-cannot-check regardless.
 */
@Component({
  selector: 'app-decision-actions',
  styles: `
    span {
      font: 400 10px/16px var(--font-mono);
      color: var(--slate-500);
    }
  `,
  imports: [MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (proposal(); as p) {
      @if (isMaker()) {
        <span>You proposed this, another manager must check it.</span>
      } @else {
        <button
          mat-flat-button
          type="button"
          [disabled]="guard.isInFlight()"
          [attr.aria-label]="'Confirm decision for ' + claim().claimNumber"
          (click)="confirm(p.id)"
        >
          Confirm decision
        </button>
        <button
          mat-stroked-button
          type="button"
          [disabled]="guard.isInFlight()"
          [attr.aria-label]="'Send back ' + claim().claimNumber"
          (click)="sendBack(p.id)"
        >
          Send back
        </button>
      }
    }
  `,
})
export class DecisionActionsComponent {
  readonly claim = input.required<ClaimsStaffClaimView>();
  readonly finished = output<DecisionResult>();

  private readonly facade = inject(ClaimsFacade);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly guard = createSubmissionGuard();

  protected readonly proposal = computed(() =>
    this.claim().status === 'PendingDecisionApproval' ? this.claim().openProposal : undefined,
  );
  protected readonly isMaker = computed(() => this.proposal()?.makerId === this.auth.user()?.id);

  protected confirm(pid: string): void {
    const claim = this.claim();
    const p = this.proposal();
    const data: ConfirmDialogData = {
      title: 'Confirm this decision?',
      lines: [
        `${claim.claimNumber}: ${p?.outcome}`,
        `Proposed by ${partyLabel(p?.makerId, 'Officer', this.auth.user()?.id)}.`,
        'Confirming applies it exactly as proposed. You cannot change it here.',
      ],
      confirmLabel: 'Confirm decision',
    };
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ok) => {
        if (ok)
          this.run(
            this.facade.confirm(this.guard, claim.id, pid),
            `Decision confirmed: ${claim.claimNumber}.`,
          );
      });
  }

  protected sendBack(pid: string): void {
    const claim = this.claim();
    this.dialog
      .open<SendBackDialogComponent, { claimNumber: string }, string>(SendBackDialogComponent, {
        data: { claimNumber: claim.claimNumber },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((reason) => {
        if (reason)
          this.run(
            this.facade.sendBack(this.guard, claim.id, pid, { reason }),
            `Sent back: ${claim.claimNumber}.`,
          );
      });
  }

  private run(call: Observable<ClaimsStaffClaimView>, success: string): void {
    call.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.finished.emit({ ok: true, refresh: true, message: success }),
      error: (e: unknown) =>
        this.finished.emit({ ok: false, refresh: shouldRefresh(e), message: describeError(e) }),
    });
  }
}
