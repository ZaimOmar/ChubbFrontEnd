import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { DemoAccount } from '../../core/config/app-config';

/** Dev-only helper. It is not part of the login form and only reports the chosen email. */
@Component({
  selector: 'app-demo-account-picker',
  imports: [MatFormFieldModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './demo-account-picker.component.scss',
  template: `
    <section class="dev-block" aria-labelledby="dev-only-heading">
      <h2 id="dev-only-heading">Dev only</h2>
      <mat-form-field>
        <mat-label>Demo account</mat-label>
        <mat-select
          [value]="selected()"
          [disabled]="disabled()"
          (selectionChange)="choose($event.value)"
          (closed)="announceChoice()"
        >
          @for (account of accounts(); track account.email) {
            <mat-option [value]="account.email">{{ account.label }}</mat-option>
          }
        </mat-select>
        <mat-hint>Fills the email only. Password: see the README.</mat-hint>
      </mat-form-field>
    </section>
  `,
})
export class DemoAccountPickerComponent {
  readonly accounts = input.required<readonly DemoAccount[]>();
  readonly disabled = input(false);
  readonly accountSelected = output<string>();

  protected readonly selected = signal<string | null>(null);
  private readonly select = viewChild.required(MatSelect);
  private pendingEmail: string | null = null;

  protected choose(email: string): void {
    // With the panel closed (arrow keys on the focused select) there is no close event to wait for.
    if (!this.select().panelOpen) {
      this.accountSelected.emit(email);
      return;
    }
    this.pendingEmail = email;
  }

  /**
   * Panel selections are reported once the panel has closed: mat-select returns focus to itself
   * while closing, so the parent can only move focus to the password field after that. The select
   * is also reset so choosing the same account again re-applies it.
   */
  protected announceChoice(): void {
    if (this.pendingEmail === null) return;
    const email = this.pendingEmail;
    this.pendingEmail = null;
    this.selected.set(null);
    this.accountSelected.emit(email);
  }
}
