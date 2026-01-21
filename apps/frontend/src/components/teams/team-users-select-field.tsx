"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import React, { useEffect, useState } from "react";
import { FieldValues, Path } from "react-hook-form";

import { UserAvatar } from "@/components/shared/avatar-display";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ExtInputProps } from "@/components/ui/ext-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { findMembersByTeamId } from "@/lib/actions/teams.action";
import { cn } from "@/lib/utils";
import { useError } from "@/providers/error-provider";
import { UserWithTeamRoleDTO } from "@/types/teams";
import { UiAttributes } from "@/types/ui-components";

const TeamUserSelectField = <T extends FieldValues = FieldValues>({
  form,
  fieldName,
  label,
  teamId,
  onUserSelect,
}: ExtInputProps<T> &
  UiAttributes & {
    teamId: number;
    onUserSelect?: (user: UserWithTeamRoleDTO | null) => void; // Allow null for unselect
  }) => {
  const [users, setUsers] = useState<UserWithTeamRoleDTO[]>([]);
  const { setError } = useError();

  useEffect(() => {
    async function fetchUsers() {
      findMembersByTeamId(teamId, setError).then((data) => setUsers(data));
    }
    fetchUsers();
  }, [teamId, setError]);

  return (
    <FormField
      control={form.control}
      name={fieldName as Path<T>}
      render={({ field }) => (
        <FormItem className="grid grid-cols-1">
          {label && label.trim() && <FormLabel>{label}</FormLabel>}
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-[200px] justify-between",
                    !field.value && "text-muted-foreground",
                  )}
                >
                  {(() => {
                    const selectedUser = users.find(
                      (user) => user.id === field.value,
                    );
                    return selectedUser ? (
                      <div className="flex items-center gap-2">
                        <UserAvatar imageUrl={selectedUser.imageUrl} />
                        <span>{`${selectedUser.firstName} ${selectedUser.lastName}`}</span>
                      </div>
                    ) : (
                      "Select user"
                    );
                  })()}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[18rem] p-0">
              <Command>
                <CommandInput placeholder="Search user..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No user found.</CommandEmpty>
                  <CommandGroup>
                    {/* Option to unassign a user */}
                    <CommandItem
                      value="none"
                      onSelect={() => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        form.setValue(fieldName as Path<T>, null as any); // Reset the value
                        if (onUserSelect) {
                          onUserSelect(null);
                        }
                      }}
                      className="gap-2 text-gray-500"
                    >
                      None (Unassign User)
                      <Check
                        className={cn(
                          "ml-auto",
                          !field.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                    {/* Render user options */}
                    {users.map((user) => (
                      <CommandItem
                        value={user.firstName!}
                        key={user.id}
                        onSelect={() => {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          form.setValue(fieldName as Path<T>, user.id as any);
                          if (onUserSelect) {
                            onUserSelect(user);
                          }
                        }}
                        className="gap-2"
                      >
                        <UserAvatar imageUrl={user.imageUrl} />
                        {user.firstName} {user.lastName} ({user.teamRole})
                        <Check
                          className={cn(
                            "ml-auto",
                            user.id === field.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TeamUserSelectField;
