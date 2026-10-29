import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/dialogs/confirm-dialog.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, merge } from 'rxjs';
import { ClaimsClaimantClaimView, ClaimsSubmitClaimRequest } from '../../../api/model/models';
import { ClaimsFacade } from '../../../core/claims/claims.facade';
import { describeError, fieldMessages } from '../../../core/claims/problem-messages';
import { createSubmissionGuard } from '../../../core/idempotency/submission-guard';
import { FieldComponent } from '../../../shared/form/field.component';
import { PageHeaderComponent } from '../../../shared/layout/page-header.component';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';

type Market = ClaimsSubmitClaimRequest['market'];
type ClaimType = ClaimsSubmitClaimRequest['type'];

const DRAFT_KEY = 'chubb.draft.report';
const MARKET_KEY = 'chubb.report.market';

const MARKETS: readonly { code: Market; label: string }[] = [
  { code: 'SG', label: 'Singapore' },
  { code: 'HK', label: 'Hong Kong' },
  { code: 'MY', label: 'Malaysia' },
  { code: 'TH', label: 'Thailand' },
  { code: 'ID', label: 'Indonesia' },
  { code: 'AU', label: 'Australia' },
];

interface Draft {
  readonly value: Record<string, unknown>;
  readonly savedAt: string;
}

function todayIso(): string {
  return new Date().toLocaleDateString('en-CA');
}

function storage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

const notInFuture: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value > todayIso() ? { future: true } : null;

const notBlank: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim() === '' ? { required: true } : null;

