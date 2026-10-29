import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { FieldComponent } from '../form/field.component';

export interface ViewPreset {
  readonly name: string;
  /** Query string without the leading "?". */
  readonly query: string;
}

@Component({
  selector: 'app-save-view-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, FieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Save current view</h2>
    <mat-dialog-content>
      <app-field
        label="View name"
        [max]="40"
        [control]="name"
        [messages]="{ required: 'Enter a name.' }"
      >
        <input [formControl]="name" maxlength="40" autocomplete="off" (keydown.enter)="save()" />
      </app-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="null">Cancel</button>
      <button mat-flat-button type="button" (click)="save()">Save view</button>
    </mat-dialog-actions>
  `,
})
export class SaveViewDialogComponent {
  private readonly ref = inject<MatDialogRef<SaveViewDialogComponent, string>>(MatDialogRef);
  protected readonly name = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected save(): void {
    this.name.markAsTouched();
    const value = this.name.value.trim();
    if (value) this.ref.close(value);
  }
}

/** "Views" menu: presets plus the user's own saved filter sets (localStorage, per user). */
@Component({
  selector: 'app-saved-views',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button mat-stroked-button type="button" [matMenuTriggerFor]="menu">
      <mat-icon aria-hidden="true">bookmarks</mat-icon> Views
    </button>
    <mat-menu #menu="matMenu" class="account-menu">
      <div class="account-label" role="presentation">Presets</div>
      @for (p of presets(); track p.name) {
        <button mat-menu-item type="button" (click)="apply(p.query)">{{ p.name }}</button>
      }
      @if (saved().length > 0) {
        <div class="account-label" role="presentation">Saved</div>
        @for (v of saved(); track v.name) {
          <button mat-menu-item type="button" (click)="apply(v.query)">{{ v.name }}</button>
        }
      }
      <button mat-menu-item type="button" (click)="saveCurrent()">
        <mat-icon aria-hidden="true">add</mat-icon> Save current view
      </button>
    </mat-menu>
  `,
})
export class SavedViewsComponent {
  readonly listKey = input.required<string>();
  readonly presets = input<readonly ViewPreset[]>([]);

  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(AuthService);
  private readonly version = signal(0);
  private readonly storageKey = computed(
    () => `chubb.views.${this.auth.user()?.id ?? 'anon'}.${this.listKey()}`,
  );
  protected readonly saved = computed<readonly ViewPreset[]>(() => {
    this.version();
    try {
      const raw = localStorage.getItem(this.storageKey());
      return raw ? (JSON.parse(raw) as ViewPreset[]) : [];
    } catch {
      return [];
    }
  });

  protected apply(query: string): void {
    const params = Object.fromEntries(new URLSearchParams(query));
    void this.router.navigate([], { queryParams: params });
  }

  protected saveCurrent(): void {
    this.dialog
      .open<SaveViewDialogComponent, void, string>(SaveViewDialogComponent)
      .afterClosed()
      .subscribe((name) => {
        if (!name) return;
        const query = this.router.url.split('?')[1] ?? '';
        const next = [...this.saved().filter((v) => v.name !== name), { name, query }];
        try {
          localStorage.setItem(this.storageKey(), JSON.stringify(next));
        } catch {
          // Storage unavailable: the view is not saved.
        }
        this.version.update((n) => n + 1);
      });
  }
}
