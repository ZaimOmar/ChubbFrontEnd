import { FieldComponent } from '../form/field.component';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

/** Collects the send-back reason (10 to 1000 characters). Closes with the trimmed reason. */
@Component({
  selector: 'app-send-back-dialog',
  imports: [FieldComponent, ReactiveFormsModule, MatButtonModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Send back to the officer</h2>
    <mat-dialog-content>
      <p>{{ data.claimNumber }}</p>
      <form [formGroup]="form" id="send-back-form" (ngSubmit)="submit()" novalidate>
        <app-field
          label="Reason"
          hint="At least 10 characters"
          [max]="1000"
          [control]="form.controls.reason"
          [messages]="{
            required: 'Give a reason of at least 10 characters.',
            minlength: 'Give a reason of at least 10 characters.',
          }"
        >
          <textarea formControlName="reason" rows="4" maxlength="1000"></textarea>
        </app-field>
      </form>
      <p>The claimant will not be told about the send-back.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="ref.close()">Cancel</button>
      <button mat-flat-button type="submit" form="send-back-form">Send back</button>
    </mat-dialog-actions>
  `,
})
export class SendBackDialogComponent {
  protected readonly data = inject<{ claimNumber: string }>(MAT_DIALOG_DATA);
  protected readonly ref = inject<MatDialogRef<SendBackDialogComponent, string>>(MatDialogRef);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
  });

  protected submit(): void {
    this.form.markAllAsTouched();
    const reason = this.form.controls.reason.value.trim();
    if (reason.length >= 10) this.ref.close(reason);
  }
}
