import { http, HttpResponse, delay } from 'msw';
import {
  generateCases,
  generateCaseDetail,
  generateUsers,
  generateRules,
  generateModelVersions,
  generateAuditEvents,
  paginate,
} from './data/generators';
import { CaseStatus, CaseSummaryDto, UserDto, RuleDto } from '../app/shared/models/models';

const MOCK_DELAY = 150;

const allCases = generateCases(25);
const allUsers = generateUsers(15);
const allRules = generateRules(8);
const allModels = generateModelVersions(5);
const allAuditEvents = generateAuditEvents(30);

function parsePage(url: URL): { page: number; size: number } {
  return {
    page: parseInt(url.searchParams.get('page') || '0', 10),
    size: parseInt(url.searchParams.get('size') || '20', 10),
  };
}

function filterCases(url: URL): CaseSummaryDto[] {
  let filtered = [...allCases];

  const status = url.searchParams.get('status');
  if (status) filtered = filtered.filter((c) => c.status === status);

  const severity = url.searchParams.get('severity');
  if (severity) filtered = filtered.filter((c) => c.severity === severity);

  const assigneeId = url.searchParams.get('assigneeId');
  if (assigneeId) filtered = filtered.filter((c) => c.assigneeId === assigneeId);

  filtered.sort((a, b) => {
    const sevOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const sevDiff = sevOrder[a.severity] - sevOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime();
  });

  return filtered;
}

// Tracks the "logged-in" user so /auth/me and session restore reflect the last login.
let currentMockUser: { userId: string; username: string; role: string } = {
  userId: '00000000-0000-0000-0000-000000000001',
  username: 'admin',
  role: 'ADMIN',
};

export const handlers = [
  // Auth
  http.post('/api/auth/login', async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = (await request.json()) as { username: string; password: string };
    if (body.username && body.password) {
      currentMockUser = {
        userId: '00000000-0000-0000-0000-000000000001',
        username: body.username,
        role: body.username === 'admin' ? 'ADMIN' : 'FRAUD_ANALYST',
      };
      return HttpResponse.json({
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        ...currentMockUser,
      });
    }
    return HttpResponse.json(
      { type: 'about:blank', title: 'Unauthorized', status: 401, detail: 'Invalid credentials' },
      { status: 401 },
    );
  }),

  http.post('/api/auth/refresh', async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = (await request.json()) as { refreshToken: string };
    if (body.refreshToken) {
      return HttpResponse.json({
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
      });
    }
    return HttpResponse.json(
      { type: 'about:blank', title: 'Unauthorized', status: 401, detail: 'Invalid refresh token' },
      { status: 401 },
    );
  }),

  // Authoritative identity for session restore (FRAUD-098): the access token is
  // not persisted across reloads, so the SPA re-reads the current user here.
  http.get('/api/auth/me', async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(currentMockUser);
  }),

  http.post('/api/auth/logout', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Cases
  http.get('/api/cases', async ({ request }) => {
    await delay(MOCK_DELAY);
    const url = new URL(request.url);
    const { page, size } = parsePage(url);
    const filtered = filterCases(url);
    return HttpResponse.json(paginate(filtered, page, size));
  }),

  http.get('/api/cases/:id', async ({ params }) => {
    await delay(MOCK_DELAY);
    const id = params['id'] as string;
    const detail = generateCaseDetail({ id });
    return HttpResponse.json(detail);
  }),

  http.put('/api/cases/:id/assign', async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const body = (await request.json()) as { assigneeId: string | null };
    const id = params['id'] as string;
    const caseItem = allCases.find((c) => c.id === id) || generateCases(1)[0];
    const updated = { ...caseItem, assigneeId: body.assigneeId, status: 'ASSIGNED' as CaseStatus };
    return HttpResponse.json(updated);
  }),

  http.put('/api/cases/:id/status', async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const body = (await request.json()) as { status: CaseStatus; note?: string };
    const id = params['id'] as string;
    const caseItem = allCases.find((c) => c.id === id) || generateCases(1)[0];
    const updated = { ...caseItem, status: body.status };
    return HttpResponse.json(updated);
  }),

  http.get('/api/cases/:id/notes', async ({ params }) => {
    await delay(MOCK_DELAY);
    const detail = generateCaseDetail({ id: params['id'] as string });
    return HttpResponse.json(detail.notes);
  }),

  http.post('/api/cases/:id/notes', async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = (await request.json()) as { content: string };
    return HttpResponse.json(
      {
        id: 'note-' + Date.now(),
        caseId: 'case-id',
        authorId: 'user-id',
        content: body.content,
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  http.post('/api/cases/:id/labels', async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = (await request.json()) as { label: string; confidence: number; reason: string };
    return HttpResponse.json(
      {
        id: 'label-' + Date.now(),
        transactionId: 'tx-id',
        caseId: 'case-id',
        analystId: 'user-id',
        label: body.label,
        confidence: body.confidence,
        reason: body.reason,
        labeledAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  // Transactions
  http.get('/api/transactions/:id', async ({ params }) => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(generateCaseDetail({ id: params['id'] as string }).transaction);
  }),

  // Risk Scores
  http.get('/api/risk-scores/:transactionId', async ({ params }) => {
    await delay(MOCK_DELAY);
    const detail = generateCaseDetail({ transactionId: params['transactionId'] as string });
    return HttpResponse.json(detail.riskScore);
  }),

  // Admin
  http.get('/api/admin/users', async ({ request }) => {
    await delay(MOCK_DELAY);
    const url = new URL(request.url);
    const { page, size } = parsePage(url);
    return HttpResponse.json(paginate(allUsers, page, size));
  }),

  http.post('/api/admin/users', async ({ request }) => {
    await delay(MOCK_DELAY);
    const body = (await request.json()) as {
      username: string;
      email: string;
      password: string;
      role: string;
    };
    const newUser: UserDto = {
      id: 'user-' + Date.now(),
      username: body.username,
      email: body.email,
      role: body.role as UserDto['role'],
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json(newUser, { status: 201 });
  }),

  http.get('/api/admin/rules', async ({ request }) => {
    await delay(MOCK_DELAY);
    const url = new URL(request.url);
    const { page, size } = parsePage(url);
    return HttpResponse.json(paginate(allRules, page, size));
  }),

  http.put('/api/admin/rules/:id', async ({ params, request }) => {
    await delay(MOCK_DELAY);
    const body = (await request.json()) as Partial<RuleDto>;
    const id = params['id'] as string;
    const rule = allRules.find((r) => r.id === id) || allRules[0];
    return HttpResponse.json({ ...rule, ...body, updatedAt: new Date().toISOString() });
  }),

  http.get('/api/admin/models', async ({ request }) => {
    await delay(MOCK_DELAY);
    const url = new URL(request.url);
    const { page, size } = parsePage(url);
    return HttpResponse.json(paginate(allModels, page, size));
  }),

  // Audit
  http.get('/api/audit-events', async ({ request }) => {
    await delay(MOCK_DELAY);
    const url = new URL(request.url);
    const { page, size } = parsePage(url);
    return HttpResponse.json(paginate(allAuditEvents, page, size));
  }),

  // Health
  http.get('/actuator/health', () => {
    return HttpResponse.json({
      status: 'UP',
      components: { db: { status: 'UP' }, redis: { status: 'UP' }, kafka: { status: 'UP' } },
    });
  }),
];
