import { inject, Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export interface RecentClaim {
  readonly id: string;
  readonly number: string;
  readonly base: string;
}

/** The last eight claims this user opened, kept in the browser for the command palette. */
@Injectable({ providedIn: 'root' })
export class RecentClaimsService {
  private readonly auth = inject(AuthService);

  private key(): string {
    return `chubb.recent.${this.auth.user()?.id ?? 'anon'}`;
  }

  list(): readonly RecentClaim[] {
    try {
      const raw = localStorage.getItem(this.key());
      return raw ? (JSON.parse(raw) as RecentClaim[]) : [];
    } catch {
      return [];
    }
  }

  add(claim: RecentClaim): void {
    const next = [claim, ...this.list().filter((c) => c.id !== claim.id)].slice(0, 8);
    try {
      localStorage.setItem(this.key(), JSON.stringify(next));
    } catch {
      // Storage unavailable: recents are skipped.
    }
  }
}
