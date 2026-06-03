import { Injectable, signal } from '@angular/core';
import { CaseSseEvent, CaseSummaryDto } from '../../shared/models/models';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SseService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly caseUpdates = signal<Map<string, CaseSummaryDto>>(new Map());
  readonly connected = signal(false);

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.eventSource) {
      this.disconnect();
    }

    const token = this.authService.getToken();
    if (!token) return;

    const url = `${environment.apiUrl}/cases/stream`;

    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      this.connected.set(true);
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    this.eventSource.addEventListener('case_created', (event) => {
      const data = JSON.parse(event.data) as CaseSseEvent;
      this.handleCaseEvent(data);
    });

    this.eventSource.addEventListener('case_assigned', (event) => {
      const data = JSON.parse(event.data) as CaseSseEvent;
      this.handleCaseEvent(data);
    });

    this.eventSource.addEventListener('case_updated', (event) => {
      const data = JSON.parse(event.data) as CaseSseEvent;
      this.handleCaseEvent(data);
    });

    this.eventSource.addEventListener('case_resolved', (event) => {
      const data = JSON.parse(event.data) as CaseSseEvent;
      this.handleCaseEvent(data);
    });

    this.eventSource.onerror = () => {
      this.connected.set(false);
      this.stopHeartbeat();
      this.reconnect();
    };
  }

  disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
    this.connected.set(false);
    this.stopHeartbeat();
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

  private reconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);

    setTimeout(() => this.connect(), delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimeout = setTimeout(() => {
      if (this.eventSource?.readyState === EventSource.OPEN) {
        this.startHeartbeat();
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }
}
