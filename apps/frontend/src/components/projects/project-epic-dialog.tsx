import { zodResolver } from "@hookform/resolvers/zod";
import { BookMarked, Calendar, FileText } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

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
  createProjectEpic,
  updateProjectEpic,
} from "@/lib/actions/project-epic.action";
import { useError } from "@/providers/error-provider";
import { ProjectEpicDTO, ProjectEpicDTOSchema } from "@/types/projects";

interface ProjectEpicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (epic: ProjectEpicDTO) => void;
  onCancel?: () => void;
  projectId: number;
  epic?: ProjectEpicDTO | null;
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

export function ProjectEpicDialog({
  open,
  onOpenChange,
  onSave,
  onCancel,
  projectId,
  epic,
}: ProjectEpicDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setError } = useError();
  const t = useAppClientTranslations();

  const isEditMode = !!epic?.id;

  const form = useForm<ProjectEpicDTO>({
    resolver: zodResolver(ProjectEpicDTOSchema),
    defaultValues: {
      id: epic?.id,
      projectId,
      name: epic?.name || "",
      description: epic?.description || "",
      startDate: epic?.startDate,
      endDate: epic?.endDate,
      totalTickets: epic?.totalTickets || 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        id: epic?.id,
        projectId,
        name: epic?.name || "",
        description: epic?.description || "",
        startDate: epic?.startDate,
        endDate: epic?.endDate,
        totalTickets: epic?.totalTickets || 0,
      });
    }
  }, [open, epic, projectId, form]);

  const handleSubmit = async (values: ProjectEpicDTO) => {
    setIsSubmitting(true);
    try {
      const result =
        isEditMode && epic?.id
          ? await updateProjectEpic(epic.id, values, setError)
          : await createProjectEpic(values, setError);
      onOpenChange(false);
      onSave?.(result);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-3xl p-0 flex flex-col overflow-hidden max-h-[90vh]"
        data-testid="epic-dialog"
      >
        {/* ── Sticky header ── */}
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <BookMarked className="h-4 w-4 text-muted-foreground shrink-0" />
            {isEditMode
              ? t.teams.projects.epic("edit_dialog_title")
              : t.teams.projects.epic("create_dialog_title")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5 pl-6">
            {isEditMode
              ? t.teams.projects.epic("edit_dialog_description")
              : t.teams.projects.epic("create_dialog_description")}
          </p>
        </DialogHeader>

        {/* ── Form wraps body + footer ── */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-1 overflow-hidden min-h-0"
            data-testid="epic-form"
          >
            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="flex flex-col gap-6">
                {/* ── Basics ── */}
                <div>
                  <SectionHeader
                    icon={<FileText className="h-4 w-4" />}
                    title={t.teams.projects.epic("form.name")}
                  />
                  <div className="flex flex-col gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t.teams.projects.epic("form.name")}
                            <span className="text-destructive ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t.teams.projects.epic(
                                "form.name_place_holder",
                              )}
                              {...field}
                              data-testid="epic-name-input"
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
                            {t.teams.projects.epic("form.description")}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t.teams.projects.epic(
                                "form.description_place_holder",
                              )}
                              rows={3}
                              className="resize-none"
                              {...field}
                              data-testid="epic-description-textarea"
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
                    title={t.teams.projects.epic("form.start_date")}
                  />
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <DatePickerField
                      form={form}
                      fieldName="startDate"
                      label={t.teams.projects.epic("form.start_date")}
                      placeholder={t.common.misc("date_select_place_holder")}
                      dateSelectionMode="any"
                      required={false}
                      testId="epic-start-date"
                    />
                    <DatePickerField
                      form={form}
                      fieldName="endDate"
                      label={t.teams.projects.epic("form.end_date")}
                      placeholder={t.common.misc("date_select_place_holder")}
                      dateSelectionMode="any"
                      required={false}
                      testId="epic-end-date"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Sticky footer ── */}
            <div className="flex items-center justify-end gap-2 border-t px-6 py-4 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                data-testid="epic-cancel-button"
              >
                {t.common.buttons("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="epic-submit-button"
              >
                {isSubmitting
                  ? isEditMode
                    ? t.common.buttons("saving")
                    : t.common.buttons("creating")
                  : isEditMode
                    ? t.common.buttons("save_changes")
                    : t.teams.projects.epic("form.create_epic")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default ProjectEpicDialog;
