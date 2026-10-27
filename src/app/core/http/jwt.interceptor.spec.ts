import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FIXED_NOW_MS, FIXED_NOW_SECONDS, makeJwt } from '../../../testing/jwt';
import { NOW } from '../auth/clock';
import { APP_CONFIG } from '../config/app-config';
import { jwtInterceptor } from './jwt.interceptor';

describe('JwtInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  const token = makeJwt({});

  function setup(storedToken: string | null, nowMs = FIXED_NOW_MS): void {
    sessionStorage.clear();
    if (storedToken) sessionStorage.setItem('chubb.token', storedToken);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: NOW, useValue: () => nowMs },
        {
          provide: APP_CONFIG,
          useValue: { gatewayBaseUrl: 'https://gateway.test:8080', demoAccounts: [] },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  }

  function authorizationFor(url: string): string | null {
    http.get(url).subscribe();
    const req = controller.expectOne(url);
    const header = req.request.headers.get('Authorization');
    req.flush({});
    return header;
  }

  afterEach(() => {
    controller.verify();
    sessionStorage.clear();
  });

  it('GatewayRequest_AddsBearer', () => {
    setup(token);
    expect(authorizationFor('https://gateway.test:8080/claims')).toBe(`Bearer ${token}`);
  });

  it('OtherOrigin_NoHeader', () => {
    setup(token);
    expect(authorizationFor('https://other.test/claims')).toBeNull();
  });

  it('LookalikeHost_NoHeader', () => {
    setup(token);
    expect(authorizationFor('https://gateway.test:8080.evil.com/claims')).toBeNull();
    expect(authorizationFor('https://gateway.test:8080@evil.com/claims')).toBeNull();
    expect(authorizationFor('https://evil.com/?u=https://gateway.test:8080')).toBeNull();
  });

  it('RelativeUrl_NoHeader', () => {
    setup(token);
    expect(authorizationFor('/claims')).toBeNull();
  });

  it('NoSession_NoHeader', () => {
    setup(null);
    expect(authorizationFor('https://gateway.test:8080/claims')).toBeNull();
  });

  it('ExpiredToken_NoHeader', () => {
    setup(makeJwt({ exp: FIXED_NOW_SECONDS - 5 }));
    expect(authorizationFor('https://gateway.test:8080/claims')).toBeNull();
  });
});
