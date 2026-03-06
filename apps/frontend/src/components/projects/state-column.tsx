"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

import { DraggableTaskWrapper } from "@/components/projects/draggable-task-wrapper";
import { Badge } from "@/components/ui/badge";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { useUserTeamRole } from "@/providers/user-team-role-provider";
import { PermissionUtils } from "@/types/resources";
import { TicketDTO } from "@/types/tickets";
import { WorkflowStateDTO } from "@/types/workflows";

type ColumnProps = {
  workflowState: WorkflowStateDTO;
  tasks: TicketDTO[];
  setIsSheetOpen: (open: boolean) => void;
  setSelectedWorkflowState: (state: WorkflowStateDTO) => void;
  columnColor: string;
  onTaskClick?: (task: TicketDTO) => void;
};

const StateColumn: React.FC<ColumnProps> = ({
  workflowState,
  tasks,
  setIsSheetOpen,
  setSelectedWorkflowState,
  columnColor,
  onTaskClick,
}) => {
  const t = useAppClientTranslations();
  const permissionLevel = usePagePermission();
  const teamRole = useUserTeamRole().role;
  const { isOver, setNodeRef } = useDroppable({
    id: workflowState.id!.toString(),
    data: { type: "column", stateId: workflowState.id },
  });

  const taskIds = tasks.map((task) => task.id!.toString());
  const canAdd =
    PermissionUtils.canWrite(permissionLevel) ||
    teamRole === "manager" ||
    teamRole === "member";

  return (
    <motion.div
      ref={setNodeRef}
      className={`flex flex-col grow min-w-72 max-w-xs rounded-xl border transition-colors ${columnColor} ${
        isOver ? "ring-2 ring-primary/40 bg-primary/5" : ""
      }`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      data-testid={`state-column-${workflowState.id}`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b">
        <div className="flex items-center gap-2 min-w-0">
          {workflowState.isInitial && (
            <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
          )}
          {workflowState.isFinal && (
            <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
          )}
          {!workflowState.isInitial && !workflowState.isFinal && (
            <span className="h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
          )}
          <h2
            className="text-sm font-semibold truncate capitalize"
            data-testid={`state-column-title-${workflowState.id}`}
          >
            {workflowState.stateName}
          </h2>
        </div>
        <Badge variant="secondary" className="text-xs h-5 px-1.5 shrink-0">
          {tasks.length}
        </Badge>
      </div>

      {/* Tasks area */}
      <SortableContext
        id={workflowState.id!.toString()}
        items={taskIds}
        strategy={verticalListSortingStrategy}
      >
        <motion.div
          className="flex-1 overflow-y-auto px-2 py-2 space-y-2 min-h-24"
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          data-testid={`state-column-tasks-${workflowState.id}`}
        >
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-16 rounded-lg border border-dashed text-xs text-muted-foreground/50">
              Drop tasks here
            </div>
          )}
          {tasks.map((task) => (
            <DraggableTaskWrapper
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task)}
            />
          ))}
        </motion.div>
      </SortableContext>

      {/* Add task button */}
      {canAdd && (
        <div className="px-2 pb-2">
          <motion.button
            onClick={() => {
              setSelectedWorkflowState(workflowState);
              setIsSheetOpen(true);
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-muted-foreground bg-muted/60 border border-border hover:bg-primary/10 hover:border-primary hover:text-primary transition-colors cursor-pointer"
            whileTap={{ scale: 0.97 }}
            data-testid={`new-task-button-${workflowState.id}`}
          >
            <Plus className="h-3.5 w-3.5" />
            {t.teams.projects.view("new_task")}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default StateColumn;
