import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiTextarea } from './textarea';

@Component({
  imports: [UiTextarea],
  template: `
    <ui-textarea
      label="Lista de WhatsApp"
      [placeholder]="placeholder()"
      [rows]="rows()"
      [hint]="hint()"
      [hideLabel]="hideLabel()"
      [(value)]="text"
    />
  `,
})
class Host {
  readonly control = viewChild.required(UiTextarea);
  readonly hideLabel = signal(false);
  readonly text = signal('');
  readonly placeholder = signal('Pegá la lista acá');
  readonly rows = signal<number | undefined>(undefined);
  readonly hint = signal('');
}

@Component({
  imports: [UiTextarea],
  template: `
    <ui-textarea label="Primera" />
    <ui-textarea label="Segunda" />
  `,
})
class TwoHost {}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const el = fixture.nativeElement as HTMLElement;
  const field = () => el.querySelector('textarea') as HTMLTextAreaElement;
  const update = (fn: (h: Host) => void) => {
    fn(host);
    fixture.detectChanges();
  };
  return { el, host, field, update };
}

describe('UiTextarea', () => {
  it('links the label to the textarea', () => {
    const { el, field } = setup();
    const label = el.querySelector('label') as HTMLLabelElement;
    expect(label.textContent).toContain('Lista de WhatsApp');
    expect(label.control).toBe(field());
  });

  it('gives every instance its own id so each label points at its own field', () => {
    const fixture = TestBed.createComponent(TwoHost);
    fixture.detectChanges();
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('label'),
    ) as HTMLLabelElement[];
    const fields = Array.from(
      fixture.nativeElement.querySelectorAll('textarea'),
    ) as HTMLTextAreaElement[];
    expect(labels[0].control).toBe(fields[0]);
    expect(labels[1].control).toBe(fields[1]);
  });

  it('writes what the user types back to the bound value', () => {
    const { host, field } = setup();
    field().value = '1. Jugador A 🧤';
    field().dispatchEvent(new Event('input'));
    expect(host.text()).toBe('1. Jugador A 🧤');
  });

  it('shows the value set from the outside', () => {
    const { field, update } = setup();
    update((h) => h.text.set('2. Jugador E'));
    expect(field().value).toBe('2. Jugador E');
  });

  it('uses 6 rows by default and honors a custom number', () => {
    const { field, update } = setup();
    expect(field().rows).toBe(6);
    update((h) => h.rows.set(3));
    expect(field().rows).toBe(3);
  });

  it('passes the placeholder to the textarea', () => {
    const { field } = setup();
    expect(field().placeholder).toBe('Pegá la lista acá');
  });

  it('describes the field with the hint only when there is one', () => {
    const { el, field, update } = setup();
    expect(field().hasAttribute('aria-describedby')).toBe(false);
    update((h) => h.hint.set('Una línea por jugador'));
    const hintId = field().getAttribute('aria-describedby') as string;
    expect(el.querySelector(`#${hintId}`)?.textContent).toContain('Una línea por jugador');
  });

  describe('as a regular textarea', () => {
    it('has no line numbers', () => {
      const { el, update } = setup();
      update((h) => h.text.set('Jugador A\nJugador E'));
      expect(el.querySelector('[data-gutter]')).toBeNull();
    });

    it('keeps its rows however many lines the value has, and scrolls instead of growing', () => {
      const { field, update } = setup();
      update((h) => {
        h.rows.set(3);
        h.text.set(Array.from({ length: 11 }, (_, i) => `Jugador ${i + 1}`).join('\n'));
      });
      expect(field().rows).toBe(3);
    });

    it('wraps long lines as any textarea does', () => {
      const { field } = setup();
      expect(field().hasAttribute('wrap')).toBe(false);
    });

    it('can only be resized in height, so it never breaks the layout', () => {
      const { field } = setup();
      expect(field().classList.contains('resize-y')).toBe(true);
    });
  });

  describe('hidden label', () => {
    it('keeps the label for assistive technology but not for the eyes', () => {
      const { el, field, update } = setup();
      const label = el.querySelector('label') as HTMLLabelElement;
      expect(label.classList.contains('sr-only')).toBe(false);
      update((h) => h.hideLabel.set(true));
      expect(label.classList.contains('sr-only')).toBe(true);
      expect(label.control).toBe(field());
    });
  });

  it('takes the focus when asked to', () => {
    const { host, field } = setup();
    host.control().focus();
    expect(document.activeElement).toBe(field());
  });
});
