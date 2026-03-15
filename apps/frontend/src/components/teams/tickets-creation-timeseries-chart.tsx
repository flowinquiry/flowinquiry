"use client";

import { ChartLine } from "lucide-react";
import React, { useMemo } from "react";
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

import CollapsibleCard from "@/components/shared/collapsible-card";
import { Spinner } from "@/components/ui/spinner";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { getTicketCreationDaySeries } from "@/lib/actions/tickets.action";
import { useError } from "@/providers/error-provider";
import { useTimeRange } from "@/providers/time-range-provider";

const TicketCreationByDaySeriesChart = ({ teamId }: { teamId: number }) => {
  const { setError } = useError();
  const { timeRange, customDates } = useTimeRange();
  const t = useAppClientTranslations();

  const days = useMemo(() => {
    if (timeRange === "custom" && customDates?.from && customDates?.to) {
      const diff = Math.ceil(
        (customDates.to.getTime() - customDates.from.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return diff > 0 ? diff : 1;
    }
    const predefinedRanges: Record<string, number> = {
      "7d": 7,
      "14d": 14,
      "30d": 30,
      "90d": 90,
    };
    return predefinedRanges[timeRange] ?? 7;
  }, [timeRange, customDates]);

  const { data, isValidating } = useSWR(
    teamId ? ["getTicketCreationDaySeries", teamId, days] : null,
    () => getTicketCreationDaySeries(teamId, days, setError),
  );

  const formattedData = useMemo(
    () =>
      data?.map((item, index) => ({
        ...item,
        displayDay: `Day ${index + 1}`,
      })) || [],
    [data],
  );

  return (
    <CollapsibleCard
      icon={<ChartLine className="h-4 w-4 text-muted-foreground" />}
      title={t.teams.dashboard("tickets_times_series.title")}
    >
      {isValidating ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Spinner className="mb-4">
            <span>{t.common.misc("loading_data")}</span>
          </Spinner>
        </div>
      ) : formattedData.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">
          {t.teams.dashboard("tickets_times_series.no_data")}
        </p>
      ) : (
        <div className="w-full h-64 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayDay" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value}`,
                  name === "createdCount"
                    ? t.teams.dashboard("tickets_times_series.created_tickets")
                    : t.teams.dashboard("tickets_times_series.closed_tickets"),
                ]}
                labelFormatter={(label: string) => {
                  const date = formattedData.find(
                    (d) => d.displayDay === label,
                  )?.date;
                  return <span>{date || "Unknown Date"}</span>;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="createdCount"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                name={t.teams.dashboard("tickets_times_series.created_tickets")}
              />
              <Line
                type="monotone"
                dataKey="closedCount"
                stroke="#82ca9d"
                name={t.teams.dashboard("tickets_times_series.closed_tickets")}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </CollapsibleCard>
  );
};

export default TicketCreationByDaySeriesChart;
