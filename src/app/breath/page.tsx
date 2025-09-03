"use client";

import { useMemo } from "react";
import BreathingAnimationV3 from "@/components/breathing/BreathingAnimationV3";
import data from "@/data/breathing-techniques.json";
import { parseBreathingTechniques } from "@/utils/validate-breathing";
import type { BreathingPattern } from "@/types/breathing";

export default function BreathPage() {
  const { techniques } = useMemo(() => parseBreathingTechniques(data), []);
  const technique = techniques[0];
  // Derive V2 pattern from SSOT JSON (supports 0s holds)
  const pattern: BreathingPattern = useMemo(
    () => ({
      inhale: technique.phases.inhale,
      hold_in: technique.phases.hold_in ?? 0,
      exhale: technique.phases.exhale,
      hold_out: technique.phases.hold_out ?? 0,
    }),
    [technique]
  );

  return (
    <div className="breath min-h-dvh w-full relative overflow-hidden touch-pan-y flex items-center justify-center">
      <BreathingAnimationV3
        pattern={pattern}
      />
    </div>
  );
}
