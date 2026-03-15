"use client";

import { Activity } from "lucide-react";
import React, { useState } from "react";
import useSWR from "swr";

import CollapsibleCard from "@/components/shared/collapsible-card";
import PaginationExt from "@/components/shared/pagination-ext";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { getActivityLogs } from "@/lib/actions/activity-logs.action";
import { formatDateTimeDistanceToNow } from "@/lib/datetime";
import { useError } from "@/providers/error-provider";

const RecentTeamActivities = ({ teamId }: { teamId: number }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { setError } = useError();
  const t = useAppClientTranslations();

  const fetchActivityLogs = async () => {
    return getActivityLogs("Team", teamId, currentPage, 5, setError);
  };

  const { data, error, isLoading } = useSWR(
    [`/api/team/${teamId}/activities`, currentPage],
    fetchActivityLogs,
  );

  const activityLogs = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <CollapsibleCard
      icon={<Activity className="h-4 w-4 text-muted-foreground" />}
      title={t.teams.dashboard("recent_activities.title")}
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      ) : error || activityLogs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          {t.teams.dashboard("recent_activities.no_data")}
        </p>
      ) : (
        <div className="flex flex-col">
          {activityLogs.map((activityLog, index) => (
            <div
              key={activityLog.id}
              className={`py-2.5 px-2 rounded-md transition-all ${
                index % 2 === 0
                  ? "bg-muted/30 hover:bg-muted/50"
                  : "hover:bg-muted/40"
              }`}
            >
              <div
                className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground **:my-0"
                dangerouslySetInnerHTML={{ __html: activityLog.content! }}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground/70 mt-1 cursor-default">
                    {formatDateTimeDistanceToNow(
                      new Date(activityLog.createdAt),
                    )}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  {new Date(activityLog.createdAt).toLocaleString()}
                </TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      )}

      <PaginationExt
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
        className="pt-2"
      />
    </CollapsibleCard>
  );
};

export default RecentTeamActivities;
