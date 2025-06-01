"use client";

import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import { ChevronDown, ChevronUp, Edit, Plus } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import ProjectEditDialog from "@/components/projects/project-edit-dialog";
import { ProjectEpicDialog } from "@/components/projects/project-epic-dialog";
import ProjectIterationDialog from "@/components/projects/project-iteration-dialog";
import StateColumn from "@/components/projects/state-column";
import TaskBlock from "@/components/projects/task-block";
import TaskDetailSheet from "@/components/projects/task-detail-sheet";
import TaskEditorSheet, {
  TaskBoard,
} from "@/components/projects/task-editor-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  findByShortName,
  findProjectWorkflowByTeam,
} from "@/lib/actions/project.action";
import { findEpicsByProjectId } from "@/lib/actions/project-epic.action";
import { findIterationsByProjectId } from "@/lib/actions/project-iteration.action";
import {
  searchTickets,
  updateTicket,
  updateTicketState,
} from "@/lib/actions/tickets.action";
import { calculateDuration } from "@/lib/datetime";
import { obfuscate } from "@/lib/endecode";
import { useError } from "@/providers/error-provider";
import { useTeam } from "@/providers/team-provider";
import { useUserTeamRole } from "@/providers/user-team-role-provider";
import {
  ProjectDTO,
  ProjectEpicDTO,
  ProjectIterationDTO,
} from "@/types/projects";
import { Pagination, QueryDTO } from "@/types/query";
import { PermissionUtils } from "@/types/resources";
import { TicketDTO } from "@/types/tickets";
import { WorkflowDetailDTO, WorkflowStateDTO } from "@/types/workflows";

// Function to generate a constant background color for workflow states.
const getColumnColor = (_: number): string => "bg-[hsl(var(--card))]";

