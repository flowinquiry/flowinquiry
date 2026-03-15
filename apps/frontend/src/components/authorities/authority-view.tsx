"use client";

import { Edit, Ellipsis, Plus, Shield, Trash, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import AddUserToAuthorityDialog from "@/components/authorities/authority-add-user-dialog";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Heading } from "@/components/heading";
import { UserAvatar } from "@/components/shared/avatar-display";
import PaginationExt from "@/components/shared/pagination-ext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  deleteUserFromAuthority,
  findAuthorityByName,
  findPermissionsByAuthorityName,
  getUsersByAuthority,
} from "@/lib/actions/authorities.action";
import { obfuscate } from "@/lib/endecode";
import { useError } from "@/providers/error-provider";
import {
  AuthorityDTO,
  AuthorityResourcePermissionDTO,
} from "@/types/authorities";
import { PermissionUtils } from "@/types/resources";
import { UserDTO } from "@/types/users";

export const AuthorityView = ({ authorityId }: { authorityId: string }) => {
  const permissionLevel = usePagePermission();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<Array<UserDTO>>();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [authority, setAuthority] = useState<AuthorityDTO | undefined>(
    undefined,
  );
  const [resourcePermissions, setResourcePermissions] =
    useState<Array<AuthorityResourcePermissionDTO>>();
  const [loadingAuthority, setLoadingAuthority] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { setError } = useError();
  const t = useAppClientTranslations();

  const router = useRouter();

  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      const pageableResult = await getUsersByAuthority(authority!.name, {
        page: currentPage,
        size: 10,
      });
      setUsers(pageableResult.content);
      setTotalElements(pageableResult.totalElements);
      setTotalPages(pageableResult.totalPages);
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoadingAuthority(true);
      try {
        const authorityData = await findAuthorityByName(authorityId, setError);
        setAuthority(authorityData);

        const resourcePermissionsResult = await findPermissionsByAuthorityName(
          authorityData.name,
          setError,
        );
        setResourcePermissions(resourcePermissionsResult);
      } finally {
        setLoadingAuthority(false);
      }
    };
    fetchData();
  }, [authorityId]);

  useEffect(() => {
    if (authority) {
      fetchUsers();
    }
  }, [currentPage, authority]);

  async function removeUserOutAuthority(user: UserDTO) {
    await deleteUserFromAuthority(authority!.name, user.id!);
    await fetchUsers();
  }

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    {
      title: t.common.navigation("authorities"),
      link: "/portal/settings/authorities",
    },
    { title: `${authority?.descriptiveName ?? ""}`, link: "#" },
  ];

  return (
    <div className="flex flex-col gap-4" data-testid="authority-view-container">
      <Breadcrumbs items={breadcrumbItems} />

      {/* Toolbar */}
      <div
        className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        data-testid="authority-view-heading-row"
      >
        {loadingAuthority ? (
          <div className="flex flex-col gap-2">
            <div className="h-6 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-64 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <Heading
            title={`${authority?.descriptiveName ?? ""} (${totalElements})`}
            description={authority?.description ?? ""}
            data-testid="authority-view-heading"
          />
        )}

        {PermissionUtils.canWrite(permissionLevel) && authority && (
          <div
            className="flex shrink-0 items-center gap-2"
            data-testid="authority-view-actions"
          >
            <Button
              onClick={() => setOpen(true)}
              testId="authority-view-add-user"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t.authorities.detail("add_user")}
            </Button>
            <AddUserToAuthorityDialog
              open={open}
              setOpen={setOpen}
              authorityEntity={authority}
              onSaveSuccess={() => fetchUsers()}
              data-testid="authority-view-add-user-dialog"
            />
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  `/portal/settings/authorities/${obfuscate(authority.name)}/edit`,
                )
              }
              testId="authority-view-edit"
            >
              <Edit className="mr-2 h-4 w-4" />
              {t.common.buttons("edit")}
            </Button>
          </div>
        )}
      </div>

      {/* Two-column layout: user grid | permissions panel */}
      <div
        className="flex flex-col gap-4 md:flex-row md:items-start"
        data-testid="authority-view-content"
      >
        {/* User grid */}
        <div
          className="flex flex-1 flex-col gap-4"
          data-testid="authority-view-users-container"
        >
          {loadingUsers ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-xl border p-4"
                >
                  <div className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-muted" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : users && users.length > 0 ? (
            <>
              <div
                className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                data-testid="authority-view-users-grid"
              >
                {users.map((user: UserDTO) => (
                  <Card
                    key={user.id}
                    className="group flex flex-col transition-all hover:shadow-md hover:bg-muted/50"
                    data-testid={`authority-view-user-card-${user.id}`}
                  >
                    <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                      {/* Avatar with status dot */}
                      <div
                        className="relative shrink-0"
                        data-testid={`authority-view-user-avatar-${user.id}`}
                      >
                        <UserAvatar imageUrl={user.imageUrl} size="w-10 h-10" />
                        <span
                          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${
                            user.status === "ACTIVE"
                              ? "bg-green-500"
                              : "bg-yellow-400"
                          }`}
                        />
                      </div>

                      {/* Name + title + pending badge */}
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm leading-snug">
                          <Link
                            href={`/portal/users/${obfuscate(user.id)}`}
                            className="hover:text-primary hover:underline underline-offset-4 transition-colors"
                            data-testid={`authority-view-user-name-${user.id}`}
                          >
                            {user.firstName} {user.lastName}
                          </Link>
                        </CardTitle>
                        {user.title && (
                          <CardDescription
                            className="truncate text-xs"
                            data-testid={`authority-view-user-title-${user.id}`}
                          >
                            {user.title}
                          </CardDescription>
                        )}
                        {user.status !== "ACTIVE" && (
                          <span className="mt-0.5 inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            {t.users.common("not_activated")}
                          </span>
                        )}
                      </div>

                      {/* Hover-reveal actions */}
                      {PermissionUtils.canWrite(permissionLevel) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              data-testid={`authority-view-user-actions-${user.id}`}
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
                                    onClick={() => removeUserOutAuthority(user)}
                                    data-testid={`authority-view-user-remove-${user.id}`}
                                  >
                                    <Trash className="mr-2 h-4 w-4" />
                                    {t.authorities.detail("remove_user")}
                                  </DropdownMenuItem>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                  <p>
                                    {t.authorities.detail(
                                      "remove_user_tooltip",
                                    )}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </CardHeader>

                    {/* About snippet */}
                    {user.about && (
                      <CardContent className="py-0 pb-2">
                        <p
                          className="line-clamp-2 text-xs text-muted-foreground"
                          data-testid={`authority-view-user-about-${user.id}`}
                        >
                          {user.about}
                        </p>
                      </CardContent>
                    )}

                    <CardFooter className="flex flex-col items-start gap-1 border-t pt-3">
                      <Link
                        href={`mailto:${user.email}`}
                        className="truncate text-xs text-muted-foreground hover:text-primary hover:underline underline-offset-4 transition-colors w-full"
                        data-testid={`authority-view-user-email-${user.id}`}
                      >
                        {user.email}
                      </Link>
                      {(user.city || user.country || user.timezone) && (
                        <p
                          className="truncate text-xs text-muted-foreground/70 w-full"
                          data-testid={`authority-view-user-location-${user.id}`}
                        >
                          {[user.city, user.state, user.country]
                            .filter(Boolean)
                            .join(", ")}
                          {user.timezone &&
                            (user.city || user.country
                              ? ` · ${user.timezone}`
                              : user.timezone)}
                        </p>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>

              <div data-testid="authority-view-pagination">
                <PaginationExt
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            </>
          ) : (
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center"
              data-testid="authority-view-no-users"
            >
              <Users className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {t.authorities.detail("no_users")}
              </p>
              {PermissionUtils.canWrite(permissionLevel) && authority && (
                <Button
                  className="mt-1"
                  onClick={() => setOpen(true)}
                  testId="authority-view-add-user-empty"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t.authorities.detail("add_user")}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Permissions panel */}
        <Card
          className="w-full md:w-80 shrink-0"
          data-testid="authority-view-permissions-card"
        >
          <CardHeader
            className="border-b pb-4"
            data-testid="authority-view-permissions-header"
          >
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-muted-foreground" />
              {t.authorities.detail("permissions_title")}
            </CardTitle>
          </CardHeader>
          <CardContent
            className="pt-4"
            data-testid="authority-view-permissions-content"
          >
            {loadingAuthority ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : resourcePermissions && resourcePermissions.length > 0 ? (
              <div className="flex flex-col divide-y">
                {resourcePermissions.map((perm, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0"
                    data-testid={`authority-view-permission-${index}`}
                  >
                    <p
                      className="text-sm font-medium"
                      data-testid={`authority-view-permission-resource-${index}`}
                    >
                      {t.common.navigation(perm.resourceName!)}
                    </p>
                    <p
                      className="text-xs text-muted-foreground"
                      data-testid={`authority-view-permission-level-${index}`}
                    >
                      {t.common.permission(perm.permission!)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className="text-sm text-muted-foreground"
                data-testid="authority-view-no-permissions"
              >
                {t.authorities.detail("no_permission")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
