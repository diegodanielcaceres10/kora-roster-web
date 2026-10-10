import { afterNextRender, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { pickLanguage } from './languages';

// Prerendered at "/", so the redirect runs in the browser only. The links are for
// visitors without JavaScript.
@Component({
  selector: 'app-redirect-to-language',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <noscript>
      <nav><a href="/en">English</a> · <a href="/es">Español</a> · <a href="/pt">Português</a></nav>
    </noscript>
  `,
})
export class RedirectToLanguage {
  constructor() {
    const router = inject(Router);
    afterNextRender(() => {
      void router.navigateByUrl(`/${pickLanguage(navigator.languages)}`, { replaceUrl: true });
    });
  }
}
