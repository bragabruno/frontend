import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf, NgFor, DatePipe, SlicePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { CasesService } from '../services/cases.service';
import { AuthService } from '../../../core/auth/auth.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  CaseDetailDto,
  CaseStatus,
  LabelType,
  VALID_TRANSITIONS,
} from '../../../shared/models/models';
import { formatSlaDue, formatCurrency, formatDate } from '../../../shared/utils/utils';

/** A label captured at confirmation time so a later form edit can't alter what is persisted. */
interface LabelSubmission {
  label: LabelType;
  confidence: number;
  reason: string;
}

@Component({
  selector: 'app-case-detail',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    DatePipe,
    SlicePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressBarModule,
    MatDialogModule,
    MatSnackBarModule,
    MatListModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatSliderModule,
  ],
  templateUrl: './case-detail.component.html',
  styleUrl: './case-detail.component.scss',
})
export class CaseDetailComponent implements OnInit {
  caseDetail = signal<CaseDetailDto | null>(null);
  loading = signal(true);
  newNote = '';
  noteSubmitting = false;

  labelForm = { label: 'FRAUD' as 'FRAUD' | 'LEGITIMATE', confidence: 80, reason: '' };
  labelSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private casesService: CasesService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.casesService.getCase(id).subscribe({
        next: (detail) => {
          this.caseDetail.set(detail);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Failed to load case', 'Close', { duration: 3000 });
        },
      });
    }
  }

  get validTransitions(): CaseStatus[] {
    const detail = this.caseDetail();
    if (!detail) return [];
    return VALID_TRANSITIONS[detail.status] || [];
  }

  getSlaInfo(slaDueAt: string | null): { text: string; class: string } {
    return formatSlaDue(slaDueAt);
  }

  formatAmount(amount: number, currency: string): string {
    return formatCurrency(amount, currency);
  }

  formatTimestamp(ts: string): string {
    return formatDate(ts);
  }

  getStatusLabel(status: CaseStatus): string {
    return status.replace(/_/g, ' ');
  }

  getDecisionColor(decision: string): string {
    const colors: Record<string, string> = {
      APPROVE: '#2e7d32',
      REVIEW: '#f57f17',
      DECLINE: '#c62828',
    };
    return colors[decision] || '#616161';
  }

  transitionTo(status: CaseStatus): void {
    const detail = this.caseDetail();
    if (!detail) return;

    this.casesService.transitionStatus(detail.id, status).subscribe({
      next: () => {
        this.caseDetail.update((d) => (d ? { ...d, status } : d));
        this.snackBar.open(`Case transitioned to ${status}`, 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Invalid transition', 'Close', { duration: 3000 });
      },
    });
  }

  assignToMe(): void {
    const detail = this.caseDetail();
    const userId = this.authService.currentUser()?.userId;
    if (!detail || !userId) return;

    // Optimistic: reflect the assignment immediately, roll back if the API rejects it.
    const previous = { assigneeId: detail.assigneeId, status: detail.status };
    this.caseDetail.update((d) =>
      d ? { ...d, assigneeId: userId, status: 'ASSIGNED' as CaseStatus } : d,
    );

    this.casesService.assignCase(detail.id, userId).subscribe({
      next: () => this.snackBar.open('Case assigned to you', 'Close', { duration: 3000 }),
      error: () => {
        this.caseDetail.update((d) => (d ? { ...d, ...previous } : d));
        this.snackBar.open('Failed to assign case', 'Close', { duration: 3000 });
      },
    });
  }

  submitNote(): void {
    const detail = this.caseDetail();
    if (!detail || this.newNote.length < 10) return;

    this.noteSubmitting = true;
    this.casesService.addNote(detail.id, this.newNote).subscribe({
      next: (note) => {
        this.caseDetail.update((d) => (d ? { ...d, notes: [...d.notes, note] } : d));
        this.newNote = '';
        this.noteSubmitting = false;
      },
      error: () => {
        this.noteSubmitting = false;
      },
    });
  }

  submitLabel(): void {
    const detail = this.caseDetail();
    if (!detail || !this.labelForm.reason) return;

    // Snapshot the form now so an edit while the dialog is open can't change what was confirmed.
    const submission: LabelSubmission = {
      label: this.labelForm.label,
      confidence: this.labelForm.confidence,
      reason: this.labelForm.reason,
    };
    // Guard the destructive, audit-logged resolution behind an explicit confirmation.
    const dialogData: ConfirmDialogData = {
      title: `Mark case as ${submission.label}?`,
      message: `This records an audit-logged ${submission.label} label and resolves the case. This cannot be easily undone.`,
      confirmText: `Mark ${submission.label}`,
    };
    this.dialog
      .open(ConfirmDialogComponent, { data: dialogData })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) this.persistLabel(submission);
      });
  }

  private persistLabel(submission: LabelSubmission): void {
    // Read the latest state so rollback restores what's current, not a pre-dialog snapshot.
    const detail = this.caseDetail();
    if (!detail) return;

    const previousStatus = detail.status;
    const newStatus: CaseStatus =
      submission.label === 'FRAUD' ? 'RESOLVED_FRAUD' : 'RESOLVED_LEGIT';

    // Optimistic: resolve the case immediately, roll back if the API rejects it.
    this.labelSubmitting = true;
    this.caseDetail.update((d) => (d ? { ...d, status: newStatus } : d));

    this.casesService
      .addLabel(detail.id, submission.label, submission.confidence / 100, submission.reason)
      .subscribe({
        next: () => {
          this.labelSubmitting = false;
          this.snackBar.open(`Case marked as ${submission.label}`, 'Close', { duration: 3000 });
        },
        error: () => {
          this.labelSubmitting = false;
          this.caseDetail.update((d) => (d ? { ...d, status: previousStatus } : d));
          this.snackBar.open('Failed to submit label', 'Close', { duration: 3000 });
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/cases']);
  }
}
