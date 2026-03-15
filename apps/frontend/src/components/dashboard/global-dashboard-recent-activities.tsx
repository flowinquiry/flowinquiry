"use client";

import { Activity } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import CollapsibleCard from "@/components/shared/collapsible-card";
import PaginationExt from "@/components/shared/pagination-ext";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getUserActivities } from "@/lib/actions/activity-logs.action";
import { formatDateTimeDistanceToNow } from "@/lib/datetime";
import { obfuscate } from "@/lib/endecode";
import { useError } from "@/providers/error-provider";
import { ActivityLogDTO } from "@/types/activity-logs";

const RecentUserTeamActivities = () => {
  const [activityLogs, setActivityLogs] = useState<ActivityLogDTO[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const { setError } = useError();

  const pageT = useTranslations("dashboard.recent_activities");
  const { data: session } = useSession();
  const userId = Number(session?.user?.id!);

  useEffect(() => {
    setLoading(true);
    getUserActivities(userId, currentPage, 5, setError)
      .then((data) => {
        setActivityLogs(data.content);
        setTotalPages(data.totalPages);
      })
      .finally(() => setLoading(false));
  }, [userId, currentPage]);

  return (
    <CollapsibleCard
      icon={<Activity className="h-4 w-4 text-muted-foreground" />}
      title={pageT("title")}
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      ) : activityLogs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          {pageT("no_data")}
        </p>
      ) : (
        <div className="flex flex-col">
          {activityLogs.map((log, index) => (
            <div
              key={log.id}
              className={`py-2.5 px-2 rounded-md transition-all ${
                index % 2 === 0
                  ? "bg-muted/30 hover:bg-muted/50"
                  : "hover:bg-muted/40"
              }`}
            >
              <Link
                href={`/portal/teams/${obfuscate(log.entityId)}/dashboard`}
                className="text-sm font-medium hover:text-primary hover:underline underline-offset-4 transition-colors"
              >
                {log.entityName}
              </Link>
              <div
                className="prose prose-sm max-w-none dark:prose-invert mt-0.5 text-muted-foreground **:my-0"
                dangerouslySetInnerHTML={{ __html: log.content! }}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground/70 mt-1 cursor-default">
                    {formatDateTimeDistanceToNow(new Date(log.createdAt))}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  {new Date(log.createdAt!).toLocaleString()}
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

export default RecentUserTeamActivities;
