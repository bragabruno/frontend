import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  CaseSummaryDto,
  CaseDetailDto,
  PageResponse,
  CaseStatus,
  Severity,
  AssignRequest,
  StatusTransitionRequest,
  NoteDto,
  CreateNoteRequest,
  LabelDto,
  CreateLabelRequest,
} from '../../../shared/models/models';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CasesService {
  constructor(private http: HttpClient) {}

  getCases(params: {
    page?: number;
    size?: number;
    status?: CaseStatus;
    severity?: Severity;
    assigneeId?: string;
  }) {
    let httpParams = new HttpParams()
      .set('page', (params.page ?? 0).toString())
      .set('size', (params.size ?? 20).toString());

    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.severity) httpParams = httpParams.set('severity', params.severity);
    if (params.assigneeId) httpParams = httpParams.set('assigneeId', params.assigneeId);

    return this.http.get<PageResponse<CaseSummaryDto>>(`${environment.apiUrl}/cases`, {
      params: httpParams,
    });
  }

  getCase(id: string) {
    return this.http.get<CaseDetailDto>(`${environment.apiUrl}/cases/${id}`);
  }

  assignCase(id: string, assigneeId: string | null) {
    return this.http.put<CaseSummaryDto>(`${environment.apiUrl}/cases/${id}/assign`, {
      assigneeId,
    } as AssignRequest);
  }

  transitionStatus(id: string, status: CaseStatus, note?: string) {
    return this.http.put<CaseSummaryDto>(`${environment.apiUrl}/cases/${id}/status`, {
      status,
      note,
    } as StatusTransitionRequest);
  }

  getNotes(caseId: string) {
    return this.http.get<NoteDto[]>(`${environment.apiUrl}/cases/${caseId}/notes`);
  }

  addNote(caseId: string, content: string) {
    return this.http.post<NoteDto>(`${environment.apiUrl}/cases/${caseId}/notes`, {
      content,
    } as CreateNoteRequest);
  }

  getLabels(caseId: string) {
    return this.http.get<LabelDto[]>(`${environment.apiUrl}/cases/${caseId}/labels`);
  }

  addLabel(caseId: string, label: string, confidence: number, reason: string) {
    return this.http.post<LabelDto>(`${environment.apiUrl}/cases/${caseId}/labels`, {
      label,
      confidence,
      reason,
    } as CreateLabelRequest);
  }
}
