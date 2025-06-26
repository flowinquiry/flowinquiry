"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/v4";

import RichTextEditor from "@/components/shared/rich-text-editor";
import TicketChannelSelectField from "@/components/teams/team-ticket-channel-select";
import TeamUserSelectField from "@/components/teams/team-users-select-field";
import { TicketPrioritySelect } from "@/components/teams/ticket-priority-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import WorkflowStateSelectField from "@/components/workflows/workflow-state-select-field";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { uploadAttachmentsForEntity } from "@/lib/actions/entity-attachments.action";
import { createTicket } from "@/lib/actions/tickets.action";
import { useError } from "@/providers/error-provider";
import { TeamDTO } from "@/types/teams";
import { TicketDTO, TicketDTOSchema, TicketPriority } from "@/types/tickets";
import { WorkflowDTO } from "@/types/workflows";

type NewTicketToTeamDialogProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  teamEntity: TeamDTO;
  workflow: WorkflowDTO | null;
  onSaveSuccess: () => void;
};

const NewTicketToTeamDialog: React.FC<NewTicketToTeamDialogProps> = ({
  open,
  setOpen,
  teamEntity,
  workflow,
  onSaveSuccess,
}) => {
  const [files, setFiles] = React.useState<File[]>([]);
  const { data: session } = useSession();
  const { setError } = useError();
  const t = useAppClientTranslations();

  const form = useForm<z.infer<typeof TicketDTOSchema>>({
    resolver: zodResolver(TicketDTOSchema),
    defaultValues: {
      teamId: teamEntity.id!,
      priority: "Medium",
      workflowId: workflow?.id !== undefined ? workflow.id : undefined,
      requestUserId: Number(session?.user?.id ?? 0),
      requestTitle: "",
      requestDescription: "",
      assignUserId: undefined,
      estimatedCompletionDate: null,
      actualCompletionDate: null,
    },
  });

  /** ✅ Reset form values when the dialog opens with a new workflow */
  useEffect(() => {
    if (open && !form.formState.isDirty) {
      form.reset({
        teamId: teamEntity.id!,
        priority: "Medium",
        workflowId: workflow?.id !== undefined ? workflow.id : undefined,
        requestUserId: Number(session?.user?.id ?? 0),
        requestTitle: "",
        requestDescription: "",
        assignUserId: undefined,
        estimatedCompletionDate: null,
        actualCompletionDate: null,
      });
      setFiles([]); // Reset file state
    }
  }, [open, workflow, form, teamEntity.id, session]);

  const onSubmit = async (data: TicketDTO) => {
    const savedTicket = await createTicket(data, setError);
    if (savedTicket?.id && files.length > 0) {
      uploadAttachmentsForEntity("Ticket", savedTicket.id, files);
    }
    setOpen(false);
    onSaveSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="sm:max-w-4xl max-h-[90vh] p-4 sm:p-6 flex flex-col overflow-y-auto"
        data-testid="new-ticket-dialog"
      >
        <DialogHeader>
          <DialogTitle data-testid="new-ticket-dialog-title">
            [{workflow?.requestName}]: {t.teams.tickets.new_dialog("title")}
          </DialogTitle>
          <DialogDescription data-testid="new-ticket-dialog-description">
            {t.teams.tickets.new_dialog("description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1"
            data-testid="new-ticket-form"
          >
            <div className="flex-1 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="col-span-1 sm:col-span-2">
                  <ExtInputField
                    form={form}
                    fieldName="requestTitle"
                    label={t.teams.tickets.form.base("name")}
                    required={true}
                    data-testid="ticket-title-input"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <FormField
                    control={form.control}
                    name="requestDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t.teams.tickets.form.base("description")}{" "}
                          <span className="text-destructive"> *</span>
                        </FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                            data-testid="ticket-description-editor"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <FileUploader
                    maxFileCount={8}
                    maxSize={8 * 1024 * 1024}
                    accept={{ "*/*": [] }}
                    onValueChange={setFiles}
                    data-testid="ticket-file-uploader"
                  />
                </div>

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
                          value={field.value}
                          onChange={(value: TicketPriority) =>
                            field.onChange(value)
                          }
                          data-testid="ticket-priority-select"
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
                  teamId={teamEntity.id!}
                  data-testid="ticket-assignee-select"
                />

                <DatePickerField
                  form={form}
                  fieldName="estimatedCompletionDate"
                  label={t.teams.tickets.form.base("target_completion_date")}
                  placeholder={t.common.misc("date_select_place_holder")}
                  data-testid="ticket-estimated-completion-date"
                />

                <DatePickerField
                  form={form}
                  fieldName="actualCompletionDate"
                  label={t.teams.tickets.form.base("actual_completion_date")}
                  placeholder={t.common.misc("date_select_place_holder")}
                  data-testid="ticket-actual-completion-date"
                />
                <TicketChannelSelectField
                  form={form}
                  data-testid="ticket-channel-select"
                />
                <WorkflowStateSelectField
                  form={form}
                  name="currentStateId"
                  label={t.teams.tickets.form.base("state")}
                  required
                  workflowId={workflow?.id!}
                  includeSelf
                  data-testid="ticket-state-select"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-start gap-4">
              <SubmitButton
                label={t.common.buttons("save")}
                labelWhileLoading={t.common.buttons("saving")}
                data-testid="ticket-submit-button"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="ticket-discard-button"
              >
                Discard
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewTicketToTeamDialog;
