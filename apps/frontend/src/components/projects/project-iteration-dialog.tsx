import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, subDays } from "date-fns";
import { Calendar, FileText, FolderGit2, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePickerField } from "@/components/ui/ext-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  closeProjectIteration,
  createProjectIteration,
  updateProjectIteration,
} from "@/lib/actions/project-iteration.action";
import { useError } from "@/providers/error-provider";
import {
  ProjectDTO,
  ProjectIterationDTO,
  ProjectIterationDTOSchema,
} from "@/types/projects";

interface ProjectIterationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (iteration: ProjectIterationDTO) => void;
  onCancel?: () => void;
  project: ProjectDTO;
  iteration?: ProjectIterationDTO | null;
}

/* ── Section header — left-accent, no hard divider line ── */
const SectionHeader = ({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) => (
  <div className="flex items-center gap-2 mb-4 pl-2 border-l-2 border-primary/40">
    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {icon}
      {title}
    </span>
  </div>
);

export function ProjectIterationDialog({
  open,
  onOpenChange,
  onSave,
  onCancel,
  project,
  iteration,
}: ProjectIterationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastChangedField, setLastChangedField] = useState<
    "startDate" | "endDate" | null
  >(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const { setError } = useError();
  const t = useAppClientTranslations();

  const isEditMode = !!iteration?.id;

  const form = useForm<ProjectIterationDTO>({
    resolver: zodResolver(ProjectIterationDTOSchema),
    defaultValues: {
      id: iteration?.id,
      projectId: project?.id,
      name: iteration?.name || "",
      status: iteration?.status,
      description: iteration?.description || "",
      startDate: iteration?.startDate,
      endDate: iteration?.endDate,
      totalTickets: iteration?.totalTickets || 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        id: iteration?.id,
        projectId: project.id,
        name: iteration?.name || "",
        status: iteration?.status,
        description: iteration?.description || "",
        startDate: iteration?.startDate,
        endDate: iteration?.endDate,
        totalTickets: iteration?.totalTickets || 0,
      });
      setLastChangedField(null);
      setIsCalculating(false);
    }
  }, [open, iteration, project, form]);

  const startDate = useWatch({ control: form.control, name: "startDate" });
  const endDate = useWatch({ control: form.control, name: "endDate" });

  const [prevStartDate, setPrevStartDate] = useState(startDate);
  const [prevEndDate, setPrevEndDate] = useState(endDate);

  useEffect(() => {
    if (
      !form.formState.isSubmitting &&
      !isCalculating &&
      startDate !== prevStartDate
    ) {
      setLastChangedField("startDate");
    }
    setPrevStartDate(startDate);
  }, [startDate, form.formState.isSubmitting, isCalculating, prevStartDate]);

  useEffect(() => {
    if (
      !form.formState.isSubmitting &&
      !isCalculating &&
      endDate !== prevEndDate
    ) {
      setLastChangedField("endDate");
    }
    setPrevEndDate(endDate);
  }, [endDate, form.formState.isSubmitting, isCalculating, prevEndDate]);

  useEffect(() => {
    if (!project?.projectSetting?.sprintLengthDays || isCalculating) return;
    const sprintLengthDays = project.projectSetting.sprintLengthDays;

    if (lastChangedField === "startDate" && startDate) {
      setIsCalculating(true);
      try {
        const calculatedEndDate = addDays(
          new Date(startDate),
          sprintLengthDays - 1,
        );
        form.setValue("endDate", calculatedEndDate.toISOString(), {
          shouldValidate: true,
          shouldDirty: true,
        });
      } finally {
        setIsCalculating(false);
      }
    } else if (lastChangedField === "endDate" && endDate) {
      setIsCalculating(true);
      try {
        const calculatedStartDate = subDays(
          new Date(endDate),
          sprintLengthDays - 1,
        );
        form.setValue("startDate", calculatedStartDate.toISOString(), {
          shouldValidate: true,
          shouldDirty: true,
        });
      } finally {
        setIsCalculating(false);
      }
    }
  }, [startDate, endDate, lastChangedField, project, form, isCalculating]);

  const handleSubmit = async (values: ProjectIterationDTO) => {
    setIsSubmitting(true);
    try {
      const result =
        isEditMode && iteration?.id
          ? await updateProjectIteration(iteration.id, values, setError)
          : await createProjectIteration(values, setError);
      onOpenChange(false);
      onSave?.(result);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async () => {
    setIsSubmitting(true);
    try {
      const result = await closeProjectIteration(iteration?.id!);
      onOpenChange(false);
      onSave?.(result);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg p-0 flex flex-col overflow-hidden max-h-[90vh]"
        data-testid="iteration-dialog"
      >
        {/* ── Sticky header ── */}
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FolderGit2 className="h-4 w-4 text-muted-foreground shrink-0" />
            {isEditMode
              ? t.teams.projects.iteration("edit_dialog_title")
              : t.teams.projects.iteration("create_dialog_title")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5 pl-6">
            {isEditMode
              ? t.teams.projects.iteration("edit_dialog_description")
              : t.teams.projects.iteration("create_dialog_description")}
          </p>
        </DialogHeader>

        {/* ── Form wraps body + footer ── */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-1 overflow-hidden min-h-0"
            data-testid="iteration-form"
          >
            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="flex flex-col gap-6">
                {/* ── Basics ── */}
                <div>
                  <SectionHeader
                    icon={<FileText className="h-4 w-4" />}
                    title={t.teams.projects.iteration("form.name")}
                  />
                  <div className="flex flex-col gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t.teams.projects.iteration("form.name")}
                            <span className="text-destructive ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t.teams.projects.iteration(
                                "form.name_place_holder",
                              )}
                              {...field}
                              data-testid="iteration-name-input"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t.teams.projects.iteration("form.description")}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t.teams.projects.iteration(
                                "form.description_place_holder",
                              )}
                              rows={3}
                              className="resize-none"
                              {...field}
                              data-testid="iteration-description-textarea"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* ── Dates ── */}
                <div>
                  <SectionHeader
                    icon={<Calendar className="h-4 w-4" />}
                    title={t.teams.projects.iteration("form.start_date")}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <DatePickerField
                      form={form}
                      fieldName="startDate"
                      label={t.teams.projects.iteration("form.start_date")}
                      placeholder={t.common.misc("date_select_place_holder")}
                      testId="iteration-start-date"
                    />
                    <DatePickerField
                      form={form}
                      fieldName="endDate"
                      label={t.teams.projects.iteration("form.end_date")}
                      placeholder={t.common.misc("date_select_place_holder")}
                      testId="iteration-end-date"
                    />
                  </div>
                  {project?.projectSetting?.sprintLengthDays && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {t.teams.projects.iteration("form.sprint_length_hint", {
                        days: project.projectSetting.sprintLengthDays,
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Sticky footer ── */}
            <div className="flex items-center justify-between gap-3 border-t px-6 py-4 shrink-0">
              {/* Close iteration — destructive-flavoured, left-aligned */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={iteration?.status !== "ACTIVE" || isSubmitting}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                data-testid="iteration-close-button"
              >
                <XCircle className="h-4 w-4" />
                {t.common.buttons("close")}
              </Button>

              {/* Cancel + Submit — right-aligned */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  data-testid="iteration-cancel-button"
                >
                  {t.common.buttons("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="iteration-submit-button"
                >
                  {isSubmitting
                    ? isEditMode
                      ? t.common.buttons("saving")
                      : t.common.buttons("creating")
                    : isEditMode
                      ? t.common.buttons("save_changes")
                      : t.teams.projects.iteration("form.create_iteration")}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default ProjectIterationDialog;
