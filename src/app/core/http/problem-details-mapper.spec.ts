import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { mapProblemDetails } from './problem-details-mapper';

const GUID = '3f2b8c1e-9d4a-4e7b-8a6c-1f2e3d4c5b6a';

function failure(status: number, error: unknown = null, headers = new HttpHeaders()) {
  return new HttpErrorResponse({ status, error, headers });
}

describe('ProblemDetailsMapper', () => {
  it('Map_Status401_403_404_409_422_5xx_Network', () => {
    const kinds = [401, 403, 404, 409, 422, 400, 500, 503, 0, 413].map(
      (s) => mapProblemDetails(failure(s)).kind,
    );
    expect(kinds).toEqual([
      'unauthenticated',
      'forbidden',
      'not-found',
      'conflict',
      'validation',
      'validation',
      'server',
      'server',
      'network',
      'unexpected',
    ]);
    expect(mapProblemDetails(failure(403)).message).toBe('You are not allowed to do that.');
    expect(mapProblemDetails(failure(404)).message).toBe('We could not find that claim.');
    expect(mapProblemDetails(failure(500)).message).toBe('Something went wrong. Please try again.');
    expect(mapProblemDetails(failure(0)).message).toBe('Something went wrong. Please try again.');
  });

  it('Map_DoesNotExposeServerDetail', () => {
    const error = mapProblemDetails(
      failure(500, { detail: 'SqlException at Claims.Db line 42', title: 'Boom' }),
    );
    expect(JSON.stringify(error)).not.toContain('SqlException');
    expect(JSON.stringify(error)).not.toContain('Boom');
  });

  it('Map_MalformedBody_FallsBackToStatusMessage', () => {
    expect(mapProblemDetails(failure(404, '<html>nope</html>')).message).toBe(
      'We could not find that claim.',
    );
    expect(mapProblemDetails(failure(422, ['x'])).fieldErrors).toBeUndefined();
  });

  it('Map_ValidationErrors_ReturnsFieldErrors', () => {
    const error = mapProblemDetails(
      failure(422, { type: 'validation-error', errors: { email: ['Invalid'], bad: 5 } }),
    );
    expect(error.fieldErrors).toEqual({ email: ['Invalid'] });
    expect(error.problemType).toBe('validation-error');
  });

  it('Map_CorrelationId_ReadFromHeaderOnlyAndMustBeGuid', () => {
    const fromHeader = mapProblemDetails(
      failure(500, { correlationId: 'body-id' }, new HttpHeaders({ 'X-Correlation-Id': GUID })),
    );
    expect(fromHeader.correlationId).toBe(GUID);
    expect(mapProblemDetails(failure(500, { correlationId: GUID })).correlationId).toBeUndefined();
    const notGuid = new HttpHeaders({ 'X-Correlation-Id': 'abc' });
    expect(mapProblemDetails(failure(500, null, notGuid)).correlationId).toBeUndefined();
  });

  it('Map_409InProgress_DifferentKindFromBusinessConflict', () => {
    const inProgress = mapProblemDetails(failure(409, { type: 'idempotency-request-in-progress' }));
    const business = mapProblemDetails(failure(409, { type: 'invalid-transition' }));
    expect(inProgress.kind).toBe('idempotency-in-progress');
    expect(business.kind).toBe('conflict');
    expect(mapProblemDetails(failure(409)).kind).toBe('conflict');
    expect(mapProblemDetails(failure(500, { type: 'idempotency-request-in-progress' })).kind).toBe(
      'server',
    );
  });

  it('Map_RetryAfter_ParsesIntegerOnly', () => {
    const type = { type: 'idempotency-request-in-progress' };
    const retry = (value: string) =>
      mapProblemDetails(failure(409, type, new HttpHeaders({ 'Retry-After': value })))
        .retryAfterSeconds;
    expect(retry('3')).toBe(3);
    expect(retry('0')).toBe(0);
    expect(retry('3600')).toBe(3600);
    expect(retry('3601')).toBeUndefined();
    expect(retry('1.5')).toBeUndefined();
    expect(retry('-2')).toBeUndefined();
    expect(retry('Wed, 21 Oct 2026 07:28:00 GMT')).toBeUndefined();
    expect(mapProblemDetails(failure(409, type)).retryAfterSeconds).toBeUndefined();
  });

  it('Map_422KeyReused_Kind', () => {
    const error = mapProblemDetails(failure(422, { type: 'idempotency-key-reused' }));
    expect(error.kind).toBe('idempotency-key-reused');
    expect(error.message).toBe(
      'We could not safely submit this. Please review your entries and submit again.',
    );
    expect(mapProblemDetails(failure(422, { type: 'validation-error' })).kind).toBe('validation');
  });

  it('Map_400KeyInvalid_Kind', () => {
    expect(mapProblemDetails(failure(400, { type: 'idempotency-key-missing' })).kind).toBe(
      'idempotency-key-invalid',
    );
    expect(mapProblemDetails(failure(400, { type: 'idempotency-key-invalid' })).kind).toBe(
      'idempotency-key-invalid',
    );
    expect(mapProblemDetails(failure(400, { type: 'validation-error' })).kind).toBe('validation');
  });
});
