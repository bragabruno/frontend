import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NbButtonModule, NbIconModule } from '@nebular/theme';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, NbButtonModule, NbIconModule],
  template: `
    <div class="error-page">
      <nb-icon class="error-icon" icon="search-outline" pack="eva"></nb-icon>
      <h1>404 — Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a nbButton status="primary" routerLink="/cases">Go to Cases</a>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .error-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        text-align: center;
      }
      .error-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #9e9e9e;
      }
      h1 {
        margin-top: 16px;
      }
      p {
        color: #616161;
      }
    `,
  ],
})
export class NotFoundComponent {}
