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
