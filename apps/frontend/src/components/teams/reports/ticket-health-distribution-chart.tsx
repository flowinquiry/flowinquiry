"use client";

import { AlertTriangle, Download, FolderOpen, Heart, ShieldAlert } from "lucide-react";
import React, { useMemo, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
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
import { getTicketHealthDistribution } from "@/lib/actions/reports.action";
import { useError } from "@/providers/error-provider";
import { Filter } from "@/types/query";

interface Props {
  teamId: number;
  extraFilters?: Filter[];
}

const HEALTH_COLORS: Record<string, string> = {
  Excellent: "#22c55e",
  Good: "#84cc16",
  Fair: "#eab308",
  Poor: "#f97316",
  Critical: "#ef4444",
};

const HEALTH_ORDER = ["Excellent", "Good", "Fair", "Poor", "Critical"];

function KpiCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
      <div className={`rounded-full p-2.5 ${color}`}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-sm">
      <p className="font-semibold mb-1">{name}</p>
      <p className="text-muted-foreground">
        Tickets: <span className="font-medium text-foreground">{value}</span>
      </p>
    </div>
  );
};

const TicketHealthDistributionChart: React.FC<Props> = ({ teamId }) => {
  const { setError } = useError();
  const [tab, setTab] = useState<"chart" | "table">("chart");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [includeClosed, setIncludeClosed] = useState(false);

  const { data: projectsPage, isValidating: loadingProjects } = useSWR(
    ["team-projects-health", teamId],
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
  const projectId =
    selectedProjectId ?? (projects.length > 0 ? projects[0].id : null);

  const { data, isValidating } = useSWR(
    projectId ? ["ticket-health-distribution", projectId, includeClosed] : null,
    () =>
      getTicketHealthDistribution({ projectId: projectId!, includeClosed }, setError),
  );

  const chartData = useMemo(() => {
    if (!data?.distribution) return [];
    return HEALTH_ORDER.filter((level) => level in data.distribution).map((level) => ({
      name: level,
      value: data.distribution[level],
      fill: HEALTH_COLORS[level] ?? "#94a3b8",
    }));
  }, [data]);

  const exportCsv = () => {
    const rows = [
      ["Health Level", "Ticket Count"],
      ...chartData.map((r) => [r.name, r.value]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ticket-health-distribution.csv";
    a.click();
    URL.revokeObjectURL(url);
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

  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Spinner className="h-8 w-8 mb-4" />
        <span className="text-sm text-muted-foreground">Loading health data…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Project:</label>
          <select
            className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={projectId ?? ""}
            onChange={(e) => setSelectedProjectId(Number(e.target.value))}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            className="rounded"
            checked={includeClosed}
            onChange={(e) => setIncludeClosed(e.target.checked)}
          />
          <span className="text-muted-foreground">Include closed tickets</span>
        </label>
      </div>

      {!data || data.totalTickets === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">
          No health data available for this project.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              icon={<Heart className="h-5 w-5 text-blue-600" />}
              label="Total Tickets"
              value={data.totalTickets}
              color="bg-blue-100 dark:bg-blue-950"
            />
            <KpiCard
              icon={<ShieldAlert className="h-5 w-5 text-red-500" />}
              label="Critical Tickets"
              value={data.criticalCount}
              color="bg-red-100 dark:bg-red-950"
            />
            <KpiCard
              icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
              label="Dominant Level"
              value={data.dominantHealthLevel ?? "—"}
              color="bg-amber-100 dark:bg-amber-950"
            />
          </div>

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

          {tab === "chart" && (
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="45%"
                    outerRadius="70%"
                    paddingAngle={3}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span className="text-sm text-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {tab === "table" && (
            <div className="rounded-xl border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Health Level</TableHead>
                    <TableHead className="text-right">Ticket Count</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full"
                            style={{ background: row.fill }}
                          />
                          {row.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{row.value}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {((row.value / data.totalTickets) * 100).toFixed(1)}%
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

export default TicketHealthDistributionChart;
