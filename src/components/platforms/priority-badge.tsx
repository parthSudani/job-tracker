import { PRIORITY_META, type Priority } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const meta = PRIORITY_META[priority as Priority] ?? PRIORITY_META.Medium;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        meta.badge,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function PriorityDot({ priority, className }: { priority: string; className?: string }) {
  const meta = PRIORITY_META[priority as Priority] ?? PRIORITY_META.Medium;
  return <span className={cn("inline-block size-2 rounded-full", meta.dot, className)} />;
}
