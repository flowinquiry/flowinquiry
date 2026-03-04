"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/ext-form";
import {
  Form,
  FormControl,
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
import { Textarea } from "@/components/ui/textarea";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  batchSavePermissions,
  createAuthority,
  findAuthorityByName,
  findPermissionsByAuthorityName,
} from "@/lib/actions/authorities.action";
import { obfuscate } from "@/lib/endecode";
import { useError } from "@/providers/error-provider";
import {
  AuthorityDTO,
  AuthorityDTOSchema,
  AuthorityResourcePermissionDTO,
  AuthorityResourcePermissionDTOSchema,
} from "@/types/authorities";
import { PermissionLevel } from "@/types/resources";

export const formSchema = z.object({
  authority: AuthorityDTOSchema,
  permissions: z.array(AuthorityResourcePermissionDTOSchema),
});

const permissionOptions: PermissionLevel[] = [
  "NONE",
  "READ",
  "WRITE",
  "ACCESS",
];

const AuthorityForm = ({
  authorityId,
}: {
  authorityId: string | undefined;
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(!!authorityId);
  const [authorityResourcePermissions, setAuthorityResourcePermissions] =
    useState<Array<AuthorityResourcePermissionDTO>>([]);
  const [authority, setAuthority] = useState<AuthorityDTO | undefined>();
  const { setError } = useError();
  const t = useAppClientTranslations();

  type FormInput = z.infer<typeof formSchema>;

  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      authority: {
        name: "",
        descriptiveName: "",
        description: "",
        systemRole: false,
      },
      permissions: [],
    },
  });

  const { reset } = form;

  useEffect(() => {
    async function fetchAuthorityAndPermissions() {
      if (!authorityId) return; // Skip fetching if authorityId is undefined

      try {
        const fetchedAuthority = await findAuthorityByName(
          authorityId,
          setError,
        );

        if (fetchedAuthority) {
          setAuthority(fetchedAuthority);

          const fetchedPermissions = await findPermissionsByAuthorityName(
            fetchedAuthority.name,
            setError,
          );

          setAuthorityResourcePermissions(
            fetchedPermissions.map((perm) => ({
              ...perm,
              permission: perm.permission || "NONE",
            })),
          );

          // Reset form values to reflect the fetched authority and permissions
          reset({
            authority: fetchedAuthority,
            permissions: fetchedPermissions.map((perm) => ({
              ...perm,
              permission: perm.permission || "NONE",
            })),
          });
        }
      } finally {
        setLoading(false);
      }
    }

    fetchAuthorityAndPermissions();
  }, [authorityId, reset]);

  const onSubmit = async (formData: FormInput) => {
    const transformed = {
      ...formData,
      authority: {
        ...formData.authority,
        name:
          formData.authority.name?.trim() || formData.authority.descriptiveName,
      },
    };

    await createAuthority(transformed.authority, setError);
    await batchSavePermissions(transformed.permissions, setError);
    router.push(
      `/portal/settings/authorities/${obfuscate(transformed.authority.name)}`,
    );
  };

  const isSystemRole = authority?.systemRole;

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    {
      title: t.common.navigation("authorities"),
      link: "/portal/settings/authorities",
    },
    ...(authority
      ? [
          {
            title: `${authority.descriptiveName}`,
            link: `/portal/settings/authorities/${obfuscate(authority.name)}`,
          },
          { title: t.common.buttons("edit"), link: "#" },
        ]
      : [{ title: t.common.buttons("add"), link: "#" }]),
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-4" data-testid="authority-form-loading">
        <div className="h-5 w-64 animate-pulse rounded bg-muted" />
        <Separator />
        <div className="flex flex-col gap-4 max-w-3xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="authority-form-container">
      <Breadcrumbs items={breadcrumbItems} />
      <Separator />
      <Form {...form}>
        <form
          className="flex flex-col gap-6"
          onSubmit={form.handleSubmit(onSubmit)}
          data-testid="authority-form"
        >
          <div
            className="flex flex-col gap-4 max-w-3xl"
            data-testid="authority-form-content"
          >
            {/* Authority details card */}
            <Card data-testid="authority-form-details-section">
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  {t.authorities.form("title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <FormField
                  control={form.control}
                  name="authority.descriptiveName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.authorities.form("name")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isSystemRole}
                          testId="authority-form-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="authority.description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.authorities.form("description")}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          rows={3}
                          testId="authority-form-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Permissions card */}
            {authorityResourcePermissions.length > 0 && (
              <Card data-testid="authority-form-permissions-section">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    {t.authorities.form("permissions_section")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {authorityResourcePermissions.map((perm, index) => (
                      <FormField
                        key={perm.resourceName}
                        control={form.control}
                        name={`permissions.${index}.permission`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t.common.navigation(perm.resourceName!)}
                            </FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value ?? "NONE"}
                                disabled={isSystemRole}
                                testId={`authority-form-permission-${index}`}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t.authorities.form(
                                      "permission_select_place_holder",
                                    )}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {permissionOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {t.common.permission(option)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sticky save bar */}
          <div
            className="sticky bottom-0 max-w-3xl flex items-center justify-end gap-3 rounded-xl border bg-background/80 px-4 py-3 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/60"
            data-testid="authority-form-buttons"
          >
            <Button
              variant="outline"
              onClick={() => router.back()}
              testId="authority-form-discard"
            >
              {t.common.buttons("discard")}
            </Button>
            <SubmitButton
              label={t.common.buttons("save")}
              labelWhileLoading={t.common.buttons("saving")}
              testId="authority-form-submit"
            />
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AuthorityForm;
