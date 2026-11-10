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
    <!-- Minimal Sports Utility Hero Section -->
    <section class="border-b border-secondary/15 bg-secondary text-white relative overflow-hidden">
      <div class="mx-auto max-w-4xl space-y-6 px-4 py-16 sm:py-20 text-center">
        <div class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-primary backdrop-blur-md">
          <i class="fa-solid fa-bolt" aria-hidden="true"></i>
          <span>Utilidad deportiva de armado rápido</span>
        </div>

        <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          {{ t().hero.title }}
        </h1>

        <p class="mx-auto max-w-2xl text-base sm:text-lg text-white/80 leading-relaxed">
          {{ t().hero.subtitle }}
        </p>

        <div class="pt-2">
          <a
            [routerLink]="['/', i18n.lang(), 'amistoso']"
            class="inline-flex min-h-13 items-center justify-center gap-2.5 rounded-xl bg-primary px-8 text-base sm:text-lg font-black tracking-wide text-secondary shadow-lg transition-all duration-150 ease-out hover:brightness-95 hover:shadow-xl active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <i class="fa-solid fa-futbol" aria-hidden="true"></i>
            {{ t().hero.cta }}
          </a>
        </div>
      </div>
    </section>

    <!-- Tactical Benefits Grid -->
    <section class="mx-auto max-w-5xl px-4 py-14">
      <h2 class="sr-only">{{ t().benefits.title }}</h2>
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
        @for (benefit of benefits(); track benefit.title; let i = $index) {
          <ui-card [accent]="benefitAccent(i)">
            <h3 card-header class="text-base font-bold text-secondary">{{ benefit.title }}</h3>
            <p class="text-sm text-secondary/75 leading-relaxed">{{ benefit.text }}</p>
          </ui-card>
        }
      </div>
    </section>

    <!-- How it works (Tactical Step Process) -->
    <section class="mx-auto max-w-3xl space-y-6 px-4 pb-20">
      <div class="border-b border-secondary/10 pb-3">
        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-secondary">{{ t().steps.title }}</h2>
      </div>

      <ol class="space-y-4">
        @for (step of steps(); track step.title; let i = $index) {
          <li class="flex items-start gap-4 rounded-xl border border-secondary/10 bg-white p-4 sm:p-5 shadow-xs transition hover:border-secondary/20">
            <span
              class="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-black text-primary shadow-xs"
            >{{ i + 1 }}</span>
            <div class="space-y-1">
              <h3 class="text-base font-bold text-secondary">{{ step.title }}</h3>
              <p class="text-sm text-secondary/75 leading-relaxed">{{ step.text }}</p>
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

  protected benefitAccent(index: number): 'primary' | 'secondary' | 'alternative' {
    const accents: ('primary' | 'secondary' | 'alternative')[] = ['primary', 'secondary', 'alternative'];
    return accents[index % accents.length];
  }
}
