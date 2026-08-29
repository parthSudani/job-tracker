"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addCompanyAction } from "@/actions/platforms";

export function AddCompanyDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function reset() {
    setName("");
    setUrl("");
    setNotes("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await addCompanyAction({ name, officialUrl: url, notes });
      if (res.ok) {
        toast.success(`Added ${name} to your platforms.`);
        setOpen(false);
        reset();
        router.refresh();
      } else {
        setError(res.error ?? "Could not add company.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus />
          Add Company
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Company Career Site</DialogTitle>
          <DialogDescription>Track direct applications to a specific company.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="company-name">Company name</Label>
            <Input
              id="company-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Stripe"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company-url">Career page URL (optional)</Label>
            <Input
              id="company-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://stripe.com/jobs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company-notes">Notes (optional)</Label>
            <Input id="company-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Role, contact, referral..." />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Add Company
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
