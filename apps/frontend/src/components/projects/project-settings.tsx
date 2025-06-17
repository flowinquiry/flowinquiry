"use client";

import { Edit, Plus } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ProjectDTO,
  ProjectEpicDTO,
  ProjectIterationDTO,
} from "@/types/projects";
import { PermissionUtils } from "@/types/resources";

interface ProjectSettingsProps {
  project: ProjectDTO;
  iterations: ProjectIterationDTO[];
  epics: ProjectEpicDTO[];
  loadingIterations: boolean;
  loadingEpics: boolean;
  permissionLevel: string;
  teamRole: string;
  handleAddNewIteration: () => void;
  handleEditIteration: (iterationId: number) => void;
  handleAddNewEpic: () => void;
  handleEditEpic: (epicId: number) => void;
  setIsProjectEditDialogOpen: (isOpen: boolean) => void;
  getEpicColor: (epicId: number) => string;
  getIterationStatus: (iteration: ProjectIterationDTO) => string;
  t: any; // Translation function
}

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
}: ProjectSettingsProps) {
  return (
    <div className="space-y-6" data-testid="project-settings-view">
      {/* Project Details Section */}
      <div className="p-6 border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-4">Project Details</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Project Name
            </h3>
            <p className="text-lg">{project.name}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Description
            </h3>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: project.description ?? "<p>No description provided</p>",
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Status
              </h3>
              <Badge variant="outline">{project.status || "Not set"}</Badge>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Start Date
              </h3>
              <p>
                {project.startDate
                  ? new Date(project.startDate).toLocaleDateString()
                  : "Not set"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                End Date
              </h3>
              <p>
                {project.endDate
                  ? new Date(project.endDate).toLocaleDateString()
                  : "Not set"}
              </p>
            </div>
          </div>
        </div>

        {(PermissionUtils.canWrite(permissionLevel) ||
          teamRole === "manager") && (
          <div className="mt-6">
            <Button
              onClick={() => setIsProjectEditDialogOpen(true)}
              variant="default"
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Project Details
            </Button>
          </div>
        )}
      </div>

      {/* Iterations Section */}
      <div className="p-6 border rounded-lg bg-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Iterations</h2>
          <Button
            onClick={handleAddNewIteration}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Iteration
          </Button>
        </div>

        {loadingIterations ? (
          <p>{t.common.misc("loading_data")}</p>
        ) : iterations.length > 0 ? (
          <div className="space-y-3">
            {iterations.map((iteration) => (
              <div
                key={iteration.id}
                className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">{iteration.name}</p>
                  <p className="text-sm text-muted-foreground">
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
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditIteration(iteration.id!)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No iterations found for this project.
          </p>
        )}
      </div>

      {/* Epics Section */}
      <div className="p-6 border rounded-lg bg-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Epics</h2>
          <Button
            onClick={handleAddNewEpic}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Epic
          </Button>
        </div>

        {loadingEpics ? (
          <p>{t.common.misc("loading_data")}</p>
        ) : epics.length > 0 ? (
          <div className="space-y-3">
            {epics.map((epic) => (
              <div
                key={epic.id}
                className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50"
                style={{
                  borderLeft: `4px solid ${getEpicColor(epic.id!)}`,
                }}
              >
                <div>
                  <p className="font-medium">{epic.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {epic.description || "No description"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditEpic(epic.id!)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No epics found for this project.
          </p>
        )}
      </div>
    </div>
  );
}
