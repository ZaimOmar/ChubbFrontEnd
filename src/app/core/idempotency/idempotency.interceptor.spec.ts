import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '../config/app-config';
import { AppError } from '../http/app-error';
import { Attempt, withAttempt } from './idempotency-context';
import { idempotencyInterceptor } from './idempotency.interceptor';

const GATEWAY = 'https://gateway.test:8080';

describe('IdempotencyInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  function setup(gatewayBaseUrl = GATEWAY): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([idempotencyInterceptor])),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { gatewayBaseUrl, demoAccounts: [] } },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  }

  const attempt = (): Attempt => ({ key: 'key-0001-abcd', scope: 's', bodyText: '{}' });

  function headerFor(
    method: string,
    url: string,
    withKey = true,
    body: unknown = { a: 1 },
  ): string | null {
    http
      .request(method, url, { body, context: withKey ? withAttempt(attempt()) : undefined })
      .subscribe();
    const req = controller.expectOne(url);
    const header = req.request.headers.get('Idempotency-Key');
    req.flush({});
    return header;
  }

  afterEach(() => controller.verify());

  it('PostToGatewayClaims_AddsHeader', () => {
    setup();
    expect(headerFor('POST', `${GATEWAY}/claims`)).toBe('key-0001-abcd');
    expect(headerFor('POST', `${GATEWAY}/claims/42/assign`)).toBe('key-0001-abcd');
    expect(headerFor('PUT', `${GATEWAY}/claims/42/x`)).toBe('key-0001-abcd');
  });

  it('PostToGatewayClaims_WithBasePath_AddsHeader', () => {
    setup(`${GATEWAY}/api/`);
    expect(headerFor('POST', `${GATEWAY}/api/claims/1/assign`)).toBe('key-0001-abcd');
  });

  it('Get_NoHeader', () => {
    setup();
    expect(headerFor('GET', `${GATEWAY}/claims`, false, undefined)).toBeNull();
    expect(headerFor('GET', `${GATEWAY}/claims/1`, true, undefined)).toBeNull();
  });

  it('OtherOrigin_NoHeader', () => {
    setup();
    expect(headerFor('POST', 'https://other.test/claims')).toBeNull();
  });

  it('LookalikeHost_NoHeader', () => {
    setup();
    expect(headerFor('POST', 'https://gateway.test:8080.evil.com/claims')).toBeNull();
    expect(headerFor('POST', 'https://gateway.test:8080@evil.com/claims')).toBeNull();
    expect(headerFor('POST', 'https://evil.com/?u=https://gateway.test:8080/claims')).toBeNull();
  });

  it('LookalikePath_NoHeaderAndNotBlocked', () => {
    setup();
    expect(headerFor('POST', `${GATEWAY}/claimsX`, false)).toBeNull();
    expect(headerFor('POST', `${GATEWAY}/claims-archive/1`, false)).toBeNull();
  });

  it('AuthToken_NoHeader', () => {
    setup();
    expect(headerFor('POST', `${GATEWAY}/auth/token`, false)).toBeNull();
  });

  it('NonGetToNotifications_SentWithoutKeyAndNotBlocked', () => {
    setup();
    expect(headerFor('POST', `${GATEWAY}/notifications/read`, false)).toBeNull();
  });

  it('ClaimsCommandWithoutAttempt_DoesNotSendAndErrors', () => {
    setup();
    let error: AppError | undefined;
    http.post(`${GATEWAY}/claims`, {}).subscribe({ error: (e: AppError) => (error = e) });
    controller.expectNone(`${GATEWAY}/claims`);
    expect(error?.kind).toBe('unexpected');
    expect(error?.message).toBe('Something went wrong. Please try again.');
  });

  it('Resend_SameBody_SendsAgainWithSameKey', () => {
    setup();
    const shared = attempt();
    for (let i = 0; i < 2; i++) {
      http
        .post(`${GATEWAY}/claims`, { a: 1 }, { context: withAttempt(shared) })
        .subscribe({ error: () => undefined });
      const req = controller.expectOne(`${GATEWAY}/claims`);
      expect(req.request.headers.get('Idempotency-Key')).toBe('key-0001-abcd');
      req.flush({}, { status: 502, statusText: 'x' });
    }
  });

  it('Resend_BodyDiffersFromFirstSend_DoesNotSendAndErrors', () => {
    setup();
    const shared = attempt();
    http.post(`${GATEWAY}/claims`, { a: 1 }, { context: withAttempt(shared) }).subscribe();
    controller.expectOne(`${GATEWAY}/claims`).flush({});
    let error: AppError | undefined;
    http
      .post(`${GATEWAY}/claims`, { a: 2 }, { context: withAttempt(shared) })
      .subscribe({ error: (e: AppError) => (error = e) });
    controller.expectNone(`${GATEWAY}/claims`);
    expect(error?.kind).toBe('unexpected');
  });

  it('HeaderFromGeneratedClient_MatchingKey_Sent_MismatchingKey_Blocked', () => {
    setup();
    http
      .post(
        `${GATEWAY}/claims`,
        {},
        { headers: { 'Idempotency-Key': 'key-0001-abcd' }, context: withAttempt(attempt()) },
      )
      .subscribe();
    controller.expectOne(`${GATEWAY}/claims`).flush({});
    let error: AppError | undefined;
    http
      .post(
        `${GATEWAY}/claims`,
        {},
        { headers: { 'Idempotency-Key': 'other-key-99' }, context: withAttempt(attempt()) },
      )
      .subscribe({ error: (e: AppError) => (error = e) });
    controller.expectNone(`${GATEWAY}/claims`);
    expect(error?.kind).toBe('unexpected');
  });
});
