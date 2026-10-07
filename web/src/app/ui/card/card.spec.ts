import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CardAccent, UiCard } from './card';

@Component({
  imports: [UiCard],
  template: `
    <ui-card [accent]="accent()">
      <h3 card-header>Equipo A</h3>
      <p>Diego, Mati</p>
    </ui-card>
  `,
})
class Host {
  readonly accent = signal<CardAccent | undefined>(undefined);
}

@Component({ imports: [UiCard], template: `<ui-card><p>Solo cuerpo</p></ui-card>` })
class NoHeaderHost {}

describe('UiCard', () => {
  it('renders the header and the body in separate places', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const header = el.querySelector('header') as HTMLElement;
    const body = el.querySelector('section > div') as HTMLElement;
    expect(header.textContent).toContain('Equipo A');
    expect(header.textContent).not.toContain('Diego');
    expect(body.textContent).toContain('Diego, Mati');
    expect(body.textContent).not.toContain('Equipo A');
  });

  it('leaves the header element empty when no header is projected', () => {
    const fixture = TestBed.createComponent(NoHeaderHost);
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('header') as HTMLElement;
    expect(header.matches(':empty')).toBe(true);
  });

  it('shows a different edge for every accent, and none by default', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const section = () => fixture.nativeElement.querySelector('section') as HTMLElement;
    const looks = new Set<string>([section().className]);
    for (const accent of ['primary', 'secondary', 'alternative'] as const) {
      fixture.componentInstance.accent.set(accent);
      fixture.detectChanges();
      looks.add(section().className);
    }
    expect(looks.size).toBe(4);
  });
});
