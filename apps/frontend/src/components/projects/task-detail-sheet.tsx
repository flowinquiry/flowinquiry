"use client";

import { formatDistanceToNow } from "date-fns";
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
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { EpicFormField } from "@/components/projects/epic-form-field";
import { IterationFormField } from "@/components/projects/iteration-form-field";
import AttachmentView from "@/components/shared/attachment-view";
import AuditLogView from "@/components/shared/audit-log-view";
import { UserAvatar } from "@/components/shared/avatar-display";
import CollapsibleCard from "@/components/shared/collapsible-card";
import CommentsView from "@/components/shared/comments-view";
import EntityWatchers from "@/components/shared/entity-watchers";
import RichTextEditor from "@/components/shared/rich-text-editor";
import TeamUserSelect from "@/components/teams/team-user-select";
import { TicketPriorityDisplay } from "@/components/teams/ticket-priority-display";
import TicketTimelineHistory from "@/components/teams/ticket-timeline-history";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import WorkflowStateSelect from "@/components/workflows/workflow-state-select";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { PRIORITIES_ORDERED } from "@/lib/constants/ticket-priorities";
import { obfuscate } from "@/lib/endecode";
import { cn } from "@/lib/utils";
import { UserWithTeamRoleDTO } from "@/types/teams";
import { TicketDTO, TicketPriority } from "@/types/tickets";

/* ── tiny meta-field helper ── */
const MetaLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs text-muted-foreground mb-1">{children}</p>
);

/* ── inline save/cancel bar ── */
const InlineActions = ({
  onSave,
  onCancel,
  isSaving,
  t,
}: {
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
  t: ReturnType<typeof useAppClientTranslations>;
}) => (
  <div className="flex justify-end gap-2 mt-2">
    <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
      {t.common.buttons("cancel")}
    </Button>
    <Button type="button" size="sm" onClick={onSave} disabled={isSaving}>
      {isSaving ? t.common.buttons("saving") : t.common.buttons("save")}
    </Button>
  </div>
);

