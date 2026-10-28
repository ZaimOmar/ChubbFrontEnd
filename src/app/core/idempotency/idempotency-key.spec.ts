import { createIdempotencyKey } from './idempotency-key';

describe('IdempotencyKey', () => {
  it('Create_MatchesAllowedCharsetAndLength', () => {
    const key = createIdempotencyKey();
    expect(key).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('Create_NoRandomUuid_FallsBackToGetRandomValues', () => {
    const getRandomValues = jasmine
      .createSpy('getRandomValues')
      .and.callFake((bytes: Uint8Array) => bytes.fill(0xab));
    const key = createIdempotencyKey({ getRandomValues } as unknown as Crypto);
    expect(getRandomValues).toHaveBeenCalled();
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('Create_TwoCalls_Differ', () => {
    expect(createIdempotencyKey()).not.toBe(createIdempotencyKey());
  });
});
