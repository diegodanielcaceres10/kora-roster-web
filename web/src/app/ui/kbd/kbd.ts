import { ChangeDetectionStrategy, Component } from '@angular/core';

// A keyboard key inside a line of text, for example "Esc".
@Component({
  selector: 'ui-kbd',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `<kbd
    class="rounded-md border border-line bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] font-bold uppercase leading-none text-ink-muted shadow-xs"
    ><ng-content
  /></kbd>`,
})
export class UiKbd {}
