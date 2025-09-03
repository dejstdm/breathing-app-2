import type { BreathingTechnique } from "@/types/breathing";

type RawTechniques = {
  version: number;
  techniques: unknown;
};

function isFinitePositive(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

export function isBreathingTechnique(value: unknown): value is BreathingTechnique {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const phases = v["phases"] as Record<string, unknown> | undefined;
  return (
    typeof v["id"] === "string" &&
    typeof v["name"] === "string" &&
    typeof v["description"] === "string" &&
    typeof v["explanation"] === "string" &&
    typeof v["when_to_use"] === "string" &&
    typeof phases === "object" &&
    phases !== null &&
    // Required core timings
    isFinitePositive(phases["inhale"]) &&
    isFinitePositive(phases["exhale"]) &&
    // Optional holds (v1 & v2)
    (phases["hold"] === undefined || isFinitePositive(phases["hold"])) &&
    (phases["hold_in"] === undefined || isFinitePositive(phases["hold_in"])) &&
    (phases["hold_out"] === undefined || isFinitePositive(phases["hold_out"])) &&
    // Other fields
    (v["difficulty"] === "beginner" || v["difficulty"] === "intermediate" || v["difficulty"] === "advanced") &&
    isFinitePositive(v["recommended_cycles"]) &&
    Number.isInteger(v["recommended_cycles"])
  );
}

export function parseBreathingTechniques(json: unknown): {
  version: number;
  techniques: BreathingTechnique[];
} {
  const raw = json as RawTechniques;
  if (!raw || typeof raw !== "object" || typeof raw.version !== "number") {
    throw new Error("Invalid breathing techniques file: missing version");
  }
  if (!Array.isArray((raw as any).techniques)) {
    throw new Error("Invalid breathing techniques file: techniques must be an array");
  }

  const techniques = (raw as any).techniques.filter(isBreathingTechnique) as BreathingTechnique[];
  if (techniques.length === 0) {
    throw new Error("No valid breathing techniques found");
  }

  return { version: raw.version, techniques };
}
