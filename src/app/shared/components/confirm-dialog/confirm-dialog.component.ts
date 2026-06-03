import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NbCardModule, NbButtonModule } from '@nebular/theme';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

/**
 * Reusable confirmation dialog for guarding destructive actions.
 * Rendered with Nebular components but opened/closed via MatDialog so callers
 * keep using `dialog.open(...).afterClosed()`. Closes with `true` on confirm,
 * `false` on explicit cancel, and `undefined` if dismissed (backdrop/Escape).
 * Callers should treat any non-`true` result as "not confirmed".
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [NbCardModule, NbButtonModule],
  template: `
    <nb-card class="confirm-dialog">
      <nb-card-header>{{ data.title }}</nb-card-header>
      <nb-card-body>{{ data.message }}</nb-card-body>
      <nb-card-footer class="confirm-actions">
        <button nbButton ghost status="basic" (click)="dialogRef.close(false)">
          {{ data.cancelText ?? 'Cancel' }}
        </button>
        <button nbButton status="danger" (click)="dialogRef.close(true)">
          {{ data.confirmText ?? 'Confirm' }}
        </button>
      </nb-card-footer>
    </nb-card>
  `,
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject<MatDialogRef<ConfirmDialogComponent, boolean>>(MatDialogRef);
}
