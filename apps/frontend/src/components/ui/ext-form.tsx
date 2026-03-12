"use client";

import { format } from "date-fns";
import { CalendarIcon, XCircle } from "lucide-react";
import React from "react";

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

export interface ExtInputProps {
  form: any;
  fieldName: string;
  label: string;
  placeholder?: string;
  type?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface FormProps<Entity> {
  initialData: Entity | undefined;
}

export interface ViewProps<DValue> {
  entity: DValue;
}

export const ExtInputField = ({
  form,
  fieldName,
  label,
  placeholder,
  required = false,
  type = undefined,
  onChange,
  className = "",
  ...props
}: ExtInputProps & UiAttributes) => {
  return (
    <FormField
      control={form.control}
      name={fieldName}
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

export const ExtTextAreaField = ({
  form,
  fieldName,
  label,
  placeholder,
  required,
  className = "",
  ...props
}: ExtInputProps & UiAttributes) => {
  return (
    <div className="md:col-span-2">
      <FormField
        control={form.control}
        name={fieldName}
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
  labelWhileLoading,
  testId,
}: SubmitButtonProps) => {
  return (
    <Button type="submit" testId={testId}>
      {label}
    </Button>
  );
};

type DatePickerFieldProps = {
  form: any;
  fieldName: string;
  label: string;
  description?: string;
  placeholder?: string;
  dateSelectionMode?: DateSelectionMode;
  testId?: string;
};

type DateSelectionMode = "past" | "future" | "any";

export const DatePickerField: React.FC<
  DatePickerFieldProps & { required?: boolean }
> = ({
  form,
  fieldName,
  label,
  description,
  placeholder = "Pick a date",
  dateSelectionMode = "any",
  required = false,
  testId,
}) => {
  const clearText = useAppClientTranslations().common.buttons("clear");
  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className="flex flex-col w-full">
          <FormLabel>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </FormLabel>
          <div className="flex items-center gap-2 min-w-0">
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "flex-1 min-w-0 pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground",
                    )}
                    testId={testId}
                  >
                    {field.value ? (
                      format(field.value, "PPP")
                    ) : (
                      <span>{placeholder}</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value || undefined}
                  onSelect={(date) => {
                    if (date) {
                      field.onChange(date.toISOString());
                    } else {
                      field.onChange(undefined);
                    }
                    form.setValue(
                      fieldName,
                      date ? date.toISOString() : undefined,
                      {
                        shouldValidate: true,
                      },
                    );
                  }}
                  disabled={(date) => {
                    if (dateSelectionMode === "any") {
                      return false;
                    }

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    if (dateSelectionMode === "past") {
                      return date > today;
                    } else if (dateSelectionMode === "future") {
                      return date < today;
                    }

                    return false;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {!required && field.value && (
              <button
                type="button"
                title={clearText}
                className="shrink-0 text-muted-foreground hover:text-foreground focus:outline-none"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  field.onChange(undefined);
                  form.setValue(fieldName, undefined, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                }}
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
