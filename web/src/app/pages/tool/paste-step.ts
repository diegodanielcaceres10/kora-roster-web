import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { parsePastedNames } from '../../core/parse-players';
import { I18n } from '../../i18n/i18n';
import { AmistosoStore } from '../../state/amistoso.store';
import { UiButton, UiTextarea } from '../../ui';

@Component({
  selector: 'app-paste-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButton, UiTextarea],
  template: `
    <section class="space-y-4">
      <h2>{{ t().paste.title }}</h2>
      <ui-textarea
        [label]="t().paste.label"
        [placeholder]="t().paste.placeholder"
        [hint]="t().paste.hint"
        [rows]="8"
        [value]="store.rawText()"
        (valueChange)="store.setRawText($event)"
      />
      <ui-button size="lg" [disabled]="!hasNames()" (click)="store.continueToPreview()">
        {{ t().paste.continue }}
      </ui-button>
    </section>
  `,
})
export class PasteStep {
  protected readonly store = inject(AmistosoStore);
  private readonly i18n = inject(I18n);

  protected readonly t = computed(() => this.i18n.t().tool);
  protected readonly hasNames = computed(() => parsePastedNames(this.store.rawText()).length > 0);
}
