"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import PaginationExt from "@/components/shared/pagination-ext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
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
  const [collapsed, setCollapsed] = useState(false); // State for collapsible content
  const { setError } = useError();

  const pageT = useTranslations("dashboard.recent_activities");
  const miscT = useTranslations("common.misc");

  const { data: session } = useSession();
  const userId = Number(session?.user?.id!);

  useEffect(() => {
    async function fetchActivityLogs() {
      setLoading(true);
      getUserActivities(userId, currentPage, 5, setError)
        .then((data) => {
          setActivityLogs(data.content);
          setTotalPages(data.totalPages);
        })
        .finally(() => setLoading(false));
    }
    fetchActivityLogs();
  }, [userId, currentPage]);

  return (
    <Card>
      {/* Header with Chevron Icon and Title */}
      <CardHeader>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center p-0"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
          <CardTitle>{pageT("title")}</CardTitle>
        </div>
      </CardHeader>

      {/* Collapsible Content */}
      {!collapsed && (
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-[150px]">
              <Spinner className="h-8 w-8">
                <span>{miscT("loading_data")}</span>
              </Spinner>
            </div>
          ) : activityLogs && activityLogs.length > 0 ? (
            <div className="space-y-2">
              {activityLogs.map((activityLog, index) => (
                <div
                  key={activityLog.id}
                  className={`py-4 px-4 rounded-md ${
                    index % 2 === 0
                      ? "bg-gray-50 dark:bg-gray-800"
                      : "bg-white dark:bg-gray-900"
                  }`}
                >
                  <Button variant="link" className="px-0 h-0">
                    <Link
                      href={`/portal/teams/${obfuscate(
                        activityLog.entityId,
                      )}/dashboard`}
                    >
                      {activityLog.entityName}
                    </Link>
                  </Button>
                  <div
                    className="prose max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html: activityLog.content!,
                    }}
                  />
                  <p className="text-xs mt-2">
                    Modified at:{" "}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-pointer">
                          {formatDateTimeDistanceToNow(
                            new Date(activityLog.createdAt),
                          )}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {new Date(activityLog.createdAt!).toLocaleString()}
                      </TooltipContent>
                    </Tooltip>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm ">{pageT("no_data")}</p>
          )}
          <PaginationExt
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            className="pt-2"
          />
        </CardContent>
      )}
    </Card>
  );
};

export default RecentUserTeamActivities;
