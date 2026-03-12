"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import CollapsibleCard from "@/components/shared/collapsible-card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  findProjectSettingsById,
  updateProjectSettings,
} from "@/lib/actions/project.action";
import { useError } from "@/providers/error-provider";
import { ProjectSettingDTO, ProjectSettingDTOSchema } from "@/types/projects";

interface ProjectSettingsProps {
  projectId: number;
}

type ProjectSettingFormValues = ProjectSettingDTO;

/* ── Left-accent section header — no horizontal divider ── */
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

export default function ProjectSettings({
  projectId,
}: ProjectSettingsProps): React.ReactElement {
  const t = useAppClientTranslations();
  const { setError } = useError();
  const [projectSettings, setProjectSettings] =
    useState<ProjectSettingDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectSettings = async () => {
      try {
        setLoading(true);
        const settings = await findProjectSettingsById(projectId, setError);
        setProjectSettings(settings);
      } finally {
        setLoading(false);
      }
    };
    fetchProjectSettings();
  }, [projectId, setError]);

  const form = useForm<ProjectSettingFormValues>({
    resolver: zodResolver(ProjectSettingDTOSchema),
    defaultValues: {
      projectId,
      sprintLengthDays: projectSettings?.sprintLengthDays ?? 14,
      defaultPriority: projectSettings?.defaultPriority ?? "Medium",
      estimationUnit: projectSettings?.estimationUnit ?? "STORY_POINTS",
      enableEstimation: projectSettings?.enableEstimation ?? true,
    },
  });

  useEffect(() => {
    if (projectSettings) {
      form.reset({
        projectId: projectSettings.projectId,
        sprintLengthDays: projectSettings.sprintLengthDays,
        defaultPriority: projectSettings.defaultPriority,
        estimationUnit: projectSettings.estimationUnit,
        enableEstimation: projectSettings.enableEstimation,
      });
    }
  }, [projectSettings, form]);

  const onSubmit = async (data: ProjectSettingFormValues) => {
    try {
      if (projectSettings) {
        const updatedSettings = await updateProjectSettings(
          projectId,
          { ...projectSettings, ...data },
          setError,
        );
        setProjectSettings(updatedSettings);
      }
    } catch (error) {
      console.error("Error updating project settings:", error);
    }
  };

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div
        className="flex flex-col gap-4"
        data-testid="project-settings-loading"
      >
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="project-settings-view">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-4">
            {/* ── Sprint & Scheduling ── */}
            <CollapsibleCard
              icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
              title={t.teams.projects.settings("sprint_length")}
              data-testid="sprint-settings-card"
            >
              <FormField
                control={form.control}
                name="sprintLengthDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t.teams.projects.settings("sprint_length")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        className="max-w-35"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                        data-testid="sprint-length-input"
                      />
                    </FormControl>
                    <FormDescription>
                      {t.teams.projects.settings("sprint_length_description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CollapsibleCard>

            {/* ── Tickets & Estimation ── */}
            <CollapsibleCard
              icon={<Zap className="h-4 w-4 text-muted-foreground" />}
              title={t.teams.projects.settings("estimation_unit")}
              data-testid="estimation-settings-card"
            >
              <div className="flex flex-col gap-6">
                {/* Priority & Unit */}
                <div>
                  <SectionHeader
                    icon={<Zap className="h-3.5 w-3.5" />}
                    title={t.teams.projects.settings("default_priority")}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="defaultPriority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t.teams.projects.settings("default_priority")}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="default-priority-select">
                                <SelectValue
                                  placeholder={t.teams.projects.settings(
                                    "default_priority_placeholder",
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(
                                [
                                  "Critical",
                                  "High",
                                  "Medium",
                                  "Low",
                                  "Trivial",
                                ] as const
                              ).map((p) => (
                                <SelectItem key={p} value={p}>
                                  {t.teams.tickets.form.priorities(p)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {t.teams.projects.settings(
                              "default_priority_description",
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimationUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t.teams.projects.settings("estimation_unit")}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="estimation-unit-select">
                                <SelectValue
                                  placeholder={t.teams.projects.settings(
                                    "estimation_unit_placeholder",
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="STORY_POINTS">
                                {t.teams.projects.settings("story_points")}
                              </SelectItem>
                              <SelectItem value="DAYS">
                                {t.teams.projects.settings("days")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {t.teams.projects.settings(
                              "estimation_unit_description",
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Enable Estimation toggle */}
                <div>
                  <SectionHeader
                    icon={<Zap className="h-3.5 w-3.5" />}
                    title={t.teams.projects.settings("enable_estimation")}
                  />
                  <FormField
                    control={form.control}
                    name="enableEstimation"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/50">
                        <div className="space-y-0.5 pr-4">
                          <FormLabel className="text-sm font-medium cursor-pointer">
                            {t.teams.projects.settings("enable_estimation")}
                          </FormLabel>
                          <FormDescription className="text-xs">
                            {t.teams.projects.settings(
                              "enable_estimation_description",
                            )}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="enable-estimation-switch"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CollapsibleCard>
          </div>

          {/* ── Action bar ── */}
          <div className="mt-4 flex items-center justify-end gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={form.formState.isSubmitting || !form.formState.isDirty}
              data-testid="project-settings-reset"
            >
              {t.common.buttons("discard")}
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || !form.formState.isDirty}
              data-testid="project-settings-save"
            >
              {form.formState.isSubmitting
                ? t.common.buttons("saving")
                : t.common.buttons("save_changes")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
