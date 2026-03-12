"use client";

import { CalendarDays, ChevronDown, ChevronRight, Layers } from "lucide-react";
import React, { useEffect, useState } from "react";

import TaskBlock from "@/components/projects/task-block";
import { TaskBoard } from "@/components/projects/task-editor-sheet";
import { Badge } from "@/components/ui/badge";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { cn } from "@/lib/utils";
import { ProjectEpicDTO } from "@/types/projects";
import { TicketDTO } from "@/types/tickets";
import { WorkflowDetailDTO } from "@/types/workflows";

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

const NO_EPIC_ID = -1;

const sortedStates = (workflow: WorkflowDetailDTO) =>
  [...workflow.states].sort((a, b) => {
    if (a.isInitial && !b.isInitial) return -1;
    if (!a.isInitial && b.isInitial) return 1;
    if (a.isFinal && !b.isFinal) return 1;
    if (!a.isFinal && b.isFinal) return -1;
    return 0;
  });

/* ── Left panel: single epic list item ── */
function EpicListItem({
  epic,
  tasks,
  workflow,
  selected,
  onSelect,
}: {
  epic: ProjectEpicDTO | null;
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
  const color = epic ? getEpicColor(epic.id!) : "#94a3b8";

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left px-3 py-3 rounded-lg border transition-all group",
        selected
          ? "border-primary bg-primary/5"
          : "border-transparent hover:border-border hover:bg-muted/50",
      )}
      data-testid="epic-list-item"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span
          className={cn(
            "text-sm font-medium truncate",
            selected && "text-primary",
          )}
        >
          {epic?.name ?? t.teams.projects.view("no_epic")}
        </span>
        <Badge
          variant="secondary"
          className="ml-auto text-[10px] h-4 px-1.5 shrink-0"
        >
          {total}
        </Badge>
      </div>
      {/* Mini progress bar */}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {pct}%
        </span>
      </div>
    </button>
  );
}

/* ── Right panel: state group section ── */
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

/* ── Right panel: full detail of selected epic ── */
function EpicDetail({
  epic,
  tasks,
  workflow,
  onTaskClick,
}: {
  epic: ProjectEpicDTO | null;
  tasks: TicketDTO[];
  workflow: WorkflowDetailDTO;
  onTaskClick: (task: TicketDTO) => void;
}) {
  const t = useAppClientTranslations();
  const states = sortedStates(workflow);
  const color = epic ? getEpicColor(epic.id!) : "#94a3b8";

  const total = tasks.length;
  const done = tasks.filter(
    (tk) => workflow.states.find((s) => s.id === tk.currentStateId)?.isFinal,
  ).length;
  const inProgress = tasks.filter((tk) => {
    const s = workflow.states.find((s) => s.id === tk.currentStateId);
    return s && !s.isFinal && !s.isInitial;
  }).length;
  const todo = tasks.filter(
    (tk) => workflow.states.find((s) => s.id === tk.currentStateId)?.isInitial,
  ).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Epic summary card ── */}
      <div className="border rounded-xl p-5 mb-5 bg-card shrink-0">
        <div className="flex items-start gap-3 mb-4">
          <span
            className="h-4 w-4 rounded-full shrink-0 mt-0.5"
            style={{ backgroundColor: color }}
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold leading-tight">
              {epic?.name ?? t.teams.projects.view("no_epic")}
            </h2>
            {epic?.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {epic.description}
              </p>
            )}
          </div>
        </div>

        {/* Date range */}
        {epic && (epic.startDate || epic.endDate) && (
          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            {epic.startDate && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(epic.startDate).toLocaleDateString()}
              </span>
            )}
            {epic.startDate && epic.endDate && <span>→</span>}
            {epic.endDate && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(epic.endDate).toLocaleDateString()}
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
              color: "text-foreground",
            },
            {
              label: t.teams.projects.view("stat_in_progress"),
              value: inProgress,
              color: "text-blue-500",
            },
            {
              label: t.teams.projects.view("stat_done"),
              value: done,
              color: "text-green-500",
            },
          ].map(({ label, value, color: c }) => (
            <div
              key={label}
              className="text-center rounded-lg bg-muted/40 py-2.5 px-2"
            >
              <p className={cn("text-xl font-bold", c)}>{value}</p>
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
            <Layers className="h-10 w-10 opacity-30" />
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
  epics: ProjectEpicDTO[];
  onTaskClick: (task: TicketDTO) => void;
};

export default function ProjectEpicView({
  workflow,
  filteredTasks,
  epics,
  onTaskClick,
}: Props) {
  const t = useAppClientTranslations();
  const allTasks = Object.values(filteredTasks).flat();
  const epicIds = epics.map((e) => e.id!);

  const tasksWithoutEpic = allTasks.filter(
    (t) => !t.epicId || !epicIds.includes(t.epicId),
  );

  // Show ALL epics from the project (not just ones with tasks)
  const rows: {
    id: number;
    epic: ProjectEpicDTO | null;
    tasks: TicketDTO[];
  }[] = [
    ...epics.map((epic) => ({
      id: epic.id!,
      epic,
      tasks: allTasks.filter((t) => t.epicId === epic.id),
    })),
    // Only append "No Epic" bucket if there are actually unepiced tasks
    ...(tasksWithoutEpic.length > 0
      ? [{ id: NO_EPIC_ID, epic: null, tasks: tasksWithoutEpic }]
      : []),
  ];

  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Auto-select first row when data arrives
  useEffect(() => {
    if (rows.length > 0 && selectedId === null) {
      setSelectedId(rows[0].id);
    }
  }, [rows.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (epics.length === 0 && tasksWithoutEpic.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <Layers className="h-10 w-10 opacity-30" />
        <p className="text-sm">{t.teams.projects.view("no_tasks_in_epics")}</p>
      </div>
    );
  }

  const selected = rows.find((r) => r.id === selectedId) ?? rows[0];

  return (
    <div
      className="flex gap-4 h-[calc(100vh-280px)] min-h-[400px]"
      data-testid="project-epic-view"
    >
      {/* ── Left: epic list ── */}
      <div
        className="w-64 shrink-0 flex flex-col gap-1.5 overflow-y-auto pr-1"
        data-testid="epic-list"
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-1">
          {t.teams.projects.view("epic")} ({rows.length})
        </p>
        {rows.map((row) => (
          <EpicListItem
            key={row.id}
            epic={row.epic}
            tasks={row.tasks}
            workflow={workflow}
            selected={selectedId === row.id}
            onSelect={() => setSelectedId(row.id)}
          />
        ))}
      </div>

      {/* ── Divider ── */}
      <div className="w-px bg-border shrink-0" />

      {/* ── Right: epic detail ── */}
      <div className="flex-1 min-w-0 overflow-hidden" data-testid="epic-detail">
        <EpicDetail
          epic={selected.epic}
          tasks={selected.tasks}
          workflow={workflow}
          onTaskClick={onTaskClick}
        />
      </div>
    </div>
  );
}
