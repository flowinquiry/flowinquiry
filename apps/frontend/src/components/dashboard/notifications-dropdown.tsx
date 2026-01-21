"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpCircle,
  Bell,
  BellDot,
  Clock,
  Timer,
  XCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import TruncatedHtmlLabel from "@/components/shared/truncate-html-label";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useSSE from "@/hooks/use-sse";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  getUnReadNotificationsByUserId,
  markNotificationsAsRead,
} from "@/lib/actions/notifications.action";
import { formatDateTime, formatDateTimeDistanceToNow } from "@/lib/datetime";
import { useError } from "@/providers/error-provider";
import { NotificationDTO, NotificationType } from "@/types/commons";

const LOCAL_STORAGE_KEY = "notifications";

const NotificationsDropdown = () => {
  const { data: session } = useSession();
  const { setError } = useError();
  const t = useAppClientTranslations();

  const [notifications, setNotifications] = useState<NotificationDTO[]>(() => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
    }
    return [];
  });

  const { notifications: notificationsSSE } = useSSE();

  // Track which SSE notifications we've already processed to avoid duplicates
  const processedSSEIds = useRef(new Set<number>());

  useEffect(() => {
    async function fetchNotifications() {
      if (!session?.user?.id) return;

      const notificationsData = await getUnReadNotificationsByUserId(
        Number(session.user.id),
        setError,
      );

      setNotifications((prev) => {
        const merged = [
          ...notificationsData,
          ...prev.filter(
            (n) => !notificationsData.some((dbN) => dbN.id === n.id),
          ),
        ];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      });
    }

    fetchNotifications();
  }, [session, setError]);

  // Handle new SSE notifications - show toast and update state
  useEffect(() => {
    if (notificationsSSE.length === 0) return;

    // Filter out notifications we've already processed
    const newNotifications = notificationsSSE.filter(
      (n) => n.id && !processedSSEIds.current.has(n.id),
    );

    if (newNotifications.length === 0) return;

    // Mark these notifications as processed
    newNotifications.forEach((n) => {
      if (n.id) processedSSEIds.current.add(n.id);
      // Show toast for new notifications only
      toast.info(n.content);
    });

    // Update state with new notifications
    setNotifications((prev) => {
      const updated = [
        ...newNotifications,
        ...prev.filter(
          (n) => !newNotifications.some((newN) => newN.id === n.id),
        ),
      ];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [notificationsSSE]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setNotifications(
          JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]"),
        );
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const handleMarkAllRead = async () => {
    const validNotificationIds = notifications
      .map((n) => n.id)
      .filter((id): id is number => id !== null);

    if (validNotificationIds.length > 0) {
      await markNotificationsAsRead(validNotificationIds, setError);
    }

    setNotifications([]);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
  };

  const handleNotificationClick = async (
    notificationId: number | null,
    index: number,
  ) => {
    if (notificationId !== null) {
      await markNotificationsAsRead([notificationId], setError);
    }

    setNotifications((prevNotifications) => {
      const updated = prevNotifications.map((notification, i) =>
        i === index ? { ...notification, isRead: true } : notification,
      );
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    setTimeout(() => {
      setNotifications((prevNotifications) => {
        const updated = prevNotifications.filter((_, i) => i !== index);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }, 500);
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.INFO:
        return <Bell className="text-blue-500 dark:text-blue-400 w-5 h-5" />;
      case NotificationType.WARNING:
        return (
          <AlertTriangle className="text-yellow-500 dark:text-yellow-400 w-5 h-5" />
        );
      case NotificationType.ERROR:
        return <XCircle className="text-red-500 dark:text-red-400 w-5 h-5" />;
      case NotificationType.SLA_BREACH:
        return (
          <Clock className="text-orange-500 dark:text-orange-400 w-5 h-5" />
        );
      case NotificationType.SLA_WARNING:
        return (
          <Timer className="text-purple-500 dark:text-purple-400 w-5 h-5" />
        );
      case NotificationType.ESCALATION_NOTICE:
        return (
          <ArrowUpCircle className="text-green-500 dark:text-green-400 w-5 h-5" />
        );
      default:
        return <Bell className="text-gray-500 dark:text-gray-400 w-5 h-5" />;
    }
  };

  const getNotificationTypeLabel = (type: NotificationType) => {
    switch (type) {
      case NotificationType.INFO:
        return "Info";
      case NotificationType.WARNING:
        return "Warning";
      case NotificationType.ERROR:
        return "Error";
      case NotificationType.SLA_BREACH:
        return "SLA Breach";
      case NotificationType.SLA_WARNING:
        return "SLA Warning";
      case NotificationType.ESCALATION_NOTICE:
        return "Escalation";
      default:
        return "Notification";
    }
  };

  const getNotificationTypeBadgeColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.INFO:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case NotificationType.WARNING:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case NotificationType.ERROR:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case NotificationType.SLA_BREACH:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case NotificationType.SLA_WARNING:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case NotificationType.ESCALATION_NOTICE:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="relative h-10 w-10 rounded-full p-0"
        >
          {notifications.length > 0 ? (
            <BellDot className="animate-tada h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {notifications.length > 0 && (
            <div className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              {notifications.length}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="z-999 w-80 md:w-96 p-0 shadow-lg border dark:border-gray-700"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
          <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">
            Notifications
            {notifications.length > 0 && (
              <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                {notifications.length}
              </span>
            )}
          </h3>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs h-8 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {t.header.notifications("clear_all")}
            </Button>
          )}
        </div>

        {notifications.length > 0 ? (
          <ScrollArea className="max-h-80 overflow-y-auto">
            <AnimatePresence>
              {notifications.map((item, index) => (
                <motion.div
                  key={index}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <DropdownMenuItem
                    className="cursor-pointer p-0 focus:bg-transparent"
                    onClick={() => handleNotificationClick(item.id, index)}
                  >
                    <div className="flex w-full p-3 hover:bg-gray-100 dark:hover:bg-gray-800 border-b dark:border-gray-700 last:border-0">
                      <div className="mr-3 mt-1">
                        {getNotificationIcon(item.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${getNotificationTypeBadgeColor(item.type)}`}
                          >
                            {getNotificationTypeLabel(item.type)}
                          </span>
                          <Tooltip>
                            <TooltipTrigger className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                              {formatDateTimeDistanceToNow(
                                new Date(item.createdAt),
                              )}
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p>{formatDateTime(new Date(item.createdAt))}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          <TruncatedHtmlLabel
                            htmlContent={item.content}
                            wordLimit={400}
                          />
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <Bell className="text-gray-400 w-8 h-8 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t.header.notifications("no_data")}
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsDropdown;
