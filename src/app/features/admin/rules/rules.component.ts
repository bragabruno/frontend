import { Component, OnInit, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../services/admin.service';
import { RuleDto, PageResponse } from '../../../shared/models/models';

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="admin-page">
      <h1>Rule Configuration</h1>
      <table mat-table [dataSource]="rules()">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let row">{{ row.name }}</td>
        </ng-container>
        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef>Type</th>
          <td mat-cell *matCellDef="let row">
            <span class="type-badge">{{ row.type }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="weight">
          <th mat-header-cell *matHeaderCellDef>Weight</th>
          <td mat-cell *matCellDef="let row">{{ row.weight }}</td>
        </ng-container>
        <ng-container matColumnDef="threshold">
          <th mat-header-cell *matHeaderCellDef>Threshold</th>
          <td mat-cell *matCellDef="let row">{{ row.threshold }}</td>
        </ng-container>
        <ng-container matColumnDef="enabled">
          <th mat-header-cell *matHeaderCellDef>Enabled</th>
          <td mat-cell *matCellDef="let row">
            <mat-slide-toggle [checked]="row.enabled" (change)="toggleRule(row)"></mat-slide-toggle>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>
      <mat-paginator
        [length]="totalElements()"
        [pageSize]="20"
        (page)="onPageChange($event)"
        showFirstLastButtons
      ></mat-paginator>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .admin-page {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      h1 {
        margin: 0;
        font-size: 22px;
        font-weight: 600;
        color: var(--text-primary);
      }
      table {
        width: 100%;
      }
      .type-badge {
        background-color: var(--bg-elevated);
        color: var(--text-secondary);
        padding: 2px 10px;
        border-radius: var(--radius-full);
        font-size: 11px;
        font-weight: 500;
        border: 1px solid var(--border-subtle);
      }
    `,
  ],
})
export class RulesComponent implements OnInit {
  displayedColumns = ['name', 'type', 'weight', 'threshold', 'enabled'];
  rules = signal<RuleDto[]>([]);
  totalElements = signal(0);

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadRules();
  }

  loadRules(page = 0): void {
    this.adminService.getRules(page).subscribe({
      next: (res: PageResponse<RuleDto>) => {
        this.rules.set(res.content);
        this.totalElements.set(res.totalElements);
      },
    });
  }

  toggleRule(rule: RuleDto): void {
    this.adminService.updateRule(rule.id, { enabled: !rule.enabled }).subscribe({
      next: (updated) => {
        this.rules.update((rules) => rules.map((r) => (r.id === updated.id ? updated : r)));
        this.snackBar.open('Rule updated', 'Close', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Failed to update rule', 'Close', { duration: 3000 });
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.loadRules(event.pageIndex);
  }
}
