import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ClaimsFacade } from '../../core/claims/claims.facade';
import { describeError, shouldRefresh } from '../../core/claims/problem-messages';
import { createSubmissionGuard } from '../../core/idempotency/submission-guard';
import { NotificationService } from '../../core/notification/notification.service';

export interface PickUpResult {
  readonly claimId: string;
  readonly ok: boolean;
  /** Message for a failure banner; the parent reloads when `refresh` is set. */
  readonly message: string;
  readonly refresh: boolean;
}

/** Pick-up for one claim with its own idempotency guard, so rows are independent (mockup 04/19). */
@Component({
  selector: 'app-pick-up-button',
  imports: [MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      mat-flat-button
      type="button"
      [disabled]="guard.isInFlight()"
      [attr.aria-label]="'Pick up ' + claimNumber()"
      (click)="pickUp()"
    >
      {{ guard.isInFlight() ? 'Picking up...' : 'Pick up' }}
    </button>
  `,
})
export class PickUpButtonComponent {
  readonly claimId = input.required<string>();
  readonly claimNumber = input.required<string>();
  readonly finished = output<PickUpResult>();

  private readonly facade = inject(ClaimsFacade);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly guard = createSubmissionGuard();

  protected pickUp(): void {
    this.facade
      .assign(this.guard, this.claimId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notify.show(`You picked up ${this.claimNumber()}.`);
          this.finished.emit({ claimId: this.claimId(), ok: true, message: '', refresh: true });
        },
        error: (e: unknown) =>
          this.finished.emit({
            claimId: this.claimId(),
            ok: false,
            message: describeError(e),
            refresh: shouldRefresh(e),
          }),
      });
  }
}
