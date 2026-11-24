import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ICONS, type IconName } from './icons';

const SVG_OPEN =
  '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" ' +
  'stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" ' +
  'aria-hidden="true" focusable="false">';

@Component({
  selector: 'ui-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex shrink-0 items-center justify-center',
    '[attr.data-icon]': 'name()',
    '[innerHTML]': 'markup()',
  },
  templateUrl: './icon.html',
  styleUrl: './icon.css',
})
export class UiIcon {
  readonly name = input.required<IconName>();

  private readonly sanitizer = inject(DomSanitizer);

  // The markup comes from the constants in icons.ts and never from the person, so it is safe
  // to trust (Angular's sanitizer would strip every SVG element from it). It is set on the
  // host, not on the <svg>: the server renderer cannot set innerHTML on SVG elements.
  protected readonly markup = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(`${SVG_OPEN}${ICONS[this.name()]}</svg>`),
  );
}
