import { FieldComponent } from '../../../shared/form/field.component';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ClaimsStaffClaimView } from '../../../api/model/models';
import { ClaimsFacade } from '../../../core/claims/claims.facade';
import { describeError } from '../../../core/claims/problem-messages';
import { createSubmissionGuard } from '../../../core/idempotency/submission-guard';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';

export interface AssessDialogData {
  readonly claim: ClaimsStaffClaimView;
}

/** Set the assessed amount (mockup 06). Figures after saving come from the server response. */
@Component({
  selector: 'app-assess-dialog',
  imports: [
    FieldComponent,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressBarModule,
    MoneyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Set assessed amount</h2>
    <mat-dialog-content>
      <p>
        {{ data.claim.claimNumber }} - Estimated
        {{ data.claim.estimatedAmount | money: data.claim.currency }}
      </p>
      @if (result(); as r) {
        <div aria-live="polite">
          <dl>
            <dt>Assessed</dt>
            <dd>{{ r.assessedAmount | money: r.currency }}</dd>
            <dt>Net payable</dt>
            <dd>{{ r.netPayable | money: r.currency }}</dd>
            <dt>Reserve</dt>
            <dd>{{ r.reserve | money: r.currency }}</dd>
          </dl>
          @if (r.netPayable === 0) {
            <p role="status">
              Net payable is {{ 0 | money: r.currency }}. This claim cannot be approved; consider
              proposing rejection.
            </p>
          }
        </div>
      } @else {
        @if (guard.isInFlight()) {
          <mat-progress-bar mode="indeterminate" aria-label="Saving" />
        }
        @if (errorText(); as text) {
          <p role="alert">{{ text }}</p>
        }
        <form [formGroup]="form" (ngSubmit)="save()" id="assess-form" novalidate>
          <app-field
            [label]="'Assessed amount (' + data.claim.currency + ')'"
            icon="payments"
            hint="The gross loss you assess, before excess."
            [control]="form.controls.assessedAmount"
            [messages]="{
              required: 'Enter an assessed amount of at least 0.01.',
              min: 'Enter an assessed amount of at least 0.01.',
            }"
          >
            <input type="number" step="0.01" formControlName="assessedAmount" />
          </app-field>
          <app-field label="Note (optional)" [max]="1000" [control]="form.controls.note">
            <textarea formControlName="note" maxlength="1000"></textarea>
          </app-field>
        </form>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (result(); as r) {
        <button mat-flat-button type="button" (click)="ref.close(r)">Done</button>
      } @else {
        <button mat-button type="button" (click)="ref.close()">Cancel</button>
        <button mat-flat-button type="submit" form="assess-form" [disabled]="guard.isInFlight()">
          Save
        </button>
      }
    </mat-dialog-actions>
  `,
})
export class AssessDialogComponent {
  protected readonly data = inject<AssessDialogData>(MAT_DIALOG_DATA);
  protected readonly ref =
    inject<MatDialogRef<AssessDialogComponent, ClaimsStaffClaimView>>(MatDialogRef);
  private readonly facade = inject(ClaimsFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly guard = createSubmissionGuard();

  protected readonly form = this.fb.group({
    assessedAmount: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
    ]),
    note: [''],
  });
  protected readonly result = signal<ClaimsStaffClaimView | null>(null);
  protected readonly errorText = signal<string | null>(null);

  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { assessedAmount, note } = this.form.getRawValue();
    const trimmed = note.trim();
    this.errorText.set(null);
    this.facade
      .assess(this.guard, this.data.claim.id, {
        assessedAmount: Number(assessedAmount),
        ...(trimmed ? { note: trimmed } : {}),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (claim) => this.result.set(claim),
        error: (e: unknown) => this.errorText.set(describeError(e)),
      });
  }
}
