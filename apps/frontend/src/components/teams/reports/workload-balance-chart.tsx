"use client";

import {
  AlertTriangle,
  CheckCircle,
  Download,
  FolderOpen,
  Users,
  XCircle,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
import { getWorkloadBalanceReport } from "@/lib/actions/reports.action";
import { useError } from "@/providers/error-provider";
import { Filter } from "@/types/query";
import { WorkloadBalanceMemberDTO } from "@/types/reports";

// ── Registry contract ─────────────────────────────────────────────────────────
interface Props {
  teamId: number;
  extraFilters?: Filter[];
}

// ── Priority configuration ────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#22c55e",
  Trivial: "#6366f1",
  None: "#94a3b8",
};
const PRIORITIES = ["Critical", "High", "Medium", "Low", "Trivial"];

// ── KPI Card ──────────────────────────────────────────────────────────────────
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

// ── Chart tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-sm">
      <p className="font-semibold mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: p.fill }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const WorkloadBalanceChart: React.FC<Props> = ({ teamId }) => {
  const { setError } = useError();
  const [tab, setTab] = useState<"chart" | "table">("chart");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Load projects for this team so the user can pick one
  const { data: projectsPage, isValidating: loadingProjects } = useSWR(
    ["team-projects", teamId],
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

  // Use first project automatically if none selected
  const projectId =
    selectedProjectId ?? (projects.length > 0 ? projects[0].id : null);

  const { data, isValidating } = useSWR(
    projectId ? ["workload-balance", projectId] : null,
    () => getWorkloadBalanceReport({ projectId: projectId! }, setError),
  );

  const members: WorkloadBalanceMemberDTO[] = data?.members ?? [];

  // Stacked bar data: one bar per member, stacked by priority
  const chartData = useMemo(
    () =>
      members.map((m) => ({
        name: m.userName,
        ...PRIORITIES.reduce(
          (acc, p) => ({ ...acc, [p]: m.priorityBreakdown[p] ?? 0 }),
          {} as Record<string, number>,
        ),
      })),
    [members],
  );

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ["Member", "Open", "Closed", "Overdue", "Avg Age (days)", ...PRIORITIES],
      ...data.members.map((m) => [
        m.userName,
        m.openCount,
        m.closedCount,
        m.overdueCount,
        m.avgAgeInDays.toFixed(1),
        ...PRIORITIES.map((p) => m.priorityBreakdown[p] ?? 0),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workload-balance.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Project picker ──────────────────────────────────────────────────────────
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
        <p className="text-sm text-muted-foreground">
          No projects found for this team.
        </p>
      </div>
    );
  }

  // ── Loading report ──────────────────────────────────────────────────────────
  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Spinner className="h-8 w-8 mb-4" />
        <span className="text-sm text-muted-foreground">Loading workload data…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Project selector ── */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Project:
        </label>
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

      {/* ── No data ── */}
      {members.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">
          No ticket data available for this project.
        </p>
      ) : (
        <>
          {/* ── KPI row ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              icon={<Users className="h-5 w-5 text-blue-600" />}
              label="Total Open Tickets"
              value={data!.totalOpenTickets}
              color="bg-blue-100 dark:bg-blue-950"
            />
            <KpiCard
              icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
              label="Average per Member"
              value={data!.averagePerMember.toFixed(1)}
              color="bg-emerald-100 dark:bg-emerald-950"
            />
            <KpiCard
              icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
              label="Most Overloaded"
              value={data!.topOverloadedMember ?? "—"}
              sub={
                data!.topOverloadedMember
                  ? `${members[0]?.openCount ?? 0} open tickets`
                  : undefined
              }
              color="bg-orange-100 dark:bg-orange-950"
            />
          </div>

          {/* ── Tab toggle + export ── */}
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

          {/* ── Chart view ── */}
          {tab === "chart" && (
            <div className="w-full h-72 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 4, right: 20, left: 0, bottom: 4 }}
                  barSize={28}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 12, fill: "currentColor" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(value) => (
                      <span style={{ color: PRIORITY_COLORS[value] }}>
                        {value}
                      </span>
                    )}
                  />
                  {PRIORITIES.map((p) => (
                    <Bar key={p} dataKey={p} stackId="a" name={p}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={PRIORITY_COLORS[p]} />
                      ))}
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Table view ── */}
          {tab === "table" && (
            <div className="rounded-xl border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                    <TableHead className="text-right">Closed</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                    <TableHead className="text-right">Avg Age (d)</TableHead>
                    {PRIORITIES.map((p) => (
                      <TableHead key={p} className="text-right text-xs">
                        <span style={{ color: PRIORITY_COLORS[p] }}>{p}</span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.userName}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {m.overdueCount > 0 && (
                            <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                          )}
                          {m.userName}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {m.openCount}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {m.closedCount}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          m.overdueCount > 0
                            ? "text-red-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {m.overdueCount}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {m.avgAgeInDays.toFixed(1)}
                      </TableCell>
                      {PRIORITIES.map((p) => (
                        <TableCell key={p} className="text-right text-xs">
                          {m.priorityBreakdown[p] ?? 0}
                        </TableCell>
                      ))}
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

export default WorkloadBalanceChart;
