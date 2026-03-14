"use client";

import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import React, { useState } from "react";

import StateColumn from "@/components/projects/state-column";
import TaskBlock from "@/components/projects/task-block";
import { TaskBoard } from "@/components/projects/task-editor-sheet";
import { TicketDTO } from "@/types/tickets";
import { WorkflowDetailDTO } from "@/types/workflows";

type Props = {
  workflow: WorkflowDetailDTO;
  filteredTasks: TaskBoard;
  boardRef: React.RefObject<HTMLDivElement | null>;
  boardHeight: number;
  onTaskClick: (task: TicketDTO) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onAddTask: (stateId: number) => void;
};

const sortedStates = (workflow: WorkflowDetailDTO) =>
  [...workflow.states].sort((a, b) => {
    if (a.isInitial && !b.isInitial) return -1;
    if (!a.isInitial && b.isInitial) return 1;
    if (a.isFinal && !b.isFinal) return 1;
    if (!a.isFinal && b.isFinal) return -1;
    return 0;
  });

export default function ProjectKanbanView({
  workflow,
  filteredTasks,
  boardRef,
  boardHeight,
  onTaskClick,
  onDragEnd,
  onAddTask,
}: Props) {
  const [activeTask, setActiveTask] = useState<TicketDTO | null>(null);
  const [dragStartTime, setDragStartTime] = useState<number | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setDragStartTime(Date.now());
    const activeId = event.active.id.toString();
    let found: TicketDTO | null = null;
    Object.values(filteredTasks).forEach((col) => {
      const t = col.find((t) => t.id?.toString() === activeId);
      if (t) found = t;
    });
    if (found) setActiveTask(found);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const dragDuration = dragStartTime ? Date.now() - dragStartTime : 0;
    setActiveTask(null);
    setDragStartTime(null);

    const { active, over } = event;
    if (!over) return;

    // Short tap — treat as click to open detail
    if (dragDuration < 200) {
      const activeId = active.id.toString();
      const clicked = Object.values(filteredTasks)
        .flat()
        .find((t) => t.id?.toString() === activeId);
      if (clicked) {
        onTaskClick(clicked);
        return;
      }
    }

    onDragEnd(event);
  };

  const [addSheetState, setAddSheetState] = useState<number | null>(null);

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={boardRef}
        className="flex items-stretch gap-4 pb-2"
        style={{
          height: boardHeight,
          minHeight: "300px",
          overflowX: "auto",
          overflowY: "hidden",
          scrollbarWidth: "thin",
          WebkitOverflowScrolling: "touch",
          paddingRight: "1rem",
        }}
        data-testid="project-view-board"
      >
        {sortedStates(workflow).map((state) => (
          <StateColumn
            key={state.id}
            workflowState={state}
            tasks={filteredTasks[state.id!.toString()] || []}
            setIsSheetOpen={() => {
              setAddSheetState(state.id!);
              onAddTask(state.id!);
            }}
            setSelectedWorkflowState={() => {}}
            columnColor="bg-[hsl(var(--card))]"
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <TaskBlock task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
