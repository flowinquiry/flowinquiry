"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import React from "react";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { UiAttributes } from "@/types/ui-components";

interface ValuesQuerySelectProps<
  T,
  F extends FieldValues = FieldValues,
> extends UiAttributes {
  form: UseFormReturn<F>;
  queryName: string;
  fieldName: string;
  fieldLabel: string;
  required?: boolean;
  fetchDataFn: () => Promise<Array<T>>;
  valueKey: keyof T;
  renderTooltip?: (option: T) => string; // Optional tooltip render function
  renderOption: (option: T) => string;
  placeholder?: string;
  noDataMessage?: string;
  searchPlaceholder?: string;
}

const ValuesQuerySelect = <T, F extends FieldValues = FieldValues>({
  form,
  queryName,
  fieldName,
  fieldLabel,
  required = false,
  fetchDataFn,
  valueKey,
  renderOption,
  renderTooltip,
  placeholder = "Select an item...",
  noDataMessage = "No items found.",
  searchPlaceholder = "Search...",
  testId: _testId,
}: ValuesQuerySelectProps<T, F>) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const optionsResult = useQuery<Array<T>>({
    queryKey: [queryName],
    queryFn: async () => fetchDataFn(),
  });

  if (!optionsResult) {
    return <div>{noDataMessage}</div>;
  }

  const options = optionsResult.data;

  return (
    <TooltipProvider>
      <FormField
        control={form.control}
        name={fieldName as Path<F>}
        render={({ field }) => (
          <FormItem className="w-[20rem]">
            <FormLabel>
              {fieldLabel}
              {required && <span className="text-destructive"> *</span>}
            </FormLabel>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    {field.value
                      ? (() => {
                          const selectedOption = options?.find(
                            (option) => option[valueKey] === field.value,
                          );

                          return selectedOption
                            ? renderOption(selectedOption)
                            : placeholder;
                        })()
                      : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[20rem] p-0">
                <Command>
                  <CommandInput placeholder={searchPlaceholder} />
                  <CommandList>
                    <CommandEmpty>{noDataMessage}</CommandEmpty>
                    <CommandGroup>
                      {options?.map((option) => (
                        <CommandItem
                          value={String(option[valueKey])}
                          key={String(option[valueKey])}
                          onSelect={() => {
                            form.setValue(
                              fieldName as Path<F>,
                              option[valueKey] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                            );
                            setIsOpen(false);
                          }}
                        >
                          {renderTooltip ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex items-center">
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      option[valueKey] === field.value
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {renderOption(option)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {renderTooltip(option)}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <>
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  option[valueKey] === field.value
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {renderOption(option)}
                            </>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FormItem>
        )}
      />
    </TooltipProvider>
  );
};

export default ValuesQuerySelect;
