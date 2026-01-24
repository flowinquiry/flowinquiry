"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ExtInputProps } from "@/components/ui/ext-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { getWorkflowsByTeam } from "@/lib/actions/workflows.action";
import { cn } from "@/lib/utils";
import { useError } from "@/providers/error-provider";
import { UiAttributes } from "@/types/ui-components";
import { WorkflowDTO } from "@/types/workflows";

const WorkflowForTicketSelectField = ({
  form,
  fieldName,
  label,
  teamId,
}: ExtInputProps & UiAttributes & { teamId: number }) => {
  const [workflows, setWorkflows] = useState<Array<WorkflowDTO>>([]);
  const { setError } = useError();
  const t = useAppClientTranslations();
  useEffect(() => {
    async function fetchWorkflows() {
      const workflowData = await getWorkflowsByTeam(teamId, false, setError);
      setWorkflows(workflowData);
    }
    fetchWorkflows();
  }, [teamId]);

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className="grid grid-cols-1">
          <FormLabel>
            {label} <span className="text-destructive"> *</span>
          </FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-[200px] justify-between",
                    !field.value && "text-muted-foreground",
                  )}
                >
                  {(() => {
                    const selectedWorkflow = workflows.find(
                      (workflow) => workflow.id === field.value,
                    );
                    return selectedWorkflow
                      ? `${selectedWorkflow.name}`
                      : t.workflows.common("select_workflow");
                  })()}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[18rem] p-0">
              <Command>
                <CommandInput
                  placeholder={t.workflows.common("search_workflow")}
                  className="h-9"
                />
                <CommandList>
                  <CommandEmpty>{t.workflows.common("no_data")}</CommandEmpty>
                  <CommandGroup>
                    {workflows.map((workflow) => (
                      <CommandItem
                        value={workflow.name!}
                        key={workflow.id}
                        onSelect={() => {
                          form.setValue(fieldName, workflow.id);
                        }}
                      >
                        {workflow.name}
                        <Check
                          className={cn(
                            "ml-auto",
                            workflow.id === field.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default WorkflowForTicketSelectField;
