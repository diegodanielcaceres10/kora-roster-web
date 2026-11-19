import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type StepHeaderStep, UiStepHeader } from './step-header';

const STEPS: StepHeaderStep[] = [
  { label: 'Lista', state: 'done' },
  { label: 'Revisión', state: 'current' },
  { label: 'Equipos', state: 'todo' },
];

@Component({
  imports: [UiStepHeader],
  template: `
    <ui-step-header
      [title]="title()"
      [subtitle]="subtitle()"
      [steps]="steps()"
      stepsLabel="Progreso del sorteo"
      doneLabel="completado"
    />
  `,
})
class Host {
  readonly title = signal('Revisa los nombres');
  readonly subtitle = signal('Verifica los arqueros y elige cuántos equipos sortear.');
  readonly steps = signal<readonly StepHeaderStep[]>(STEPS);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const items = () => Array.from(el.querySelectorAll('nav li')) as HTMLElement[];
  const update = (fn: (h: Host) => void) => {
    fn(fixture.componentInstance);
    fixture.detectChanges();
  };
  return { el, items, update };
}

describe('UiStepHeader', () => {
  it('has the title as the heading of the page', () => {
    const { el } = setup();
    expect(el.querySelector('h1')?.textContent).toContain('Revisa los nombres');
  });

  it('shows the subtitle, and leaves it out when there is none', () => {
    const { el, update } = setup();
    expect(el.querySelector('p')?.textContent).toContain('Verifica los arqueros');
    update((h) => h.subtitle.set(''));
    expect(el.querySelector('p')).toBeNull();
  });

  describe('the steps', () => {
    it('are a labelled list with a numbered label each', () => {
      const { el, items } = setup();
      expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe('Progreso del sorteo');
      expect(items().map((li) => li.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
        '1 Lista completado',
        '2 Revisión',
        '3 Equipos',
      ]);
    });

    it('mark the current one for assistive technology', () => {
      const { items } = setup();
      expect(items().map((li) => li.querySelector('[aria-current="step"]') !== null)).toEqual([
        false,
        true,
        false,
      ]);
    });

    it('tell a done one apart with a check, and the others without it', () => {
      const { items } = setup();
      expect(items().map((li) => li.querySelector('ui-icon[data-icon="check"]') !== null)).toEqual([
        true,
        false,
        false,
      ]);
    });

    it('look different when done, current and still to do', () => {
      const { items } = setup();
      const looks = items().map((li) => li.querySelector('[data-step]')?.className);
      expect(new Set(looks).size).toBe(3);
    });

    it('can all be done', () => {
      const { items, update } = setup();
      update((h) => h.steps.set(STEPS.map((step) => ({ ...step, state: 'done' as const }))));
      expect(items().every((li) => li.querySelector('ui-icon[data-icon="check"]'))).toBe(true);
      expect(items().some((li) => li.querySelector('[aria-current="step"]'))).toBe(false);
    });

    it('are not drawn when there are none', () => {
      const { el, update } = setup();
      update((h) => h.steps.set([]));
      expect(el.querySelector('nav')).toBeNull();
    });
  });
});
