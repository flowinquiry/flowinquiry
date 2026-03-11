"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { getTicketCreationDaySeries } from "@/lib/actions/tickets.action";
import { useError } from "@/providers/error-provider";
import { useTimeRange } from "@/providers/time-range-provider";

const TicketCreationByDaySeriesChart = ({ teamId }: { teamId: number }) => {
  const { setError } = useError();
  const { timeRange, customDates } = useTimeRange();
  const [collapsed, setCollapsed] = useState(false);
  const t = useAppClientTranslations();

  // Calculate `days` dynamically based on timeRange selection
  const days = useMemo(() => {
    if (timeRange === "custom" && customDates?.from && customDates?.to) {
      const diff = Math.ceil(
        (customDates.to.getTime() - customDates.from.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return diff > 0 ? diff : 1; // Ensure at least 1 day
    }

    const predefinedRanges: Record<string, number> = {
      "7d": 7,
      "14d": 14,
      "30d": 30,
      "90d": 90,
    };

    return predefinedRanges[timeRange] ?? 7; // Default to 7 days if invalid
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
    <Card className="w-full">
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
          <CardTitle className="text-left">
            {t.teams.dashboard("tickets_times_series.title")}
          </CardTitle>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="h-[400px] flex items-center justify-center">
          {isValidating ? (
            <div className="flex flex-col items-center justify-center">
              <Spinner className="mb-4">
                <span>{t.common.misc("loading_data")}</span>
              </Spinner>
            </div>
          ) : formattedData.length === 0 ? (
            <p className="text-center">
              {" "}
              {t.teams.dashboard("tickets_times_series.no_data")}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formattedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayDay" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value}`,
                    name === "createdCount"
                      ? t.teams.dashboard(
                          "tickets_times_series.created_tickets",
                        )
                      : t.teams.dashboard(
                          "tickets_times_series.closed_tickets",
                        ),
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
                  name={t.teams.dashboard(
                    "tickets_times_series.created_tickets",
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="closedCount"
                  stroke="#82ca9d"
                  name={t.teams.dashboard(
                    "tickets_times_series.closed_tickets",
                  )}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default TicketCreationByDaySeriesChart;
