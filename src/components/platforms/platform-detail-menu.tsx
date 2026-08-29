"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { updatePlatformAction, deleteCustomPlatformAction } from "@/actions/platforms";
import { CATEGORIES, PRIORITIES } from "@/lib/constants";

export function PlatformDetailMenu({
  platform,
}: {
  platform: {
    id: string;
    name: string;
    officialUrl: string | null;
    category: string;
    priority: string;
    recommendedFrequency: string;
    notes: string | null;
    active: boolean;
    isCustom: boolean;
  };
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const [priority, setPriority] = React.useState(platform.priority);
  const [category, setCategory] = React.useState(platform.category);
  const [frequency, setFrequency] = React.useState(platform.recommendedFrequency);
  const [url, setUrl] = React.useState(platform.officialUrl ?? "");
  const [notes, setNotes] = React.useState(platform.notes ?? "");
  const [active, setActive] = React.useState(platform.active);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updatePlatformAction(platform.id, {
        priority: priority as (typeof PRIORITIES)[number],
        category,
        recommendedFrequency: frequency,
        officialUrl: url,
        notes,
        active,
      });
      if (res.ok) {
        toast.success("Platform updated.");
        setEditOpen(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Could not update platform.");
      }
    });
  }

  async function handleDelete() {
    const res = await deleteCustomPlatformAction(platform.id);
    if (res.ok) {
      toast.success(`${platform.name} removed.`);
      router.push("/platforms");
      router.refresh();
    } else {
      toast.error(res.error ?? "Could not delete platform.");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Platform actions">
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil />
            Edit details
          </DropdownMenuItem>
          {platform.isCustom && (
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {platform.name}</DialogTitle>
            <DialogDescription>Adjust how this platform is tracked and prioritized.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <div>
                <Label htmlFor="platform-active">Active</Label>
                <p className="text-xs text-muted-foreground">Inactive platforms are hidden from Today&apos;s Tracker.</p>
              </div>
              <Switch id="platform-active" checked={active} onCheckedChange={setActive} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="platform-frequency">Recommended frequency</Label>
                <Input id="platform-frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="platform-url">Official URL</Label>
              <Input id="platform-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="platform-notes">Notes</Label>
              <textarea
                id="platform-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                maxLength={2000}
                className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Good response quality, mostly irrelevant jobs, etc."
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${platform.name}?`}
        description="This removes the platform and every application record logged against it. This can't be undone."
        confirmLabel="Delete permanently"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
