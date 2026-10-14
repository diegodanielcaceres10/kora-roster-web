import { Provider } from '@angular/core';
import { Environment } from '../environments/environment.model';
import { GOOGLE_CLIENT_ID } from './auth/config';
import { SITE_URL } from './i18n/site';

// Hands the settings of the environment being built to the parts of the app that need them.
export function provideEnvironment(environment: Environment): Provider[] {
  return [
    { provide: GOOGLE_CLIENT_ID, useValue: environment.googleClientId },
    { provide: SITE_URL, useValue: environment.siteUrl },
  ];
}
