import { Injectable } from '@angular/core';

const TOKEN_KEY = 'chubb.token';

/** sessionStorage mirror of the raw token (documented dev fallback). Degrades to memory-only if unavailable. */
@Injectable({ providedIn: 'root' })
export class TokenStore {
  read(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  write(token: string): void {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Storage unavailable: the in-memory session still works for this page load.
    }
  }

  clear(): void {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // Nothing stored that could be cleared.
    }
  }
}
