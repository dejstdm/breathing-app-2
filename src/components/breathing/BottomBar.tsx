"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Info, Play, Pause, Settings as SettingsIcon, AlertTriangle, CheckCircle2 } from "lucide-react";

type Message = { type: 'info' | 'warning' | 'success'; text: string };

export default function BottomBar({
  isRunning,
  preSession,
  onPlay,
  onPause,
}: {
  isRunning: boolean;
  preSession: Message[] | undefined;
  onPlay: () => void;
  onPause: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasInfo = (preSession?.length ?? 0) > 0;

  const items = useMemo(() => preSession ?? [], [preSession]);

  return (
    <div className="breath__nav fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="breath__nav__inner mx-auto max-w-screen-sm px-3 py-2 flex items-center justify-center">
        <div className="breath__nav__group flex items-center gap-6">
          {/* Settings */}
          <Link href="/settings" className="breath__nav__settings-link inline-flex">
            <Button className="breath__nav__settings-button h-12 w-12 [&_svg]:!size-6" variant="ghost" size="icon" aria-label="Settings">
              <SettingsIcon />
            </Button>
          </Link>

          {/* Large round Play/Pause */}
          {isRunning ? (
            <Button
              onClick={onPause}
              aria-label="Pause session"
              className="breath__nav__play-button breath__nav__play-button--running h-12 w-12 rounded-full shadow-lg flex items-center justify-center [&_svg]:!size-6"
            >
              <Pause />
            </Button>
          ) : (
            <Button
              onClick={onPlay}
              aria-label="Start session"
              className="breath__nav__play-button h-12 w-12 rounded-full shadow-lg flex items-center justify-center [&_svg]:!size-6"
            >
              <Play />
            </Button>
          )}

          {/* Info */}
          {hasInfo ? (
            <Button className="breath__nav__info-button h-12 w-12 [&_svg]:!size-6" variant="ghost" size="icon" aria-label="Technique info" onClick={() => setOpen(true)}>
              <Info />
            </Button>
          ) : (
            <span className="breath__nav__spacer w-10" aria-hidden />
          )}
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="breath__info__sheet max-h-[70vh] overflow-y-auto">
          <SheetHeader className="breath__info__header">
            <SheetTitle className="breath__info__title">Before You Start</SheetTitle>
          </SheetHeader>
          <div className="breath__pre-session mt-3 pb-4 space-y-3">
            {items.map((m, i) => (
              <MessageCard key={i} message={m} />)
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MessageCard({ message }: { message: Message }) {
  const { Icon, classes } = useMemo(() => {
    switch (message.type) {
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
  }, [message.type]);

  return (
    <div className={`breath__pre-session__item breath__pre-session__item--${message.type} flex items-start gap-3 rounded-md border-l-4 px-3 py-2 ${classes}`}>
      <Icon className="breath__pre-session__icon h-5 w-5 mt-0.5 shrink-0" />
      <div className="breath__pre-session__text text-sm leading-5">{message.text}</div>
    </div>
  );
}
