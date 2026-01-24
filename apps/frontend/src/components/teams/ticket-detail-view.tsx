"use client";

import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Edit,
  Eye,
  FileText,
  Loader2,
  MessageSquarePlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

import AttachmentView from "@/components/shared/attachment-view";
import AuditLogView from "@/components/shared/audit-log-view";
import { UserAvatar } from "@/components/shared/avatar-display";
import CommentsView from "@/components/shared/comments-view";
import EntityWatchers from "@/components/shared/entity-watchers";
import TeamNavLayout from "@/components/teams/team-nav";
import TicketHealthLevelDisplay from "@/components/teams/ticket-health-level-display";
import { TicketPriorityDisplay } from "@/components/teams/ticket-priority-display";
import TicketTimelineHistory from "@/components/teams/ticket-timeline-history";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  findNextTicket,
  findPreviousTicket,
  findTicketById,
  updateTicket,
} from "@/lib/actions/tickets.action";
import { getValidTargetStates } from "@/lib/actions/workflows.action";
import { formatDateTimeDistanceToNow } from "@/lib/datetime";
import { obfuscate } from "@/lib/endecode";
import { getSpecifiedColor, randomPair } from "@/lib/utils";
import { BreadcrumbProvider } from "@/providers/breadcrumb-provider";
import { useError } from "@/providers/error-provider";
import { useUserTeamRole } from "@/providers/user-team-role-provider";
import { PermissionUtils } from "@/types/resources";
import { TicketDTO } from "@/types/tickets";
import { WorkflowStateDTO } from "@/types/workflows";

import WorkflowReviewDialog from "../workflows/workflow-review-dialog";

