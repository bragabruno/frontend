import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { NbIconModule } from '@nebular/theme';

export interface Breadcrumb {
  label: string;
  route?: string;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, NbIconModule],
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss',
})
export class BreadcrumbsComponent {
  items = input<Breadcrumb[]>([]);
}
