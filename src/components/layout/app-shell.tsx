import type React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader, MobileBottomNav } from "@/components/layout/mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
