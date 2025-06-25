"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { EpicFormField } from "@/components/projects/epic-form-field";
import { IterationFormField } from "@/components/projects/iteration-form-field";
import RichTextEditor from "@/components/shared/rich-text-editor";
import TicketChannelSelectField from "@/components/teams/team-ticket-channel-select";
import TeamUserSelectField from "@/components/teams/team-users-select-field";
import { TicketPrioritySelect } from "@/components/teams/ticket-priority-select";
import {
  DatePickerField,
  ExtInputField,
  SubmitButton,
} from "@/components/ui/ext-form";
import { FileUploader } from "@/components/ui/file-uploader";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import WorkflowStateSelect from "@/components/workflows/workflow-state-select";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { uploadAttachmentsForEntity } from "@/lib/actions/entity-attachments.action";
import { createTicket } from "@/lib/actions/tickets.action";
import { useError } from "@/providers/error-provider";
import { TicketDTO, TicketDTOSchema, TicketPriority } from "@/types/tickets";
import { WorkflowStateDTO } from "@/types/workflows";

import { Button } from "../ui/button";

export type TaskBoard = Record<string, TicketDTO[]>;

interface TaskEditorSheetProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedWorkflowState: WorkflowStateDTO | null;
  setTasks: React.Dispatch<React.SetStateAction<TaskBoard>>;
  projectId: number;
  projectWorkflowId: number;
  teamId: number;
  onTaskCreated?: () => Promise<void>; // New callback for triggering data refresh
}

