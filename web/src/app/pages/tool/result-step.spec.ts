import { TestBed } from '@angular/core/testing';
import { drawTeams } from '../../core/draw-teams';
import { DICTIONARIES } from '../../i18n/dictionaries';
import { I18n } from '../../i18n/i18n';
import { Preferences } from '../../preferences/preferences';
import { saveSession, TEST_PREFERENCES } from '../../preferences/testing';
import { AmistosoStore } from '../../state/amistoso.store';
import { ToastService } from '../../ui';
import { ResultStep } from './result-step';

const T = DICTIONARIES.es.tool;
const list = (count: number) =>
  Array.from({ length: count }, (_, i) => `Player ${i + 1}`).join('\n');

function setup(preferences?: Preferences) {
  if (preferences) saveSession(preferences);
  TestBed.inject(I18n).setLang('es');
  const store = TestBed.inject(AmistosoStore);
  store.setRawText('Diego 🧤\nMati 🧤\n' + list(10));
  store.continueToPreview();
  store.draw(() => 0.3);
  const fixture = TestBed.createComponent(ResultStep);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const byText = (text: string) =>
    Array.from(el.querySelectorAll('ui-button button')).find((b) =>
      b.textContent?.includes(text),
    ) as HTMLButtonElement;
  return { fixture, el, store, byText, toast: TestBed.inject(ToastService) };
}

function setClipboard(writeText?: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    value: writeText ? { writeText } : undefined,
    configurable: true,
  });
}

