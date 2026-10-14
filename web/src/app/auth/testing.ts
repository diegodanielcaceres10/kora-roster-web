// Helpers for specs: a fake Google client and a token builder. Not used by the app.
import { GOOGLE_CLIENT_ID } from './config';
import { GOOGLE_IDENTITY, GoogleIdentity } from './google-identity';

export const TEST_CLIENT_ID = 'client-1.apps.googleusercontent.com';

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// A token Google would accept for TEST_CLIENT_ID. Pass overrides to break one claim.
export function makeCredential(overrides: Record<string, unknown> = {}): string {
  const encode = (value: unknown) => base64url(new TextEncoder().encode(JSON.stringify(value)));
  const payload = {
    iss: 'https://accounts.google.com',
    aud: TEST_CLIENT_ID,
    exp: Math.floor(Date.now() / 1000) + 3600,
    sub: '1122334455',
    name: 'Diego Cáceres',
    email: 'diego@example.com',
    picture: 'https://lh3.googleusercontent.com/a/photo=s96-c',
    ...overrides,
  };
  return `${encode({ alg: 'RS256' })}.${encode(payload)}.signature`;
}

export class FakeGoogleIdentity implements GoogleIdentity {
  hosts: HTMLElement[] = [];
  options: { clientId: string; locale: string }[] = [];
  autoSelectDisabled = 0;
  renderFailure: Error | null = null;
  autoSelectFailure: Error | null = null;
  private onCredential: ((credential: string) => void) | null = null;

  async renderButton(
    host: HTMLElement,
    options: { clientId: string; locale: string; onCredential: (credential: string) => void },
  ): Promise<void> {
    if (this.renderFailure) throw this.renderFailure;
    this.hosts.push(host);
    this.options.push({ clientId: options.clientId, locale: options.locale });
    this.onCredential = options.onCredential;
  }

  async disableAutoSelect(): Promise<void> {
    this.autoSelectDisabled++;
    if (this.autoSelectFailure) throw this.autoSelectFailure;
  }

  // What Google does when the person chooses an account.
  pick(credential: string): void {
    this.onCredential?.(credential);
  }
}

export function provideFakeGoogle(clientId = TEST_CLIENT_ID) {
  const fake = new FakeGoogleIdentity();
  return {
    fake,
    providers: [
      { provide: GOOGLE_CLIENT_ID, useValue: clientId },
      { provide: GOOGLE_IDENTITY, useValue: fake },
    ],
  };
}
