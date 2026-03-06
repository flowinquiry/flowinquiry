"use client";

import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import React from "react";

import { UserAvatar } from "@/components/shared/avatar-display";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TicketDTO } from "@/types/tickets";

type TaskBlockProps = {
  task: TicketDTO;
  isDragging?: boolean;
};

const PRIORITY_BADGE: Record<
  string,
  {
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
  }
> = {
  Critical: { variant: "destructive", className: "" },
  High: {
    variant: "outline",
    className: "border-orange-400 text-orange-600 dark:text-orange-400",
  },
  Medium: {
    variant: "outline",
    className: "border-yellow-400 text-yellow-600 dark:text-yellow-400",
  },
  Low: {
    variant: "outline",
    className: "border-green-400 text-green-600 dark:text-green-400",
  },
  Trivial: { variant: "secondary", className: "" },
};

const getPriorityBadge = (priority: string) =>
  PRIORITY_BADGE[priority] ?? { variant: "outline" as const, className: "" };

const TaskBlock: React.FC<TaskBlockProps> = ({ task, isDragging = false }) => {
  const priorityBadge = getPriorityBadge(task.priority ?? "");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          animate={{
            opacity: isDragging ? 0.4 : 1,
            scale: isDragging ? 0.97 : 1,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="group w-full rounded-lg border bg-card hover:shadow-md hover:border-primary/30 transition-all cursor-pointer p-3 space-y-2"
          data-testid="task-block"
        >
          {/* Title */}
          <p
            className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors"
            data-testid="task-title"
          >
            {task.requestTitle}
          </p>

          {/* Description */}
          {task.requestDescription && (
            <div
              className="text-xs text-muted-foreground line-clamp-2 prose prose-xs dark:prose-invert max-w-none **:my-0"
              dangerouslySetInnerHTML={{ __html: task.requestDescription }}
              data-testid="task-description"
            />
          )}

          {/* Footer: priority + assignee + time */}
          <div className="flex items-center gap-2 pt-1 border-t border-border/50">
            {task.priority && (
              <Badge
                variant={priorityBadge.variant}
                className={`text-[10px] h-4 px-1.5 shrink-0 ${priorityBadge.className}`}
                data-testid="task-priority-badge"
              >
                {task.priority}
              </Badge>
            )}

            <div className="flex items-center gap-1.5 ml-auto">
              {task.modifiedAt && (
                <span
                  className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60"
                  data-testid="task-timestamp"
                >
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(task.modifiedAt, { addSuffix: true })}
                </span>
              )}
              {task.assignUserName && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="shrink-0" data-testid="task-assignee">
                      <UserAvatar
                        imageUrl={task.assignUserImageUrl}
                        size="h-6 w-6"
                        className="ring-1 ring-border"
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">{task.assignUserName}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </motion.div>
      </TooltipTrigger>

      {/* Rich tooltip */}
      <TooltipContent
        side="right"
        align="start"
        className="w-64 p-3 space-y-2"
        data-testid="task-tooltip"
      >
        <p
          className="font-semibold text-sm leading-snug"
          data-testid="task-tooltip-title"
        >
          {task.requestTitle}
        </p>
        {task.requestDescription && (
          <div
            className="text-xs text-muted-foreground max-h-32 overflow-y-auto prose prose-xs dark:prose-invert max-w-none **:my-0"
            dangerouslySetInnerHTML={{ __html: task.requestDescription }}
            data-testid="task-tooltip-description"
          />
        )}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs border-t pt-2">
          <span className="text-muted-foreground">Priority</span>
          <span className="font-medium" data-testid="task-tooltip-priority">
            {task.priority ?? "—"}
          </span>
          {task.assignUserName && (
            <>
              <span className="text-muted-foreground">Assigned</span>
              <span data-testid="task-tooltip-assignee">
                {task.assignUserName}
              </span>
            </>
          )}
          {task.requestUserName && (
            <>
              <span className="text-muted-foreground">Requester</span>
              <span data-testid="task-tooltip-requester">
                {task.requestUserName}
              </span>
            </>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default TaskBlock;
