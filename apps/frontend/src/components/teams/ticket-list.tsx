"use client";

import { AlertTriangle, CheckCircle, Clock, Inbox } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

import { UserAvatar } from "@/components/shared/avatar-display";
import TicketDetailSheet from "@/components/teams/ticket-detail-sheet";
import TicketHealthLevelDisplay from "@/components/teams/ticket-health-level-display";
import { TicketPriorityDisplay } from "@/components/teams/ticket-priority-display";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { obfuscate } from "@/lib/endecode";
import { cn, getSpecifiedColor } from "@/lib/utils";
import { TicketDTO, TicketHealthLevel } from "@/types/tickets";

interface TicketListProps {
  tickets: TicketDTO[];
  instantView?: boolean;
}

const TicketList = ({ tickets, instantView = true }: TicketListProps) => {
  const t = useAppClientTranslations();
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState<TicketDTO | null>(
    null,
  );

  const handleRequestClick = (request: TicketDTO) => {
    if (instantView) {
      setSelectedRequest(request);
    } else {
      if (!request.projectId) {
        router.push(
          `/portal/teams/${obfuscate(request.teamId)}/tickets/${obfuscate(request.id)}`,
        );
      } else {
        router.push(
          `/portal/teams/${obfuscate(request.teamId)}/projects/${obfuscate(request.projectId)}/${obfuscate(request.id)}`,
        );
      }
    }
  };

  const getStatusDetails = (request: TicketDTO) => {
    const currentDate = new Date();
    const estimatedCompletionDate = request.estimatedCompletionDate
      ? new Date(request.estimatedCompletionDate)
      : null;

    if (request.isCompleted) {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        text: "Completed",
      };
    }
    if (estimatedCompletionDate && estimatedCompletionDate < currentDate) {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
        text: "Overdue",
      };
    }
    return {
      icon: <Clock className="h-4 w-4 text-blue-500" />,
      text: "In Progress",
    };
  };

  if (tickets.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center"
        data-testid="no-tickets-alert"
      >
        <Inbox className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm font-medium">
          {t.teams.tickets.list("no_ticket_title")}
        </p>
        <p className="text-xs text-muted-foreground">
          {t.teams.tickets.list("no_ticket_description")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="ticket-list-container">
      {tickets.map((request) => {
        const workflowColor = getSpecifiedColor(request.workflowRequestName!);
        const statusDetails = getStatusDetails(request);

        return (
          <Card
            key={request.id}
            className={cn(
              "group transition-all hover:shadow-md hover:bg-muted/50 gap-0 py-0",
              request.isCompleted && "opacity-60",
            )}
            data-testid={`ticket-item-${request.id}`}
          >
            <CardHeader className="py-2 px-4 flex flex-row items-start gap-3">
              {/* Status icon */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="mt-1 shrink-0"
                      data-testid={`ticket-status-icon-${request.id}`}
                    >
                      {statusDetails.icon}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{statusDetails.text}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Workflow badge + title + priority */}
              <div className="min-w-0 flex-1">
                {/* Badges row — priority on the right */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      style={{
                        backgroundColor: workflowColor.background,
                        color: workflowColor.text,
                      }}
                      data-testid={`ticket-workflow-badge-${request.id}`}
                    >
                      {request.workflowRequestName}
                    </Badge>
                    <Badge
                      variant="outline"
                      data-testid={`state-badge-${request.id}`}
                    >
                      {request.currentStateName}
                    </Badge>
                    {request.channel && (
                      <Badge
                        variant="outline"
                        data-testid={`channel-badge-${request.id}`}
                      >
                        {t.teams.tickets.form.channels(request.channel)}
                      </Badge>
                    )}
                  </div>
                  <div
                    className="shrink-0"
                    data-testid={`ticket-priority-${request.id}`}
                  >
                    <TicketPriorityDisplay priority={request.priority} />
                  </div>
                </div>

                {/* Title row */}
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => handleRequestClick(request)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      handleRequestClick(request);
                  }}
                  data-testid={`ticket-title-${request.id}`}
                >
                  <h3
                    className={cn(
                      "text-base font-semibold leading-snug hover:text-primary hover:underline underline-offset-4 transition-colors",
                      request.isCompleted && "line-through",
                    )}
                  >
                    {request.requestTitle}
                  </h3>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 py-1 pb-2 pl-10 pr-4">
              {/* Health */}
              {request.conversationHealth?.healthLevel && (
                <div
                  className="mb-2"
                  data-testid={`ticket-health-${request.id}`}
                >
                  <TicketHealthLevelDisplay
                    currentLevel={
                      request.conversationHealth
                        .healthLevel as TicketHealthLevel
                    }
                  />
                </div>
              )}

              {/* Description */}
              {request.requestDescription && (
                <div
                  className="text-sm text-muted-foreground leading-snug [&>div]:m-0 [&>div]:p-0"
                  data-testid={`ticket-description-${request.id}`}
                  dangerouslySetInnerHTML={{
                    __html: request.requestDescription,
                  }}
                />
              )}
            </CardContent>

            {/* Metadata footer */}
            <CardFooter
              className="p-0 border-t py-2 pl-10 pr-4 flex flex-wrap gap-x-6 gap-y-1 [&.border-t]:pt-2"
              data-testid={`ticket-metadata-${request.id}`}
            >
              {/* Requester */}
              <div
                className="flex items-center gap-1.5"
                data-testid={`ticket-requester-${request.id}`}
              >
                <span className="text-xs text-muted-foreground">
                  {t.teams.tickets.form.base("requester")}:
                </span>
                <UserAvatar
                  imageUrl={request.requestUserImageUrl}
                  size="w-5 h-5"
                />
                <Link
                  href={`/portal/users/${obfuscate(request.requestUserId)}`}
                  className="text-xs hover:text-primary hover:underline underline-offset-4 transition-colors"
                  data-testid={`requester-link-${request.id}`}
                >
                  {request.requestUserName}
                </Link>
              </div>

              {/* Assignee */}
              <div
                className="flex items-center gap-1.5"
                data-testid={`ticket-assignee-info-${request.id}`}
              >
                <span className="text-xs text-muted-foreground">
                  {t.teams.tickets.form.base("assignee")}:
                </span>
                {request.assignUserId ? (
                  <>
                    <UserAvatar
                      imageUrl={request.assignUserImageUrl}
                      size="w-5 h-5"
                    />
                    <Link
                      href={`/portal/users/${obfuscate(request.assignUserId)}`}
                      className="text-xs hover:text-primary hover:underline underline-offset-4 transition-colors"
                      data-testid={`assignee-link-${request.id}`}
                    >
                      {request.assignUserName}
                    </Link>
                  </>
                ) : (
                  <span
                    className="text-xs text-muted-foreground/70"
                    data-testid={`unassigned-message-${request.id}`}
                  >
                    {t.teams.tickets.detail("unassigned")}
                  </span>
                )}
              </div>

              {/* Due date */}
              {request.estimatedCompletionDate && (
                <div
                  className="flex items-center gap-1.5"
                  data-testid={`ticket-due-date-${request.id}`}
                >
                  <span className="text-xs text-muted-foreground">
                    {t.teams.tickets.form.base("target_completion_date")}:
                  </span>
                  <span className="text-xs">
                    {new Date(
                      request.estimatedCompletionDate,
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* Project */}
              {request.projectId !== null && (
                <div
                  className="flex items-center gap-1.5"
                  data-testid={`ticket-project-${request.id}`}
                >
                  <span className="text-xs text-muted-foreground">
                    {t.teams.tickets.form.base("project")}:
                  </span>
                  <Link
                    href={`/portal/teams/${obfuscate(request.teamId)}/projects/${obfuscate(request.projectId)}`}
                    className="text-xs hover:text-primary hover:underline underline-offset-4 transition-colors"
                    data-testid={`project-link-${request.id}`}
                  >
                    {request.projectName}
                  </Link>
                </div>
              )}
            </CardFooter>
          </Card>
        );
      })}

      {instantView && selectedRequest && (
        <TicketDetailSheet
          open={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          initialTicket={selectedRequest}
          data-testid="ticket-detail-sheet"
        />
      )}
    </div>
  );
};

export default TicketList;
