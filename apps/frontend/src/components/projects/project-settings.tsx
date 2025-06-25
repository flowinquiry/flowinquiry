"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { EstimationUnitSchema } from "@/types/projects";

interface ProjectSettingsProps {
  project: any;
  iterations: any[];
  epics: any[];
  loadingIterations: boolean;
  loadingEpics: boolean;
  permissionLevel: any;
  teamRole: string;
  handleAddNewIteration: () => void;
  handleEditIteration: (iterationId: number) => void;
  handleAddNewEpic: () => void;
  handleEditEpic: (epicId: number) => void;
  setIsProjectEditDialogOpen: (isOpen: boolean) => void;
  getEpicColor: (epicId: number) => string;
  getIterationStatus: (iteration: any) => string;
  t: any;
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
  iterations,
  epics,
  loadingIterations,
  loadingEpics,
  permissionLevel,
  teamRole,
  handleAddNewIteration,
  handleEditIteration,
  handleAddNewEpic,
  handleEditEpic,
  setIsProjectEditDialogOpen,
  getEpicColor,
  getIterationStatus,
  t,
}: ProjectSettingsProps): React.ReactElement {
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
          <h2 className="text-xl font-semibold">Project Settings</h2>
          {(permissionLevel === "WRITE" || teamRole === "manager") && (
            <button
              onClick={() => setIsProjectEditDialogOpen(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {t.teams.projects.view("edit_project")}
            </button>
          )}
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
                    <FormLabel>Sprint Length (Days)</FormLabel>
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
                      The default length of sprints in days
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
                    <FormLabel>Default Priority</FormLabel>
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
                      The default priority for new tickets
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
                    <FormLabel>Estimation Unit</FormLabel>
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
                      The unit used for estimating work
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

      {/* Iterations Section */}
      <div className="p-6 border rounded-lg bg-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Iterations</h2>
          {(permissionLevel === "WRITE" || teamRole === "manager") && (
            <button
              onClick={handleAddNewIteration}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {t.teams.projects.view("add_new_iteration")}
            </button>
          )}
        </div>

        {loadingIterations ? (
          <p>{t.common.misc("loading_data")}</p>
        ) : iterations.length > 0 ? (
          <div className="space-y-4">
            {iterations.map((iteration) => (
              <div
                key={iteration.id}
                className="flex justify-between items-center p-4 border rounded-md"
              >
                <div>
                  <h3 className="font-medium">{iteration.name}</h3>
                  <div className="text-sm text-muted-foreground">
                    {getIterationStatus(iteration)} |
                    {iteration.startDate
                      ? new Date(iteration.startDate).toLocaleDateString()
                      : "Not scheduled"}
                    {iteration.startDate || iteration.endDate ? " - " : ""}
                    {iteration.endDate
                      ? new Date(iteration.endDate).toLocaleDateString()
                      : iteration.startDate
                        ? "Ongoing"
                        : ""}
                  </div>
                </div>
                {(permissionLevel === "WRITE" || teamRole === "manager") && (
                  <button
                    onClick={() => handleEditIteration(iteration.id!)}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
                  >
                    {t.teams.projects.view("edit_iteration")}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>{t.teams.projects.view("no_iterations_found")}</p>
        )}
      </div>

      {/* Epics Section */}
      <div className="p-6 border rounded-lg bg-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Epics</h2>
          {(permissionLevel === "WRITE" || teamRole === "manager") && (
            <button
              onClick={handleAddNewEpic}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {t.teams.projects.view("add_new_epic")}
            </button>
          )}
        </div>

        {loadingEpics ? (
          <p>{t.common.misc("loading_data")}</p>
        ) : epics.length > 0 ? (
          <div className="space-y-4">
            {epics.map((epic) => (
              <div
                key={epic.id}
                className="flex justify-between items-center p-4 border rounded-md"
                style={{ borderLeft: `4px solid ${getEpicColor(epic.id!)}` }}
              >
                <div>
                  <h3 className="font-medium">{epic.name}</h3>
                  <div className="text-sm text-muted-foreground">
                    {epic.description}
                  </div>
                </div>
                {(permissionLevel === "WRITE" || teamRole === "manager") && (
                  <button
                    onClick={() => handleEditEpic(epic.id!)}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
                    style={{ borderColor: getEpicColor(epic.id!) }}
                  >
                    {t.teams.projects.view("edit_epic")}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>{t.teams.projects.view("no_epics_found")}</p>
        )}
      </div>
    </div>
  );
}
