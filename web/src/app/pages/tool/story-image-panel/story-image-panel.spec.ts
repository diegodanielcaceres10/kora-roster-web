import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DICTIONARIES } from '../../../i18n/dictionaries';
import { I18n } from '../../../i18n/i18n';
import { STORY_DELIVERY } from '../../../image/story-delivery';
import { STORY_BLOB } from '../../../image/story-image';
import { Preferences } from '../../../preferences/preferences';
import { saveSession } from '../../../preferences/testing';
import { FriendlyStore } from '../../../state/friendly.store';
import { Toast } from '../../../ui';
import { StoryImagePanel } from './story-image-panel';

const T = DICTIONARIES.es.tool;
const list = (count: number) =>
  Array.from({ length: count }, (_, i) => `Player ${i + 1}`).join('\n');

interface Options {
  signedIn?: boolean;
  preferences?: Preferences;
  canShare?: boolean;
  create?: () => Promise<Blob>;
}

function setup(options: Options = {}) {
  if (options.signedIn) saveSession(options.preferences);
  const blob = new Blob(['png'], { type: 'image/png' });
  const create = vi.fn(options.create ?? (() => Promise.resolve(blob)));
  const delivery = {
    canShare: vi.fn(() => options.canShare ?? false),
    share: vi.fn(() => Promise.resolve('shared' as const)),
    download: vi.fn(),
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: STORY_BLOB, useValue: create },
      { provide: STORY_DELIVERY, useValue: delivery },
    ],
  });
  TestBed.inject(I18n).setLang('es');
  const store = TestBed.inject(FriendlyStore);
  store.setRawText(list(12));
  store.continueToPreview();
  store.draw(() => 0.3);
  const fixture = TestBed.createComponent(StoryImagePanel);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const button = (label: string) =>
    Array.from(el.querySelectorAll('ui-button button')).find((b) =>
      b.textContent?.trim().startsWith(label),
    ) as HTMLButtonElement | undefined;
  const image = () => el.querySelector('img');
  const notice = () =>
    el.querySelector('app-lock-notice [role="status"]')?.textContent?.replace(/\s+/g, ' ').trim() ??
    '';
  const press = (label: string) => {
    button(label)?.click();
    fixture.detectChanges();
  };
  return {
    fixture,
    el,
    store,
    create,
    delivery,
    blob,
    button,
    image,
    notice,
    press,
    toast: TestBed.inject(Toast),
  };
}

