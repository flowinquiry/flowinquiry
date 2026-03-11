"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  MessageSquare,
  Paperclip,
  Pencil,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";

import AttachmentView from "@/components/shared/attachment-view";
import { UserAvatar } from "@/components/shared/avatar-display";
import CollapsibleCard from "@/components/shared/collapsible-card";
import CommentsView from "@/components/shared/comments-view";
import EntityWatchers from "@/components/shared/entity-watchers";
import RichTextEditor from "@/components/shared/rich-text-editor";
import TicketChannelSelectField from "@/components/teams/team-ticket-channel-select";
import TeamUserSelectField from "@/components/teams/team-users-select-field";
import TicketHealthLevelDisplay from "@/components/teams/ticket-health-level-display";
import { TicketPriorityDisplay } from "@/components/teams/ticket-priority-display";
import { TicketPrioritySelect } from "@/components/teams/ticket-priority-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import WorkflowStateSelectField from "@/components/workflows/workflow-state-select-field";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { updateTicket } from "@/lib/actions/tickets.action";
import { obfuscate } from "@/lib/endecode";
import { cn, getSpecifiedColor } from "@/lib/utils";
import { useError } from "@/providers/error-provider";
import { TicketDTO, TicketHealthLevel } from "@/types/tickets";

/* ── tiny meta-field helper ── */
const MetaLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs text-muted-foreground mb-1">{children}</p>
);

/* ── inline save/cancel bar ── */
const InlineActions = ({
  onSave,
  onCancel,
  t,
}: {
  onSave: () => void;
  onCancel: () => void;
  t: ReturnType<typeof useAppClientTranslations>;
}) => (
  <div className="flex justify-end gap-2 mt-2">
    <Button type="button" variant="ghost" size="sm" onClick={onSave}>
      {t.common.buttons("save")}
    </Button>
    <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
      {t.common.buttons("cancel")}
    </Button>
  </div>
);

/* ── editable section wrapper ── */
const EditableSection = ({
  children,
  onEdit,
  editableClassName,
}: {
  children: React.ReactNode;
  onEdit: () => void;
  editableClassName?: string;
}) => {
  const t = useAppClientTranslations();
  return (
    <div
      className={cn(
        "group relative rounded-md border border-transparent cursor-pointer",
        "hover:border-dashed hover:border-muted-foreground/40 hover:bg-muted/30",
        "transition-colors",
        editableClassName,
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit();
      }}
    >
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger className="absolute inset-0 z-10 cursor-pointer" />
          <TooltipContent side="bottom" className="flex items-center gap-1.5">
            <Pencil className="h-3 w-3" />
            {t.teams.tickets.detail("click_to_edit")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className="px-1 py-0.5">{children}</div>
    </div>
  );
};

/* ── types ── */
type TicketDetailsProps = {
  open: boolean;
  onClose: () => void;
  initialTicket: TicketDTO;
};

interface TicketDTOWithStringDates extends Omit<
  TicketDTO,
  "estimatedCompletionDate"
> {
  estimatedCompletionDate?: string | null;
}

const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  return dateString.split("T")[0];
};

