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
      class="overflow-hidden rounded-xl border border-secondary/12 bg-white shadow-[0_1px_3px_rgba(27,42,65,0.05),0_1px_2px_rgba(27,42,65,0.03)] transition-all duration-200 hover:border-secondary/20 hover:shadow-[0_4px_12px_rgba(27,42,65,0.06)]"
      [class]="accentClass()"
    >
      <header class="px-4 pt-4 sm:px-5 sm:pt-5 empty:hidden"><ng-content select="[card-header]" /></header>
      <div class="p-4 sm:p-5"><ng-content /></div>
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
