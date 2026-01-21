"use client";

import { FieldValues, Path, UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormField, FormItem } from "@/components/ui/form";

interface WorkflowStatesSelectProps<T extends FieldValues = FieldValues> {
  fieldName: string;
  form: UseFormReturn<T>;
  label: string;
  options: { label: string; value: string | number }[];
  placeholder?: string;
  required?: boolean;
  testId?: string;
}

const WorkflowStatesSelectField = <T extends FieldValues = FieldValues>({
  fieldName,
  form,
  label,
  options,
  placeholder = "Select a state",
  required: _required = false,
  testId,
}: WorkflowStatesSelectProps<T>) => {
  return (
    <FormField
      control={form.control}
      name={fieldName as Path<T>}
      render={({ field }) => {
        const selectedOption = options.find(
          (option) => option.value === field.value,
        );

        return (
          <FormItem className="grid grid-cols-1">
            <label className="text-sm font-medium">{label}</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full text-left justify-start min-w-0"
                  testId={testId}
                >
                  <span className="truncate block">
                    {selectedOption?.label || placeholder}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full min-w-(--radix-dropdown-menu-trigger-width)">
                {options.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => field.onChange(option.value)}
                    className="cursor-pointer"
                  >
                    <span className="truncate" title={option.label}>
                      {option.label}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {form.formState.errors[fieldName as Path<T>]?.message && (
              <p className="text-sm text-red-500">
                {String(form.formState.errors[fieldName as Path<T>]?.message)}
              </p>
            )}
          </FormItem>
        );
      }}
    />
  );
};

export default WorkflowStatesSelectField;
