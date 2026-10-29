import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { BASE_PATH } from './api/variables';
import { GeneratedIdentityApi } from './core/auth/generated-identity-api';
import { IdentityApi } from './core/auth/identity-api';
import { APP_CONFIG } from './core/config/app-config';
import { routes } from './app.routes';
import { idempotencyInterceptor } from './core/idempotency/idempotency.interceptor';
import { jwtInterceptor } from './core/http/jwt.interceptor';
import { problemDetailsInterceptor } from './core/http/problem-details.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    { provide: BASE_PATH, useFactory: () => inject(APP_CONFIG).gatewayBaseUrl },
    { provide: IdentityApi, useExisting: GeneratedIdentityApi },
    provideHttpClient(
      withInterceptors([jwtInterceptor, idempotencyInterceptor, problemDetailsInterceptor]),
    ),
  ],
};
