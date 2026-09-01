"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ApplicationInput } from "@/components/today/application-input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { upsertRecordAction, deleteRecordAction } from "@/actions/records";
import { formatDisplay, type DateKey } from "@/lib/date";

export type EditableRecord = {
  id?: string;
  platformId: string;
  platformName: string;
  date: DateKey;
  applicationCount: number;
  notes?: string | null;
};

export function RecordEditDialog({
  record,
  onOpenChange,
}: {
  record: EditableRecord | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  // No effect needed to reset count/notes when `record` changes — both call
  // sites key this component by record id, so editing a different row is a
  // fresh mount.
  const [count, setCount] = React.useState(record?.applicationCount ?? 0);
  const [notes, setNotes] = React.useState(record?.notes ?? "");
  const [pending, startTransition] = React.useTransition();
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  function handleSave() {
    if (!record) return;
    startTransition(async () => {
      const res = await upsertRecordAction({
        platformId: record.platformId,
        date: record.date,
        applicationCount: count,
        notes: notes || null,
      });
      if (res.ok) {
        toast.success(`Updated ${record.platformName} for ${formatDisplay(record.date, "short")}.`);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Could not save.");
      }
    });
  }

  function handleDelete() {
    if (!record?.id) return;
    startTransition(async () => {
      const res = await deleteRecordAction(record.id!);
      if (res.ok) {
        toast.success("Record deleted.");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Could not delete — please try again.");
      }
    });
  }

  return (
    <Dialog open={!!record} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Applications</DialogTitle>
          <DialogDescription>
            {record?.platformName} · {record ? formatDisplay(record.date, "long") : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center py-2">
          <ApplicationInput value={count} onChange={setCount} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="record-notes">Notes (optional)</Label>
          <textarea
            id="record-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={2000}
            className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Good response quality, mostly irrelevant jobs, etc."
          />
        </div>

        <DialogFooter className="sm:justify-between">
          {record?.id ? (
            <ConfirmDialog
              open={confirmDelete}
              onOpenChange={setConfirmDelete}
              trigger={
                <Button variant="ghost" className="text-destructive hover:text-destructive" disabled={pending}>
                  <Trash2 />
                  Delete
                </Button>
              }
              title="Delete this record?"
              description={`This removes the ${record.platformName} entry for ${formatDisplay(record.date, "short")}. This can't be undone.`}
              confirmLabel="Delete"
              destructive
              onConfirm={handleDelete}
            />
          ) : (
            <span />
          )}
          <Button onClick={handleSave} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Save />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
