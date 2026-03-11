"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  Calendar,
  FileText,
  FolderOpen,
  InfoIcon,
  Settings2,
} from "lucide-react";
import React, { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import RichTextEditor from "@/components/shared/rich-text-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DatePickerField,
  ExtInputField,
  SubmitButton,
} from "@/components/ui/ext-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { createProject, updateProject } from "@/lib/actions/project.action";
import { useError } from "@/providers/error-provider";
import { ProjectDTO, ProjectSchema, ProjectStatus } from "@/types/projects";
import { TeamDTO } from "@/types/teams";

type ProjectDialogProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  teamEntity: TeamDTO;
  project?: ProjectDTO | null;
  onSaveSuccess: () => void;
};

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

const ProjectEditDialog: React.FC<ProjectDialogProps> = ({
  open,
  setOpen,
  teamEntity,
  project,
  onSaveSuccess,
}) => {
  const { setError } = useError();
  const t = useAppClientTranslations();
  const editorMountedRef = useRef(false);

  const form = useForm<z.infer<typeof ProjectSchema>>({
    resolver: zodResolver(ProjectSchema),
    defaultValues: {
      teamId: teamEntity.id!,
      name: "",
      description: "",
      shortName: "",
      status: "Active" as ProjectStatus,
      startDate: undefined,
      endDate: undefined,
    },
  });

  // Populate form when editing an existing project
  useEffect(() => {
    if (open) {
      form.reset(
        project
          ? {
              teamId: teamEntity.id!,
              name: project.name || "",
              description: project.description || "",
              shortName: project.shortName || "",
              status: project.status || "Active",
              startDate: project.startDate || undefined,
              endDate: project.endDate || undefined,
            }
          : {
              teamId: teamEntity.id!,
              name: "",
              description: "",
              shortName: "",
              status: "Active",
              startDate: undefined,
              endDate: undefined,
            },
      );
      editorMountedRef.current = true;
    }
  }, [project, teamEntity.id, open, form]);

  const onSubmit = async (data: ProjectDTO) => {
    if (project) {
      await updateProject(project.id!, data, setError);
    } else {
      await createProject(data, setError);
    }
    setOpen(false);
    onSaveSuccess();
  };

  // Handle dialog close - make sure to clean up any pending editor state
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Allow time for any pending operations to complete
      setTimeout(() => {
        editorMountedRef.current = false;
      }, 100);
    }
    setOpen(newOpen);
  };

  const isEdit = !!project;

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogPortal>
          <DialogContent
            className="sm:max-w-3xl max-h-[90vh] p-0 flex flex-col overflow-hidden"
            onPointerDownOutside={(e) => {
              // Prevent closing when clicking inside editor dropdowns that may be rendered in a portal
              if (
                e.target &&
                (e.target as HTMLElement).closest(".mention-dropdown-container")
              ) {
                e.preventDefault();
              }
            }}
            onInteractOutside={(e) => {
              // Prevent closing when interacting with editor dropdowns
              if (
                e.target &&
                (e.target as HTMLElement).closest(".mention-dropdown-container")
              ) {
                e.preventDefault();
              }
            }}
          >
            {/* ── Header ── */}
            <DialogHeader className="px-6 py-4 border-b shrink-0">
              <DialogTitle className="flex items-center gap-2 text-base">
                <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                {isEdit
                  ? t.teams.projects.new_dialog("edit_project")
                  : t.teams.projects.new_dialog("new_project")}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5 pl-6">
                {isEdit
                  ? t.teams.projects.new_dialog("edit_project_description")
                  : t.teams.projects.new_dialog("new_project_description")}
              </p>
            </DialogHeader>

            {/* ── Scrollable body + footer wrapped in one form ── */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col flex-1 overflow-hidden min-h-0"
              >
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <div className="flex flex-col gap-6">
                    {/* ── Basics section ── */}
                    <div>
                      <SectionHeader
                        icon={<FileText className="h-4 w-4" />}
                        title={t.teams.projects.form("name")}
                      />
                      <div className="flex flex-col gap-4">
                        <ExtInputField
                          form={form}
                          fieldName="name"
                          label={t.teams.projects.form("name")}
                          required
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t.teams.projects.form("description")}
                                <span className="text-destructive ml-1">*</span>
                              </FormLabel>
                              <FormControl>
                                {editorMountedRef.current && (
                                  <RichTextEditor
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={() => {}}
                                    key={`editor-${open ? "open" : "closed"}-${project?.id || "new"}`}
                                  />
                                )}
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* ── Settings section ── */}
                    <div>
                      <SectionHeader
                        icon={<Settings2 className="h-4 w-4" />}
                        title={t.teams.projects.form("status")}
                      />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Short name */}
                        <FormField
                          control={form.control}
                          name="shortName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1.5">
                                {t.teams.projects.form("short_name")}
                                <span className="text-destructive">*</span>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipPrimitive.Portal>
                                    <TooltipContent
                                      side="top"
                                      align="center"
                                      className="z-9999 max-w-xs"
                                      sideOffset={5}
                                      avoidCollisions
                                      collisionPadding={8}
                                      sticky="always"
                                    >
                                      <p>
                                        {t.teams.projects.form(
                                          "short_name_tooltip",
                                        )}
                                      </p>
                                    </TooltipContent>
                                  </TooltipPrimitive.Portal>
                                </Tooltip>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={t.teams.projects.form(
                                    "short_name_placeholder",
                                  )}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Status */}
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t.teams.projects.form("status")}
                                <span className="text-destructive ml-1">*</span>
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Active">
                                    {t.teams.projects.list("status_active")}
                                  </SelectItem>
                                  <SelectItem value="Closed">
                                    {t.teams.projects.list("status_closed")}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* ── Dates section ── */}
                    <div>
                      <SectionHeader
                        icon={<Calendar className="h-4 w-4" />}
                        title={t.teams.projects.form("start_date")}
                      />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <DatePickerField
                          form={form}
                          fieldName="startDate"
                          label={t.teams.projects.form("start_date")}
                          placeholder={t.common.misc(
                            "date_select_place_holder",
                          )}
                          testId="project-edit-start-date"
                        />
                        <DatePickerField
                          form={form}
                          fieldName="endDate"
                          label={t.teams.projects.form("end_date")}
                          placeholder={t.common.misc(
                            "date_select_place_holder",
                          )}
                          testId="project-edit-end-date"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Footer action bar ── */}
                <div className="flex items-center gap-3 border-t px-6 py-4 shrink-0">
                  <SubmitButton
                    label={
                      isEdit
                        ? t.common.buttons("save_changes")
                        : t.common.buttons("save")
                    }
                    labelWhileLoading={t.common.buttons("saving")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                  >
                    {t.common.buttons("cancel")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </TooltipProvider>
  );
};

export default ProjectEditDialog;
