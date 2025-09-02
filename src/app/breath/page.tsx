"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, X } from "lucide-react";

export default function BreathPage() {
  const [active, setActive] = useState(false);

  return (
    <div className="breath min-h-dvh w-full relative overflow-hidden touch-pan-y">
      {/* Stage */}
      <div className="breath__stage absolute inset-0 flex items-center justify-center">
        <div className="breath__orb relative h-[min(70vh,72vw)] w-[min(70vh,72vw)] max-w-[560px] max-h-[560px] rounded-full border border-black/10 dark:border-white/10 bg-[radial-gradient(circle_at_50%_40%,_color-mix(in_oklab,_var(--primary)_30%,_transparent),_transparent_60%)]">
          {/* Placeholder for upcoming animation */}
        </div>
      </div>

      {/* Start button (center) */}
      {!active && (
        <Button
          size="icon"
          aria-label="Start breathing"
          onClick={() => setActive(true)}
          className="breath__start absolute inset-0 m-auto size-20 rounded-full bg-black/80 text-white shadow-lg hover:bg-black/70 active:scale-[0.98] transition focus-visible:ring-2 focus-visible:ring-white/70"
          
        >
          <Play className="h-7 w-7" />
        </Button>
      )}

      {/* Stop button (top-right X) */}
      {active && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Stop breathing"
          onClick={() => setActive(false)}
          className="breath__stop absolute top-4 right-4 size-10 rounded-full bg-black/70 text-white shadow-md hover:bg-black/60 active:scale-[0.98] transition focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}


