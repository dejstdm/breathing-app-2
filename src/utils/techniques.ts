import fs from 'node:fs';
import path from 'node:path';
import type {
  BreathingPattern,
  BreathingTechniqueMeta,
  BreathingTechniqueV2,
  TechniqueRound,
  TechniqueMessageType,
  TechniqueMessageTrigger,
} from '@/types/breathing';

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'breathing-techniques');

function isFiniteNonNegative(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0;
}

function isPattern(v: unknown): v is BreathingPattern {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    isFiniteNonNegative(o['inhale']) &&
    isFiniteNonNegative(o['hold_in']) &&
    isFiniteNonNegative(o['exhale']) &&
    isFiniteNonNegative(o['hold_out'])
  );
}

function isMessageType(t: unknown): t is TechniqueMessageType {
  return t === 'info' || t === 'warning' || t === 'success';
}

function isTrigger(v: unknown): v is TechniqueMessageTrigger {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  if (o['type'] === 'repetition' && Number.isInteger(o['value'])) return true;
  if (o['type'] === 'time' && isFiniteNonNegative(o['value'])) return true;
  return false;
}

type SimpleMessage = { type: TechniqueMessageType; text: string };
function isSimpleMessage(v: unknown): v is SimpleMessage {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return isMessageType(o['type']) && typeof o['text'] === 'string';
}

type RoundMessage = { type: TechniqueMessageType; text: string; trigger?: TechniqueMessageTrigger };
function isRoundMessage(v: unknown): v is RoundMessage {
  if (!isSimpleMessage(v)) return false;
  const o = v as Record<string, unknown>;
  return o['trigger'] === undefined || isTrigger(o['trigger']);
}

function isRound(v: unknown): v is TechniqueRound {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  const msgs = o['round_messages'];
  const msgsOk =
    msgs === undefined ||
    (Array.isArray(msgs) && msgs.every((m: unknown) => isRoundMessage(m)));
  return (
    isPattern(o['phases']) &&
    Number.isInteger(o['repetitions']) &&
    (o['label'] === undefined || typeof o['label'] === 'string') &&
    msgsOk
  );
}

export function isTechniqueV2(v: unknown): v is BreathingTechniqueV2 {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  const rounds = o['rounds'];
  const tm = o['technique_messages'];
  const cautions = o['cautions'];
  const difficulty = o['difficulty'];
  const diffOk = difficulty === 'beginner' || difficulty === 'intermediate' || difficulty === 'advanced';
  const tmOk: boolean =
    tm === undefined ||
    (tm != null && typeof tm === 'object' &&
      ((): boolean => {
        const tmo = tm as Record<string, unknown>;
        const keys: Array<'pre_session' | 'on_start' | 'on_end'> = ['pre_session', 'on_start', 'on_end'];
        return keys.every((k) => {
          const val = tmo[k];
          return val === undefined || (Array.isArray(val) && (val as unknown[]).every((m) => isSimpleMessage(m)));
        });
      })());
  const cautionsOk = cautions === undefined || (Array.isArray(cautions) && cautions.every((c) => typeof c === 'string'));
  return (
    typeof o['id'] === 'string' &&
    typeof o['name'] === 'string' &&
    typeof o['description'] === 'string' &&
    typeof o['explanation'] === 'string' &&
    typeof o['when_to_use'] === 'string' &&
    Array.isArray(rounds) && rounds.length > 0 && rounds.every(isRound) &&
    Number.isInteger(o['recommended_cycles']) &&
    diffOk &&
    tmOk &&
    cautionsOk &&
    (o['estimated_duration_minutes'] === undefined || isFiniteNonNegative(o['estimated_duration_minutes']))
  );
}

function readJsonFile<T = unknown>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error('Failed to read JSON:', filePath, err);
    return null;
  }
}

export function listTechniqueFiles(): string[] {
  try {
    const files = fs.readdirSync(DATA_DIR);
    return files.filter((f) => f.endsWith('.json')).map((f) => path.join(DATA_DIR, f));
  } catch (err) {
    console.error('Failed to read techniques dir:', DATA_DIR, err);
    return [];
  }
}

export function loadAllTechniques(): BreathingTechniqueV2[] {
  const files = listTechniqueFiles();
  const items: BreathingTechniqueV2[] = [];
  for (const file of files) {
    const data = readJsonFile(file);
    if (isTechniqueV2(data)) items.push(data);
  }
  return items;
}

export function loadTechniqueById(id: string): BreathingTechniqueV2 | null {
  const files = listTechniqueFiles();
  for (const file of files) {
    const data = readJsonFile(file);
    if (isTechniqueV2(data) && data.id === id) return data;
  }
  return null;
}

export function listTechniqueMeta(): BreathingTechniqueMeta[] {
  return loadAllTechniques().map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    difficulty: t.difficulty,
    estimated_duration_minutes: t.estimated_duration_minutes,
  }));
}

// Helper: derive a simple single-round pattern for current animation
export function techniqueFirstRoundPattern(technique: BreathingTechniqueV2): BreathingPattern {
  const first: TechniqueRound | undefined = technique.rounds[0];
  const p = first?.phases;
  return {
    inhale: p?.inhale ?? 0,
    hold_in: p?.hold_in ?? 0,
    exhale: p?.exhale ?? 0,
    hold_out: p?.hold_out ?? 0,
  };
}
