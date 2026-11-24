import { ChangeDetectionStrategy, Component } from '@angular/core';

// A keyboard key inside a line of text, for example "Esc".
@Component({
  selector: 'ui-kbd',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  templateUrl: './kbd.html',
  styleUrl: './kbd.css',
})
export class UiKbd {}
