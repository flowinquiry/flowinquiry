"use client";

import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
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
import { cn } from "@/lib/utils";
import { useError } from "@/providers/error-provider";
import { WorkflowStateDTO } from "@/types/workflows";

type WorkflowStateSelectProps = {
  form: UseFormReturn<any>;
  name: string;
  label?: string;
  workflowId: number;
  workflowStateId?: number;
  includeSelf?: boolean;
  required?: boolean;
  testId?: string;
};

const WorkflowStateSelectField = ({
  form,
  name,
  label = "Select Workflow State",
  workflowId,
  workflowStateId,
  includeSelf = false,
  required = false,
  testId,
}: WorkflowStateSelectProps) => {
  const [workflowStates, setWorkflowStates] = useState<WorkflowStateDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { setError } = useError();
  const t = useAppClientTranslations();

  useEffect(() => {
    const loadWorkflowStates = async () => {
      setIsLoading(true);
      try {
        let data: WorkflowStateDTO[];

        if (workflowStateId !== undefined) {
          data = await getValidTargetStates(
            workflowId,
            workflowStateId,
            includeSelf,
            setError,
          );
        } else {
          data = await getInitialStates(workflowId, setError);
        }

        setWorkflowStates(data);
      } finally {
        setIsLoading(false);
      }
    };

    if (workflowId) {
      loadWorkflowStates();
    }
  }, [workflowId, workflowStateId, includeSelf, setError]);

  useEffect(() => {
    if (workflowStates.length > 0) {
      const currentValue = form.getValues(name);

      // ✅ Ensure the Select component reflects the correct value
      if (
        !currentValue ||
        !workflowStates.some((state) => state.id === currentValue)
      ) {
        const defaultState =
          workflowStates.find((state) => state.id === workflowStateId) ||
          workflowStates[0];

        if (defaultState) {
          form.setValue(name, defaultState.id, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      }
    }
  }, [workflowStates, workflowStateId, form, name]);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const selectedState = workflowStates.find(
          (state) => state.id === field.value,
        );

        return (
          <FormItem>
            <FormLabel>
              {label}
              {required && <span className="text-destructive"> *</span>}
            </FormLabel>
            <FormControl>
              <Select
                value={field.value ? String(field.value) : ""}
                onValueChange={(value) =>
                  field.onChange(value ? Number(value) : null)
                }
                disabled={isLoading || workflowStates.length === 0}
                testId={testId}
              >
                <SelectTrigger className={cn("w-[16rem]")}>
                  <SelectValue
                    placeholder={
                      selectedState?.stateName ||
                      t.workflows.common("state_select_place_holder")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {workflowStates.map((state) => (
                    <SelectItem key={state.id} value={String(state.id)}>
                      {state.stateName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>
        );
      }}
    />
  );
};

export default WorkflowStateSelectField;
