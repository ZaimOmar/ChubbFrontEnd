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
});
