"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect,useState } from "react";
import { useForm } from "react-hook-form";

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
import { Switch } from "@/components/ui/switch";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  findProjectSettingsById,
  updateProjectSettings,
} from "@/lib/actions/project.action";
import { useError } from "@/providers/error-provider";
import {
  ProjectSettingDTO,
  ProjectSettingDTOSchema,
} from "@/types/projects";

interface ProjectSettingsProps {
  projectId: number;
}

// Use the ProjectSettingDTOSchema from types/projects.ts
type ProjectSettingFormValues = ProjectSettingDTO;

export default function ProjectSettings({
  projectId,
}: ProjectSettingsProps): React.ReactElement {
  const t = useAppClientTranslations();
  const { setError } = useError();
  const [projectSettings, setProjectSettings] =
    useState<ProjectSettingDTO | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch project settings
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

  // Initialize form with values from project settings or defaults
  const form = useForm<ProjectSettingFormValues>({
    resolver: zodResolver(ProjectSettingDTOSchema),
    defaultValues: {
      projectId: projectId,
      sprintLengthDays: projectSettings?.sprintLengthDays || 14,
      defaultPriority: projectSettings?.defaultPriority || "Medium",
      estimationUnit: projectSettings?.estimationUnit || "STORY_POINTS",
      enableEstimation:
        projectSettings?.enableEstimation !== undefined
          ? projectSettings.enableEstimation
          : true,
    },
  });

  // Update form values when projectSettings changes
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

  // Submit function
  const onSubmit = async (data: ProjectSettingFormValues) => {
    try {
      if (projectSettings) {
        const updatedSettings = await updateProjectSettings(
          projectSettings.id!,
          {
            ...projectSettings,
            ...data,
          },
          setError,
        );
        setProjectSettings(updatedSettings);
      }
    } catch (error) {
      console.error("Error updating project settings:", error);
    }
  };

  return (
    <div className="space-y-6" data-testid="project-settings-view">
      {/* Project Settings Section */}
      <div className="p-6 border rounded-lg bg-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {t.teams.projects.settings("title")}
          </h2>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading project settings...</p>
          </div>
        ) : (
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sprint Length Days */}
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
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        {t.teams.projects.settings("sprint_length_description")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Default Priority */}
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
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select default priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Critical">Critical</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Trivial">Trivial</SelectItem>
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

                {/* Estimation Unit */}
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
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select estimation unit" />
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

                {/* Enable Estimation */}
                <FormField
                  control={form.control}
                  name="enableEstimation"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          {t.teams.projects.settings("enable_estimation")}
                        </FormLabel>
                        <FormDescription>
                          {t.teams.projects.settings(
                            "enable_estimation_description",
                          )}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end mt-6">
                <Button type="submit">{t.common.buttons("save")}</Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
