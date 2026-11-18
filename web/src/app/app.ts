import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Theme } from './theme/theme';
import { UiToastHost } from './ui';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UiToastHost],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor() {
    // Creating it is what puts the saved mode on the page; nothing else needs it yet.
    inject(Theme);
  }
}
