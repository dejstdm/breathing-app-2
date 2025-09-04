"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Info, Menu } from "lucide-react";
import { useHeader } from "@/components/layout/HeaderProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/dialog";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const pathname = usePathname();
  const { title, infoItems } = useHeader();

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isBreath = pathname === "/breath";
  const headerTitle = isBreath && title ? title : isBreath ? "Breathing" : "Breathing";

  return (
    <div className="app-shell min-h-dvh bg-background text-foreground">
      <Sheet open={open} onOpenChange={setOpen}>
        <header className={`app-shell__header fixed top-0 inset-x-0 h-14 flex items-center justify-between px-3 border-b border-border z-40 ${isBreath ? 'bg-black/20 backdrop-blur-sm' : 'bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60'}`}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`app-shell__menu-button ${isBreath ? 'text-white hover:bg-white/20' : ''}`}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <div className={`app-shell__title text-base font-medium ${isBreath ? 'text-white' : ''}`}>{headerTitle}</div>
          {isBreath && (infoItems?.length ?? 0) > 0 ? (
            <Button
              variant="ghost"
              size="icon"
              className={`app-shell__info-button ${isBreath ? 'text-white hover:bg-white/20' : ''}`}
              aria-label="Technique info"
              onClick={() => setInfoOpen(true)}
            >
              <Info className="h-4 w-4" />
              <span className="sr-only">Open technique info</span>
            </Button>
          ) : (
            <div className="app-shell__header-spacer w-10" aria-hidden />
          )}
        </header>

        <SheetContent side="left" className="app-shell__drawer w-[82%] max-w-[20rem] p-0">
          <SheetTitle className="sr-only">Main Menu</SheetTitle>
          <SheetDescription className="sr-only">Use the links to navigate between app sections.</SheetDescription>
          <nav className="app-shell__nav pt-14 pb-6 flex flex-col">
            <NavLink href="/" label="Home" onClick={close} active={pathname === "/"} />
            <NavLink href="/breath" label="Breathing" onClick={close} active={pathname === "/breath"} />
            <NavLink href="/settings" label="Settings" onClick={close} active={pathname?.startsWith("/settings") ?? false} />
            <NavLink href="/about" label="About" onClick={close} active={pathname?.startsWith("/about") ?? false} />
          </nav>
        </SheetContent>
      </Sheet>

      <main className="app-shell__main pt-14">{children}</main>

      {/* Info dialog for technique cautions */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className={isBreath ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80" : undefined}>
          <DialogHeader>
            <DialogTitle>Cautions</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {Array.isArray(infoItems) && infoItems.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2 text-sm">
                {infoItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No cautions for this technique.</p>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NavLink({ href, label, active, onClick }: { href: string; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`app-shell__nav-link px-4 py-3 text-base transition flex items-center gap-3 ${
        active ? "app-shell__nav-link--active bg-accent font-medium text-accent-foreground" : "hover:bg-accent/50"
      }`}
    >
      <span className="inline-block size-2 rounded-full bg-current opacity-50" />
      <span>{label}</span>
    </Link>
  );
}
