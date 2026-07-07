"use client";

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  FolderOpen,
  TrendingDown,
  Zap,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import useSWR from "swr";

import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { searchProjects } from "@/lib/actions/project.action";
import { findIterationsByProjectId } from "@/lib/actions/project-iteration.action";
import { getBurndownReport } from "@/lib/actions/reports.action";
import { useError } from "@/providers/error-provider";
import { Filter } from "@/types/query";
import { BurndownDayDTO, BurndownProjectedStatus } from "@/types/reports";

interface Props {
  teamId: number;
  extraFilters?: Filter[];
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
      <div className={`rounded-full p-2.5 ${color}`}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-sm">
      <p className="font-semibold mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{p.value !== null ? p.value : "N/A"}</span>
        </div>
      ))}
    </div>
  );
};

const BurndownChart: React.FC<Props> = ({ teamId }) => {
  const { setError } = useError();
  const [tab, setTab] = useState<"chart" | "table">("chart");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedIterationId, setSelectedIterationId] = useState<number | null>(null);
  const [measure, setMeasure] = useState<"tickets" | "story_points">("tickets");

  // Fetch Projects
  const { data: projectsPage, isValidating: loadingProjects } = useSWR(
    ["team-projects-burndown", teamId],
    () =>
      searchProjects(
        {
          groups: [
            {
              filters: [{ field: "team.id", operator: "eq", value: teamId }],
              logicalOperator: "AND",
            },
          ],
        },
        { page: 0, size: 50 },
        setError,
      ),
  );
  const projects = projectsPage?.content ?? [];
  const projectId = selectedProjectId ?? (projects.length > 0 ? projects[0].id : null);

  // Fetch Iterations for the selected Project
  const { data: iterations, isValidating: loadingIterations } = useSWR(
    projectId ? ["project-iterations-burndown", projectId] : null,
    () => findIterationsByProjectId(projectId!, setError),
  );

  const activeIterations = useMemo(() => {
    return iterations ?? [];
  }, [iterations]);

  const iterationId =
    selectedIterationId ?? (activeIterations.length > 0 ? activeIterations[0].id : null);

  // Fetch Burndown Report
  const { data: report, isValidating: loadingReport } = useSWR(
    projectId && iterationId ? ["burndown-report", projectId, iterationId, measure] : null,
    () => getBurndownReport({ projectId: projectId!, iterationId: iterationId!, measure }, setError),
  );

  const chartData = useMemo(() => {
    if (!report?.days) return [];
    return report.days.map((day: BurndownDayDTO) => {
      // Format date to short readable format, e.g., "Jul 15"
      const dateObj = new Date(day.date);
      const formattedDate = dateObj.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        timeZone: "UTC"
      });
      return {
        name: formattedDate,
        "Remaining Work": day.remainingValue !== null ? Math.round(day.remainingValue * 10) / 10 : null,
        "Ideal Guideline": Math.round(day.idealValue * 10) / 10,
        "Completed Work": day.completedValue !== null ? Math.round(day.completedValue * 10) / 10 : null,
        fullDate: day.date,
      };
    });
  }, [report]);

  const getStatusBadge = (status?: BurndownProjectedStatus) => {
    switch (status) {
      case "AHEAD":
        return {
          text: "Ahead of Schedule",
          color: "text-green-600 bg-green-100 dark:bg-green-950",
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        };
      case "BEHIND":
        return {
          text: "Behind Schedule",
          color: "text-red-500 bg-red-100 dark:bg-red-950",
          icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        };
      default:
        return {
          text: "On Track",
          color: "text-blue-600 bg-blue-100 dark:bg-blue-950",
          icon: <Clock className="h-5 w-5 text-blue-600" />,
        };
    }
  };

  const statusBadge = getStatusBadge(report?.projectedStatus);

  const exportCsv = () => {
    if (!report?.days) return;
    const rows = [
      ["Date", "Remaining Value", "Ideal Value", "Completed Value"],
      ...report.days.map((day) => [
        day.date,
        day.remainingValue !== null ? day.remainingValue : "",
        day.idealValue,
        day.completedValue !== null ? day.completedValue : "",
      ]),
    ];
    const csvContent = rows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sprint-burndown-${projectId}-${iterationId}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loadingProjects) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Spinner className="h-8 w-8 mb-4" />
        <span className="text-sm text-muted-foreground">Loading projects…</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <FolderOpen className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No projects found for this team.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filters Panel */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Project:</label>
          <select
            className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={projectId ?? ""}
            onChange={(e) => {
              setSelectedProjectId(Number(e.target.value));
              setSelectedIterationId(null); // Reset iteration selection
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {loadingIterations ? (
          <Spinner className="h-4 w-4" />
        ) : activeIterations.length === 0 ? (
          <span className="text-sm text-muted-foreground">No iterations found.</span>
        ) : (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Iteration:</label>
            <select
              className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={iterationId ?? ""}
              onChange={(e) => setSelectedIterationId(Number(e.target.value))}
            >
              {activeIterations.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Measure:</label>
          <select
            className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={measure}
            onChange={(e) => setMeasure(e.target.value as "tickets" | "story_points")}
          >
            <option value="tickets">Tickets Count</option>
            <option value="story_points">Story Points</option>
          </select>
        </div>
      </div>

      {loadingReport ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Spinner className="h-8 w-8 mb-4" />
          <span className="text-sm text-muted-foreground">Loading burndown data…</span>
        </div>
      ) : !report ? (
        <p className="text-center text-sm text-muted-foreground py-12">
          Select a project and iteration to view the sprint burndown chart.
        </p>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={<Zap className="h-5 w-5 text-blue-600" />}
              label="Planned Work"
              value={report.plannedWork}
              color="bg-blue-100 dark:bg-blue-950"
            />
            <KpiCard
              icon={<CheckCircle className="h-5 w-5 text-green-600" />}
              label="Completed Work"
              value={report.completedWork}
              color="bg-green-100 dark:bg-green-950"
            />
            <KpiCard
              icon={<TrendingDown className="h-5 w-5 text-amber-600" />}
              label="Remaining Work"
              value={report.remainingWork}
              color="bg-amber-100 dark:bg-amber-950"
            />
            <KpiCard
              icon={statusBadge.icon}
              label="Projected Status"
              value={statusBadge.text}
              color={statusBadge.color}
            />
          </div>

          {/* Toggle and Export */}
          <div className="flex items-center justify-between">
            <div className="flex rounded-lg overflow-hidden border text-sm font-medium">
              {(["chart", "table"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 capitalize transition-colors ${
                    tab === t
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>

          {/* Visualizations */}
          {tab === "chart" ? (
            <div className="w-full h-72 md:h-96 rounded-xl border bg-card p-4 shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="Remaining Work"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Ideal Guideline"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-md border bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Remaining Work</TableHead>
                    <TableHead className="text-right">Ideal Value</TableHead>
                    <TableHead className="text-right">Completed Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.days.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell className="font-medium">
                        {new Date(day.date).toLocaleDateString(undefined, {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {day.remainingValue !== null ? Math.round(day.remainingValue * 10) / 10 : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {Math.round(day.idealValue * 10) / 10}
                      </TableCell>
                      <TableCell className="text-right">
                        {day.completedValue !== null ? Math.round(day.completedValue * 10) / 10 : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BurndownChart;
