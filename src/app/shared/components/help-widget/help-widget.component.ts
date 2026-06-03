import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { NbButtonModule, NbIconModule, NbTooltipModule } from '@nebular/theme';

@Component({
  selector: 'app-help-widget',
  standalone: true,
  imports: [NgIf, NbButtonModule, NbIconModule, NbTooltipModule],
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
