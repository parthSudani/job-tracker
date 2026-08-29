"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "system", icon: Monitor, label: "System" },
  { value: "dark", icon: Moon, label: "Dark" },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  // Standard next-themes hydration guard: the server can't know the client's
  // stored theme preference, so the active button is only shown once we're
  // past hydration — not a prop-driven reset, so a `key` remount doesn't apply.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), []);

  return (
    <div className={cn("inline-flex items-center rounded-lg border border-border bg-muted/50 p-0.5", className)}>
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = mounted && (theme ?? "system") === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            aria-label={opt.label}
            aria-pressed={active}
            className={cn(
              "flex size-7 items-center justify-center rounded-md transition-colors",
              active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
