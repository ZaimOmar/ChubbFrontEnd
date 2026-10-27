import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FakeIdentityApi } from '../../../testing/fake-identity-api';
import { FIXED_NOW_MS, FIXED_NOW_SECONDS, makeJwt } from '../../../testing/jwt';
import { NOW } from './clock';
import { AuthService, IdentityUnavailableError, NoAccessError } from './auth.service';
import { IdentityApi } from './identity-api';
import { landingUrlFor } from './roles';

describe('AuthService', () => {
  let api: FakeIdentityApi;
  let nowMs: number;

  function create(): AuthService {
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    sessionStorage.clear();
    nowMs = FIXED_NOW_MS;
    api = new FakeIdentityApi();
    TestBed.configureTestingModule({
      providers: [
        { provide: IdentityApi, useValue: api },
        { provide: NOW, useValue: () => nowMs },
      ],
    });
  });

  afterEach(() => sessionStorage.clear());

  it('Login_RedirectsToLandingForEachRoleSet', () => {
    const cases: [string | string[], string][] = [
      ['Claimant', '/claimant'],
      ['Officer', '/staff'],
      ['Manager', '/manager'],
      [['Officer', 'Manager'], '/staff'],
    ];
    for (const [role, landing] of cases) {
      sessionStorage.clear();
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          { provide: IdentityApi, useValue: api },
          { provide: NOW, useValue: () => nowMs },
        ],
      });
      api.respondWith(makeJwt({ role }));
      const auth = create();
      auth.login('a@b.test', 'pw').subscribe();
      expect(auth.landingUrl()).toBe(landing);
    }
  });

  it('LandingUrlFor_DualRole_ReturnsStaff', () => {
    expect(landingUrlFor(['Manager', 'Officer'])).toBe('/staff');
    expect(landingUrlFor([])).toBe('/login');
  });

  it('Login_SendsOnlyEmailAndPassword', () => {
    api.respondWith(makeJwt({}));
    create().login('a@b.test', 'pw').subscribe();
    expect(api.requests).toEqual([{ email: 'a@b.test', password: 'pw' }]);
  });

  it('Login_TokenWithNoKnownRole_ThrowsNoAccessAndKeepsNoSession', () => {
    api.respondWith(makeJwt({ role: 'Wizard' }));
    const auth = create();
    let error: unknown;
    auth.login('a@b.test', 'pw').subscribe({ error: (e: unknown) => (error = e) });
    expect(error).toBeInstanceOf(NoAccessError);
    expect(auth.isAuthenticated()).toBeFalse();
    expect(sessionStorage.length).toBe(0);
  });

  it('Login_WithoutIdentityApi_FailsClearly', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: NOW, useValue: () => nowMs }],
    });
    let error: unknown;
    create()
      .login('a', 'b')
      .subscribe({ error: (e: unknown) => (error = e) });
    expect(error).toBeInstanceOf(IdentityUnavailableError);
  });

  it('Login_NeverWritesLocalStorage', () => {
    localStorage.clear();
    api.respondWith(makeJwt({}));
    create().login('a@b.test', 'pw').subscribe();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(1);
  });

  it('Init_ValidStoredToken_RestoresSession', () => {
    sessionStorage.setItem('chubb.token', makeJwt({ name: 'Mark Lee', role: 'Manager' }));
    const auth = create();
    expect(auth.user()?.name).toBe('Mark Lee');
    expect(auth.hasRole('Manager')).toBeTrue();
  });

  it('Init_ExpiredStoredToken_NoSession', () => {
    sessionStorage.setItem('chubb.token', makeJwt({ exp: FIXED_NOW_SECONDS - 1 }));
    const auth = create();
    expect(auth.isAuthenticated()).toBeFalse();
    expect(sessionStorage.length).toBe(0);
  });

  it('CheckSession_TokenExpiresLater_ReportsExpiredAndClears', () => {
    api.respondWith(makeJwt({}));
    const auth = create();
    auth.login('a@b.test', 'pw').subscribe();
    expect(auth.checkSession()).toBe('active');
    nowMs += 1801 * 1000;
    expect(auth.activeToken()).toBeNull();
    expect(auth.checkSession()).toBe('expired');
    expect(auth.checkSession()).toBe('absent');
  });

  it('Logout_ClearsMemoryAndSessionStorage', () => {
    api.respondWith(makeJwt({}));
    const auth = create();
    auth.login('a@b.test', 'pw').subscribe();
    auth.logout();
    expect(auth.isAuthenticated()).toBeFalse();
    expect(sessionStorage.length).toBe(0);
  });
});
