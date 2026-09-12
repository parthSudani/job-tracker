export const PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_META: Record<
  Priority,
  { label: string; blurb: string; dot: string; badge: string; ring: string }
> = {
  Critical: {
    label: "Critical",
    blurb: "Use daily — highest-impact platform for your search.",
    dot: "bg-priority-critical",
    badge: "bg-priority-critical/12 text-priority-critical border-priority-critical/25",
    ring: "ring-1 ring-priority-critical/30",
  },
  High: {
    label: "High",
    blurb: "Check several times a week.",
    dot: "bg-priority-high",
    badge: "bg-priority-high/12 text-priority-high border-priority-high/25",
    ring: "ring-1 ring-priority-high/20",
  },
  Medium: {
    label: "Medium",
    blurb: "Solid supplementary source.",
    dot: "bg-priority-medium",
    badge: "bg-priority-medium/12 text-priority-medium border-priority-medium/25",
    ring: "",
  },
  Low: {
    label: "Low",
    blurb: "Light, occasional coverage.",
    dot: "bg-priority-low",
    badge: "bg-priority-low/12 text-priority-low border-priority-low/25",
    ring: "",
  },
};

export const CATEGORIES = [
  "Primary",
  "General Job Board",
  "Startup & Tech",
  "Remote",
  "Freelance & Contract",
  "Company Site",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const PRIORITY_ORDER: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

export const DATE_RANGE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "month", label: "This month" },
  { value: "lastMonth", label: "Last month" },
  { value: "custom", label: "Custom range" },
] as const;
export type DateRangePreset = (typeof DATE_RANGE_PRESETS)[number]["value"];

export const MAX_DAILY_APPLICATIONS = 5000;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/today", label: "Today", icon: "CalendarCheck2" },
  { href: "/platforms", label: "Platforms", icon: "LayoutGrid" },
  { href: "/history", label: "History", icon: "History" },
  { href: "/calendar", label: "Calendar", icon: "Calendar" },
  { href: "/analytics", label: "Analytics", icon: "BarChart3" },
  { href: "/goals", label: "Goals", icon: "Target" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const;
