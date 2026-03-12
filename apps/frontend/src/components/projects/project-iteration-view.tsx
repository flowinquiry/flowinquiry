"use client";

import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Timer,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import TaskBlock from "@/components/projects/task-block";
import { TaskBoard } from "@/components/projects/task-editor-sheet";
import { Badge } from "@/components/ui/badge";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { cn } from "@/lib/utils";
import { ProjectIterationDTO } from "@/types/projects";
import { TicketDTO } from "@/types/tickets";
import { WorkflowDetailDTO } from "@/types/workflows";

const ITERATION_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#14b8a6",
  "#0ea5e9",
  "#84cc16",
  "#eab308",
  "#f43f5e",
  "#06b6d4",
];
const getIterationColor = (id: number) =>
  ITERATION_COLORS[id % ITERATION_COLORS.length];

const NO_ITERATION_ID = -1;

const sortedStates = (workflow: WorkflowDetailDTO) =>
  [...workflow.states].sort((a, b) => {
    if (a.isInitial && !b.isInitial) return -1;
    if (!a.isInitial && b.isInitial) return 1;
    if (a.isFinal && !b.isFinal) return 1;
    if (!a.isFinal && b.isFinal) return -1;
    return 0;
  });

const getIterationStatusLabel = (
  status: string,
  t: ReturnType<typeof useAppClientTranslations>,
): string => {
  const map: Record<string, string> = {
    in_progress: t.teams.projects.view("iteration_status_in_progress"),
    planned: t.teams.projects.view("iteration_status_planned"),
    completed: t.teams.projects.view("iteration_status_completed"),
    not_scheduled: t.teams.projects.view("iteration_status_not_scheduled"),
    closed: t.teams.projects.view("iteration_status_closed"),
  };
  return map[status] ?? status;
};

const getIterationStatus = (iteration: ProjectIterationDTO) => {
  // Backend-driven closed status takes priority
  if (iteration.status === "CLOSED") return "closed";
  const now = new Date();
  const start = iteration.startDate ? new Date(iteration.startDate) : null;
  const end = iteration.endDate ? new Date(iteration.endDate) : null;
  if (!start || !end) return "not_scheduled";
  if (now < start) return "planned";
  if (now <= end) return "in_progress";
  return "completed";
};

/* ── Left panel: single iteration list item ── */
function IterationListItem({
  iteration,
  tasks,
  workflow,
  selected,
  onSelect,
}: {
  iteration: ProjectIterationDTO | null;
  tasks: TicketDTO[];
  workflow: WorkflowDetailDTO;
  selected: boolean;
  onSelect: () => void;
}) {
  const t = useAppClientTranslations();
  const total = tasks.length;
  const done = tasks.filter(
    (tk) => workflow.states.find((s) => s.id === tk.currentStateId)?.isFinal,
  ).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const color = iteration ? getIterationColor(iteration.id!) : "#94a3b8";
  const status = iteration ? getIterationStatus(iteration) : null;

  const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
    in_progress: "default",
    planned: "secondary",
    completed: "outline",
    not_scheduled: "outline",
    closed: "outline",
  };

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left px-3 py-3 rounded-lg border transition-all",
        selected
          ? "border-primary bg-primary/5"
          : "border-transparent hover:border-border hover:bg-muted/50",
      )}
      data-testid="iteration-list-item"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span
          className={cn(
            "text-sm font-medium truncate flex-1",
            selected && "text-primary",
          )}
        >
          {iteration?.name ?? t.teams.projects.view("no_iteration")}
        </span>
        {status && (
          <Badge
            variant={statusVariant[status]}
            className="text-[10px] h-4 px-1.5 shrink-0"
          >
            {getIterationStatusLabel(status, t)}
          </Badge>
        )}
      </div>

      {/* Date range */}
      {iteration && (iteration.startDate || iteration.endDate) && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
          <CalendarDays className="h-3 w-3 shrink-0" />
          <span>
            {iteration.startDate
              ? new Date(iteration.startDate).toLocaleDateString()
              : "—"}
            {" → "}
            {iteration.endDate
              ? new Date(iteration.endDate).toLocaleDateString()
              : "—"}
          </span>
        </div>
      )}

      {/* Mini progress bar */}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {done}/{total}
        </span>
      </div>
    </button>
  );
}

