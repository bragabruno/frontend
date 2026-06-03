import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  PageResponse,
  UserDto,
  CreateUserRequest,
  RuleDto,
  UpdateRuleRequest,
  ModelVersionDto,
  AuditEventDto,
} from '../../../shared/models/models';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getUsers(page = 0, size = 20) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<UserDto>>(`${environment.apiUrl}/admin/users`, { params });
  }

  createUser(request: CreateUserRequest) {
    return this.http.post<UserDto>(`${environment.apiUrl}/admin/users`, request);
  }

  getRules(page = 0, size = 20) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<RuleDto>>(`${environment.apiUrl}/admin/rules`, { params });
  }

  updateRule(id: string, request: UpdateRuleRequest) {
    return this.http.put<RuleDto>(`${environment.apiUrl}/admin/rules/${id}`, request);
  }

  getModels(page = 0, size = 20) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<ModelVersionDto>>(`${environment.apiUrl}/admin/models`, {
      params,
    });
  }

  getAuditEvents(page = 0, size = 50) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<AuditEventDto>>(`${environment.apiUrl}/audit-events`, {
      params,
    });
  }
}
