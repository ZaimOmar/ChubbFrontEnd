import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { RouterLink } from '@angular/router';
import { ClaimsClaimantClaimView, ClaimsSubmitClaimRequest } from '../../../api/model/models';
import { ClaimsFacade } from '../../../core/claims/claims.facade';
import { describeError, fieldMessages } from '../../../core/claims/problem-messages';
import { createSubmissionGuard } from '../../../core/idempotency/submission-guard';
import { PageHeaderComponent } from '../../../shared/layout/page-header.component';
import { SectionCardComponent } from '../../../shared/layout/section-card.component';
import { FieldComponent } from '../../../shared/form/field.component';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';

type Market = ClaimsSubmitClaimRequest['market'];
type ClaimType = ClaimsSubmitClaimRequest['type'];

const MARKETS: readonly { code: Market; label: string }[] = [
  { code: 'SG', label: 'Singapore' },
  { code: 'HK', label: 'Hong Kong' },
  { code: 'MY', label: 'Malaysia' },
  { code: 'TH', label: 'Thailand' },
  { code: 'ID', label: 'Indonesia' },
  { code: 'AU', label: 'Australia' },
];

function todayIso(): string {
  return new Date().toLocaleDateString('en-CA');
}

const notInFuture: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value > todayIso() ? { future: true } : null;

const notBlank: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim() === '' ? { required: true } : null;

