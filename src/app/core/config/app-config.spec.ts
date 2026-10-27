import { createAppConfig } from './app-config';

describe('AppConfig', () => {
  const dev = { production: false, demoAccounts: [] };

  it('Provided_ExposesGatewayBaseUrlAndDemoAccountsOnly', () => {
    const config = createAppConfig({ ...dev, gatewayBaseUrl: 'http://localhost:8080' });
    expect(Object.keys(config).sort()).toEqual(['demoAccounts', 'gatewayBaseUrl']);
  });

  it('RelativeUrl_Throws', () => {
    expect(() => createAppConfig({ ...dev, gatewayBaseUrl: '/api' })).toThrow();
  });

  it('NonHttpScheme_Throws', () => {
    expect(() => createAppConfig({ ...dev, gatewayBaseUrl: 'ftp://host' })).toThrow();
  });

  it('Production_HttpUrl_Throws', () => {
    expect(() =>
      createAppConfig({ ...dev, production: true, gatewayBaseUrl: 'http://localhost:8080' }),
    ).toThrow();
  });

  it('Production_HttpsUrl_Allowed', () => {
    expect(
      createAppConfig({ ...dev, production: true, gatewayBaseUrl: 'https://gw.example.com' })
        .gatewayBaseUrl,
    ).toBe('https://gw.example.com');
  });

  it('Development_HttpLocalhost_Allowed', () => {
    expect(
      createAppConfig({ ...dev, gatewayBaseUrl: 'http://localhost:8080' }).gatewayBaseUrl,
    ).toBe('http://localhost:8080');
  });
});
