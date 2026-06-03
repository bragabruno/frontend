import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="error-page">
      <mat-icon class="error-icon">search_off</mat-icon>
      <h1>404 — Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a mat-raised-button color="primary" routerLink="/cases">Go to Cases</a>
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
