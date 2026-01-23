import React, { useEffect, useState } from "react";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { findIterationsByProjectId } from "@/lib/actions/project-iteration.action";
import { useError } from "@/providers/error-provider";
import { ProjectIterationDTO } from "@/types/projects";

interface IterationFormFieldProps {
  form: any;
  projectId: number;
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  testId?: string;
}

export function IterationFormField({
  form,
  projectId,
  name,
  label = "Iteration",
  description,
  required = false,
  testId,
}: IterationFormFieldProps) {
  const t = useAppClientTranslations();
  const [iterations, setIterations] = useState<ProjectIterationDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const { setError } = useError();

  useEffect(() => {
    async function loadIterations() {
      if (!projectId) return;

      setLoading(true);

      try {
        const iterationsList = await findIterationsByProjectId(
          projectId,
          setError,
        );
        setIterations(iterationsList || []);
      } finally {
        setLoading(false);
      }
    }

    loadIterations();
  }, [projectId, setError]);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </FormLabel>
          <FormControl>
            <Select
              disabled={loading || (iterations.length === 0 && required)}
              onValueChange={(value) => {
                // Convert string to number or set to undefined for "none" value
                if (value === "none") {
                  field.onChange(undefined);
                } else {
                  field.onChange(parseInt(value, 10));
                }
              }}
              // Check for both undefined and null values
              value={
                field.value !== undefined && field.value !== null
                  ? field.value.toString()
                  : "none"
              }
              data-testid={testId}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    loading
                      ? t.common.misc("loading_data")
                      : t.teams.projects.iteration("select_place_holder")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {/* Add None option at the top of the list */}
                {!required && (
                  <SelectItem value="none">{t.common.misc("none")}</SelectItem>
                )}
                {iterations.map((iteration) => (
                  <SelectItem
                    key={iteration.id}
                    value={iteration.id!.toString()}
                  >
                    {iteration.name}
                  </SelectItem>
                ))}
                {iterations.length === 0 && !loading && (
                  <SelectItem value="no_data" disabled>
                    {t.teams.projects.iteration("no_data")}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
