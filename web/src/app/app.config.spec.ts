import { environment } from '../environments/environment';
import { appConfig } from './app.config';
import { GOOGLE_CLIENT_ID } from './auth/config';
import { SITE_URL } from './i18n/site';

interface ValueProvider {
  provide?: unknown;
  useValue?: unknown;
}

const flatten = (providers: unknown[]): unknown[] =>
  providers.flatMap((provider) => (Array.isArray(provider) ? flatten(provider) : [provider]));

describe('appConfig', () => {
  const provided = flatten(appConfig.providers as unknown[]) as ValueProvider[];
  const valueOf = (token: unknown) => provided.find((p) => p.provide === token)?.useValue;

  it('hands the client id of the environment to the app', () => {
    expect(valueOf(GOOGLE_CLIENT_ID)).toBe(environment.googleClientId);
  });

  it('hands the site address of the environment to the app', () => {
    expect(valueOf(SITE_URL)).toBe(environment.siteUrl);
  });
});
