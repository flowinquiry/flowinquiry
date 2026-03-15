"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { getTicketStateChangesHistory } from "@/lib/actions/teams.action";
import { formatDateTime, formatDateTimeDistanceToNow } from "@/lib/datetime";
import { useError } from "@/providers/error-provider";
import { TransitionItemCollectionDTO } from "@/types/teams";

const statusConfig: Record<
  string,
  { icon: React.ReactNode; color: string; badge: string }
> = {
  Completed: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-emerald-500",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  },
  Overdue: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-red-500",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  },
  Escalated: {
    icon: <TrendingUp className="h-4 w-4" />,
    color: "text-orange-500",
    badge:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  },
};

const TicketTimelineHistory = ({ teamId }: { teamId: number }) => {
  const t = useAppClientTranslations();
  const [transitionItemCollection, setTransitionItemCollection] =
    useState<TransitionItemCollectionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const { setError } = useError();

  useEffect(() => {
    const fetchStatesHistory = async () => {
      setLoading(true);
      getTicketStateChangesHistory(teamId, setError)
        .then((data) => setTransitionItemCollection(data))
        .finally(() => setLoading(false));
    };
    fetchStatesHistory();
  }, [teamId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
              <div className="w-px flex-1 bg-muted min-h-8" />
            </div>
            <div className="flex-1 pb-6 space-y-2">
              <div className="h-3 w-1/3 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!transitionItemCollection?.transitions?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
        <Clock className="h-8 w-8 opacity-30" />
        <p>{t.teams.tickets.timeline("no_data")}</p>
      </div>
    );
  }

  const transitions = transitionItemCollection.transitions;

  return (
    <div className="relative py-2">
      {transitions.map((transition, index) => {
        const isLast = index === transitions.length - 1;
        const statusInfo = statusConfig[transition.status];
        const hasStatus = ["Completed", "Overdue", "Escalated"].includes(
          transition.status,
        );

        return (
          <div key={index} className="relative flex gap-3 group">
            {/* Left: icon + connector */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2 z-10
                  bg-background transition-colors
                  ${
                    hasStatus && statusInfo
                      ? `border-current ${statusInfo.color}`
                      : "border-primary text-primary"
                  }
                `}
              >
                {hasStatus && statusInfo ? (
                  <span className={statusInfo.color}>{statusInfo.icon}</span>
                ) : (
                  <Circle className="h-3 w-3 fill-primary text-primary" />
                )}
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-border my-1 min-h-4" />
              )}
            </div>

            {/* Right: content */}
            <div className={`flex-1 pb-5 ${isLast ? "pb-0" : ""}`}>
              {/* Header row */}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-foreground">
                  {transition.eventName}
                </span>
                {hasStatus && statusInfo && (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.badge}`}
                  >
                    {statusInfo.icon}
                    {transition.status}
                  </span>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors ml-auto">
                      {formatDateTimeDistanceToNow(
                        new Date(transition.transitionDate),
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {formatDateTime(new Date(transition.transitionDate))}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* State transition */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Badge
                  variant="outline"
                  className="text-xs px-1.5 py-0 h-5 font-normal"
                >
                  {transition.fromState || "—"}
                </Badge>
                <span className="text-muted-foreground/60">→</span>
                <Badge
                  variant="secondary"
                  className="text-xs px-1.5 py-0 h-5 font-medium"
                >
                  {transition.toState}
                </Badge>
              </div>

              {/* SLA */}
              {transition.slaDueDate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>{t.teams.tickets.timeline("sla_due")}:</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-pointer text-red-500 dark:text-red-400 font-medium hover:underline underline-offset-2">
                        {formatDateTime(new Date(transition.slaDueDate))}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t.teams.tickets.timeline("sla_deadline")}:{" "}
                      {formatDateTime(new Date(transition.slaDueDate))}
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TicketTimelineHistory;
