import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DICTIONARIES } from '../../i18n/dictionaries';
import { I18n } from '../../i18n/i18n';
import { STORY_DELIVERY } from '../../image/story-delivery';
import { STORY_BLOB } from '../../image/story-image';
import { Preferences } from '../../preferences/preferences';
import { saveSession } from '../../preferences/testing';
import { AmistosoStore, Player } from '../../state/amistoso.store';
import { ToastService } from '../../ui';
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
  const store = TestBed.inject(AmistosoStore);
  store.setRawText(list(12));
  store.continueToPreview();
  store.draw(() => 0.3);
  const fixture = TestBed.createComponent(StoryImagePanel);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const button = (label: string) =>
    Array.from(el.querySelectorAll('ui-button button')).find(
      (b) => b.textContent?.trim() === label,
    ) as HTMLButtonElement | undefined;
  const image = () => el.querySelector('img');
  const notice = () =>
    el.querySelector('app-lock-notice [role="status"]')?.textContent?.replace(/\s+/g, ' ').trim() ??
    '';
  const press = (label: string) => {
    button(label)?.click();
    fixture.detectChanges();
  };
  const created = async () => {
    press(T.result.createImage);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(image()).not.toBeNull();
    });
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
    created,
    toast: TestBed.inject(ToastService),
  };
}

const swapTwo = (store: InstanceType<typeof AmistosoStore>) => {
  const [x, y] = store.teams() as Player[][];
  store.swapPlayers(x[0].id, y[0].id);
};

