import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { merge, of, switchMap } from 'rxjs';

let nextFieldId = 0;

/**
 * One input field in the reference style (section 5): small uppercase label above, rounded outlined
 * box with an optional prefix icon, hint on the left and a counter on the right. The projected
 * `input`, `select` or `textarea` gets the id and the aria wiring here.
 */
@Component({
  selector: 'app-field',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-field" [class.has-error]="!!errorText()">
      <label class="field-label" [attr.for]="controlId">{{ label() }}</label>
      <div class="field-box">
        @if (icon()) {
          <mat-icon class="field-prefix" aria-hidden="true">{{ icon() }}</mat-icon>
        }
        <ng-content />
        <ng-content select="[fieldSuffix]" />
      </div>
      <div class="field-foot">
        <span [id]="footId" [attr.role]="errorText() ? 'alert' : null">{{
          errorText() || hint()
        }}</span>
        @if (max() > 0) {
          <span class="field-count">{{ length() }} / {{ max() }}</span>
        }
      </div>
    </div>
  `,
})
export class FieldComponent {
  readonly label = input.required<string>();
  readonly hint = input('');
  readonly icon = input('');
  /** Counter limit; 0 hides the counter. */
  readonly max = input(0);
  readonly control = input<AbstractControl | null>(null);
  /** Message per error key; a string error value (server message) is shown as it is. */
  readonly messages = input<Readonly<Record<string, string>>>({});

  protected readonly controlId = `field-${nextFieldId++}`;
  protected readonly footId = `${this.controlId}-foot`;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  private readonly tick = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) => (control ? merge(of(0), control.events) : of(0))),
    ),
    { initialValue: 0 },
  );

  protected readonly errorText = computed(() => {
    this.tick();
    const control = this.control();
    if (!control || !control.invalid || !(control.touched || control.dirty)) return '';
    const errors = control.errors ?? {};
    for (const key of Object.keys(errors)) {
      const known = this.messages()[key];
      if (known) return known;
      if (typeof errors[key] === 'string') return errors[key] as string;
    }
    return 'Check this value.';
  });

  protected readonly length = computed(() => {
    this.tick();
    const value = this.control()?.value;
    return typeof value === 'string' ? value.length : 0;
  });

  constructor() {
    afterNextRender(
      () => {
        const control =
          this.host.nativeElement.querySelector<HTMLElement>('input, select, textarea');
        if (!control) return;
        control.id ||= this.controlId;
        control.classList.add('field-control');
        control.setAttribute('aria-describedby', this.footId);
        (this.host.nativeElement.querySelector('label') as HTMLLabelElement).htmlFor = control.id;
      },
      { injector: this.injector },
    );
  }
}
