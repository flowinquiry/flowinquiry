"use client";

import React, { useEffect } from "react";
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
import { useAppClientTranslations } from "@/hooks/use-translations";
import { TicketChannel } from "@/types/tickets";

type TicketChannelSelectFieldProps<T extends FieldValues = FieldValues> = {
  form: UseFormReturn<T>;
  testId?: string;
};

const ticketChannels: TicketChannel[] = [
  "email",
  "phone",
  "web_portal",
  "chat",
  "social_media",
  "in_person",
  "mobile_app",
  "api",
  "system_generated",
  "internal",
];

const TicketChannelSelectField = <T extends FieldValues = FieldValues>({
  form,
  testId,
}: TicketChannelSelectFieldProps<T>) => {
  const t = useAppClientTranslations();
  useEffect(() => {
    // Set default value if the field is empty
    if (!form.getValues("channel" as Path<T>)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.setValue("channel" as Path<T>, "internal" as any, {
        shouldValidate: true,
      });
    }
  }, [form]);

  return (
    <FormField
      control={form.control}
      name={"channel" as Path<T>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t.teams.tickets.form.base("channel")}</FormLabel>
          <FormControl>
            <Select
              onValueChange={field.onChange}
              value={field.value || "internal"} // Use "internal" as fallback
              testId={testId}
            >
              <SelectTrigger className="w-[16rem]">
                <SelectValue
                  placeholder={t.teams.tickets.form.base(
                    "channel_place_holder",
                  )}
                />
              </SelectTrigger>
              <SelectContent className="w-[16rem]">
                {ticketChannels.map((channel) => (
                  <SelectItem key={channel} value={channel}>
                    {t.teams.tickets.form.channels(channel)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TicketChannelSelectField;
