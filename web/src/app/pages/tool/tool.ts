import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18n } from '../../i18n/i18n';
import { PageMeta } from '../../i18n/page-meta';
import { AmistosoStore } from '../../state/amistoso.store';
import { PasteStep } from './paste-step';
import { PreviewStep } from './preview-step';
import { ResultStep } from './result-step';

@Component({
  selector: 'app-tool',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PasteStep, PreviewStep, ResultStep],
  template: `
    <section class="mx-auto max-w-3xl space-y-6 p-4">
      <h1>{{ i18n.t().tool.heading }}</h1>
      @switch (store.step()) {
        @case ('paste') {
          <app-paste-step />
        }
        @case ('preview') {
          <app-preview-step />
        }
        @case ('result') {
          <app-result-step />
        }
      }
    </section>
  `,
})
export class Tool {
  protected readonly i18n = inject(I18n);
  protected readonly store = inject(AmistosoStore);

  constructor() {
    inject(PageMeta).apply('tool');
  }
}
