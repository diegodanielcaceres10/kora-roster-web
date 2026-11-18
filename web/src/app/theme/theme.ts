import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { browserStorage } from '../auth/storage';

export type ThemeMode = 'light' | 'dark';

// index.html reads the same key before the page is painted, so the two must stay equal.
export const THEME_STORAGE_KEY = 'kora:theme';

function isMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

// The look of the app: light or dark. The person picks one and the choice is kept in the
// browser. The mode shows up as the `dark` class on <html>, which is what the color tokens in
// styles.css react to.
//
// For now a first visit is light, not whatever the system prefers: until every screen uses
// the tokens, dark would show up half done. When the redesign is finished, make the first
// visit follow `(prefers-color-scheme: dark)` again here and in the script of index.html.
@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly document = inject(DOCUMENT);
  private readonly storage = browserStorage(this.document);

  private readonly current = signal<ThemeMode>(this.firstMode());

  readonly mode = this.current.asReadonly();

  constructor() {
    this.apply(this.current());
  }

  set(mode: ThemeMode): void {
    this.current.set(mode);
    this.apply(mode);
    try {
      this.storage?.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // The browser would not save it: the choice lasts until the page closes.
    }
  }

  toggle(): void {
    this.set(this.current() === 'dark' ? 'light' : 'dark');
  }

  private firstMode(): ThemeMode {
    let saved: string | null | undefined;
    try {
      saved = this.storage?.getItem(THEME_STORAGE_KEY);
    } catch {
      saved = null;
    }
    return isMode(saved) ? saved : 'light';
  }

  private apply(mode: ThemeMode): void {
    this.document.documentElement.classList.toggle('dark', mode === 'dark');
  }
}
