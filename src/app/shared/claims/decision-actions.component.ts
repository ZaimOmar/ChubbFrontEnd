import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { Observable } from 'rxjs';
import { ClaimsStaffClaimView } from '../../api/model/models';
import { AuthService } from '../../core/auth/auth.service';
import { ClaimsFacade } from '../../core/claims/claims.facade';
import { partyLabel } from '../../core/claims/party-label';
import { describeError, shouldRefresh } from '../../core/claims/problem-messages';
import { createSubmissionGuard } from '../../core/idempotency/submission-guard';
import { ConfirmDialogComponent, ConfirmDialogData } from '../dialogs/confirm-dialog.component';
import { FieldComponent } from '../form/field.component';

export interface DecisionResult {
  readonly message: string;
  /** True when the claim moved on and the parent should reload. */
  readonly refresh: boolean;
  readonly ok: boolean;
}

/**
 * Inline decision popover for one pending proposal (mockup 24): Confirm in one click, or Send back
 * with a reason. A reject proposal still asks for confirmation in a dialog. The maker sees only a
 * hint; the backend answers 403 maker-cannot-check regardless.
 */
@Component({
  selector: 'app-decision-actions',
  imports: [ReactiveFormsModule, MatButtonModule, MatMenuModule, FieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    span.hint {
      font: 400 10px/16px var(--font-mono);
      color: var(--slate-500);
    }
    .pop {
      display: block;
      min-width: 280px;
      padding: 12px 16px;
      font: 400 12px/16px var(--font-mono);
      color: var(--slate-600);
    }
    .pop strong {
      color: var(--slate-900);
    }
    .pop p {
      margin: 4px 0;
      font: 400 12px/16px var(--font-sans);
    }
    .row {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
  `,
  template: `
    @if (proposal(); as p) {
      @if (isMaker()) {
        <span class="hint">You proposed this, another manager must check it.</span>
      } @else {
        <button
          mat-flat-button
          type="button"
          [matMenuTriggerFor]="pop"
          [disabled]="guard.isInFlight()"
          [attr.aria-label]="'Review decision for ' + claim().claimNumber"
          (menuClosed)="sendingBack.set(false)"
        >
          {{ guard.isInFlight() ? 'Working...' : 'Review' }}
        </button>
        <mat-menu #pop="matMenu" class="account-menu">
          <div
            class="pop"
            tabindex="-1"
            role="group"
            [attr.aria-label]="'Decision for ' + claim().claimNumber"
            (click)="$event.stopPropagation()"
            (keydown)="onKey($event)"
          >
            <strong>{{ claim().claimNumber }}</strong> {{ claim().market }} {{ claim().type }}
            <p>
              Proposal: {{ p.outcome }}
              @if (p.reasonCode) {
                ({{ p.reasonCode }})
              }
              by {{ makerLabel() }} - "{{ p.rationale }}"
            </p>
            @if (sendingBack()) {
              <app-field
                label="Send back reason *"
                [max]="1000"
                [control]="reason"
                [messages]="{
                  required: 'Enter a reason of at least 10 characters.',
                  minlength: 'Enter a reason of at least 10 characters.',
                }"
              >
                <textarea [formControl]="reason" rows="3" maxlength="1000"></textarea>
              </app-field>
              <div class="row">
                <button mat-flat-button type="button" (click)="submitSendBack(p.id)">
                  Send back
                </button>
                <button mat-button type="button" (click)="sendingBack.set(false)">Cancel</button>
              </div>
            } @else {
              <div class="row">
                <button mat-flat-button type="button" (click)="confirm(p.id, p.outcome)">
                  Confirm
                </button>
                <button mat-stroked-button type="button" (click)="sendingBack.set(true)">
                  Send back...
                </button>
              </div>
            }
          </div>
        </mat-menu>
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
  private readonly trigger = viewChild(MatMenuTrigger);
  protected readonly guard = createSubmissionGuard();
  protected readonly sendingBack = signal(false);
  protected readonly reason = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(10)],
  });

  protected readonly proposal = computed(() =>
    this.claim().status === 'PendingDecisionApproval' ? this.claim().openProposal : undefined,
  );
  protected readonly isMaker = computed(() => this.proposal()?.makerId === this.auth.user()?.id);
  protected readonly makerLabel = computed(() =>
    partyLabel(this.proposal()?.makerId, 'Officer', this.auth.user()?.id),
  );

  /** Keys typed in the popover (e.g. the reason) must not reach the page shortcuts. */
  protected onKey(event: KeyboardEvent): void {
    if (event.key !== 'Escape') event.stopPropagation();
  }

  protected confirm(pid: string, outcome: string): void {
    const claim = this.claim();
    if (outcome !== 'Reject') {
      this.run(this.facade.confirm(this.guard, claim.id, pid), `Confirmed ${claim.claimNumber}.`);
      return;
    }
    const data: ConfirmDialogData = {
      title: 'Confirm this rejection?',
      lines: [
        `${claim.claimNumber}: Reject`,
        'The claimant will be told the result. You cannot change it here.',
      ],
      confirmLabel: 'Confirm rejection',
    };
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ok) => {
        if (ok)
          this.run(
            this.facade.confirm(this.guard, claim.id, pid),
            `Confirmed ${claim.claimNumber}.`,
          );
      });
  }

  protected submitSendBack(pid: string): void {
    this.reason.markAsTouched();
    if (this.reason.invalid) return;
    const claim = this.claim();
    this.run(
      this.facade.sendBack(this.guard, claim.id, pid, { reason: this.reason.value.trim() }),
      `Sent back ${claim.claimNumber}.`,
    );
  }

  private run(call: Observable<ClaimsStaffClaimView>, success: string): void {
    this.trigger()?.closeMenu();
    call.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.finished.emit({ ok: true, refresh: true, message: success }),
      error: (e: unknown) =>
        this.finished.emit({ ok: false, refresh: shouldRefresh(e), message: describeError(e) }),
    });
  }
}
