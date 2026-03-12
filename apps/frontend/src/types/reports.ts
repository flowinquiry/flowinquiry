import { LucideIcon } from "lucide-react";

import { Filter } from "@/types/query";

export type ReportCategory = "tickets" | "projects" | "members" | "custom";

// ── Per-report filter configuration ─────────────────────────────────────────

/**
 * Each entry declares one filter control that should appear in the
 * ReportFilterPanel for a specific report.
 */
export type ReportFilterField =
  | { type: "status"; field: "isCompleted" }
  | { type: "assignee"; field: "assignUser.id" }
  | { type: "priority"; field: "priority" };

/**
 * Ordered list of filter controls to render for a report.
 * Empty / omitted → no filter panel shown.
 */
export type ReportFilterConfig = ReportFilterField[];

/**
 * Lifecycle status of a report definition.
 * - "available"  → built and wired to a real chart component
 * - "upcoming"   → planned but not yet implemented; shown as a teaser card
 */
export type ReportStatus = "available" | "upcoming";

export type ChartType = "pie" | "bar" | "line" | "table" | "funnel" | "heatmap";

/**
 * Self-contained descriptor for one report entry in the gallery.
 * Adding a new report = adding one entry here; no other files need to change
 * until the chart component itself is built.
 */
export type ReportDefinition = {
  /** Stable identifier used in URL params, localStorage, etc. */
  id: string;

  category: ReportCategory;

  /** Whether the report is ready to render or just a teaser */
  status: ReportStatus;

  /** Display name (plain string — translated at the call site) */
  title: string;

  /** Short explanation shown on the gallery card */
  description: string;

  /** Icon rendered on the card */
  icon: LucideIcon;

  /** Visual hint of what the chart looks like */
  chartType: ChartType;

  /**
   * The React component to render when this report is opened.
   * `null` for upcoming reports.
   * Components receive `extraFilters` when the report has a filter panel.
   */
  component: React.ComponentType<{
    teamId: number;
    extraFilters?: Filter[];
  }> | null;

  /**
   * Declarative list of filter controls shown in the ReportFilterPanel.
   * Omit or leave empty for reports with no user-configurable filters.
   */
  filterConfig?: ReportFilterConfig;
};
