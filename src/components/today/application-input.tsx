"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clampInt } from "@/lib/utils";
import { MAX_DAILY_APPLICATIONS } from "@/lib/constants";

export function ApplicationInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  // While typing we hold the raw text so intermediate values aren't clamped
  // out from under the caret — "1500" on the way to a larger number would
  // otherwise stick at the cap. `null` means "not editing, mirror `value`".
  const [draft, setDraft] = React.useState<string | null>(null);

  function commit(raw: string) {
    setDraft(null);
    onChange(clampInt(raw === "" ? 0 : Number(raw), 0, MAX_DAILY_APPLICATIONS));
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => onChange(clampInt(value - 1, 0, MAX_DAILY_APPLICATIONS))}
        disabled={value <= 0}
        aria-label="Decrease"
      >
        <Minus />
      </Button>
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        max={MAX_DAILY_APPLICATIONS}
        value={draft ?? String(value)}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft(raw);
          const next = Number(raw);
          // Push through only what's already in range; anything over the cap
          // waits for blur so the user can keep typing.
          if (raw !== "" && Number.isFinite(next) && next >= 0 && next <= MAX_DAILY_APPLICATIONS) {
            onChange(Math.round(next));
          }
        }}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(e.currentTarget.value);
        }}
        onFocus={(e) => e.target.select()}
        className="h-7 w-16 text-center px-1 tabular-nums"
      />
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => onChange(clampInt(value + 1, 0, MAX_DAILY_APPLICATIONS))}
        disabled={value >= MAX_DAILY_APPLICATIONS}
        aria-label="Increase"
      >
        <Plus />
      </Button>
    </div>
  );
}
