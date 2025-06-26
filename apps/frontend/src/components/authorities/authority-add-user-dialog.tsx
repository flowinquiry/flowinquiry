"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/v4";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SubmitButton } from "@/components/ui/ext-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import MultipleSelector from "@/components/ui/multi-select-dynamic";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  addUsersToAuthority,
  findUsersNotInAuthority,
} from "@/lib/actions/authorities.action";
import { AuthorityDTO } from "@/types/authorities";

type AddUserToAuthorityDialogProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  authorityEntity: AuthorityDTO;
  onSaveSuccess: () => void;
};

const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
  disable: z.boolean().optional(),
});

const FormSchema = z.object({
  users: z.array(optionSchema).min(1),
});

const AddUserToAuthorityDialog: React.FC<AddUserToAuthorityDialogProps> = ({
  open,
  setOpen,
  authorityEntity,
  onSaveSuccess,
}) => {
  const t = useAppClientTranslations();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (data && data.users) {
      const userIds = data.users.map((user) => Number(user.value));
      await addUsersToAuthority(authorityEntity.name!, userIds);
      setOpen(false);
      onSaveSuccess();
    }
  };

  const searchUsers = async (userTerm: string) => {
    const users = await findUsersNotInAuthority(
      userTerm,
      authorityEntity.name!,
    );
    return Promise.all(
      users.map((user) => ({
        value: `${user.id}`,
        label: `${user.firstName} ${user.lastName}`,
      })),
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {t.authorities.add("dialog_title", {
              authorityName: authorityEntity.descriptiveName,
            })}
          </DialogTitle>
          <DialogDescription>
            {t.authorities.add("dialog_description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="users"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.authorities.add("users")}</FormLabel>
                  <FormControl>
                    <MultipleSelector
                      {...field}
                      onSearch={searchUsers}
                      placeholder={t.authorities.add(
                        "users_select_place_holder",
                      )}
                      emptyIndicator={
                        <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                          {t.common.misc("no_results_found")}
                        </p>
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SubmitButton
              label={t.common.buttons("save")}
              labelWhileLoading={t.common.buttons("saving")}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserToAuthorityDialog;
