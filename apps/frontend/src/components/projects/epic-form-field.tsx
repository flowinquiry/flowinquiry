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
import { findEpicsByProjectId } from "@/lib/actions/project-epic.action";
import { useError } from "@/providers/error-provider";
import { ProjectEpicDTO } from "@/types/projects";

interface EpicFormFieldProps {
  form: any;
  projectId: number;
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  testId?: string;
}

export function EpicFormField({
  form,
  projectId,
  name,
  label = "Epic",
  description,
  required = false,
  testId,
}: EpicFormFieldProps) {
  const t = useAppClientTranslations();
  const [epics, setEpics] = useState<ProjectEpicDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const { setError } = useError();

  useEffect(() => {
    async function loadEpics() {
      if (!projectId) return;

      setLoading(true);

      try {
        const epicsList = await findEpicsByProjectId(projectId, setError);
        setEpics(epicsList || []);
      } finally {
        setLoading(false);
      }
    }

    loadEpics();
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
              disabled={loading || (epics.length === 0 && required)}
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
                      : t.teams.projects.epic("select_place_holder")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {/* Add None option at the top of the list */}
                {!required && (
                  <SelectItem value="none">{t.common.misc("none")}</SelectItem>
                )}
                {epics.map((epic) => (
                  <SelectItem key={epic.id} value={epic.id!.toString()}>
                    {epic.name}
                  </SelectItem>
                ))}
                {epics.length === 0 && !loading && (
                  <SelectItem value="no_data" disabled>
                    {t.teams.projects.epic("no_data")}
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
