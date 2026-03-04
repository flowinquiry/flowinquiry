"use client";

import { BarChart3 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import CollapsibleCard from "@/components/shared/collapsible-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTeamTicketPriorityDistributionForUser } from "@/lib/actions/tickets.action";
import { useError } from "@/providers/error-provider";
import { TicketPriority } from "@/types/tickets";

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  Critical: "#dc2626",
  High: "#ea580c",
  Medium: "#facc15",
  Low: "#22c55e",
  Trivial: "#9ca3af",
};

const TeamUnresolvedTicketsPriorityDistributionChart = () => {
  const { data: session } = useSession();
  const userId = Number(session?.user?.id!);
  const [data, setData] = useState<
    Record<string, Record<TicketPriority, number>>
  >({});
  const [loading, setLoading] = useState(true);
  const { setError } = useError();
  const pageT = useTranslations("dashboard.un_resolved_tickets_by_teams");

  useEffect(() => {
    getTeamTicketPriorityDistributionForUser(userId, setError)
      .then((result) => {
        const chartData = result.reduce(
          (acc, item) => {
            if (!acc[item.teamName]) {
              acc[item.teamName] = {
                Critical: 0,
                High: 0,
                Medium: 0,
                Low: 0,
                Trivial: 0,
              };
            }
            acc[item.teamName][item.priority] = item.count;
            return acc;
          },
          {} as Record<string, Record<TicketPriority, number>>,
        );
        setData(chartData);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const chartData = Object.entries(data).map(([teamName, priorities]) => ({
    teamName,
    ...priorities,
  }));

  return (
    <CollapsibleCard
      icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
      title={pageT("title")}
      className="flex flex-col"
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-24 shrink-0" />
              <Skeleton className="h-6 flex-1" />
            </div>
          ))}
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{pageT("no_data")}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 8, right: 16, left: 120, bottom: 8 }}
            barSize={28}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="teamName"
              tick={{ fontSize: 12 }}
              width={115}
            />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              cursor={{ fill: "hsl(var(--muted))" }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            {Object.keys(PRIORITY_COLORS).map((priority) => (
              <Bar
                key={priority}
                dataKey={priority}
                stackId="a"
                fill={PRIORITY_COLORS[priority as TicketPriority]}
                radius={priority === "Trivial" ? [0, 4, 4, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </CollapsibleCard>
  );
};

export default TeamUnresolvedTicketsPriorityDistributionChart;
