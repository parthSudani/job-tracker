"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileJson, FileSpreadsheet, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { resetAllDataAction } from "@/actions/settings";

export function DataManagement() {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importing, setImporting] = React.useState(false);
  const [resetOpen, setResetOpen] = React.useState(false);
  const [resetText, setResetText] = React.useState("");
  const [resetting, startResetTransition] = React.useTransition();

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const body = JSON.parse(text);
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Import failed.");
      } else {
        toast.success(
          `Imported ${data.totalRows} rows (${data.created} created, ${data.updated} updated${
            data.platformsCreated ? `, ${data.platformsCreated} new platforms` : ""
          }).`
        );
        router.refresh();
      }
    } catch {
      toast.error("Couldn't read that file — make sure it's the JSON export format.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleReset() {
    startResetTransition(async () => {
      await resetAllDataAction();
      toast.success("All data has been reset.");
      setResetOpen(false);
      setResetText("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Export data</Label>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/api/export?format=csv">
              <FileSpreadsheet />
              Export CSV
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/api/export?format=json">
              <FileJson />
              Export JSON
            </a>
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Import data</Label>
        <p className="text-xs text-muted-foreground">
          Restores a JSON file previously produced by Export JSON. Matching platform + date entries are updated in
          place; unrecognized platform names are added as company sites.
        </p>
        <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importing}>
          {importing ? <Loader2 className="animate-spin" /> : <Upload />}
          Import JSON
        </Button>
      </div>

      <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <Label className="text-destructive">Reset all data</Label>
        <p className="text-xs text-muted-foreground">
          Permanently deletes every application record, custom company, and note. Seed platforms and targets return
          to their defaults. This cannot be undone.
        </p>
        <Dialog open={resetOpen} onOpenChange={(open) => { setResetOpen(open); if (!open) setResetText(""); }}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 />
              Reset all data
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset all data?</DialogTitle>
              <DialogDescription>
                This permanently deletes every tracked application, custom platform, and note. Type{" "}
                <span className="font-mono font-semibold text-foreground">RESET</span> to confirm.
              </DialogDescription>
            </DialogHeader>
            <Input value={resetText} onChange={(e) => setResetText(e.target.value)} placeholder="RESET" autoFocus />
            <DialogFooter>
              <Button
                variant="destructive"
                disabled={resetText !== "RESET" || resetting}
                onClick={handleReset}
              >
                {resetting && <Loader2 className="animate-spin" />}
                Permanently reset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div>
          <Label>Download a PDF summary</Label>
          <p className="text-xs text-muted-foreground">Use your browser&apos;s Print → Save as PDF on the Analytics page for a shareable summary.</p>
        </div>
      </div>
    </div>
  );
}
