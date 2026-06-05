import { Component, OnInit, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { NbCardModule, NbButtonModule, NbIconModule, NbSpinnerModule } from '@nebular/theme';
import { AdminService } from '../services/admin.service';
import { ModelVersionDto, PageResponse } from '../../../shared/models/models';

@Component({
  selector: 'app-models',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    MatTableModule,
    MatPaginatorModule,
    NbCardModule,
    NbButtonModule,
    NbIconModule,
    NbSpinnerModule,
  ],
  template: `
    <div class="admin-page">
      <h1>Model Versions</h1>

      <div
        class="loading"
        *ngIf="loading()"
        [nbSpinner]="true"
        nbSpinnerSize="medium"
        nbSpinnerStatus="primary"
      >
        <span>Loading models...</span>
      </div>

      <div class="error" *ngIf="error() as err">
        <nb-icon icon="alert-circle-outline" pack="eva"></nb-icon>
        <span>{{ err }}</span>
        <button nbButton ghost status="primary" type="button" (click)="loadModels()">Retry</button>
      </div>

      <div class="empty" *ngIf="!loading() && !error() && models().length === 0">
        <span>No models found</span>
      </div>

      <nb-card *ngIf="!loading() && !error() && models().length > 0">
        <nb-card-body>
          <table mat-table [dataSource]="models()">
            <ng-container matColumnDef="version">
              <th mat-header-cell *matHeaderCellDef>Version</th>
              <td mat-cell *matCellDef="let row" class="mono">{{ row.version }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row">
                <span class="model-status" [class]="'status-' + row.status.toLowerCase()">{{
                  row.status
                }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="prAuc">
              <th mat-header-cell *matHeaderCellDef>PR-AUC</th>
              <td mat-cell *matCellDef="let row">{{ (row.metrics.prAuc * 100).toFixed(1) }}%</td>
            </ng-container>
            <ng-container matColumnDef="rocAuc">
              <th mat-header-cell *matHeaderCellDef>ROC-AUC</th>
              <td mat-cell *matCellDef="let row">{{ (row.metrics.rocAuc * 100).toFixed(1) }}%</td>
            </ng-container>
            <ng-container matColumnDef="recall">
              <th mat-header-cell *matHeaderCellDef>Recall</th>
              <td mat-cell *matCellDef="let row">{{ (row.metrics.recall * 100).toFixed(1) }}%</td>
            </ng-container>
            <ng-container matColumnDef="fpr">
              <th mat-header-cell *matHeaderCellDef>FPR</th>
              <td mat-cell *matCellDef="let row">{{ (row.metrics.fpr * 100).toFixed(1) }}%</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
          <mat-paginator
            [length]="totalElements()"
            [pageSize]="10"
            (page)="onPageChange($event)"
            showFirstLastButtons
          ></mat-paginator>
        </nb-card-body>
      </nb-card>
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
      .mono {
        font-family: var(--font-family-mono);
        font-size: 13px;
      }
      .model-status {
        padding: 2px 10px;
        border-radius: var(--radius-full);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .status-deployed {
        background-color: var(--accent-green-dim);
        color: var(--accent-green);
      }
      .status-registered {
        background-color: var(--bg-elevated);
        color: var(--text-tertiary);
      }
      .status-approved {
        background-color: var(--accent-amber-dim);
        color: var(--accent-amber);
      }
      .status-rolled_back {
        background-color: var(--accent-red-dim);
        color: var(--accent-red);
      }
      .status-archived {
        background-color: var(--bg-elevated);
        color: var(--text-tertiary);
      }
      .loading {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 48px;
        justify-content: center;
        color: var(--text-secondary);
      }
      .error {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 48px;
        color: var(--accent-red);
      }
      .empty {
        display: flex;
        justify-content: center;
        padding: 48px;
        color: var(--text-tertiary);
      }
    `,
  ],
})
export class ModelsComponent implements OnInit {
  displayedColumns = ['version', 'status', 'prAuc', 'rocAuc', 'recall', 'fpr'];
  models = signal<ModelVersionDto[]>([]);
  totalElements = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadModels();
  }

  loadModels(page = 0): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.getModels(page).subscribe({
      next: (res: PageResponse<ModelVersionDto>) => {
        this.models.set(res.content);
        this.totalElements.set(res.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message ?? 'Failed to load models');
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.loadModels(event.pageIndex);
  }
}
