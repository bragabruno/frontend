import { Component, OnInit, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../services/admin.service';
import { UserDto, PageResponse } from '../../../shared/models/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="admin-page">
      <h1>User Management</h1>
      <table mat-table [dataSource]="users()">
        <ng-container matColumnDef="username">
          <th mat-header-cell *matHeaderCellDef>Username</th>
          <td mat-cell *matCellDef="let row">{{ row.username }}</td>
        </ng-container>
        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let row">{{ row.email }}</td>
        </ng-container>
        <ng-container matColumnDef="role">
          <th mat-header-cell *matHeaderCellDef>Role</th>
          <td mat-cell *matCellDef="let row">
            <span class="role-badge">{{ row.role }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let row">
            <span [class]="row.status === 'ACTIVE' ? 'status-active' : 'status-disabled'">{{
              row.status
            }}</span>
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
      .role-badge {
        background-color: var(--bg-elevated);
        color: var(--accent-blue);
        padding: 2px 10px;
        border-radius: var(--radius-full);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border: 1px solid var(--border-subtle);
      }
      .status-active {
        color: var(--accent-green);
        font-weight: 500;
      }
      .status-disabled {
        color: var(--accent-red);
        font-weight: 500;
      }
    `,
  ],
})
export class UsersComponent implements OnInit {
  displayedColumns = ['username', 'email', 'role', 'status'];
  users = signal<UserDto[]>([]);
  totalElements = signal(0);

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(page = 0): void {
    this.adminService.getUsers(page).subscribe({
      next: (res: PageResponse<UserDto>) => {
        this.users.set(res.content);
        this.totalElements.set(res.totalElements);
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.loadUsers(event.pageIndex);
  }
}
