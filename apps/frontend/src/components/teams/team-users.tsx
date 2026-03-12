"use client";

import { Ellipsis, Mail, Plus, Trash, Users } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import useSWR from "swr";

import { Heading } from "@/components/heading";
import { UserAvatar } from "@/components/shared/avatar-display";
import LoadingPlaceHolder from "@/components/shared/loading-place-holder";
import AddUserToTeamDialog from "@/components/teams/team-add-user-dialog";
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
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

  const {
    data: items = [],
    error,
    isLoading,
    mutate,
  } = useSWR(team.id ? `/api/team/${team.id}/members` : null, async () =>
    findMembersByTeamId(team.id!, setError),
  );

  if (error) {
    return (
      <p className="text-destructive text-sm">Failed to load team members.</p>
    );
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
    await mutate();
  };

  const canManage =
    PermissionUtils.canWrite(permissionLevel) || teamRole === "manager";

  const groupedUsers = items.reduce<Record<string, UserWithTeamRoleDTO[]>>(
    (groups, user) => {
      const role = user.teamRole || "unassigned";
      if (!groups[role]) groups[role] = [];
      groups[role].push(user);
      return groups;
    },
    {},
  );

  const roleOrder = ["manager", "member", "guest", "unassigned"];

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("teams"), link: "/portal/teams" },
    { title: team.name, link: `/portal/teams/${obfuscate(team.id)}` },
    { title: t.common.navigation("members"), link: "#" },
  ];

  return (
    <BreadcrumbProvider items={breadcrumbItems}>
      <div className="flex flex-col gap-6" data-testid="team-users-container">
        {/* ── Toolbar ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <Heading
            title={t.teams.users("title", { count: items.length })}
            description={t.teams.users("description")}
          />
          {canManage && (
            <div>
              <Button
                onClick={() => setOpen(true)}
                data-testid="add-user-button"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t.teams.users("add_user")}
              </Button>
              <AddUserToTeamDialog
                open={open}
                setOpen={setOpen}
                teamEntity={team}
                onSaveSuccess={() => mutate()}
              />
            </div>
          )}
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <LoadingPlaceHolder
            message={t.common.misc("loading_data")}
            data-testid="team-users-loading"
          />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {t.teams.users("no_members")}
            </p>
            {canManage && (
              <Button
                onClick={() => setOpen(true)}
                className="mt-1"
                data-testid="add-user-button-empty"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t.teams.users("add_user")}
              </Button>
            )}
          </div>
        ) : (
          roleOrder.map(
            (role) =>
              groupedUsers[role] && (
                <section key={role} data-testid={`team-users-role-${role}`}>
                  {/* Role pill header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                      data-testid={`team-users-role-title-${role}`}
                    >
                      {t.teams.roles(role)}
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {groupedUsers[role].length}
                      </span>
                    </span>
                  </div>

                  {/* Members grid */}
                  <div
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                    data-testid={`team-users-role-list-${role}`}
                  >
                    {groupedUsers[role].map((user) => (
                      <Card
                        key={user.id}
                        className="group flex flex-col transition-all hover:shadow-md hover:bg-muted/50"
                        data-testid={`team-user-card-${user.id}`}
                      >
                        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                          {/* Avatar + status dot */}
                          <div
                            className="relative shrink-0"
                            data-testid={`team-user-avatar-${user.id}`}
                          >
                            <UserAvatar
                              imageUrl={user.imageUrl}
                              size="w-10 h-10"
                            />
                            <span
                              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${
                                user.teamRole && user.teamRole !== "none"
                                  ? "bg-green-500"
                                  : "bg-yellow-400"
                              }`}
                            />
                          </div>

                          {/* Name + title */}
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-sm leading-snug">
                              <Link
                                href={`/portal/users/${obfuscate(user.id)}`}
                                className="hover:text-primary hover:underline underline-offset-4 transition-colors"
                                data-testid={`team-user-name-link-${user.id}`}
                              >
                                {user.firstName} {user.lastName}
                              </Link>
                            </CardTitle>
                            {user.title && (
                              <p
                                className="truncate text-xs text-muted-foreground mt-0.5"
                                data-testid={`team-user-title-${user.id}`}
                              >
                                {user.title}
                              </p>
                            )}
                          </div>

                          {/* Hover-reveal actions */}
                          {canManage && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  data-testid={`team-user-actions-${user.id}`}
                                >
                                  <Ellipsis className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <DropdownMenuItem
                                        className="cursor-pointer text-destructive focus:text-destructive"
                                        onClick={() => removeUserOutTeam(user)}
                                        data-testid={`team-user-remove-${user.id}`}
                                      >
                                        <Trash className="mr-2 h-4 w-4" />
                                        {t.teams.users("remove_user")}
                                      </DropdownMenuItem>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
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
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </CardHeader>

                        <CardFooter className="flex flex-col items-start gap-1 border-t pt-3">
                          <Link
                            href={`mailto:${user.email}`}
                            className="flex items-center gap-1.5 truncate text-xs text-muted-foreground hover:text-primary hover:underline underline-offset-4 transition-colors w-full"
                            data-testid={`team-user-email-${user.id}`}
                          >
                            <Mail className="h-3 w-3 shrink-0" />
                            {user.email}
                          </Link>
                          {user.timezone && (
                            <p
                              className="text-xs text-muted-foreground/70 truncate w-full"
                              data-testid={`team-user-timezone-${user.id}`}
                            >
                              {user.timezone}
                            </p>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </section>
              ),
          )
        )}

        {/* ── Cannot-remove-only-manager dialog ── */}
        <AlertDialog open={notDeleteOnlyManagerDialogOpen}>
          <AlertDialogContent data-testid="cannot-remove-manager-dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t.teams.users("remove_only_manager_dialog_error_title")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t.teams.users("remove_only_manager_dialog_error_description")}
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
    </BreadcrumbProvider>
  );
};

export default TeamUsersView;
