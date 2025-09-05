"use client";

import { useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Info, AlertTriangle, CheckCircle2 } from "lucide-react";

export type ToastMessage = { id: string; type: 'info' | 'warning' | 'success'; text: string; timeoutMs?: number };

export default function MessageCenter({
  items,
  onDismiss,
}: {
  items: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  // Auto-dismiss timers
  useEffect(() => {
    const timers = items.map((m) => {
      const to = window.setTimeout(() => onDismiss(m.id), m.timeoutMs ?? 4000);
      return to;
    });
    return () => timers.forEach(clearTimeout);
  }, [items, onDismiss]);

  return (
    <div
      className="breath__messages pointer-events-none fixed top-2 inset-x-0 z-50 flex flex-col items-center gap-2 px-3"
      role="status"
      aria-live="polite"
    >
      {items.map((m) => (
        <ToastCard key={m.id} type={m.type} text={m.text} />
      ))}
    </div>
  );
}

function ToastCard({ type, text }: { type: 'info' | 'warning' | 'success'; text: string }) {
  const { Icon, classes } = useMemo(() => {
    switch (type) {
      case 'warning':
        return {
          Icon: AlertTriangle,
          classes:
            'border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-100',
        };
      case 'success':
        return {
          Icon: CheckCircle2,
          classes:
            'border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100',
        };
      case 'info':
      default:
        return {
          Icon: Info,
          classes:
            'border-sky-300 bg-sky-100 text-sky-900 dark:border-sky-700 dark:bg-sky-900/40 dark:text-sky-100',
        };
    }
  }, [type]);

  return (
    <Card className={`breath__messages__item pointer-events-auto flex items-start gap-2 rounded-md border-l-4 px-3 py-2 w-full max-w-sm shadow ${classes}`}>
      <Icon className="h-5 w-5 mt-0.5 shrink-0" />
      <div className="text-sm leading-5">{text}</div>
    </Card>
  );
}
