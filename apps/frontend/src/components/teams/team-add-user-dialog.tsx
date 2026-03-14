"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Users } from "lucide-react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import TeamRoleSelectField from "@/components/teams/team-role-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
    defaultValues: { users: [], role: "" },
  });

  const [dialogKey, setDialogKey] = React.useState(0);

  // Reset form and force remount of inner components every time the dialog opens
  useEffect(() => {
    if (open) {
      form.reset({ users: [], role: "" });
      setDialogKey((k) => k + 1);
    }
  }, [open, form]);

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
        key={dialogKey}
        className="sm:max-w-115 gap-0 p-0 overflow-hidden"
        data-testid="add-user-dialog-content"
      >
        {/* Header with muted background */}
        <DialogHeader className="px-6 py-5 bg-muted/40 border-b">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-primary/5">
              {forceManagerAssignment ? (
                <Users className="h-5 w-5" />
              ) : (
                <UserPlus className="h-5 w-5" />
              )}
            </div>
            <div className="space-y-1 min-w-0">
              <DialogTitle
                className="text-base font-semibold leading-none"
                data-testid="add-user-dialog-title"
              >
                {forceManagerAssignment
                  ? t.teams.dashboard("add_user_dialog.title1")
                  : t.teams.dashboard("add_user_dialog.title2", {
                      teamName: teamEntity.name,
                    })}
              </DialogTitle>
              <DialogDescription
                className="text-xs text-muted-foreground"
                data-testid="add-user-dialog-description"
              >
                {forceManagerAssignment
                  ? t.teams.dashboard("add_user_dialog.description1")
                  : t.teams.dashboard("add_user_dialog.description2")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form body */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            data-testid="add-user-form"
          >
            <div className="px-6 py-5 space-y-5">
              <FormField
                control={form.control}
                name="users"
                render={({ field }) => (
                  <FormItem data-testid="users-form-item">
                    <FormLabel className="text-sm font-medium">
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
                            className="text-center text-sm leading-10 text-muted-foreground"
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
            </div>

            {/* Footer */}
            <DialogFooter className="px-6 py-4 bg-muted/30 border-t gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t.common.buttons("cancel")}
              </Button>
              <SubmitButton
                label={t.common.buttons("save")}
                labelWhileLoading={t.common.buttons("saving")}
                data-testid="submit-button"
              />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserToTeamDialog;
