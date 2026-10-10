import { InjectionToken } from '@angular/core';

// Production origin, for example 'https://example.com'. While it is empty no
// canonical or hreflang links are written, rather than writing a made-up address.
export const SITE_URL = new InjectionToken<string>('SITE_URL', {
  providedIn: 'root',
  factory: () => '',
});
