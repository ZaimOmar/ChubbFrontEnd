import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AuthApi } from '../../api/api/auth.service';
import { IdentityApi, TokenCredentials, TokenResponse } from './identity-api';

/** Adapter from the IdentityApi port to the generated `POST /auth/token` operation. */
@Injectable({ providedIn: 'root' })
export class GeneratedIdentityApi extends IdentityApi {
  private readonly auth = inject(AuthApi);

  issueToken(credentials: TokenCredentials): Observable<TokenResponse> {
    return this.auth
      .createToken({ email: credentials.email, password: credentials.password })
      .pipe(map((response) => ({ accessToken: response.accessToken })));
  }
}
