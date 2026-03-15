"use client";

import React from "react";
import { useFormContext } from "react-hook-form";

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
import { TeamRole } from "@/types/teams";

const roles = ["manager", "member", "guest", "none"] as const;

type FormValues = {
  role: TeamRole;
};

const TeamRoleSelectField = () => {
  const t = useAppClientTranslations();
  const form = useFormContext<FormValues>();

  return (
    <FormField
      control={form.control}
      name="role"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t.teams.common("role")}</FormLabel>
          <FormControl>
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <SelectTrigger>
                <SelectValue
                  placeholder={t.teams.common("select_role_placeholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {t.teams.roles(role)}
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

export default TeamRoleSelectField;
