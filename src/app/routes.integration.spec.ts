import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { FakeIdentityApi } from '../testing/fake-identity-api';
import { FIXED_NOW_MS, FIXED_NOW_SECONDS, makeJwt } from '../testing/jwt';
import { routes } from './app.routes';
import { NOW } from './core/auth/clock';
import { IdentityApi } from './core/auth/identity-api';
import { NotificationService } from './core/notification/notification.service';

describe('Routes integration', () => {
  it('SessionExpiresBetweenAreas_NavigationEndsOnLoginWithExpiredMessage', async () => {
    sessionStorage.clear();
    sessionStorage.setItem(
      'chubb.token',
      makeJwt({ role: ['Officer', 'Manager'], exp: FIXED_NOW_SECONDS + 60 }),
    );
    let nowMs = FIXED_NOW_MS;
    const show = jasmine.createSpy('show');
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: IdentityApi, useClass: FakeIdentityApi },
        { provide: NOW, useValue: () => nowMs },
        { provide: NotificationService, useValue: { show } },
      ],
    });
    const router = TestBed.inject(Router);

    expect(await router.navigateByUrl('/staff/queue')).toBeTrue();
    expect(router.url).toBe('/staff/queue');

    nowMs += 61_000;
    await router.navigateByUrl('/manager/pending');

    expect(router.url).toBe('/login');
    expect(show).toHaveBeenCalledWith('Your session has expired. Please log in again.');
    sessionStorage.clear();
  });
});
