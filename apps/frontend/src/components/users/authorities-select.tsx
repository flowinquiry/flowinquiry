"use client";

import React, { useEffect, useState } from "react";

import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MultiSelect } from "@/components/ui/multi-select";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { getAuthorities } from "@/lib/actions/authorities.action";
import { useError } from "@/providers/error-provider";
import { AuthorityDTO } from "@/types/authorities";
import { UiAttributes } from "@/types/ui-components";

interface AuthoritiesSelectProps {
  form: any;
  fieldName: string;
  label: string;
  required?: boolean;
}

const AuthoritiesSelect = ({
  form,
  fieldName,
  label,
  required,
}: AuthoritiesSelectProps & UiAttributes) => {
  const [authorities, setAuthorities] = useState<AuthorityDTO[]>();
  const { setError } = useError();

  const t = useAppClientTranslations();

  useEffect(() => {
    const fetchAuthorities = async () => {
      const data = await getAuthorities(0, setError);
      setAuthorities(data.content);
    };

    fetchAuthorities();
  }, []);

  if (authorities === undefined) {
    return <div>{t.authorities.common("no_data")}</div>;
  }

  // Map authorities to options
  const options = authorities.map((auth) => ({
    value: auth.name,
    label: auth.descriptiveName,
  }));

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => {
        const defaultValues = field.value ?? [];

        return (
          <FormItem className="space-y-2">
            <FormLabel>
              {label}
              {required && <span className="text-destructive"> *</span>}
            </FormLabel>
            <div className="max-w-[20rem]">
              <MultiSelect
                options={options}
                onValueChange={(newValues) =>
                  field.onChange(
                    newValues
                      .map((selectedValue) =>
                        authorities.find((auth) => auth.name === selectedValue),
                      )
                      .filter(Boolean)
                      .map((auth) => auth?.name),
                  )
                }
                defaultValue={defaultValues}
                placeholder={t.authorities.common("select_place_holder")}
                animation={2}
                maxCount={3}
              />
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

export default AuthoritiesSelect;
