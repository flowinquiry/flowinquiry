"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BookOpen,
  EyeIcon,
  EyeOffIcon,
  Lock,
  Mail,
  Server,
  Settings2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  findAppSettingsByGroup,
  updateAppSettings,
} from "@/lib/actions/settings.action";
import { useError } from "@/providers/error-provider";
import { AppSettingDTO } from "@/types/commons";

const GROUP_ICONS: Record<string, React.ReactNode> = {
  "SMTP Server": <Server className="h-4 w-4" />,
  Authentication: <Lock className="h-4 w-4" />,
  "Sender Info": <Mail className="h-4 w-4" />,
  "Advanced Options": <Settings2 className="h-4 w-4" />,
};

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
  const handleValueChange = (fieldName: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldName]: value as any,
    }));

    // Update the form state
    form.setValue(fieldName as any, value as any, {
      shouldDirty: true,
      shouldValidate: false,
    });

    // Clear the error for this field if it exists
    if (
      form.formState.errors[
        fieldName as keyof z.infer<typeof emailSettingsSchema>
      ]
    ) {
      form.clearErrors(fieldName as any);
    }

    // Optionally validate just this field for immediate feedback
    if (submitAttempted) {
      // Only validate individual fields after first submission attempt
      validateField(fieldName, value);
    }
  };

  // Validate a single field
  const validateField = (fieldName: string, value: string) => {
    try {
      // Create a schema just for this field
      const fieldSchema = z.object({
        [fieldName]:
          emailSettingsSchema.shape[
            fieldName as keyof z.infer<typeof emailSettingsSchema>
          ],
      });

      // Validate just this field
      fieldSchema.parse({ [fieldName]: value });

      // Clear error if validation passes
      form.clearErrors(fieldName as any);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Set error if validation fails
        const fieldError = error.issues.find((e) => e.path[0] === fieldName);
        if (fieldError) {
          form.setError(fieldName as any, {
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
          form.setError(field as any, {
            type: "manual",
            message: errorMessages[0],
          });
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Heading title={t.mail("title")} description={t.mail("description")} />
        <Separator />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-between">
        <Heading title={t.mail("title")} description={t.mail("description")} />
      </div>
      <Separator />

      {/* Documentation banner */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
        <BookOpen className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Need help configuring your SMTP server? Follow our step-by-step guide
          to set up email delivery correctly.{" "}
          <a
            href="https://docs.flowinquiry.io/user_guides/administrator/smtp_server"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-200"
          >
            View SMTP configuration guide →
          </a>
        </span>
      </div>

      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="flex flex-col gap-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {" "}
            {Object.entries(FIELD_GROUPS).map(([groupLabel, keys]) => (
              <Card key={groupLabel} className="flex flex-col">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {GROUP_ICONS[groupLabel]}
                    {groupLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pt-4 space-y-4">
                  {keys.map((key) => {
                    const meta = FIELD_META[key];
                    const fieldKey = key as any;

                    return (
                      <FormField
                        key={key}
                        control={form.control as any}
                        name={fieldKey}
                        render={() => (
                          <FormItem className="space-y-1.5">
                            <FormLabel>
                              {meta.label}
                              {(key === "mail.host" || key === "mail.port") && (
                                <span className="ml-0.5 text-destructive">
                                  *
                                </span>
                              )}
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
                                    <SelectItem value="true">
                                      Enabled
                                    </SelectItem>
                                    <SelectItem value="false">
                                      Disabled
                                    </SelectItem>
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
                                    className="absolute right-2 top-2 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label={
                                      showPassword
                                        ? "Hide password"
                                        : "Show password"
                                    }
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
                </CardContent>
              </Card>
            ))}
          </div>

          {submitAttempted && Object.keys(form.formState.errors).length > 0 && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive">
              Please fill in all required fields before submitting.
            </div>
          )}

          {/* Sticky save bar */}
          <div className="sticky bottom-0 flex items-center justify-end gap-3 rounded-xl border bg-background/80 px-4 py-3 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/portal/settings")}
            >
              {t.common.buttons("cancel")}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? t.common.buttons("saving")
                : t.common.buttons("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
