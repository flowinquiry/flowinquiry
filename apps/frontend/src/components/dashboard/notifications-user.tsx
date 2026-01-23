"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import PaginationExt from "@/components/shared/pagination-ext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  getUserNotifications,
  markNotificationsAsRead,
} from "@/lib/actions/notifications.action";
import { formatDateTimeDistanceToNow } from "@/lib/datetime";
import { useError } from "@/providers/error-provider";
import { NotificationDTO } from "@/types/commons";

const UserNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false); // State for collapsible content
  const { setError } = useError();
  const { data: session } = useSession();
  const userId = Number(session?.user?.id!);
  const componentT = useTranslations("dashboard.notifications");
  const miscT = useTranslations("common.misc");

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true);
      getUserNotifications(userId, currentPage, 5, setError)
        .then((data) => {
          setNotifications(data.content);
          setTotalPages(data.totalPages);
        })
        .finally(() => setLoading(false));
    }
    fetchNotifications();
  }, [userId, currentPage]);

  const handleMarkAsRead = async (notificationId: number) => {
    markNotificationsAsRead([notificationId], setError).finally(() => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );
    });
  };

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
          <CardTitle>{componentT("title")}</CardTitle>
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
          ) : notifications && notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`py-4 px-4 rounded-md ${
                    notification.isRead
                      ? index % 2 === 0
                        ? "bg-gray-50 dark:bg-gray-800"
                        : "bg-white dark:bg-gray-900"
                      : "bg-blue-100 dark:bg-blue-900"
                  }`}
                >
                  <div
                    className="prose max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html: notification.content!,
                    }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Created at:{" "}
                    {formatDateTimeDistanceToNow(
                      new Date(notification.createdAt),
                    )}
                  </p>
                  {!notification.isRead && (
                    <Button
                      variant="link"
                      className="px-0 h-0"
                      onClick={() => handleMarkAsRead(notification.id!)}
                    >
                      {componentT("mark_as_read")}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {componentT("no_data")}
            </p>
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

export default UserNotifications;