export default function ProjectView({
  projectShortName,
}: {
  projectShortName: string;
}) {
  const team = useTeam();
  const permissionLevel = usePagePermission();
  const teamRole = useUserTeamRole().role;
  const [projectId, setProjectId] = useState<number | null>(null);
  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowDetailDTO | null>(null);
  const [tasks, setTasks] = useState<TaskBoard>({});
  const [loading, setLoading] = useState(true);
  const { setError } = useError();

  // State for iterations and epics from API
  const [iterations, setIterations] = useState<ProjectIterationDTO[]>([]);
  const [epics, setEpics] = useState<ProjectEpicDTO[]>([]);
  const [loadingIterations, setLoadingIterations] = useState(false);
  const [loadingEpics, setLoadingEpics] = useState(false);

  // New state for header collapse
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  const t = useAppClientTranslations();

  // State for filters
  const [selectedIteration, setSelectedIteration] = useState<number | null>(
    null,
  );
  const [selectedEpic, setSelectedEpic] = useState<number | null>(null);

  // State for filtered tasks
  const [filteredTasks, setFilteredTasks] = useState<TaskBoard>({});

  // State for drag and click management.
  const [activeTask, setActiveTask] = useState<TicketDTO | null>(null);
  // State for tracking the selected task and its detail view.
  const [selectedTask, setSelectedTask] = useState<TicketDTO | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  // Track Add Task Sheet State.
  const [selectedWorkflowState, setSelectedWorkflowState] =
    useState<WorkflowStateDTO | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  // State for Project Edit Dialog visibility.
  const [isProjectEditDialogOpen, setIsProjectEditDialogOpen] = useState(false);
  // Track if dragging is in progress
  const [isDragging, setIsDragging] = useState(false);
  // Track the time when drag starts
  const [dragStartTime, setDragStartTime] = useState<number | null>(null);

  // Update state variables in the ProjectView component
  const [isIterationDialogOpen, setIsIterationDialogOpen] = useState(false);
  const [selectedIterationForEdit, setSelectedIterationForEdit] =
    useState<ProjectIterationDTO | null>(null);
  const [isEpicDialogOpen, setIsEpicDialogOpen] = useState(false);
  const [selectedEpicForEdit, setSelectedEpicForEdit] =
    useState<ProjectEpicDTO | null>(null);

  // Function to fetch iterations
  const fetchIterations = useCallback(async () => {
    if (!projectId) return;

    setLoadingIterations(true);
    try {
      const data = await findIterationsByProjectId(projectId, setError);
      setIterations(data || []);
    } finally {
      setLoadingIterations(false);
    }
  }, [projectId, setError]);

  // Function to fetch epics
  const fetchEpics = useCallback(async () => {
    if (!projectId) return;

    setLoadingEpics(true);
    try {
      const data = await findEpicsByProjectId(projectId, setError);
      setEpics(data || []);
    } finally {
      setLoadingEpics(false);
    }
  }, [projectId, setError]);

  // Extracted fetchProjectData to fetch project, workflow, and tasks
  const fetchProjectData = useCallback(async () => {
    setLoading(true);
    try {
      const projectData = await findByShortName(projectShortName, setError);
      setProject(projectData);
      setProjectId(projectData.id!);

      // Fetch Workflow.
      const workflowData = await findProjectWorkflowByTeam(team.id!, setError);
      setWorkflow(workflowData);

      if (workflowData && projectData.id) {
        let allTasks: TicketDTO[] = [];
        let currentPage = 1;
        const pageSize = 100;
        let totalElements = 0;

        do {
          const query: QueryDTO = {
            filters: [
              { field: "project.id", value: projectData.id, operator: "eq" }, // Use projectData.id instead of projectId
            ],
          };
          const pagination: Pagination = {
            page: currentPage,
            size: pageSize,
            sort: [{ field: "id", direction: "desc" }],
          };

          const tasksData = await searchTickets(query, pagination, setError);
          allTasks = [...allTasks, ...tasksData.content];
          totalElements = tasksData.totalElements;
          currentPage++;
        } while (allTasks.length < totalElements);

        // Allocate tasks to columns based on workflow states.
        const newTasks: TaskBoard = {};
        workflowData.states.forEach((state) => {
          newTasks[state.id!.toString()] = allTasks.filter(
            (task) => task.currentStateId === state.id,
          );
        });

        setTasks(newTasks);
        setFilteredTasks(newTasks); // Initialize filtered tasks with all tasks
      }
    } finally {
      setLoading(false);
    }
  }, [projectShortName, team.id, setError]);

  // Initial data fetch
  useEffect(() => {
    const fetchAllData = async () => {
      await fetchProjectData();
      await fetchIterations();
      await fetchEpics();
    };

    fetchAllData();
  }, [projectShortName, fetchProjectData, fetchIterations, fetchEpics]);

  // Filter tasks based on selected iteration and epic
  useEffect(() => {
    if (!Object.keys(tasks).length) return;

    const newFilteredTasks: TaskBoard = {};

    // Deep copy of tasks to avoid reference issues
    Object.keys(tasks).forEach((stateId) => {
      // Filter tasks based on selected iteration and epic
      const filteredTasksForState = tasks[stateId].filter((task) => {
        const matchesIteration =
          selectedIteration === null || task.iterationId === selectedIteration;

        const matchesEpic =
          selectedEpic === null || task.epicId === selectedEpic;

        return matchesIteration && matchesEpic;
      });

      newFilteredTasks[stateId] = filteredTasksForState;
    });

    setFilteredTasks(newFilteredTasks);
  }, [tasks, selectedIteration, selectedEpic]);

  // Reset filters
  const handleClearFilters = () => {
    setSelectedIteration(null);
    setSelectedEpic(null);
  };

  // Handler for adding a new iteration
  const handleAddNewIteration = () => {
    setSelectedIterationForEdit(null); // Ensure no iteration is selected for edit
    setIsIterationDialogOpen(true);
  };

  // Handler for saving a new iteration
  const handleSaveIteration = async (createdIteration: ProjectIterationDTO) => {
    // Refresh iterations list after creating a new one
    await fetchIterations();

    // Close the dialog and reset selected iteration
    setIsIterationDialogOpen(false);
    setSelectedIterationForEdit(null);
  };

  // Add new handler for editing an iteration
  const handleEditIteration = (iterationId: number) => {
    const iterationToEdit = iterations.find((i) => i.id === iterationId);
    if (iterationToEdit) {
      setSelectedIterationForEdit(iterationToEdit);
      setIsIterationDialogOpen(true);
    }
  };

  // Handler for adding a new epic
  const handleAddNewEpic = () => {
    setSelectedEpicForEdit(null); // Ensure no epic is selected for edit
    setIsEpicDialogOpen(true);
  };

  // handler for editing an epic
  const handleEditEpic = (epicId: number) => {
    const epicToEdit = epics.find((e) => e.id === epicId);
    if (epicToEdit) {
      setSelectedEpicForEdit(epicToEdit);
      setIsEpicDialogOpen(true);
    }
  };

  // handler for saving an epic (works for both create and edit)
  const handleSaveEpic = async (epic: ProjectEpicDTO) => {
    // Refresh epics list after creating/editing
    await fetchEpics();

    // Close the dialog and reset selected epic
    setIsEpicDialogOpen(false);
    setSelectedEpicForEdit(null);
  };

  // Handler for updating task details, including state changes
  const handleTaskUpdate = async (updatedTask: TicketDTO) => {
    if (!updatedTask.id) return;

    try {
      // Check if state has changed
      const oldTask = Object.values(tasks)
        .flat()
        .find((t) => t.id === updatedTask.id);

      const stateChanged =
        oldTask && oldTask.currentStateId !== updatedTask.currentStateId;

      // If state has changed, we need to move the task between columns
      if (stateChanged) {
        setTasks((prevTasks) => {
          const newTasks = { ...prevTasks };

          // Remove the task from its current column
          const oldStateId = oldTask?.currentStateId?.toString();
          if (oldStateId && newTasks[oldStateId]) {
            newTasks[oldStateId] = newTasks[oldStateId].filter(
              (task) => task.id !== updatedTask.id,
            );
          }

          // Add the task to its new column
          const newStateId = updatedTask.currentStateId?.toString();
          if (newStateId) {
            if (!newTasks[newStateId]) {
              newTasks[newStateId] = [];
            }
            newTasks[newStateId] = [...newTasks[newStateId], updatedTask];
          }

          return newTasks;
        });
      } else {
        // If state hasn't changed, update the task in its current column
        setTasks((prevTasks) => {
          const newTasks = { ...prevTasks };

          // Find which column contains the task
          Object.keys(newTasks).forEach((columnId) => {
            const columnTasks = newTasks[columnId];
            const taskIndex = columnTasks.findIndex(
              (task) => task.id === updatedTask.id,
            );

            if (taskIndex !== -1) {
              // Update the task in the column
              newTasks[columnId] = [
                ...columnTasks.slice(0, taskIndex),
                updatedTask,
                ...columnTasks.slice(taskIndex + 1),
              ];
            }
          });

          return newTasks;
        });
      }

      // Also update the selected task if it's the one being edited
      if (selectedTask?.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }

      // Add current date as modifiedDate
      const taskWithModifiedDate = {
        ...updatedTask,
        modifiedAt: new Date().toISOString(),
      };

      // Then call the API to update on the server
      await updateTicket(
        taskWithModifiedDate.id!,
        taskWithModifiedDate,
        setError,
      );
    } catch (error) {
      console.error("Failed to update task:", error);
      // If something goes wrong, re-fetch all data to sync with server
      fetchProjectData();
    }
  };

  // Improved dragStart
  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id.toString();

    // Set dragging state
    setIsDragging(true);
    // Record drag start time
    setDragStartTime(Date.now());

    // Find the task being dragged
    let foundTask: TicketDTO | null = null;
    Object.keys(filteredTasks).forEach((columnId) => {
      const task = filteredTasks[columnId].find(
        (task) => task.id?.toString() === activeId,
      );
      if (task) {
        foundTask = task;
      }
    });

    if (foundTask) {
      setActiveTask(foundTask);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    // Reset task state
    setActiveTask(null);

    // Calculate drag duration
    const dragDuration = dragStartTime ? Date.now() - dragStartTime : 0;

    // Reset drag tracking state
    setIsDragging(false);
    setDragStartTime(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Check if dragging over a column or a task inside a column.
    const targetColumn = workflow?.states.find(
      (state) =>
        state.id!.toString() === overId ||
        filteredTasks[state.id!.toString()]?.some(
          (task) => task.id!.toString() === overId,
        ),
    );

    if (!targetColumn) return;

    // Find source column.
    const sourceColumn = workflow?.states.find((state) =>
      filteredTasks[state.id!.toString()]?.some(
        (task) => task.id!.toString() === activeId,
      ),
    );

    if (!sourceColumn || sourceColumn.id === targetColumn.id) {
      // If drag was very short and in the same column, treat as a click
      if (dragDuration < 200 && sourceColumn) {
        // Find the task
        const clickedTask = filteredTasks[sourceColumn.id!.toString()]?.find(
          (task) => task.id!.toString() === activeId,
        );

        if (clickedTask) {
          // Handle as a click
          setSelectedTask(clickedTask);
          setIsTaskDetailOpen(true);
        }
      }
      return;
    }

    // Get moved task.
    const movedTask = filteredTasks[sourceColumn.id!.toString()]?.find(
      (task) => task.id!.toString() === activeId,
    );

    if (!movedTask) return;

    // Update task state on the server
    await updateTicketState(movedTask.id!, targetColumn.id!, setError);

    // Create updated task with new state information
    const updatedTask = {
      ...movedTask,
      currentStateId: targetColumn.id!,
      currentStateName: targetColumn.stateName,
      modifiedAt: new Date().toDateString(),
    };

    // Update both tasks and filteredTasks state
    setTasks((prevTasks) => {
      const updatedTasks = { ...prevTasks };

      // Remove task from source column
      updatedTasks[sourceColumn.id!.toString()] = updatedTasks[
        sourceColumn.id!.toString()
      ]?.filter((task) => task.id!.toString() !== activeId);

      // Add task to target column
      updatedTasks[targetColumn.id!.toString()] = [
        ...(updatedTasks[targetColumn.id!.toString()] || []),
        updatedTask,
      ];

      return updatedTasks;
    });

    // Also update filtered tasks directly for immediate UI feedback
    setFilteredTasks((prevTasks) => {
      const updatedTasks = { ...prevTasks };

      // Remove task from source column
      updatedTasks[sourceColumn.id!.toString()] = updatedTasks[
        sourceColumn.id!.toString()
      ]?.filter((task) => task.id!.toString() !== activeId);

      // Add task to target column
      updatedTasks[targetColumn.id!.toString()] = [
        ...(updatedTasks[targetColumn.id!.toString()] || []),
        updatedTask,
      ];

      return updatedTasks;
    });
  };

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("teams"), link: "/portal/teams" },
    { title: team.name, link: `/portal/teams/${obfuscate(team.id)}` },
    {
      title: t.common.navigation("projects"),
      link: `/portal/teams/${obfuscate(team.id)}/projects`,
    },
    { title: project?.name!, link: "#" },
  ];

  // Helper to get iteration status display
  const getIterationStatus = (iteration: ProjectIterationDTO) => {
    const now = new Date();
    const startDate = iteration.startDate
      ? new Date(iteration.startDate)
      : null;
    const endDate = iteration.endDate ? new Date(iteration.endDate) : null;

    if (!startDate || !endDate) {
      return "Not Scheduled";
    } else if (now < startDate) {
      return "Planned";
    } else if (now <= endDate) {
      return "In Progress";
    } else {
      return "Completed";
    }
  };

  // Helper to generate a color for an epic if none exists
  const getEpicColor = (epicId: number) => {
    // This ensures consistent colors for the same epic ID
    const colors = [
      "#8884d8",
      "#82ca9d",
      "#ffc658",
      "#ff8042",
      "#0088FE",
      "#00C49F",
      "#FFBB28",
      "#FF8042",
      "#a4de6c",
      "#d0ed57",
    ];
    return colors[epicId % colors.length];
  };

  return (
    <div className="p-6">
      {loading ? (
        <p className="text-lg font-semibold">{t.common.misc("loading_data")}</p>
      ) : project ? (
        <>
          {/* Project Header - Collapsible but keeping original styling */}
          <div className={`mb-4 transition-all duration-300`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <h1 className="text-3xl font-bold">{project.name}</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                  className="ml-2 h-8 w-8 p-0"
                >
                  {isHeaderCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {(PermissionUtils.canWrite(permissionLevel) ||
                teamRole === "manager") && (
                <Button
                  onClick={() => setIsProjectEditDialogOpen(true)}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  {t.teams.projects.view("edit_project")}
                </Button>
              )}
            </div>

            <Breadcrumbs items={breadcrumbItems} />

            {/* Collapsible content */}
            {!isHeaderCollapsed && (
              <div className="mt-4">
                <div
                  className="text-gray-600 dark:text-gray-300 text-sm mb-4"
                  dangerouslySetInnerHTML={{
                    __html: project.description ?? "",
                  }}
                />

                <div className="flex flex-wrap items-center gap-4 mb-6">
                  {project.status && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">
                        {t.teams.projects.form("status")}:
                      </span>
                      <Badge variant="default">{project.status}</Badge>
                    </div>
                  )}

                  {project.startDate && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">
                        {t.teams.projects.form("start_date")}:
                      </span>
                      <span className="text-sm">
                        {new Date(project.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {project.endDate && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">
                        {t.teams.projects.form("end_date")}:
                      </span>
                      <span className="text-sm">
                        {new Date(project.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {project.startDate && project.endDate && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">
                        {t.teams.projects.view("duration")}:
                      </span>
                      <span className="text-sm">
                        {calculateDuration(project.startDate, project.endDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Keep the original filter section, just adding a bit more space efficiency */}
          <div className="mb-4">
            {/* Epic and Iteration Filters - Original design */}
            <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-muted rounded-md">
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">
                  {t.teams.projects.view("iteration")}:
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      {selectedIteration
                        ? iterations.find((i) => i.id === selectedIteration)
                            ?.name
                        : t.teams.projects.view("all_iterations")}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => setSelectedIteration(null)}
                      className="cursor-pointer"
                    >
                      {t.teams.projects.view("all_iterations")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {loadingIterations ? (
                      <DropdownMenuItem disabled>
                        {t.common.misc("loading_data")}
                      </DropdownMenuItem>
                    ) : iterations.length > 0 ? (
                      iterations.map((iteration) => (
                        <DropdownMenuItem
                          key={iteration.id}
                          onClick={() => setSelectedIteration(iteration.id!)}
                          className="cursor-pointer"
                        >
                          <div>
                            <div>{iteration.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {getIterationStatus(iteration)} |{" "}
                              {iteration.startDate
                                ? new Date(
                                    iteration.startDate,
                                  ).toLocaleDateString()
                                : "Not scheduled"}{" "}
                              {iteration.startDate || iteration.endDate
                                ? "- "
                                : ""}
                              {iteration.endDate
                                ? new Date(
                                    iteration.endDate,
                                  ).toLocaleDateString()
                                : iteration.startDate
                                  ? "Ongoing"
                                  : ""}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>
                        {t.teams.projects.view("no_iterations_found")}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleAddNewIteration}
                      className="cursor-pointer text-primary"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t.teams.projects.view("add_new_iteration")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">
                  {t.teams.projects.view("epic")}:
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      {selectedEpic
                        ? epics.find((e) => e.id === selectedEpic)?.name
                        : t.teams.projects.view("all_epics")}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => setSelectedEpic(null)}
                      className="cursor-pointer"
                    >
                      {t.teams.projects.view("all_epics")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {loadingEpics ? (
                      <DropdownMenuItem disabled>
                        {t.common.misc("loading_data")}
                      </DropdownMenuItem>
                    ) : epics.length > 0 ? (
                      epics.map((epic) => (
                        <DropdownMenuItem
                          key={epic.id}
                          onClick={() => setSelectedEpic(epic.id!)}
                          className="cursor-pointer"
                          style={{
                            borderLeft: `4px solid ${getEpicColor(epic.id!)}`,
                          }}
                        >
                          <div>
                            <div>{epic.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {epic.description}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>
                        {t.teams.projects.view("no_epics_found")}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleAddNewEpic}
                      className="cursor-pointer text-primary"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t.teams.projects.view("add_new_epic")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {(selectedIteration !== null || selectedEpic !== null) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="ml-auto"
                >
                  {t.common.buttons("clear_filters")}
                </Button>
              )}
            </div>

            {/* Selected Filters Summary with Edit Options */}
            {(selectedIteration !== null || selectedEpic !== null) && (
              <div className="mb-4 p-3 border rounded-md bg-background">
                <h3 className="text-sm font-medium mb-2">Active Filters:</h3>
                <div className="space-y-3">
                  {selectedIteration !== null && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 bg-secondary/20 rounded-md">
                      <div className="flex-1">
                        <div className="font-medium">
                          {t.teams.projects.view("iteration")}:{" "}
                          {
                            iterations.find((i) => i.id === selectedIteration)
                              ?.name
                          }
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(
                            iterations.find((i) => i.id === selectedIteration)
                              ?.startDate || "",
                          ).toLocaleDateString()}{" "}
                          -
                          {new Date(
                            iterations.find((i) => i.id === selectedIteration)
                              ?.endDate || "",
                          ).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 gap-1 self-start"
                        onClick={() => handleEditIteration(selectedIteration)}
                      >
                        <Edit className="h-4 w-4" />
                        {t.teams.projects.view("edit_iteration")}
                      </Button>
                    </div>
                  )}

                  {selectedEpic !== null && (
                    <div
                      className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-md"
                      style={{
                        backgroundColor: `${getEpicColor(selectedEpic)}20`,
                      }}
                    >
                      <div className="flex-1">
                        <div
                          className="font-medium"
                          style={{
                            color: getEpicColor(selectedEpic),
                          }}
                        >
                          {t.teams.projects.view("epic")}:{" "}
                          {epics.find((e) => e.id === selectedEpic)?.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {
                            epics.find((e) => e.id === selectedEpic)
                              ?.description
                          }
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 self-start"
                        style={{
                          borderColor: getEpicColor(selectedEpic),
                          color: getEpicColor(selectedEpic),
                        }}
                        onClick={() => handleEditEpic(selectedEpic)}
                      >
                        <Edit className="h-4 w-4" />
                        {t.teams.projects.view("edit_epic")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Kanban Board with fixed height */}
          <DndContext
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Set a fixed height for the Kanban board container */}
            <div
              className="flex gap-4 pb-2"
              style={{
                height:
                  "calc(100vh - 300px)" /* Fixed height calculation - adjust as needed */,
                minHeight: "400px" /* Minimum height for smaller screens */,
                overflowX: "auto",
                overflowY: "hidden",
                scrollbarWidth: "thin",
                WebkitOverflowScrolling: "touch",
                msOverflowStyle: "-ms-autohiding-scrollbar",
              }}
            >
              {workflow?.states
                .sort((a, b) => {
                  if (a.isInitial && !b.isInitial) return -1;
                  if (!a.isInitial && b.isInitial) return 1;
                  if (a.isFinal && !b.isFinal) return 1;
                  if (!a.isFinal && b.isFinal) return -1;
                  return 0;
                })
                .map((state) => (
                  <StateColumn
                    key={state.id}
                    workflowState={state}
                    tasks={filteredTasks[state.id!.toString()] || []}
                    setIsSheetOpen={setIsSheetOpen}
                    setSelectedWorkflowState={() =>
                      setSelectedWorkflowState(state)
                    }
                    columnColor={getColumnColor(state.id!)}
                  />
                ))}
              {/* Add an extra padding div that matches column width */}
              <div className="min-w-[28rem] flex-shrink-0 opacity-0 pointer-events-none">
                {/* This invisible column ensures there's enough space at the end */}
              </div>
            </div>

            <DragOverlay>
              {activeTask ? <TaskBlock task={activeTask} isDragging /> : null}
            </DragOverlay>
          </DndContext>
        </>
      ) : (
        <p className="text-red-500">
          {t.teams.projects.view("project_not_found")}.
        </p>
      )}

      {/* Dialogs and sheets */}
      <TaskEditorSheet
        isOpen={isSheetOpen}
        setIsOpen={setIsSheetOpen}
        selectedWorkflowState={selectedWorkflowState}
        setTasks={setTasks}
        teamId={project?.teamId!}
        projectId={projectId!}
        projectWorkflowId={workflow?.id!}
        onTaskCreated={fetchProjectData} // Pass the fetchProjectData function as a callback
      />
      <TaskDetailSheet
        isOpen={isTaskDetailOpen}
        setIsOpen={setIsTaskDetailOpen}
        task={selectedTask}
        onTaskUpdate={handleTaskUpdate}
      />

      <ProjectEditDialog
        open={isProjectEditDialogOpen}
        setOpen={setIsProjectEditDialogOpen}
        teamEntity={team}
        project={project}
        onSaveSuccess={async () => {
          setIsProjectEditDialogOpen(false);
          await fetchProjectData();
        }}
      />

      {/* Iteration Dialog (Create/Edit) */}
      <ProjectIterationDialog
        open={isIterationDialogOpen}
        onOpenChange={setIsIterationDialogOpen}
        onSave={handleSaveIteration}
        onCancel={() => {
          setIsIterationDialogOpen(false);
          setSelectedIterationForEdit(null);
        }}
        projectId={projectId!}
        iteration={selectedIterationForEdit}
      />

      {/* Epic Dialog (Create/Edit) */}
      <ProjectEpicDialog
        open={isEpicDialogOpen}
        onOpenChange={setIsEpicDialogOpen}
        onSave={handleSaveEpic}
        onCancel={() => {
          setIsEpicDialogOpen(false);
          setSelectedEpicForEdit(null);
        }}
        projectId={projectId!}
        epic={selectedEpicForEdit}
      />
    </div>
  );
}
