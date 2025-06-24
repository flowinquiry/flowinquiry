"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import clsx from "clsx";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

import { DraggableTaskWrapper } from "@/components/projects/draggable-task-wrapper";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { useUserTeamRole } from "@/providers/user-team-role-provider";
import { PermissionUtils } from "@/types/resources";
import { TicketDTO } from "@/types/tickets";
import { WorkflowStateDTO } from "@/types/workflows";

const BUTTON_COLOR =
  "bg-gray-400 dark:bg-gray-800 hover:bg-gray-500 dark:hover:bg-gray-900";

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
    data: {
      type: "column",
      stateId: workflowState.id,
    },
  });

  const taskIds = tasks.map((task) => task.id!.toString());

  return (
    <motion.div
      ref={setNodeRef}
      className={clsx(
        "flex flex-col grow min-w-md max-w-xl p-4 rounded shadow-sm border",
        columnColor,
        "min-h-[200px]",
        isOver ? "bg-green-50 dark:bg-green-900/20" : "",
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      data-testid={`state-column-${workflowState.id}`}
    >
      <h2
        className="text-lg font-bold mb-4 capitalize"
        data-testid={`state-column-title-${workflowState.id}`}
      >
        {workflowState.stateName}
      </h2>

      <SortableContext
        id={workflowState.id!.toString()}
        items={taskIds}
        strategy={verticalListSortingStrategy}
      >
        <motion.div
          className="grow overflow-y-auto min-h-[100px]"
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          data-testid={`state-column-tasks-${workflowState.id}`}
        >
          {tasks.map((task) => (
            <DraggableTaskWrapper
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task)}
            />
          ))}
        </motion.div>
      </SortableContext>
      {(PermissionUtils.canWrite(permissionLevel) ||
        teamRole === "manager" ||
        teamRole === "member") && (
        <motion.button
          onClick={() => {
            setSelectedWorkflowState(workflowState);
            setIsSheetOpen(true);
          }}
          className={clsx(
            "mt-2 w-full flex items-center justify-center gap-2 py-2 border rounded-lg text-white font-semibold transition",
            "bg-primary",
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          data-testid={`new-task-button-${workflowState.id}`}
        >
          <Plus className="w-5 h-5" /> {t.teams.projects.view("new_task")}
        </motion.button>
      )}
    </motion.div>
  );
};

export default StateColumn;
