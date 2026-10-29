import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/** Global keyboard shortcuts and the two dialogs they open (loaded on first use). */
@Injectable({ providedIn: 'root' })
export class ShortcutsService {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private waitingForGo = 0;

  async openPalette(): Promise<void> {
    if (this.dialog.openDialogs.length > 0) return;
    const { CommandPaletteComponent } = await import('./command-palette.component');
    this.dialog.open(CommandPaletteComponent, {
      width: '560px',
      maxWidth: '92vw',
      position: { top: '12vh' },
      panelClass: 'palette-panel',
      autoFocus: 'input',
    });
  }

  async openHelp(): Promise<void> {
    const { ShortcutsHelpComponent } = await import('./shortcuts-help.component');
    this.dialog.open(ShortcutsHelpComponent, { width: '520px', maxWidth: '92vw' });
  }

  /** Returns true when the key was handled. `g` then a letter navigates within the user's area. */
  handle(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement | null;
    if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable))
      return false;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      void this.openPalette();
      return true;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return false;
    if (event.key === '?') {
      void this.openHelp();
      return true;
    }
    if (this.waitingForGo && Date.now() - this.waitingForGo < 1000) {
      this.waitingForGo = 0;
      const url = this.goTarget(event.key);
      if (url) void this.router.navigateByUrl(url);
      return !!url;
    }
    if (event.key === 'g') this.waitingForGo = Date.now();
    return false;
  }

  private goTarget(key: string): string | null {
    const roles = this.auth.roles();
    const staff = roles.includes('Officer');
    const manager = roles.includes('Manager');
    const claimant = roles.includes('Claimant');
    switch (key) {
      case 'h':
        return staff ? '/staff/home' : manager ? '/manager/home' : '/claimant/home';
      case 'q':
        return staff ? '/staff/queue' : null;
      case 'p':
        return manager ? '/manager/pending' : null;
      case 'o':
        return manager ? '/manager/outstanding' : null;
      case 'c':
        return claimant ? '/claimant/claims' : null;
      case 'r':
        return claimant ? '/claimant/report' : null;
      default:
        return null;
    }
  }
}