describe('StoryImagePanel', () => {
  let counter = 0;
  beforeEach(() => {
    counter = 0;
    localStorage.clear();
    URL.createObjectURL = vi.fn(() => `blob:story-${++counter}`);
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    document.documentElement.lang = 'en';
    Reflect.deleteProperty(URL, 'createObjectURL');
    Reflect.deleteProperty(URL, 'revokeObjectURL');
  });

  const FILE_NAME = /^kora-roster-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.png$/;
  const iconOf = (button: HTMLButtonElement | undefined, name: string) =>
    button?.querySelector(`ui-icon[data-icon="${name}"]`) ?? null;

  describe('the buttons', () => {
    it('are one to download the image and one to share it, and nothing to preview it', () => {
      const { button, image, el } = setup({ signedIn: true, canShare: true });
      expect(button(T.result.downloadImage)).toBeDefined();
      expect(button(T.result.shareImage)).toBeDefined();
      expect(image()).toBeNull();
      expect(el.querySelector('ui-card')).toBeNull();
    });

    it('do not show the old button that opened a preview', () => {
      const { el } = setup({ signedIn: true, canShare: true });
      const labels = Array.from(el.querySelectorAll('ui-button button')).map((b) =>
        b.textContent?.trim(),
      );
      expect(labels).toEqual([T.result.downloadImage, T.result.shareImage]);
    });

    it('hide the one to share when the browser cannot share files', () => {
      const { button } = setup({ signedIn: true, canShare: false });
      expect(button(T.result.downloadImage)).toBeDefined();
      expect(button(T.result.shareImage)).toBeUndefined();
    });

    it('ask the browser about sharing with a stand-in image, as the real one is not made yet', () => {
      const { delivery } = setup({ signedIn: true, canShare: true });
      expect(delivery.canShare).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringMatching(/\.png$/),
      );
    });

    it('are described by the hint, which is only for assistive technology', () => {
      const { el, button } = setup({ signedIn: true, canShare: true });
      for (const label of [T.result.downloadImage, T.result.shareImage]) {
        const hintId = button(label)?.getAttribute('aria-describedby') as string;
        const hint = el.querySelector(`#${hintId}`) as HTMLElement;
        expect(hint.textContent?.trim()).toBe(T.result.imageHint);
        expect(hint.classList.contains('sr-only')).toBe(true);
      }
    });
  });

  describe('without an account', () => {
    it('show a lock instead of their icon', () => {
      const { button } = setup({ canShare: true });
      const download = button(T.result.downloadImage);
      const share = button(T.result.shareImage);
      expect(iconOf(download, 'lock')).not.toBeNull();
      expect(iconOf(download, 'download')).toBeNull();
      expect(iconOf(share, 'lock')).not.toBeNull();
      expect(iconOf(share, 'share')).toBeNull();
    });

    it.each([[T.result.downloadImage], [T.result.shareImage]])(
      'explain it and offer to sign in when %s is pressed, instead of making anything',
      (label) => {
        const { press, notice, create, delivery, el } = setup({ canShare: true });
        press(label);
        expect(notice()).toContain(T.result.imageSignIn);
        expect(el.querySelector('app-lock-notice a')?.getAttribute('href')).toBe('/es/account');
        expect(create).not.toHaveBeenCalled();
        expect(delivery.download).not.toHaveBeenCalled();
        expect(delivery.share).not.toHaveBeenCalled();
      },
    );
  });

  describe('with an account', () => {
    it('show their own icon and no lock', () => {
      const { button } = setup({ signedIn: true, canShare: true });
      const download = button(T.result.downloadImage);
      const share = button(T.result.shareImage);
      expect(iconOf(download, 'download')).not.toBeNull();
      expect(iconOf(download, 'lock')).toBeNull();
      expect(iconOf(share, 'share')).not.toBeNull();
      expect(iconOf(share, 'lock')).toBeNull();
    });

    it('make nothing until one of them is pressed', () => {
      const { create, notice } = setup({ signedIn: true, canShare: true });
      expect(create).not.toHaveBeenCalled();
      expect(notice()).toBe('');
    });

    describe('downloading', () => {
      it('makes the image from what the store says about the teams and downloads it', async () => {
        const { press, create, delivery, store } = setup({ signedIn: true });
        press(T.result.downloadImage);
        await vi.waitFor(() => expect(delivery.download).toHaveBeenCalledTimes(1));
        expect(create).toHaveBeenCalledWith(store.storyInput());
        expect(delivery.download).toHaveBeenCalledWith(
          'blob:story-1',
          expect.stringMatching(FILE_NAME),
        );
        expect(delivery.share).not.toHaveBeenCalled();
      });

      it('names the file with the moment of the click, even if making the image takes a while', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 10, 24, 9, 15, 42));
        let release!: (blob: Blob) => void;
        const pending = new Promise<Blob>((resolve) => (release = resolve));
        const { press, delivery, blob } = setup({ signedIn: true, create: () => pending });
        press(T.result.downloadImage);
        vi.setSystemTime(new Date(2026, 10, 24, 9, 15, 50));
        release(blob);
        await vi.waitFor(() => expect(delivery.download).toHaveBeenCalled());
        expect(delivery.download).toHaveBeenCalledWith(
          'blob:story-1',
          'kora-roster-2026-11-24-09-15-42.png',
        );
      });

      it('gives each download the name of its own click', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        const { press, delivery } = setup({ signedIn: true });
        vi.setSystemTime(new Date(2026, 10, 24, 9, 1, 5));
        press(T.result.downloadImage);
        await vi.waitFor(() => expect(delivery.download).toHaveBeenCalledTimes(1));
        vi.setSystemTime(new Date(2026, 10, 24, 9, 1, 9));
        press(T.result.downloadImage);
        await vi.waitFor(() => expect(delivery.download).toHaveBeenCalledTimes(2));
        expect(vi.mocked(delivery.download).mock.calls.map((call) => call[1])).toEqual([
          'kora-roster-2026-11-24-09-01-05.png',
          'kora-roster-2026-11-24-09-01-09.png',
        ]);
      });

      it('frees the image a little after handing it over, so the download can start first', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout'] });
        const { press, delivery } = setup({ signedIn: true });
        press(T.result.downloadImage);
        await vi.waitFor(() => expect(delivery.download).toHaveBeenCalled());
        expect(URL.revokeObjectURL).not.toHaveBeenCalled();
        vi.advanceTimersByTime(60_000);
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:story-1');
      });
    });

    describe('sharing', () => {
      it('makes the image and shares it with its file name, without downloading it', async () => {
        const { press, create, delivery, blob, store } = setup({ signedIn: true, canShare: true });
        press(T.result.shareImage);
        await vi.waitFor(() => expect(delivery.share).toHaveBeenCalledTimes(1));
        expect(create).toHaveBeenCalledWith(store.storyInput());
        expect(delivery.share).toHaveBeenCalledWith(blob, expect.stringMatching(FILE_NAME));
        expect(delivery.download).not.toHaveBeenCalled();
      });

      it('names the file with the moment of the click', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 10, 24, 18, 30, 7));
        const { press, delivery, blob } = setup({ signedIn: true, canShare: true });
        press(T.result.shareImage);
        await vi.waitFor(() => expect(delivery.share).toHaveBeenCalled());
        expect(delivery.share).toHaveBeenCalledWith(blob, 'kora-roster-2026-11-24-18-30-07.png');
      });

      it('says nothing when the person closes the sharing panel', async () => {
        const { press, toast, delivery } = setup({ signedIn: true, canShare: true });
        press(T.result.shareImage);
        await vi.waitFor(() => expect(delivery.share).toHaveBeenCalled());
        await Promise.resolve();
        expect(toast.message()).toBeNull();
      });

      it('suggests downloading it when it could not be shared', async () => {
        const { press, toast, delivery } = setup({ signedIn: true, canShare: true });
        delivery.share.mockRejectedValueOnce(new Error('not allowed') as never);
        press(T.result.shareImage);
        await vi.waitFor(() => expect(toast.message()).toBe(T.result.shareFailed));
      });
    });

    describe('while the image is being made', () => {
      it('cannot be asked again, and is ready afterwards', async () => {
        let release!: (blob: Blob) => void;
        const pending = new Promise<Blob>((resolve) => (release = resolve));
        const { button, create, fixture, blob, delivery } = setup({
          signedIn: true,
          canShare: true,
          create: () => pending,
        });
        const download = button(T.result.downloadImage) as HTMLButtonElement;
        const share = button(T.result.shareImage) as HTMLButtonElement;
        // Taps that arrive before the screen has had time to show the buttons as disabled.
        download.click();
        download.click();
        share.click();
        fixture.detectChanges();
        expect(create).toHaveBeenCalledTimes(1);
        expect(download.disabled).toBe(true);
        expect(share.disabled).toBe(true);
        release(blob);
        await vi.waitFor(() => {
          fixture.detectChanges();
          expect(download.disabled).toBe(false);
        });
        expect(share.disabled).toBe(false);
        expect(delivery.download).toHaveBeenCalledTimes(1);
        expect(delivery.share).not.toHaveBeenCalled();
      });

      it('says so, hands nothing over and lets the person try again when it could not be made', async () => {
        const { press, button, toast, delivery, fixture } = setup({
          signedIn: true,
          canShare: true,
          create: () => Promise.reject(new Error('no canvas')),
        });
        press(T.result.downloadImage);
        await vi.waitFor(() => expect(toast.message()).toBe(T.result.imageFailed));
        fixture.detectChanges();
        expect(delivery.download).not.toHaveBeenCalled();
        expect(URL.createObjectURL).not.toHaveBeenCalled();
        expect((button(T.result.downloadImage) as HTMLButtonElement).disabled).toBe(false);
        expect((button(T.result.shareImage) as HTMLButtonElement).disabled).toBe(false);
      });
    });
  });

  describe('the bar of actions', () => {
    @Component({
      imports: [StoryImagePanel],
      template: `
        <app-story-image-panel>
          <button panel-start id="first">Copiar</button>
          <button panel-end id="last">Empezar</button>
        </app-story-image-panel>
      `,
    })
    class Host {}

    it('puts what it is given at the start and at the end, around the buttons of the image', () => {
      saveSession();
      TestBed.inject(I18n).setLang('es');
      const store = TestBed.inject(FriendlyStore);
      store.setRawText(list(12));
      store.continueToPreview();
      store.draw(() => 0.3);
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const first = el.querySelector('#first') as HTMLElement;
      const download = Array.from(el.querySelectorAll('ui-button button')).find((b) =>
        b.textContent?.includes(T.result.downloadImage),
      ) as HTMLElement;
      const last = el.querySelector('#last') as HTMLElement;
      expect(first.compareDocumentPosition(download)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(download.compareDocumentPosition(last)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });
  });
});
