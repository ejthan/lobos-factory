import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterModule],
  template: `
    <header class="brand"><a routerLink="/">Lobos Factory</a></header>
    <main><router-outlet /></main>
  `,
})
export class App {}
