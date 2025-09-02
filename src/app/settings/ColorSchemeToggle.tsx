"use client";

import { useTheme } from "@/components/layout/ThemeProvider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Sun, Moon, Laptop } from "lucide-react";

export default function ColorSchemeToggle() {
  const { scheme, setScheme } = useTheme();

  return (
    <ToggleGroup
      type="single"
      value={scheme}
      onValueChange={(value) => value && setScheme(value as "light" | "dark" | "system")}
      className="color-scheme-toggle bg-background border border-border p-1 theme-radius"
    >
      <ToggleGroupItem
        value="light"
        aria-label="Light mode"
        className="color-scheme-toggle__button"
      >
        <Sun className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="system"
        aria-label="System mode"
        className="color-scheme-toggle__button"
      >
        <Laptop className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="dark"
        aria-label="Dark mode"
        className="color-scheme-toggle__button"
      >
        <Moon className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}


