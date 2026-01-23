"use client";

import React, { useEffect } from "react";

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

type TicketChannelSelectFieldProps = {
  form: any;
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

const TicketChannelSelectField: React.FC<TicketChannelSelectFieldProps> = ({
  form,
  testId,
}) => {
  const t = useAppClientTranslations();
  useEffect(() => {
    // Set default value if the field is empty
    if (!form.getValues("channel")) {
      form.setValue("channel", "internal", { shouldValidate: true });
    }
  }, [form]);

  return (
    <FormField
      control={form.control}
      name="channel"
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
