"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import CollapsibleCard from "@/components/shared/collapsible-card";
import PaginationExt from "@/components/shared/pagination-ext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  const { setError } = useError();
  const { data: session } = useSession();
  const userId = Number(session?.user?.id!);
  const componentT = useTranslations("dashboard.notifications");

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    setLoading(true);
    getUserNotifications(userId, currentPage, 5, setError)
      .then((data) => {
        setNotifications(data.content);
        setTotalPages(data.totalPages);
      })
      .finally(() => setLoading(false));
  }, [userId, currentPage]);

  const handleMarkAsRead = (notificationId: number) => {
    markNotificationsAsRead([notificationId], setError).finally(() => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );
    });
  };

  return (
    <CollapsibleCard
      icon={<Bell className="h-4 w-4 text-muted-foreground" />}
      title={componentT("title")}
      headerAction={
        unreadCount > 0 ? (
          <Badge variant="destructive" className="h-5 px-1.5 text-xs">
            {unreadCount}
          </Badge>
        ) : undefined
      }
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          {componentT("no_data")}
        </p>
      ) : (
        <div className="flex flex-col">
          {notifications.map((notification, index) => (
            <div
              key={notification.id}
              className={`py-2.5 px-2 rounded-md border-l-2 transition-all ${
                !notification.isRead
                  ? "bg-primary/5 hover:bg-primary/10 border-primary"
                  : index % 2 === 0
                    ? "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-primary"
                    : "border-transparent hover:bg-muted/40 hover:border-primary"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  {!notification.isRead && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: notification.content! }}
                  />
                </div>
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary"
                    onClick={() => handleMarkAsRead(notification.id!)}
                    title={componentT("mark_as_read")}
                  >
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground/70 mt-1 ml-4">
                {formatDateTimeDistanceToNow(new Date(notification.createdAt))}
              </p>
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

export default UserNotifications;
