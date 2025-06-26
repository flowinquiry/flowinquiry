"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/v4";

import TeamRoleSelectField from "@/components/teams/team-role-select";
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
import { addUsersToTeam, findUsersNotInTeam } from "@/lib/actions/teams.action";
import { useError } from "@/providers/error-provider";
import { TeamDTO } from "@/types/teams";

type AddUserToTeamDialogProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  teamEntity: TeamDTO;
  onSaveSuccess: () => void;
  forceManagerAssignment?: boolean;
};

const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
  disable: z.boolean().optional(),
});

const FormSchema = z.object({
  users: z.array(optionSchema).min(1),
  role: z.string(),
});

const AddUserToTeamDialog: React.FC<AddUserToTeamDialogProps> = ({
  open,
  setOpen,
  teamEntity,
  onSaveSuccess,
  forceManagerAssignment = false,
}) => {
  const { setError } = useError();
  const t = useAppClientTranslations();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (data && data.users) {
      const userIds = data.users.map((user) => Number(user.value));
      await addUsersToTeam(teamEntity.id!, userIds, data.role, setError);
      setOpen(false);
      onSaveSuccess();
    }
  };

  const searchUsers = async (userTerm: string) => {
    const users = await findUsersNotInTeam(userTerm, teamEntity.id!, setError);
    return Promise.all(
      users.map((user) => ({
        value: `${user.id}`,
        label: `${user.firstName} ${user.lastName}`,
      })),
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} data-testid="add-user-dialog">
      <DialogContent
        className="sm:max-w-[425px]"
        data-testid="add-user-dialog-content"
      >
        <DialogHeader>
          <DialogTitle data-testid="add-user-dialog-title">
            {forceManagerAssignment
              ? t.teams.dashboard("add_user_dialog.title1")
              : t.teams.dashboard("add_user_dialog.title2", {
                  teamName: teamEntity.name,
                })}
          </DialogTitle>
          <DialogDescription data-testid="add-user-dialog-description">
            {forceManagerAssignment
              ? t.teams.dashboard("add_user_dialog.description1")
              : t.teams.dashboard("add_user_dialog.description2")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            data-testid="add-user-form"
          >
            <FormField
              control={form.control}
              name="users"
              render={({ field }) => (
                <FormItem data-testid="users-form-item">
                  <FormLabel>
                    {t.teams.dashboard("add_user_dialog.users")}
                  </FormLabel>
                  <FormControl>
                    <MultipleSelector
                      {...field}
                      onSearch={searchUsers}
                      placeholder={t.teams.dashboard(
                        "add_user_dialog.user_select_place_holder",
                      )}
                      emptyIndicator={
                        <p
                          className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400"
                          data-testid="no-results-indicator"
                        >
                          {t.common.misc("no_results_found")}
                        </p>
                      }
                      data-testid="users-selector"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <TeamRoleSelectField />
            <SubmitButton
              label={t.common.buttons("save")}
              labelWhileLoading={t.common.buttons("saving")}
              data-testid="submit-button"
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserToTeamDialog;
