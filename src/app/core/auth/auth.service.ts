import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap, throwError } from 'rxjs';
import { NOW } from './clock';
import { IdentityApi } from './identity-api';
import { landingUrlFor, Role } from './roles';
import { decodeToken, DecodedToken } from './token-decoder';
import { TokenStore } from './token-store';

export interface Session {
  readonly token: string;
  readonly claims: DecodedToken;
}

export interface SessionUser {
  readonly id: string;
  readonly name: string;
  readonly market: string | null;
  readonly roles: readonly Role[];
}

export type SessionStatus = 'active' | 'absent' | 'expired';

/** The token is valid but carries no role this application knows. */
export class NoAccessError extends Error {
  constructor() {
    super('Token has no known role.');
  }
}

/** The identity provider is not wired yet (generated client pending). */
export class IdentityUnavailableError extends Error {
  constructor() {
    super('Identity API is not available.');
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly identityApi = inject(IdentityApi, { optional: true });
  private readonly store = inject(TokenStore);
  private readonly now = inject(NOW);
  private readonly sessionState = signal<Session | null>(null);

  readonly session = this.sessionState.asReadonly();
  readonly isAuthenticated = computed(() => this.sessionState() !== null);
  readonly user = computed<SessionUser | null>(() => {
    const claims = this.sessionState()?.claims;
    return claims
      ? { id: claims.sub, name: claims.name, market: claims.market, roles: claims.roles }
      : null;
  });
  readonly roles = computed<readonly Role[]>(() => this.user()?.roles ?? []);
  readonly landingUrl = computed(() => landingUrlFor(this.roles()));

  constructor() {
    this.restore();
  }

  login(email: string, password: string): Observable<void> {
    if (!this.identityApi) return throwError(() => new IdentityUnavailableError());
    return this.identityApi.issueToken({ email, password }).pipe(
      tap(({ accessToken }) => this.startSession(accessToken)),
      map(() => undefined),
    );
  }

  logout(): void {
    this.sessionState.set(null);
    this.store.clear();
  }

  hasRole(role: Role): boolean {
    return this.roles().includes(role);
  }

  /** Token to send, or null when there is no session or it has expired. Does not mutate state. */
  activeToken(): string | null {
    const session = this.sessionState();
    return session && !this.isExpired(session.claims) ? session.token : null;
  }

  /** Evaluates the session; an expired one is cleared so it is never used again. */
  checkSession(): SessionStatus {
    const session = this.sessionState();
    if (!session) return 'absent';
    if (!this.isExpired(session.claims)) return 'active';
    this.logout();
    return 'expired';
  }

  private startSession(token: string): void {
    const claims = decodeToken(token);
    if (!claims || this.isExpired(claims)) throw new NoAccessError();
    this.sessionState.set({ token, claims });
    this.store.write(token);
  }

  private restore(): void {
    const token = this.store.read();
    if (token === null) return;
    const claims = decodeToken(token);
    if (!claims || this.isExpired(claims)) {
      this.store.clear();
      return;
    }
    this.sessionState.set({ token, claims });
  }

  private isExpired(claims: DecodedToken): boolean {
    return claims.exp * 1000 <= this.now();
  }
}
