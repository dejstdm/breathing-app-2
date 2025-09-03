import fs from 'node:fs';
import path from 'node:path';
import { listTechniqueMeta, loadTechniqueById } from '@/utils/techniques';

describe('techniques fs-backed loaders', () => {
  const readDirSpy = jest.spyOn(fs, 'readdirSync');
  const readFileSpy = jest.spyOn(fs, 'readFileSync');
  let errSpy: jest.SpyInstance;

  afterEach(() => {
    jest.clearAllMocks();
    if (errSpy) errSpy.mockRestore();
  });

  it('reads directory, ignores invalid JSON, returns meta from valid files', () => {
    // Silence expected JSON parse errors from invalid stub
    errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Stub directory listing
    readDirSpy.mockReturnValue(['a.json', 'b.json', 'bad.txt', 'c.json'] as unknown as fs.Dirent[]);
    // Map file -> contents
    const base = path.join(process.cwd(), 'src', 'data', 'breathing-techniques');
    const map = new Map<string, string>([
      [path.join(base, 'a.json'), JSON.stringify({
        id: 'box', name: 'Box', description: 'd', explanation: 'e', when_to_use: 'w',
        rounds: [{ phases: { inhale: 4, hold_in: 4, exhale: 4, hold_out: 4 }, repetitions: 1 }],
        recommended_cycles: 1, difficulty: 'beginner'
      })],
      [path.join(base, 'b.json'), 'not-json'], // invalid
      [path.join(base, 'c.json'), JSON.stringify({
        id: 'bad', name: 'Bad', description: 'd', explanation: 'e', when_to_use: 'w',
        rounds: [{ phases: { inhale: 4, hold_in: 0, exhale: -1, hold_out: 0 }, repetitions: 1 }], // invalid exhale
        recommended_cycles: 1, difficulty: 'beginner'
      })],
    ]);
    readFileSpy.mockImplementation((filePath: any) => {
      const s = map.get(filePath as string);
      if (s == null) throw new Error('ENOENT');
      return s as unknown as Buffer;
    });

    const meta = listTechniqueMeta();
    expect(meta.map((m) => m.id)).toEqual(['box']);

    const full = loadTechniqueById('box');
    expect(full?.id).toBe('box');
    expect(loadTechniqueById('missing')).toBeNull();
  });
});
