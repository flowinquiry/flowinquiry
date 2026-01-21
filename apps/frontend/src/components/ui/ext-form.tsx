"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import React from "react";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { cn } from "@/lib/utils";
import { UiAttributes } from "@/types/ui-components";

export interface ExtInputProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  fieldName: string;
  label: string;
  placeholder?: string;
  type?: string;
}

export interface FormProps<Entity> {
  initialData: Entity | undefined;
}

export interface ViewProps<DValue> {
  entity: DValue;
}

export const ExtInputField = <T extends FieldValues = FieldValues>({
  form,
  fieldName,
  label,
  placeholder,
  required = false,
  type = undefined,
  className = "",
  ...props
}: ExtInputProps<T> & UiAttributes) => {
  return (
    <FormField
      control={form.control}
      name={fieldName as Path<T>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </FormLabel>
          <FormControl>
            {
              <Input
                type={type}
                placeholder={placeholder}
                {...field}
                className={className}
                testId={props.testId}
              />
            }
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const ExtTextAreaField = <T extends FieldValues = FieldValues>({
  form,
  fieldName,
  label,
  placeholder,
  required,
  className = "",
  ...props
}: ExtInputProps<T> & UiAttributes) => {
  return (
    <div className="md:col-span-2">
      <FormField
        control={form.control}
        name={fieldName as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {label}
              {required && <span className="text-destructive"> *</span>}
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder={placeholder}
                {...field}
                className={className}
                testId={props.testId}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

interface SubmitButtonProps {
  label: string;
  labelWhileLoading: string;
  testId?: string;
}

export const SubmitButton = ({
  label,
  labelWhileLoading: _labelWhileLoading,
  testId,
}: SubmitButtonProps) => {
  return (
    <Button type="submit" testId={testId}>
      {label}
    </Button>
  );
};

type DatePickerFieldProps<T extends FieldValues = FieldValues> = {
  form: UseFormReturn<T>;
  fieldName: string;
  label: string;
  description?: string;
  placeholder?: string;
  dateSelectionMode?: DateSelectionMode;
  testId?: string;
};

type DateSelectionMode = "past" | "future" | "any";

export const DatePickerField = <T extends FieldValues = FieldValues>({
  form,
  fieldName,
  label,
  description,
  placeholder = "Pick a date",
  dateSelectionMode = "any",
  required = false,
  testId,
}: DatePickerFieldProps<T> & { required?: boolean }) => {
  const clearText = useAppClientTranslations().common.buttons("clear");
  return (
    <FormField
      control={form.control}
      name={fieldName as Path<T>}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </FormLabel>
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground",
                    )}
                    testId={testId}
                  >
                    {field.value ? (
                      format(field.value as Date, "PPP")
                    ) : (
                      <span>{placeholder}</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={(field.value as Date) || undefined}
                  onSelect={(date) => {
                    if (date) {
                      field.onChange(date.toISOString()); // convert Date -> string
                    } else {
                      field.onChange(undefined);
                    }

                    form.setValue(
                      fieldName as Path<T>,
                      (date ? date.toISOString() : undefined) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                      {
                        shouldValidate: true,
                      },
                    );
                  }}
                  disabled={(date) => {
                    if (dateSelectionMode === "any") {
                      return false; // No dates are disabled
                    }

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    if (dateSelectionMode === "past") {
                      return date > today; // Disable future dates
                    } else if (dateSelectionMode === "future") {
                      return date < today; // Disable past dates
                    }

                    return false;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {!required && field.value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault(); // Prevent default button behavior
                  e.stopPropagation(); // Stop event from bubbling up
                  field.onChange(undefined);

                  // Force re-render if needed by triggering form state update
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  form.setValue(fieldName as Path<T>, undefined as any, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                }}
              >
                {clearText}
              </Button>
            )}
          </div>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