describe('StoryImagePanel', () => {
  let counter = 0;
  beforeEach(() => {
    counter = 0;
    localStorage.clear();
    URL.createObjectURL = vi.fn(() => `blob:story-${++counter}`);
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'en';
    Reflect.deleteProperty(URL, 'createObjectURL');
    Reflect.deleteProperty(URL, 'revokeObjectURL');
  });

  describe('without an account', () => {
    it('shows the button with a lock', () => {
      const { button } = setup();
      const create = button(T.result.createImage) as HTMLButtonElement;
      expect(create.querySelector('i.fa-lock')).not.toBeNull();
      expect(create.querySelector('i.fa-image')).toBeNull();
    });

    it('explains it and offers to sign in, instead of creating anything', () => {
      const { press, notice, create, image, el } = setup();
      press(T.result.createImage);
      expect(notice()).toContain(T.result.imageSignIn);
      expect(el.querySelector('app-lock-notice a')?.getAttribute('href')).toBe('/es/cuenta');
      expect(create).not.toHaveBeenCalled();
      expect(image()).toBeNull();
    });
  });

  describe('with an account', () => {
    it('shows the button with an image icon and no lock', () => {
      const { button } = setup({ signedIn: true });
      const create = button(T.result.createImage) as HTMLButtonElement;
      expect(create.querySelector('i.fa-image')).not.toBeNull();
      expect(create.querySelector('i.fa-lock')).toBeNull();
    });

    it('shows nothing else until the image is created', () => {
      const { image, button, notice } = setup({ signedIn: true });
      expect(image()).toBeNull();
      expect(button(T.result.download)).toBeUndefined();
      expect(notice()).toBe('');
    });

    it('creates the image from what the store says about the teams', async () => {
      const { created, create, store } = setup({ signedIn: true });
      await created();
      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith(store.storyInput());
    });

    it('shows the image, with a description, and the buttons to download it and close it', async () => {
      const { created, image, button } = setup({ signedIn: true });
      await created();
      expect(image()?.getAttribute('src')).toBe('blob:story-1');
      expect(image()?.getAttribute('alt')).toBe(T.result.imageAlt);
      expect(button(T.result.download)).toBeDefined();
      expect(button(T.result.closeImage)).toBeDefined();
    });

    it('does not offer to share when the browser cannot share files', async () => {
      const { created, button } = setup({ signedIn: true, canShare: false });
      await created();
      expect(button(T.result.share)).toBeUndefined();
    });

    it('offers to share when the browser can share that file', async () => {
      const { created, button, delivery, blob } = setup({ signedIn: true, canShare: true });
      await created();
      expect(button(T.result.share)).toBeDefined();
      expect(delivery.canShare).toHaveBeenCalledWith(
        blob,
        expect.stringMatching(/^kora-roster-\d{4}-\d{2}-\d{2}\.png$/),
      );
    });

    it('cannot be asked again while the image is being made, and is ready afterwards', async () => {
      let release!: (blob: Blob) => void;
      const pending = new Promise<Blob>((resolve) => (release = resolve));
      const { button, create, fixture, blob } = setup({ signedIn: true, create: () => pending });
      const make = button(T.result.createImage) as HTMLButtonElement;
      // Two taps that arrive before the screen has had time to show the button as disabled.
      make.click();
      make.click();
      fixture.detectChanges();
      expect(create).toHaveBeenCalledTimes(1);
      expect(make.disabled).toBe(true);
      release(blob);
      await vi.waitFor(() => {
        fixture.detectChanges();
        expect(make.disabled).toBe(false);
      });
    });

    it('says so, and lets the person try again, when the image could not be made', async () => {
      const { press, button, toast, image, fixture } = setup({
        signedIn: true,
        create: () => Promise.reject(new Error('no canvas')),
      });
      press(T.result.createImage);
      await vi.waitFor(() => expect(toast.message()).toBe(T.result.imageFailed));
      fixture.detectChanges();
      expect(image()).toBeNull();
      expect((button(T.result.createImage) as HTMLButtonElement).disabled).toBe(false);
    });

    it('replaces the image when it is created again, freeing the old one', async () => {
      const { created, image, press, fixture } = setup({ signedIn: true });
      await created();
      press(T.result.createImage);
      await vi.waitFor(() => {
        fixture.detectChanges();
        expect(image()?.getAttribute('src')).toBe('blob:story-2');
      });
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:story-1');
    });

    describe('downloading', () => {
      it('hands the image and its file name to the browser', async () => {
        const { created, press, delivery } = setup({ signedIn: true });
        await created();
        press(T.result.download);
        expect(delivery.download).toHaveBeenCalledWith(
          'blob:story-1',
          expect.stringMatching(/^kora-roster-\d{4}-\d{2}-\d{2}\.png$/),
        );
      });
    });

    describe('sharing', () => {
      it('shares the image with its file name', async () => {
        const { created, press, delivery, blob } = setup({ signedIn: true, canShare: true });
        await created();
        press(T.result.share);
        expect(delivery.share).toHaveBeenCalledWith(
          blob,
          expect.stringMatching(/^kora-roster-\d{4}-\d{2}-\d{2}\.png$/),
        );
      });

      it('says nothing when the person closes the sharing panel', async () => {
        const { created, press, toast } = setup({ signedIn: true, canShare: true });
        await created();
        press(T.result.share);
        await Promise.resolve();
        expect(toast.message()).toBeNull();
      });

      it('suggests downloading it when it could not be shared', async () => {
        const { created, press, toast, delivery } = setup({ signedIn: true, canShare: true });
        delivery.share.mockRejectedValueOnce(new Error('not allowed') as never);
        await created();
        press(T.result.share);
        await vi.waitFor(() => expect(toast.message()).toBe(T.result.shareFailed));
      });
    });

    describe('closing and forgetting', () => {
      it('hides the image and frees it when it is closed', async () => {
        const { created, press, image } = setup({ signedIn: true });
        await created();
        press(T.result.closeImage);
        expect(image()).toBeNull();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:story-1');
      });

      it('frees the image when the panel goes away', async () => {
        const { created, fixture } = setup({ signedIn: true });
        await created();
        fixture.destroy();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:story-1');
      });

      it('drops an image that no longer matches the teams, because two players were swapped', async () => {
        const { created, store, fixture, image } = setup({ signedIn: true });
        await created();
        swapTwo(store);
        fixture.detectChanges();
        expect(image()).toBeNull();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:story-1');
      });

      it('drops it too when the teams are drawn again', async () => {
        const { created, store, fixture, image } = setup({ signedIn: true });
        await created();
        store.draw(() => 0.9);
        fixture.detectChanges();
        expect(image()).toBeNull();
      });

      it('throws away an image that finished after the teams had already changed', async () => {
        let release!: (blob: Blob) => void;
        const pending = new Promise<Blob>((resolve) => (release = resolve));
        const { press, store, fixture, image, blob } = setup({
          signedIn: true,
          create: () => pending,
        });
        press(T.result.createImage);
        store.draw(() => 0.9);
        release(blob);
        await vi.waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
        fixture.detectChanges();
        expect(image()).toBeNull();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:story-1');
      });
    });
  });

  describe('the buttons that come with it', () => {
    @Component({
      imports: [StoryImagePanel],
      template: `<app-story-image-panel
        ><button id="before">Before</button></app-story-image-panel
      >`,
    })
    class Host {}

    it('puts what it is given in the same row, before its own button', () => {
      setup();
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const before = el.querySelector('#before') as HTMLElement;
      const create = Array.from(el.querySelectorAll('ui-button button')).find(
        (b) => b.textContent?.trim() === T.result.createImage,
      ) as HTMLElement;
      expect(before.parentElement).toBe(create.closest('ui-button')?.parentElement);
      expect(before.compareDocumentPosition(create)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });
  });
});
