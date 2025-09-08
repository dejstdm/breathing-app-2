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
    json: (body: unknown, init?: ResponseInit) => new SimpleResponse(body, init) as unknown as Response,
  },
}));

import { GET as getById } from '@/app/api/techniques/[id]/route';

const mockLoad = jest.fn();
jest.mock('@/utils/techniques', () => ({
  loadTechniqueById: (id: string) => mockLoad(id),
}));

describe('/api/techniques/[id]', () => {
  it('returns 200 with technique when found', async () => {
    mockLoad.mockImplementationOnce((id: string) => ({ id, name: 'Box', description: 'd', explanation: 'e', when_to_use: 'w', rounds: [], recommended_cycles: 1, difficulty: 'beginner' }));
    const res = await getById({} as Request, { params: Promise.resolve({ id: 'box_breathing' }) } as { params: Promise<{ id: string }> });
    expect(res.status).toBe(200);
    const body = await (res as Response).json();
    expect(body).toMatchObject({ id: 'box_breathing' });
  });

  it('returns 404 when not found', async () => {
    mockLoad.mockImplementationOnce(() => null);
    const res = await getById({} as Request, { params: Promise.resolve({ id: 'unknown' }) } as { params: Promise<{ id: string }> });
    expect(res.status).toBe(404);
  });
});