/* ── Right panel: state group ── */
function StateGroup({
  stateName,
  tasks,
  isFinal,
  onTaskClick,
}: {
  stateName: string;
  tasks: TicketDTO[];
  isFinal: boolean;
  onTaskClick: (task: TicketDTO) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {stateName}
        </span>
        {isFinal && (
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            ✓
          </Badge>
        )}
        <Badge variant="outline" className="ml-auto text-[10px] h-4 px-1.5">
          {tasks.length}
        </Badge>
      </button>
      {open && (
        <div className="divide-y">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="px-3 py-2 hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => onTaskClick(task)}
            >
              <TaskBlock task={task} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Right panel: full detail of selected iteration ── */
function IterationDetail({
  iteration,
  tasks,
  workflow,
  onTaskClick,
}: {
  iteration: ProjectIterationDTO | null;
  tasks: TicketDTO[];
  workflow: WorkflowDetailDTO;
  onTaskClick: (task: TicketDTO) => void;
}) {
  const t = useAppClientTranslations();
  const states = sortedStates(workflow);
  const color = iteration ? getIterationColor(iteration.id!) : "#94a3b8";

  const total = tasks.length;
  const done = tasks.filter(
    (tk) => workflow.states.find((s) => s.id === tk.currentStateId)?.isFinal,
  ).length;
  const inProgress = tasks.filter((tk) => {
    const s = workflow.states.find((s) => s.id === tk.currentStateId);
    return s && !s.isFinal && !s.isInitial;
  }).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const status = iteration ? getIterationStatus(iteration) : null;

  const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
    in_progress: "default",
    planned: "secondary",
    completed: "outline",
    not_scheduled: "outline",
    closed: "outline",
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Iteration summary card ── */}
      <div className="border rounded-xl p-5 mb-5 bg-card shrink-0">
        <div className="flex items-start gap-3 mb-4">
          <span
            className="h-4 w-4 rounded-full shrink-0 mt-0.5"
            style={{ backgroundColor: color }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold leading-tight">
                {iteration?.name ?? t.teams.projects.view("no_iteration")}
              </h2>
              {status && (
                <Badge variant={statusVariant[status]} className="text-xs">
                  {getIterationStatusLabel(status, t)}
                </Badge>
              )}
            </div>
            {iteration?.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {iteration.description}
              </p>
            )}
          </div>
        </div>

        {/* Date range */}
        {iteration && (iteration.startDate || iteration.endDate) && (
          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            {iteration.startDate && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(iteration.startDate).toLocaleDateString()}
              </span>
            )}
            {iteration.startDate && iteration.endDate && <span>→</span>}
            {iteration.endDate && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(iteration.endDate).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {t.teams.projects.view("tasks_done")}
            </span>
            <span className="text-xs font-semibold" style={{ color }}>
              {pct}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            {
              label: t.teams.projects.view("stat_total"),
              value: total,
              colorClass: "text-foreground",
            },
            {
              label: t.teams.projects.view("stat_in_progress"),
              value: inProgress,
              colorClass: "text-blue-500",
            },
            {
              label: t.teams.projects.view("stat_done"),
              value: done,
              colorClass: "text-green-500",
            },
          ].map(({ label, value, colorClass }) => (
            <div
              key={label}
              className="text-center rounded-lg bg-muted/40 py-2.5 px-2"
            >
              <p className={cn("text-xl font-bold", colorClass)}>{value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Task list grouped by state ── */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Timer className="h-10 w-10 opacity-30" />
            <p className="text-sm">{t.teams.projects.view("no_tasks")}</p>
          </div>
        ) : (
          states.map((state) => {
            const stateTasks = tasks.filter(
              (tk) => tk.currentStateId === state.id,
            );
            if (stateTasks.length === 0) return null;
            return (
              <StateGroup
                key={state.id}
                stateName={state.stateName!}
                tasks={stateTasks}
                isFinal={!!state.isFinal}
                onTaskClick={onTaskClick}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

/* ── Root ── */
type Props = {
  workflow: WorkflowDetailDTO;
  filteredTasks: TaskBoard;
  iterations: ProjectIterationDTO[];
  showClosedIterations: boolean;
  onToggleClosedIterations: () => void;
  onTaskClick: (task: TicketDTO) => void;
};

export default function ProjectIterationView({
  workflow,
  filteredTasks,
  iterations,
  showClosedIterations,
  onToggleClosedIterations,
  onTaskClick,
}: Props) {
  const t = useAppClientTranslations();
  const allTasks = Object.values(filteredTasks).flat();
  const iterationIds = iterations.map((i) => i.id!);

  const tasksWithoutIteration = allTasks.filter(
    (t) => !t.iterationId || !iterationIds.includes(t.iterationId),
  );

  // Show ALL iterations from the project (not just ones with tasks)
  const rows: {
    id: number;
    iteration: ProjectIterationDTO | null;
    tasks: TicketDTO[];
  }[] = [
    ...iterations.map((iteration) => ({
      id: iteration.id!,
      iteration,
      tasks: allTasks.filter((t) => t.iterationId === iteration.id),
    })),
    // Only append "No Iteration" bucket if there are actually unassigned tasks
    ...(tasksWithoutIteration.length > 0
      ? [{ id: NO_ITERATION_ID, iteration: null, tasks: tasksWithoutIteration }]
      : []),
  ];

  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (rows.length > 0 && selectedId === null) {
      setSelectedId(rows[0].id);
    }
  }, [rows.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (iterations.length === 0 && tasksWithoutIteration.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <Timer className="h-10 w-10 opacity-30" />
        <p className="text-sm">{t.teams.projects.view("no_tasks_in_epics")}</p>
      </div>
    );
  }

  const selected = rows.find((r) => r.id === selectedId) ?? rows[0];

  return (
    <div
      className="flex gap-4 h-[calc(100vh-280px)] min-h-[400px]"
      data-testid="project-iteration-view"
    >
      {/* ── Left: iteration list ── */}
      <div
        className="w-64 shrink-0 flex flex-col gap-1.5 overflow-y-auto pr-1"
        data-testid="iteration-list"
      >
        <div className="flex items-center justify-between px-1 mb-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t.teams.projects.view("iteration")} ({rows.length})
          </p>
          <button
            onClick={onToggleClosedIterations}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            title={
              showClosedIterations
                ? t.teams.projects.view("hide_closed_iterations")
                : t.teams.projects.view("show_closed_iterations")
            }
          >
            {showClosedIterations ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            {showClosedIterations
              ? t.teams.projects.view("hide_closed_iterations")
              : t.teams.projects.view("show_closed_iterations")}
          </button>
        </div>
        {rows.map((row) => (
          <IterationListItem
            key={row.id}
            iteration={row.iteration}
            tasks={row.tasks}
            workflow={workflow}
            selected={selectedId === row.id}
            onSelect={() => setSelectedId(row.id)}
          />
        ))}
      </div>

      {/* ── Divider ── */}
      <div className="w-px bg-border shrink-0" />

      {/* ── Right: iteration detail ── */}
      <div
        className="flex-1 min-w-0 overflow-hidden"
        data-testid="iteration-detail"
      >
        <IterationDetail
          iteration={selected.iteration}
          tasks={selected.tasks}
          workflow={workflow}
          onTaskClick={onTaskClick}
        />
      </div>
    </div>
  );
}
