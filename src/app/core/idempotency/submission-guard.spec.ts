import {
  HttpClient,
  HttpErrorResponse,
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable, catchError, of, throwError } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { AppError } from '../http/app-error';
import { mapProblemDetails } from '../http/problem-details-mapper';
import { IDEMPOTENCY_KEY_FACTORY } from './idempotency-key';
import { IDEMPOTENCY_WAIT } from './idempotency-wait';
import { idempotencyInterceptor } from './idempotency.interceptor';
import { SubmissionGuard, createSubmissionGuard } from './submission-guard';

const GATEWAY = 'https://gateway.test:8080';
const URL = `${GATEWAY}/claims`;
const PROBLEM = 'application/problem+json';

const mapErrors: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((e: unknown) =>
      throwError(() => (e instanceof HttpErrorResponse ? mapProblemDetails(e) : e)),
    ),
  );

interface Created {
  readonly id: string;
}

describe('SubmissionGuard', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let guard: SubmissionGuard;
  let keyCount: number;
  let waits: number[];

  beforeEach(() => {
    keyCount = 0;
    waits = [];
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([idempotencyInterceptor, mapErrors])),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { gatewayBaseUrl: GATEWAY, demoAccounts: [] } },
        { provide: IDEMPOTENCY_KEY_FACTORY, useValue: () => `key-${++keyCount}-00000` },
        {
          provide: IDEMPOTENCY_WAIT,
          useValue: (ms: number) => {
            waits.push(ms);
            return of(0);
          },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    guard = TestBed.runInInjectionContext(() => createSubmissionGuard());
  });

  afterEach(() => controller.verify());

  function submit(
    request: { text: string } = { text: 'a' },
    scope = 'create-claim',
  ): { result: Created[]; error: () => AppError | undefined; done: () => boolean } {
    const out = {
      result: [] as Created[],
      err: undefined as AppError | undefined,
      finished: false,
    };
    guard
      .run(scope, request, (body, context) => http.post<Created>(URL, body, { context }))
      .subscribe({
        next: (v) => out.result.push(v),
        error: (e: AppError) => (out.err = e),
        complete: () => (out.finished = true),
      });
    return { result: out.result, error: () => out.err, done: () => out.finished };
  }

  function respond(
    status: number,
    body: object = {},
    headers: Record<string, string> = {},
  ): TestRequest {
    const req = controller.expectOne(URL);
    req.flush(body, { status, statusText: 'x', headers });
    return req;
  }

  function problem(status: number, type: string, headers: Record<string, string> = {}): void {
    respond(
      status,
      { type, detail: 'SECRET server detail' },
      { 'Content-Type': PROBLEM, ...headers },
    );
  }

  function keyOfNext(): string | null {
    const req = controller.expectOne(URL);
    const key = req.request.headers.get('Idempotency-Key');
    req.flush({ id: 'x' });
    return key;
  }

  it('Run_FirstSubmit_CreatesOneKey', () => {
    submit();
    const req = controller.expectOne(URL);
    expect(req.request.headers.get('Idempotency-Key')).toBe('key-1-00000');
    expect(keyCount).toBe(1);
    req.flush({ id: 'c1' });
  });

  it('Run_RetryAfterNetworkError_ReusesKeyAndBody', () => {
    submit();
    const first = controller.expectOne(URL);
    const firstKey = first.request.headers.get('Idempotency-Key');
    first.error(new ProgressEvent('error'));
    expect(guard.hasPendingAttempt()).toBeTrue();
    submit();
    const second = controller.expectOne(URL);
    expect(second.request.headers.get('Idempotency-Key')).toBe(firstKey);
    expect(keyCount).toBe(1);
    second.flush({ id: 'c1' });
  });

  it('Run_Retry_SendsByteIdenticalBody', () => {
    submit({ text: 'a' });
    const first = controller.expectOne(URL);
    const firstBytes = first.request.serializeBody();
    first.flush({}, { status: 503, statusText: 'x' });
    submit({ text: 'a' });
    const second = controller.expectOne(URL);
    expect(second.request.serializeBody()).toBe(firstBytes);
    second.flush({});
  });

  it('Run_ChangedBody_NewKey', () => {
    submit({ text: 'a' });
    respond(503);
    submit({ text: 'b' });
    expect(keyOfNext()).toBe('key-2-00000');
  });

  it('Run_ChangedScope_NewKey', () => {
    submit({ text: 'a' }, 'assign:1');
    respond(503);
    submit({ text: 'a' }, 'assign:2');
    expect(keyOfNext()).toBe('key-2-00000');
  });

  it('Run_AfterSuccess_NewKey', () => {
    submit();
    respond(201, { id: 'c1' });
    expect(guard.hasPendingAttempt()).toBeFalse();
    submit();
    expect(keyOfNext()).toBe('key-2-00000');
  });

  it('Run_FormEditedWhilePending_DoesNotMutateSnapshot', () => {
    const live = { text: 'a' };
    submit(live);
    live.text = 'edited';
    const req = controller.expectOne(URL);
    expect((req.request.body as { text: string }).text).toBe('a');
    expect(Object.isFrozen(req.request.body)).toBeTrue();
    req.flush({});
  });

  it('Run_WhileInFlight_IgnoresSecondCall_OneRequest', () => {
    const first = submit();
    expect(guard.isInFlight()).toBeTrue();
    const second = submit();
    expect(second.done()).toBeTrue();
    expect(controller.match(URL).length).toBe(1);
    expect(first.done()).toBeFalse();
  });

  it('Run_AfterFailure_StatusIdleAndReEnabled', () => {
    submit();
    respond(500);
    expect(guard.isInFlight()).toBeFalse();
    expect(guard.status()).toBe('idle');
  });

  it('Run_409InvalidTransition_NoRetryDiscardsAttempt_NextActionNewKey', () => {
    const out = submit();
    problem(409, 'invalid-transition');
    expect(out.error()?.kind).toBe('conflict');
    expect(guard.lastOutcome()).toBe('refused');
    expect(guard.hasPendingAttempt()).toBeFalse();
    expect(waits).toEqual([]);
    submit();
    expect(keyOfNext()).toBe('key-2-00000');
  });

  it('Run_409ConcurrencyConflict_NoRetryDiscardsAttempt', () => {
    submit();
    problem(409, 'concurrency-conflict');
    expect(guard.hasPendingAttempt()).toBeFalse();
    expect(waits).toEqual([]);
  });

  it('Run_409InProgress_WaitsThenSucceedsWithSameKey', () => {
    const out = submit();
    problem(409, 'idempotency-request-in-progress', { 'Retry-After': '2' });
    expect(waits).toEqual([2000]);
    const retry = controller.expectOne(URL);
    expect(retry.request.headers.get('Idempotency-Key')).toBe('key-1-00000');
    retry.flush({ id: 'c1' });
    expect(out.result).toEqual([{ id: 'c1' }]);
    expect(guard.hasPendingAttempt()).toBeFalse();
    expect(guard.lastOutcome()).toBe('success');
  });

  it('Run_409InProgress_DuringWait_StatusIsWaiting', () => {
    const seen: string[] = [];
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([idempotencyInterceptor, mapErrors])),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { gatewayBaseUrl: GATEWAY, demoAccounts: [] } },
        { provide: IDEMPOTENCY_KEY_FACTORY, useValue: () => 'key-w-00000' },
        {
          provide: IDEMPOTENCY_WAIT,
          useValue: (): Observable<unknown> => {
            seen.push(guardRef.status());
            return of(0);
          },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    const guardRef = TestBed.runInInjectionContext(() => createSubmissionGuard());
    guardRef
      .run('s', { text: 'a' }, (b, context) => http.post(URL, b, { context }))
      .subscribe({ error: () => undefined });
    problem(409, 'idempotency-request-in-progress');
    expect(seen).toEqual(['waiting']);
    controller.expectOne(URL).flush({});
  });

  it('Run_409InProgress_FiveWaitsThenGivesUp_KeepsAttempt', () => {
    const out = submit();
    for (let i = 0; i < 6; i++) problem(409, 'idempotency-request-in-progress');
    expect(waits.length).toBe(5);
    expect(out.error()?.exhausted).toBeTrue();
    expect(out.error()?.message).toContain('Please try again in a moment');
    expect(guard.hasPendingAttempt()).toBeTrue();
    expect(guard.lastOutcome()).toBe('unknown');
    submit();
    expect(keyOfNext()).toBe('key-1-00000');
  });

  it('Run_ReplayedHeader_TreatedAsSuccess', () => {
    const out = submit();
    respond(201, { id: 'c1' }, { 'Idempotent-Replayed': 'true' });
    expect(out.result).toEqual([{ id: 'c1' }]);
    expect(guard.lastOutcome()).toBe('success');
  });

  it('Run_ReplayedHeaderUnreadable_StillSuccess', () => {
    const out = submit();
    respond(201, { id: 'c1' });
    expect(out.error()).toBeUndefined();
    expect(guard.lastOutcome()).toBe('success');
  });

  it('Run_CreateClaim_ReadsIdFromBodyWhenLocationUnreadable', () => {
    const out = submit();
    respond(201, { id: 'claim-9' });
    expect(out.result[0].id).toBe('claim-9');
  });

  it('Run_403StoredRefusal_NoRetryNextActionNewKey', () => {
    const out = submit();
    problem(403, 'forbidden', { 'Idempotent-Replayed': 'true' });
    expect(out.error()?.kind).toBe('forbidden');
    expect(guard.lastOutcome()).toBe('refused');
    expect(guard.hasPendingAttempt()).toBeFalse();
    submit();
    expect(keyOfNext()).toBe('key-2-00000');
  });

  it('Run_422KeyReused_ShowsReviewMessageNewKeyNoResponseDetail', () => {
    const out = submit();
    problem(422, 'idempotency-key-reused');
    expect(out.error()?.message).toBe(
      'We could not safely submit this. Please review your entries and submit again.',
    );
    expect(JSON.stringify(out.error())).not.toContain('SECRET');
    expect(guard.lastOutcome()).toBe('rejected');
    submit();
    expect(keyOfNext()).toBe('key-2-00000');
  });

  it('Run_400KeyMissingOrInvalid_GenericErrorDiscardsAttempt', () => {
    for (const type of ['idempotency-key-missing', 'idempotency-key-invalid']) {
      const out = submit();
      problem(400, type);
      expect(out.error()?.message).toBe('Something went wrong. Please try again.');
      expect(JSON.stringify(out.error())).not.toContain('SECRET');
      expect(guard.hasPendingAttempt()).toBeFalse();
    }
  });

  it('Run_Status0_And_5xx_KeepAttemptAndReEnable', () => {
    const net = submit();
    controller.expectOne(URL).error(new ProgressEvent('error'));
    expect(net.error()?.message).toBe(
      'Your request may not have been received. You can safely try again.',
    );
    expect(guard.hasPendingAttempt()).toBeTrue();
    expect(guard.isInFlight()).toBeFalse();
    const server = submit();
    respond(502);
    expect(server.error()?.message).toContain('may not have been received');
    expect(guard.lastOutcome()).toBe('unknown');
    expect(guard.hasPendingAttempt()).toBeTrue();
    expect(guard.isInFlight()).toBeFalse();
  });

  it('Run_Unsubscribe_ResetsStatusKeepsAttempt', () => {
    const subscription = guard
      .run('s', { text: 'a' }, (b, context) => http.post(URL, b, { context }))
      .subscribe();
    subscription.unsubscribe();
    expect(guard.isInFlight()).toBeFalse();
    expect(guard.hasPendingAttempt()).toBeTrue();
    controller.expectOne(URL).flush({});
  });

  it('Reset_DiscardsAttempt', () => {
    submit();
    respond(503);
    guard.reset();
    expect(guard.hasPendingAttempt()).toBeFalse();
    submit();
    expect(keyOfNext()).toBe('key-2-00000');
  });

  it('Idempotency_NeverWritesConsole_Storage_OrUrl', () => {
    const consoleSpies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
      spyOn(console, m),
    );
    const setItem = spyOn(Storage.prototype, 'setItem');
    submit();
    problem(409, 'idempotency-request-in-progress', { 'Retry-After': '1' });
    const retry = controller.expectOne(URL);
    expect(retry.request.urlWithParams).toBe(URL);
    retry.flush({}, { status: 503, statusText: 'x' });
    consoleSpies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
    expect(setItem).not.toHaveBeenCalled();
  });
});