/* ── editable section wrapper ── */
const EditableSection = ({
  children,
  onEdit,
  canEdit = true,
}: {
  children: React.ReactNode;
  onEdit: () => void;
  canEdit?: boolean;
}) => {
  const t = useAppClientTranslations();
  if (!canEdit) return <div className="px-1 py-0.5">{children}</div>;
  return (
    <div
      className={cn(
        "group relative rounded-md border border-transparent cursor-pointer",
        "hover:border-dashed hover:border-muted-foreground/40 hover:bg-muted/30",
        "transition-colors",
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

type TaskDetailSheetProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  task: TicketDTO | null;
  onTaskUpdate?: (updatedTask: TicketDTO) => Promise<void> | void;
};

const TaskDetailSheet: React.FC<TaskDetailSheetProps> = ({
  isOpen,
  setIsOpen,
  task: initialTask,
  onTaskUpdate,
}) => {
  const [task, setTask] = useState<TicketDTO | null>(initialTask);
  const t = useAppClientTranslations();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm({
    defaultValues: {
      epicId: initialTask?.epicId,
      iterationId: initialTask?.iterationId,
    },
  });

  useEffect(() => {
    if (initialTask) {
      form.reset({
        epicId: initialTask.epicId,
        iterationId: initialTask.iterationId,
      });
    }
  }, [initialTask, form]);

  useEffect(() => {
    setTask(initialTask);
  }, [initialTask]);

  // Editing states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const [isEditingState, setIsEditingState] = useState(false);
  const [isEditingAssignee, setIsEditingAssignee] = useState(false);
  const [isEditingEpic, setIsEditingEpic] = useState(false);
  const [isEditingIteration, setIsEditingIteration] = useState(false);
  const [selectedTab, setSelectedTab] = useState("comments");

  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");

  const titleInputRef = useRef<HTMLInputElement>(null);
  const commentsViewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) titleInputRef.current.focus();
  }, [isEditingTitle]);

  useEffect(() => {
    if (!isOpen) {
      setIsEditingTitle(false);
      setIsEditingDescription(false);
      setIsEditingPriority(false);
      setIsEditingState(false);
      setIsEditingAssignee(false);
      setIsEditingEpic(false);
      setIsEditingIteration(false);
    }
  }, [isOpen]);

  /* ── generic save helper ── */
  const saveTask = async (updatedTask: TicketDTO) => {
    setTask(updatedTask);
    if (onTaskUpdate) {
      setIsSaving(true);
      try {
        await onTaskUpdate(updatedTask);
      } catch {
        setTask(task);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleTitleBlur = async () => {
    if (!task) return;
    setIsEditingTitle(false);
    await saveTask({ ...task, requestTitle: editedTitle });
  };

  const handleDescriptionSave = async () => {
    if (!task) return;
    setIsEditingDescription(false);
    await saveTask({ ...task, requestDescription: editedDescription });
  };

  const handlePriorityChange = async (priority: TicketPriority) => {
    if (!task) return;
    setIsEditingPriority(false);
    await saveTask({ ...task, priority });
  };

  const handleStateChange = async (
    newStateId: number,
    newStateName: string,
  ) => {
    if (!task) return;
    setIsEditingState(false);
    await saveTask({
      ...task,
      currentStateId: newStateId,
      currentStateName: newStateName,
    });
  };

  const handleAssigneeChange = async (
    selectedUser: UserWithTeamRoleDTO | null,
  ) => {
    if (!task) return;
    setIsEditingAssignee(false);
    await saveTask({
      ...task,
      assignUserId: selectedUser?.id || null,
      assignUserName: selectedUser
        ? `${selectedUser.firstName} ${selectedUser.lastName}`
        : null,
      assignUserImageUrl: selectedUser?.imageUrl || null,
    });
  };

  const handleEpicSave = async () => {
    if (!task) return;
    setIsEditingEpic(false);
    await saveTask({ ...task, epicId: form.getValues().epicId });
  };

  const handleIterationSave = async () => {
    if (!task) return;
    setIsEditingIteration(false);
    await saveTask({ ...task, iterationId: form.getValues().iterationId });
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

  if (!task) return null;

  const canEdit = !task.isCompleted;

  const currentDate = new Date();
  const estimatedDate = task.estimatedCompletionDate
    ? new Date(task.estimatedCompletionDate)
    : null;
  const StatusIcon = () => {
    if (task.isCompleted)
      return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />;
    if (estimatedDate && estimatedDate < currentDate)
      return <AlertCircle className="h-4 w-4 text-destructive shrink-0" />;
    return <Clock className="h-4 w-4 text-blue-500 shrink-0" />;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-6xl p-0 flex flex-col h-full overflow-hidden"
      >
        {/* ── Sticky header ── */}
        <SheetHeader className="px-6 pr-14 py-4 border-b shrink-0">
          <div className="flex flex-col gap-1.5 min-w-0">
            {/* Badge row */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className="rounded-full text-xs font-normal"
              >
                {task.projectShortName}
              </Badge>
              <Badge
                variant={task.isCompleted ? "secondary" : "default"}
                className="rounded-full text-xs font-normal"
              >
                {task.currentStateName}
              </Badge>
              <TicketPriorityDisplay priority={task.priority} />
            </div>

            {/* Title */}
            <SheetTitle className="p-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/portal/teams/${obfuscate(task.teamId)}/projects/${task.projectShortName}/${task.projectTicketNumber}`}
                  className="text-sm font-medium text-muted-foreground hover:text-primary hover:underline underline-offset-4 transition-colors shrink-0"
                >
                  [{task.projectShortName}-{task.projectTicketNumber}]
                </Link>
                {isEditingTitle ? (
                  <Input
                    ref={titleInputRef}
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTitleBlur();
                    }}
                    className="text-lg font-semibold h-9"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-2 group/title min-w-0">
                    <span
                      className={cn(
                        "text-xl font-bold leading-tight truncate",
                        task.isCompleted &&
                          "line-through text-muted-foreground",
                      )}
                    >
                      {task.requestTitle}
                    </span>
                    {canEdit && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setEditedTitle(task.requestTitle);
                          setIsEditingTitle(true);
                        }}
                        className="opacity-0 group-hover/title:opacity-100 shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                        aria-label="Edit title"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* ── Scrollable body ── */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* ── Left 2/3 ── */}
              <div className="flex flex-col gap-4 lg:col-span-2">
                {/* Description */}
                <CollapsibleCard
                  icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                  title={t.teams.tickets.form.base("description")}
                >
                  {isEditingDescription ? (
                    <div onClick={(e) => e.stopPropagation()}>
                      <RichTextEditor
                        value={editedDescription}
                        onChange={setEditedDescription}
                      />
                      <InlineActions
                        onSave={handleDescriptionSave}
                        onCancel={() => setIsEditingDescription(false)}
                        isSaving={isSaving}
                        t={t}
                      />
                    </div>
                  ) : (
                    <EditableSection
                      onEdit={() => {
                        setEditedDescription(task.requestDescription || "");
                        setIsEditingDescription(true);
                      }}
                      canEdit={canEdit}
                    >
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
                        dangerouslySetInnerHTML={{
                          __html:
                            task.requestDescription ||
                            "<em>No description provided.</em>",
                        }}
                      />
                    </EditableSection>
                  )}
                </CollapsibleCard>

                {/* Tabs: Comments / Changes / Timeline */}
                <CollapsibleCard
                  icon={
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  }
                  title={t.teams.tickets.detail("comments")}
                >
                  <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="comments">
                        {t.common.misc("comments")}
                      </TabsTrigger>
                      <TabsTrigger value="changes-history">
                        {t.teams.tickets.detail("changes_history")}
                      </TabsTrigger>
                      <TabsTrigger value="timeline-history">
                        {t.teams.tickets.detail("timeline")}
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="comments">
                      <div ref={commentsViewRef}>
                        <CommentsView entityType="Ticket" entityId={task.id!} />
                      </div>
                    </TabsContent>
                    <TabsContent value="changes-history">
                      <AuditLogView entityType="Ticket" entityId={task.id!} />
                    </TabsContent>
                    <TabsContent value="timeline-history">
                      <TicketTimelineHistory teamId={task.id!} />
                    </TabsContent>
                  </Tabs>
                </CollapsibleCard>
              </div>

              {/* ── Right 1/3 sidebar ── */}
              <div className="flex flex-col gap-4">
                {/* People */}
                <CollapsibleCard
                  icon={<User className="h-4 w-4 text-muted-foreground" />}
                  title={t.teams.tickets.detail("people")}
                >
                  <div className="space-y-4">
                    {/* Requester */}
                    <div>
                      <MetaLabel>
                        {t.teams.tickets.form.base("requester")}
                      </MetaLabel>
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          imageUrl={task.requestUserImageUrl}
                          size="w-6 h-6"
                        />
                        <span className="text-sm">
                          {task.requestUserName || "Not specified"}
                        </span>
                      </div>
                    </div>

                    {/* Assignee */}
                    <div>
                      <MetaLabel>
                        {t.teams.tickets.form.base("assignee")}
                      </MetaLabel>
                      {isEditingAssignee ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <TeamUserSelect
                            teamId={task.teamId!}
                            currentUserId={task.assignUserId}
                            onUserChange={handleAssigneeChange}
                          />
                        </div>
                      ) : (
                        <EditableSection
                          onEdit={() => setIsEditingAssignee(true)}
                          canEdit={canEdit}
                        >
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              imageUrl={task.assignUserImageUrl}
                              size="w-6 h-6"
                            />
                            <span className="text-sm">
                              {task.assignUserName || (
                                <span className="text-muted-foreground italic">
                                  {t.teams.tickets.detail("unassigned")}
                                </span>
                              )}
                            </span>
                          </div>
                        </EditableSection>
                      )}
                    </div>
                  </div>
                </CollapsibleCard>

                {/* Details — state & priority */}
                <CollapsibleCard
                  icon={<StatusIcon />}
                  title={t.teams.tickets.detail("ticker_detail")}
                >
                  <div className="space-y-4">
                    {/* Priority */}
                    <div>
                      <MetaLabel>
                        {t.teams.tickets.form.base("priority")}
                      </MetaLabel>
                      {isEditingPriority ? (
                        <div
                          className="flex flex-col gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            className="w-full rounded-md border px-3 py-1.5 text-sm"
                            defaultValue={task.priority as string}
                            onChange={(e) =>
                              handlePriorityChange(
                                e.target.value as TicketPriority,
                              )
                            }
                          >
                            {PRIORITIES_ORDERED.map((p: TicketPriority) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                          <InlineActions
                            onSave={() => setIsEditingPriority(false)}
                            onCancel={() => setIsEditingPriority(false)}
                            t={t}
                          />
                        </div>
                      ) : (
                        <EditableSection
                          onEdit={() => setIsEditingPriority(true)}
                          canEdit={canEdit}
                        >
                          <TicketPriorityDisplay priority={task.priority} />
                        </EditableSection>
                      )}
                    </div>

                    {/* State */}
                    <div>
                      <MetaLabel>
                        {t.teams.tickets.form.base("state")}
                      </MetaLabel>
                      {isEditingState && task.workflowId ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <WorkflowStateSelect
                            workflowId={task.workflowId}
                            currentStateId={task.currentStateId!}
                            onChange={handleStateChange}
                          />
                        </div>
                      ) : (
                        <EditableSection
                          onEdit={() => setIsEditingState(true)}
                          canEdit={canEdit}
                        >
                          <Badge variant="outline" className="font-normal">
                            {task.currentStateName || "Not Set"}
                          </Badge>
                        </EditableSection>
                      )}
                    </div>
                  </div>
                </CollapsibleCard>

                {/* Epic & Iteration */}
                <CollapsibleCard
                  icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                  title="Epic & Iteration"
                >
                  <div className="space-y-4">
                    {/* Epic */}
                    <div>
                      <MetaLabel>Epic</MetaLabel>
                      {isEditingEpic ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Form {...form}>
                            <EpicFormField
                              form={form}
                              projectId={task.projectId!}
                              name="epicId"
                              hideLabel
                            />
                          </Form>
                          <InlineActions
                            onSave={handleEpicSave}
                            onCancel={() => setIsEditingEpic(false)}
                            isSaving={isSaving}
                            t={t}
                          />
                        </div>
                      ) : (
                        <EditableSection
                          onEdit={() => setIsEditingEpic(true)}
                          canEdit={canEdit}
                        >
                          <span className="text-sm">
                            {task.epicName || (
                              <span className="text-muted-foreground italic">
                                None
                              </span>
                            )}
                          </span>
                        </EditableSection>
                      )}
                    </div>

                    {/* Iteration */}
                    <div>
                      <MetaLabel>Iteration</MetaLabel>
                      {isEditingIteration ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Form {...form}>
                            <IterationFormField
                              form={form}
                              projectId={task.projectId!}
                              name="iterationId"
                              hideLabel
                            />
                          </Form>
                          <InlineActions
                            onSave={handleIterationSave}
                            onCancel={() => setIsEditingIteration(false)}
                            isSaving={isSaving}
                            t={t}
                          />
                        </div>
                      ) : (
                        <EditableSection
                          onEdit={() => setIsEditingIteration(true)}
                          canEdit={canEdit}
                        >
                          <span className="text-sm">
                            {task.iterationName || (
                              <span className="text-muted-foreground italic">
                                None
                              </span>
                            )}
                          </span>
                        </EditableSection>
                      )}
                    </div>
                  </div>
                </CollapsibleCard>

                {/* Dates */}
                <CollapsibleCard
                  icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                  title={t.teams.tickets.detail("important_dates")}
                >
                  <div className="space-y-3 text-sm">
                    <div>
                      <MetaLabel>
                        {t.teams.tickets.form.base("created_at")}
                      </MetaLabel>
                      <span>
                        {task.createdAt
                          ? new Date(task.createdAt).toLocaleDateString()
                          : "—"}
                        {task.createdAt && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (
                            {formatDistanceToNow(task.createdAt, {
                              addSuffix: true,
                            })}
                            )
                          </span>
                        )}
                      </span>
                    </div>
                    <div>
                      <MetaLabel>
                        {t.teams.tickets.form.base("last_modified_at")}
                      </MetaLabel>
                      <span>
                        {task.modifiedAt
                          ? new Date(task.modifiedAt).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <MetaLabel>
                        {t.teams.tickets.form.base("target_completion_date")}
                      </MetaLabel>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>
                          {task.estimatedCompletionDate ? (
                            new Date(
                              task.estimatedCompletionDate,
                            ).toLocaleDateString()
                          ) : (
                            <span className="text-muted-foreground italic">
                              {t.teams.tickets.detail("not_set")}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    {task.isCompleted && (
                      <div>
                        <MetaLabel>Completed</MetaLabel>
                        <span>
                          {task.actualCompletionDate
                            ? new Date(
                                task.actualCompletionDate,
                              ).toLocaleDateString()
                            : "Date not specified"}
                        </span>
                      </div>
                    )}
                  </div>
                </CollapsibleCard>

                {/* Attachments */}
                <CollapsibleCard
                  icon={<Paperclip className="h-4 w-4 text-muted-foreground" />}
                  title={t.teams.tickets.detail("attachments")}
                  defaultOpen={false}
                >
                  <AttachmentView entityType="Ticket" entityId={task.id!} />
                </CollapsibleCard>

                {/* Watchers */}
                <CollapsibleCard
                  icon={<Eye className="h-4 w-4 text-muted-foreground" />}
                  title={t.teams.tickets.detail("watchers")}
                  defaultOpen={false}
                >
                  <EntityWatchers entityType="Ticket" entityId={task.id!} />
                </CollapsibleCard>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskDetailSheet;
