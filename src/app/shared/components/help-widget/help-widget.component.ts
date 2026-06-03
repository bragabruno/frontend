import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-help-widget',
  standalone: true,
  imports: [NgIf, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './help-widget.component.html',
  styleUrl: './help-widget.component.scss',
})
export class HelpWidgetComponent {
  isOpen = signal(false);

  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  contactSupport(): void {
    window.open('mailto:support@fraudprevention.io?subject=Support Request', '_blank');
  }

  viewDocs(): void {
    window.open('/docs', '_blank');
  }
}
