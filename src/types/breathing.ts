export type BreathingPhase = 'inhale' | 'hold' | 'exhale';

export interface BreathingTechnique {
  id: string;
  name: string;
  description: string;
  explanation: string;
  when_to_use: string;
  phases: {
    inhale: number; // seconds
    exhale: number; // seconds
    // Back-compat single hold (after inhale):
    hold?: number; // seconds
    // V2 explicit holds:
    hold_in?: number; // seconds (after inhale)
    hold_out?: number; // seconds (after exhale)
  };
  recommended_cycles: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface BreathingAnimationProps {
  technique: BreathingTechnique;
  isActive: boolean;
  currentPhase: BreathingPhase;
  onPhaseChange?: (phase: BreathingPhase) => void;
}

// V2: Four-phase breathing pattern with two holds
export type BreathingPhaseV2 = 'inhale' | 'hold_in' | 'exhale' | 'hold_out';

export interface BreathingPattern {
  inhale: number; // seconds
  hold_in: number; // seconds (after inhale)
  exhale: number; // seconds
  hold_out: number; // seconds (after exhale)
}

export interface BreathingAnimationV2Props {
  pattern: BreathingPattern;
  isActive: boolean;
  currentPhase: BreathingPhaseV2;
  onPhaseChange?: (phase: BreathingPhaseV2) => void;
}

// Robust program model for complex techniques (e.g., Wim Hof)
export interface BreathingProgramMeta {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export type ProgramStep =
  | {
      type: 'pattern';
      label?: string;
      pattern: BreathingPattern;
      repeat?: number; // times to repeat this step (default 1)
    }
  | {
      type: 'instruction';
      text: string;
      waitForUser?: boolean; // if true, requires user action to proceed
    }
  | {
      type: 'retention';
      // Retention after exhale: user-held or timed
      max?: number; // optional max seconds
      guided?: boolean; // if true, we provide ticking/visual guide
      waitForUser?: boolean; // advance on user action (URGE)
    }
  | {
      type: 'recovery';
      pattern: BreathingPattern; // usually a single deep inhale + short hold
      label?: string;
    };

export interface BreathingProgram extends BreathingProgramMeta {
  version: number;
  steps: ProgramStep[];
}