const TicketDetailView = ({ ticketId }: { ticketId: number }) => {
  const permissionLevel = usePagePermission();
  const teamRole = useUserTeamRole().role;
  const router = useRouter();

  const [selectedTab, setSelectedTab] = useState("comments");
  const [ticket, setTicket] = useState<TicketDTO>({} as TicketDTO);
  const [loading, setLoading] = useState(true);
  const { setError } = useError();
  const [workflowStates, setWorkflowStates] = useState<WorkflowStateDTO[]>([]);
  const [currentRequestState, setCurrentRequestState] = useState<String>("");
  const [isWorkflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const t = useAppClientTranslations();

  const commentsViewRef = useRef<HTMLDivElement | null>(null);

  const canEdit =
    PermissionUtils.canWrite(permissionLevel) ||
    teamRole === "manager" ||
    teamRole === "member";
  const canComment = canEdit || teamRole === "guest";

  useEffect(() => {
    const fetchRequest = async () => {
      setLoading(true);
      try {
        const data = await findTicketById(ticketId, setError);
        if (!data) {
          throw new Error("Could not find the specified team request.");
        }
        setTicket(data);
        setCurrentRequestState(data.currentStateName!);
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [ticketId, setError]);

  useEffect(() => {
    const loadWorkflowStates = async () => {
      if (ticket?.workflowId && ticket?.currentStateId) {
        const data = await getValidTargetStates(
          ticket.workflowId,
          ticket.currentStateId,
          true,
          setError,
        );
        setWorkflowStates(data);
      }
    };

    loadWorkflowStates();
  }, [ticket?.workflowId, ticket?.currentStateId, setError]);

  const handleViewWorkflow = () => {
    setWorkflowDialogOpen(true);
  };

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
  };

  const navigateToPreviousRecord = async () => {
    if (!ticket) return;
    const previousTicket = await findPreviousTicket(
      ticket.id!,
      ticket.projectId,
      setError,
    );
    setTicket(previousTicket);
  };

  const navigateToNextRecord = async () => {
    if (!ticket) return;
    const nextTicket = await findNextTicket(
      ticket.id!,
      ticket.projectId,
      setError,
    );
    setTicket(nextTicket);
  };

  const handleFocusComments = () => {
    setSelectedTab("comments");
    setTimeout(() => {
      if (commentsViewRef.current) {
        commentsViewRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  const handleStateChangeRequest = async (state: WorkflowStateDTO) => {
    const updatedRequest = {
      ...ticket,
      currentStateId: state.id,
      currentStateName: state.stateName,
    };
    await updateTicket(updatedRequest.id!, updatedRequest, setError);
    setTicket(updatedRequest);
    setCurrentRequestState(state.stateName);
  };

  if (loading) {
    return (
      <div
        className="flex h-64 items-center justify-center"
        data-testid="ticket-loading"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg font-medium">
          {t.common.misc("loading_data")}
        </span>
      </div>
    );
  }

  if (!ticket) {
    return (
      <Card className="my-4" data-testid="ticket-not-found">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-500">
            {t.teams.tickets.detail("ticket_not_found_title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            {t.teams.tickets.detail("ticket_not_found_description")}
          </p>
          <Button
            variant="secondary"
            onClick={() => router.back()}
            data-testid="go-back-button"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> {t.common.buttons("go_back")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("teams"), link: "/portal/teams" },
    {
      title: ticket.teamName!,
      link: `/portal/teams/${obfuscate(ticket.teamId)}`,
    },
    ...(ticket.projectId
      ? [
          {
            title: t.common.navigation("projects"),
            link: `/portal/teams/${obfuscate(ticket.teamId)}/projects`,
          },
          {
            title: ticket.projectName!,
            link: `/portal/teams/${obfuscate(ticket.teamId)}/projects/${ticket.projectShortName}`,
          },
          {
            title: ticket.requestTitle!,
            link: "#",
          },
        ]
      : [
          {
            title: t.common.navigation("tickets"),
            link: `/portal/teams/${obfuscate(ticket.teamId)}/tickets`,
          },
          { title: ticket.requestTitle!, link: "#" },
        ]),
  ];

  const workflowColor = getSpecifiedColor(ticket.workflowRequestName!);

  return (
    <BreadcrumbProvider items={breadcrumbItems}>
      <TeamNavLayout teamId={ticket.teamId!}>
        <div className="space-y-4" data-testid="ticket-detail-container">
          {/* Header with Title and Navigation */}
          <div
            className="flex items-start justify-between gap-4"
            data-testid="ticket-header"
          >
            <div className="flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={navigateToPreviousRecord}
                      className="mr-1"
                      data-testid="previous-ticket-button"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t.teams.tickets.detail("previous_ticket")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span
                    className="inline-block rounded-md px-2 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: workflowColor.background,
                      color: workflowColor.text,
                    }}
                    data-testid="ticket-workflow-name"
                  >
                    {ticket.workflowRequestName}
                  </span>

                  <Badge
                    variant={ticket.isCompleted ? "secondary" : "outline"}
                    className="font-normal"
                    data-testid="ticket-state"
                  >
                    {currentRequestState}
                  </Badge>

                  <TicketPriorityDisplay
                    priority={ticket.priority}
                    data-testid="ticket-priority"
                  />
                </div>

                <h1
                  className={`mt-1 text-2xl font-semibold ${
                    ticket.isCompleted
                      ? "line-through text-muted-foreground"
                      : ""
                  }`}
                  data-testid="ticket-title"
                >
                  {ticket.requestTitle}
                </h1>
              </div>
            </div>

            <div className="flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={navigateToNextRecord}
                      className="ml-1"
                      data-testid="next-ticket-button"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t.teams.tickets.detail("next_ticket")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div
            className="flex flex-wrap items-center justify-end gap-3"
            data-testid="ticket-actions"
          >
            {canEdit && (
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    `/portal/teams/${obfuscate(ticket.teamId)}/tickets/${obfuscate(ticket.id)}/edit?${randomPair()}`,
                  )
                }
                data-testid="edit-ticket-button"
              >
                <Edit className="mr-2 h-4 w-4" />{" "}
                {t.teams.tickets.detail("edit_ticket")}
              </Button>
            )}

            {canComment && (
              <Button
                variant="outline"
                onClick={handleFocusComments}
                data-testid="add-comment-button"
              >
                <MessageSquarePlus className="mr-2 h-4 w-4" />{" "}
                {t.teams.tickets.detail("add_comment")}
              </Button>
            )}

            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="flex items-center gap-2"
                    data-testid="change-status-button"
                  >
                    {t.teams.tickets.detail("change_status")}{" "}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56"
                  data-testid="status-dropdown"
                >
                  <DropdownMenuGroup>
                    {workflowStates
                      .filter((state) => state.id !== ticket.currentStateId)
                      .map((state) => (
                        <DropdownMenuItem
                          key={state.id}
                          onClick={() => handleStateChangeRequest(state)}
                          className="cursor-pointer"
                          data-testid={`status-option-${state.id}`}
                        >
                          {state.stateName}
                        </DropdownMenuItem>
                      ))}

                    {workflowStates.filter(
                      (state) => state.id !== ticket.currentStateId,
                    ).length === 0 && (
                      <DropdownMenuItem
                        disabled
                        data-testid="no-available-states"
                      >
                        {t.teams.tickets.detail("no_available_states")}
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleViewWorkflow}
                      className="cursor-pointer"
                      data-testid="view-workflow-option"
                    >
                      <Eye className="mr-2 h-4 w-4" />{" "}
                      {t.teams.tickets.detail("view_workflow")}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {!canEdit && canComment && (
              <Button
                variant="outline"
                onClick={handleViewWorkflow}
                data-testid="view-workflow-button"
              >
                <Eye className="mr-2 h-4 w-4" />{" "}
                {t.teams.tickets.detail("view_workflow")}
              </Button>
            )}
          </div>

          {/* Health Level Indicator */}
          {ticket.conversationHealth?.healthLevel && (
            <TicketHealthLevelDisplay
              currentLevel={ticket.conversationHealth.healthLevel}
              data-testid="ticket-health-level"
            />
          )}

          <Card className="overflow-hidden" data-testid="ticket-details-card">
            <CardContent className="p-0">
              <div className="p-6 space-y-6" data-testid="ticket-content">
                <div data-testid="ticket-description-section">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <FileText className="mr-2 h-5 w-5" />{" "}
                    {t.teams.tickets.form.base("description")}
                  </h3>
                  <div
                    className="prose dark:prose-invert max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{
                      __html: ticket.requestDescription!,
                    }}
                    data-testid="ticket-description-content"
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div
                    className="space-y-4"
                    data-testid="ticket-people-section"
                  >
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <Users className="mr-2 h-4 w-4" />{" "}
                      {t.teams.tickets.detail("people")}
                    </h3>

                    <div className="space-y-3">
                      <div data-testid="ticket-requester">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t.teams.tickets.form.base("requester")}
                        </p>
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            imageUrl={ticket.requestUserImageUrl}
                            size="w-6 h-6"
                            data-testid="requester-avatar"
                          />
                          <Link
                            href={`/portal/users/${obfuscate(ticket.requestUserId)}`}
                            className="text-sm hover:underline"
                            data-testid="requester-link"
                          >
                            {ticket.requestUserName}
                          </Link>
                        </div>
                      </div>

                      <div data-testid="ticket-assignee">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t.teams.tickets.form.base("assignee")}
                        </p>
                        {ticket.assignUserId ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              imageUrl={ticket.assignUserImageUrl}
                              size="w-6 h-6"
                              data-testid="assignee-avatar"
                            />
                            <Link
                              href={`/portal/users/${obfuscate(ticket.assignUserId)}`}
                              className="text-sm hover:underline"
                              data-testid="assignee-link"
                            >
                              {ticket.assignUserName}
                            </Link>
                          </div>
                        ) : (
                          <span
                            className="text-sm text-muted-foreground"
                            data-testid="unassigned-message"
                          >
                            {t.teams.tickets.detail("unassigned")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="space-y-4"
                    data-testid="ticket-details-section"
                  >
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <FileText className="mr-2 h-4 w-4" />{" "}
                      {t.teams.tickets.detail("ticker_detail")}
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div data-testid="ticket-type">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t.teams.tickets.form.base("type")}
                        </p>
                        <Badge
                          variant="outline"
                          className="font-normal"
                          data-testid="ticket-type-badge"
                        >
                          {ticket.workflowRequestName}
                        </Badge>
                      </div>

                      <div data-testid="ticket-state-detail">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t.teams.tickets.form.base("state")}
                        </p>
                        <Badge
                          variant="outline"
                          className="font-normal"
                          data-testid="ticket-state-badge"
                        >
                          {ticket.currentStateName}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {t.teams.tickets.form.base("priority")}
                        </p>
                        <TicketPriorityDisplay priority={ticket.priority} />
                      </div>

                      {ticket.channel && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {t.teams.tickets.form.base("channel")}
                          </p>
                          <Badge variant="outline" className="font-normal">
                            {t.teams.tickets.form.channels(ticket.channel)}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />{" "}
                    {t.teams.tickets.detail("important_dates")}
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {t.teams.tickets.form.base("created_at")}
                      </p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-sm">
                              {formatDateTimeDistanceToNow(
                                new Date(ticket.createdAt!),
                              )}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>
                            {new Date(ticket.createdAt!).toLocaleString()}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {t.teams.tickets.form.base("last_modified_at")}
                      </p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-sm">
                              {formatDateTimeDistanceToNow(
                                new Date(ticket.modifiedAt!),
                              )}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>
                            {new Date(ticket.modifiedAt!).toLocaleString()}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {t.teams.tickets.form.base("target_completion_date")}
                      </p>
                      <p className="text-sm">
                        {ticket.estimatedCompletionDate
                          ? new Date(
                              ticket.estimatedCompletionDate,
                            ).toLocaleDateString()
                          : t.teams.tickets.detail("not_set")}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {t.teams.tickets.form.base("actual_completion_date")}
                      </p>
                      <p className="text-sm">
                        {ticket.actualCompletionDate
                          ? new Date(
                              ticket.actualCompletionDate,
                            ).toLocaleDateString()
                          : t.teams.tickets.detail("not_completed")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mt-6"></div>

                <div className="space-y-4 mt-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <FileText className="mr-2 h-4 w-4" />{" "}
                      {t.teams.tickets.detail("attachments")}
                    </h3>
                    <AttachmentView entityType="Ticket" entityId={ticket.id!} />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <Users className="mr-2 h-4 w-4" />{" "}
                      {t.teams.tickets.detail("watchers")}
                    </h3>
                    <EntityWatchers entityType="Ticket" entityId={ticket.id!} />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="pb-6">
                <Tabs
                  defaultValue="comments"
                  value={selectedTab}
                  onValueChange={handleTabChange}
                  className="w-full"
                >
                  <TabsList className="mx-6 mt-6 grid w-full grid-cols-3 bg-muted/50">
                    <TabsTrigger
                      value="comments"
                      className="data-[state=active]:bg-background data-[state=active]:shadow-xs"
                    >
                      <MessageSquarePlus className="mr-2 h-4 w-4" />{" "}
                      {t.teams.tickets.detail("comments")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="changes-history"
                      className="data-[state=active]:bg-background data-[state=active]:shadow-xs"
                    >
                      <Clock className="mr-2 h-4 w-4" />{" "}
                      {t.teams.tickets.detail("changes_history")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="timeline-history"
                      className="data-[state=active]:bg-background data-[state=active]:shadow-xs"
                    >
                      <FileText className="mr-2 h-4 w-4" />{" "}
                      {t.teams.tickets.detail("timeline")}
                    </TabsTrigger>
                  </TabsList>

                  <div className="mx-6 mt-6">
                    <TabsContent value="comments">
                      {selectedTab === "comments" && (
                        <div ref={commentsViewRef}>
                          <CommentsView
                            entityType="Ticket"
                            entityId={ticket.id!}
                          />
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="changes-history">
                      {selectedTab === "changes-history" && (
                        <AuditLogView
                          entityType="Ticket"
                          entityId={ticket.id!}
                        />
                      )}
                    </TabsContent>
                    <TabsContent value="timeline-history">
                      {selectedTab === "timeline-history" && (
                        <TicketTimelineHistory teamId={ticket.id!} />
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>

        <WorkflowReviewDialog
          workflowId={ticket.workflowId!}
          open={isWorkflowDialogOpen}
          onClose={() => setWorkflowDialogOpen(false)}
        />
      </TeamNavLayout>
    </BreadcrumbProvider>
  );
};

export default TicketDetailView;
