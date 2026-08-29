"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Briefcase } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { NAV_ICONS } from "@/components/layout/nav-icon";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PRIMARY = NAV_ITEMS.slice(0, 4);
const OVERFLOW = NAV_ITEMS.slice(4);

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Briefcase className="size-3.5" />
        </div>
        <p className="text-sm font-semibold">Job Hunt Command Center</p>
      </div>
      <ThemeToggle />
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const overflowActive = OVERFLOW.some((i) => pathname.startsWith(i.href));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-border bg-background/95 backdrop-blur md:hidden pb-[env(safe-area-inset-bottom)]">
        {PRIMARY.map((item) => {
          const Icon = NAV_ICONS[item.icon];
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
            overflowActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Menu className="size-5" />
          More
        </button>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>More</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {OVERFLOW.map((item) => {
              const Icon = NAV_ICONS[item.icon];
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border border-border py-4 text-xs font-medium",
                    active ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
