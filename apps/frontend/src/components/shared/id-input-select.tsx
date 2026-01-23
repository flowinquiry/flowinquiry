import React from "react";
import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type IdInputSelectProps = {
  name: string;
  label: string;
  defaultValue: string | null;
  placeholder?: string;
  buttonLabel?: string;
  readOnly?: boolean;
  onButtonClick: () => void;
};

const IdInputSelect: React.FC<IdInputSelectProps> = ({
  name,
  label,
  defaultValue = null,
  placeholder = "Enter value...",
  buttonLabel = "Select",
  readOnly = true,
  onButtonClick,
}) => {
  const { control, getValues } = useFormContext(); // Get the form context from React Hook Form

  return (
    <FormField
      name={name}
      control={control}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="flex items-center">
            <FormControl>
              <input
                type="text"
                {...field}
                value={defaultValue ? defaultValue : field.value}
                placeholder={placeholder}
                readOnly={readOnly}
                className={`mt-1 block w-full px-3 py-2 ${
                  readOnly ? "bg-gray-200" : "bg-white"
                } border border-gray-300 rounded-md shadow-xs focus:outline-hidden focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              />
            </FormControl>

            <button
              type="button"
              onClick={onButtonClick}
              className="px-4 py-2 border text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {buttonLabel}
            </button>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default IdInputSelect;
