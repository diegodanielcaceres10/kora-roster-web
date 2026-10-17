import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, InjectionToken, PLATFORM_ID } from '@angular/core';

// What the app needs from Google Identity Services. Everything else in the app talks to
// this interface, so tests use a fake and a server-side check can replace it later.
export interface GoogleIdentity {
  renderButton(
    host: HTMLElement,
    options: { clientId: string; locale: string; onCredential: (credential: string) => void },
  ): Promise<void>;
  disableAutoSelect(): Promise<void>;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
  disableAutoSelect(): void;
}

interface GoogleWindow {
  google?: { accounts: { id: GoogleAccountsId } };
}

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client';

@Injectable({ providedIn: 'root' })
export class GisClient implements GoogleIdentity {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private loading: Promise<GoogleAccountsId> | null = null;
  private started = false;
  private latestCallback: ((credential: string) => void) | null = null;

  async renderButton(
    host: HTMLElement,
    options: { clientId: string; locale: string; onCredential: (credential: string) => void },
  ): Promise<void> {
    // Prerendering runs on a server, where there is no browser to load Google into. Without
    // this the script tag would be written into the static HTML and loaded twice.
    if (!this.isBrowser) return;
    const google = await this.load();
    this.latestCallback = options.onCredential;
    // Google warns when it is started twice, so it starts once and the callback
    // always reaches the button drawn last.
    if (!this.started) {
      google.initialize({
        client_id: options.clientId,
        callback: (response) => this.latestCallback?.(response.credential),
      });
      this.started = true;
    }
    google.renderButton(host, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      locale: options.locale,
    });
  }

  async disableAutoSelect(): Promise<void> {
    if (!this.loading) return;
    try {
      (await this.loading).disableAutoSelect();
    } catch {
      // Google never loaded, so there is nothing to disable.
    }
  }

  private load(): Promise<GoogleAccountsId> {
    this.loading ??= new Promise((resolve, reject) => {
      const script = this.document.createElement('script');
      script.src = GIS_SCRIPT;
      script.async = true;
      script.defer = true;

      // A failed attempt is forgotten, so the next button can try again.
      const fail = (message: string) => {
        this.loading = null;
        script.remove();
        reject(new Error(message));
      };
      script.onload = () => {
        const google = (this.document.defaultView as unknown as GoogleWindow | null)?.google;
        if (google) resolve(google.accounts.id);
        else fail('Google sign-in did not start');
      };
      script.onerror = () => fail('Could not load Google sign-in');

      this.document.head.appendChild(script);
    });
    return this.loading;
  }
}

export const GOOGLE_IDENTITY = new InjectionToken<GoogleIdentity>('GOOGLE_IDENTITY', {
  providedIn: 'root',
  factory: () => inject(GisClient),
});
