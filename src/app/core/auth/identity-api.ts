import { Observable } from 'rxjs';

export interface TokenCredentials {
  readonly email: string;
  readonly password: string;
}

export interface TokenResponse {
  readonly accessToken: string;
}

/**
 * Port for POST /auth/token. Step 10 of the foundation spec provides it through a facade over the
 * generated client and replaces these local types with the generated ones.
 */
export abstract class IdentityApi {
  abstract issueToken(credentials: TokenCredentials): Observable<TokenResponse>;
}
