import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18n } from '../../i18n/i18n';
import { PageMeta } from '../../i18n/page-meta';

@Component({
  selector: 'app-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="mx-auto max-w-3xl p-4">
    <h1>{{ i18n.t().meta.landing.title }}</h1>
  </section>`,
})
export class Landing {
  protected readonly i18n = inject(I18n);

  constructor() {
    inject(PageMeta).apply('landing');
  }
}
