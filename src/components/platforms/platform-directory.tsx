"use client";

import * as React from "react";
import { LayoutGrid } from "lucide-react";
import { SearchInput } from "@/components/shared/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { PlatformCard, type PlatformCardData } from "@/components/platforms/platform-card";
import { QuickAddModal } from "@/components/platforms/quick-add-modal";
import { AddCompanyDialog } from "@/components/platforms/add-company-dialog";
import { CATEGORIES, PRIORITIES, PRIORITY_ORDER } from "@/lib/constants";

type SortKey = "priority" | "name" | "today" | "week" | "month" | "total";

export function PlatformDirectory({ platforms }: { platforms: PlatformCardData[] }) {
  const [search, setSearch] = React.useState("");
  const [priority, setPriority] = React.useState<string>("all");
  const [category, setCategory] = React.useState<string>("all");
  const [status, setStatus] = React.useState<string>("active");
  const [sort, setSort] = React.useState<SortKey>("priority");
  const [quickAdd, setQuickAdd] = React.useState<PlatformCardData | null>(null);

  const filtered = React.useMemo(() => {
    let list = platforms;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.priority.toLowerCase().includes(q)
      );
    }
    if (priority !== "all") list = list.filter((p) => p.priority === priority);
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (status === "active") list = list.filter((p) => p.active);
    if (status === "inactive") list = list.filter((p) => !p.active);

    const sorted = [...list].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "today":
          return b.today - a.today;
        case "week":
          return b.week - a.week;
        case "month":
          return b.month - a.month;
        case "total":
          return b.total - a.total;
        default:
          return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9) || a.name.localeCompare(b.name);
      }
    });
    return sorted;
  }, [platforms, search, priority, category, status, sort]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search platforms, categories, remote, startup..." className="sm:max-w-xs sm:flex-1" />

        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger size="sm" className="w-full sm:w-36">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger size="sm" className="w-full sm:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger size="sm" className="w-full sm:w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger size="sm" className="w-full sm:w-36">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Sort: Priority</SelectItem>
            <SelectItem value="name">Sort: Name</SelectItem>
            <SelectItem value="today">Sort: Today</SelectItem>
            <SelectItem value="week">Sort: Week</SelectItem>
            <SelectItem value="month">Sort: Month</SelectItem>
            <SelectItem value="total">Sort: Total</SelectItem>
          </SelectContent>
        </Select>

        <div className="sm:ml-auto">
          <AddCompanyDialog />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No platforms match your filters"
          description="Try clearing a filter or searching a different term."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <PlatformCard key={p.id} platform={p} onQuickAdd={() => setQuickAdd(p)} />
          ))}
        </div>
      )}

      <QuickAddModal
        key={quickAdd?.id ?? "closed"}
        open={!!quickAdd}
        onOpenChange={(open) => !open && setQuickAdd(null)}
        platform={quickAdd}
        initialCount={quickAdd?.today ?? 0}
      />
    </div>
  );
}
