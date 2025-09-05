"use client";

export default function CycleChip({ value }: { value: number }) {
  return (
    <div className="breath__cycle fixed right-3 top-16 z-40">
      <div className="breath__cycle__chip text-xs rounded-full px-3 py-1 border border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        Cycle {value}
      </div>
    </div>
  );
}

