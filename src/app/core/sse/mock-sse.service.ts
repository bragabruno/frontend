import { Injectable, signal, OnDestroy } from '@angular/core';
import { CaseSseEvent, CaseSummaryDto } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class MockSseService implements OnDestroy {
  readonly caseUpdates = signal<Map<string, CaseSummaryDto>>(new Map());
  readonly connected = signal(false);

  private interval: ReturnType<typeof setInterval> | null = null;
  private caseIdCounter = 100;

  connect(): void {
    this.connected.set(true);

    this.interval = setInterval(() => {
      const event = this.generateMockEvent();
      this.handleCaseEvent(event);
    }, 5000);
  }

  disconnect(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.connected.set(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private generateMockEvent(): CaseSseEvent {
    this.caseIdCounter++;
    const statuses: CaseSseEvent['status'][] = ['OPEN', 'ASSIGNED', 'IN_REVIEW', 'ESCALATED'];
    const severities: CaseSseEvent['severity'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const eventTypes: CaseSseEvent['eventType'][] = [
      'case_created',
      'case_assigned',
      'case_updated',
      'case_resolved',
    ];

    return {
      eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      caseId: `mock-case-${this.caseIdCounter}`,
      transactionId: `mock-tx-${this.caseIdCounter}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      assigneeId: Math.random() > 0.3 ? 'current-user-id' : null,
      openedAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };
  }

  private handleCaseEvent(event: CaseSseEvent): void {
    this.caseUpdates.update((map) => {
      const newMap = new Map(map);
      const existing = newMap.get(event.caseId);

      if (existing) {
        newMap.set(event.caseId, {
          ...existing,
          status: event.status,
          severity: event.severity,
          assigneeId: event.assigneeId,
        });
      } else {
        newMap.set(event.caseId, {
          id: event.caseId,
          transactionId: event.transactionId,
          riskScoreId: null,
          assigneeId: event.assigneeId,
          status: event.status,
          severity: event.severity,
          openedAt: event.openedAt,
          slaDueAt: null,
          resolvedAt: null,
        });
      }

      return newMap;
    });
  }
}
