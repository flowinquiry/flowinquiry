"use client";

import { ChartBar } from "lucide-react";
import React from "react";
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

import CollapsibleCard from "@/components/shared/collapsible-card";
import { Spinner } from "@/components/ui/spinner";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { getTicketsAssignmentDistributionByTeam } from "@/lib/actions/tickets.action";
import { useError } from "@/providers/error-provider";
import { useTimeRange } from "@/providers/time-range-provider";
import { TicketDistributionDTO } from "@/types/tickets";

interface TicketDistributionChartProps {
  teamId: number;
}

// Extended color palette with visually distinct colors
const COLORS = [
  "#8884d8", // Purple
  "#82ca9d", // Green
  "#ffc658", // Yellow
  "#ff6f61", // Coral
  "#d0ed57", // Lime
  "#6a89cc", // Blue
  "#f78fb3", // Pink
  "#3dc1d3", // Cyan
  "#e15f41", // Dark Orange
  "#546de5", // Royal Blue
  "#c44569", // Magenta
  "#574b90", // Dark Purple
  "#f19066", // Light Orange
  "#303952", // Navy Blue
  "#63cdda", // Light Blue
];

const TicketDistributionChart: React.FC<TicketDistributionChartProps> = ({
  teamId,
}) => {
  const { setError } = useError();
  const { timeRange, customDates } = useTimeRange();
  const t = useAppClientTranslations();

  // Generate date parameters
  const dateParams =
    timeRange === "custom"
      ? { from: customDates?.from, to: customDates?.to }
      : { range: timeRange };

  // Use SWR for automatic re-fetching
  const { data = [], isValidating } = useSWR(
    ["fetchTicketsAssignmentDistributionByTeam", teamId, dateParams],
    () => getTicketsAssignmentDistributionByTeam(teamId, dateParams, setError),
  );

  // Transform data and assign a unique color index to each user
  const chartData = data.map((item: TicketDistributionDTO, index: number) => ({
    name: item.userName || "Unassigned",
    value: item.ticketCount,
    userId: item.userId,
    colorIndex: index % COLORS.length, // Ensure we loop back if more users than colors
  }));

  // Sort data by ticket count (descending) to make the chart more readable
  chartData.sort((a, b) => b.value - a.value);

  const CustomYAxisTick = ({
    x,
    y,
    payload,
  }: {
    x: number;
    y: number;
    payload: { value: string };
  }) => {
    return (
      <text
        x={x - 10}
        y={y}
        dy={4}
        textAnchor="end"
        fill="currentColor"
        className="dark:fill-white fill-black"
      >
        <tspan>{payload.value}</tspan>
      </text>
    );
  };

  // Custom tooltip to show user and count
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border rounded shadow-sm">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p>
            <span className="font-semibold">{payload[0].value}</span> tickets
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <CollapsibleCard
      icon={<ChartBar className="h-4 w-4 text-muted-foreground" />}
      title={t.teams.dashboard("assigned_tickets_per_user.title")}
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
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
              barSize={40}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={(props) => <CustomYAxisTick {...props} />}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="value" name="Ticket Count">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.colorIndex]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </CollapsibleCard>
  );
};

export default TicketDistributionChart;
