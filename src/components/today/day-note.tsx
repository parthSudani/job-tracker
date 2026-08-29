"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, NotebookPen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveDayNoteAction } from "@/actions/day-notes";
import type { DateKey } from "@/lib/date";

export function DayNote({ date, initialNote }: { date: DateKey; initialNote: string }) {
  // No effect needed to reset `note` when the date changes — the Today page
  // keys this component by date, so switching days is a fresh mount.
  const [note, setNote] = React.useState(initialNote);
  const [pending, startTransition] = React.useTransition();

  const dirty = note !== initialNote;

  function handleSave() {
    startTransition(async () => {
      const res = await saveDayNoteAction({ date, note });
      if (res.ok) toast.success("Note saved.");
      else toast.error(res.error ?? "Could not save note.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <NotebookPen className="size-4" />
          Note for this day (optional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
          rows={2}
          placeholder="e.g. Focused on senior Node.js and backend roles today."
          className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
        {dirty && (
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={handleSave} disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Save note
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
