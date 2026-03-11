"use client";

import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Edit,
  Eye,
  FileText,
  MessageSquarePlus,
  Paperclip,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

import AttachmentView from "@/components/shared/attachment-view";
import AuditLogView from "@/components/shared/audit-log-view";
import { UserAvatar } from "@/components/shared/avatar-display";
import CollapsibleCard from "@/components/shared/collapsible-card";
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
import { Skeleton } from "@/components/ui/skeleton";
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
import { TicketDTO, TicketHealthLevel } from "@/types/tickets";
import { WorkflowStateDTO } from "@/types/workflows";

import WorkflowReviewDialog from "../workflows/workflow-review-dialog";

/* ─── tiny helper ─── */
const MetaField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <div className="text-sm">{children}</div>
  </div>
);

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
        if (!data)
          throw new Error("Could not find the specified team request.");
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

  const navigateToPreviousRecord = async () => {
    if (!ticket) return;
    const prev = await findPreviousTicket(
      ticket.id!,
      ticket.projectId,
      setError,
    );
    setTicket(prev);
  };

  const navigateToNextRecord = async () => {
    if (!ticket) return;
    const next = await findNextTicket(ticket.id!, ticket.projectId, setError);
    setTicket(next);
  };

  const handleFocusComments = () => {
    setSelectedTab("comments");
    setTimeout(() => {
      commentsViewRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleStateChangeRequest = async (state: WorkflowStateDTO) => {
    const updated = {
      ...ticket,
      currentStateId: state.id,
      currentStateName: state.stateName,
    };
    await updateTicket(updated.id!, updated, setError);
    setTicket(updated);
    setCurrentRequestState(state.stateName);
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="flex flex-col gap-4" data-testid="ticket-loading">
        {/* header skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-6 w-72" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <Card className="my-4" data-testid="ticket-not-found">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-destructive">
            {t.teams.tickets.detail("ticket_not_found_title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            {t.teams.tickets.detail("ticket_not_found_description")}
          </p>
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.common.buttons("go_back")}
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
          { title: ticket.requestTitle!, link: "#" },
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
        <div
          className="flex flex-col gap-4"
          data-testid="ticket-detail-container"
        >
          {/* ── Title bar ── */}
          <div
            className="flex items-start justify-between gap-4"
            data-testid="ticket-header"
          >
            {/* Left: prev + title */}
            <div className="flex items-start gap-2 min-w-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={navigateToPreviousRecord}
                      className="shrink-0 mt-0.5"
                      data-testid="previous-ticket-button"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t.teams.tickets.detail("previous_ticket")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="min-w-0">
                {/* Badge row */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ring-transparent"
                    style={{
                      backgroundColor: workflowColor.background,
                      color: workflowColor.text,
                    }}
                    data-testid="ticket-workflow-name"
                  >
                    {ticket.workflowRequestName}
                  </span>
                  <Badge
                    variant={ticket.isCompleted ? "secondary" : "default"}
                    className="rounded-full px-2.5 text-xs font-medium"
                    data-testid="ticket-state"
                  >
                    {currentRequestState}
                  </Badge>
                  <TicketPriorityDisplay priority={ticket.priority} />
                  {ticket.isCompleted && (
                    <Badge
                      variant="secondary"
                      className="rounded-full px-2.5 text-xs"
                    >
                      ✓ {t.common.misc("completed")}
                    </Badge>
                  )}
                </div>

                <h1
                  className={`text-2xl font-bold leading-tight tracking-tight ${
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

            {/* Right: next */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={navigateToNextRecord}
                    className="shrink-0 mt-0.5"
                    data-testid="next-ticket-button"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t.teams.tickets.detail("next_ticket")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* ── Action bar ── */}
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="ticket-actions"
          >
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(
                    `/portal/teams/${obfuscate(ticket.teamId)}/tickets/${obfuscate(ticket.id)}/edit?${randomPair()}`,
                  )
                }
                data-testid="edit-ticket-button"
              >
                <Edit className="mr-2 h-4 w-4" />
                {t.teams.tickets.detail("edit_ticket")}
              </Button>
            )}

            {canComment && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleFocusComments}
                data-testid="add-comment-button"
              >
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                {t.teams.tickets.detail("add_comment")}
              </Button>
            )}

            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" data-testid="change-status-button">
                    {t.teams.tickets.detail("change_status")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56"
                  data-testid="status-dropdown"
                >
                  <DropdownMenuGroup>
                    {workflowStates
                      .filter((s) => s.id !== ticket.currentStateId)
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
                      (s) => s.id !== ticket.currentStateId,
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
                      onClick={() => setWorkflowDialogOpen(true)}
                      className="cursor-pointer"
                      data-testid="view-workflow-option"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {t.teams.tickets.detail("view_workflow")}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {!canEdit && canComment && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWorkflowDialogOpen(true)}
                data-testid="view-workflow-button"
              >
                <Eye className="mr-2 h-4 w-4" />
                {t.teams.tickets.detail("view_workflow")}
              </Button>
            )}
          </div>

          {/* ── Health indicator ── */}
          {ticket.conversationHealth?.healthLevel && (
            <TicketHealthLevelDisplay
              currentLevel={
                ticket.conversationHealth.healthLevel as TicketHealthLevel
              }
              data-testid="ticket-health-level"
            />
          )}

          {/* ── Main layout: 2/3 + 1/3 ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* ── Left column: description + tabs ── */}
            <div className="flex flex-col gap-4 lg:col-span-2">
              {/* Description card */}
              <Card data-testid="ticket-description-card">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {t.teams.tickets.form.base("description")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{
                      __html: ticket.requestDescription!,
                    }}
                    data-testid="ticket-description-content"
                  />
                </CardContent>
              </Card>

              {/* Tabs card */}
              <Card data-testid="ticket-tabs-card">
                <Tabs
                  defaultValue="comments"
                  value={selectedTab}
                  onValueChange={setSelectedTab}
                >
                  <CardHeader className="border-b pb-0 pt-4 px-4">
                    <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                      <TabsTrigger
                        value="comments"
                        className="data-[state=active]:bg-background data-[state=active]:shadow-xs"
                      >
                        <MessageSquarePlus className="mr-2 h-4 w-4" />
                        {t.teams.tickets.detail("comments")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="changes-history"
                        className="data-[state=active]:bg-background data-[state=active]:shadow-xs"
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {t.teams.tickets.detail("changes_history")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="timeline-history"
                        className="data-[state=active]:bg-background data-[state=active]:shadow-xs"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        {t.teams.tickets.detail("timeline")}
                      </TabsTrigger>
                    </TabsList>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <TabsContent value="comments">
                      <div ref={commentsViewRef}>
                        <CommentsView
                          entityType="Ticket"
                          entityId={ticket.id!}
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="changes-history">
                      <AuditLogView entityType="Ticket" entityId={ticket.id!} />
                    </TabsContent>
                    <TabsContent value="timeline-history">
                      <TicketTimelineHistory teamId={ticket.id!} />
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>
            </div>

            {/* ── Right column: metadata cards ── */}
            <div className="flex flex-col gap-4">
              {/* People */}
              <CollapsibleCard
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
                title={t.teams.tickets.detail("people")}
                data-testid="ticket-people-card"
              >
                <div className="space-y-4">
                  <MetaField label={t.teams.tickets.form.base("requester")}>
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        imageUrl={ticket.requestUserImageUrl}
                        size="w-6 h-6"
                      />
                      <Link
                        href={`/portal/users/${obfuscate(ticket.requestUserId)}`}
                        className="hover:text-primary hover:underline underline-offset-4 transition-colors"
                        data-testid="requester-link"
                      >
                        {ticket.requestUserName}
                      </Link>
                    </div>
                  </MetaField>
                  <MetaField label={t.teams.tickets.form.base("assignee")}>
                    {ticket.assignUserId ? (
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          imageUrl={ticket.assignUserImageUrl}
                          size="w-6 h-6"
                        />
                        <Link
                          href={`/portal/users/${obfuscate(ticket.assignUserId)}`}
                          className="hover:text-primary hover:underline underline-offset-4 transition-colors"
                          data-testid="assignee-link"
                        >
                          {ticket.assignUserName}
                        </Link>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">
                        {t.teams.tickets.detail("unassigned")}
                      </span>
                    )}
                  </MetaField>
                </div>
              </CollapsibleCard>

              {/* Details */}
              <CollapsibleCard
                icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                title={t.teams.tickets.detail("ticker_detail")}
                data-testid="ticket-details-card"
              >
                <div className="space-y-4">
                  <MetaField label={t.teams.tickets.form.base("type")}>
                    <Badge variant="outline" className="font-normal">
                      {ticket.workflowRequestName}
                    </Badge>
                  </MetaField>
                  <MetaField label={t.teams.tickets.form.base("state")}>
                    <Badge variant="outline" className="font-normal">
                      {ticket.currentStateName}
                    </Badge>
                  </MetaField>
                  <MetaField label={t.teams.tickets.form.base("priority")}>
                    <TicketPriorityDisplay priority={ticket.priority} />
                  </MetaField>
                  {ticket.channel && (
                    <MetaField label={t.teams.tickets.form.base("channel")}>
                      <Badge variant="outline" className="font-normal">
                        {t.teams.tickets.form.channels(ticket.channel)}
                      </Badge>
                    </MetaField>
                  )}
                </div>
              </CollapsibleCard>

              {/* Dates */}
              <CollapsibleCard
                icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                title={t.teams.tickets.detail("important_dates")}
                data-testid="ticket-dates-card"
              >
                <div className="space-y-4">
                  <MetaField label={t.teams.tickets.form.base("created_at")}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-default">
                          {formatDateTimeDistanceToNow(
                            new Date(ticket.createdAt!),
                          )}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {new Date(ticket.createdAt!).toLocaleString()}
                      </TooltipContent>
                    </Tooltip>
                  </MetaField>
                  <MetaField
                    label={t.teams.tickets.form.base("last_modified_at")}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-default">
                          {formatDateTimeDistanceToNow(
                            new Date(ticket.modifiedAt!),
                          )}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {new Date(ticket.modifiedAt!).toLocaleString()}
                      </TooltipContent>
                    </Tooltip>
                  </MetaField>
                  <MetaField
                    label={t.teams.tickets.form.base("target_completion_date")}
                  >
                    {ticket.estimatedCompletionDate ? (
                      new Date(
                        ticket.estimatedCompletionDate,
                      ).toLocaleDateString()
                    ) : (
                      <span className="text-muted-foreground/70 italic">
                        {t.teams.tickets.detail("not_set")}
                      </span>
                    )}
                  </MetaField>
                  <MetaField
                    label={t.teams.tickets.form.base("actual_completion_date")}
                  >
                    {ticket.actualCompletionDate ? (
                      new Date(ticket.actualCompletionDate).toLocaleDateString()
                    ) : (
                      <span className="text-muted-foreground/70 italic">
                        {t.teams.tickets.detail("not_completed")}
                      </span>
                    )}
                  </MetaField>
                </div>
              </CollapsibleCard>

              {/* Attachments — collapsed by default */}
              <CollapsibleCard
                icon={<Paperclip className="h-4 w-4 text-muted-foreground" />}
                title={t.teams.tickets.detail("attachments")}
                defaultOpen={false}
                data-testid="ticket-attachments-card"
              >
                <AttachmentView entityType="Ticket" entityId={ticket.id!} />
              </CollapsibleCard>

              {/* Watchers — collapsed by default */}
              <CollapsibleCard
                icon={<Eye className="h-4 w-4 text-muted-foreground" />}
                title={t.teams.tickets.detail("watchers")}
                defaultOpen={false}
                data-testid="ticket-watchers-card"
              >
                <EntityWatchers entityType="Ticket" entityId={ticket.id!} />
              </CollapsibleCard>
            </div>
          </div>
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
