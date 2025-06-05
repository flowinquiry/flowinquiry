"use client";

import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

import { UserAvatar } from "@/components/shared/avatar-display";
import TruncatedHtmlLabel from "@/components/shared/truncate-html-label";
import TicketDetailSheet from "@/components/teams/ticket-detail-sheet";
import TicketHealthLevelDisplay from "@/components/teams/ticket-health-level-display";
import { TicketPriorityDisplay } from "@/components/teams/ticket-priority-display";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { obfuscate } from "@/lib/endecode";
import { cn, getSpecifiedColor } from "@/lib/utils";
import { TicketDTO } from "@/types/tickets";

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

  const closeSheet = () => {
    setSelectedRequest(null);
  };

  const getRequestStatusDetails = (request: TicketDTO) => {
    const currentDate = new Date();
    const estimatedCompletionDate = request.estimatedCompletionDate
      ? new Date(request.estimatedCompletionDate)
      : null;

    if (request.isCompleted) {
      return {
        icon: <CheckCircle className="text-green-600 w-5 h-5" />,
        text: "Completed",
        variant: "success",
      };
    }

    if (estimatedCompletionDate && estimatedCompletionDate < currentDate) {
      return {
        icon: <AlertTriangle className="text-red-600 w-5 h-5" />,
        text: "Overdue",
        variant: "destructive",
      };
    }

    return {
      icon: <Clock className="text-blue-600 w-5 h-5" />,
      text: "In Progress",
      variant: "default",
    };
  };

  return (
    <div className="space-y-4">
      {tickets.length === 0 ? (
        <Alert variant="default">
          <AlertTitle>{t.teams.tickets.list("no_ticket_title")}</AlertTitle>
          <AlertDescription>
            {t.teams.tickets.list("no_ticket_description")}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {tickets.map((request) => {
            const workflowColor = getSpecifiedColor(
              request.workflowRequestName!,
            );
            const statusDetails = getRequestStatusDetails(request);

            return (
              <div
                key={request.id}
                className={cn(
                  "relative rounded-lg shadow-xs overflow-hidden",
                  "border",
                  "bg-white dark:bg-gray-900",
                  "hover:shadow-md transition-all duration-300",
                  request.isCompleted ? "opacity-70" : "",
                )}
              >
                <div className="p-4">
                  {/* Two columns: Status icon and Content */}
                  <div className="flex">
                    {/* Status icon column */}
                    <div className="mr-4 pt-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>{statusDetails.icon}</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{statusDetails.text}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* Content column */}
                    <div className="flex-1 min-w-0">
                      {/* Top section */}
                      <div className="mb-8">
                        {/* Workflow badge */}
                        <div className="mb-2">
                          <Badge
                            style={{
                              backgroundColor: workflowColor.background,
                              color: workflowColor.text,
                            }}
                            className="inline-block"
                          >
                            {request.workflowRequestName}
                          </Badge>
                        </div>

                        {/* Title and priority */}
                        <div className="flex items-start mb-0">
                          {/* Title area - using div instead of button to avoid layout issues */}
                          <div
                            className="flex-1 mr-2 cursor-pointer"
                            onClick={() => handleRequestClick(request)}
                            role="button"
                            tabIndex={0}
                            aria-label={`${instantView ? "Open details for" : "Navigate to"} ${request.requestTitle}`}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                handleRequestClick(request);
                              }
                            }}
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <h3
                                    className={`text-xl text-left text-blue-600 hover:underline ${
                                      request.isCompleted ? "line-through" : ""
                                    }`}
                                  >
                                    {request.requestTitle}
                                  </h3>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    {request.requestTitle}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>

                          {/* Priority */}
                          <div className="shrink-0">
                            <TicketPriorityDisplay
                              priority={request.priority}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Health section */}
                      {request.conversationHealth?.healthLevel && (
                        <div className="mb-4">
                          <TicketHealthLevelDisplay
                            currentLevel={
                              request.conversationHealth.healthLevel
                            }
                          />
                        </div>
                      )}

                      {/* Description section */}
                      <div className="mb-6">
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          {t.teams.tickets.form.base("description")}
                        </div>
                        <TruncatedHtmlLabel
                          htmlContent={request.requestDescription!}
                          wordLimit={200}
                        />
                      </div>

                      {/* Metadata grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {/* Requester */}
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">
                            {t.teams.tickets.form.base("requester")}
                          </div>
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              imageUrl={request.requestUserImageUrl}
                              size="w-6 h-6"
                            />
                            <Link
                              href={`/portal/users/${obfuscate(request.requestUserId)}`}
                              className="text-sm hover:underline truncate"
                            >
                              {request.requestUserName}
                            </Link>
                          </div>
                        </div>

                        {/* Assigned User */}
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">
                            {t.teams.tickets.form.base("assignee")}
                          </div>
                          <div className="flex items-center gap-2">
                            {request.assignUserId ? (
                              <>
                                <UserAvatar
                                  imageUrl={request.assignUserImageUrl}
                                  size="w-6 h-6"
                                />
                                <Link
                                  href={`/portal/users/${obfuscate(request.assignUserId)}`}
                                  className="text-sm hover:underline truncate"
                                >
                                  {request.assignUserName}
                                </Link>
                              </>
                            ) : (
                              <span className="text-sm text-gray-500">
                                {t.teams.tickets.detail("unassigned")}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Channel */}
                        {request.channel && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">
                              {t.teams.tickets.form.base("channel")}
                            </div>
                            <Badge variant="outline">
                              {t.teams.tickets.form.channels(request.channel)}
                            </Badge>
                          </div>
                        )}

                        {/* Due Date */}
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">
                            {t.teams.tickets.form.base(
                              "target_completion_date",
                            )}
                          </div>
                          <div className="text-sm">
                            {request.estimatedCompletionDate
                              ? new Date(
                                  request.estimatedCompletionDate,
                                ).toLocaleDateString()
                              : ""}
                          </div>
                        </div>

                        {/* State */}
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">
                            {t.teams.tickets.form.base("state")}
                          </div>
                          <Badge variant="outline">
                            {request.currentStateName}
                          </Badge>
                        </div>

                        {request.projectId !== null && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">
                              {t.teams.tickets.form.base("project")}
                            </div>
                            <Button variant="link" className="p-0">
                              <Link
                                href={`/portal/teams/${obfuscate(request.teamId)}/projects/${obfuscate(request.projectId)}`}
                              >
                                {request.projectName}
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Only render the sheet if instantView is true and there's a selected request */}
          {instantView && selectedRequest && (
            <TicketDetailSheet
              open={!!selectedRequest}
              onClose={closeSheet}
              initialTicket={selectedRequest}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default TicketList;