const TaskEditorSheet = ({
  isOpen,
  setIsOpen,
  selectedWorkflowState,
  setTasks,
  projectId,
  projectWorkflowId,
  teamId,
  onTaskCreated,
}: TaskEditorSheetProps) => {
  const { setError } = useError();
  const [files, setFiles] = useState<File[]>([]);
  const { data: session } = useSession();
  const t = useAppClientTranslations();

  // Track the current state name when it changes
  const [currentStateName, setCurrentStateName] = useState<string | null>(
    selectedWorkflowState?.stateName || null,
  );

  // ✅ Initialize Form
  const form = useForm({
    resolver: zodResolver(TicketDTOSchema),
    defaultValues: {
      requestTitle: "",
      requestDescription: "",
      priority: "Medium" as TicketPriority,
      assignUserId: null,
      teamId: teamId,
      projectId: projectId,
      workflowId: projectWorkflowId,
      currentStateId: selectedWorkflowState?.id ?? null,
      requestUserId: Number(session?.user?.id ?? 0),
      estimatedCompletionDate: null,
      actualCompletionDate: null,
    },
  });

  // ✅ Ensure default values persist when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset the current state name when the sheet opens
      setCurrentStateName(selectedWorkflowState?.stateName || null);

      form.reset({
        requestTitle: "",
        requestDescription: "",
        priority: "Medium" as TicketPriority,
        assignUserId: null,
        teamId: teamId,
        projectId: projectId,
        workflowId: projectWorkflowId,
        currentStateId: selectedWorkflowState?.id ?? null,
        requestUserId: Number(session?.user?.id ?? 0),
        estimatedCompletionDate: null,
        actualCompletionDate: null,
      });
    }
  }, [isOpen, form, teamId, projectWorkflowId, selectedWorkflowState]);

  // Handler for when workflow state changes in the form
  const handleWorkflowStateChange = (stateId: number, stateName: string) => {
    // Update the form value
    form.setValue("currentStateId", stateId);

    // Save the state name for later use
    setCurrentStateName(stateName);
  };

  // ✅ Handle Form Submission
  const onSubmit = async (data: TicketDTO) => {
    try {
      // Create the task with the state name included
      const taskWithStateName = {
        ...data,
        currentStateName: currentStateName,
      };

      // Create the new task on the server
      const newTask = await createTicket(taskWithStateName, setError);

      if (!newTask) {
        throw new Error("Failed to create task");
      }

      // Handle file uploads if needed
      if (newTask.id && files.length > 0) {
        await uploadAttachmentsForEntity("Ticket", newTask.id, files);
      }

      // Reset Form & Close Sheet
      form.reset();
      setFiles([]);
      setIsOpen(false);

      // Instead of manually updating state,
      // call the onTaskCreated callback to refresh all project data
      if (onTaskCreated) {
        await onTaskCreated();
      }
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[70rem] h-full px-4 overflow-hidden"
        data-testid="task-editor-sheet"
      >
        <div className="flex flex-col h-full max-h-screen">
          <div className="p-6 border-b">
            <SheetHeader>
              <SheetTitle>
                {t.teams.projects.view("add_new_task_to_state", {
                  stateName: selectedWorkflowState?.stateName ?? "unknown",
                })}
              </SheetTitle>
            </SheetHeader>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col h-full"
              data-testid="task-editor-form"
            >
              {/* Scrollable form content - fixed height calculations */}
              <div
                className="flex-1 overflow-y-auto p-6 pb-6"
                style={{
                  maxHeight:
                    "calc(100vh - 11rem)" /* Adjusted to account for header and footer */,
                  overflowY: "auto",
                  display:
                    "block" /* Ensures the content takes the full width */,
                }}
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* ✅ Title Field */}
                    <div className="col-span-1 sm:col-span-2">
                      <ExtInputField
                        form={form}
                        fieldName="requestTitle"
                        label={t.teams.tickets.form.base("name")}
                        required
                        testId="task-title-input"
                      />
                    </div>

                    {/* ✅ Description Field */}
                    <div className="col-span-1 sm:col-span-2">
                      <FormField
                        control={form.control}
                        name="requestDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t.teams.tickets.form.base("description")}{" "}
                              <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <RichTextEditor
                                value={field.value}
                                onChange={field.onChange}
                                data-testid="task-description-editor"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* ✅ File Uploader */}
                    <div className="col-span-1 sm:col-span-2">
                      <FileUploader
                        maxFileCount={8}
                        maxSize={8 * 1024 * 1024}
                        accept={{
                          "application/pdf": [],
                          "text/plain": [],
                          "image/png": [],
                          "image/jpeg": [],
                          "image/jpg": [],
                          "image/gif": [],
                          "image/webp": [],
                        }}
                        onValueChange={setFiles}
                        data-testid="task-file-uploader"
                      />
                    </div>

                    {/* ✅ Priority Select */}
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t.teams.tickets.form.base("priority")}
                          </FormLabel>
                          <FormControl>
                            <TicketPrioritySelect
                              value={field.value as TicketPriority}
                              onChange={(value: TicketPriority) =>
                                field.onChange(value)
                              }
                              data-testid="task-priority-select"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <TeamUserSelectField
                      form={form}
                      fieldName="assignUserId"
                      label={t.teams.tickets.form.base("assignee")}
                      teamId={teamId}
                      testId="task-assignee-select"
                    />

                    <DatePickerField
                      form={form}
                      fieldName="estimatedCompletionDate"
                      label={t.teams.tickets.form.base(
                        "target_completion_date",
                      )}
                      placeholder={t.common.misc("date_select_place_holder")}
                      testId="task-estimated-completion-date"
                    />

                    <DatePickerField
                      form={form}
                      fieldName="actualCompletionDate"
                      label={t.teams.tickets.form.base(
                        "actual_completion_date",
                      )}
                      placeholder={t.common.misc("date_select_place_holder")}
                      testId="task-actual-completion-date"
                    />

                    <TicketChannelSelectField
                      form={form}
                      testId="task-channel-select"
                    />

                    {/* Modified workflow state field to capture state name changes */}
                    <FormItem>
                      <FormLabel>
                        {t.teams.tickets.form.base("state")}{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <WorkflowStateSelect
                          workflowId={projectWorkflowId}
                          currentStateId={form.getValues("currentStateId") || 0}
                          onChange={handleWorkflowStateChange}
                          data-testid="task-workflow-state-select"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>

                    {/* Iteration field */}
                    <div className="col-span-1">
                      <IterationFormField
                        form={form}
                        projectId={projectId}
                        name="iterationId"
                        label={t.teams.tickets.form.base("iteration")}
                        testId="task-iteration-select"
                      />
                    </div>

                    {/* Epic field */}
                    <div className="col-span-1">
                      <EpicFormField
                        form={form}
                        projectId={projectId}
                        name="epicId"
                        label={t.teams.tickets.form.base("epic")}
                        testId="task-epic-select"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed footer with buttons */}
              <div className="p-6 mt-auto border-t flex gap-4 sticky bottom-0 bg-background z-10">
                <SubmitButton
                  label={t.common.buttons("save")}
                  labelWhileLoading={t.common.buttons("saving")}
                  data-testid="task-save-button"
                />
                <Button
                  variant="secondary"
                  onClick={() => setIsOpen(false)}
                  data-testid="task-discard-button"
                >
                  {t.common.buttons("discard")}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskEditorSheet;
