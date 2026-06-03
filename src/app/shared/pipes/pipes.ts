import { Pipe, PipeTransform } from '@angular/core';
import { CaseStatus, Severity, Decision, TransactionStatus } from '../models/models';

@Pipe({ name: 'severityColor', standalone: true })
export class SeverityColorPipe implements PipeTransform {
  private colors: Record<Severity, string> = {
    CRITICAL: '#d32f2f',
    HIGH: '#e65100',
    MEDIUM: '#f9a825',
    LOW: '#2e7d32',
  };

  transform(severity: Severity): string {
    return this.colors[severity] || '#616161';
  }
}

@Pipe({ name: 'caseStatusLabel', standalone: true })
export class CaseStatusLabelPipe implements PipeTransform {
  private labels: Record<CaseStatus, string> = {
    OPEN: 'Open',
    ASSIGNED: 'Assigned',
    IN_REVIEW: 'In Review',
    RESOLVED_FRAUD: 'Resolved Fraud',
    RESOLVED_LEGIT: 'Resolved Legit',
    ESCALATED: 'Escalated',
    CLOSED: 'Closed',
  };

  transform(status: CaseStatus): string {
    return this.labels[status] || status;
  }
}

@Pipe({ name: 'decisionLabel', standalone: true })
export class DecisionLabelPipe implements PipeTransform {
  private labels: Record<Decision, string> = {
    APPROVE: 'Approve',
    REVIEW: 'Review',
    DECLINE: 'Decline',
  };

  transform(decision: Decision): string {
    return this.labels[decision] || decision;
  }
}

@Pipe({ name: 'transactionStatusLabel', standalone: true })
export class TransactionStatusLabelPipe implements PipeTransform {
  private labels: Record<TransactionStatus, string> = {
    RECEIVED: 'Received',
    SCORING: 'Scoring',
    APPROVED: 'Approved',
    IN_REVIEW: 'In Review',
    DECLINED: 'Declined',
  };

  transform(status: TransactionStatus): string {
    return this.labels[status] || status;
  }
}
