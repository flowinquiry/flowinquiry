"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, MapPin, User } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CountrySelectField } from "@/components/shared/countries-select";
import TimezoneSelect from "@/components/shared/timezones-select";
import UserSelectField from "@/components/shared/user-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExtInputField,
  ExtTextAreaField,
  SubmitButton,
} from "@/components/ui/ext-form";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import AuthoritiesSelect from "@/components/users/authorities-select";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  createUser,
  findUserById,
  updateUser,
} from "@/lib/actions/users.action";
import { obfuscate } from "@/lib/endecode";
import { useError } from "@/providers/error-provider";
import { UserDTO, UserDTOSchema } from "@/types/users";

type UserFormValues = z.infer<typeof UserDTOSchema>;

export const UserForm = ({ userId }: { userId?: number }) => {
  const router = useRouter();
  const t = useAppClientTranslations();
  const [user, setUser] = useState<UserDTO | undefined>();
  const [loading, setLoading] = useState(!!userId);
  const { setError } = useError();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(UserDTOSchema),
    defaultValues: {},
  });

  const { reset } = form;

  useEffect(() => {
    async function fetchUser() {
      if (!userId) return;
      try {
        const userData = await findUserById(userId, setError);
        if (userData) {
          setUser(userData);
          reset(userData);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [userId, reset]);

  async function onSubmit(data: UserDTO) {
    const savedUser = data.id
      ? await updateUser(prepareFormData(data), setError)
      : await createUser(data, setError);
    router.push(`/portal/users/${obfuscate(savedUser.id)}`);
  }

  function prepareFormData(data: UserDTO): FormData {
    const formData = new FormData();
    const userJsonBlob = new Blob([JSON.stringify(data)], {
      type: "application/json",
    });
    formData.append("userDTO", userJsonBlob);
    return formData;
  }

  const isEdit = !!user;

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("users"), link: "/portal/users" },
    ...(isEdit
      ? [
          {
            title: `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
            link: `/portal/users/${obfuscate(user?.id)}`,
          },
          { title: t.common.buttons("edit"), link: "#" },
        ]
      : [{ title: t.common.buttons("add"), link: "#" }]),
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-4" data-testid="user-form-loading">
        <Separator />
        <div className="flex flex-col gap-4">
          {/* Identity skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
          {/* About skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          {/* Location skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-20" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
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
    <div
      className="flex flex-col gap-4 flex-1"
      data-testid="user-form-container"
    >
      <Breadcrumbs items={breadcrumbItems} />
      <Separator />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col flex-1 gap-6"
          data-testid="user-form"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ── Left column: Identity + About ── */}
            <div className="flex flex-col gap-4">
              {/* ── Identity card ── */}
              <Card data-testid="user-form-identity-section">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {t.users.form("identity_section")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email spans full width */}
                  <div className="sm:col-span-2">
                    <ExtInputField
                      form={form}
                      required={true}
                      fieldName="email"
                      label={t.users.form("email")}
                      placeholder={t.users.form("email")}
                      data-testid="user-email-input"
                    />
                  </div>
                  <ExtInputField
                    form={form}
                    required={true}
                    fieldName="firstName"
                    label={t.users.form("first_name")}
                    placeholder={t.users.form("first_name")}
                    data-testid="user-first-name-input"
                  />
                  <ExtInputField
                    form={form}
                    required={true}
                    fieldName="lastName"
                    label={t.users.form("last_name")}
                    placeholder={t.users.form("last_name")}
                    data-testid="user-last-name-input"
                  />
                  <ExtInputField
                    form={form}
                    fieldName="title"
                    label={t.users.form("title")}
                    placeholder={t.users.form("title")}
                    data-testid="user-title-input"
                  />
                  <UserSelectField
                    form={form}
                    fieldName="managerId"
                    label={t.users.form("manager")}
                    data-testid="user-manager-select"
                  />
                  <div className="sm:col-span-2">
                    <AuthoritiesSelect
                      form={form}
                      label={t.users.form("authorities")}
                      fieldName="authorities"
                      required={true}
                      data-testid="user-authorities-select"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* ── About card ── */}
              <Card data-testid="user-form-about-section">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {t.users.form("about")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ExtTextAreaField
                    form={form}
                    fieldName="about"
                    label={t.users.form("about")}
                    placeholder={t.users.form("about")}
                    data-testid="user-about-textarea"
                  />
                </CardContent>
              </Card>
            </div>
            {/* end left column */}

            {/* ── Right column: Location ── */}
            <div className="flex flex-col gap-4">
              {/* ── Location card ── */}
              <Card data-testid="user-form-location-section">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {t.users.form("location_section")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <ExtInputField
                      form={form}
                      fieldName="address"
                      label={t.users.form("address")}
                      placeholder={t.users.form("address")}
                      data-testid="user-address-input"
                    />
                  </div>
                  <ExtInputField
                    form={form}
                    fieldName="city"
                    label={t.users.form("city")}
                    placeholder={t.users.form("city")}
                    data-testid="user-city-input"
                  />
                  <ExtInputField
                    form={form}
                    fieldName="state"
                    label={t.users.form("state")}
                    placeholder={t.users.form("state")}
                    data-testid="user-state-input"
                  />
                  <CountrySelectField
                    form={form}
                    fieldName="country"
                    label={t.users.form("country")}
                    data-testid="user-country-select"
                  />
                  <TimezoneSelect
                    form={form}
                    fieldName="timezone"
                    label={t.users.form("timezone")}
                    placeholder={t.users.form("timezone")}
                    required={true}
                    data-testid="user-timezone-select"
                  />
                </CardContent>
              </Card>
            </div>
            {/* end right column */}
          </div>
          {/* end lg:grid-cols-2 */}

          {/* ── Sticky save bar ── */}
          <div
            className="mt-auto sticky bottom-0 flex items-center justify-end gap-3 rounded-xl border bg-background/80 px-4 py-3 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/60"
            data-testid="user-form-buttons"
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              data-testid="user-discard-button"
            >
              {t.common.buttons("discard")}
            </Button>
            <SubmitButton
              label={
                isEdit ? t.common.buttons("update") : t.common.buttons("invite")
              }
              labelWhileLoading={
                isEdit ? t.users.form("updating") : t.users.form("inviting")
              }
              data-testid="user-submit-button"
            />
          </div>
        </form>
      </Form>
    </div>
  );
};
