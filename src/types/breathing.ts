// Unified 4-phase breathing model (no legacy 'hold')
export type BreathingPhase = 'inhale' | 'hold_in' | 'exhale' | 'hold_out';

export interface BreathingTechnique {
  id: string;
  name: string;
  description: string;
  explanation: string;
  when_to_use: string;
  phases: {
    inhale: number; // seconds
    exhale: number; // seconds
    // Explicit holds:
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
// Backward naming alias (kept for compatibility across files)
export type BreathingPhaseV2 = BreathingPhase;

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

// New directory-based technique schema (per-file JSON in src/data/breathing-techniques)
export type TechniqueMessageType = 'info' | 'warning' | 'success';

export type TechniqueMessageTrigger =
  | { type: 'repetition'; value: number }
  | { type: 'time'; value: number };

export interface TechniqueRound {
  phases: BreathingPattern;
  repetitions: number; // how many times to repeat this round's phases sequence
  label?: string;
  round_messages?: Array<{
    type: TechniqueMessageType;
    text: string;
    trigger?: TechniqueMessageTrigger;
  }>;
}

export interface TechniqueMessages {
  pre_session?: Array<{ type: TechniqueMessageType; text: string }>;
  on_start?: Array<{ type: TechniqueMessageType; text: string }>;
  on_end?: Array<{ type: TechniqueMessageType; text: string }>;
}

export interface BreathingTechniqueV2 {
  id: string;
  name: string;
  estimated_duration_minutes?: number;
  description: string;
  explanation: string;
  when_to_use: string;
  rounds: TechniqueRound[];
  recommended_cycles: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  technique_messages?: TechniqueMessages;
  cautions?: string[];
}

export interface BreathingTechniqueMeta {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_minutes?: number;
}
