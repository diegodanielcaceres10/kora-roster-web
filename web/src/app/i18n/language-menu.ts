import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { UiIcon, UiIconButton } from '../ui';
import { I18n } from './i18n';
import { type Lang, switchLanguageUrl } from './languages';

// Each language is named in itself, so a person who cannot read the current one still finds theirs.
const OPTIONS: readonly { lang: Lang; name: string }[] = [
  { lang: 'en', name: 'English' },
  { lang: 'es', name: 'Español' },
  { lang: 'pt', name: 'Português' },
];

// A globe button that opens the list of languages. It follows the disclosure pattern: the
// button says whether the list is open, Escape closes it and gives the focus back, and so do
// choosing a language or clicking or tabbing away.
@Component({
  selector: 'app-language-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiIconButton, UiIcon],
  host: {
    class: 'relative inline-flex',
    '(keydown.escape)': 'closeAndRefocus()',
    '(document:click)': 'closeIfOutside($event)',
    '(document:focusin)': 'closeIfOutside($event)',
  },
  templateUrl: './language-menu.html',
})
export class LanguageMenu {
  protected readonly i18n = inject(I18n);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly trigger = viewChild.required(UiIconButton);

  protected readonly options = OPTIONS;
  protected readonly open = signal(false);

  protected toggle(): void {
    this.open.update((value) => !value);
  }

  protected choose(lang: Lang): void {
    this.closeAndRefocus();
    if (lang !== this.i18n.lang()) {
      void this.router.navigateByUrl(switchLanguageUrl(this.router.url, lang));
    }
  }

  protected closeAndRefocus(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.trigger().focus();
  }

  protected closeIfOutside(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
