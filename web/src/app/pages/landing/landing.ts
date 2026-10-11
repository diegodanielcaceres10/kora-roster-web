import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n } from '../../i18n/i18n';
import { PageMeta } from '../../i18n/page-meta';
import { UiCard } from '../../ui';

@Component({
  selector: 'app-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiCard],
  host: { class: 'block' },
  template: `
    <section class="bg-secondary text-white">
      <div class="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:py-16">
        <h1>{{ t().hero.title }}</h1>
        <p class="text-lg text-white/85">{{ t().hero.subtitle }}</p>
        <a
          [routerLink]="['/', i18n.lang(), 'amistoso']"
          class="inline-flex min-h-13 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-lg font-semibold text-secondary transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <i class="fa-solid fa-futbol" aria-hidden="true"></i>
          {{ t().hero.cta }}
        </a>
      </div>
    </section>

    <section class="mx-auto max-w-5xl px-4 py-10">
      <h2 class="sr-only">{{ t().benefits.title }}</h2>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        @for (benefit of benefits(); track benefit.title) {
          <ui-card>
            <h3 card-header>{{ benefit.title }}</h3>
            <p>{{ benefit.text }}</p>
          </ui-card>
        }
      </div>
    </section>

    <section class="mx-auto max-w-3xl space-y-4 px-4 pb-14">
      <h2>{{ t().steps.title }}</h2>
      <ol class="space-y-4">
        @for (step of steps(); track step.title; let i = $index) {
          <li class="flex gap-4">
            <span
              class="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-secondary"
              >{{ i + 1 }}</span
            >
            <div>
              <h3>{{ step.title }}</h3>
              <p>{{ step.text }}</p>
            </div>
          </li>
        }
      </ol>
    </section>
  `,
})
export class Landing {
  protected readonly i18n = inject(I18n);

  protected readonly t = computed(() => this.i18n.t().landing);
  protected readonly benefits = computed(() => {
    const { noAccount, anyList, fairDraw } = this.t().benefits;
    return [noAccount, anyList, fairDraw];
  });
  protected readonly steps = computed(() => {
    const { paste, check, draw } = this.t().steps;
    return [paste, check, draw];
  });

  constructor() {
    inject(PageMeta).apply('landing');
  }
}
