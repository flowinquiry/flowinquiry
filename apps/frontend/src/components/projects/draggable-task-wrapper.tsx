"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React, { useRef } from "react";

import TaskBlock from "@/components/projects/task-block";
import { TicketDTO } from "@/types/tickets";

type DraggableTaskWrapperProps = {
  task: TicketDTO;
  onClick: (task: TicketDTO) => void;
};

export const DraggableTaskWrapper: React.FC<DraggableTaskWrapperProps> = ({
  task,
  onClick,
}) => {
  // Track drag state
  const isDraggedRef = useRef(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id!.toString(),
    data: {
      type: "task",
      task,
    },
  });

  // Style for the draggable element
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Create modified listeners with null check
  const modifiedListeners = listeners
    ? {
        ...listeners,
        onDragStart: (e: any) => {
          isDraggedRef.current = true;
          if (listeners.onDragStart) {
            listeners.onDragStart(e);
          }
        },
      }
    : undefined;

  // Handle click on task
  const handleTaskClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // If not currently being dragged, trigger click
    if (!isDragging && !isDraggedRef.current) {
      onClick(task);
    }

    // Reset drag state
    isDraggedRef.current = false;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...modifiedListeners}
      className="cursor-move"
    >
      {/* Use a separate div for click handling */}
      <div onClick={handleTaskClick}>
        <TaskBlock task={task} isDragging={isDragging} />
      </div>
    </div>
  );
};
