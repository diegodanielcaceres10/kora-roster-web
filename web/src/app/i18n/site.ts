import { InjectionToken } from '@angular/core';

// Public address of the site. It is set in src/environments/ and handed over by
// app.config.ts. While it is empty no canonical or hreflang links are written, rather than
// writing a made-up address.
export const SITE_URL = new InjectionToken<string>('SITE_URL', {
  providedIn: 'root',
  factory: () => '',
});
