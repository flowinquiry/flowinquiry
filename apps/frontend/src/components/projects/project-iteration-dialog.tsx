import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, subDays } from "date-fns";
import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  iteration?: ProjectIterationDTO | null; // Optional iteration for edit mode
}

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
  const [isCalculating, setIsCalculating] = useState(false); // Flag to prevent infinite loops
  const { setError } = useError();
  const t = useAppClientTranslations();

  // Determine if we're in edit mode
  const isEditMode = !!iteration?.id;

  // Initialize form with the ProjectIterationDTOSchema
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

  // Reset form when dialog opens/closes or iteration changes
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

      // Reset lastChangedField to avoid triggering calculations based on previous state
      setLastChangedField(null);
      setIsCalculating(false);
    }
  }, [open, iteration, project, form]);

  // Watch for changes to startDate and endDate
  const startDate = useWatch({
    control: form.control,
    name: "startDate",
  });

  const endDate = useWatch({
    control: form.control,
    name: "endDate",
  });

  // Track changes to startDate and endDate
  const [prevStartDate, setPrevStartDate] = useState(startDate);
  const [prevEndDate, setPrevEndDate] = useState(endDate);

  useEffect(() => {
    // Only update if this is a user change, not a programmatic one
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
    // Only update if this is a user change, not a programmatic one
    if (
      !form.formState.isSubmitting &&
      !isCalculating &&
      endDate !== prevEndDate
    ) {
      setLastChangedField("endDate");
    }
    setPrevEndDate(endDate);
  }, [endDate, form.formState.isSubmitting, isCalculating, prevEndDate]);

  // Calculate endDate when startDate changes or calculate startDate when endDate changes
  useEffect(() => {
    // Skip if project settings are not available or sprintLengthDays is not set or if we're already calculating
    if (!project?.projectSetting?.sprintLengthDays || isCalculating) return;

    const sprintLengthDays = project.projectSetting.sprintLengthDays;

    // If startDate was changed and is valid, calculate endDate
    if (lastChangedField === "startDate" && startDate) {
      setIsCalculating(true); // Set flag to prevent infinite loops

      try {
        const startDateObj = new Date(startDate);
        const calculatedEndDate = addDays(startDateObj, sprintLengthDays - 1); // -1 because the start day is included

        form.setValue("endDate", calculatedEndDate.toISOString(), {
          shouldValidate: true,
          shouldDirty: true,
        });
      } finally {
        // Reset the flag immediately after the form value is set
        setIsCalculating(false);
      }
    }
    // If endDate was changed and is valid, calculate startDate
    else if (lastChangedField === "endDate" && endDate) {
      setIsCalculating(true); // Set flag to prevent infinite loops

      try {
        const endDateObj = new Date(endDate);
        const calculatedStartDate = subDays(endDateObj, sprintLengthDays - 1); // -1 because the end day is included

        form.setValue("startDate", calculatedStartDate.toISOString(), {
          shouldValidate: true,
          shouldDirty: true,
        });
      } finally {
        // Reset the flag immediately after the form value is set
        setIsCalculating(false);
      }
    }
  }, [startDate, endDate, lastChangedField, project, form, isCalculating]);

  const handleSubmit = async (values: ProjectIterationDTO) => {
    setIsSubmitting(true);
    try {
      let result: ProjectIterationDTO;

      if (isEditMode && iteration?.id) {
        // Update existing iteration
        result = await updateProjectIteration(iteration.id, values, setError);
      } else {
        // Create new iteration
        result = await createProjectIteration(values, setError);
      }

      onOpenChange(false);

      if (onSave) {
        onSave(result);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async () => {
    setIsSubmitting(true);
    try {
      let result: ProjectIterationDTO;
      result = await closeProjectIteration(iteration?.id!);
      onOpenChange(false);
      
      onSave?.(result);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-240" data-testid="iteration-dialog">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? t.teams.projects.iteration("edit_dialog_title")
              : t.teams.projects.iteration("create_dialog_title")}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? t.teams.projects.iteration("edit_dialog_description")
              : t.teams.projects.iteration("create_dialog_description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
            data-testid="iteration-form">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t.teams.projects.iteration("form.name")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t.teams.projects.iteration(
                        "form.name_place_holder"
                      )}
                      {...field}
                      data-testid="iteration-name-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
                        "form.description_place_holder"
                      )}
                      {...field}
                      rows={3}
                      data-testid="iteration-description-textarea"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                data-testid="iteration-cancel-button">
                {t.common.buttons("cancel")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={ iteration?.status !== "ACTIVE" ||isSubmitting}
                data-testid="iteration-close-button">
                {t.common.buttons("close")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="iteration-submit-button">
                {isSubmitting
                  ? isEditMode
                    ? t.common.buttons("saving")
                    : t.common.buttons("creating")
                  : isEditMode
                    ? t.common.buttons("save_changes")
                    : t.teams.projects.iteration("form.create_iteration")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default ProjectIterationDialog;
