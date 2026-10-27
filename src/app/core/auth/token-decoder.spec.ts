import { makeJwt } from '../../../testing/jwt';
import { decodeToken } from './token-decoder';

describe('TokenDecoder', () => {
  it('Decode_RoleAsStringOrArray_ReturnsRoleArray', () => {
    expect(decodeToken(makeJwt({ role: 'Manager' }))?.roles).toEqual(['Manager']);
    expect(
      decodeToken(makeJwt({ role: ['Officer', 'Manager', 'Officer', 'Wizard'] }))?.roles,
    ).toEqual(['Officer', 'Manager']);
  });

  it('Decode_Utf8Name_IsPreserved', () => {
    expect(decodeToken(makeJwt({ name: 'Zoë Müller' }))?.name).toBe('Zoë Müller');
  });

  it('Decode_MalformedOrMissingClaims_ReturnsNull', () => {
    expect(decodeToken('not-a-jwt')).toBeNull();
    expect(decodeToken('a.%%%.c')).toBeNull();
    expect(decodeToken(makeJwt({ sub: undefined }))).toBeNull();
    expect(decodeToken(makeJwt({ exp: undefined }))).toBeNull();
    expect(decodeToken(makeJwt({ exp: 'soon' }))).toBeNull();
  });

  it('Decode_UnknownRoleOnly_ReturnsNull', () => {
    expect(decodeToken(makeJwt({ role: 'Wizard' }))).toBeNull();
    expect(decodeToken(makeJwt({ role: undefined }))).toBeNull();
  });
});
