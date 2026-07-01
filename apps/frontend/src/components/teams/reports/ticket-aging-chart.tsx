"use client";

import { AlertTriangle, Clock, Download, FolderOpen, Timer } from "lucide-react";
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
import { getTicketAgingReport } from "@/lib/actions/reports.action";
import { useError } from "@/providers/error-provider";
import { Filter } from "@/types/query";
import { TicketAgingDTO } from "@/types/reports";

interface Props {
  teamId: number;
  extraFilters?: Filter[];
}

const BUCKETS = [
  { label: "0–2d", min: 0, max: 2, color: "#22c55e" },
  { label: "3–5d", min: 3, max: 5, color: "#84cc16" },
  { label: "6–10d", min: 6, max: 10, color: "#eab308" },
  { label: "11–20d", min: 11, max: 20, color: "#f97316" },
  { label: "21–30d", min: 21, max: 30, color: "#ef4444" },
  { label: "31+d", min: 31, max: Infinity, color: "#7f1d1d" },
];

const GROUP_OPTIONS = [
  { value: "assignee", label: "Assignee" },
  { value: "priority", label: "Priority" },
  { value: "status", label: "Status" },
] as const;

type GroupBy = "assignee" | "priority" | "status";

function bucketTickets(tickets: TicketAgingDTO[]) {
  const counts = BUCKETS.map((b) => ({ ...b, count: 0 }));
  tickets.forEach((t) => {
    const age = t.ageInDays ?? 0;
    const bucket = counts.find((b) => age >= b.min && age <= b.max);
    if (bucket) bucket.count++;
  });
  return counts;
}

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

const TicketAgingChart: React.FC<Props> = ({ teamId }) => {
  const { setError } = useError();
  const [tab, setTab] = useState<"chart" | "table">("chart");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>("assignee");
  const [includeClosed, setIncludeClosed] = useState(false);

  const { data: projectsPage, isValidating: loadingProjects } = useSWR(
    ["team-projects-aging", teamId],
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
    projectId ? ["ticket-aging", projectId, groupBy, includeClosed] : null,
    () =>
      getTicketAgingReport(
        { projectId: projectId!, groupBy, includeClosed },
        setError,
      ),
  );

  const allTickets: TicketAgingDTO[] = useMemo(
    () => Object.values(data?.groupedTickets ?? {}).flat(),
    [data],
  );

  const bucketChartData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.groupedTickets).map(([group, tickets]) => {
      const buckets = bucketTickets(tickets);
      const row: Record<string, string | number> = { name: group || "Unassigned" };
      buckets.forEach((b) => (row[b.label] = b.count));
      return row;
    });
  }, [data]);

  const exportCsv = () => {
    const rows = [
      ["Key", "Title", "Assignee", "Priority", "Status", "Age (days)"],
      ...allTickets.map((t) => [
        t.ticketKey,
        t.title,
        t.assignee ?? "",
        t.priority ?? "",
        t.status ?? "",
        t.ageInDays,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ticket-aging.csv";
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
        <span className="text-sm text-muted-foreground">Loading aging data…</span>
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
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Group by:</label>
          <select
            className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          >
            {GROUP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
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

      {allTickets.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">
          No ticket aging data available for this project.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              icon={<Timer className="h-5 w-5 text-blue-600" />}
              label="Total Tickets"
              value={data!.totalTickets}
              color="bg-blue-100 dark:bg-blue-950"
            />
            <KpiCard
              icon={<Clock className="h-5 w-5 text-amber-600" />}
              label="Average Age"
              value={`${data!.averageAge?.toFixed(1) ?? 0}d`}
              color="bg-amber-100 dark:bg-amber-950"
            />
            <KpiCard
              icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
              label="Oldest Ticket"
              value={`${data!.maxAge ?? 0}d`}
              color="bg-red-100 dark:bg-red-950"
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
            <div className="w-full h-72 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bucketChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 20, left: 0, bottom: 4 }}
                  barSize={26}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 12, fill: "currentColor" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {BUCKETS.map((b) => (
                    <Bar key={b.label} dataKey={b.label} stackId="a" name={b.label}>
                      {bucketChartData.map((_, i) => (
                        <Cell key={i} fill={b.color} />
                      ))}
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {tab === "table" && (
            <div className="rounded-xl border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Age (days)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...allTickets]
                    .sort((a, b) => (b.ageInDays ?? 0) - (a.ageInDays ?? 0))
                    .map((t) => (
                      <TableRow key={t.ticketId}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {t.ticketKey}
                        </TableCell>
                        <TableCell className="font-medium max-w-[280px] truncate">
                          {t.title}
                        </TableCell>
                        <TableCell>{t.assignee ?? "—"}</TableCell>
                        <TableCell>{t.priority ?? "—"}</TableCell>
                        <TableCell>{t.status ?? "—"}</TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            (t.ageInDays ?? 0) >= 21
                              ? "text-red-500"
                              : (t.ageInDays ?? 0) >= 6
                                ? "text-amber-500"
                                : "text-emerald-500"
                          }`}
                        >
                          {t.ageInDays ?? 0}
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

export default TicketAgingChart;