@Component({
  selector: 'app-report-incident-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    FieldComponent,
    PageHeaderComponent,
    SectionCardComponent,
    MatProgressBarModule,
    MatRadioModule,
    MoneyPipe,
    StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (created(); as claim) {
      <section class="card" aria-labelledby="done-heading">
        <h1 id="done-heading" tabindex="-1">Claim received</h1>
        <p>
          Your claim number is <strong>{{ claim.claimNumber }}</strong>
        </p>
        <p>
          Status: <app-status-badge [status]="claim.status" audience="claimant" /> Amount claimed:
          {{ claim.estimatedAmount | money: claim.currency }}
        </p>
        <a mat-flat-button [routerLink]="['/claimant/claims', claim.id]">View my claim</a>
        <button mat-stroked-button type="button" (click)="reportAnother()">
          Report another incident
        </button>
      </section>
    } @else {
      <app-page-header [hidden]="true">Report an incident</app-page-header>
      <app-section-card
        title="Report an incident"
        caption="Tell us what happened. We will give you a claim number straight away."
      >
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
            <div class="error" role="alert">
              <p>{{ text }}</p>
              @for (m of details(); track m) {
                <p>{{ m }}</p>
              }
            </div>
          }
          @if (guard.status() === 'waiting') {
            <p aria-live="polite">Still processing. Please wait.</p>
          }

          <h2 class="form-section first">Policy details</h2>
          <app-field
            label="Policy number"
            icon="badge"
            hint="As shown on your policy"
            [max]="30"
            [control]="form.controls.policyNumber"
            [messages]="{ required: 'Enter your policy number.' }"
          >
            <input formControlName="policyNumber" maxlength="30" autocomplete="off" />
          </app-field>
          <app-field
            label="Market"
            icon="public"
            [control]="form.controls.market"
            [messages]="{ required: 'Choose a market.' }"
          >
            <select formControlName="market">
              <option [ngValue]="null" disabled>Choose a market</option>
              @for (m of markets; track m.code) {
                <option [ngValue]="m.code">{{ m.label }}</option>
              }
            </select>
          </app-field>
          <fieldset>
            <legend class="field-label">Claim type</legend>
            <mat-radio-group formControlName="type">
              <mat-radio-button value="Motor">Motor</mat-radio-button>
              <mat-radio-button value="Property">Property</mat-radio-button>
            </mat-radio-group>
            @if (form.controls.type.touched && form.controls.type.hasError('required')) {
              <p class="field-error" role="alert">Choose motor or property.</p>
            }
          </fieldset>

          <h2 class="form-section">Incident details</h2>
          <app-field
            label="Incident date"
            icon="event"
            [control]="form.controls.incidentDate"
            [messages]="{
              required: 'Enter the incident date.',
              future: 'Incident date cannot be in the future.',
            }"
          >
            <input type="date" formControlName="incidentDate" [max]="today" />
          </app-field>
          <app-field
            label="Description"
            hint="What happened?"
            [max]="2000"
            [control]="form.controls.description"
            [messages]="{ required: 'Describe what happened.' }"
          >
            <textarea formControlName="description" rows="4" maxlength="2000"></textarea>
          </app-field>
          <app-field
            label="Estimated amount"
            icon="payments"
            [control]="form.controls.estimatedAmount"
            [messages]="{
              required: 'Enter an amount greater than 0.',
              min: 'Enter an amount greater than 0.',
            }"
          >
            <input type="number" step="0.01" formControlName="estimatedAmount" />
          </app-field>

          @if (type() === 'Motor') {
            <h2 class="form-section">Motor details</h2>
            <div [formGroup]="motor" aria-live="polite">
              <app-field
                label="Vehicle registration"
                icon="directions_car"
                [max]="20"
                [control]="motor.controls.vehicleRegistration"
                [messages]="{ required: 'Enter the vehicle registration.' }"
              >
                <input formControlName="vehicleRegistration" maxlength="20" />
              </app-field>
              <app-field
                label="Accident location"
                icon="place"
                [max]="200"
                [control]="motor.controls.incidentLocation"
                [messages]="{ required: 'Enter where the accident happened.' }"
              >
                <input formControlName="incidentLocation" maxlength="200" />
              </app-field>
            </div>
          } @else if (type() === 'Property') {
            <h2 class="form-section">Property details</h2>
            <div [formGroup]="property" aria-live="polite">
              <app-field
                label="Property address"
                icon="home"
                [max]="300"
                [control]="property.controls.propertyAddress"
                [messages]="{ required: 'Enter the property address.' }"
              >
                <input formControlName="propertyAddress" maxlength="300" />
              </app-field>
              <app-field
                label="Damage type"
                icon="build"
                [max]="100"
                [control]="property.controls.damageType"
                [messages]="{ required: 'Enter the cause of damage.' }"
              >
                <input formControlName="damageType" maxlength="100" />
              </app-field>
            </div>
          }

          <div class="card-foot">
            <a mat-stroked-button routerLink="/claimant/report">Cancel</a>
            <button mat-flat-button type="submit" [disabled]="guard.isInFlight()">
              Submit claim
            </button>
          </div>
        </form>
      </app-section-card>
    }
  `,
  styles: `
    form {
      display: grid;
      gap: 8px;
      max-width: 640px;
    }
    .error,
    .field-error {
      color: var(--mat-sys-error);
    }
    fieldset {
      border: 0;
      padding: 0;
    }
  `,
})
export class ReportIncidentPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly facade = inject(ClaimsFacade);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly guard = createSubmissionGuard();
  protected readonly markets = MARKETS;
  protected readonly today = todayIso();

  protected readonly form = this.fb.group({
    policyNumber: ['', [Validators.required, notBlank, Validators.maxLength(30)]],
    market: this.fb.control<Market | null>(null, Validators.required),
    type: this.fb.control<ClaimType | null>(null, Validators.required),
    incidentDate: ['', [Validators.required, notInFuture]],
    description: ['', [Validators.required, notBlank, Validators.maxLength(2000)]],
    estimatedAmount: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
    ]),
  });
  protected readonly motor = this.fb.group({
    vehicleRegistration: ['', [Validators.required, notBlank, Validators.maxLength(20)]],
    incidentLocation: ['', [Validators.required, notBlank, Validators.maxLength(200)]],
  });
  protected readonly property = this.fb.group({
    propertyAddress: ['', [Validators.required, notBlank, Validators.maxLength(300)]],
    damageType: ['', [Validators.required, notBlank, Validators.maxLength(100)]],
  });
  protected readonly type = toSignal(this.form.controls.type.valueChanges, {
    initialValue: this.form.controls.type.value,
  });

  protected readonly created = signal<ClaimsClaimantClaimView | null>(null);
  protected readonly errorText = signal<string | null>(null);
  protected readonly details = signal<readonly string[]>([]);

  protected submit(): void {
    this.form.markAllAsTouched();
    const type = this.form.controls.type.value;
    const detailGroup = type === 'Motor' ? this.motor : type === 'Property' ? this.property : null;
    detailGroup?.markAllAsTouched();
    const { policyNumber, market, incidentDate, description, estimatedAmount } =
      this.form.getRawValue();
    if (this.form.invalid || !detailGroup || detailGroup.invalid || !market || !type) {
      this.errorText.set('Please check the highlighted fields.');
      this.details.set([]);
      return;
    }
    const request: ClaimsSubmitClaimRequest = {
      policyNumber: policyNumber.trim(),
      type,
      market,
      incidentDate,
      description: description.trim(),
      estimatedAmount: Number(estimatedAmount),
      ...(type === 'Motor'
        ? { motorDetails: this.motor.getRawValue() }
        : { propertyDetails: this.property.getRawValue() }),
    };
    this.errorText.set(null);
    this.facade
      .submit(this.guard, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (claim) => this.created.set(claim),
        error: (error: unknown) => {
          this.errorText.set(describeError(error));
          this.details.set(fieldMessages(error));
        },
      });
  }

  protected reportAnother(): void {
    this.form.reset();
    this.motor.reset();
    this.property.reset();
    this.created.set(null);
  }
}
