import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export type Density = 'compact' | 'comfortable';

const DENSITY_KEY = 'chubb.ui.density';
const RAIL_KEY = 'chubb.ui.rail';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode); the preference then lasts for the session only.
  }
}

/** Per-browser UI preferences. Defaults come from the role (staff compact and collapsed, claimant comfortable and expanded). */
@Injectable({ providedIn: 'root' })
export class UiPrefsService {
  private readonly auth = inject(AuthService);
  private readonly densityOverride = signal<Density | null>(
    read(DENSITY_KEY) === 'compact'
      ? 'compact'
      : read(DENSITY_KEY) === 'comfortable'
        ? 'comfortable'
        : null,
  );
  private readonly railOverride = signal<boolean | null>(
    read(RAIL_KEY) === 'expanded' ? true : read(RAIL_KEY) === 'collapsed' ? false : null,
  );
  private readonly isStaff = computed(() => {
    const roles = this.auth.roles();
    return roles.includes('Officer') || roles.includes('Manager');
  });

  readonly density = computed<Density>(
    () => this.densityOverride() ?? (this.isStaff() ? 'compact' : 'comfortable'),
  );
  readonly railExpanded = computed(() => this.railOverride() ?? !this.isStaff());

  setDensity(value: Density): void {
    this.densityOverride.set(value);
    write(DENSITY_KEY, value);
  }

  toggleRail(): void {
    const next = !this.railExpanded();
    this.railOverride.set(next);
    write(RAIL_KEY, next ? 'expanded' : 'collapsed');
  }
}
