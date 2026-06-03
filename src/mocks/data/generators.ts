import {
  CaseSummaryDto,
  CaseStatus,
  Severity,
  CaseDetailDto,
  TransactionDto,
  RiskScoreDto,
  NoteDto,
  LabelDto,
  UserDto,
  RuleDto,
  AuditEventDto,
  ModelVersionDto,
  PageResponse,
} from '../../app/shared/models/models';

let seed = 42;

function random(): number {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(random() * arr.length)];
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(Math.floor(random() * 24), Math.floor(random() * 60), Math.floor(random() * 60));
  return d.toISOString();
}

function isoDateFuture(hoursFromNow: number): string {
  const d = new Date();
  d.setHours(d.getHours() + hoursFromNow);
  return d.toISOString();
}

const STATUSES: CaseStatus[] = [
  'OPEN',
  'ASSIGNED',
  'IN_REVIEW',
  'RESOLVED_FRAUD',
  'RESOLVED_LEGIT',
  'ESCALATED',
  'CLOSED',
];
const SEVERITIES: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const USERS = ['alice', 'bob', 'carol', 'dave', 'eve', 'frank'];
const COUNTRIES = ['US', 'GB', 'DE', 'FR', 'JP', 'BR', 'IN', 'AU'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY'];

export function generateCase(overrides?: Partial<CaseSummaryDto>): CaseSummaryDto {
  const severity = pick(SEVERITIES);
  const status = pick(STATUSES);
  const openedAt = isoDate(Math.floor(random() * 14));

  return {
    id: uuid(),
    transactionId: uuid(),
    riskScoreId: uuid(),
    assigneeId: status !== 'OPEN' ? pick(USERS) : null,
    status,
    severity,
    openedAt,
    slaDueAt:
      status !== 'CLOSED' && status !== 'RESOLVED_FRAUD' && status !== 'RESOLVED_LEGIT'
        ? isoDateFuture(Math.floor(random() * 48) - 12)
        : null,
    resolvedAt:
      status.startsWith('RESOLVED') || status === 'CLOSED'
        ? isoDate(Math.floor(random() * 3))
        : null,
    ...overrides,
  };
}

export function generateCases(count: number): CaseSummaryDto[] {
  seed = 42;
  return Array.from({ length: count }, () => generateCase());
}

export function generateCaseDetail(overrides?: Partial<CaseDetailDto>): CaseDetailDto {
  const caseSummary = generateCase();
  const amount = Math.round(random() * 10000 * 100) / 100;

  return {
    ...caseSummary,
    transaction: generateTransaction(caseSummary.transactionId, amount),
    riskScore: generateRiskScore(caseSummary.transactionId),
    notes: generateNotes(3),
    labels: [],
    ...overrides,
  };
}

export function generateTransaction(id?: string, amount?: number): TransactionDto {
  return {
    id: id || uuid(),
    userId: uuid(),
    merchantId: uuid(),
    deviceId: uuid(),
    amount: amount || Math.round(random() * 10000 * 100) / 100,
    currency: pick(CURRENCIES),
    ipAddress: `${Math.floor(random() * 255)}.${Math.floor(random() * 255)}.${Math.floor(random() * 255)}.${Math.floor(random() * 255)}`,
    country: pick(COUNTRIES),
    status: pick(['RECEIVED', 'SCORING', 'APPROVED', 'IN_REVIEW', 'DECLINED'] as const),
    idempotencyKey: uuid(),
    createdAt: isoDate(Math.floor(random() * 7)),
    latestRiskScore: null,
  };
}

export function generateRiskScore(transactionId?: string): RiskScoreDto {
  const mlScore = Math.round(random() * 100) / 100;
  const rulesScore = Math.round(random() * 100) / 100;
  const aggregateScore = Math.round((mlScore * 0.7 + rulesScore * 0.3) * 100) / 100;

  return {
    id: uuid(),
    transactionId: transactionId || uuid(),
    modelVersionId: uuid(),
    mlScore,
    rulesScore,
    aggregateScore,
    decision: aggregateScore > 0.7 ? 'DECLINE' : aggregateScore > 0.4 ? 'REVIEW' : 'APPROVE',
    degradedMode: random() > 0.9,
    reasonCodes: pick([
      ['VELOCITY_HIGH'],
      ['DEVICE_UNKNOWN', 'GEO_MISMATCH'],
      ['AMOUNT_ANOMALY'],
      ['MERCHANT_BLACKLIST'],
      ['MULTIPLE_DEVICES'],
    ]),
    createdAt: isoDate(Math.floor(random() * 7)),
  };
}

export function generateNotes(count: number): NoteDto[] {
  const contents = [
    'Transaction flagged due to unusual velocity pattern.',
    'Customer called to verify — confirmed legitimate purchase.',
    'Device fingerprint matches known fraud ring.',
    'IP geolocation mismatch with billing address.',
    'Amount exceeds typical customer spending by 5x.',
    'Cross-referenced with similar cases — pattern confirmed.',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: uuid(),
    caseId: uuid(),
    authorId: pick(USERS),
    content: contents[i % contents.length],
    createdAt: isoDate(i),
  }));
}

