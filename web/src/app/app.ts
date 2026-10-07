import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiToastHost } from './ui';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UiToastHost],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
