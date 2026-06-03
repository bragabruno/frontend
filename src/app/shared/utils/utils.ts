import { CaseStatus, VALID_TRANSITIONS } from '../models/models';

export function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidTransitions(status: CaseStatus): CaseStatus[] {
  return VALID_TRANSITIONS[status] || [];
}

export function formatSlaDue(slaDueAt: string | null): { text: string; class: string } {
  if (!slaDueAt) return { text: 'No SLA', class: 'text-secondary' };

  const now = Date.now();
  const due = new Date(slaDueAt).getTime();
  const diffMs = due - now;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 0) {
    const overdueHours = Math.floor(Math.abs(diffMinutes) / 60);
    const overdueMins = Math.abs(diffMinutes) % 60;
    return {
      text: `OVERDUE ${overdueHours}h ${overdueMins}m`,
      class: 'sla-overdue',
    };
  }

  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;

  if (hours < 1) {
    return { text: `${mins}m remaining`, class: 'sla-warning' };
  }
  if (hours < 4) {
    return { text: `${hours}h ${mins}m remaining`, class: 'sla-warning' };
  }
  return { text: `${hours}h ${mins}m remaining`, class: 'sla-ok' };
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
