"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpCircle,
  Bell,
  BellDot,
  CheckCheck,
  Clock,
  Timer,
  XCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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

  useEffect(() => {
    if (notificationsSSE.length > 0) {
      notificationsSSE.forEach((notification) => {
        // Strip HTML tags for plain text toast
        const plainText = notification.content
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        toast.info(plainText);
      });

      setNotifications((prev) => {
        const updated = [
          ...notificationsSSE,
          ...prev.filter(
            (n) => !notificationsSSE.some((sseN) => sseN.id === n.id),
          ),
        ];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }
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
        return <Bell className="text-blue-500 dark:text-blue-400 w-4 h-4" />;
      case NotificationType.WARNING:
        return (
          <AlertTriangle className="text-yellow-500 dark:text-yellow-400 w-4 h-4" />
        );
      case NotificationType.ERROR:
        return <XCircle className="text-red-500 dark:text-red-400 w-4 h-4" />;
      case NotificationType.SLA_BREACH:
        return (
          <Clock className="text-orange-500 dark:text-orange-400 w-4 h-4" />
        );
      case NotificationType.SLA_WARNING:
        return (
          <Timer className="text-purple-500 dark:text-purple-400 w-4 h-4" />
        );
      case NotificationType.ESCALATION_NOTICE:
        return (
          <ArrowUpCircle className="text-green-500 dark:text-green-400 w-4 h-4" />
        );
      default:
        return <Bell className="text-muted-foreground w-4 h-4" />;
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

  const getNotificationBadgeVariant = (
    type: NotificationType,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case NotificationType.ERROR:
      case NotificationType.SLA_BREACH:
        return "destructive";
      case NotificationType.WARNING:
      case NotificationType.SLA_WARNING:
      case NotificationType.ESCALATION_NOTICE:
        return "secondary";
      default:
        return "outline";
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
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
              {notifications.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="z-999 w-80 md:w-96 p-0 shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">
              {t.header.notifications("title")}
            </h3>
            {notifications.length > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                {notifications.length}
              </Badge>
            )}
          </div>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t.header.notifications("clear_all")}
            </Button>
          )}
        </div>

        <Separator />

        {notifications.length > 0 ? (
          <ScrollArea className="max-h-105">
            <div className="flex flex-col py-1 px-2">
              <AnimatePresence>
                {notifications.map((item, index) => (
                  <motion.div
                    key={item.id ?? index}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={`group flex w-full gap-3 px-3 py-2.5 rounded-md cursor-pointer border-l-2 transition-all ${
                        !item.isRead
                          ? "bg-primary/5 border-primary hover:bg-primary/10"
                          : index % 2 === 0
                            ? "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-primary"
                            : "border-transparent hover:bg-muted/40 hover:border-primary"
                      }`}
                      onClick={() => handleNotificationClick(item.id, index)}
                    >
                      {/* Icon */}
                      <div className="mt-0.5 shrink-0">
                        {getNotificationIcon(item.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge
                            variant={getNotificationBadgeVariant(item.type)}
                            className="h-4 px-1.5 text-[10px]"
                          >
                            {getNotificationTypeLabel(item.type)}
                          </Badge>
                          {!item.isRead && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-auto text-xs text-muted-foreground/70 cursor-default">
                                {formatDateTimeDistanceToNow(
                                  new Date(item.createdAt),
                                )}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p>{formatDateTime(new Date(item.createdAt))}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div
                          className="text-sm"
                          dangerouslySetInnerHTML={{ __html: item.content }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <div className="rounded-full bg-muted p-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t.header.notifications("no_data")}
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsDropdown;
