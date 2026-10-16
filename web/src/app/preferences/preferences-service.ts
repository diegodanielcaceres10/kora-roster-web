import { DOCUMENT } from '@angular/common';
import { inject, Injectable, linkedSignal } from '@angular/core';
import { Auth } from '../auth/auth';
import { AuthUser } from '../auth/credential';
import { browserStorage } from '../auth/storage';
import { Preferences, sanitizePreferences } from './preferences';

const KEY_PREFIX = 'kora:prefs:';
const VERSION = 1;

// The preferences of whoever is signed in, kept in the browser under their Google id.
// Without a session there are none: the app behaves as it does for any visitor.
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly auth = inject(Auth);
  private readonly storage = browserStorage(inject(DOCUMENT));

  private readonly current = linkedSignal<AuthUser | null, Preferences | null>({
    source: this.auth.user,
    computation: (user) => (user ? this.read(user.id) : null),
  });

  readonly active = this.current.asReadonly();

  save(preferences: Preferences): void {
    const user = this.auth.user();
    if (!user) return;
    const clean = sanitizePreferences(preferences);
    try {
      this.storage?.setItem(
        KEY_PREFIX + user.id,
        JSON.stringify({ version: VERSION, preferences: clean }),
      );
    } catch {
      // The browser would not save them: they are used until the page closes.
    }
    this.current.set(clean);
  }

  private read(userId: string): Preferences {
    try {
      const saved: unknown = JSON.parse(this.storage?.getItem(KEY_PREFIX + userId) ?? 'null');
      if (
        typeof saved === 'object' &&
        saved !== null &&
        (saved as { version?: unknown }).version === VERSION
      ) {
        return sanitizePreferences((saved as { preferences?: unknown }).preferences);
      }
    } catch {
      // Unreadable or damaged: fall through to the defaults.
    }
    return sanitizePreferences(null);
  }
}
