import { EnvironmentSource } from '../app/core/config/app-config';
import { DEMO_ACCOUNTS } from './demo-accounts';

export const environment: EnvironmentSource = {
  production: false,
  gatewayBaseUrl: 'http://localhost:8080',
  demoAccounts: DEMO_ACCOUNTS,
};
