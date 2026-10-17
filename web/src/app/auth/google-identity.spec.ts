import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GisClient } from './google-identity';

const SCRIPT = 'script[src="https://accounts.google.com/gsi/client"]';
const scripts = () => Array.from(document.head.querySelectorAll(SCRIPT)) as HTMLScriptElement[];

function installGoogle() {
  const google = { initialize: vi.fn(), renderButton: vi.fn(), disableAutoSelect: vi.fn() };
  (window as unknown as { google?: unknown }).google = { accounts: { id: google } };
  return google;
}

const loaded = (script: HTMLScriptElement) => script.dispatchEvent(new Event('load'));
const failed = (script: HTMLScriptElement) => script.dispatchEvent(new Event('error'));

function draw(client: GisClient, onCredential = vi.fn(), locale = 'es') {
  const host = document.createElement('div');
  const done = client.renderButton(host, { clientId: 'client-1', locale, onCredential });
  return { host, done, onCredential };
}

describe('GisClient', () => {
  afterEach(() => {
    scripts().forEach((s) => s.remove());
    Reflect.deleteProperty(window, 'google');
  });

  it('adds the Google script once, however many buttons are drawn', async () => {
    installGoogle();
    const client = TestBed.inject(GisClient);
    const first = draw(client);
    const second = draw(client);
    expect(scripts()).toHaveLength(1);
    loaded(scripts()[0]);
    await Promise.all([first.done, second.done]);
    draw(client);
    expect(scripts()).toHaveLength(1);
  });

  it('draws the button in the language it is given', async () => {
    const google = installGoogle();
    const client = TestBed.inject(GisClient);
    const { host, done } = draw(client, vi.fn(), 'pt');
    loaded(scripts()[0]);
    await done;
    expect(google.renderButton).toHaveBeenCalledTimes(1);
    const [parent, options] = google.renderButton.mock.calls[0];
    expect(parent).toBe(host);
    expect(options).toMatchObject({ type: 'standard', locale: 'pt' });
  });

  it('starts Google once for the app and passes the credential to the latest button', async () => {
    const google = installGoogle();
    const client = TestBed.inject(GisClient);
    const first = draw(client);
    loaded(scripts()[0]);
    await first.done;
    const second = draw(client);
    await second.done;

    expect(google.initialize).toHaveBeenCalledTimes(1);
    const { client_id, callback } = google.initialize.mock.calls[0][0];
    expect(client_id).toBe('client-1');
    callback({ credential: 'the.jwt.token' });
    expect(second.onCredential).toHaveBeenCalledWith('the.jwt.token');
    expect(first.onCredential).not.toHaveBeenCalled();
  });

  it('fails when the script cannot be loaded, and a later attempt tries again', async () => {
    const client = TestBed.inject(GisClient);
    const first = draw(client);
    failed(scripts()[0]);
    await expect(first.done).rejects.toThrow();
    expect(scripts()).toHaveLength(0);

    installGoogle();
    const second = draw(client);
    expect(scripts()).toHaveLength(1);
    loaded(scripts()[0]);
    await expect(second.done).resolves.toBeUndefined();
  });

  it('fails when the script loads but Google does not start', async () => {
    const client = TestBed.inject(GisClient);
    const { done } = draw(client);
    loaded(scripts()[0]);
    await expect(done).rejects.toThrow();
  });

  describe('disableAutoSelect', () => {
    it('does nothing, and loads nothing, when Google was never used', async () => {
      const google = installGoogle();
      await TestBed.inject(GisClient).disableAutoSelect();
      expect(scripts()).toHaveLength(0);
      expect(google.disableAutoSelect).not.toHaveBeenCalled();
    });

    it('asks Google to stop choosing the account on its own once it is loaded', async () => {
      const google = installGoogle();
      const client = TestBed.inject(GisClient);
      const { done } = draw(client);
      loaded(scripts()[0]);
      await done;
      await client.disableAutoSelect();
      expect(google.disableAutoSelect).toHaveBeenCalledTimes(1);
    });

    it('does not fail when Google could not be loaded', async () => {
      const client = TestBed.inject(GisClient);
      const { done } = draw(client);
      failed(scripts()[0]);
      await expect(done).rejects.toThrow();
      await expect(client.disableAutoSelect()).resolves.toBeUndefined();
    });
  });

  describe('on the server, while prerendering', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    });

    it('adds no script and draws nothing', async () => {
      const google = installGoogle();
      const { done } = draw(TestBed.inject(GisClient));
      await expect(done).resolves.toBeUndefined();
      expect(scripts()).toHaveLength(0);
      expect(google.initialize).not.toHaveBeenCalled();
      expect(google.renderButton).not.toHaveBeenCalled();
    });

    it('has nothing to disable', async () => {
      const google = installGoogle();
      await expect(TestBed.inject(GisClient).disableAutoSelect()).resolves.toBeUndefined();
      expect(google.disableAutoSelect).not.toHaveBeenCalled();
    });
  });
});
