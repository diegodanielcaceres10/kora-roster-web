import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UiSegmented } from '../ui';
import { I18n } from './i18n';
import { isLang, SUPPORTED_LANGS, switchLanguageUrl } from './languages';

@Component({
  selector: 'app-language-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiSegmented],
  template: `
    <ui-segmented
      [label]="i18n.t().language.label"
      [options]="options"
      [value]="i18n.lang()"
      (valueChange)="change($event)"
    />
  `,
})
export class LanguageSelector {
  protected readonly i18n = inject(I18n);
  private readonly router = inject(Router);

  protected readonly options = SUPPORTED_LANGS.map((lang) => ({
    value: lang,
    label: lang.toUpperCase(),
  }));

  protected change(value: string): void {
    if (isLang(value)) void this.router.navigateByUrl(switchLanguageUrl(this.router.url, value));
  }
}
