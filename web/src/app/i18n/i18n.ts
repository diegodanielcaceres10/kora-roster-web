import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';
import { DICTIONARIES } from './dictionaries';
import { DEFAULT_LANG, Lang } from './languages';

@Injectable({ providedIn: 'root' })
export class I18n {
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<Lang>(DEFAULT_LANG);

  readonly lang = this.current.asReadonly();
  readonly t = computed(() => DICTIONARIES[this.current()]);

  setLang(lang: Lang): void {
    this.current.set(lang);
    this.document.documentElement.lang = lang;
  }
}