/** Single-viewport report form (mockup 22): two columns, sticky footer, local draft, last-used market. */
@Component({
  selector: 'app-report-incident-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatProgressBarModule,
    FieldComponent,
    PageHeaderComponent,
    MoneyPipe,
    StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './report-incident.page.scss',
  template: `
    <app-page-header title="Report an incident" [hiddenTitle]="true" />
    @if (created(); as claim) {
      <section class="card" aria-labelledby="done-heading">
        <h2 id="done-heading" tabindex="-1">Claim received</h2>
        <p>
          Your claim number is
          <a [routerLink]="['/claimant/claims', claim.id]"
            ><strong>{{ claim.claimNumber }}</strong></a
          >
        </p>
        <p>
          Status: <app-status-badge [status]="claim.status" audience="claimant" /> Amount claimed:
          {{ claim.estimatedAmount | money: claim.currency }}
        </p>
        <div class="card-foot">
          <button mat-stroked-button type="button" (click)="reportAnother()">
            Report another incident
          </button>
          <a mat-flat-button [routerLink]="['/claimant/claims', claim.id]">View my claim</a>
        </div>
      </section>
    } @else {
      <form
        class="report"
        [formGroup]="form"
        (ngSubmit)="submit()"
        (keydown.control.enter)="submit()"
        [attr.aria-busy]="guard.isInFlight()"
        novalidate
      >
        <div class="report-head">
          <div>
            <h2>Report an incident</h2>
            <p class="caption">Tell us what happened. Fields marked * are required.</p>
          </div>
        </div>
        <div class="report-body">
          @if (guard.isInFlight()) {
            <mat-progress-bar mode="indeterminate" aria-label="Submitting" />
          }
          @if (restored()) {
            <div class="banner" role="status">
              Draft restored{{ savedLabel() }}.
              <button mat-button type="button" (click)="discardDraft()">Discard</button>
            </div>
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

          <fieldset class="type">
            <legend class="field-label">Claim type *</legend>
            <mat-button-toggle-group
              formControlName="type"
              aria-label="Claim type"
              (focusout)="form.controls.type.markAsTouched()"
            >
              <mat-button-toggle value="Motor">Motor</mat-button-toggle>
              <mat-button-toggle value="Property">Property</mat-button-toggle>
            </mat-button-toggle-group>
            @if (form.controls.type.touched && form.controls.type.hasError('required')) {
              <p class="field-error" role="alert">Choose motor or property.</p>
            }
          </fieldset>

          <div class="cols">
            <section aria-labelledby="g-policy">
              <h3 id="g-policy" class="group">Policy and incident</h3>
              <div class="two">
                <app-field
                  label="Policy number *"
                  icon="badge"
                  [max]="30"
                  [control]="form.controls.policyNumber"
                  [messages]="{ required: 'Enter your policy number.' }"
                >
                  <input formControlName="policyNumber" maxlength="30" autocomplete="off" />
                </app-field>
                <app-field
                  label="Market *"
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
                <app-field
                  label="Incident date *"
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
                  label="Estimated amount *"
                  icon="payments"
                  hint="In the policy currency"
                  [control]="form.controls.estimatedAmount"
                  [messages]="{
                    required: 'Enter an amount greater than 0.',
                    min: 'Enter an amount greater than 0.',
                  }"
                >
                  <input type="number" step="0.01" formControlName="estimatedAmount" />
                </app-field>
              </div>
              <app-field
                label="Description *"
                [max]="2000"
                [control]="form.controls.description"
                [messages]="{ required: 'Describe what happened.' }"
              >
                <textarea formControlName="description" rows="3" maxlength="2000"></textarea>
              </app-field>
            </section>

            <section aria-labelledby="g-details" aria-live="polite">
              @if (type() === 'Motor') {
                <h3 id="g-details" class="group">Motor details</h3>
                <div [formGroup]="motor">
                  <app-field
                    label="Vehicle registration *"
                    icon="directions_car"
                    [max]="20"
                    [control]="motor.controls.vehicleRegistration"
                    [messages]="{ required: 'Enter the vehicle registration.' }"
                  >
                    <input formControlName="vehicleRegistration" maxlength="20" />
                  </app-field>
                  <app-field
                    label="Accident location *"
                    icon="place"
                    hint="Tip: add the police report number in the description."
                    [max]="200"
                    [control]="motor.controls.incidentLocation"
                    [messages]="{ required: 'Enter where the accident happened.' }"
                  >
                    <input formControlName="incidentLocation" maxlength="200" />
                  </app-field>
                </div>
              } @else if (type() === 'Property') {
                <h3 id="g-details" class="group">Property details</h3>
                <div [formGroup]="property">
                  <app-field
                    label="Property address *"
                    icon="home"
                    [max]="300"
                    [control]="property.controls.propertyAddress"
                    [messages]="{ required: 'Enter the property address.' }"
                  >
                    <input formControlName="propertyAddress" maxlength="300" />
                  </app-field>
                  <app-field
                    label="Damage type *"
                    icon="build"
                    [max]="100"
                    [control]="property.controls.damageType"
                    [messages]="{ required: 'Enter the cause of damage.' }"
                  >
                    <input formControlName="damageType" maxlength="100" />
                  </app-field>
                </div>
              } @else {
                <h3 id="g-details" class="group">Details</h3>
                <p class="muted">Choose a type to add details.</p>
              }
            </section>
          </div>
        </div>
        <div class="report-foot">
          <span class="draft">{{ draftStatus() }}</span>
          <span class="spacer"></span>
          <button mat-stroked-button type="button" (click)="cancel()">Cancel</button>
          <button mat-flat-button type="submit" [disabled]="guard.isInFlight()">
            Submit claim
          </button>
        </div>
      </form>
    }
  `,
})
export class ReportIncidentPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly facade = inject(ClaimsFacade);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
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
  protected readonly restored = signal(false);
  protected readonly draftStatus = signal('');
  private savedAt: string | null = null;

  constructor() {
    this.restoreDraft();
    merge(this.form.valueChanges, this.motor.valueChanges, this.property.valueChanges)
      .pipe(debounceTime(2000), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.saveDraft());
    this.form.controls.market.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((market) => {
        if (market) storage()?.setItem(MARKET_KEY, market);
      });
  }

  protected savedLabel(): string {
    return this.savedAt
      ? ` from ${new Date(this.savedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
      : '';
  }

  private restoreDraft(): void {
    const lastMarket = storage()?.getItem(MARKET_KEY);
    const known = MARKETS.find((m) => m.code === lastMarket);
    if (known) this.form.controls.market.setValue(known.code, { emitEvent: false });
    try {
      const raw = storage()?.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Draft;
      const { motor, property, ...main } = draft.value as Record<string, never>;
      this.form.patchValue(main, { emitEvent: false });
      if (motor) this.motor.patchValue(motor, { emitEvent: false });
      if (property) this.property.patchValue(property, { emitEvent: false });
      this.form.controls.type.updateValueAndValidity();
      this.savedAt = draft.savedAt;
      this.restored.set(true);
    } catch {
      storage()?.removeItem(DRAFT_KEY);
    }
  }

  private saveDraft(): void {
    if (this.created()) return;
    const value = {
      ...this.form.getRawValue(),
      motor: this.motor.getRawValue(),
      property: this.property.getRawValue(),
    };
    this.savedAt = new Date().toISOString();
    storage()?.setItem(DRAFT_KEY, JSON.stringify({ value, savedAt: this.savedAt }));
    this.draftStatus.set(
      `Draft saved ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
    );
  }

  protected discardDraft(): void {
    storage()?.removeItem(DRAFT_KEY);
    const market = this.form.controls.market.value;
    this.form.reset({ market });
    this.motor.reset();
    this.property.reset();
    this.restored.set(false);
    this.draftStatus.set('');
  }

  /** Esc leaves the form; a dirty form asks first (the saved draft stays unless Discard is chosen). */
  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.created() || document.querySelector('.cdk-overlay-pane')) return;
    if (this.form.pristine && this.motor.pristine && this.property.pristine) {
      this.cancel();
      return;
    }
    const data: ConfirmDialogData = {
      title: 'Leave this form?',
      lines: ['Your draft is saved on this device unless you discard it.'],
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
    };
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((discard) => {
        if (!discard) return;
        this.discardDraft();
        this.cancel();
      });
  }

  protected cancel(): void {
    void this.router.navigateByUrl('/claimant/home');
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    const type = this.form.controls.type.value;
    const detailGroup = type === 'Motor' ? this.motor : type === 'Property' ? this.property : null;
    detailGroup?.markAllAsTouched();
    const { policyNumber, market, incidentDate, description, estimatedAmount } =
      this.form.getRawValue();
    if (this.form.invalid || !detailGroup || detailGroup.invalid || !market || !type) {
      const count = this.countInvalid(detailGroup?.controls ?? {});
      this.errorText.set(`${count} field${count === 1 ? '' : 's'} need attention.`);
      this.details.set([]);
      queueMicrotask(() =>
        this.host.nativeElement.querySelector<HTMLElement>('.has-error .field-control')?.focus(),
      );
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
        next: (claim) => {
          storage()?.removeItem(DRAFT_KEY);
          this.created.set(claim);
        },
        error: (error: unknown) => {
          this.errorText.set(describeError(error));
          this.details.set(fieldMessages(error));
        },
      });
  }

  private countInvalid(extra: Record<string, { invalid: boolean }>): number {
    const main = Object.values(this.form.controls).filter((c) => c.invalid).length;
    return main + Object.values(extra).filter((c) => c.invalid).length;
  }

  protected reportAnother(): void {
    const market = this.form.controls.market.value;
    this.form.reset({ market });
    this.motor.reset();
    this.property.reset();
    this.restored.set(false);
    this.draftStatus.set('');
    this.created.set(null);
  }
}
