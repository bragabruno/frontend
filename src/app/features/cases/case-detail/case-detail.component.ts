import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf, NgFor, DatePipe, SlicePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { CasesService } from '../services/cases.service';
import { CaseDetailDto, CaseStatus, VALID_TRANSITIONS } from '../../../shared/models/models';
import { formatSlaDue, formatCurrency, formatDate } from '../../../shared/utils/utils';

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
    if (!detail) return;

    this.casesService.assignCase(detail.id, 'current-user-id').subscribe({
      next: () => {
        this.caseDetail.update((d) =>
          d ? { ...d, assigneeId: 'current-user-id', status: 'ASSIGNED' as CaseStatus } : d,
        );
        this.snackBar.open('Case assigned to you', 'Close', { duration: 3000 });
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

    this.labelSubmitting = true;
    this.casesService
      .addLabel(
        detail.id,
        this.labelForm.label,
        this.labelForm.confidence / 100,
        this.labelForm.reason,
      )
      .subscribe({
        next: () => {
          const newStatus = this.labelForm.label === 'FRAUD' ? 'RESOLVED_FRAUD' : 'RESOLVED_LEGIT';
          this.caseDetail.update((d) => (d ? { ...d, status: newStatus as CaseStatus } : d));
          this.labelSubmitting = false;
          this.snackBar.open(`Case marked as ${this.labelForm.label}`, 'Close', { duration: 3000 });
        },
        error: () => {
          this.labelSubmitting = false;
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/cases']);
  }
}
