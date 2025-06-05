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

  interface TicketDTOWithStringDates
    extends Omit<TicketDTO, "estimatedCompletionDate"> {
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
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:w-5xl h-full">
          <ScrollArea className="h-full px-4">
            <SheetHeader className="mb-6">
              <SheetTitle>
                <div className="flex items-center gap-4 mb-2">
                  <span
                    className="inline-block px-2 py-1 text-xs font-semibold rounded-md"
                    style={{
                      backgroundColor: workflowColor.background,
                      color: workflowColor.text,
                    }}
                  >
                    {initialTicket.workflowRequestName}
                  </span>

                  {isEditingTitle ? (
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="flex items-center gap-2 grow"
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
                          />
                        )}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            form.handleSubmit(onSubmit)();
                            setIsEditingTitle(false);
                          }}
                        >
                          {t.common.buttons("save")}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingTitle(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="grow">
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
                      >
                        <Link
                          href={`/portal/teams/${obfuscate(ticket.teamId)}/tickets/${obfuscate(
                            ticket.id,
                          )}`}
                          className="break-words whitespace-normal text-left"
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
                  />
                )}
              </SheetTitle>
            </SheetHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div
                  className={cn(
                    "p-4 rounded-lg border",
                    "bg-white dark:bg-gray-900",
                    "border-gray-200 dark:border-gray-700",
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
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
                    >
                      <div
                        className="prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: ticket.requestDescription!,
                        }}
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
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div>{getRequestStatusIcon()}</div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {t.teams.tickets.detail("state_priority")}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        {t.teams.tickets.form.base("state")}
                      </span>
                      {isEditingStatus ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="py-2"
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
                            />
                          </div>
                          <div className="flex justify-end gap-2 mt-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                form.handleSubmit(onSubmit)();
                                setIsEditingStatus(false);
                              }}
                            >
                              {t.common.buttons("save")}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsEditingStatus(false)}
                            >
                              {t.common.buttons("cancel")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <EditableSection
                          onEdit={() => setIsEditingStatus(true)}
                        >
                          <Badge variant="outline">
                            {ticket.currentStateName ||
                              initialTicket.currentStateName}
                          </Badge>
                        </EditableSection>
                      )}
                    </div>

                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        Priority
                      </span>
                      {isEditingPriority ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="py-2"
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
                              />
                            )}
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                form.handleSubmit(onSubmit)();
                                setIsEditingPriority(false);
                              }}
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsEditingPriority(false)}
                            >
                              {t.common.buttons("cancel")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <EditableSection
                          onEdit={() => setIsEditingPriority(true)}
                        >
                          <TicketPriorityDisplay
                            priority={ticket.priority || initialTicket.priority}
                          />
                        </EditableSection>
                      )}
                    </div>

                    {/* Channel - Editable */}
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        Channel
                      </span>
                      {isEditingChannel ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="py-2"
                        >
                          <div className="w-[16rem]">
                            <TicketChannelSelectField form={form} />
                          </div>
                          <div className="flex justify-end gap-2 mt-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                form.handleSubmit(onSubmit)();
                                setIsEditingChannel(false);
                              }}
                            >
                              {t.common.buttons("save")}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsEditingChannel(false)}
                            >
                              {t.common.buttons("cancel")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <EditableSection
                          onEdit={() => setIsEditingChannel(true)}
                        >
                          <Badge variant="outline">
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
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        {t.teams.tickets.form.base("target_completion_date")}
                      </span>
                      {isEditingCompletionDate ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="py-2"
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
                              />
                            )}
                          />
                        </div>
                      ) : (
                        <EditableSection
                          onEdit={() => setIsEditingCompletionDate(true)}
                        >
                          <p className="text-sm p-1">
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
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {t.teams.tickets.detail("attachments")}
                    </h3>
                  </div>
                  <AttachmentView entityType="Ticket" entityId={ticket.id!} />
                </div>
              </div>

              <div className="space-y-6">
                <div
                  className={cn(
                    "p-4 rounded-lg border",
                    "bg-white dark:bg-gray-900",
                    "border-gray-200 dark:border-gray-700",
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {t.teams.tickets.detail("people_assignment")}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        {t.teams.tickets.form.base("requester")}
                      </span>
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          imageUrl={ticket.requestUserImageUrl}
                          size="w-8 h-8"
                        />
                        <Link
                          href={`/portal/users/${obfuscate(ticket.requestUserId)}`}
                          className="text-sm hover:underline"
                        >
                          {ticket.requestUserName}
                        </Link>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        {t.teams.tickets.form.base("assignee")}
                      </span>
                      {isEditingAssignment ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="py-2"
                        >
                          <TeamUserSelectField
                            form={form}
                            fieldName="assignUserId"
                            label=""
                            teamId={ticket.teamId!}
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                form.handleSubmit(onSubmit)();
                                setIsEditingAssignment(false);
                              }}
                            >
                              {t.common.buttons("save")}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsEditingAssignment(false)}
                            >
                              {t.common.buttons("cancel")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <EditableSection
                          onEdit={() => setIsEditingAssignment(true)}
                        >
                          <div className="flex items-center gap-2">
                            {ticket.assignUserId ||
                            initialTicket.assignUserId ? (
                              <>
                                <UserAvatar
                                  imageUrl={
                                    ticket.assignUserImageUrl ||
                                    initialTicket.assignUserImageUrl
                                  }
                                  size="w-8 h-8"
                                />
                                <Link
                                  href={`/portal/users/${obfuscate(ticket.assignUserId || initialTicket.assignUserId!)}`}
                                  className="text-sm hover:underline"
                                >
                                  {ticket.assignUserName ||
                                    initialTicket.assignUserName}
                                </Link>
                              </>
                            ) : (
                              <span className="text-sm text-gray-500">
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
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Eye className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {t.teams.tickets.detail("watchers")}
                    </h3>
                  </div>
                  <EntityWatchers entityType="Ticket" entityId={ticket.id!} />
                </div>
              </div>
              <div className="md:col-span-3 mt-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {t.teams.tickets.detail("comments")}
                    </h3>
                  </div>
                  <CommentsView entityType="Ticket" entityId={ticket.id!} />
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
