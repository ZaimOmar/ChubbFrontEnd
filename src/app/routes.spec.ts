import { routes } from './app.routes';
import { authGuard } from './core/auth/auth.guard';
import { loginRedirectGuard } from './core/auth/login-redirect.guard';
import { roleGuard } from './core/auth/role.guard';

describe('Routes', () => {
  const shell = routes.find((r) => r.component && r.children);
  const areas = shell?.children ?? [];

  it('RoleAreas_AreLazyAndGuarded', () => {
    expect(shell?.canActivate).toContain(authGuard);
    expect(shell?.canActivateChild).toContain(authGuard);
    expect(areas.map((a) => [a.path, a.data?.['role']])).toEqual([
      ['claimant', 'Claimant'],
      ['staff', 'Officer'],
      ['manager', 'Manager'],
    ]);
    for (const area of areas) {
      expect(area.canActivate).toContain(roleGuard);
      expect(area.loadChildren).toBeDefined();
      expect(area.children).toBeUndefined();
    }
  });

  it('Login_IsPublicWithRedirectGuardAndLazy', () => {
    const login = routes.find((r) => r.path === 'login');
    expect(login?.canActivate).toEqual([loginRedirectGuard]);
    expect(login?.canActivate).not.toContain(authGuard);
    expect(login?.loadComponent).toBeDefined();
  });

  it('UnknownUrl_FallsBackToRedirect', () => {
    expect(routes[routes.length - 1]).toEqual(jasmine.objectContaining({ path: '**' }));
  });
});
