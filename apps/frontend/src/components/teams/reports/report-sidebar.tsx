"use client";

import { BarChart2, FolderKanban, LayoutGrid, Users } from "lucide-react";
import React from "react";

import { useAppClientTranslations } from "@/hooks/use-translations";
import { cn } from "@/lib/utils";
import { ReportCategory } from "@/types/reports";

import { REPORT_CATEGORIES, REPORT_REGISTRY } from "./report-registry";

interface Props {
  selected: ReportCategory | "all";
  onChange: (cat: ReportCategory | "all") => void;
}

const CATEGORY_ICON: Record<ReportCategory, React.ElementType> = {
  tickets: BarChart2,
  projects: FolderKanban,
  members: Users,
  custom: LayoutGrid,
};

const ReportSidebar: React.FC<Props> = ({ selected, onChange }) => {
  const t = useAppClientTranslations();

  const countByCategory = (cat: ReportCategory) =>
    REPORT_REGISTRY.filter((r) => r.category === cat).length;

  const allCount = REPORT_REGISTRY.length;

  const Item = ({
    value,
    label,
    icon: Icon,
    count,
  }: {
    value: ReportCategory | "all";
    label: string;
    icon: React.ElementType;
    count: number;
  }) => (
    <button
      onClick={() => onChange(value)}
      className={cn(
        "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm transition-colors",
        selected === value
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <span className="flex items-center gap-2">
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </span>
      <span
        className={cn(
          "text-xs rounded-full px-2 py-0.5 font-mono",
          selected === value
            ? "bg-primary/20 text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );

  return (
    <aside className="flex flex-col gap-1 w-full">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-1">
        {t.teams.reports("categories_heading")}
      </p>

      <Item
        value="all"
        label={t.teams.reports("categories.all")}
        icon={LayoutGrid}
        count={allCount}
      />

      {REPORT_CATEGORIES.map((cat) => (
        <Item
          key={cat}
          value={cat}
          label={t.teams.reports(`categories.${cat}`)}
          icon={CATEGORY_ICON[cat] ?? LayoutGrid}
          count={countByCategory(cat)}
        />
      ))}
    </aside>
  );
};

export default ReportSidebar;
