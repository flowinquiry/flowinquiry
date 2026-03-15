"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { UserAvatar } from "@/components/shared/avatar-display";
import PaginationExt from "@/components/shared/pagination-ext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getActivityLogs } from "@/lib/actions/activity-logs.action";
import { formatDateTimeDistanceToNow } from "@/lib/datetime";
import { obfuscate } from "@/lib/endecode";
import { useError } from "@/providers/error-provider";
import { ActivityLogDTO } from "@/types/activity-logs";
import { EntityType } from "@/types/commons";

type AuditLogViewProps = {
  entityType: EntityType;
  entityId: number;
};

const AuditLogView: React.FC<AuditLogViewProps> = ({
  entityType,
  entityId,
}) => {
  const [activityLogs, setActivityLogs] = useState<ActivityLogDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const { setError } = useError();

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoading(true);
      getActivityLogs("Ticket", entityId, currentPage, 10, setError)
        .then((data) => {
          setTotalPages(data.totalPages);
          setActivityLogs(data.content);
        })
        .finally(() => setLoading(false));
    };
    fetchAuditLogs();
  }, [entityType, entityId, currentPage]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-6 h-6 rounded-full bg-muted shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-1/3 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-2/3 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activityLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground gap-1">
        <span className="text-2xl">📋</span>
        <p>No activity history yet.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />

      <div className="flex flex-col gap-0">
        {activityLogs.map((activityLog, index) => (
          <div
            key={index}
            className="relative flex gap-3 pl-9 py-3 pr-2 group hover:bg-muted/40 transition-colors rounded-md"
          >
            {/* Avatar on the timeline */}
            <div className="absolute left-0 top-3 z-10">
              <UserAvatar
                imageUrl={activityLog.createdByImageUrl}
                size="w-6 h-6"
              />
            </div>

            <div className="min-w-0 flex-1">
              {/* Author + timestamp row */}
              <div className="flex flex-wrap items-center gap-1 text-sm mb-1">
                <Link
                  href={`/portal/users/${obfuscate(activityLog.createdById)}`}
                  className="font-medium hover:text-primary hover:underline underline-offset-4 transition-colors"
                >
                  {activityLog.createdByName}
                </Link>
                <span className="text-muted-foreground">·</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                      {formatDateTimeDistanceToNow(
                        new Date(activityLog.createdAt),
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {new Date(activityLog.createdAt).toLocaleString()}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Content */}
              <div
                className={[
                  "text-sm leading-snug text-foreground",
                  "[&>div]:m-0 [&>div]:p-0",
                  // Table styling
                  "[&_table]:w-full [&_table]:border-collapse [&_table]:text-xs [&_table]:mt-1 [&_table]:table-fixed",
                  "[&_thead]:bg-muted/60",
                  "[&_th]:text-left [&_th]:font-semibold [&_th]:px-3 [&_th]:py-1.5 [&_th]:border [&_th]:border-border [&_th]:text-muted-foreground",
                  // Column widths: 1/5, 2/5, 2/5
                  "[&_th:nth-child(1)]:w-1/5",
                  "[&_th:nth-child(2)]:w-2/5",
                  "[&_th:nth-child(3)]:w-2/5",
                  "[&_td]:px-3 [&_td]:py-1.5 [&_td]:border [&_td]:border-border [&_td]:align-top [&_td]:wrap-break-word",
                  "[&_tbody_tr:nth-child(even)]:bg-muted/30",
                  "[&_tbody_tr:hover]:bg-muted/50",
                  // Render HTML inside td — strip outer p margin
                  "[&_td_p]:m-0 [&_td_p]:p-0",
                ].join(" ")}
                dangerouslySetInnerHTML={{
                  __html: activityLog.content!.replace(
                    /(<td[^>]*>)([\s\S]*?)(<\/td>)/g,
                    (_, open, content, close) =>
                      `${open}${content
                        .replace(/&lt;/g, "<")
                        .replace(/&gt;/g, ">")
                        .replace(/&amp;/g, "&")}${close}`,
                  ),
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <PaginationExt
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
        className="pt-3"
      />
    </div>
  );
};

export default AuditLogView;
