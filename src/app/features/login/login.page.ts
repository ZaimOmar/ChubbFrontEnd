import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { catchError, EMPTY, exhaustMap, finalize, Subject } from 'rxjs';
import { AuthService, NoAccessError } from '../../core/auth/auth.service';
import { APP_CONFIG } from '../../core/config/app-config';
import { AppError, isAppError } from '../../core/http/app-error';
import { LoginFieldMessages, LoginFormComponent, LoginSubmission } from './login-form.component';

const INVALID_CREDENTIALS = 'Email or password is incorrect.';
const NO_ACCESS = 'Your account has no access to this application.';
const TRY_AGAIN = 'We could not sign you in. Please try again.';

function messageFor(error: unknown): string {
  if (error instanceof NoAccessError) return NO_ACCESS;
  if (isAppError(error) && error.kind === 'unauthenticated') return INVALID_CREDENTIALS;
  return TRY_AGAIN;
}

function firstMessage(fieldErrors: AppError['fieldErrors'], field: string): string | undefined {
  const key = Object.keys(fieldErrors ?? {}).find((k) => k.toLowerCase() === field);
  return key ? fieldErrors?.[key]?.[0] : undefined;
}

/** Container: owns the submit stream; the form is presentational. */
@Component({
  selector: 'app-login-page',
  imports: [MatCardModule, MatProgressBarModule, LoginFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './login.page.scss',
  template: `
    <main class="page">
      <p class="brand">Chubb Claims</p>
      <mat-card>
        <mat-card-content>
          @if (isSubmitting()) {
            <mat-progress-bar mode="indeterminate" aria-label="Signing in" />
          }
          <h1>Sign in</h1>
          <app-login-form
            [isSubmitting]="isSubmitting()"
            [errorMessage]="errorMessage()"
            [fieldMessages]="fieldMessages()"
            [demoAccounts]="demoAccounts"
            (submitted)="submits.next($event)"
          />
        </mat-card-content>
      </mat-card>
    </main>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly demoAccounts = inject(APP_CONFIG).demoAccounts;
  protected readonly fieldMessages = signal<LoginFieldMessages>({});
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly submits = new Subject<LoginSubmission>();

  constructor() {
    this.submits
      .pipe(
        exhaustMap(({ email, password }) => {
          this.isSubmitting.set(true);
          this.errorMessage.set(null);
          this.fieldMessages.set({});
          return this.auth.login(email, password).pipe(
            catchError((error: unknown) => {
              this.showFailure(error);
              return EMPTY;
            }),
            finalize(() => this.isSubmitting.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(() => void this.router.navigateByUrl(this.auth.landingUrl()));
  }

  private showFailure(error: unknown): void {
    if (isAppError(error) && error.kind === 'validation') {
      const email = firstMessage(error.fieldErrors, 'email');
      const password = firstMessage(error.fieldErrors, 'password');
      if (email || password) {
        this.fieldMessages.set({ email, password });
        return;
      }
    }
    this.errorMessage.set(messageFor(error));
  }
}
