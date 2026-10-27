import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { FakeIdentityApi } from '../../../testing/fake-identity-api';
import { FIXED_NOW_MS, makeJwt } from '../../../testing/jwt';
import { NOW } from '../../core/auth/clock';
import { IdentityApi } from '../../core/auth/identity-api';
import { APP_CONFIG } from '../../core/config/app-config';
import { AppError } from '../../core/http/app-error';
import { LoginPage } from './login.page';

const DEMOS = [
  { label: 'Officer - Olivia Officer', email: 'officer@test.invalid' },
  { label: 'Officer + Manager (dual-role) - Dana Dual', email: 'dual@test.invalid' },
];

describe('LoginPage', () => {
  let api: FakeIdentityApi;
  let navigate: jasmine.Spy;
  let fixture: ComponentFixture<LoginPage>;
  let root: HTMLElement;

  async function setup(withDemoAccounts = true): Promise<void> {
    sessionStorage.clear();
    api = new FakeIdentityApi();
    navigate = jasmine.createSpy('navigateByUrl').and.resolveTo(true);
    TestBed.configureTestingModule({
      providers: [
        { provide: IdentityApi, useValue: api },
        { provide: NOW, useValue: () => FIXED_NOW_MS },
        { provide: Router, useValue: { navigateByUrl: navigate } },
        {
          provide: APP_CONFIG,
          useValue: {
            gatewayBaseUrl: 'http://gw.test',
            demoAccounts: withDemoAccounts ? DEMOS : [],
          },
        },
      ],
    });
    fixture = TestBed.createComponent(LoginPage);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  afterEach(() => {
    root.remove();
    sessionStorage.clear();
  });

  const email = () => root.querySelector('input[type="email"]') as HTMLInputElement;
  const password = () =>
    root.querySelector('input[autocomplete="current-password"]') as HTMLInputElement;
  const submitButton = () => root.querySelector('button[type="submit"]') as HTMLButtonElement;
  const banner = () => root.querySelector('[role="alert"]') as HTMLElement | null;

  async function type(emailValue: string, passwordValue: string): Promise<void> {
    email().value = emailValue;
    email().dispatchEvent(new Event('input'));
    password().value = passwordValue;
    password().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  async function submit(): Promise<void> {
    submitButton().click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('ValidLogin_NavigatesToLandingOfRole', async () => {
    await setup();
    api.respondWith(makeJwt({ role: ['Officer', 'Manager'] }));
    await type('dual@test.invalid', 'pw');
    await submit();
    expect(navigate).toHaveBeenCalledOnceWith('/staff');
  });

  it('Submit_SendsOnlyEmailAndPassword', async () => {
    await setup();
    api.respondWith(makeJwt({}));
    await type('a@b.test', 'secret');
    await submit();
    expect(api.requests).toEqual([{ email: 'a@b.test', password: 'secret' }]);
  });

  it('FocusStartsOnEmail', async () => {
    await setup();
    expect(document.activeElement).toBe(email());
  });

  it('EmptyFields_ShowsMessagesLinkedByAriaDescribedBy', async () => {
    await setup();
    await submit();
    expect(api.requests.length).toBe(0);
    const text = root.textContent ?? '';
    expect(text).toContain('Enter your email.');
    expect(text).toContain('Enter your password.');
    for (const input of [email(), password()]) {
      const ids = input.getAttribute('aria-describedby')?.split(' ') ?? [];
      expect(ids.some((id) => root.querySelector(`#${id}`)?.tagName === 'MAT-ERROR')).toBeTrue();
    }
  });

  it('InvalidEmailFormat_ShowsValidEmailMessage', async () => {
    await setup();
    await type('nope', 'pw');
    email().dispatchEvent(new Event('blur'));
    await submit();
    expect(root.textContent).toContain('Enter a valid email address.');
    expect(api.requests.length).toBe(0);
  });

  it('401_ShowsGenericBannerAndFocusesIt_KeepsEmail', async () => {
    await setup();
    const unauthorized: AppError = { status: 401, kind: 'unauthenticated', message: 'x' };
    api.failWith(unauthorized);
    await type('a@b.test', 'wrong');
    await submit();
    expect(banner()?.textContent).toContain('Email or password is incorrect.');
    expect(document.activeElement).toBe(banner());
    expect(email().value).toBe('a@b.test');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('ServerError_ShowsTryAgainMessage', async () => {
    await setup();
    api.failWith({ status: 503, kind: 'server', message: 'x' } satisfies AppError);
    await type('a@b.test', 'pw');
    await submit();
    expect(banner()?.textContent).toContain('We could not sign you in. Please try again.');
  });

  it('TokenWithNoKnownRole_ShowsNoAccessAndKeepsNoSession', async () => {
    await setup();
    api.respondWith(makeJwt({ role: 'Wizard' }));
    await type('a@b.test', 'pw');
    await submit();
    expect(banner()?.textContent).toContain('Your account has no access to this application.');
    expect(sessionStorage.length).toBe(0);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('SubmitTwiceWhilePending_SendsOneRequest', async () => {
    await setup();
    const pending: Subject<{ accessToken: string }> = api.hold();
    await type('a@b.test', 'pw');
    await submit();
    expect(submitButton().disabled).toBeTrue();
    root.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(api.requests.length).toBe(1);
    expect(root.querySelector('form')?.getAttribute('aria-busy')).toBe('true');
    pending.complete();
  });

  it('PasswordToggle_ChangesTypeAndAriaPressed', async () => {
    await setup();
    const toggle = root.querySelector('button[aria-label="Show password"]') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    toggle.click();
    fixture.detectChanges();
    expect(password().type).toBe('text');
    expect(toggle.getAttribute('aria-label')).toBe('Show password');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });

  it('DemoPicker_WhenAccountsConfigured_IsRendered', async () => {
    await setup(true);
    expect(root.querySelector('app-demo-account-picker')).not.toBeNull();
    expect(root.textContent).toContain('Dev only');
  });

  it('DemoPicker_NoAccountsConfigured_IsNotRendered', async () => {
    await setup(false);
    expect(root.querySelector('app-demo-account-picker')).toBeNull();
    expect(root.textContent).not.toContain('Demo account');
  });

  it('DemoPicker_Selection_FillsEmailAnnouncesAndFocusesPassword', async () => {
    await setup(true);
    (root.querySelector('mat-select') as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const option = Array.from(document.querySelectorAll('mat-option')).find((o) =>
      o.textContent?.includes('Officer + Manager'),
    ) as HTMLElement;
    option.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(email().value).toBe('dual@test.invalid');
    expect(password().value).toBe('');
    expect(document.activeElement).toBe(password());
    fixture.detectChanges();
    await fixture.whenStable();
    expect(root.querySelector('p[aria-live="polite"]')?.textContent).toContain(
      'Email filled with dual@test.invalid',
    );
  });

  it('400_ShowsFieldMessages', async () => {
    await setup();
    const invalid: AppError = {
      status: 400,
      kind: 'validation',
      message: 'x',
      fieldErrors: {
        Email: ['Email is not a valid address.'],
        password: ['Password is too long.'],
      },
    };
    api.failWith(invalid);
    await type('a@b.test', 'pw');
    await submit();
    fixture.detectChanges();
    expect(root.textContent).toContain('Email is not a valid address.');
    expect(root.textContent).toContain('Password is too long.');
    expect(banner()).toBeNull();
    expect(email().value).toBe('a@b.test');
  });

  it('400_WithoutFieldErrors_ShowsTryAgainBanner', async () => {
    await setup();
    api.failWith({ status: 400, kind: 'validation', message: 'x' } satisfies AppError);
    await type('a@b.test', 'pw');
    await submit();
    expect(banner()?.textContent).toContain('We could not sign you in. Please try again.');
  });

  it('DemoPicker_KeyboardSelectionWithPanelClosed_FillsEmail', async () => {
    await setup();
    const select = root.querySelector('mat-select') as HTMLElement;
    select.focus();
    select.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect(email().value).toBe('officer@test.invalid');
  });

  it('DemoPicker_WhileSubmitting_IsDisabled', async () => {
    await setup();
    api.hold();
    await type('a@b.test', 'pw');
    await submit();
    const select = root.querySelector('mat-select') as HTMLElement;
    expect(select.getAttribute('aria-disabled')).toBe('true');
  });
});
