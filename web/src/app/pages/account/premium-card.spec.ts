import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DICTIONARIES } from '../../i18n/dictionaries';
import { I18n } from '../../i18n/i18n';
import { PremiumCard } from './premium-card';

const T = DICTIONARIES.es;

function setup(lang: 'en' | 'es' | 'pt' = 'es') {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  TestBed.inject(I18n).setLang(lang);
  const fixture = TestBed.createComponent(PremiumCard);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const items = () => Array.from(el.querySelectorAll('li button')) as HTMLButtonElement[];
  const touch = (index: number) => {
    items()[index].click();
    fixture.detectChanges();
  };
  const notice = () => el.querySelector('[role="status"]')?.textContent?.trim() ?? '';
  return { el, items, touch, notice };
}

describe('PremiumCard', () => {
  afterEach(() => {
    document.documentElement.lang = 'en';
  });

  it('is titled Premium, with a lock, and says what comes with it', () => {
    const { el } = setup();
    const title = el.querySelector('h2') as HTMLElement;
    expect(title.textContent).toContain(T.premiumCard.title);
    expect(title.querySelector('i.fa-lock')).not.toBeNull();
    expect(el.textContent).toContain(T.premiumCard.intro);
  });

  it('lists the five features that come with Premium, in order, each locked', () => {
    const { items } = setup();
    const card = T.premiumCard;
    expect(items().map((b) => b.textContent?.trim())).toEqual([
      card.moreTeams,
      card.logo,
      card.records,
      card.attendance,
      card.signUps,
    ]);
    for (const item of items()) {
      expect(item.querySelector('i.fa-lock')).not.toBeNull();
      expect(item.getAttribute('aria-disabled')).toBe('true');
    }
  });

  it('says nothing until a feature is touched', () => {
    const { notice } = setup();
    expect(notice()).toBe('');
  });

  it.each([0, 2, 4])('says it comes with Premium, soon, when feature %i is touched', (index) => {
    const { touch, notice } = setup();
    touch(index);
    expect(notice()).toBe(T.locks.premiumSoon);
  });

  it('shows a single notice however many features are touched, and no sign in link', () => {
    const { el, touch } = setup();
    touch(0);
    touch(3);
    expect(el.querySelectorAll('[role="status"] p')).toHaveLength(1);
    expect(el.querySelector('[role="status"] a')).toBeNull();
  });

  it.each(['en', 'pt'] as const)('speaks the language of the page: %s', (lang) => {
    const { el, touch, notice } = setup(lang);
    expect(el.textContent).toContain(DICTIONARIES[lang].premiumCard.intro);
    touch(1);
    expect(notice()).toBe(DICTIONARIES[lang].locks.premiumSoon);
  });
});
