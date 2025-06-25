"use client";

import { Ellipsis, Plus, Trash } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import useSWR from "swr";

import { Heading } from "@/components/heading";
import { TeamAvatar, UserAvatar } from "@/components/shared/avatar-display";
import LoadingPlaceHolder from "@/components/shared/loading-place-holder";
import AddUserToTeamDialog from "@/components/teams/team-add-user-dialog";
import TeamNavLayout from "@/components/teams/team-nav";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  deleteUserFromTeam,
  findMembersByTeamId,
} from "@/lib/actions/teams.action";
import { obfuscate } from "@/lib/endecode";
import { BreadcrumbProvider } from "@/providers/breadcrumb-provider";
import { useError } from "@/providers/error-provider";
import { useTeam } from "@/providers/team-provider";
import { useUserTeamRole } from "@/providers/user-team-role-provider";
import { PermissionUtils } from "@/types/resources";
import { UserWithTeamRoleDTO } from "@/types/teams";

const TeamUsersView = () => {
  const team = useTeam();
  const permissionLevel = usePagePermission();
  const teamRole = useUserTeamRole().role;
  const { setError } = useError();
  const t = useAppClientTranslations();

  const [open, setOpen] = useState(false);
  const [notDeleteOnlyManagerDialogOpen, setNotDeleteOnlyManagerDialogOpen] =
    useState(false);

  // SWR fetcher
  const {
    data: items = [],
    error,
    isLoading,
    mutate,
  } = useSWR(team.id ? `/api/team/${team.id}/members` : null, async () =>
    findMembersByTeamId(team.id!, setError),
  );

  if (error) {
    return <p className="text-red-500">Failed to load team members.</p>;
  }

  const removeUserOutTeam = async (user: UserWithTeamRoleDTO) => {
    const isOnlyManager =
      user.teamRole === "manager" &&
      items.filter((u) => u.teamRole === "manager").length === 1;

    if (isOnlyManager) {
      setNotDeleteOnlyManagerDialogOpen(true);
      return;
    }

    await deleteUserFromTeam(team.id!, user.id!, setError);
    await mutate(); // Re-fetch the team members after deletion
  };

  // Group users by role
  const groupedUsers = items.reduce<Record<string, UserWithTeamRoleDTO[]>>(
    (groups, user) => {
      const role = user.teamRole || "unassigned";
      if (!groups[role]) groups[role] = [];
      groups[role].push(user);
      return groups;
    },
    {},
  );

  // Define role order
  const roleOrder = ["manager", "member", "guest", "unassigned"];

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("teams"), link: "/portal/teams" },
    { title: team.name, link: `/portal/teams/${obfuscate(team.id)}` },
    { title: t.common.navigation("members"), link: "#" },
  ];

  return (
    <BreadcrumbProvider items={breadcrumbItems}>
      <TeamNavLayout teamId={team.id!}>
        <div
          className="grid grid-cols-1 gap-4"
          data-testid="team-users-container"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger>
                  <TeamAvatar
                    imageUrl={team.logoUrl}
                    size="w-20 h-20"
                    data-testid="team-avatar"
                  />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs whitespace-pre-wrap break-words">
                  <div className="text-left">
                    <p className="font-bold">{team.name}</p>
                    <p className="text-sm ">
                      {team.slogan ?? t.teams.common("default_slogan")}
                    </p>
                    {team.description && (
                      <p className="text-sm ">{team.description}</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
              <Heading
                title={t.teams.users("title", { count: items.length })}
                description={t.teams.users("description")}
              />
            </div>
            {(PermissionUtils.canWrite(permissionLevel) ||
              teamRole === "manager") && (
              <div>
                <Button
                  onClick={() => setOpen(true)}
                  data-testid="add-user-button"
                >
                  <Plus /> {t.teams.users("add_user")}
                </Button>
                <AddUserToTeamDialog
                  open={open}
                  setOpen={setOpen}
                  teamEntity={team}
                  onSaveSuccess={() => mutate()} // Trigger SWR re-fetch
                />
              </div>
            )}
          </div>

          {isLoading ? (
            <LoadingPlaceHolder
              message={t.common.misc("loading_data")}
              data-testid="team-users-loading"
            />
          ) : (
            roleOrder.map(
              (role) =>
                groupedUsers[role] && (
                  <div
                    key={role}
                    className="mb-6"
                    data-testid={`team-users-role-${role}`}
                  >
                    <h2
                      className="text-lg font-bold mb-4"
                      data-testid={`team-users-role-title-${role}`}
                    >
                      {t.teams.roles(role)}
                    </h2>
                    <div
                      className="flex flex-row flex-wrap gap-4 content-around"
                      data-testid={`team-users-role-list-${role}`}
                    >
                      {groupedUsers[role].map((user) => (
                        <div
                          key={user.id}
                          className="w-md flex flex-row gap-4 border px-4 py-4 rounded-2xl relative"
                          data-testid={`team-user-card-${user.id}`}
                        >
                          <div>
                            <UserAvatar
                              imageUrl={user.imageUrl}
                              size="w-24 h-24"
                              className="cursor-pointer"
                              data-testid={`team-user-avatar-${user.id}`}
                            />
                          </div>
                          <div>
                            <div className="text-xl">
                              <Button variant="link" asChild className="px-0">
                                <Link
                                  href={`/portal/users/${obfuscate(user.id)}`}
                                  data-testid={`team-user-name-link-${user.id}`}
                                >
                                  {user.firstName}, {user.lastName}
                                </Link>
                              </Button>
                            </div>
                            <div data-testid={`team-user-email-${user.id}`}>
                              {t.users.form("email")}:{" "}
                              <Button variant="link" className="px-0 py-0 h-0">
                                <Link href={`mailto:${user.email}`}>
                                  {user.email}
                                </Link>
                              </Button>
                            </div>
                            <div data-testid={`team-user-timezone-${user.id}`}>
                              {t.users.form("timezone")}: {user.timezone}
                            </div>
                            <div data-testid={`team-user-title-${user.id}`}>
                              {t.users.form("title")}: {user.title}
                            </div>
                          </div>
                          {(PermissionUtils.canWrite(permissionLevel) ||
                            teamRole === "manager") && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Ellipsis
                                  className="cursor-pointer absolute top-2 right-2 text-gray-400"
                                  data-testid={`team-user-actions-${user.id}`}
                                />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-56">
                                <TooltipProvider>
                                  <Tooltip>
                                    <DropdownMenuItem
                                      className="w-full flex items-center gap-2 cursor-pointer px-4 py-2"
                                      onClick={() => removeUserOutTeam(user)}
                                      data-testid={`team-user-remove-${user.id}`}
                                    >
                                      <TooltipTrigger className="w-full flex items-center gap-2">
                                        <Trash className="w-4 h-4 shrink-0" />
                                        <span className="flex-1 text-left">
                                          {t.teams.users("remove_user")}
                                        </span>
                                      </TooltipTrigger>
                                    </DropdownMenuItem>
                                    <TooltipContent>
                                      <p>
                                        <p>
                                          {t.teams.users.rich(
                                            "remove_user_from_team",
                                            {
                                              b: (chunks) => (
                                                <strong>{chunks}</strong>
                                              ),
                                              firstName: user.firstName!,
                                              lastName: user.lastName!,
                                              teamName: team.name,
                                            },
                                          )}
                                        </p>
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ),
            )
          )}
          <AlertDialog open={notDeleteOnlyManagerDialogOpen}>
            <AlertDialogContent data-testid="cannot-remove-manager-dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t.teams.users("remove_only_manager_dialog_error_title")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t.teams.users(
                    "remove_only_manager_dialog_error_description",
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction
                  onClick={() => setNotDeleteOnlyManagerDialogOpen(false)}
                  data-testid="close-manager-error-dialog"
                >
                  {t.common.buttons("close")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TeamNavLayout>
    </BreadcrumbProvider>
  );
};

export default TeamUsersView;
