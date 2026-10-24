import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SegmentedOption, UiSegmented } from './segmented';

const OPTIONS: SegmentedOption[] = [
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
  { value: 'pt', label: 'PT' },
];

@Component({
  imports: [UiSegmented],
  template: `<ui-segmented label="Idioma" [options]="options" [(value)]="lang" />`,
})
class Host {
  readonly options = OPTIONS;
  readonly lang = signal('en');
}

function setup(initial = 'en') {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.lang.set(initial);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const el = fixture.nativeElement as HTMLElement;
  const radios = () => Array.from(el.querySelectorAll('[role="radio"]')) as HTMLButtonElement[];
  const press = (index: number, key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    radios()[index].dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };
  return { fixture, host, el, radios, press };
}

describe('UiSegmented', () => {
  it('renders one radio per option inside a group named by the label', () => {
    const { el, radios } = setup();
    const group = el.querySelector('[role="radiogroup"]') as HTMLElement;
    expect(group.getAttribute('aria-label')).toBe('Idioma');
    expect(radios().map((r) => r.textContent?.trim())).toEqual(['EN', 'ES', 'PT']);
  });

  it('marks only the selected option as checked and follows outside changes', () => {
    const { fixture, host, radios } = setup('es');
    expect(radios().map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    host.lang.set('pt');
    fixture.detectChanges();
    expect(radios().map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true']);
  });

  it('selects an option when it is clicked', () => {
    const { fixture, host, radios } = setup();
    radios()[2].click();
    fixture.detectChanges();
    expect(host.lang()).toBe('pt');
  });

  it('makes only the selected option reachable with Tab', () => {
    const { radios } = setup('es');
    expect(radios().map((r) => r.tabIndex)).toEqual([-1, 0, -1]);
  });

  it('makes the first option reachable when the value matches no option', () => {
    const { radios } = setup('fr');
    expect(radios().map((r) => r.tabIndex)).toEqual([0, -1, -1]);
  });

  it('moves selection and focus to the next option with ArrowRight and ArrowDown', () => {
    const { host, radios, press } = setup('en');
    press(0, 'ArrowRight');
    expect(host.lang()).toBe('es');
    expect(document.activeElement).toBe(radios()[1]);
    press(1, 'ArrowDown');
    expect(host.lang()).toBe('pt');
    expect(document.activeElement).toBe(radios()[2]);
  });

  it('moves to the previous option with ArrowLeft and ArrowUp', () => {
    const { host, press } = setup('pt');
    press(2, 'ArrowLeft');
    expect(host.lang()).toBe('es');
    press(1, 'ArrowUp');
    expect(host.lang()).toBe('en');
  });

  it('wraps around at both ends', () => {
    const { host, press } = setup('pt');
    press(2, 'ArrowRight');
    expect(host.lang()).toBe('en');
    press(0, 'ArrowLeft');
    expect(host.lang()).toBe('pt');
  });

  it('jumps to the first and last option with Home and End', () => {
    const { host, press } = setup('es');
    press(1, 'End');
    expect(host.lang()).toBe('pt');
    press(2, 'Home');
    expect(host.lang()).toBe('en');
  });

  it('lets Tab leave the group untouched', () => {
    const { host, press } = setup('es');
    const event = press(1, 'Tab');
    expect(event.defaultPrevented).toBe(false);
    expect(host.lang()).toBe('es');
  });
});

const LOCKABLE: SegmentedOption[] = [
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4', locked: 'sign-in' },
  { value: '5', label: '5', locked: 'premium', lockedLabel: 'Premium' },
];

@Component({
  imports: [UiSegmented],
  template: `
    <ui-segmented
      label="Equipos"
      [options]="options"
      [(value)]="teams"
      (lockedSelect)="touched.push($event.value)"
    />
  `,
})
class LockedHost {
  readonly options = LOCKABLE;
  readonly teams = signal('2');
  readonly touched: string[] = [];
}

function setupLocked() {
  const fixture = TestBed.createComponent(LockedHost);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const el = fixture.nativeElement as HTMLElement;
  const radios = () => Array.from(el.querySelectorAll('[role="radio"]')) as HTMLButtonElement[];
  const press = (index: number, key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    radios()[index].dispatchEvent(event);
    fixture.detectChanges();
  };
  const click = (index: number) => {
    radios()[index].click();
    fixture.detectChanges();
  };
  return { fixture, host, radios, press, click };
}

describe('UiSegmented with locked options', () => {
  it('draws a lock on every locked option, and the lock label only where there is one', () => {
    const { radios } = setupLocked();
    const locks = radios().map((r) => r.querySelector('i.fa-lock') !== null);
    expect(locks).toEqual([false, false, true, true]);
    expect(radios()[2].textContent?.replace(/\s+/g, ' ').trim()).toBe('4');
    expect(radios()[3].textContent).toContain('Premium');
  });

  it('marks the locked options as not available for assistive technology', () => {
    const { radios } = setupLocked();
    expect(radios().map((r) => r.getAttribute('aria-disabled'))).toEqual([
      null,
      null,
      'true',
      'true',
    ]);
  });

  it('tells the owner when a locked option is touched, and keeps the value', () => {
    const { host, click } = setupLocked();
    click(3);
    click(2);
    expect(host.touched).toEqual(['5', '4']);
    expect(host.teams()).toBe('2');
  });

  it('still selects the open options without bothering the owner about locks', () => {
    const { host, click } = setupLocked();
    click(1);
    expect(host.teams()).toBe('3');
    expect(host.touched).toEqual([]);
  });

  it('never shows a locked option as selected, even when the value points at it', () => {
    const { fixture, host, radios } = setupLocked();
    host.teams.set('4');
    fixture.detectChanges();
    expect(radios().map((r) => r.getAttribute('aria-checked'))).toEqual([
      'false',
      'false',
      'false',
      'false',
    ]);
    expect(radios().map((r) => r.tabIndex)).toEqual([0, -1, -1, -1]);
  });

  it('lets the arrow keys reach a locked option without selecting it', () => {
    const { host, radios, press, click } = setupLocked();
    click(1);
    press(1, 'ArrowRight');
    expect(document.activeElement).toBe(radios()[2]);
    expect(host.teams()).toBe('3');
    expect(host.touched).toEqual([]);
  });

  it('wraps from a locked option to the first one, which it selects', () => {
    const { host, radios, press } = setupLocked();
    press(3, 'ArrowRight');
    expect(host.teams()).toBe('2');
    expect(document.activeElement).toBe(radios()[0]);
  });

  it('moves focus to the last option with End, even if it is locked, without selecting it', () => {
    const { host, radios, press } = setupLocked();
    press(0, 'End');
    expect(document.activeElement).toBe(radios()[3]);
    expect(host.teams()).toBe('2');
  });
});
