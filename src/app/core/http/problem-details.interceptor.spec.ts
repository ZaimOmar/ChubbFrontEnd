import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FakeIdentityApi } from '../../../testing/fake-identity-api';
import { FIXED_NOW_MS, makeJwt } from '../../../testing/jwt';
import { NOW } from '../auth/clock';
import { IdentityApi } from '../auth/identity-api';
import { APP_CONFIG } from '../config/app-config';
import { NotificationService } from '../notification/notification.service';
import { AppError } from './app-error';
import { problemDetailsInterceptor } from './problem-details.interceptor';

const GATEWAY = 'https://gateway.test:8080';

describe('ProblemDetailsInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let notify: jasmine.Spy;
  let navigate: jasmine.Spy;

  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem('chubb.token', makeJwt({}));
    notify = jasmine.createSpy('show');
    navigate = jasmine.createSpy('navigateByUrl').and.resolveTo(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([problemDetailsInterceptor])),
        provideHttpClientTesting(),
        { provide: IdentityApi, useClass: FakeIdentityApi },
        { provide: NOW, useValue: () => FIXED_NOW_MS },
        { provide: APP_CONFIG, useValue: { gatewayBaseUrl: GATEWAY, demoAccounts: [] } },
        { provide: NotificationService, useValue: { show: notify } },
        { provide: Router, useValue: { navigateByUrl: navigate } },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
    sessionStorage.clear();
  });

  function fail(method: 'GET' | 'POST', path: string, status: number): AppError {
    let captured: AppError | undefined;
    http.request(method, `${GATEWAY}${path}`).subscribe({ error: (e: AppError) => (captured = e) });
    controller.expectOne(`${GATEWAY}${path}`).flush({}, { status, statusText: 'x' });
    return captured as AppError;
  }

  it('Error_IsMappedToAppError', () => {
    expect(fail('GET', '/claims/1', 404).kind).toBe('not-found');
  });

  it('401_ClearsSessionAndRedirectsOnce', () => {
    fail('GET', '/claims', 401);
    fail('GET', '/claims', 401);
    expect(sessionStorage.length).toBe(0);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith('Your session has expired. Please log in again.');
    expect(navigate).toHaveBeenCalledOnceWith('/login');
  });

  it('LoginCall401_DoesNotTriggerSessionExpired', () => {
    const error = fail('POST', '/auth/token', 401);
    expect(error.kind).toBe('unauthenticated');
    expect(notify).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(sessionStorage.length).toBe(1);
  });

  it('401FromOtherOrigin_DoesNotEndSession', () => {
    let captured: AppError | undefined;
    http.get('https://other.test/x').subscribe({ error: (e: AppError) => (captured = e) });
    controller.expectOne('https://other.test/x').flush({}, { status: 401, statusText: 'x' });
    expect(captured?.kind).toBe('unauthenticated');
    expect(notify).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(sessionStorage.length).toBe(1);
  });
});
