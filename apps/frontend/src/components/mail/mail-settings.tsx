"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod/v4";

import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  findAppSettingsByGroup,
  updateAppSettings,
} from "@/lib/actions/settings.action";
import { useError } from "@/providers/error-provider";
import { AppSettingDTO } from "@/types/commons";

export function MailSettings() {
  const { setError } = useError();
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const t = useAppClientTranslations();
  const router = useRouter();

  const emailSettingsSchema = z.object({
    "mail.host": z.string().min(1, "SMTP host is required"),
    "mail.port": z.string().min(1, "SMTP port is required"),
    "mail.base_url": z.string().min(1, "Base URL is required"),
    "mail.username": z.string().min(1, "Username is required"),
    "mail.password": z.string().min(1, "Password is required"),
    "mail.protocol": z.string().min(1, "Protocol is required"),
    "mail.from": z
      .string()
      .email("Invalid email address")
      .min(1, "From address is required"),
    "mail.fromName": z.string().min(1, "Sender name is required"),
    "mail.smtp.auth": z.enum(["true", "false"]),
    "mail.smtp.starttls.enable": z.enum(["true", "false"]),
    "mail.smtp.ssl.enable": z.enum(["true", "false"]),
    "mail.debug": z.enum(["true", "false"]),
  });

  const FIELD_META: Record<
    keyof z.infer<typeof emailSettingsSchema>,
    {
      label: string;
      type: "string" | "boolean" | "password";
      description?: string;
    }
  > = {
    "mail.host": { label: "SMTP Host", type: "string" },
    "mail.port": { label: "SMTP Port", type: "string" },
    "mail.base_url": {
      label: "Base URL",
      type: "string",
      description: "Base URL for email links and references",
    },
    "mail.username": { label: "Username", type: "string" },
    "mail.password": {
      label: "Password",
      type: "password",
    },
    "mail.protocol": { label: "Protocol", type: "string" },
    "mail.from": { label: "From Address", type: "string" },
    "mail.fromName": { label: "Sender Name", type: "string" },
    "mail.smtp.auth": { label: "SMTP Auth", type: "boolean" },
    "mail.smtp.starttls.enable": { label: "STARTTLS", type: "boolean" },
    "mail.smtp.ssl.enable": { label: "SSL", type: "boolean" },
    "mail.debug": { label: "Debug Logging", type: "boolean" },
  };

  const FIELD_GROUPS: Record<string, (keyof typeof FIELD_META)[]> = {
    "SMTP Server": ["mail.host", "mail.port", "mail.protocol", "mail.base_url"],
    Authentication: ["mail.username", "mail.password", "mail.smtp.auth"],
    "Sender Info": ["mail.from", "mail.fromName"],
    "Advanced Options": [
      "mail.smtp.starttls.enable",
      "mail.smtp.ssl.enable",
      "mail.debug",
    ],
  };

  function toAppSettings(input: Record<string, string>): AppSettingDTO[] {
    return Object.entries(input).map(([key, value]) => ({
      key,
      value,
      type: key === "mail.password" ? "secret:aes256" : "string",
      group: "mail",
      description:
        FIELD_META[key as keyof typeof FIELD_META]?.description ?? null,
    }));
  }

  function fromAppSettings(settings: AppSettingDTO[]): Record<string, string> {
    return Object.fromEntries(settings.map(({ key, value }) => [key, value]));
  }

  // Define the form state with proper typing to match the schema
  const [formValues, setFormValues] = useState<
    z.infer<typeof emailSettingsSchema>
  >({
    "mail.host": "",
    "mail.port": "",
    "mail.base_url": "",
    "mail.username": "",
    "mail.password": "",
    "mail.protocol": "smtp",
    "mail.from": "",
    "mail.fromName": "",
    "mail.smtp.auth": "true" as const,
    "mail.smtp.starttls.enable": "true" as const,
    "mail.smtp.ssl.enable": "false" as const,
    "mail.debug": "false" as const,
  });

  // Initialize form with proper typing
  const form = useForm<z.infer<typeof emailSettingsSchema>>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: formValues,
    mode: "onSubmit", // Only validate on form submission
    reValidateMode: "onSubmit", // Only revalidate on form submission
  });

  // Handle field value change with proper typing
  const handleValueChange = (
    fieldName: keyof z.infer<typeof emailSettingsSchema>,
    value: string,
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // Update the form state
    form.setValue(fieldName, value as never, {
      shouldDirty: true,
      shouldValidate: false,
    });

    // Clear the error for this field if it exists
    if (form.formState.errors[fieldName]) {
      form.clearErrors(fieldName);
    }

    // Optionally validate just this field for immediate feedback
    if (submitAttempted) {
      // Only validate individual fields after first submission attempt
      validateField(fieldName, value);
    }
  };

  // Validate a single field
  const validateField = (
    fieldName: keyof z.infer<typeof emailSettingsSchema>,
    value: string,
  ) => {
    try {
      // Create a schema just for this field
      const fieldSchema = z.object({
        [fieldName]: emailSettingsSchema.shape[fieldName],
      });

      // Validate just this field
      fieldSchema.parse({ [fieldName]: value });

      // Clear error if validation passes
      form.clearErrors(fieldName);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Set error if validation fails
        const fieldError = error.issues.find((e) => e.path[0] === fieldName);
        if (fieldError) {
          form.setError(fieldName, {
            type: "manual",
            message: fieldError.message,
          });
        }
      }
    }
  };

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await findAppSettingsByGroup("mail", setError);
        if (settings && settings.length > 0) {
          const loadedValues = fromAppSettings(settings);

          // Ensure all required boolean fields have default values
          const completeValues = {
            ...formValues,
            ...loadedValues,
            "mail.smtp.auth": (loadedValues["mail.smtp.auth"] || "true") as
              | "true"
              | "false",
            "mail.smtp.starttls.enable": (loadedValues[
              "mail.smtp.starttls.enable"
            ] || "true") as "true" | "false",
            "mail.smtp.ssl.enable": (loadedValues["mail.smtp.ssl.enable"] ||
              "false") as "true" | "false",
            "mail.debug": (loadedValues["mail.debug"] || "false") as
              | "true"
              | "false",
            "mail.protocol": loadedValues["mail.protocol"] || "smtp",
          };

          // Set our local state
          setFormValues(completeValues);

          // Reset form with loaded values
          form.reset(completeValues);
        }
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setError]);

  // Handle form submission
  const onSubmit = async () => {
    setSubmitAttempted(true);

    // First validate form against our custom values
    const validationResult =
      await emailSettingsSchema.safeParseAsync(formValues);

    if (validationResult.success) {
      const payload = toAppSettings(formValues);

      await updateAppSettings(payload, setError);
      toast.info(t.mail("save_successfully"));
      router.push("/portal/settings");
    } else {
      // Clear all existing errors first
      form.clearErrors();

      // Set the errors in the form
      const errors = validationResult.error.flatten().fieldErrors;
      Object.entries(errors).forEach(([field, errorMessages]) => {
        if (errorMessages && errorMessages.length > 0) {
          form.setError(field as keyof z.infer<typeof emailSettingsSchema>, {
            type: "manual",
            message: errorMessages[0],
          });
        }
      });
    }
  };

  if (loading) {
    return (
      <p className="text-muted-foreground text-sm">
        {t.common.misc("loading_data")}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-row justify-between">
        <Heading title={t.mail("title")} description={t.mail("description")} />
      </div>
      <Separator />
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-6 max-w-5xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(FIELD_GROUPS).map(([groupLabel, keys]) => (
              <div
                key={groupLabel}
                className="space-y-4 border p-4 rounded-lg h-full"
              >
                <h3 className="text-lg font-semibold mb-2">{groupLabel}</h3>
                {keys.map((key) => {
                  const meta = FIELD_META[key];

                  return (
                    <FormField
                      key={key}
                      control={form.control}
                      name={key}
                      render={() => (
                        <FormItem className="space-y-2">
                          <FormLabel>
                            {meta.label}
                            {(key === "mail.host" || key === "mail.port") &&
                              " *"}
                          </FormLabel>
                          <FormControl>
                            {meta.type === "boolean" ? (
                              <Select
                                value={
                                  formValues[key as keyof typeof formValues]
                                }
                                onValueChange={(value) =>
                                  handleValueChange(key, value)
                                }
                                defaultValue={
                                  key.includes("ssl") || key.includes("debug")
                                    ? "false"
                                    : "true"
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">True</SelectItem>
                                  <SelectItem value="false">False</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : meta.type === "password" ? (
                              <div className="relative">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  value={
                                    formValues[key as keyof typeof formValues]
                                  }
                                  onChange={(e) =>
                                    handleValueChange(key, e.target.value)
                                  }
                                  className="pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowPassword((prev) => !prev)
                                  }
                                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                                >
                                  {showPassword ? (
                                    <EyeOffIcon className="w-4 h-4" />
                                  ) : (
                                    <EyeIcon className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <Input
                                value={
                                  formValues[key as keyof typeof formValues]
                                }
                                onChange={(e) =>
                                  handleValueChange(key, e.target.value)
                                }
                              />
                            )}
                          </FormControl>
                          {meta.description && (
                            <FormDescription>
                              {meta.description}
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {submitAttempted && Object.keys(form.formState.errors).length > 0 && (
            <div className="text-destructive font-medium p-3 bg-destructive/10 rounded-md">
              Please fill in all required fields before submitting
            </div>
          )}

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? t.common.buttons("saving")
              : t.common.buttons("save")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
