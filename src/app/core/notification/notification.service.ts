import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Informational, polite, auto-dismissing message with no action (A-F7). */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string): void {
    this.snackBar.open(message, undefined, { duration: 5000, politeness: 'polite' });
  }
}