export function generateLabel(overrides?: Partial<LabelDto>): LabelDto {
  return {
    id: uuid(),
    transactionId: uuid(),
    caseId: uuid(),
    analystId: pick(USERS),
    label: pick(['FRAUD', 'LEGITIMATE'] as const),
    confidence: Math.round(random() * 40 + 60) / 100,
    reason: pick([
      'Confirmed fraud based on device fingerprint analysis.',
      'Legitimate purchase verified with customer.',
      'High confidence fraud — multiple risk indicators.',
    ]),
    labeledAt: isoDate(Math.floor(random() * 3)),
    ...overrides,
  };
}

export function generateUser(overrides?: Partial<UserDto>): UserDto {
  const username = pick(USERS);
  return {
    id: uuid(),
    username,
    email: `${username}@frauddetection.com`,
    role: pick(['ADMIN', 'FRAUD_ANALYST', 'INVESTIGATOR', 'AUDITOR'] as const),
    status: pick(['ACTIVE', 'DISABLED'] as const),
    createdAt: isoDate(Math.floor(random() * 365)),
    ...overrides,
  };
}

export function generateUsers(count: number): UserDto[] {
  return Array.from({ length: count }, () => generateUser());
}

export function generateRule(overrides?: Partial<RuleDto>): RuleDto {
  return {
    id: uuid(),
    name: pick([
      'Velocity Check',
      'Device Fingerprint',
      'Geo Location',
      'Merchant Risk',
      'Amount Threshold',
    ]),
    type: pick(['VELOCITY', 'DEVICE', 'GEO', 'MERCHANT', 'AMOUNT'] as const),
    enabled: random() > 0.2,
    weight: Math.round(random() * 100) / 100,
    threshold: Math.round(random() * 1000),
    description: pick([
      'Limits transactions per time window.',
      'Flags new or unknown device fingerprints.',
      'Checks IP geolocation against billing country.',
      'Blocks high-risk merchant categories.',
      'Flags transactions exceeding amount threshold.',
    ]),
    updatedAt: isoDate(Math.floor(random() * 30)),
    ...overrides,
  };
}

export function generateRules(count: number): RuleDto[] {
  return Array.from({ length: count }, () => generateRule());
}

export function generateAuditEvent(overrides?: Partial<AuditEventDto>): AuditEventDto {
  return {
    id: uuid(),
    actorId: uuid(),
    actorUsername: pick(USERS),
    action: pick([
      'STATUS_TRANSITION',
      'CASE_ASSIGNED',
      'LABEL_ADDED',
      'RULE_UPDATED',
      'USER_CREATED',
    ]),
    targetType: pick(['Case', 'Rule', 'User', 'Label']),
    targetId: uuid(),
    before: { status: 'OPEN' },
    after: { status: 'ASSIGNED' },
    timestamp: isoDate(Math.floor(random() * 7)),
    ...overrides,
  };
}

export function generateAuditEvents(count: number): AuditEventDto[] {
  return Array.from({ length: count }, () => generateAuditEvent());
}

export function generateModelVersion(overrides?: Partial<ModelVersionDto>): ModelVersionDto {
  return {
    id: uuid(),
    version: `v${Math.floor(random() * 3) + 1}.${Math.floor(random() * 10)}.${Math.floor(random() * 20)}`,
    status: pick(['REGISTERED', 'APPROVED', 'DEPLOYED', 'ROLLED_BACK', 'ARCHIVED'] as const),
    deployedAt: random() > 0.3 ? isoDate(Math.floor(random() * 30)) : null,
    metrics: {
      prAuc: Math.round(random() * 20 + 75) / 100,
      rocAuc: Math.round(random() * 15 + 80) / 100,
      recall: Math.round(random() * 30 + 60) / 100,
      fpr: Math.round(random() * 10 + 2) / 100,
    },
    ...overrides,
  };
}

export function generateModelVersions(count: number): ModelVersionDto[] {
  return Array.from({ length: count }, () => generateModelVersion());
}

export function paginate<T>(items: T[], page: number, size: number): PageResponse<T> {
  const start = page * size;
  const content = items.slice(start, start + size);
  return {
    content,
    page,
    size,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size),
  };
}
