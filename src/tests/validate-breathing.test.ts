import { isBreathingTechnique, parseBreathingTechniques } from '@/utils/validate-breathing';

describe('validate-breathing (v1 techniques.json)', () => {
  it('accepts a minimal valid technique with explicit holds', () => {
    const t = {
      id: 'box',
      name: 'Box',
      description: 'desc',
      explanation: 'exp',
      when_to_use: 'when',
      phases: { inhale: 4, exhale: 4, hold_in: 4, hold_out: 4 },
      recommended_cycles: 1,
      difficulty: 'beginner' as const,
    };
    expect(isBreathingTechnique(t)).toBe(true);
  });

  it('rejects invalid technique (negative durations, missing fields)', () => {
    const invalid = {
      id: 'bad',
      name: 'Bad',
      description: 'desc',
      explanation: 'exp',
      when_to_use: 'when',
      phases: { inhale: -1, exhale: 4 }, // negative inhale
      recommended_cycles: 1,
      difficulty: 'beginner' as const,
    };
    expect(isBreathingTechnique(invalid)).toBe(false);
  });

  it('parses techniques JSON, filters out invalid entries', () => {
    const json = {
      version: 1,
      techniques: [
        {
          id: 'ok',
          name: 'OK',
          description: 'd',
          explanation: 'e',
          when_to_use: 'w',
          phases: { inhale: 4, exhale: 4 },
          recommended_cycles: 2,
          difficulty: 'intermediate' as const,
        },
        {
          id: 'bad',
          name: 'Bad',
          description: 'd',
          explanation: 'e',
          when_to_use: 'w',
          phases: { inhale: 0, exhale: -1 }, // invalid exhale
          recommended_cycles: 2,
          difficulty: 'beginner' as const,
        },
      ],
    };
    const res = parseBreathingTechniques(json);
    expect(res.version).toBe(1);
    expect(res.techniques).toHaveLength(1);
    expect(res.techniques[0].id).toBe('ok');
  });
});

