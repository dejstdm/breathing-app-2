import { isTechniqueV2, techniqueFirstRoundPattern } from '@/utils/techniques';
import type { BreathingTechniqueV2 } from '@/types/breathing';

describe('techniques (directory-based schema)', () => {
  const valid: BreathingTechniqueV2 = {
    id: 'box_breathing',
    name: 'Box Breathing',
    description: 'desc',
    explanation: 'exp',
    when_to_use: 'when',
    rounds: [
      {
        phases: { inhale: 4, hold_in: 4, exhale: 4, hold_out: 4 },
        repetitions: 10,
        label: 'Round 1',
        round_messages: [
          { type: 'info', text: 'steady' },
          { type: 'warning', text: 'careful', trigger: { type: 'time', value: 3 } },
        ],
      },
    ],
    recommended_cycles: 1,
    difficulty: 'beginner',
    technique_messages: { pre_session: [{ type: 'info', text: 'sit upright' }] },
    cautions: ['stop if dizzy'],
  };

  it('accepts a valid technique object', () => {
    expect(isTechniqueV2(valid)).toBe(true);
  });

  it('rejects invalid technique (bad trigger type, negative durations)', () => {
    const bad1 = { ...valid, rounds: [{ ...valid.rounds[0], phases: { inhale: 4, hold_in: 4, exhale: -1, hold_out: 4 } }] };
    const bad2 = { ...valid, rounds: [{ ...valid.rounds[0], round_messages: [{ type: 'info', text: 'ok', trigger: { type: 'oops', value: 1 } }] }] };
    expect(isTechniqueV2(bad1)).toBe(false);
    // The type assertion bypassed TS; runtime guard should reject
    expect(isTechniqueV2(bad2 as unknown)).toBe(false);
  });

  it('derives first-round pattern correctly', () => {
    const p = techniqueFirstRoundPattern(valid);
    expect(p).toEqual({ inhale: 4, hold_in: 4, exhale: 4, hold_out: 4 });
  });
});
