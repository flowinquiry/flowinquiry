"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/v4";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
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
import { Spinner } from "@/components/ui/spinner";
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
      <div
        className="flex justify-center items-center h-full"
        data-testid="authority-form-loading"
      >
        <Spinner data-testid="authority-form-spinner">
          {t.common.misc("loading_data")}
        </Spinner>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="authority-form-container">
      <Breadcrumbs items={breadcrumbItems} />
      <Form {...form}>
        <div data-testid="authority-form-content">
          <form
            className="grid grid-cols-1 gap-4"
            onSubmit={form.handleSubmit(onSubmit)}
            data-testid="authority-form"
          >
            {/* Authority Section */}
            <div
              className="space-y-4"
              data-testid="authority-form-details-section"
            >
              <h2 className="text-xl font-bold">
                {t.authorities.form("title")}
              </h2>
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
                        testId="authority-form-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {authorityResourcePermissions.length > 0 && (
              <div
                className="space-y-4 mt-6"
                data-testid="authority-form-permissions-section"
              >
                <h2 className="text-xl font-bold">
                  {t.authorities.form("permissions_section")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {authorityResourcePermissions.map((perm, index) => (
                    <FormField
                      key={perm.resourceName}
                      control={form.control}
                      name={`permissions.${index}.permission`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{perm.resourceName}</FormLabel>
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
                                    {option}
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
              </div>
            )}

            <div
              className="flex items-center gap-4 pt-4"
              data-testid="authority-form-buttons"
            >
              <SubmitButton
                label={t.common.buttons("save")}
                labelWhileLoading="Save changes ..."
                testId="authority-form-submit"
              />
              <Button
                variant="secondary"
                onClick={() => router.back()}
                testId="authority-form-discard"
              >
                {t.common.buttons("discard")}
              </Button>
            </div>
          </form>
        </div>
      </Form>
    </div>
  );
};

export default AuthorityForm;
