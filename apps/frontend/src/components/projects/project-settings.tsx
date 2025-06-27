"use client";

import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/v4";

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
import { EstimationUnitSchema } from "@/types/projects";

interface ProjectSettingsProps {
  project: any;
}

// Define the form schema for project settings
const projectSettingSchema = z.object({
  sprintLengthDays: z.number().int().positive().default(14),
  defaultPriority: z.number().int().nonnegative().default(3),
  estimationUnit: EstimationUnitSchema.default("STORY_POINTS"),
  enableEstimation: z.boolean().default(true),
});

type ProjectSettingFormValues = z.infer<typeof projectSettingSchema>;

export default function ProjectSettings({
  project,
}: ProjectSettingsProps): React.ReactElement {
  const t = useAppClientTranslations();

  // Initialize form with values from project settings or defaults
  const form = useForm<ProjectSettingFormValues>({
    defaultValues: {
      sprintLengthDays: project.settings?.sprintLengthDays || 14,
      defaultPriority: project.settings?.defaultPriority || 3,
      estimationUnit: project.settings?.estimationUnit || "STORY_POINTS",
      enableEstimation:
        project.settings?.enableEstimation !== undefined
          ? project.settings.enableEstimation
          : true,
    },
  });

  return (
    <div className="space-y-6" data-testid="project-settings-view">
      {/* Project Settings Section */}
      <div className="p-6 border rounded-lg bg-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {t.teams.projects.settings("title")}
          </h2>
        </div>
        <Form {...form}>
          <form className="space-y-6">
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
                          Story Points
                        </SelectItem>
                        <SelectItem value="DAYS">Days</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t.teams.projects.settings("estimation_unit_description")}
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
                        Enable Estimation
                      </FormLabel>
                      <FormDescription>
                        Allow estimation of tickets in this project
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
          </form>
        </Form>
      </div>
    </div>
  );
}
