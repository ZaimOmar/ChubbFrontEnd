import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface DemoAccount {
  readonly label: string;
  readonly email: string;
}

/** Raw values from the build-time environment file. */
export interface EnvironmentSource {
  readonly production: boolean;
  readonly gatewayBaseUrl: string;
  /** Non-empty only in the development environment; the login picker shows when it is. */
  readonly demoAccounts: readonly DemoAccount[];
}

export interface AppConfig {
  /** Absolute Gateway base URL; the only origin that ever receives the token. */
  readonly gatewayBaseUrl: string;
  readonly demoAccounts: readonly DemoAccount[];
}

const INVALID_URL = 'gatewayBaseUrl must be an absolute http(s) URL.';

/** Validates the environment. The token origin check depends on an absolute URL; production needs https. */
export function createAppConfig(source: EnvironmentSource): AppConfig {
  let parsed: URL;
  try {
    parsed = new URL(source.gatewayBaseUrl);
  } catch {
    throw new Error(INVALID_URL);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(INVALID_URL);
  }
  if (source.production && parsed.protocol !== 'https:') {
    throw new Error('gatewayBaseUrl must use https in production.');
  }
  return { gatewayBaseUrl: source.gatewayBaseUrl, demoAccounts: source.demoAccounts };
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => createAppConfig(environment),
});
