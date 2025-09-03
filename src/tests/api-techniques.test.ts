// Mock Next.js server helpers to avoid depending on global fetch/Response
class SimpleResponse {
  status: number;
  private _raw: string;
  constructor(body: unknown, init?: { status?: number }) {
    this._raw = typeof body === 'string' ? body : JSON.stringify(body);
    this.status = init?.status ?? 200;
  }
  async json() {
    return JSON.parse(this._raw);
  }
}

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: any) => new SimpleResponse(body, init) as unknown as Response,
  },
}));

import { GET as getList } from '@/app/api/techniques/route';

jest.mock('@/utils/techniques', () => ({
  listTechniqueMeta: jest.fn(() => [
    { id: 'box_breathing', name: 'Box Breathing', description: 'desc', difficulty: 'beginner' as const, estimated_duration_minutes: 5 },
    { id: 'breathing_478', name: '4-7-8', description: 'desc', difficulty: 'intermediate' as const, estimated_duration_minutes: 3 },
  ]),
}));

describe('/api/techniques', () => {
  it('returns list of techniques metadata', async () => {
    const res = await getList();
    expect(res.status).toBe(200);
    const body = (await (res as Response).json()) as any;
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items).toHaveLength(2);
    expect(body.items[0]).toMatchObject({ id: 'box_breathing', name: 'Box Breathing' });
  });
});
