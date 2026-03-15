"use client";

import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import React, { useEffect, useRef, useState } from "react";

import StateColumn from "@/components/projects/state-column";
import TaskBlock from "@/components/projects/task-block";
import { TaskBoard } from "@/components/projects/task-editor-sheet";
import { TicketDTO } from "@/types/tickets";
import { WorkflowDetailDTO } from "@/types/workflows";

type Props = {
  workflow: WorkflowDetailDTO;
  filteredTasks: TaskBoard;
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
  onTaskClick,
  onDragEnd,
  onAddTask,
}: Props) {
  const [activeTask, setActiveTask] = useState<TicketDTO | null>(null);
  const [dragStartTime, setDragStartTime] = useState<number | null>(null);

  // Self-contained height calculation
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(500);

  useEffect(() => {
    let rafId: number;
    const update = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const el = containerRef.current;
        if (!el) return;
        const top = el.getBoundingClientRect().top;
        // Fill from this element's top to 16px above the viewport bottom
        setHeight(Math.max(window.innerHeight - top - 16, 300));
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", update);
    };
  }, []);

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

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={containerRef}
        className="kanban-board-scroll"
        style={{
          display: "flex",
          alignItems: "stretch",
          gap: "1rem",
          height: height,
          minHeight: "300px",
          overflowX: "scroll",
          overflowY: "hidden",
          paddingBottom: "12px",
          paddingRight: "1rem",
          boxSizing: "border-box",
        }}
        data-testid="project-view-board"
      >
        {sortedStates(workflow).map((state) => (
          <StateColumn
            key={state.id}
            workflowState={state}
            tasks={filteredTasks[state.id!.toString()] || []}
            setIsSheetOpen={() => onAddTask(state.id!)}
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
