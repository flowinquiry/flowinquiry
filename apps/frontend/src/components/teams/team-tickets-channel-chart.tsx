"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import useSWR from "swr";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { aggregate } from "@/lib/actions/reports.action";
import { useError } from "@/providers/error-provider";
import { useTimeRange } from "@/providers/time-range-provider";
import { AggregationQuery, Filter } from "@/types/query";
import { TicketChannel } from "@/types/tickets";

// Distinct colors for each channel — ordered to match ticketChannels list
const CHANNEL_COLORS: Record<TicketChannel, string> = {
  email: "#6366f1", // indigo
  phone: "#22c55e", // green
  web_portal: "#3b82f6", // blue
  chat: "#f59e0b", // amber
  social_media: "#ec4899", // pink
  in_person: "#14b8a6", // teal
  mobile_app: "#8b5cf6", // violet
  api: "#64748b", // slate
  system_generated: "#f97316", // orange
  internal: "#a78bfa", // purple-light
};

const FALLBACK_COLOR = "#d1d5db";

interface Props {
  teamId: number;
  extraFilters?: Filter[];
}

const TicketChannelPieChart: React.FC<Props> = ({
  teamId,
  extraFilters = [],
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { setError } = useError();
  const { timeRange, customDates } = useTimeRange();
  const t = useAppClientTranslations();

  // Build AggregationQuery — no dedicated backend endpoint needed
  const query = useMemo<AggregationQuery>(() => {
    const filters: Filter[] = [
      { field: "team.id", operator: "eq", value: teamId },
      { field: "isDeleted", operator: "eq", value: false },
    ];

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
      const rangeMap: Record<string, number> = {
        "7d": 7,
        "14d": 14,
        "30d": 30,
        "90d": 90,
      };
      const days = rangeMap[timeRange];
      if (days) {
        const from = new Date();
        from.setDate(from.getDate() - days);
        filters.push({
          field: "createdAt",
          operator: "gte",
          value: from.toISOString(),
        });
      }
    }

    // Extra filters injected from outside (e.g. project scoping)
    filters.push(...extraFilters);

    return {
      entity: "Ticket",
      groupByFields: ["channel"],
      aggregations: [{ field: "id", function: "count", alias: "ticketCount" }],
      filters: {
        groups: [
          {
            logicalOperator: "AND",
            filters,
          },
        ],
      },
      sorts: [{ field: "ticketCount", direction: "desc" }],
    };
  }, [teamId, timeRange, customDates, extraFilters]);

  const { data: rawData = [], isValidating } = useSWR(
    [
      "fetchTicketChannelDistribution",
      teamId,
      timeRange,
      customDates,
      extraFilters,
    ],
    () => aggregate(query, setError),
  );

  // Transform AggregationResult rows into recharts-friendly objects
  const chartData = useMemo(
    () =>
      rawData
        .filter((row) => row.dimensions["channel"] != null)
        .map((row) => {
          const channel = row.dimensions["channel"] as TicketChannel;
          return {
            channel,
            // Use the existing channel label from the ticket form translations
            name: t.teams.tickets.form.channels(channel) ?? channel,
            value: row.metrics["ticketCount"] ?? 0,
            fill: CHANNEL_COLORS[channel] ?? FALLBACK_COLOR,
          };
        }),
    [rawData, t],
  );

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="flex items-center p-0"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
          <CardTitle>
            {t.teams.dashboard("channel_distribution.title")}
          </CardTitle>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="p-4">
          {isValidating ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Spinner className="h-8 w-8 mb-4" />
              <span>{t.common.misc("loading_data")}</span>
            </div>
          ) : chartData.length === 0 ? (
            <p className="text-center">
              {t.teams.dashboard("channel_distribution.no_data")}
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
                      <Cell key={`cell-${entry.channel}`} fill={entry.fill} />
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
        </CardContent>
      )}
    </Card>
  );
};

export default TicketChannelPieChart;