describe('ResultStep', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'clipboard');
    localStorage.clear();
    vi.restoreAllMocks();
    TestBed.inject(ToastService).dismiss();
    document.documentElement.lang = 'en';
  });

  it('shows a card per team with its icon and title in the current language', () => {
    const { el } = setup();
    const titles = Array.from(el.querySelectorAll('ui-card h3')).map((h) => h.textContent?.trim());
    expect(titles).toEqual([`🔴 ${T.teamTitle(1)}`, `🔵 ${T.teamTitle(2)}`]);
  });

  it('lists the players of each team, numbered from 1', () => {
    const { el, store } = setup();
    const cards = Array.from(el.querySelectorAll('ui-card'));
    const [teamA, teamB] = store.teams() ?? [[], []];
    [teamA, teamB].forEach((team, i) => {
      const items = Array.from(cards[i].querySelectorAll('li')).map((li) =>
        li.textContent?.replace(/\s+/g, ' ').trim(),
      );
      expect(items).toHaveLength(team.length);
      expect(items[0]).toMatch(new RegExp(`^1\\.\\s*${team[0].name}`));
      expect(items[team.length - 1]).toMatch(
        new RegExp(`^${team.length}\\.\\s*${team[team.length - 1].name}`),
      );
    });
  });

  it('marks the goalkeepers with the glove and a hidden label', () => {
    const { el } = setup();
    expect(el.querySelectorAll('li i.fa-mitten')).toHaveLength(2);
    const hidden = Array.from(el.querySelectorAll('li .sr-only')).map((s) => s.textContent?.trim());
    expect(hidden).toEqual([T.preview.goalkeeper, T.preview.goalkeeper]);
  });

  it('shows the text for WhatsApp exactly as it will be copied', () => {
    const { el, store } = setup();
    expect(el.querySelector('pre')?.textContent).toBe(store.whatsappText());
    expect(el.querySelector('pre')?.textContent).toContain(`🔴 ${T.teamTitle(1)}`);
  });

  describe('copying', () => {
    it('puts the text in the clipboard and says it was copied', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      setClipboard(writeText);
      const { store, byText, toast } = setup();
      byText(T.result.copy).click();
      await vi.waitFor(() => expect(toast.message()).toBe(T.result.copied));
      expect(writeText).toHaveBeenCalledWith(store.whatsappText());
    });

    it('says it could not copy when the clipboard refuses', async () => {
      setClipboard(vi.fn().mockRejectedValue(new Error('denied')));
      const { byText, toast } = setup();
      byText(T.result.copy).click();
      await vi.waitFor(() => expect(toast.message()).toBe(T.result.copyFailed));
    });

    it('says it could not copy when the browser has no clipboard', async () => {
      setClipboard(undefined);
      const { byText, toast } = setup();
      byText(T.result.copy).click();
      await vi.waitFor(() => expect(toast.message()).toBe(T.result.copyFailed));
    });
  });

  it('draws again with the players it already has', () => {
    const { fixture, store, byText } = setup();
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    byText(T.result.redraw).click();
    fixture.detectChanges();
    const expected = drawTeams(store.players(), () => 0.9);
    expect(expected.ok).toBe(true);
    if (expected.ok) expect(store.teams()).toEqual(expected.teams);
    expect(store.step()).toBe('result');
  });

  describe('going back to the list', () => {
    // "Volver" is also the start of "Volver a sortear", so the whole text has to match.
    const backIn = (el: HTMLElement) =>
      Array.from(el.querySelectorAll('ui-button button')).find(
        (b) => b.textContent?.trim() === T.preview.back,
      ) as HTMLButtonElement;

    it('offers a button to go back, next to the one to start over', () => {
      const { el, byText } = setup();
      const back = backIn(el);
      expect(back).toBeDefined();
      expect(back.querySelector('i.fa-arrow-left')).not.toBeNull();
      expect(back.compareDocumentPosition(byText(T.result.startOver))).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    it('returns to the preview with the same players, and the teams are gone', () => {
      const { fixture, el, store } = setup();
      const players = store.players();
      backIn(el).click();
      fixture.detectChanges();
      expect(store.step()).toBe('preview');
      expect(store.players()).toBe(players);
      expect(store.teams()).toBeNull();
    });

    it('is there for people with an account too, also with the teams half built', () => {
      saveSession();
      TestBed.inject(I18n).setLang('es');
      const store = TestBed.inject(AmistosoStore);
      store.setRawText('Diego 🧤\nMati 🧤\n' + list(10));
      store.continueToPreview();
      store.startManual();
      const fixture = TestBed.createComponent(ResultStep);
      fixture.detectChanges();
      const back = backIn(fixture.nativeElement as HTMLElement);
      expect(back.disabled).toBe(false);
      back.click();
      expect(store.step()).toBe('preview');
      expect(store.pool()).toEqual([]);
    });
  });

  it('starts over from the beginning', () => {
    const { fixture, store, byText } = setup();
    byText(T.result.startOver).click();
    fixture.detectChanges();
    expect(store.step()).toBe('paste');
    expect(store.players()).toEqual([]);
    expect(store.teams()).toBeNull();
  });

  describe('with the preferences of the person', () => {
    it('titles the cards with their icons', () => {
      const { el } = setup(TEST_PREFERENCES);
      const titles = Array.from(el.querySelectorAll('ui-card h3')).map((h) =>
        h.textContent?.trim(),
      );
      expect(titles).toEqual([`🟢 ${T.teamTitle(1)}`, `🟡 ${T.teamTitle(2)}`]);
    });

    it('shows the message with their header, numbering and footer', () => {
      const { el, store } = setup(TEST_PREFERENCES);
      const text = el.querySelector('pre')?.textContent as string;
      expect(text).toBe(store.whatsappText());
      expect(text.startsWith('⚽ Amistoso\n\n🟢')).toBe(true);
      expect(text).toContain('\n1) ');
      expect(text.endsWith('\n\nConfirmen')).toBe(true);
    });

    it('keeps the cards numbered whatever numbering the message uses', () => {
      const { el } = setup({ ...TEST_PREFERENCES, numbering: 'none' });
      const first = el.querySelector('ui-card li')?.textContent?.replace(/\s+/g, ' ').trim();
      expect(first).toMatch(/^1\./);
    });

    it('copies the message as they set it up', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      setClipboard(writeText);
      const { byText, toast } = setup(TEST_PREFERENCES);
      byText(T.result.copy).click();
      await vi.waitFor(() => expect(toast.message()).toBe(T.result.copied));
      expect(writeText.mock.calls[0][0]).toContain('⚽ Amistoso');
      expect(writeText.mock.calls[0][0]).toContain('Confirmen');
    });
  });

  describe('with 3 and 4 teams', () => {
    function setupMany(teams: number, players: number) {
      saveSession();
      TestBed.inject(I18n).setLang('es');
      const store = TestBed.inject(AmistosoStore);
      store.setRawText(list(players));
      store.continueToPreview();
      store.setTeamCount(teams);
      store.draw(() => 0.3);
      const fixture = TestBed.createComponent(ResultStep);
      fixture.detectChanges();
      return { el: fixture.nativeElement as HTMLElement, store };
    }
    const grid = (el: HTMLElement) => el.querySelector('div.grid') as HTMLElement;

    it.each([
      [3, 18],
      [4, 20],
    ])('shows a card per team, with its own icon and title, for %i teams', (teams, players) => {
      const { el } = setupMany(teams, players);
      const titles = Array.from(el.querySelectorAll('ui-card h3')).map((h) =>
        h.textContent?.trim(),
      );
      expect(titles).toEqual(
        ['🔴', '🔵', '🟢', '🟡'].slice(0, teams).map((icon, i) => `${icon} ${T.teamTitle(i + 1)}`),
      );
    });

    it('puts 3 teams in three columns on wide screens, and 2 or 4 in two', () => {
      expect(grid(setupMany(3, 18).el).className).toContain('lg:grid-cols-3');
      TestBed.resetTestingModule();
      expect(grid(setupMany(4, 20).el).className).not.toContain('lg:grid-cols-3');
      TestBed.resetTestingModule();
      expect(grid(setup().el).className).not.toContain('lg:grid-cols-3');
    });

    it('writes every team in the text for WhatsApp', () => {
      const { el } = setupMany(4, 20);
      const text = el.querySelector('pre')?.textContent as string;
      for (let i = 1; i <= 4; i++) expect(text).toContain(T.teamTitle(i));
    });
  });

  describe('swapping players', () => {
    type Ctx = ReturnType<typeof setup>;
    const buttons = (el: HTMLElement) =>
      Array.from(el.querySelectorAll('ui-card li button')) as HTMLButtonElement[];
    const ids = (store: Ctx['store']) => (store.teams() ?? []).flat();
    const buttonOf = (ctx: Ctx, id: string) =>
      buttons(ctx.el)[ids(ctx.store).findIndex((p) => p.id === id)];
    const pressed = (ctx: Ctx) =>
      buttons(ctx.el).filter((b) => b.getAttribute('aria-pressed') === 'true');
    const status = (ctx: Ctx) => ctx.el.querySelector('p[role="status"]')?.textContent?.trim();
    const tap = (ctx: Ctx, id: string) => {
      buttonOf(ctx, id).click();
      ctx.fixture.detectChanges();
    };
    // Two players of the first team, and one of the second.
    const trio = (ctx: Ctx) => {
      const [x, y] = ctx.store.teams() as { id: string; name: string }[][];
      return { a: x[0], c: x[1], b: y[0] };
    };

    it('shows how it works above the cards', () => {
      const { el } = setup();
      const hint = Array.from(el.querySelectorAll('p')).find((p) =>
        p.textContent?.includes(T.result.swapHint),
      ) as HTMLElement;
      const grid = el.querySelector('div.grid') as HTMLElement;
      expect(hint).toBeTruthy();
      expect(hint.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('makes every player a button that is not selected and can be dragged', () => {
      const ctx = setup();
      expect(buttons(ctx.el)).toHaveLength(12);
      expect(buttons(ctx.el).map((b) => b.getAttribute('aria-pressed'))).toEqual(
        Array(12).fill('false'),
      );
      expect(buttons(ctx.el).every((b) => b.getAttribute('draggable') === 'true')).toBe(true);
    });

    it('selects a player with a tap, and says so', () => {
      const ctx = setup();
      const { a } = trio(ctx);
      tap(ctx, a.id);
      expect(pressed(ctx)).toEqual([buttonOf(ctx, a.id)]);
      expect(status(ctx)).toBe(T.result.selected(a.name));
    });

    it('deselects the player when they are tapped again', () => {
      const ctx = setup();
      const { a } = trio(ctx);
      tap(ctx, a.id);
      tap(ctx, a.id);
      expect(pressed(ctx)).toEqual([]);
      expect(status(ctx)).toBe('');
    });

    it('moves the selection when a player of the same team is tapped', () => {
      const ctx = setup();
      const { a, c } = trio(ctx);
      const before = ctx.store.teams();
      tap(ctx, a.id);
      tap(ctx, c.id);
      expect(pressed(ctx)).toEqual([buttonOf(ctx, c.id)]);
      expect(status(ctx)).toBe(T.result.selected(c.name));
      expect(ctx.store.teams()).toBe(before);
    });

    it('swaps two players of different teams, says so and clears the selection', () => {
      const ctx = setup();
      const { a, b } = trio(ctx);
      tap(ctx, a.id);
      tap(ctx, b.id);
      const [x, y] = ctx.store.teams() as { id: string }[][];
      expect(x.some((p) => p.id === b.id)).toBe(true);
      expect(y.some((p) => p.id === a.id)).toBe(true);
      expect(pressed(ctx)).toEqual([]);
      expect(status(ctx)).toBe(T.result.swapped(a.name, b.name));
      const cards = Array.from(ctx.el.querySelectorAll('ui-card'));
      expect(cards[0].textContent).toContain(b.name);
      expect(cards[1].textContent).toContain(a.name);
    });

    it('clears the selection with Escape', () => {
      const ctx = setup();
      const { a } = trio(ctx);
      tap(ctx, a.id);
      buttonOf(ctx, a.id).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
      ctx.fixture.detectChanges();
      expect(pressed(ctx)).toEqual([]);
    });

    it('forgets the selection when the teams are drawn again', () => {
      const ctx = setup();
      const { a } = trio(ctx);
      tap(ctx, a.id);
      expect(status(ctx)).toBe(T.result.selected(a.name));
      ctx.store.draw(() => 0.9);
      ctx.fixture.detectChanges();
      expect(pressed(ctx)).toEqual([]);
      expect(status(ctx)).toBe('');
    });

    it('keeps the text for WhatsApp in step with what is on the cards', () => {
      const ctx = setup();
      const { a, b } = trio(ctx);
      tap(ctx, a.id);
      tap(ctx, b.id);
      const text = ctx.el.querySelector('pre')?.textContent as string;
      expect(text).toBe(ctx.store.whatsappText());
      expect(text.split('\n\n')[0]).toContain(b.name);
    });

    it.each([
      [3, 18],
      [4, 20],
    ])('works with %i teams', (teams, players) => {
      saveSession();
      TestBed.inject(I18n).setLang('es');
      const store = TestBed.inject(AmistosoStore);
      store.setRawText(list(players));
      store.continueToPreview();
      store.setTeamCount(teams);
      store.draw(() => 0.3);
      const fixture = TestBed.createComponent(ResultStep);
      fixture.detectChanges();
      const ctx = { fixture, el: fixture.nativeElement as HTMLElement, store } as Ctx;
      const all = store.teams() as { id: string; name: string }[][];
      const a = all[0][0];
      const b = all[teams - 1][0];
      tap(ctx, a.id);
      tap(ctx, b.id);
      const after = store.teams() as { id: string }[][];
      expect(after[0].some((p) => p.id === b.id)).toBe(true);
      expect(after[teams - 1].some((p) => p.id === a.id)).toBe(true);
    });

    describe('by dragging', () => {
      const fire = (type: string, target: Element) => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(event, 'dataTransfer', {
          value: { setData: vi.fn(), effectAllowed: '' },
        });
        target.dispatchEvent(event);
        return event;
      };

      it('swaps a player dropped on a player of another team', () => {
        const ctx = setup();
        const { a, b } = trio(ctx);
        fire('dragstart', buttonOf(ctx, a.id));
        const over = fire('dragover', buttonOf(ctx, b.id));
        expect(over.defaultPrevented).toBe(true);
        fire('drop', buttonOf(ctx, b.id));
        ctx.fixture.detectChanges();
        const [x, y] = ctx.store.teams() as { id: string }[][];
        expect(x.some((p) => p.id === b.id)).toBe(true);
        expect(y.some((p) => p.id === a.id)).toBe(true);
        expect(status(ctx)).toBe(T.result.swapped(a.name, b.name));
      });

      it('does not accept a drop on a player of the same team', () => {
        const ctx = setup();
        const { a, c } = trio(ctx);
        const before = ctx.store.teams();
        fire('dragstart', buttonOf(ctx, a.id));
        const over = fire('dragover', buttonOf(ctx, c.id));
        expect(over.defaultPrevented).toBe(false);
        const dropped = fire('drop', buttonOf(ctx, c.id));
        expect(dropped.defaultPrevented).toBe(false);
        expect(ctx.store.teams()).toBe(before);
        // Nothing happened, so nothing is announced either.
        expect(status(ctx)).toBe('');
      });

      it('does nothing when something is dropped without a player being dragged', () => {
        const ctx = setup();
        const { b } = trio(ctx);
        const before = ctx.store.teams();
        const over = fire('dragover', buttonOf(ctx, b.id));
        fire('drop', buttonOf(ctx, b.id));
        expect(over.defaultPrevented).toBe(false);
        expect(ctx.store.teams()).toBe(before);
      });

      it('forgets the player that was being dragged once the drag ends', () => {
        const ctx = setup();
        const { a, b } = trio(ctx);
        const before = ctx.store.teams();
        fire('dragstart', buttonOf(ctx, a.id));
        fire('dragend', buttonOf(ctx, a.id));
        fire('drop', buttonOf(ctx, b.id));
        expect(ctx.store.teams()).toBe(before);
      });

      it('marks the player that would be swapped while the drag goes over, and unmarks it', () => {
        const ctx = setup();
        const { a, b } = trio(ctx);
        fire('dragstart', buttonOf(ctx, a.id));
        fire('dragover', buttonOf(ctx, b.id));
        ctx.fixture.detectChanges();
        expect(buttonOf(ctx, b.id).className).toContain('ring-primary');
        fire('dragleave', buttonOf(ctx, b.id));
        ctx.fixture.detectChanges();
        expect(buttonOf(ctx, b.id).className).not.toContain('ring-primary');
      });

      it('clears a selection that was made by tapping when a swap is made by dragging', () => {
        const ctx = setup();
        const { a, c, b } = trio(ctx);
        tap(ctx, c.id);
        fire('dragstart', buttonOf(ctx, a.id));
        fire('drop', buttonOf(ctx, b.id));
        ctx.fixture.detectChanges();
        expect(pressed(ctx)).toEqual([]);
      });
    });
  });

  describe('the story image', () => {
    it('is offered below the buttons for the message', () => {
      const { el } = setup();
      const panel = el.querySelector('app-story-image-panel') as HTMLElement;
      const buttons = Array.from(el.querySelectorAll('ui-button')).find((b) =>
        b.textContent?.includes(T.result.copy),
      ) as HTMLElement;
      expect(panel).not.toBeNull();
      expect(panel.textContent).toContain(T.result.createImage);
      expect(
        buttons.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });
  });

  describe('building the teams by hand', () => {
    // 12 players, two of them goalkeepers, in two teams of six. Without an account there is
    // nothing to build by hand, and with one the players without a team have their own panel.
    function manual(mode: 'manual' | 'drawn' = 'manual') {
      saveSession();
      TestBed.inject(I18n).setLang('es');
      const store = TestBed.inject(AmistosoStore);
      store.setRawText('Diego 🧤\nMati 🧤\n' + list(10));
      store.continueToPreview();
      if (mode === 'manual') store.startManual();
      else store.draw(() => 0.3);
      const fixture = TestBed.createComponent(ResultStep);
      fixture.detectChanges();
      return { fixture, el: fixture.nativeElement as HTMLElement, store };
    }
    type Ctx = ReturnType<typeof manual>;

    const all = (el: ParentNode, selector: string) =>
      Array.from(el.querySelectorAll(selector)) as HTMLElement[];
    const cards = (ctx: Ctx) => all(ctx.el, 'ui-card');
    const slots = (ctx: Ctx, team?: number) =>
      all(team === undefined ? ctx.el : cards(ctx)[team], '[data-free-slot]');
    const poolPanel = (ctx: Ctx) => ctx.el.querySelector('[data-pool]') as HTMLElement | null;
    const poolButtons = (ctx: Ctx) => all(ctx.el, '[data-pool] [data-player]');
    const poolTarget = (ctx: Ctx) =>
      ctx.el.querySelector('[data-pool-target]') as HTMLButtonElement;
    const player = (ctx: Ctx, id: string) =>
      ctx.el.querySelector(`[data-player="${id}"]`) as HTMLButtonElement;
    const status = (ctx: Ctx) => ctx.el.querySelector('p[role="status"]')?.textContent?.trim();
    const progress = (ctx: Ctx) => ctx.el.querySelector('[data-progress]')?.textContent?.trim();
    const counts = (ctx: Ctx) => all(ctx.el, '[data-count]').map((c) => c.textContent?.trim());
    const button = (ctx: Ctx, text: string) =>
      all(ctx.el, 'ui-button button').find((b) => b.textContent?.includes(text));
    const click = (ctx: Ctx, element: HTMLElement | undefined) => {
      (element as HTMLElement).click();
      ctx.fixture.detectChanges();
    };
    const pressed = (ctx: Ctx) =>
      all(ctx.el, '[data-player][aria-pressed="true"]').map((b) => b.getAttribute('data-player'));
    const fire = (type: string, target: Element) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'dataTransfer', {
        value: { setData: vi.fn(), effectAllowed: '' },
      });
      target.dispatchEvent(event);
      return event;
    };
    // Players from the pool who are not goalkeepers, so the order of a team never moves them.
    const waiting = (ctx: Ctx) => ctx.store.pool().filter((p) => !p.isGoalkeeper);
    const place = (ctx: Ctx, id: string, team: number) => {
      ctx.store.movePlayer(id, team);
      ctx.fixture.detectChanges();
    };

    describe('without an account', () => {
      it('leaves the screen as it was: no panel without a team, no counters, no free places', () => {
        const ctx = setup();
        expect(ctx.el.querySelector('[data-pool]')).toBeNull();
        expect(ctx.el.querySelector('[data-count]')).toBeNull();
        expect(ctx.el.querySelector('[data-free-slot]')).toBeNull();
        expect(button(ctx as unknown as Ctx, T.result.clearTeams)).toBeUndefined();
        expect(ctx.el.textContent).toContain(T.result.swapHint);
      });
    });

    describe('with an account, after a draw', () => {
      it('shows the panel without a team, empty and with a hint of what it is for', () => {
        const ctx = manual('drawn');
        expect(poolPanel(ctx)?.textContent).toContain(T.result.poolTitle);
        expect(poolButtons(ctx)).toHaveLength(0);
        expect(poolTarget(ctx).textContent).toContain(T.result.poolHint);
      });

      it('counts the players of each team against its size, with no free places', () => {
        const ctx = manual('drawn');
        expect(counts(ctx)).toEqual(['6/6', '6/6']);
        expect(slots(ctx)).toHaveLength(0);
      });

      it('says the teams are complete, and offers the text, the copy button and the image', () => {
        const ctx = manual('drawn');
        expect(progress(ctx)).toBe(T.result.complete);
        expect(ctx.el.querySelector('pre')?.textContent).toBe(ctx.store.whatsappText());
        expect(button(ctx, T.result.copy)).toBeDefined();
        expect(ctx.el.querySelector('app-story-image-panel')).not.toBeNull();
      });

      it('has the buttons to draw the rest, which waits for somebody, and to remove everyone', () => {
        const ctx = manual('drawn');
        expect((button(ctx, T.result.drawRemaining) as HTMLButtonElement).disabled).toBe(true);
        expect((button(ctx, T.result.clearTeams) as HTMLButtonElement).disabled).toBe(false);
      });

      it('explains how to build the teams by hand instead of how to swap', () => {
        const ctx = manual('drawn');
        expect(ctx.el.textContent).toContain(T.result.manualHint);
        expect(ctx.el.textContent).not.toContain(T.result.swapHint);
      });
    });

    describe('when the teams start empty', () => {
      it('lists everybody without a team, goalkeepers first', () => {
        const ctx = manual();
        expect(poolButtons(ctx)).toHaveLength(12);
        expect(poolButtons(ctx).map((b) => b.querySelector('.fa-mitten') !== null)).toEqual([
          true,
          true,
          ...Array(10).fill(false),
        ]);
      });

      it('shows every team empty, with a free place for each missing player', () => {
        const ctx = manual();
        expect(counts(ctx)).toEqual(['0/6', '0/6']);
        expect(slots(ctx, 0)).toHaveLength(6);
        expect(slots(ctx, 1)).toHaveLength(6);
        expect(slots(ctx, 0)[0].textContent).toContain(T.result.freeSlot);
      });

      it('says how many players are missing, and does not offer the text or the image yet', () => {
        const ctx = manual();
        expect(progress(ctx)).toBe(T.result.missing(12));
        expect(ctx.el.querySelector('pre')).toBeNull();
        expect(ctx.el.querySelector('app-story-image-panel')).toBeNull();
        expect(button(ctx, T.result.copy)).toBeUndefined();
      });

      it('lets draw the rest, and does not let remove everyone because nobody is in a team', () => {
        const ctx = manual();
        expect((button(ctx, T.result.drawRemaining) as HTMLButtonElement).disabled).toBe(false);
        expect((button(ctx, T.result.clearTeams) as HTMLButtonElement).disabled).toBe(true);
      });

      it('names the team in the label of each free place', () => {
        const ctx = manual();
        expect(slots(ctx, 1)[0].getAttribute('aria-label')).toBe(
          `${T.result.freeSlot}, ${T.teamTitle(2)}`,
        );
      });
    });

    describe('moving players by tapping', () => {
      it('moves a player without a team into a free place, and says so', () => {
        const ctx = manual();
        const [a] = waiting(ctx);
        click(ctx, player(ctx, a.id));
        expect(status(ctx)).toBe(T.result.selectedManual(a.name));
        expect(slots(ctx, 0)[0].getAttribute('aria-label')).toBe(
          T.result.moveHere(a.name, T.teamTitle(1)),
        );
        click(ctx, slots(ctx, 0)[0]);
        expect(ctx.store.teams()?.[0]).toEqual([a]);
        expect(counts(ctx)[0]).toBe('1/6');
        expect(slots(ctx, 0)).toHaveLength(5);
        expect(poolButtons(ctx)).toHaveLength(11);
        expect(pressed(ctx)).toEqual([]);
        expect(status(ctx)).toBe(T.result.moved(a.name, T.teamTitle(1)));
      });

      it('takes a player out of a team with the button of the panel, and says so', () => {
        const ctx = manual();
        const [a] = waiting(ctx);
        place(ctx, a.id, 1);
        expect(poolTarget(ctx).disabled).toBe(true);
        click(ctx, player(ctx, a.id));
        expect(poolTarget(ctx).disabled).toBe(false);
        expect(poolTarget(ctx).textContent).toContain(T.result.poolDrop(a.name));
        click(ctx, poolTarget(ctx));
        expect(ctx.store.teams()?.[1]).toEqual([]);
        expect(ctx.store.pool()).toContain(a);
        expect(status(ctx)).toBe(T.result.leftTeam(a.name));
        expect(pressed(ctx)).toEqual([]);
      });

      it('swaps somebody without a team with somebody in a team', () => {
        const ctx = manual();
        const [a, b] = waiting(ctx);
        place(ctx, a.id, 0);
        click(ctx, player(ctx, b.id));
        click(ctx, player(ctx, a.id));
        expect(ctx.store.teams()?.[0]).toEqual([b]);
        expect(ctx.store.pool()).toContain(a);
        expect(status(ctx)).toBe(T.result.swapped(b.name, a.name));
      });

      it('moves the selection between two players who have no team', () => {
        const ctx = manual();
        const [a, b] = waiting(ctx);
        const before = ctx.store.teams();
        click(ctx, player(ctx, a.id));
        click(ctx, player(ctx, b.id));
        expect(pressed(ctx)).toEqual([b.id]);
        expect(ctx.store.teams()).toBe(before);
      });

      it('does nothing when a free place is tapped with nobody selected', () => {
        const ctx = manual();
        const before = ctx.store.teams();
        click(ctx, slots(ctx, 0)[0]);
        expect(ctx.store.teams()).toBe(before);
        expect(status(ctx)).toBe('');
      });

      it('does nothing when a free place of the team the player is already in is tapped', () => {
        const ctx = manual();
        const [a] = waiting(ctx);
        place(ctx, a.id, 0);
        click(ctx, player(ctx, a.id));
        const before = ctx.store.teams();
        click(ctx, slots(ctx, 0)[0]);
        expect(ctx.store.teams()).toBe(before);
        expect(pressed(ctx)).toEqual([a.id]);
      });

      it('clears the selection with Escape on a player without a team', () => {
        const ctx = manual();
        const [a] = waiting(ctx);
        click(ctx, player(ctx, a.id));
        player(ctx, a.id).dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
        );
        ctx.fixture.detectChanges();
        expect(pressed(ctx)).toEqual([]);
      });

      it('forgets the selection when the rest is drawn', () => {
        const ctx = manual();
        const [a] = waiting(ctx);
        click(ctx, player(ctx, a.id));
        ctx.store.drawRemaining(() => 0.5);
        ctx.fixture.detectChanges();
        expect(pressed(ctx)).toEqual([]);
        expect(status(ctx)).toBe('');
      });
    });

    describe('completing the teams', () => {
      it('offers the text, the copy button and the image once nobody is left without a team', () => {
        const ctx = manual();
        ctx.store
          .pool()
          .slice()
          .forEach((p, i) => ctx.store.movePlayer(p.id, i % 2));
        ctx.fixture.detectChanges();
        expect(progress(ctx)).toBe(T.result.complete);
        expect(ctx.el.querySelector('pre')?.textContent).toBe(ctx.store.whatsappText());
        expect(button(ctx, T.result.copy)).toBeDefined();
        expect(ctx.el.querySelector('app-story-image-panel')).not.toBeNull();
        expect(slots(ctx)).toHaveLength(0);
      });

      it('counts down the missing players as they are placed', () => {
        const ctx = manual();
        const [a, b] = waiting(ctx);
        place(ctx, a.id, 0);
        expect(progress(ctx)).toBe(T.result.missing(11));
        place(ctx, b.id, 1);
        expect(progress(ctx)).toBe(T.result.missing(10));
      });

      it('writes the singular when only one player is missing', () => {
        const ctx = manual();
        const everybody = ctx.store.pool().slice();
        everybody.slice(0, 11).forEach((p, i) => ctx.store.movePlayer(p.id, i % 2));
        ctx.fixture.detectChanges();
        expect(progress(ctx)).toBe(T.result.missing(1));
      });
    });

    describe('the buttons', () => {
      it('draws the rest, completes the teams and says so', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
        const ctx = manual();
        const [a] = waiting(ctx);
        place(ctx, a.id, 0);
        click(ctx, button(ctx, T.result.drawRemaining));
        expect(ctx.store.pool()).toEqual([]);
        expect(ctx.store.isComplete()).toBe(true);
        expect(ctx.store.teams()?.[0]).toContain(a);
        expect(status(ctx)).toBe(T.result.remainingDrawn);
        expect(progress(ctx)).toBe(T.result.complete);
      });

      it('removes everyone from their teams, and says so', () => {
        const ctx = manual('drawn');
        click(ctx, button(ctx, T.result.clearTeams));
        expect(ctx.store.teams()).toEqual([[], []]);
        expect(poolButtons(ctx)).toHaveLength(12);
        expect(status(ctx)).toBe(T.result.teamsCleared);
        expect(progress(ctx)).toBe(T.result.missing(12));
      });

      it('draws everything again, also what was built by hand', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.9);
        const ctx = manual();
        click(ctx, button(ctx, T.result.redraw));
        expect(ctx.store.pool()).toEqual([]);
        expect(ctx.store.isComplete()).toBe(true);
      });
    });

    describe('moving players by dragging', () => {
      it('moves a player without a team when it is dropped on a free place', () => {
        const ctx = manual();
        const [a] = waiting(ctx);
        fire('dragstart', player(ctx, a.id));
        const over = fire('dragover', slots(ctx, 1)[0]);
        expect(over.defaultPrevented).toBe(true);
        fire('drop', slots(ctx, 1)[0]);
        ctx.fixture.detectChanges();
        expect(ctx.store.teams()?.[1]).toEqual([a]);
        expect(status(ctx)).toBe(T.result.moved(a.name, T.teamTitle(2)));
      });

      it('takes a player out of a team when it is dropped on the panel without a team', () => {
        const ctx = manual();
        const [a] = waiting(ctx);
        place(ctx, a.id, 0);
        fire('dragstart', player(ctx, a.id));
        const over = fire('dragover', poolPanel(ctx) as HTMLElement);
        expect(over.defaultPrevented).toBe(true);
        fire('drop', poolPanel(ctx) as HTMLElement);
        ctx.fixture.detectChanges();
        expect(ctx.store.teams()?.[0]).toEqual([]);
        expect(ctx.store.pool()).toContain(a);
        expect(status(ctx)).toBe(T.result.leftTeam(a.name));
      });

      it('swaps, and only swaps, when it is dropped on a player of the panel', () => {
        const ctx = manual();
        const [a, b] = waiting(ctx);
        place(ctx, a.id, 0);
        fire('dragstart', player(ctx, a.id));
        fire('dragover', player(ctx, b.id));
        fire('drop', player(ctx, b.id));
        ctx.fixture.detectChanges();
        expect(ctx.store.teams()?.[0]).toEqual([b]);
        expect(ctx.store.pool()).toContain(a);
        expect(ctx.store.pool()).toHaveLength(11);
        expect(status(ctx)).toBe(T.result.swapped(a.name, b.name));
      });

      it('does not accept a drop on a free place of the team the player is already in', () => {
        const ctx = manual();
        const [a] = waiting(ctx);
        place(ctx, a.id, 0);
        const before = ctx.store.teams();
        fire('dragstart', player(ctx, a.id));
        const over = fire('dragover', slots(ctx, 0)[0]);
        const dropped = fire('drop', slots(ctx, 0)[0]);
        expect(over.defaultPrevented).toBe(false);
        expect(dropped.defaultPrevented).toBe(false);
        expect(ctx.store.teams()).toBe(before);
      });

      it('does not accept a drop on the panel for a player who is already there', () => {
        const ctx = manual();
        const [a] = waiting(ctx);
        fire('dragstart', player(ctx, a.id));
        const over = fire('dragover', poolPanel(ctx) as HTMLElement);
        expect(over.defaultPrevented).toBe(false);
      });

      it('marks the free place or the panel that would take the player, and unmarks it', () => {
        const ctx = manual();
        const [a] = waiting(ctx);
        fire('dragstart', player(ctx, a.id));
        fire('dragover', slots(ctx, 0)[0]);
        ctx.fixture.detectChanges();
        expect(slots(ctx, 0)[0].className).toContain('ring-primary');
        fire('dragleave', slots(ctx, 0)[0]);
        ctx.fixture.detectChanges();
        expect(slots(ctx, 0)[0].className).not.toContain('ring-primary');
      });

      it('forgets the player that was being dragged once the drag ends', () => {
        const ctx = manual();
        const [a] = waiting(ctx);
        const before = ctx.store.teams();
        fire('dragstart', player(ctx, a.id));
        fire('dragend', player(ctx, a.id));
        fire('drop', slots(ctx, 0)[0]);
        expect(ctx.store.teams()).toBe(before);
      });
    });
  });
});
