"use client";

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
        value={value}
        onChange={(e) => onChange(clampInt(e.target.valueAsNumber, 0, MAX_DAILY_APPLICATIONS))}
        onFocus={(e) => e.target.select()}
        className="h-7 w-14 text-center px-1 tabular-nums"
      />
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => onChange(clampInt(value + 1, 0, MAX_DAILY_APPLICATIONS))}
        aria-label="Increase"
      >
        <Plus />
      </Button>
    </div>
  );
}