/* ══════════════════════════════════════════════════════════════ */
const TicketDetailSheet: React.FC<TicketDetailsProps> = ({
  open,
  onClose,
  initialTicket,
}) => {
  const [ticket, setTicket] = useState<TicketDTO>(initialTicket);
  const workflowColor = getSpecifiedColor(initialTicket.workflowRequestName!);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const [isEditingChannel, setIsEditingChannel] = useState(false);
  const [isEditingCompletionDate, setIsEditingCompletionDate] = useState(false);
  const [isEditingAssignment, setIsEditingAssignment] = useState(false);

  const { setError } = useError();
  const t = useAppClientTranslations();

  const form = useForm<TicketDTOWithStringDates>({
    defaultValues: ticket as unknown as TicketDTOWithStringDates,
  });

  const onSubmit = async (formData: TicketDTOWithStringDates) => {
    try {
      const data = {
        ...formData,
        estimatedCompletionDate: formData.estimatedCompletionDate,
      } as unknown as TicketDTO;
      const updatedRequest = await updateTicket(ticket.id!, data, setError);
      setTicket(updatedRequest);
      setIsEditingTitle(false);
      setIsEditingDescription(false);
      setIsEditingStatus(false);
      setIsEditingPriority(false);
      setIsEditingChannel(false);
      setIsEditingCompletionDate(false);
    } catch (err) {
      console.error("Failed to update request", err);
    }
  };

  const saveAndClose = (closeFn: () => void) => {
    form.handleSubmit(onSubmit)();
    closeFn();
  };

  /* ── status icon ── */
  const currentDate = new Date();
  const estimatedCompletionDate = initialTicket.estimatedCompletionDate
    ? new Date(initialTicket.estimatedCompletionDate)
    : null;

  const StatusIcon = () => {
    if (initialTicket.isCompleted)
      return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />;
    if (estimatedCompletionDate && estimatedCompletionDate < currentDate)
      return <AlertCircle className="h-4 w-4 text-destructive shrink-0" />;
    return <Clock className="h-4 w-4 text-blue-500 shrink-0" />;
  };

  return (
    <FormProvider {...form}>
      <Sheet
        open={open}
        onOpenChange={onClose}
        data-testid="ticket-detail-sheet"
      >
        <SheetContent
          className="w-full sm:max-w-6xl p-0 flex flex-col h-full"
          data-testid="ticket-detail-sheet-content"
        >
          {/* ── Sticky header ── */}
          <SheetHeader
            className="px-6 py-4 border-b shrink-0"
            data-testid="ticket-detail-header"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                {/* Badge row */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      backgroundColor: workflowColor.background,
                      color: workflowColor.text,
                    }}
                    data-testid="ticket-workflow-badge"
                  >
                    {initialTicket.workflowRequestName}
                  </span>
                  <Badge
                    variant={
                      initialTicket.isCompleted ? "secondary" : "default"
                    }
                    className="rounded-full text-xs font-normal"
                    data-testid="ticket-state-badge"
                  >
                    {ticket.currentStateName ?? initialTicket.currentStateName}
                  </Badge>
                  <TicketPriorityDisplay
                    priority={ticket.priority ?? initialTicket.priority}
                  />
                </div>

                {/* Title */}
                <SheetTitle className="p-0" data-testid="ticket-detail-title">
                  {isEditingTitle ? (
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="flex items-center gap-2"
                      data-testid="edit-title-form"
                    >
                      <Controller
                        name="requestTitle"
                        control={form.control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            className="text-lg font-semibold"
                            autoFocus
                            data-testid="title-input"
                          />
                        )}
                      />
                      <InlineActions
                        onSave={() =>
                          saveAndClose(() => setIsEditingTitle(false))
                        }
                        onCancel={() => setIsEditingTitle(false)}
                        t={t}
                      />
                    </form>
                  ) : (
                    <div
                      className="flex items-center gap-2 group/title"
                      data-testid="ticket-title-container"
                    >
                      <Link
                        href={`/portal/teams/${obfuscate(ticket.teamId)}/tickets/${obfuscate(ticket.id)}`}
                        className={cn(
                          "text-xl font-bold leading-tight hover:text-primary hover:underline underline-offset-4 transition-colors",
                          initialTicket.isCompleted &&
                            "line-through text-muted-foreground",
                        )}
                        data-testid="ticket-title-link"
                      >
                        {ticket.requestTitle ?? initialTicket.requestTitle}
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setIsEditingTitle(true);
                        }}
                        className="opacity-0 group-hover/title:opacity-100 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                        aria-label="Edit title"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </SheetTitle>

                {/* Health */}
                {initialTicket.conversationHealth?.healthLevel && (
                  <TicketHealthLevelDisplay
                    currentLevel={
                      initialTicket.conversationHealth
                        .healthLevel as TicketHealthLevel
                    }
                    data-testid="ticket-health-level"
                  />
                )}
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mt-0.5"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </SheetHeader>

          {/* ── Scrollable body ── */}
          <ScrollArea
            className="flex-1 min-h-0"
            data-testid="ticket-detail-scroll-area"
          >
            <div className="px-6 py-5">
              <div
                className="grid grid-cols-1 gap-4 lg:grid-cols-3"
                data-testid="ticket-detail-grid"
              >
                {/* ── Left 2/3 ── */}
                <div
                  className="flex flex-col gap-4 lg:col-span-2"
                  data-testid="ticket-main-content"
                >
                  {/* Description */}
                  <CollapsibleCard
                    icon={
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    }
                    title={t.teams.tickets.form.base("description")}
                    data-testid="ticket-description-section"
                  >
                    {isEditingDescription ? (
                      <div
                        className="relative z-50"
                        onClick={(e) => e.stopPropagation()}
                        data-testid="description-editor-container"
                      >
                        <RichTextEditor
                          key="description-editor"
                          value={ticket.requestDescription}
                          onChange={(content: string) => {
                            form.setValue("requestDescription", content, {
                              shouldValidate: false,
                              shouldDirty: true,
                            });
                          }}
                          onBlur={() => {
                            form.handleSubmit(onSubmit)();
                            setIsEditingDescription(false);
                          }}
                        />
                      </div>
                    ) : (
                      <EditableSection
                        onEdit={() => setIsEditingDescription(true)}
                        data-testid="description-editable-section"
                      >
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
                          dangerouslySetInnerHTML={{
                            __html: ticket.requestDescription!,
                          }}
                          data-testid="description-content"
                        />
                      </EditableSection>
                    )}
                  </CollapsibleCard>

                  {/* Comments */}
                  <CollapsibleCard
                    icon={
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    }
                    title={t.teams.tickets.detail("comments")}
                    data-testid="comments-section"
                  >
                    <CommentsView entityType="Ticket" entityId={ticket.id!} />
                  </CollapsibleCard>
                </div>

                {/* ── Right 1/3 — mirrors ticket-detail-view ── */}
                <div
                  className="flex flex-col gap-4"
                  data-testid="ticket-sidebar"
                >
                  {/* People */}
                  <CollapsibleCard
                    icon={<User className="h-4 w-4 text-muted-foreground" />}
                    title={t.teams.tickets.detail("people")}
                    data-testid="people-assignment-section"
                  >
                    <div className="space-y-4">
                      {/* Requester */}
                      <div data-testid="requester-container">
                        <MetaLabel>
                          {t.teams.tickets.form.base("requester")}
                        </MetaLabel>
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            imageUrl={ticket.requestUserImageUrl}
                            size="w-6 h-6"
                          />
                          <Link
                            href={`/portal/users/${obfuscate(ticket.requestUserId)}`}
                            className="text-sm hover:text-primary hover:underline underline-offset-4 transition-colors"
                          >
                            {ticket.requestUserName}
                          </Link>
                        </div>
                      </div>

                      {/* Assignee */}
                      <div data-testid="assignee-container">
                        <MetaLabel>
                          {t.teams.tickets.form.base("assignee")}
                        </MetaLabel>
                        {isEditingAssignment ? (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            data-testid="assignment-edit-container"
                          >
                            <TeamUserSelectField
                              form={form}
                              fieldName="assignUserId"
                              label=""
                              teamId={ticket.teamId!}
                            />
                            <InlineActions
                              onSave={() =>
                                saveAndClose(() =>
                                  setIsEditingAssignment(false),
                                )
                              }
                              onCancel={() => setIsEditingAssignment(false)}
                              t={t}
                            />
                          </div>
                        ) : (
                          <EditableSection
                            onEdit={() => setIsEditingAssignment(true)}
                          >
                            <div className="flex items-center gap-2">
                              {(ticket.assignUserId ??
                              initialTicket.assignUserId) ? (
                                <>
                                  <UserAvatar
                                    imageUrl={
                                      ticket.assignUserImageUrl ??
                                      initialTicket.assignUserImageUrl
                                    }
                                    size="w-6 h-6"
                                  />
                                  <Link
                                    href={`/portal/users/${obfuscate(ticket.assignUserId ?? initialTicket.assignUserId!)}`}
                                    className="text-sm hover:text-primary hover:underline underline-offset-4 transition-colors"
                                  >
                                    {ticket.assignUserName ??
                                      initialTicket.assignUserName}
                                  </Link>
                                </>
                              ) : (
                                <span className="text-sm text-muted-foreground italic">
                                  {t.teams.tickets.detail("unassigned")}
                                </span>
                              )}
                            </div>
                          </EditableSection>
                        )}
                      </div>
                    </div>
                  </CollapsibleCard>

                  {/* Details — state, priority, channel */}
                  <CollapsibleCard
                    icon={<StatusIcon />}
                    title={t.teams.tickets.detail("ticker_detail")}
                    data-testid="ticket-details-card"
                  >
                    <div className="space-y-4">
                      {/* State */}
                      <div data-testid="state-container">
                        <MetaLabel>
                          {t.teams.tickets.form.base("state")}
                        </MetaLabel>
                        {isEditingStatus ? (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            data-testid="state-edit-container"
                          >
                            <WorkflowStateSelectField
                              form={form}
                              name="currentStateId"
                              label=""
                              workflowId={initialTicket.workflowId!}
                              workflowStateId={initialTicket.currentStateId!}
                              includeSelf
                              required={false}
                            />
                            <InlineActions
                              onSave={() =>
                                saveAndClose(() => setIsEditingStatus(false))
                              }
                              onCancel={() => setIsEditingStatus(false)}
                              t={t}
                            />
                          </div>
                        ) : (
                          <EditableSection
                            onEdit={() => setIsEditingStatus(true)}
                          >
                            <Badge variant="outline" className="font-normal">
                              {ticket.currentStateName ??
                                initialTicket.currentStateName}
                            </Badge>
                          </EditableSection>
                        )}
                      </div>

                      {/* Priority */}
                      <div data-testid="priority-container">
                        <MetaLabel>
                          {t.teams.tickets.form.base("priority")}
                        </MetaLabel>
                        {isEditingPriority ? (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            data-testid="priority-edit-container"
                          >
                            <Controller
                              name="priority"
                              control={form.control}
                              render={({ field }) => (
                                <TicketPrioritySelect
                                  value={field.value as any}
                                  onChange={field.onChange}
                                />
                              )}
                            />
                            <InlineActions
                              onSave={() =>
                                saveAndClose(() => setIsEditingPriority(false))
                              }
                              onCancel={() => setIsEditingPriority(false)}
                              t={t}
                            />
                          </div>
                        ) : (
                          <EditableSection
                            onEdit={() => setIsEditingPriority(true)}
                          >
                            <TicketPriorityDisplay
                              priority={
                                ticket.priority ?? initialTicket.priority
                              }
                            />
                          </EditableSection>
                        )}
                      </div>

                      {/* Channel */}
                      <div data-testid="channel-container">
                        <MetaLabel>
                          {t.teams.tickets.form.base("channel")}
                        </MetaLabel>
                        {isEditingChannel ? (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            data-testid="channel-edit-container"
                          >
                            <TicketChannelSelectField form={form} />
                            <InlineActions
                              onSave={() =>
                                saveAndClose(() => setIsEditingChannel(false))
                              }
                              onCancel={() => setIsEditingChannel(false)}
                              t={t}
                            />
                          </div>
                        ) : (
                          <EditableSection
                            onEdit={() => setIsEditingChannel(true)}
                          >
                            <Badge variant="outline" className="font-normal">
                              {ticket?.channel
                                ? t.teams.tickets.form.channels(ticket.channel)
                                : initialTicket?.channel
                                  ? t.teams.tickets.form.channels(
                                      initialTicket.channel,
                                    )
                                  : t.teams.tickets.form.channels("internal")}
                            </Badge>
                          </EditableSection>
                        )}
                      </div>
                    </div>
                  </CollapsibleCard>

                  {/* Dates */}
                  <CollapsibleCard
                    icon={
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    }
                    title={t.teams.tickets.detail("important_dates")}
                    data-testid="ticket-dates-card"
                  >
                    <div className="space-y-4">
                      {/* Target completion date */}
                      <div data-testid="completion-date-container">
                        <MetaLabel>
                          {t.teams.tickets.form.base("target_completion_date")}
                        </MetaLabel>
                        {isEditingCompletionDate ? (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            data-testid="completion-date-edit-container"
                          >
                            <Controller
                              name="estimatedCompletionDate"
                              control={form.control}
                              render={({ field }) => (
                                <Input
                                  type="date"
                                  value={formatDateForInput(field.value)}
                                  onChange={(e) =>
                                    field.onChange(e.target.value || null)
                                  }
                                  autoFocus
                                  onBlur={() => {
                                    form.handleSubmit(onSubmit)();
                                    setIsEditingCompletionDate(false);
                                  }}
                                />
                              )}
                            />
                          </div>
                        ) : (
                          <EditableSection
                            onEdit={() => setIsEditingCompletionDate(true)}
                          >
                            <div className="flex items-center gap-1.5 text-sm">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>
                                {ticket.estimatedCompletionDate ? (
                                  new Date(
                                    ticket.estimatedCompletionDate,
                                  ).toLocaleDateString()
                                ) : (
                                  <span className="text-muted-foreground/70 italic">
                                    {t.teams.tickets.detail("not_set")}
                                  </span>
                                )}
                              </span>
                            </div>
                          </EditableSection>
                        )}
                      </div>
                    </div>
                  </CollapsibleCard>

                  {/* Attachments — collapsed by default */}
                  <CollapsibleCard
                    icon={
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    }
                    title={t.teams.tickets.detail("attachments")}
                    defaultOpen={false}
                    data-testid="attachments-section"
                  >
                    <AttachmentView entityType="Ticket" entityId={ticket.id!} />
                  </CollapsibleCard>

                  {/* Watchers — collapsed by default */}
                  <CollapsibleCard
                    icon={<Eye className="h-4 w-4 text-muted-foreground" />}
                    title={t.teams.tickets.detail("watchers")}
                    defaultOpen={false}
                    data-testid="watchers-section"
                  >
                    <EntityWatchers entityType="Ticket" entityId={ticket.id!} />
                  </CollapsibleCard>
                </div>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </FormProvider>
  );
};

export default TicketDetailSheet;
