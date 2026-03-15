"use client";

import React, { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  getInitialStates,
  getValidTargetStates,
} from "@/lib/actions/workflows.action";
import { useError } from "@/providers/error-provider";
import { WorkflowStateDTO } from "@/types/workflows";

type WorkflowStateSelectProps = {
  workflowId: number;
  currentStateId?: number;
  onChange: (stateId: number, stateName: string) => void;
  disabled?: boolean;
};

/**
 * A component for selecting workflow states
 *
 * This component loads the valid target states for a workflow and state,
 * and provides a select dropdown to choose a new state.
 */
const WorkflowStateSelect: React.FC<WorkflowStateSelectProps> = ({
  workflowId,
  currentStateId,
  onChange,
  disabled = false,
}) => {
  const [workflowStates, setWorkflowStates] = useState<WorkflowStateDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { setError } = useError();
  const t = useAppClientTranslations();

  useEffect(() => {
    if (!workflowId) return;

    const loadWorkflowStates = async () => {
      setIsLoading(true);
      try {
        let data: WorkflowStateDTO[];
        if (currentStateId) {
          data = await getValidTargetStates(
            workflowId,
            currentStateId,
            true,
            setError,
          );
        } else {
          // No current state — always load initial states
          data = await getInitialStates(workflowId, setError);
          // Auto-select the first initial state
          if (data.length > 0) {
            onChange(data[0].id!, data[0].stateName);
          }
        }
        setWorkflowStates(data);
      } catch (error) {
        console.error("Failed to load workflow states:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkflowStates();
  }, [workflowId, currentStateId, onChange, setError]);

  const selectedState = workflowStates.find(
    (state) => state.id === currentStateId,
  );

  const handleStateChange = (value: string) => {
    const stateId = Number(value);
    const newState = workflowStates.find((state) => state.id === stateId);
    if (newState) {
      onChange(stateId, newState.stateName);
    }
  };

  return (
    <Select
      value={currentStateId ? String(currentStateId) : ""}
      onValueChange={handleStateChange}
      disabled={disabled || isLoading || workflowStates.length === 0}
    >
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={t.workflows.common("state_select_place_holder")}
        >
          {selectedState?.stateName ||
            t.workflows.common("state_select_place_holder")}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {workflowStates.map((state) => (
          <SelectItem key={state.id} value={String(state.id!)}>
            {state.stateName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default WorkflowStateSelect;
