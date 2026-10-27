import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { FakeIdentityApi } from '../../../testing/fake-identity-api';
import { FIXED_NOW_MS, FIXED_NOW_SECONDS, makeJwt } from '../../../testing/jwt';
import { NotificationService } from '../notification/notification.service';
import { authGuard } from './auth.guard';
import { NOW } from './clock';
import { IdentityApi } from './identity-api';
import { loginRedirectGuard } from './login-redirect.guard';
import { roleGuard } from './role.guard';
import { Role } from './roles';

describe('guards', () => {
  let notify: jasmine.Spy;
  let nowMs: number;

  function run(guard: typeof authGuard, role?: Role): boolean | UrlTree {
    const route = { data: { role } } as unknown as ActivatedRouteSnapshot;
    return runInInjectionContext(TestBed.inject(Injector), () =>
      guard(route, {} as RouterStateSnapshot),
    ) as boolean | UrlTree;
  }

  function url(result: boolean | UrlTree): string {
    return TestBed.inject(Router).serializeUrl(result as UrlTree);
  }

  function storeToken(claims: Record<string, unknown>): void {
    sessionStorage.setItem('chubb.token', makeJwt(claims));
  }

  beforeEach(() => {
    sessionStorage.clear();
    nowMs = FIXED_NOW_MS;
    notify = jasmine.createSpy('show');
    TestBed.configureTestingModule({
      providers: [
        { provide: IdentityApi, useClass: FakeIdentityApi },
        { provide: NOW, useValue: () => nowMs },
        { provide: NotificationService, useValue: { show: notify } },
      ],
    });
  });

  afterEach(() => sessionStorage.clear());

  it('authGuard_NoSession_RedirectsToLogin', () => {
    expect(url(run(authGuard))).toBe('/login');
    expect(notify).not.toHaveBeenCalled();
  });

  it('authGuard_ActiveSession_Allows', () => {
    storeToken({});
    expect(run(authGuard)).toBeTrue();
  });

  it('authGuard_ExpiredSession_RedirectsToLoginWithExpiredMessage', () => {
    storeToken({ exp: FIXED_NOW_SECONDS + 10 });
    expect(run(authGuard)).toBeTrue();
    nowMs += 11_000;
    expect(url(run(authGuard))).toBe('/login');
    expect(notify).toHaveBeenCalledWith('Your session has expired. Please log in again.');
  });

  it('roleGuard_RightRole_Allows', () => {
    storeToken({ role: 'Manager' });
    expect(run(roleGuard, 'Manager')).toBeTrue();
  });

  it('roleGuard_WrongRole_RedirectsToLandingWithSnackbar', () => {
    storeToken({ role: 'Claimant' });
    expect(url(run(roleGuard, 'Officer'))).toBe('/claimant');
    expect(notify).toHaveBeenCalledWith('You do not have access to that area.');
  });

  it('roleGuard_MissingOrUnknownRoleData_FailsLoudly', () => {
    storeToken({});
    expect(() => run(roleGuard)).toThrowError(/route data `role`/);
    expect(() => run(roleGuard, 'Wizard' as Role)).toThrowError(/route data `role`/);
  });

  it('roleGuard_DualRole_AllowsBothAreas', () => {
    storeToken({ role: ['Officer', 'Manager'] });
    expect(run(roleGuard, 'Officer')).toBeTrue();
    expect(run(roleGuard, 'Manager')).toBeTrue();
  });

  it('loginRedirectGuard_Authenticated_RedirectsToLanding', () => {
    storeToken({ role: ['Officer', 'Manager'] });
    expect(url(run(loginRedirectGuard))).toBe('/staff');
  });

  it('loginRedirectGuard_Anonymous_Allows', () => {
    expect(run(loginRedirectGuard)).toBeTrue();
  });
});
