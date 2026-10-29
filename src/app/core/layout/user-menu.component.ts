import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Density, UiPrefsService } from './ui-prefs';

/** Avatar button with the account menu: identity, density, log out and the copyright line. */
@Component({
  selector: 'app-user-menu',
  imports: [MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
  `,
  template: `
    <button
      type="button"
      class="rail-row"
      [matMenuTriggerFor]="menu"
      [attr.aria-label]="'Account menu, ' + userName() + ', ' + roleText()"
    >
      <span class="icon"
        ><span class="avatar" aria-hidden="true">{{ initials() }}</span></span
      >
      <span class="label who">
        <strong>{{ userName() }}</strong>
        <span>{{ roleText() }}</span>
      </span>
    </button>
    <mat-menu #menu="matMenu" class="account-menu" xPosition="after" yPosition="above">
      <div class="account-head">
        <strong>{{ userName() }}</strong>
        <span>{{ roleText() }}</span>
      </div>
      <div class="account-label" role="presentation">Density</div>
      @for (option of densities; track option.value) {
        <button
          mat-menu-item
          type="button"
          role="menuitemradio"
          [attr.aria-checked]="prefs.density() === option.value"
          (click)="prefs.setDensity(option.value)"
        >
          <mat-icon aria-hidden="true">{{
            prefs.density() === option.value ? 'radio_button_checked' : 'radio_button_unchecked'
          }}</mat-icon>
          <span>{{ option.label }}</span>
        </button>
      }
      <button mat-menu-item type="button" (click)="help.emit()">
        <mat-icon aria-hidden="true">keyboard</mat-icon>
        <span>Keyboard shortcuts</span>
      </button>
      <button mat-menu-item type="button" (click)="logout.emit()">
        <mat-icon aria-hidden="true">logout</mat-icon>
        <span>Log out</span>
      </button>
      <div class="account-foot" role="presentation">zaimomar@copyright 2026</div>
    </mat-menu>
  `,
})
export class UserMenuComponent {
  readonly userName = input.required<string>();
  readonly roleText = input.required<string>();
  readonly logout = output<void>();
  readonly help = output<void>();

  protected readonly prefs = inject(UiPrefsService);
  protected readonly densities: readonly { value: Density; label: string }[] = [
    { value: 'compact', label: 'Compact' },
    { value: 'comfortable', label: 'Comfortable' },
  ];
  protected readonly initials = computed(() =>
    this.userName()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join(''),
  );
}
