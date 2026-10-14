import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { I18n } from '../i18n/i18n';
import { GOOGLE_CLIENT_ID } from './config';
import { AuthUser, claimsToUser, decodeCredential } from './credential';
import { GOOGLE_IDENTITY } from './google-identity';
import { browserStorage } from './storage';

const SESSION_KEY = 'kora:session';

function savedUser(value: unknown): AuthUser | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const { id, name, email, picture } = value as Record<string, unknown>;
  if (typeof id !== 'string' || !id) return null;
  if (typeof name !== 'string' || typeof email !== 'string' || typeof picture !== 'string') {
    return null;
  }
  return { id, name, email, picture: picture.startsWith('https://') ? picture : '' };
}

// Who is signed in. The browser cannot check the signature of Google's token, so this
// knows who the person says they are, not that it is true; a server will check it later.
@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly clientId = inject(GOOGLE_CLIENT_ID);
  private readonly identity = inject(GOOGLE_IDENTITY);
  private readonly i18n = inject(I18n);
  private readonly storage = browserStorage(inject(DOCUMENT));

  readonly enabled = this.clientId !== '';

  private readonly current = signal<AuthUser | null>(this.restore());
  private readonly refused = signal(false);

  readonly user = this.current.asReadonly();
  // True when Google sent a credential that was not valid for this app.
  readonly rejected = this.refused.asReadonly();

  renderButton(host: HTMLElement): Promise<void> {
    return this.identity.renderButton(host, {
      clientId: this.clientId,
      locale: this.i18n.lang(),
      onCredential: (credential) => this.accept(credential),
    });
  }

  async signOut(): Promise<void> {
    this.current.set(null);
    this.refused.set(false);
    try {
      this.storage?.removeItem(SESSION_KEY);
    } catch {
      // The browser would not let it be removed; the person is signed out in the page anyway.
    }
    try {
      await this.identity.disableAutoSelect();
    } catch {
      // Google could not be told; nothing else to do.
    }
  }

  private accept(credential: string): void {
    const user = claimsToUser(decodeCredential(credential), {
      clientId: this.clientId,
      now: Date.now(),
    });
    if (!user) {
      this.refused.set(true);
      return;
    }
    this.refused.set(false);
    this.current.set(user);
    try {
      this.storage?.setItem(SESSION_KEY, JSON.stringify(user));
    } catch {
      // The browser would not save it: the person stays signed in until the page closes.
    }
  }

  private restore(): AuthUser | null {
    try {
      return savedUser(JSON.parse(this.storage?.getItem(SESSION_KEY) ?? 'null'));
    } catch {
      return null;
    }
  }
}
