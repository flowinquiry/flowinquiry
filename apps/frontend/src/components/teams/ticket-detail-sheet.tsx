"use client";

import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Paperclip,
  User,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";

import AttachmentView from "@/components/shared/attachment-view";
import { UserAvatar } from "@/components/shared/avatar-display";
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
import { TicketDTO } from "@/types/tickets";

const EditableSection = ({
  children,
  onEdit,
  editableClassName,
}: {
  children: React.ReactNode;
  onEdit: () => void;
  editableClassName?: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const t = useAppClientTranslations();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit();
  };

  return (
    <div
      className={cn(
        "group relative",
        isHovered
          ? "border border-dashed border-gray-500 rounded-lg bg-gray-50 dark:bg-gray-800"
          : "",
        editableClassName,
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger className="absolute inset-0 z-10 cursor-pointer" />
          <TooltipContent side="bottom">
            <p>{t.teams.tickets.detail("click_to_edit")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {children}
    </div>
  );
};

type TicketDetailsProps = {
  open: boolean;
  onClose: () => void;
  initialTicket: TicketDTO;
};

const TicketDetailSheet: React.FC<TicketDetailsProps> = ({
  open,
  onClose,
  initialTicket,
}) => {
  const [ticket, setTicket] = useState<TicketDTO>(initialTicket);
  const workflowColor = getSpecifiedColor(initialTicket.workflowRequestName!);
  const [submitting, setSubmitting] = useState<boolean>(false);
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
    setSubmitting(true);
    try {
      // Convert to TicketDTO for the backend
      const data = {
        ...formData,
        // Handle date conversions if needed
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
    } finally {
      setSubmitting(false);
    }
  };

  interface TicketDTOWithStringDates extends Omit<
    TicketDTO,
    "estimatedCompletionDate"
  > {
    estimatedCompletionDate?: string | null;
  }

  const formatDateForInput = (
    dateString: string | null | undefined,
  ): string => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

  // Determine request status
  const currentDate = new Date();
  const estimatedCompletionDate = initialTicket.estimatedCompletionDate
    ? new Date(initialTicket.estimatedCompletionDate)
    : null;

  const getRequestStatusIcon = () => {
    if (initialTicket.isCompleted) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (estimatedCompletionDate && estimatedCompletionDate < currentDate) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    return <Clock className="w-5 h-5 text-blue-500" />;
  };

  return (
    <FormProvider {...form}>
      <Sheet
        open={open}
        onOpenChange={onClose}
        data-testid="ticket-detail-sheet"
      >
        <SheetContent
          className="w-full sm:max-w-[70rem] h-full"
          data-testid="ticket-detail-sheet-content"
        >
          <ScrollArea
            className="h-full px-4"
            data-testid="ticket-detail-scroll-area"
          >
            <SheetHeader className="mb-6" data-testid="ticket-detail-header">
              <SheetTitle data-testid="ticket-detail-title">
                <div
                  className="flex items-center gap-4 mb-2"
                  data-testid="ticket-workflow-container"
                >
                  <span
                    className="inline-block px-2 py-1 text-xs font-semibold rounded-md"
                    style={{
                      backgroundColor: workflowColor.background,
                      color: workflowColor.text,
                    }}
                    data-testid="ticket-workflow-badge"
                  >
                    {initialTicket.workflowRequestName}
                  </span>

                  {isEditingTitle ? (
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="flex items-center gap-2 grow"
                      data-testid="edit-title-form"
                    >
                      <Controller
                        name="requestTitle"
                        control={form.control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            className="text-xl"
                            placeholder="Enter ticket title"
                            autoFocus
                            data-testid="title-input"
                          />
                        )}
                      />
                      <div
                        className="flex gap-2"
                        data-testid="title-edit-buttons"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            form.handleSubmit(onSubmit)();
                            setIsEditingTitle(false);
                          }}
                          data-testid="save-title-button"
                        >
                          {t.common.buttons("save")}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingTitle(false)}
                          data-testid="cancel-title-button"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="grow" data-testid="ticket-title-container">
                      <Button
                        variant="link"
                        className={`px-0 text-xl grow text-left ${initialTicket.isCompleted ? "line-through" : ""}`}
                        onClick={(e) => {
                          // Allow the link navigation to proceed (don't call preventDefault)
                        }}
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          setIsEditingTitle(true);
                        }}
                        data-testid="ticket-title-button"
                      >
                        <Link
                          href={`/portal/teams/${obfuscate(ticket.teamId)}/tickets/${obfuscate(
                            ticket.id,
                          )}`}
                          className="break-words whitespace-normal text-left"
                          data-testid="ticket-title-link"
                        >
                          {ticket.requestTitle || initialTicket.requestTitle}
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>

                {initialTicket.conversationHealth?.healthLevel && (
                  <TicketHealthLevelDisplay
                    currentLevel={initialTicket.conversationHealth.healthLevel}
                    data-testid="ticket-health-level"
                  />
                )}
              </SheetTitle>
            </SheetHeader>

            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              data-testid="ticket-detail-grid"
            >
              <div
                className="md:col-span-2 space-y-6"
                data-testid="ticket-main-content"
              >
                <div
                  className={cn(
                    "p-4 rounded-lg border",
                    "bg-white dark:bg-gray-900",
                    "border-gray-200 dark:border-gray-700",
                  )}
                  data-testid="ticket-description-section"
                >
                  <div
                    className="flex items-center gap-3 mb-3"
                    data-testid="description-header"
                  >
                    <FileText className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {t.teams.tickets.form.base("description")}
                    </h3>
                  </div>

                  {isEditingDescription ? (
                    <div
                      className="relative z-50"
                      onClick={(e) => {
                        // Prevent the click from bubbling up and potentially closing the editor
                        e.stopPropagation();
                      }}
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
                        data-testid="description-rich-editor"
                      />
                    </div>
                  ) : (
                    <EditableSection
                      onEdit={() => setIsEditingDescription(true)}
                      data-testid="description-editable-section"
                    >
                      <div
                        className="prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: ticket.requestDescription!,
                        }}
                        data-testid="description-content"
                      />
                    </EditableSection>
                  )}
                </div>

                <div
                  className={cn(
                    "p-4 rounded-lg border",
                    "bg-white dark:bg-gray-900",
                    "border-gray-200 dark:border-gray-700",
                  )}
                  data-testid="ticket-state-priority-section"
                >
                  <div
                    className="flex items-center gap-3 mb-3"
                    data-testid="state-priority-header"
                  >
                    <div data-testid="request-status-icon">
                      {getRequestStatusIcon()}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {t.teams.tickets.detail("state_priority")}
                    </h3>
                  </div>
                  <div
                    className="grid grid-cols-2 gap-4"
                    data-testid="state-priority-grid"
                  >
                    <div data-testid="state-container">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        {t.teams.tickets.form.base("state")}
                      </span>
                      {isEditingStatus ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="py-2"
                          data-testid="state-edit-container"
                        >
                          <div className="w-[16rem]">
                            <WorkflowStateSelectField
                              form={form}
                              name="currentStateId"
                              label=""
                              workflowId={initialTicket.workflowId!}
                              workflowStateId={initialTicket.currentStateId!}
                              includeSelf={true}
                              required={false}
                              data-testid="state-select-field"
                            />
                          </div>
                          <div
                            className="flex justify-end gap-2 mt-2"
                            data-testid="state-edit-buttons"
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                form.handleSubmit(onSubmit)();
                                setIsEditingStatus(false);
                              }}
                              data-testid="save-state-button"
                            >
                              {t.common.buttons("save")}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsEditingStatus(false)}
                              data-testid="cancel-state-button"
                            >
                              {t.common.buttons("cancel")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <EditableSection
                          onEdit={() => setIsEditingStatus(true)}
                          data-testid="state-editable-section"
                        >
                          <Badge variant="outline" data-testid="state-badge">
                            {ticket.currentStateName ||
                              initialTicket.currentStateName}
                          </Badge>
                        </EditableSection>
                      )}
                    </div>

                    <div data-testid="priority-container">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        Priority
                      </span>
                      {isEditingPriority ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="py-2"
                          data-testid="priority-edit-container"
                        >
                          <Controller
                            name="priority"
                            control={form.control}
                            render={({ field }) => (
                              <TicketPrioritySelect
                                value={field.value as any}
                                onChange={(value) => {
                                  field.onChange(value);
                                }}
                                data-testid="priority-select"
                              />
                            )}
                          />
                          <div
                            className="flex justify-end gap-2 mt-2"
                            data-testid="priority-edit-buttons"
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                form.handleSubmit(onSubmit)();
                                setIsEditingPriority(false);
                              }}
                              data-testid="save-priority-button"
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsEditingPriority(false)}
                              data-testid="cancel-priority-button"
                            >
                              {t.common.buttons("cancel")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <EditableSection
                          onEdit={() => setIsEditingPriority(true)}
                          data-testid="priority-editable-section"
                        >
                          <TicketPriorityDisplay
                            priority={ticket.priority || initialTicket.priority}
                            data-testid="priority-display"
                          />
                        </EditableSection>
                      )}
                    </div>

                    {/* Channel - Editable */}
                    <div data-testid="channel-container">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        Channel
                      </span>
                      {isEditingChannel ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="py-2"
                          data-testid="channel-edit-container"
                        >
                          <div className="w-[16rem]">
                            <TicketChannelSelectField
                              form={form}
                              data-testid="channel-select-field"
                            />
                          </div>
                          <div
                            className="flex justify-end gap-2 mt-2"
                            data-testid="channel-edit-buttons"
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                form.handleSubmit(onSubmit)();
                                setIsEditingChannel(false);
                              }}
                              data-testid="save-channel-button"
                            >
                              {t.common.buttons("save")}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsEditingChannel(false)}
                              data-testid="cancel-channel-button"
                            >
                              {t.common.buttons("cancel")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <EditableSection
                          onEdit={() => setIsEditingChannel(true)}
                          data-testid="channel-editable-section"
                        >
                          <Badge variant="outline" data-testid="channel-badge">
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

                    {/* Target Completion - Editable */}
                    <div data-testid="completion-date-container">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        {t.teams.tickets.form.base("target_completion_date")}
                      </span>
                      {isEditingCompletionDate ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="py-2"
                          data-testid="completion-date-edit-container"
                        >
                          <Controller
                            name="estimatedCompletionDate"
                            control={form.control}
                            render={({ field }) => (
                              <Input
                                type="date"
                                value={formatDateForInput(field.value)}
                                onChange={(e) => {
                                  const value = e.target.value || null;
                                  field.onChange(value);
                                }}
                                className="w-full"
                                autoFocus
                                onBlur={() => {
                                  form.handleSubmit(onSubmit)();
                                  setIsEditingCompletionDate(false);
                                }}
                                data-testid="completion-date-input"
                              />
                            )}
                          />
                        </div>
                      ) : (
                        <EditableSection
                          onEdit={() => setIsEditingCompletionDate(true)}
                          data-testid="completion-date-editable-section"
                        >
                          <p
                            className="text-sm p-1"
                            data-testid="completion-date-display"
                          >
                            {ticket.estimatedCompletionDate
                              ? new Date(
                                  ticket.estimatedCompletionDate,
                                ).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </EditableSection>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "p-4 rounded-lg border",
                    "bg-white dark:bg-gray-900",
                    "border-gray-200 dark:border-gray-700",
                  )}
                  data-testid="attachments-section"
                >
                  <div
                    className="flex items-center gap-3 mb-3"
                    data-testid="attachments-header"
                  >
                    <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {t.teams.tickets.detail("attachments")}
                    </h3>
                  </div>
                  <AttachmentView
                    entityType="Ticket"
                    entityId={ticket.id!}
                    data-testid="attachment-view"
                  />
                </div>
              </div>

              <div className="space-y-6" data-testid="ticket-sidebar">
                <div
                  className={cn(
                    "p-4 rounded-lg border",
                    "bg-white dark:bg-gray-900",
                    "border-gray-200 dark:border-gray-700",
                  )}
                  data-testid="people-assignment-section"
                >
                  <div
                    className="flex items-center gap-3 mb-3"
                    data-testid="people-assignment-header"
                  >
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {t.teams.tickets.detail("people_assignment")}
                    </h3>
                  </div>
                  <div
                    className="space-y-4"
                    data-testid="people-assignment-content"
                  >
                    <div data-testid="requester-container">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        {t.teams.tickets.form.base("requester")}
                      </span>
                      <div
                        className="flex items-center gap-2"
                        data-testid="requester-info"
                      >
                        <UserAvatar
                          imageUrl={ticket.requestUserImageUrl}
                          size="w-8 h-8"
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

                    <div data-testid="assignee-container">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        {t.teams.tickets.form.base("assignee")}
                      </span>
                      {isEditingAssignment ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="py-2"
                          data-testid="assignment-edit-container"
                        >
                          <TeamUserSelectField
                            form={form}
                            fieldName="assignUserId"
                            label=""
                            teamId={ticket.teamId!}
                            data-testid="assignee-select-field"
                          />
                          <div
                            className="flex justify-end gap-2 mt-2"
                            data-testid="assignment-edit-buttons"
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                form.handleSubmit(onSubmit)();
                                setIsEditingAssignment(false);
                              }}
                              data-testid="save-assignment-button"
                            >
                              {t.common.buttons("save")}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsEditingAssignment(false)}
                              data-testid="cancel-assignment-button"
                            >
                              {t.common.buttons("cancel")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <EditableSection
                          onEdit={() => setIsEditingAssignment(true)}
                          data-testid="assignment-editable-section"
                        >
                          <div
                            className="flex items-center gap-2"
                            data-testid="assignee-info"
                          >
                            {ticket.assignUserId ||
                            initialTicket.assignUserId ? (
                              <>
                                <UserAvatar
                                  imageUrl={
                                    ticket.assignUserImageUrl ||
                                    initialTicket.assignUserImageUrl
                                  }
                                  size="w-8 h-8"
                                  data-testid="assignee-avatar"
                                />
                                <Link
                                  href={`/portal/users/${obfuscate(ticket.assignUserId || initialTicket.assignUserId!)}`}
                                  className="text-sm hover:underline"
                                  data-testid="assignee-link"
                                >
                                  {ticket.assignUserName ||
                                    initialTicket.assignUserName}
                                </Link>
                              </>
                            ) : (
                              <span
                                className="text-sm text-gray-500"
                                data-testid="unassigned-message"
                              >
                                {t.teams.tickets.detail("unassigned")}
                              </span>
                            )}
                          </div>
                        </EditableSection>
                      )}
                    </div>
                  </div>
                </div>

                {/* Watchers Section */}
                <div
                  className={cn(
                    "p-4 rounded-lg border",
                    "bg-white dark:bg-gray-900",
                    "border-gray-200 dark:border-gray-700",
                  )}
                  data-testid="watchers-section"
                >
                  <div
                    className="flex items-center gap-3 mb-3"
                    data-testid="watchers-header"
                  >
                    <Eye className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {t.teams.tickets.detail("watchers")}
                    </h3>
                  </div>
                  <EntityWatchers
                    entityType="Ticket"
                    entityId={ticket.id!}
                    data-testid="entity-watchers"
                  />
                </div>
              </div>
              <div
                className="md:col-span-3 mt-2"
                data-testid="comments-container"
              >
                <div className="space-y-3" data-testid="comments-section">
                  <div
                    className="flex items-center gap-3"
                    data-testid="comments-header"
                  >
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {t.teams.tickets.detail("comments")}
                    </h3>
                  </div>
                  <CommentsView
                    entityType="Ticket"
                    entityId={ticket.id!}
                    data-testid="comments-view"
                  />
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
