import { Component, OnInit, signal } from '@angular/core';
import { NgIf, NgFor, DatePipe, SlicePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { NbCardModule, NbButtonModule, NbIconModule, NbSpinnerModule } from '@nebular/theme';
import { AdminService } from '../services/admin.service';
import { AuditEventDto, PageResponse } from '../../../shared/models/models';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    DatePipe,
    SlicePipe,
    MatTableModule,
    MatPaginatorModule,
    NbCardModule,
    NbButtonModule,
    NbIconModule,
    NbSpinnerModule,
  ],
  template: `
    <div class="admin-page">
      <h1>Audit Trail</h1>

      <div
        class="loading"
        *ngIf="loading()"
        [nbSpinner]="true"
        nbSpinnerSize="medium"
        nbSpinnerStatus="primary"
      >
        <span>Loading audit events...</span>
      </div>

      <div class="error" *ngIf="error() as err">
        <nb-icon icon="alert-circle-outline" pack="eva"></nb-icon>
        <span>{{ err }}</span>
        <button nbButton ghost status="primary" type="button" (click)="loadEvents()">Retry</button>
      </div>

      <div class="empty" *ngIf="!loading() && !error() && events().length === 0">
        <span>No audit events found</span>
      </div>

      <nb-card *ngIf="!loading() && !error() && events().length > 0">
        <nb-card-body>
          <table mat-table [dataSource]="events()">
            <ng-container matColumnDef="timestamp">
              <th mat-header-cell *matHeaderCellDef>Timestamp</th>
              <td mat-cell *matCellDef="let row" class="mono">
                {{ row.timestamp | date: 'medium' }}
              </td>
            </ng-container>
            <ng-container matColumnDef="actor">
              <th mat-header-cell *matHeaderCellDef>Actor</th>
              <td mat-cell *matCellDef="let row">{{ row.actorUsername }}</td>
            </ng-container>
            <ng-container matColumnDef="action">
              <th mat-header-cell *matHeaderCellDef>Action</th>
              <td mat-cell *matCellDef="let row">
                <span class="action-badge">{{ row.action }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="target">
              <th mat-header-cell *matHeaderCellDef>Target</th>
              <td mat-cell *matCellDef="let row">
                {{ row.targetType }}: {{ row.targetId | slice: 0 : 8 }}
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
          <mat-paginator
            [length]="totalElements()"
            [pageSize]="50"
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
      .action-badge {
        background-color: var(--bg-elevated);
        color: var(--text-secondary);
        padding: 2px 10px;
        border-radius: var(--radius-sm);
        font-size: 12px;
        border: 1px solid var(--border-subtle);
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
export class AuditComponent implements OnInit {
  displayedColumns = ['timestamp', 'actor', 'action', 'target'];
  events = signal<AuditEventDto[]>([]);
  totalElements = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(page = 0): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.getAuditEvents(page).subscribe({
      next: (res: PageResponse<AuditEventDto>) => {
        this.events.set(res.content);
        this.totalElements.set(res.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message ?? 'Failed to load audit events');
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.loadEvents(event.pageIndex);
  }
}
