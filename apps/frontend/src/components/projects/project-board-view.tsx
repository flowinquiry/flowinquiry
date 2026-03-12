"use client";

import { DragEndEvent } from "@dnd-kit/core";
import {
  ChevronDown,
  Edit,
  KanbanSquare,
  Layers,
  Plus,
  Timer,
  Users,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

import { ProjectEpicDialog } from "@/components/projects/project-epic-dialog";
import ProjectEpicView from "@/components/projects/project-epic-view";
import ProjectIterationDialog from "@/components/projects/project-iteration-dialog";
import ProjectIterationView from "@/components/projects/project-iteration-view";
import ProjectKanbanView from "@/components/projects/project-kanban-view";
import TaskDetailSheet from "@/components/projects/task-detail-sheet";
import TaskEditorSheet, {
  TaskBoard,
} from "@/components/projects/task-editor-sheet";
import { UserAvatar } from "@/components/shared/avatar-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { findEpicsByProjectId } from "@/lib/actions/project-epic.action";
import {
  findActiveIterationsByProjectId,
  findIterationsByProjectId,
} from "@/lib/actions/project-iteration.action";
import { findMembersByTeamId } from "@/lib/actions/teams.action";
import {
  searchTickets,
  updateTicket,
  updateTicketState,
} from "@/lib/actions/tickets.action";
import { useError } from "@/providers/error-provider";
import {
  ProjectDTO,
  ProjectEpicDTO,
  ProjectIterationDTO,
} from "@/types/projects";
import { Pagination, QueryDTO } from "@/types/query";
import { UserWithTeamRoleDTO } from "@/types/teams";
import { TicketDTO } from "@/types/tickets";
import { WorkflowDetailDTO, WorkflowStateDTO } from "@/types/workflows";

/* ── helpers ── */
const getIterationStatus = (iteration: ProjectIterationDTO) => {
  const now = new Date();
  const start = iteration.startDate ? new Date(iteration.startDate) : null;
  const end = iteration.endDate ? new Date(iteration.endDate) : null;
  if (!start || !end) return "Not Scheduled";
  if (now < start) return "Planned";
  if (now <= end) return "In Progress";
  return "Completed";
};

const getIterationStatusVariant = (
  status: string,
): "default" | "secondary" | "outline" => {
  if (status === "In Progress") return "default";
  if (status === "Planned") return "secondary";
  return "outline";
};

const EPIC_COLORS = [
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
const getEpicColor = (id: number) => EPIC_COLORS[id % EPIC_COLORS.length];

export type BoardViewHandle = {
  openAddTask: () => void;
};

type Props = {
  project: ProjectDTO;
  workflow: WorkflowDetailDTO;
  boardRef: React.RefObject<HTMLDivElement | null>;
  boardHeight: number;
};

const ProjectBoardView = forwardRef<BoardViewHandle, Props>(
  function ProjectBoardView({ project, workflow, boardRef, boardHeight }, ref) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const { setError } = useError();
    const t = useAppClientTranslations();
    const projectId = project.id!;
    const teamId = project.teamId!;

    /* ── Sub-view — persisted in ?view= ── */
    const VALID_VIEWS = ["kanban", "epic", "iteration"] as const;
    type SubView = (typeof VALID_VIEWS)[number];
    const rawView = searchParams.get("view") ?? "kanban";
    const subView: SubView = VALID_VIEWS.includes(rawView as SubView)
      ? (rawView as SubView)
      : "kanban";

    const setSubView = (v: SubView) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", v);
      router.replace(`${pathname}?${params.toString()}`);
    };

    /* ── Tasks ── */
    const [tasks, setTasks] = useState<TaskBoard>({});
    const [filteredTasks, setFilteredTasks] = useState<TaskBoard>({});

    /* ── Iterations, Epics, Members ── */
    const [iterations, setIterations] = useState<ProjectIterationDTO[]>([]);
    const [epics, setEpics] = useState<ProjectEpicDTO[]>([]);
    const [members, setMembers] = useState<UserWithTeamRoleDTO[]>([]);
    const [loadingIterations, setLoadingIterations] = useState(false);
    const [loadingEpics, setLoadingEpics] = useState(false);
    const [showClosedIterations, setShowClosedIterations] = useState(false);

    /* ── Filters ── */
    const [selectedIteration, setSelectedIteration] = useState<number | null>(
      null,
    );
    const [selectedEpic, setSelectedEpic] = useState<number | null>(null);
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(
      new Set(),
    );
    const [includeUnassigned, setIncludeUnassigned] = useState(false);

    /* ── Task detail sheet ── */
    const [selectedTask, setSelectedTask] = useState<TicketDTO | null>(null);
    const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

    /* ── Add-task sheet ── */
    const [selectedWorkflowState, setSelectedWorkflowState] =
      useState<WorkflowStateDTO | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    /* ── Expose openAddTask to parent via ref ── */
    useImperativeHandle(ref, () => ({
      openAddTask: () => {
        const initialState =
          workflow.states.find((s) => s.isInitial) ??
          workflow.states[0] ??
          null;
        setSelectedWorkflowState(initialState);
        setIsSheetOpen(true);
      },
    }));

    /* ── Iteration dialog ── */
    const [isIterationDialogOpen, setIsIterationDialogOpen] = useState(false);
    const [selectedIterationForEdit, setSelectedIterationForEdit] =
      useState<ProjectIterationDTO | null>(null);

    /* ── Epic dialog ── */
    const [isEpicDialogOpen, setIsEpicDialogOpen] = useState(false);
    const [selectedEpicForEdit, setSelectedEpicForEdit] =
      useState<ProjectEpicDTO | null>(null);

    /* ── Data fetching ── */
    const fetchTasks = useCallback(async () => {
      let allTasks: TicketDTO[] = [];
      let page = 1;
      let total = 0;
      do {
        const query: QueryDTO = {
          filters: [{ field: "project.id", value: projectId, operator: "eq" }],
        };
        const pagination: Pagination = {
          page,
          size: 100,
          sort: [{ field: "id", direction: "desc" }],
        };
        const data = await searchTickets(query, pagination, setError);
        allTasks = [...allTasks, ...data.content];
        total = data.totalElements;
        page++;
      } while (allTasks.length < total);

      const board: TaskBoard = {};
      workflow.states.forEach((s) => {
        board[s.id!.toString()] = allTasks.filter(
          (t) => t.currentStateId === s.id,
        );
      });
      setTasks(board);
      setFilteredTasks(board);
    }, [projectId, workflow.states, setError]);

    const fetchIterations = useCallback(async () => {
      setLoadingIterations(true);
      try {
        const data = showClosedIterations
          ? await findIterationsByProjectId(projectId, setError)
          : await findActiveIterationsByProjectId(projectId, setError);
        // Client-side safety: also filter out CLOSED if not showing them
        const filtered = showClosedIterations
          ? data || []
          : (data || []).filter((i) => i.status !== "CLOSED");
        setIterations(filtered);
      } finally {
        setLoadingIterations(false);
      }
    }, [projectId, setError, showClosedIterations]);

    const fetchEpics = useCallback(async () => {
      setLoadingEpics(true);
      try {
        const data = await findEpicsByProjectId(projectId, setError);
        setEpics(data || []);
      } finally {
        setLoadingEpics(false);
      }
    }, [projectId, setError]);

    const fetchMembers = useCallback(async () => {
      const data = await findMembersByTeamId(teamId, setError);
      setMembers(data || []);
    }, [teamId, setError]);

    useEffect(() => {
      fetchTasks();
      fetchIterations();
      fetchEpics();
      fetchMembers();
    }, [fetchTasks, fetchIterations, fetchEpics, fetchMembers]);

    /* ── Filter effect ── */
    useEffect(() => {
      if (!Object.keys(tasks).length) return;
      const hasMemberFilter = selectedMemberIds.size > 0 || includeUnassigned;
      const board: TaskBoard = {};
      Object.keys(tasks).forEach((stateId) => {
        board[stateId] = tasks[stateId].filter((task) => {
          const okIteration =
            selectedIteration === null ||
            task.iterationId === selectedIteration;
          const okEpic = selectedEpic === null || task.epicId === selectedEpic;
          const okMember =
            !hasMemberFilter ||
            (includeUnassigned && !task.assignUserId) ||
            (!!task.assignUserId && selectedMemberIds.has(task.assignUserId));
          return okIteration && okEpic && okMember;
        });
      });
      setFilteredTasks(board);
    }, [
      tasks,
      selectedIteration,
      selectedEpic,
      selectedMemberIds,
      includeUnassigned,
    ]);

    /* ── Task update ── */
    const handleTaskUpdate = async (updated: TicketDTO) => {
      if (!updated.id) return;
      try {
        const old = Object.values(tasks)
          .flat()
          .find((t) => t.id === updated.id);
        const stateChanged =
          old && old.currentStateId !== updated.currentStateId;
        setTasks((prev) => {
          const next = { ...prev };
          if (stateChanged) {
            const oldKey = old?.currentStateId?.toString();
            if (oldKey)
              next[oldKey] = next[oldKey].filter((t) => t.id !== updated.id);
            const newKey = updated.currentStateId?.toString();
            if (newKey) next[newKey] = [...(next[newKey] || []), updated];
          } else {
            Object.keys(next).forEach((col) => {
              const idx = next[col].findIndex((t) => t.id === updated.id);
              if (idx !== -1) {
                next[col] = [
                  ...next[col].slice(0, idx),
                  updated,
                  ...next[col].slice(idx + 1),
                ];
              }
            });
          }
          return next;
        });
        if (selectedTask?.id === updated.id) setSelectedTask(updated);
        await updateTicket(
          updated.id!,
          { ...updated, modifiedAt: new Date().toISOString() },
          setError,
        );
      } catch {
        fetchTasks();
      }
    };

    /* ── DnD drag-end (from kanban) ── */
    const handleDragEnd = async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;
      const activeId = active.id.toString();
      const overId = over.id.toString();

      const targetState = workflow.states.find(
        (s) =>
          s.id!.toString() === overId ||
          filteredTasks[s.id!.toString()]?.some(
            (t) => t.id!.toString() === overId,
          ),
      );
      if (!targetState) return;

      const sourceState = workflow.states.find((s) =>
        filteredTasks[s.id!.toString()]?.some(
          (t) => t.id!.toString() === activeId,
        ),
      );
      if (!sourceState || sourceState.id === targetState.id) return;

      const movedTask = filteredTasks[sourceState.id!.toString()]?.find(
        (t) => t.id!.toString() === activeId,
      );
      if (!movedTask) return;

      await updateTicketState(movedTask.id!, targetState.id!, setError);
      const updatedTask = {
        ...movedTask,
        currentStateId: targetState.id!,
        currentStateName: targetState.stateName,
      };
      const apply = (prev: TaskBoard): TaskBoard => {
        const next = { ...prev };
        next[sourceState.id!.toString()] = next[
          sourceState.id!.toString()
        ].filter((t) => t.id!.toString() !== activeId);
        next[targetState.id!.toString()] = [
          ...(next[targetState.id!.toString()] || []),
          updatedTask,
        ];
        return next;
      };
      setTasks(apply);
      setFilteredTasks(apply);
    };

    /* ── Iteration handlers ── */
    const handleSaveIteration = async () => {
      await fetchIterations();
      setIsIterationDialogOpen(false);
      setSelectedIterationForEdit(null);
    };

    /* ── Epic handlers ── */
    const handleSaveEpic = async () => {
      await fetchEpics();
      setIsEpicDialogOpen(false);
      setSelectedEpicForEdit(null);
    };

    /* ── Toggle member ── */
    const toggleMember = (id: number) => {
      setSelectedMemberIds((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    };

    const clearAllFilters = () => {
      setSelectedIteration(null);
      setSelectedEpic(null);
      setSelectedMemberIds(new Set());
      setIncludeUnassigned(false);
    };

    const activeIterationName = selectedIteration
      ? iterations.find((i) => i.id === selectedIteration)?.name
      : null;
    const activeEpicName = selectedEpic
      ? epics.find((e) => e.id === selectedEpic)?.name
      : null;
    const hasActiveFilters =
      selectedIteration !== null ||
      selectedEpic !== null ||
      selectedMemberIds.size > 0 ||
      includeUnassigned;

    const SUB_VIEWS: { key: SubView; label: string; icon: React.ReactNode }[] =
      [
        {
          key: "kanban",
          label: t.teams.projects.view("view_kanban"),
          icon: <KanbanSquare className="h-4 w-4" />,
        },
        {
          key: "epic",
          label: t.teams.projects.view("view_epic"),
          icon: <Layers className="h-4 w-4" />,
        },
        {
          key: "iteration",
          label: t.teams.projects.view("view_iteration"),
          icon: <Timer className="h-4 w-4" />,
        },
      ];
    const activeSubView = SUB_VIEWS.find((v) => v.key === subView)!;

    return (
      <>
        {/* ── Toolbar: view switcher + filters ── */}
        <div
          className="flex flex-wrap items-center gap-2 mb-3 px-3 py-2 rounded-lg border bg-muted/40"
          data-testid="project-board-toolbar"
        >
          {/* ── View switcher dropdown ── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="h-7 text-xs gap-1.5 font-semibold"
                testId="project-board-view-switcher"
              >
                {activeSubView.icon}
                {activeSubView.label}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {SUB_VIEWS.map((v) => (
                <DropdownMenuItem
                  key={v.key}
                  onClick={() => setSubView(v.key)}
                  className={`cursor-pointer gap-2 text-sm ${subView === v.key ? "font-medium text-primary" : ""}`}
                >
                  {v.icon}
                  {v.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-5" />

          {/* ── Iteration filter ── */}
          <div className="flex items-center gap-1.5">
            <Timer className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium text-muted-foreground">
              {t.teams.projects.view("iteration")}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                >
                  {activeIterationName ??
                    t.teams.projects.view("all_iterations")}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem
                  onClick={() => setSelectedIteration(null)}
                  className={`cursor-pointer text-sm ${selectedIteration === null ? "font-medium text-primary" : ""}`}
                >
                  {t.teams.projects.view("all_iterations")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {loadingIterations ? (
                  <DropdownMenuItem disabled>
                    {t.common.misc("loading_data")}
                  </DropdownMenuItem>
                ) : iterations.length > 0 ? (
                  iterations.map((it) => {
                    const status = getIterationStatus(it);
                    return (
                      <DropdownMenuItem
                        key={it.id}
                        onClick={() => setSelectedIteration(it.id!)}
                        className={`cursor-pointer ${selectedIteration === it.id ? "font-medium text-primary" : ""}`}
                      >
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm truncate">{it.name}</span>
                            <Badge
                              variant={getIterationStatusVariant(status)}
                              className="text-[10px] h-4 px-1 shrink-0"
                            >
                              {status}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {it.startDate
                              ? new Date(it.startDate).toLocaleDateString()
                              : "Not scheduled"}
                            {it.startDate || it.endDate ? " – " : ""}
                            {it.endDate
                              ? new Date(it.endDate).toLocaleDateString()
                              : it.startDate
                                ? "Ongoing"
                                : ""}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    );
                  })
                ) : (
                  <DropdownMenuItem disabled>
                    {t.teams.projects.view("no_iterations_found")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedIterationForEdit(null);
                    setIsIterationDialogOpen(true);
                  }}
                  className="cursor-pointer text-primary text-sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t.teams.projects.view("add_new_iteration")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator orientation="vertical" className="h-5" />

          {/* ── Epic filter ── */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {t.teams.projects.view("epic")}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                >
                  {selectedEpic && (
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: getEpicColor(selectedEpic) }}
                    />
                  )}
                  {activeEpicName ?? t.teams.projects.view("all_epics")}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem
                  onClick={() => setSelectedEpic(null)}
                  className={`cursor-pointer text-sm ${selectedEpic === null ? "font-medium text-primary" : ""}`}
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
                      className={`cursor-pointer ${selectedEpic === epic.id ? "font-medium" : ""}`}
                    >
                      <div
                        className="mr-2 h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: getEpicColor(epic.id!) }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm truncate">{epic.name}</span>
                        {epic.description && (
                          <span className="text-xs text-muted-foreground truncate">
                            {epic.description}
                          </span>
                        )}
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
                  onClick={() => {
                    setSelectedEpicForEdit(null);
                    setIsEpicDialogOpen(true);
                  }}
                  className="cursor-pointer text-primary text-sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t.teams.projects.view("add_new_epic")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator orientation="vertical" className="h-5" />

          {/* ── Member filter ── */}
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium text-muted-foreground">
              {t.teams.projects.view("assignee")}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                >
                  {selectedMemberIds.size > 0 || includeUnassigned ? (
                    <span className="flex items-center gap-1">
                      {includeUnassigned && (
                        <span className="h-4 w-4 rounded-full bg-muted-foreground/30 inline-flex items-center justify-center text-[9px]">
                          ?
                        </span>
                      )}
                      {Array.from(selectedMemberIds)
                        .slice(0, 3)
                        .map((id) => {
                          const m = members.find((m) => m.id === id);
                          return m ? (
                            <UserAvatar
                              key={id}
                              imageUrl={m.imageUrl}
                              size="w-4 h-4"
                            />
                          ) : null;
                        })}
                      {selectedMemberIds.size + (includeUnassigned ? 1 : 0) >
                        3 && (
                        <span>
                          +
                          {selectedMemberIds.size +
                            (includeUnassigned ? 1 : 0) -
                            3}
                        </span>
                      )}
                    </span>
                  ) : (
                    t.teams.projects.view("all_members")
                  )}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-60"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <div
                  className="flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-sm hover:bg-accent text-sm"
                  onClick={() => setIncludeUnassigned((v) => !v)}
                >
                  <Checkbox
                    checked={includeUnassigned}
                    onCheckedChange={(v) => setIncludeUnassigned(!!v)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground shrink-0">
                    ?
                  </span>
                  <span>{t.teams.projects.view("unassigned")}</span>
                </div>
                <DropdownMenuSeparator />
                {members.length > 0 ? (
                  members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-sm hover:bg-accent text-sm"
                      onClick={() => toggleMember(member.id!)}
                    >
                      <Checkbox
                        checked={selectedMemberIds.has(member.id!)}
                        onCheckedChange={() => toggleMember(member.id!)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <UserAvatar imageUrl={member.imageUrl} size="w-5 h-5" />
                      <span className="truncate">
                        {member.firstName} {member.lastName}
                      </span>
                    </div>
                  ))
                ) : (
                  <DropdownMenuItem disabled>
                    {t.common.misc("loading_data")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ── Active filter chips ── */}
          {hasActiveFilters && (
            <>
              <Separator orientation="vertical" className="h-5" />
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedIteration !== null && (
                  <Badge
                    variant="secondary"
                    className="gap-1 pr-1 text-xs cursor-pointer"
                    onClick={() => setSelectedIteration(null)}
                  >
                    <Timer className="h-3 w-3" />
                    {activeIterationName}
                    <X className="h-3 w-3 ml-0.5 opacity-60" />
                  </Badge>
                )}
                {selectedEpic !== null && (
                  <Badge
                    variant="secondary"
                    className="gap-1 pr-1 text-xs cursor-pointer"
                    onClick={() => setSelectedEpic(null)}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: getEpicColor(selectedEpic) }}
                    />
                    {activeEpicName}
                    <X className="h-3 w-3 ml-0.5 opacity-60" />
                  </Badge>
                )}
                {includeUnassigned && (
                  <Badge
                    variant="secondary"
                    className="gap-1 pr-1 text-xs cursor-pointer"
                    onClick={() => setIncludeUnassigned(false)}
                  >
                    <Users className="h-3 w-3" />
                    {t.teams.projects.view("unassigned")}
                    <X className="h-3 w-3 ml-0.5 opacity-60" />
                  </Badge>
                )}
                {Array.from(selectedMemberIds).map((id) => {
                  const m = members.find((m) => m.id === id);
                  if (!m) return null;
                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="gap-1 pr-1 text-xs cursor-pointer"
                      onClick={() => toggleMember(id)}
                    >
                      <UserAvatar imageUrl={m.imageUrl} size="w-3 h-3" />
                      {m.firstName} {m.lastName}
                      <X className="h-3 w-3 ml-0.5 opacity-60" />
                    </Badge>
                  );
                })}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-6 px-2 text-xs text-muted-foreground"
                >
                  {t.common.buttons("clear_filters")}
                </Button>
              </div>
            </>
          )}

          {/* ── Edit shortcuts ── */}
          {selectedIteration !== null && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 ml-auto gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                const found = iterations.find(
                  (i) => i.id === selectedIteration,
                );
                if (found) {
                  setSelectedIterationForEdit(found);
                  setIsIterationDialogOpen(true);
                }
              }}
            >
              <Edit className="h-3.5 w-3.5" />
              {t.teams.projects.view("edit_iteration")}
            </Button>
          )}
          {selectedEpic !== null && !selectedIteration && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 ml-auto gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                const found = epics.find((e) => e.id === selectedEpic);
                if (found) {
                  setSelectedEpicForEdit(found);
                  setIsEpicDialogOpen(true);
                }
              }}
            >
              <Edit className="h-3.5 w-3.5" />
              {t.teams.projects.view("edit_epic")}
            </Button>
          )}
        </div>

        {/* ── Active sub-view ── */}
        {subView === "kanban" && (
          <ProjectKanbanView
            workflow={workflow}
            filteredTasks={filteredTasks}
            boardRef={boardRef}
            boardHeight={boardHeight}
            onTaskClick={(task) => {
              setSelectedTask(task);
              setIsTaskDetailOpen(true);
            }}
            onDragEnd={handleDragEnd}
            onAddTask={(stateId) => {
              const state = workflow.states.find((s) => s.id === stateId);
              if (state) {
                setSelectedWorkflowState(state);
                setIsSheetOpen(true);
              }
            }}
          />
        )}
        {subView === "epic" && (
          <ProjectEpicView
            workflow={workflow}
            filteredTasks={filteredTasks}
            epics={epics}
            onTaskClick={(task) => {
              setSelectedTask(task);
              setIsTaskDetailOpen(true);
            }}
          />
        )}
        {subView === "iteration" && (
          <ProjectIterationView
            workflow={workflow}
            filteredTasks={filteredTasks}
            iterations={iterations}
            showClosedIterations={showClosedIterations}
            onToggleClosedIterations={() => setShowClosedIterations((v) => !v)}
            onTaskClick={(task) => {
              setSelectedTask(task);
              setIsTaskDetailOpen(true);
            }}
          />
        )}

        {/* ── Sheets & Dialogs ── */}
        <TaskEditorSheet
          isOpen={isSheetOpen}
          setIsOpen={setIsSheetOpen}
          selectedWorkflowState={selectedWorkflowState}
          setTasks={setTasks}
          teamId={teamId}
          projectId={projectId}
          projectWorkflowId={workflow.id!}
          onTaskCreated={fetchTasks}
        />
        <TaskDetailSheet
          isOpen={isTaskDetailOpen}
          setIsOpen={setIsTaskDetailOpen}
          task={selectedTask}
          onTaskUpdate={handleTaskUpdate}
        />
        <ProjectIterationDialog
          open={isIterationDialogOpen}
          onOpenChange={setIsIterationDialogOpen}
          onSave={handleSaveIteration}
          onCancel={() => {
            setIsIterationDialogOpen(false);
            setSelectedIterationForEdit(null);
          }}
          project={project}
          iteration={selectedIterationForEdit}
        />
        <ProjectEpicDialog
          open={isEpicDialogOpen}
          onOpenChange={setIsEpicDialogOpen}
          onSave={handleSaveEpic}
          onCancel={() => {
            setIsEpicDialogOpen(false);
            setSelectedEpicForEdit(null);
          }}
          projectId={projectId}
          epic={selectedEpicForEdit}
        />
      </>
    );
  },
);

export default ProjectBoardView;
