"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";

import { Heading } from "@/components/heading";
import ReportCard from "@/components/teams/reports/report-card";
import { REPORT_REGISTRY } from "@/components/teams/reports/report-registry";
import ReportSidebar from "@/components/teams/reports/report-sidebar";
import ReportViewer from "@/components/teams/reports/report-viewer";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { obfuscate } from "@/lib/endecode";
import { BreadcrumbProvider } from "@/providers/breadcrumb-provider";
import { useTeam } from "@/providers/team-provider";
import { ReportCategory, ReportDefinition } from "@/types/reports";

const TeamReportsView: React.FC = () => {
  const team = useTeam();
  const t = useAppClientTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active report driven by URL param ?r=<reportId>
  const activeReportId = searchParams.get("r");
  const activeReport = useMemo(
    () => REPORT_REGISTRY.find((r) => r.id === activeReportId) ?? null,
    [activeReportId],
  );

  const [category, setCategory] = useState<ReportCategory | "all">("all");
  const [search, setSearch] = useState("");

  const setActiveReport = useCallback(
    (report: ReportDefinition | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (report) {
        params.set("r", report.id);
      } else {
        params.delete("r");
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const filteredReports = useMemo(() => {
    const term = search.toLowerCase().trim();
    return REPORT_REGISTRY.filter((r) => {
      const matchesCat = category === "all" || r.category === category;
      const matchesSearch =
        !term ||
        r.title.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term);
      return matchesCat && matchesSearch;
    });
  }, [category, search]);

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("teams"), link: "/portal/teams" },
    {
      title: team.name,
      link: `/portal/teams/${obfuscate(team.id!)}/dashboard`,
    },
    { title: t.common.navigation("reports"), link: "#" },
  ];

  return (
    <BreadcrumbProvider items={breadcrumbItems}>
      <div className="flex flex-col gap-4 h-full">
        {/* ── Toolbar ── */}
        {!activeReport && (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Heading
                title={t.teams.reports("title")}
                description={t.teams.reports("description")}
              />
            </div>
            <Separator />
          </>
        )}

        {activeReport ? (
          /* ── Detail view ── */
          <ReportViewer
            report={activeReport}
            teamId={team.id!}
            onBack={() => setActiveReport(null)}
          />
        ) : (
          /* ── Gallery ── */
          <div className="flex gap-6 flex-1 min-h-0">
            {/* Sidebar */}
            <div className="hidden lg:flex flex-col gap-2 w-52 shrink-0 pt-1">
              <ReportSidebar selected={category} onChange={setCategory} />
            </div>

            {/* Main panel */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
              {/* Search bar */}
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder={t.teams.reports("search_placeholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Category label for mobile */}
              <div className="flex gap-2 lg:hidden flex-wrap">
                {(["all", "tickets", "projects", "members"] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                        category === cat
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {cat === "all"
                        ? t.teams.reports("categories.all")
                        : t.teams.reports(`categories.${cat}`)}
                    </button>
                  ),
                )}
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
          </div>
        )}
      </div>
    </BreadcrumbProvider>
  );
};

export default TeamReportsView;
