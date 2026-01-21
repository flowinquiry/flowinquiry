import React from "react";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";

import {
  FormControl,
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
import { UiAttributes } from "@/types/ui-components";

interface ValuesSelectProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  fieldName: string;
  values: Array<string>;
  label: string;
  placeholder: string;
}

const ValuesSelect = <T extends FieldValues = FieldValues>({
  form,
  fieldName,
  label,
  placeholder: _placeholder,
  values,
  required,
}: ValuesSelectProps<T> & UiAttributes) => {
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
          <Select
            onValueChange={field.onChange}
            defaultValue={values[0]}
            {...field}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {values?.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ValuesSelect;
