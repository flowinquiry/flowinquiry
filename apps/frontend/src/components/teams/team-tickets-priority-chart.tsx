"use client";

import { ChartPie } from "lucide-react";
import React, { useMemo } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import useSWR from "swr";

import CollapsibleCard from "@/components/shared/collapsible-card";
import { Spinner } from "@/components/ui/spinner";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { aggregate } from "@/lib/actions/reports.action";
import { useError } from "@/providers/error-provider";
import { useTimeRange } from "@/providers/time-range-provider";
import { AggregationQuery, Filter } from "@/types/query";
import { TicketPriority } from "@/types/tickets";

interface Props {
  teamId: number;
  /** Extra filters injected by the report filter panel (status, assignee, priority…) */
  extraFilters?: Filter[];
}

const COLORS: Record<TicketPriority, string> = {
  Critical: "#DC2626",
  High: "#F97316",
  Medium: "#F59E0B",
  Low: "#16A34A",
  Trivial: "#9CA3AF",
};

const TicketPriorityPieChart: React.FC<Props> = ({
  teamId,
  extraFilters = [],
}) => {
  const { setError } = useError();
  const { timeRange, customDates } = useTimeRange();
  const t = useAppClientTranslations();

  const query = useMemo<AggregationQuery>(() => {
    const filters: Filter[] = [
      { field: "team.id", operator: "eq", value: teamId },
      { field: "isDeleted", operator: "eq", value: false },
    ];

    // Date range
    if (timeRange === "custom" && customDates?.from && customDates?.to) {
      filters.push({
        field: "createdAt",
        operator: "gte",
        value: customDates.from.toISOString(),
      });
      filters.push({
        field: "createdAt",
        operator: "lte",
        value: customDates.to.toISOString(),
      });
    } else if (timeRange !== "custom") {
      const days: Record<string, number> = {
        "7d": 7,
        "14d": 14,
        "30d": 30,
        "90d": 90,
      };
      const d = days[timeRange];
      if (d) {
        const from = new Date();
        from.setDate(from.getDate() - d);
        filters.push({
          field: "createdAt",
          operator: "gte",
          value: from.toISOString(),
        });
      }
    }

    // Extra filters from the filter panel
    filters.push(...extraFilters);

    return {
      entity: "Ticket",
      groupByFields: ["priority"],
      aggregations: [{ field: "id", function: "count", alias: "ticketCount" }],
      filters: { groups: [{ logicalOperator: "AND", filters }] },
      sorts: [{ field: "ticketCount", direction: "desc" }],
    };
  }, [teamId, timeRange, customDates, extraFilters]);

  const { data: rawData = [], isValidating } = useSWR(
    [
      "fetchTicketsPriorityDistribution",
      teamId,
      timeRange,
      customDates,
      extraFilters,
    ],
    () => aggregate(query, setError),
  );

  const chartData = useMemo(
    () =>
      rawData
        .filter((row) => row.dimensions["priority"] != null)
        .map((row) => {
          const priority = row.dimensions["priority"] as TicketPriority;
          return {
            name: priority,
            value: row.metrics["ticketCount"] ?? 0,
            fill: COLORS[priority] ?? "#D3D3D3",
          };
        }),
    [rawData],
  );

  return (
    <CollapsibleCard
      icon={<ChartPie className="h-4 w-4 text-muted-foreground" />}
      title={t.teams.dashboard("priority_tickets_distribution.title")}
    >
      {isValidating ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Spinner className="h-8 w-8 mb-4" />
          <span>{t.common.misc("loading_data")}</span>
        </div>
      ) : chartData.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">
          {t.common.misc("no_data_available")}
        </p>
      ) : (
        <div className="w-full h-64 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius="80%"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {chartData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [value, name]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </CollapsibleCard>
  );
};

export default TicketPriorityPieChart;
