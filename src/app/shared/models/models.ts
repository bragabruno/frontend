export type Role = 'ADMIN' | 'FRAUD_ANALYST' | 'INVESTIGATOR' | 'AUDITOR' | 'SYSTEM_ACCOUNT';
export type UserStatus = 'ACTIVE' | 'DISABLED';
export type TransactionStatus = 'RECEIVED' | 'SCORING' | 'APPROVED' | 'IN_REVIEW' | 'DECLINED';
export type Decision = 'APPROVE' | 'REVIEW' | 'DECLINE';
export type CaseStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_REVIEW'
  | 'RESOLVED_FRAUD'
  | 'RESOLVED_LEGIT'
  | 'ESCALATED'
  | 'CLOSED';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type LabelType = 'FRAUD' | 'LEGITIMATE';
export type ModelStatus = 'REGISTERED' | 'APPROVED' | 'DEPLOYED' | 'ROLLED_BACK' | 'ARCHIVED';
export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH';

export interface CurrentUser {
  userId: string;
  username: string;
  role: Role;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  role: Role;
  userId: string;
  username: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface TransactionDto {
  id: string;
  userId: string;
  merchantId: string;
  deviceId: string;
  amount: number;
  currency: string;
  ipAddress: string;
  country: string;
  status: TransactionStatus;
  idempotencyKey: string;
  createdAt: string;
  latestRiskScore: RiskScoreDto | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CaseSummaryDto {
  id: string;
  transactionId: string;
  riskScoreId: string | null;
  assigneeId: string | null;
  status: CaseStatus;
  severity: Severity;
  openedAt: string;
  slaDueAt: string | null;
  resolvedAt: string | null;
}

export interface CaseDetailDto {
  id: string;
  transactionId: string;
  riskScoreId: string | null;
  assigneeId: string | null;
  status: CaseStatus;
  severity: Severity;
  openedAt: string;
  slaDueAt: string | null;
  resolvedAt: string | null;
  transaction: TransactionDto;
  riskScore: RiskScoreDto;
  notes: NoteDto[];
  labels: LabelDto[];
}

export interface AssignRequest {
  assigneeId: string | null;
}

export interface StatusTransitionRequest {
  status: CaseStatus;
  note?: string;
}

export interface NoteDto {
  id: string;
  caseId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface CreateNoteRequest {
  content: string;
}

export interface CreateLabelRequest {
  label: LabelType;
  confidence: number;
  reason: string;
}

export interface LabelDto {
  id: string;
  transactionId: string;
  caseId: string;
  analystId: string;
  label: LabelType;
  confidence: number;
  reason: string;
  labeledAt: string;
}

export interface CaseSseEvent {
  eventType: 'case_created' | 'case_assigned' | 'case_updated' | 'case_resolved';
  caseId: string;
  transactionId: string;
  status: CaseStatus;
  severity: Severity;
  assigneeId: string | null;
  openedAt: string;
  timestamp: string;
}

export interface RiskScoreDto {
  id: string;
  transactionId: string;
  modelVersionId: string;
  mlScore: number;
  rulesScore: number;
  aggregateScore: number;
  decision: Decision;
  degradedMode: boolean;
  reasonCodes: string[];
  createdAt: string;
}

export interface UserDto {
  id: string;
  username: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: Role;
}

export interface RuleDto {
  id: string;
  name: string;
  type: 'VELOCITY' | 'DEVICE' | 'GEO' | 'MERCHANT' | 'AMOUNT';
  enabled: boolean;
  weight: number;
  threshold: number;
  description: string;
  updatedAt: string;
}

export interface UpdateRuleRequest {
  enabled?: boolean;
  weight?: number;
  threshold?: number;
}

export interface ModelVersionDto {
  id: string;
  version: string;
  status: ModelStatus;
  deployedAt: string | null;
  metrics: {
    prAuc: number;
    rocAuc: number;
    recall: number;
    fpr: number;
  };
}

export interface AuditEventDto {
  id: string;
  actorId: string;
  actorUsername: string;
  action: string;
  targetType: string;
  targetId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  timestamp: string;
}

export interface HealthResponse {
  status: 'UP' | 'DOWN';
  components: {
    db?: { status: string };
    redis?: { status: string };
    kafka?: { status: string };
  };
}

export const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  OPEN: ['ASSIGNED'],
  ASSIGNED: ['IN_REVIEW'],
  IN_REVIEW: ['RESOLVED_FRAUD', 'RESOLVED_LEGIT', 'ESCALATED'],
  ESCALATED: ['IN_REVIEW', 'RESOLVED_FRAUD', 'RESOLVED_LEGIT'],
  RESOLVED_FRAUD: ['CLOSED'],
  RESOLVED_LEGIT: ['CLOSED'],
  CLOSED: [],
};

export function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
