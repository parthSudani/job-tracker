"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickAddModal } from "@/components/platforms/quick-add-modal";

export function PlatformAddButton({
  platform,
  todayCount,
}: {
  platform: { id: string; name: string };
  todayCount: number;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Add Applications
      </Button>
      <QuickAddModal open={open} onOpenChange={setOpen} platform={platform} initialCount={todayCount} />
    </>
  );
}
