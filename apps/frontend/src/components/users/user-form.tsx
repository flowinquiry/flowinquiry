"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/v4";

import { Heading } from "@/components/heading";
import { CountrySelectField } from "@/components/shared/countries-select";
import TimezoneSelect from "@/components/shared/timezones-select";
import UserSelectField from "@/components/shared/user-select";
import { Button } from "@/components/ui/button";
import {
  ExtInputField,
  ExtTextAreaField,
  SubmitButton,
} from "@/components/ui/ext-form";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
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
  const [loading, setLoading] = useState(!!userId); // Only show loading if userId is defined
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
  const title = isEdit
    ? t.users.form("edit_user", {
        firstName: user?.firstName ?? "",
        lastName: user?.lastName ?? "",
      })
    : t.users.form("create_user");
  const description = isEdit ? `Edit user` : "Add a new user";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>{t.common.misc("loading_data")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4" data-testid="user-form-container">
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
      </div>
      <Separator />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-6xl"
          data-testid="user-form"
        >
          {/* Email field spans the entire row */}
          <div className="sm:col-span-2">
            <ExtInputField
              form={form}
              required={true}
              fieldName="email"
              label={t.users.form("email")}
              placeholder={t.users.form("email")}
              className="w-[20rem]"
              data-testid="user-email-input"
            />
          </div>

          <UserSelectField
            form={form}
            fieldName="managerId"
            label="Manager"
            data-testid="user-manager-select"
          />
          <AuthoritiesSelect
            form={form}
            label={t.users.form("authorities")}
            fieldName="authorities"
            required={true}
            data-testid="user-authorities-select"
          />
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
          <ExtTextAreaField
            form={form}
            fieldName="about"
            label={t.users.form("about")}
            placeholder={t.users.form("about")}
            data-testid="user-about-textarea"
          />
          <ExtInputField
            form={form}
            fieldName="title"
            label={t.users.form("title")}
            placeholder={t.users.form("title")}
            data-testid="user-title-input"
          />
          <TimezoneSelect
            form={form}
            fieldName="timezone"
            label={t.users.form("timezone")}
            placeholder={t.users.form("timezone")}
            required={true}
            data-testid="user-timezone-select"
          />
          <ExtInputField
            form={form}
            fieldName="address"
            label={t.users.form("address")}
            placeholder={t.users.form("address")}
            data-testid="user-address-input"
          />
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

          {/* Buttons section spans the entire row */}
          <div className="sm:col-span-2 flex flex-row gap-4">
            <SubmitButton
              label={
                isEdit ? t.common.buttons("update") : t.common.buttons("invite")
              }
              labelWhileLoading={
                isEdit ? t.users.form("updating") : t.users.form("inviting")
              }
              data-testid="user-submit-button"
            />
            <Button
              variant="secondary"
              onClick={() => router.back()}
              data-testid="user-discard-button"
            >
              {t.common.buttons("discard")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
