import { EnvironmentSource } from '../app/core/config/app-config';

/** Production values. The demo-account list is empty by design: no dev emails in this bundle. */
export const environment: EnvironmentSource = {
  production: true,
  // Placeholder: set the real https Gateway URL at deployment.
  gatewayBaseUrl: 'https://gateway.example.com',
  demoAccounts: [],
};
