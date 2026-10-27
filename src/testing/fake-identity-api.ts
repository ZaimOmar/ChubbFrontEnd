import { Injectable } from '@angular/core';
import { Observable, of, Subject, throwError } from 'rxjs';
import { IdentityApi, TokenCredentials, TokenResponse } from '../app/core/auth/identity-api';

@Injectable()
export class FakeIdentityApi extends IdentityApi {
  readonly requests: TokenCredentials[] = [];
  next: () => Observable<TokenResponse> = () => throwError(() => new Error('not configured'));

  respondWith(accessToken: string): void {
    this.next = () => of({ accessToken });
  }

  failWith(error: unknown): void {
    this.next = () => throwError(() => error);
  }

  hold(): Subject<TokenResponse> {
    const pending = new Subject<TokenResponse>();
    this.next = () => pending;
    return pending;
  }

  override issueToken(credentials: TokenCredentials): Observable<TokenResponse> {
    this.requests.push(credentials);
    return this.next();
  }
}
