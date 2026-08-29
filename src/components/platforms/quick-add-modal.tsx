"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ApplicationInput } from "@/components/today/application-input";
import { upsertRecordAction } from "@/actions/records";
import { todayKey, formatDisplay } from "@/lib/date";

export function QuickAddModal({
  open,
  onOpenChange,
  platform,
  initialCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: { id: string; name: string } | null;
  initialCount: number;
}) {
  const router = useRouter();
  const [count, setCount] = React.useState(initialCount);
  const [pending, startTransition] = React.useTransition();
  const today = todayKey();

  React.useEffect(() => {
    if (open) setCount(initialCount);
  }, [open, initialCount]);

  function handleSave() {
    if (!platform) return;
    startTransition(async () => {
      const res = await upsertRecordAction({ platformId: platform.id, date: today, applicationCount: count });
      if (res.ok) {
        toast.success(`Saved ${count} application${count === 1 ? "" : "s"} for ${platform.name} today.`);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Could not save — please try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Applications</DialogTitle>
          <DialogDescription>
            {platform?.name} · {formatDisplay(today, "long")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center py-4">
          <ApplicationInput value={count} onChange={setCount} />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Need a different day?{" "}
          <Link href="/today" className="text-primary hover:underline" onClick={() => onOpenChange(false)}>
            Use Today&apos;s Tracker
          </Link>
        </p>
        <DialogFooter>
          <Button onClick={handleSave} disabled={pending} className="w-full sm:w-auto">
            {pending ? <Loader2 className="animate-spin" /> : <Save />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
