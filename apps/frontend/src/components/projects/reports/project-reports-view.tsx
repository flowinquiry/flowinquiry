"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";

import ReportCard from "@/components/teams/reports/report-card";
import ReportViewer from "@/components/teams/reports/report-viewer";
import { Input } from "@/components/ui/input";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { Filter } from "@/types/query";
import { ReportDefinition } from "@/types/reports";

import { PROJECT_REPORT_REGISTRY } from "./project-report-registry";

interface Props {
  teamId: number;
  projectId: number;
}

const ProjectReportsView: React.FC<Props> = ({ teamId, projectId }) => {
  const t = useAppClientTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Base filter that scopes every chart to this project
  const projectBaseFilter = useMemo<Filter>(
    () => ({ field: "project.id", operator: "eq", value: projectId }),
    [projectId],
  );

  // Active report driven by URL param ?pr=<reportId>  (separate from ?r= used by team reports)
  const activeReportId = searchParams.get("pr");
  const activeReport = useMemo(
    () => PROJECT_REPORT_REGISTRY.find((r) => r.id === activeReportId) ?? null,
    [activeReportId],
  );

  const [search, setSearch] = useState("");
  const [userFilters, setUserFilters] = useState<Filter[]>([]);

  // Merge project base filter + user-selected filters
  const extraFilters = useMemo(
    () => [projectBaseFilter, ...userFilters],
    [projectBaseFilter, userFilters],
  );

  const setActiveReport = useCallback(
    (report: ReportDefinition | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (report) {
        params.set("pr", report.id);
      } else {
        params.delete("pr");
      }
      // Reset user filters when navigating between reports
      setUserFilters([]);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const filteredReports = useMemo(() => {
    const term = search.toLowerCase().trim();
    return PROJECT_REPORT_REGISTRY.filter(
      (r) =>
        !term ||
        r.title.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term),
    );
  }, [search]);

  // ── Detail view ───────────────────────────────────────────────────────────
  if (activeReport) {
    return (
      <ReportViewer
        report={activeReport}
        teamId={teamId}
        onBack={() => setActiveReport(null)}
        extraFilters={extraFilters}
        onFilterChange={
          activeReport.filterConfig?.length
            ? (f) => setUserFilters(f)
            : undefined
        }
      />
    );
  }

  // ── Gallery view ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t.teams.reports("search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Report grid */}
      {filteredReports.length === 0 ? (
        <div className="flex items-center justify-center h-48 border rounded-xl bg-muted/20 text-muted-foreground text-sm">
          {t.teams.reports("no_reports")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              isActive={activeReportId === report.id}
              onClick={setActiveReport}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectReportsView;
