import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DemoAccount } from '../../core/config/app-config';
import { DemoAccountPickerComponent } from './demo-account-picker.component';

/** Server-side validation messages for the two fields (400 validation-error). */
export interface LoginFieldMessages {
  readonly email?: string;
  readonly password?: string;
}

export interface LoginSubmission {
  readonly email: string;
  readonly password: string;
}

@Component({
  selector: 'app-login-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    DemoAccountPickerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './login-form.component.scss',
  templateUrl: './login-form.component.html',
})
export class LoginFormComponent {
  readonly isSubmitting = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly fieldMessages = input<LoginFieldMessages>({});
  readonly demoAccounts = input<readonly DemoAccount[]>([]);
  readonly submitted = output<LoginSubmission>();

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required]],
  });
  protected readonly isPasswordHidden = signal(true);
  protected readonly announcement = signal('');
  private readonly injector = inject(Injector);

  private readonly emailInput = viewChild.required<ElementRef<HTMLInputElement>>('emailInput');
  private readonly passwordInput =
    viewChild.required<ElementRef<HTMLInputElement>>('passwordInput');
  private readonly banner = viewChild<ElementRef<HTMLElement>>('banner');

  constructor() {
    afterNextRender(() => this.emailInput().nativeElement.focus());
    effect(() => this.syncFormState());
    afterRenderEffect(() => {
      const element = this.banner();
      if (this.errorMessage() && element) element.nativeElement.focus();
    });
  }

  protected submit(): void {
    if (this.isSubmitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.emit(this.form.getRawValue());
  }

  protected togglePasswordVisibility(): void {
    this.isPasswordHidden.update((hidden) => !hidden);
  }

  protected fillEmail(email: string): void {
    this.form.controls.email.setValue(email);
    // Clear first so a repeated selection is announced again.
    this.announcement.set('');
    afterNextRender(() => this.announcement.set(`Email filled with ${email}`), {
      injector: this.injector,
    });
    this.passwordInput().nativeElement.focus();
  }

  /** One effect owns enable/disable and server messages, because enabling re-runs validation. */
  private syncFormState(): void {
    if (this.isSubmitting()) {
      this.form.disable();
      return;
    }
    this.form.enable();
    const { email, password } = this.fieldMessages();
    if (email) this.form.controls.email.setErrors({ server: email });
    if (password) this.form.controls.password.setErrors({ server: password });
    if (email || password) this.form.markAllAsTouched();
  }
}
