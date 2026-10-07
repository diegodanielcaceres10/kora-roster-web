import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BadgeTone, UiBadge } from './badge';

@Component({
  imports: [UiBadge],
  template: `<ui-badge [tone]="tone()">Dudoso</ui-badge>`,
})
class Host {
  readonly tone = signal<BadgeTone>('neutral');
}

@Component({ imports: [UiBadge], template: `<ui-badge>Dudoso</ui-badge>` })
class DefaultHost {}

const pill = (root: HTMLElement) => root.querySelector('span') as HTMLElement;

describe('UiBadge', () => {
  it('projects its text', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(pill(fixture.nativeElement).textContent).toContain('Dudoso');
  });

  it('renders a different look for every tone', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const looks = new Set<string>();
    for (const tone of ['neutral', 'primary', 'alternative', 'danger'] as const) {
      fixture.componentInstance.tone.set(tone);
      fixture.detectChanges();
      looks.add(pill(fixture.nativeElement).className);
    }
    expect(looks.size).toBe(4);
  });

  it('uses the neutral tone when none is given', () => {
    const explicit = TestBed.createComponent(Host);
    explicit.detectChanges();
    const fallback = TestBed.createComponent(DefaultHost);
    fallback.detectChanges();
    expect(pill(fallback.nativeElement).className).toBe(pill(explicit.nativeElement).className);
  });
});
