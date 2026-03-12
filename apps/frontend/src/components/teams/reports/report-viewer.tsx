"use client";

import { BarChart2, ChevronLeft } from "lucide-react";
import React, { useState } from "react";

import TimeRangeSelector from "@/components/shared/time-range-selector";
import ReportFilterPanel from "@/components/teams/reports/report-filter-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { Filter } from "@/types/query";
import { ReportDefinition } from "@/types/reports";

interface Props {
  report: ReportDefinition;
  teamId: number;
  onBack: () => void;
  /**
   * When provided by a parent (e.g. ProjectReportDetail), the viewer uses
   * these filters directly and skips its own internal filter state.
   * The parent is responsible for merging base + user filters before passing.
   */
  extraFilters?: Filter[];
  /**
   * When provided, the viewer delegates filter-change events to the parent
   * instead of managing its own filter state.
   */
  onFilterChange?: (filters: Filter[]) => void;
}

const ReportViewer: React.FC<Props> = ({
  report,
  teamId,
  onBack,
  extraFilters: externalFilters,
  onFilterChange,
}) => {
  const Icon = report.icon;
  const Component = report.component;
  const t = useAppClientTranslations();

  // Internal filter state — only used when no external control is provided
  const [internalFilters, setInternalFilters] = useState<Filter[]>([]);

  const hasFilters = report.filterConfig && report.filterConfig.length > 0;

  // If parent controls filters use those; otherwise fall back to internal state
  const extraFilters = externalFilters ?? internalFilters;
  const handleFilterChange = onFilterChange ?? setInternalFilters;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3">
        {/* Row 1: back button */}
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="gap-1 font-medium border-border text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
            {t.teams.reports("all_reports")}
          </Button>
        </div>

        {/* Row 2: title + time-range selector */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 border-l-4 border-primary pl-3">
            <Icon className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1.5">
              <h2 className="text-xl font-bold tracking-tight leading-tight">
                {report.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="text-xs capitalize bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">
                  {t.teams.reports(`categories.${report.category}`)}
                </Badge>
                <Badge className="text-xs bg-violet-100 text-violet-700 border-violet-300 hover:bg-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-700">
                  <BarChart2 className="w-3 h-3 mr-1" />
                  {t.teams.reports(`chart_types.${report.chartType}`)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground max-w-xl">
                {report.description}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <TimeRangeSelector />
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Body: filter panel + chart ── */}
      {Component ? (
        <div className={`flex gap-4 ${hasFilters ? "items-start" : ""}`}>
          {hasFilters && (
            <ReportFilterPanel
              teamId={teamId}
              config={report.filterConfig!}
              onChange={handleFilterChange}
            />
          )}
          <div className="flex-1 min-w-0">
            <Component teamId={teamId} extraFilters={extraFilters} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 border rounded-xl bg-muted/30 gap-3 text-center px-6">
          <Icon className="w-12 h-12 text-muted-foreground/40" />
          <p className="font-semibold text-muted-foreground">
            {t.teams.reports("upcoming_not_available")}
          </p>
          <p className="text-sm text-muted-foreground/70">
            {t.teams.reports("upcoming_label")}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportViewer;
