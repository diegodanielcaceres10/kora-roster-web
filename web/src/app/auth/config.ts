import { InjectionToken } from '@angular/core';

// The OAuth client id from Google Cloud Console. It is set in src/environments/ and handed
// over by app.config.ts. While it is empty, sign in is off: the header shows no link and
// the account page says it is not available yet.
export const GOOGLE_CLIENT_ID = new InjectionToken<string>('GOOGLE_CLIENT_ID', {
  providedIn: 'root',
  factory: () => '',
});
