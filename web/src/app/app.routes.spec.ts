import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { makeCredential, provideFakeGoogle } from './auth/testing';
import { DICTIONARIES } from './i18n/dictionaries';
import { I18n } from './i18n/i18n';
import { saveSession, TEST_PREFERENCES } from './preferences/testing';
import { AmistosoStore } from './state/amistoso.store';

async function open(url: string, providers: Provider[] = []) {
  TestBed.configureTestingModule({ providers: [provideRouter(routes), ...providers] });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(url);
  const root = harness.fixture.nativeElement as HTMLElement;
  return { harness, root, router: TestBed.inject(Router), i18n: TestBed.inject(I18n) };
}

const heading = (root: HTMLElement) => root.querySelector('h1')?.textContent;

describe('app routes', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'languages');
    document.documentElement.lang = 'en';
    document.title = '';
  });

  it.each(['en', 'es', 'pt'] as const)('shows the landing in its language at /%s', async (lang) => {
    const { root, i18n } = await open(`/${lang}`);
    expect(i18n.lang()).toBe(lang);
    expect(heading(root)).toContain(DICTIONARIES[lang].landing.hero.title);
    expect(document.documentElement.lang).toBe(lang);
  });

  it.each(['en', 'es', 'pt'] as const)(
    'shows the tool in its language at /%s/amistoso',
    async (lang) => {
      const { root, i18n } = await open(`/${lang}/amistoso`);
      expect(i18n.lang()).toBe(lang);
      expect(heading(root)).toContain(DICTIONARIES[lang].tool.heading);
    },
  );

  it('wraps both pages in the shared header with the language selector', async () => {
    const { root } = await open('/es/amistoso');
    expect(root.querySelector('header app-language-selector')).not.toBeNull();
    expect(root.querySelector('footer')).not.toBeNull();
  });

  it('no longer has a /design-system page: it goes through the language choice', async () => {
    Object.defineProperty(navigator, 'languages', { value: ['es'], configurable: true });
    const { harness, router } = await open('/design-system');
    await harness.fixture.whenStable();
    expect(router.url).toBe('/es');
  });

  it('sends "/" to the first supported browser language', async () => {
    Object.defineProperty(navigator, 'languages', { value: ['fr', 'es-AR'], configurable: true });
    const { harness, router } = await open('/');
    await harness.fixture.whenStable();
    expect(router.url).toBe('/es');
  });

  it('sends "/" to English when the browser language is not supported', async () => {
    Object.defineProperty(navigator, 'languages', { value: ['fr'], configurable: true });
    const { harness, router } = await open('/');
    await harness.fixture.whenStable();
    expect(router.url).toBe('/en');
  });

  it('sends an unknown address through the same language choice', async () => {
    Object.defineProperty(navigator, 'languages', { value: ['pt-BR'], configurable: true });
    const { harness, router } = await open('/no-such-page');
    await harness.fixture.whenStable();
    expect(router.url).toBe('/pt');
  });

  it('changes language from the header and lands on the same page in the new language', async () => {
    const { harness, root, router } = await open('/es/amistoso');
    const portuguese = Array.from(root.querySelectorAll('[role="radio"]')).find(
      (r) => r.textContent?.trim() === 'PT',
    ) as HTMLButtonElement;
    portuguese.click();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/pt/amistoso');
    expect(heading(root)).toContain(DICTIONARIES.pt.tool.heading);
  });

  it('keeps the pasted list when the language changes', async () => {
    const { harness, root, router } = await open('/es/amistoso');
    const store = TestBed.inject(AmistosoStore);
    const field = root.querySelector('textarea') as HTMLTextAreaElement;
    field.value = Array.from({ length: 12 }, (_, i) => `Player ${i + 1}`).join('\n');
    field.dispatchEvent(new Event('input'));
    harness.fixture.detectChanges();
    (root.querySelector('ui-button button') as HTMLButtonElement).click();
    harness.fixture.detectChanges();
    expect(root.textContent).toContain(DICTIONARIES.es.tool.preview.count(12));

    const portuguese = Array.from(root.querySelectorAll('[role="radio"]')).find(
      (r) => r.textContent?.trim() === 'PT',
    ) as HTMLButtonElement;
    portuguese.click();
    await harness.fixture.whenStable();

    expect(router.url).toBe('/pt/amistoso');
    expect(store.players()).toHaveLength(12);
    expect(root.textContent).toContain(DICTIONARIES.pt.tool.preview.count(12));
  });

  it.each(['en', 'es', 'pt'] as const)(
    'leads from the landing to the tool in the same language: /%s',
    async (lang) => {
      const { harness, root, router } = await open(`/${lang}`);
      (root.querySelector(`main a[href="/${lang}/amistoso"]`) as HTMLAnchorElement).click();
      await harness.fixture.whenStable();
      expect(router.url).toBe(`/${lang}/amistoso`);
      expect(heading(root)).toContain(DICTIONARIES[lang].tool.heading);
    },
  );

  it('brings the person back to the list they left when they return from the landing', async () => {
    const { harness, root, router } = await open('/es/amistoso');
    const field = root.querySelector('textarea') as HTMLTextAreaElement;
    field.value = Array.from({ length: 12 }, (_, i) => `Player ${i + 1}`).join('\n');
    field.dispatchEvent(new Event('input'));
    harness.fixture.detectChanges();
    (root.querySelector('ui-button button') as HTMLButtonElement).click();
    harness.fixture.detectChanges();
    expect(root.textContent).toContain(DICTIONARIES.es.tool.preview.count(12));

    (root.querySelector('header a') as HTMLAnchorElement).click();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/es');
    expect(heading(root)).toContain(DICTIONARIES.es.landing.hero.title);

    (root.querySelector('main a[href="/es/amistoso"]') as HTMLAnchorElement).click();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/es/amistoso');
    expect(root.textContent).toContain(DICTIONARIES.es.tool.preview.count(12));
  });

  describe('the account', () => {
    const pickAccount = async (
      fake: { pick(credential: string): void },
      harness: { fixture: { whenStable(): Promise<unknown>; detectChanges(): void } },
    ) => {
      harness.fixture.detectChanges();
      await harness.fixture.whenStable();
      fake.pick(makeCredential());
      harness.fixture.detectChanges();
      await harness.fixture.whenStable();
      harness.fixture.detectChanges();
    };

    afterEach(() => localStorage.clear());

    it.each(['en', 'es', 'pt'] as const)(
      'shows the account page in its language at /%s/cuenta',
      async (lang) => {
        const { root, i18n } = await open(`/${lang}/cuenta`);
        expect(i18n.lang()).toBe(lang);
        expect(heading(root)).toContain(DICTIONARIES[lang].account.title);
      },
    );

    it('has no sign in link in the header while sign in is off', async () => {
      const { root } = await open('/es');
      expect(root.querySelector('header a[href$="/cuenta"]')).toBeNull();
    });

    it('goes from the header link to the account page, signs in, and the header shows the photo', async () => {
      const google = provideFakeGoogle();
      const { harness, root, router } = await open('/es', google.providers);
      (root.querySelector('header a[href="/es/cuenta"]') as HTMLAnchorElement).click();
      await harness.fixture.whenStable();
      expect(router.url).toBe('/es/cuenta');

      await pickAccount(google.fake, harness);
      expect(root.querySelector('main')?.textContent).toContain('diego@example.com');
      expect(root.querySelector('header app-user-avatar img')).not.toBeNull();
    });

    it('is still signed in after the page is reloaded', async () => {
      const first = provideFakeGoogle();
      const opened = await open('/es/cuenta', first.providers);
      await pickAccount(first.fake, opened.harness);

      TestBed.resetTestingModule();
      const second = provideFakeGoogle();
      const { root } = await open('/es/cuenta', second.providers);
      expect(root.querySelector('main')?.textContent).toContain('diego@example.com');
      expect(second.fake.hosts).toHaveLength(0);
    });

    it('stays signed in when the language changes', async () => {
      const google = provideFakeGoogle();
      const { harness, root, router } = await open('/es/cuenta', google.providers);
      await pickAccount(google.fake, harness);

      const portuguese = Array.from(root.querySelectorAll('[role="radio"]')).find(
        (r) => r.textContent?.trim() === 'PT',
      ) as HTMLButtonElement;
      portuguese.click();
      await harness.fixture.whenStable();
      harness.fixture.detectChanges();

      expect(router.url).toBe('/pt/cuenta');
      expect(heading(root)).toContain(DICTIONARIES.pt.account.title);
      expect(root.querySelector('main')?.textContent).toContain('diego@example.com');
    });

    it('signs out and the header offers to sign in again', async () => {
      const google = provideFakeGoogle();
      const { harness, root } = await open('/es/cuenta', google.providers);
      await pickAccount(google.fake, harness);

      const signOut = Array.from(root.querySelectorAll('main ui-button button')).find(
        (b) => b.textContent?.trim() === DICTIONARIES.es.account.signOut,
      ) as HTMLButtonElement;
      signOut.click();
      await harness.fixture.whenStable();
      harness.fixture.detectChanges();

      expect(root.querySelector('header app-user-avatar')).toBeNull();
      expect(root.querySelector('header a[href="/es/cuenta"]')?.textContent?.trim()).toBe(
        DICTIONARIES.es.account.signInLink,
      );
    });
  });

  describe('the preferences', () => {
    afterEach(() => localStorage.clear());

    it('are saved on the account page and are still there after a reload', async () => {
      const first = provideFakeGoogle();
      const opened = await open('/es/cuenta', first.providers);
      opened.harness.fixture.detectChanges();
      await opened.harness.fixture.whenStable();
      first.fake.pick(makeCredential());
      opened.harness.fixture.detectChanges();
      await opened.harness.fixture.whenStable();
      opened.harness.fixture.detectChanges();

      const header = Array.from(opened.root.querySelectorAll('label')).find(
        (l) => l.textContent?.trim() === DICTIONARIES.es.preferences.template.header,
      ) as HTMLLabelElement;
      const input = header.control as HTMLInputElement;
      input.value = 'Mi encabezado';
      input.dispatchEvent(new Event('input'));
      opened.harness.fixture.detectChanges();
      (
        Array.from(opened.root.querySelectorAll('ui-button button')).find(
          (b) => b.textContent?.trim() === DICTIONARIES.es.preferences.save,
        ) as HTMLButtonElement
      ).click();
      opened.harness.fixture.detectChanges();

      TestBed.resetTestingModule();
      const second = provideFakeGoogle();
      const { root } = await open('/es/cuenta', second.providers);
      const again = Array.from(root.querySelectorAll('label')).find(
        (l) => l.textContent?.trim() === DICTIONARIES.es.preferences.template.header,
      ) as HTMLLabelElement;
      expect((again.control as HTMLInputElement).value).toBe('Mi encabezado');
    });
  });

  describe('the tool with the preferences of the person', () => {
    afterEach(() => localStorage.clear());

    it('warns about the team size, and then draws with their icons and message', async () => {
      saveSession(TEST_PREFERENCES);
      const { harness, root } = await open('/es/amistoso');
      const T = DICTIONARIES.es.tool;

      const field = root.querySelector('textarea') as HTMLTextAreaElement;
      field.value = Array.from({ length: 12 }, (_, i) => `Player ${i + 1}`).join('\n');
      field.dispatchEvent(new Event('input'));
      harness.fixture.detectChanges();
      (root.querySelector('ui-button button') as HTMLButtonElement).click();
      harness.fixture.detectChanges();
      expect(root.textContent).toContain(T.preview.sizeNotice(7, 2, 12));

      const draw = Array.from(root.querySelectorAll('ui-button button')).find(
        (b) => b.textContent?.trim() === T.preview.draw,
      ) as HTMLButtonElement;
      draw.click();
      harness.fixture.detectChanges();
      const message = root.querySelector('pre')?.textContent as string;
      expect(message.startsWith('⚽ Amistoso\n\n🟢 Equipo 1')).toBe(true);
      expect(message).toContain('🟡 Equipo 2');
    });

    it('is the plain tool for somebody who is not signed in', async () => {
      const { harness, root } = await open('/es/amistoso');
      const T = DICTIONARIES.es.tool;
      const field = root.querySelector('textarea') as HTMLTextAreaElement;
      field.value = Array.from({ length: 12 }, (_, i) => `Player ${i + 1}`).join('\n');
      field.dispatchEvent(new Event('input'));
      harness.fixture.detectChanges();
      (root.querySelector('ui-button button') as HTMLButtonElement).click();
      harness.fixture.detectChanges();
      expect(root.textContent).not.toContain('Sueles jugar');
      (
        Array.from(root.querySelectorAll('ui-button button')).find(
          (b) => b.textContent?.trim() === T.preview.draw,
        ) as HTMLButtonElement
      ).click();
      harness.fixture.detectChanges();
      expect(root.querySelector('pre')?.textContent).toContain('🔴 Equipo 1\n1. ');
    });
  });

  describe('the number of teams in the tool', () => {
    afterEach(() => localStorage.clear());

    const teamRadio = (root: HTMLElement, label: string) =>
      Array.from(
        root.querySelectorAll(`[role="radiogroup"][aria-label="Equipos"] [role="radio"]`),
      ).find((r) => r.textContent?.trim().startsWith(label)) as HTMLButtonElement;

    async function pasted(count: number) {
      const opened = await open('/es/amistoso');
      const field = opened.root.querySelector('textarea') as HTMLTextAreaElement;
      field.value = Array.from({ length: count }, (_, i) => `Player ${i + 1}`).join('\n');
      field.dispatchEvent(new Event('input'));
      opened.harness.fixture.detectChanges();
      (opened.root.querySelector('ui-button button') as HTMLButtonElement).click();
      opened.harness.fixture.detectChanges();
      return opened;
    }

    it('explains a locked option and offers to sign in, without an account', async () => {
      const { harness, root } = await pasted(18);
      teamRadio(root, '3').click();
      harness.fixture.detectChanges();
      expect(root.textContent).toContain(DICTIONARIES.es.tool.preview.teamsSignIn);
      expect(teamRadio(root, '2').getAttribute('aria-checked')).toBe('true');
      expect(root.querySelector('app-lock-notice a[href="/es/cuenta"]')).not.toBeNull();
    });

    it('starts at the number of teams the person prefers, and draws that many', async () => {
      saveSession({ ...TEST_PREFERENCES, teamCount: 4 });
      const { harness, root } = await pasted(20);
      expect(teamRadio(root, '4').getAttribute('aria-checked')).toBe('true');
      (
        Array.from(root.querySelectorAll('ui-button button')).find(
          (b) => b.textContent?.trim() === DICTIONARIES.es.tool.preview.draw,
        ) as HTMLButtonElement
      ).click();
      harness.fixture.detectChanges();
      expect(root.querySelectorAll('ui-card')).toHaveLength(4);
    });

    it('lets somebody swap two players of different teams by tapping them', async () => {
      const { harness, root } = await pasted(12);
      (
        Array.from(root.querySelectorAll('ui-button button')).find(
          (b) => b.textContent?.trim() === DICTIONARIES.es.tool.preview.draw,
        ) as HTMLButtonElement
      ).click();
      harness.fixture.detectChanges();
      const cards = Array.from(root.querySelectorAll('ui-card'));
      const first = cards[0].querySelector('li button') as HTMLButtonElement;
      const second = cards[1].querySelector('li button') as HTMLButtonElement;
      const [nameA, nameB] = [first.textContent, second.textContent];
      first.click();
      harness.fixture.detectChanges();
      second.click();
      harness.fixture.detectChanges();
      const after = Array.from(root.querySelectorAll('ui-card'));
      expect(after[0].querySelector('li button')?.textContent).toBe(nameB);
      expect(after[1].querySelector('li button')?.textContent).toBe(nameA);
      expect(root.querySelector('pre')?.textContent).toContain(
        nameB?.replace(/^\s*1\.\s*/, '').trim(),
      );
    });

    it('lets a signed in person draw 4 teams and shows them all', async () => {
      saveSession();
      const { harness, root } = await pasted(20);
      teamRadio(root, '4').click();
      harness.fixture.detectChanges();
      (
        Array.from(root.querySelectorAll('ui-button button')).find(
          (b) => b.textContent?.trim() === DICTIONARIES.es.tool.preview.draw,
        ) as HTMLButtonElement
      ).click();
      harness.fixture.detectChanges();
      expect(root.querySelectorAll('ui-card')).toHaveLength(4);
      expect(root.querySelector('pre')?.textContent).toContain('Equipo 4');
    });
  });
});
