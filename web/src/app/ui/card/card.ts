import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type CardAccent = 'primary' | 'secondary' | 'alternative';

const ACCENTS: Record<CardAccent, string> = {
  primary: 'border-t-4 border-t-primary',
  secondary: 'border-t-4 border-t-secondary',
  alternative: 'border-t-4 border-t-alternative',
};

@Component({
  selector: 'ui-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section
      class="overflow-hidden rounded-xl border border-secondary/15 bg-white shadow-sm"
      [class]="accentClass()"
    >
      <header class="px-4 pt-4 empty:hidden"><ng-content select="[card-header]" /></header>
      <div class="p-4"><ng-content /></div>
    </section>
  `,
})
export class UiCard {
  readonly accent = input<CardAccent | undefined>(undefined);

  protected readonly accentClass = computed(() => {
    const accent = this.accent();
    return accent ? ACCENTS[accent] : '';
  });
}
