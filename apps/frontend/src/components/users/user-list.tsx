"use client";

import {
  ArrowDownAZ,
  ArrowUpAZ,
  Ellipsis,
  Network,
  Plus,
  RotateCw,
  Trash,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Heading } from "@/components/heading";
import { UserAvatar } from "@/components/shared/avatar-display";
import LoadingPlaceholder from "@/components/shared/loading-place-holder";
import PaginationExt from "@/components/shared/pagination-ext";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import OrgChartDialog from "@/components/users/org-chart-dialog";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  deleteUser,
  findAllUsers,
  findUsers,
  resendActivationEmail,
} from "@/lib/actions/users.action";
import { obfuscate } from "@/lib/endecode";
import { cn, safeFormatDistanceToNow } from "@/lib/utils";
import { useError } from "@/providers/error-provider";
import { QueryDTO } from "@/types/query";
import { PermissionUtils } from "@/types/resources";
import { UserDTO } from "@/types/users";

export const UserList = () => {
  const [items, setItems] = useState<Array<UserDTO>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState<string | undefined>(
    undefined,
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isOrgChartOpen, setIsOrgChartOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "PENDING"
  >("ALL");

  const t = useAppClientTranslations();
  const permissionLevel = usePagePermission();
  const { data: session } = useSession();

  const isAdmin = session?.user?.authorities?.includes("ROLE_ADMIN") ?? false;

  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();
  const { setError } = useError();

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    const filters: QueryDTO["filters"] = [];

    if (userSearchTerm) {
      filters.push({
        field: "firstName,lastName",
        operator: "lk",
        value: userSearchTerm,
      });
    }

    // Status filter: admins can filter by PENDING/ACTIVE/ALL; non-admins always see ACTIVE only
    if (isAdmin && statusFilter !== "ALL") {
      filters.push({
        field: "status",
        operator: "eq",
        value: statusFilter,
      });
    }

    const query: QueryDTO = { filters };
    const pagination = {
      page: currentPage,
      size: 10,
      sort: [{ field: "firstName,lastName", direction: sortDirection }],
    };

    const fetcher = isAdmin ? findAllUsers : findUsers;

    fetcher(query, pagination, setError)
      .then((pageResult) => {
        setItems(pageResult.content);
        setTotalElements(pageResult.totalElements);
        setTotalPages(pageResult.totalPages);
      })
      .finally(() => setLoading(false));
  }, [
    userSearchTerm,
    currentPage,
    sortDirection,
    isAdmin,
    statusFilter,
    setLoading,
    setItems,
    setTotalElements,
    setTotalPages,
  ]);

  const handleSearchTeams = useDebouncedCallback((userName: string) => {
    const params = new URLSearchParams(searchParams);
    if (userName) {
      params.set("name", userName);
    } else {
      params.delete("name");
    }
    setUserSearchTerm(userName);
    setCurrentPage(1);
    replace(`${pathname}?${params.toString()}`);
  }, 2000);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  function onDeleteUser(user: UserDTO) {
    setSelectedUser(user);
    setIsDialogOpen(true);
  }

  async function confirmDeleteUser() {
    if (selectedUser) {
      await deleteUser(selectedUser.id!, setError);
      setSelectedUser(null);
      await fetchUsers();
    }
    setIsDialogOpen(false);
    setSelectedUser(null);
  }

  function onResendActivationEmail(user: UserDTO) {
    resendActivationEmail(user.email, setError).then(() => {
      toast.info(
        t.users.list("activation_email_sent", {
          email: user.email,
        }),
      );
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <Heading
          title={t.users.list("title", { totalElements })}
          description={t.users.list("description")}
        />
        <div className="flex shrink-0 items-center gap-2">
          <Input
            className="w-48 lg:w-64"
            placeholder={t.users.list("search_place_holder")}
            onChange={(e) => handleSearchTeams(e.target.value)}
            defaultValue={searchParams.get("name")?.toString()}
            testId="user-list-search"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleSortDirection}
                testId="user-list-sort"
              >
                {sortDirection === "asc" ? (
                  <ArrowDownAZ className="h-4 w-4" />
                ) : (
                  <ArrowUpAZ className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {sortDirection === "asc"
                ? t.users.list("sort_a_z")
                : t.users.list("sort_z_a")}
            </TooltipContent>
          </Tooltip>
          {PermissionUtils.canWrite(permissionLevel) && (
            <Link
              href="/portal/users/new/edit"
              className={cn(buttonVariants({ variant: "default" }))}
              data-testid="user-list-new-user"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t.users.list("invite_user")}
            </Link>
          )}
          <Button
            onClick={() => setIsOrgChartOpen(true)}
            testId="user-list-org-chart"
          >
            <Network className="mr-2 h-4 w-4" />
            {t.users.common("org_chart")}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Status filter tabs – admins only */}
      {isAdmin && (
        <Tabs
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as typeof statusFilter);
            setCurrentPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="ACTIVE">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Active
              </span>
            </TabsTrigger>
            <TabsTrigger value="PENDING">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                Pending
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Content */}
      {loading ? (
        <div data-testid="user-list-loading">
          <LoadingPlaceholder
            message={t.common.misc("loading_data")}
            skeletonCount={6}
            skeletonWidth="100%"
          />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Users className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No users found. Invite someone to get started.
          </p>
          {PermissionUtils.canWrite(permissionLevel) && (
            <Link
              href="/portal/users/new/edit"
              className={cn(buttonVariants({ variant: "default" }), "mt-1")}
              data-testid="user-list-new-user-empty"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t.users.list("invite_user")}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((user) => (
            <Card
              key={user.id}
              className="group flex flex-col transition-all hover:shadow-md hover:bg-muted/50"
              data-testid={`user-list-card-${user.id}`}
            >
              <CardHeader className="flex flex-row items-start gap-4 pb-3">
                {/* Avatar with status indicator */}
                <div
                  className="relative shrink-0"
                  data-testid={`user-list-avatar-${user.id}`}
                >
                  <UserAvatar imageUrl={user.imageUrl} size="w-14 h-14" />
                  {user.status === "ACTIVE" ? (
                    <span
                      className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500"
                      title="Active"
                    />
                  ) : (
                    <span
                      className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-yellow-400"
                      title="Pending"
                    />
                  )}
                </div>

                {/* Name + title */}
                <div className="min-w-0 flex-1">
                  <div
                    className="text-base font-semibold leading-tight"
                    data-testid={`user-list-name-${user.id}`}
                  >
                    <Link
                      href={`/portal/users/${obfuscate(user.id)}`}
                      className="hover:text-primary hover:underline underline-offset-4 transition-colors"
                    >
                      {user.firstName} {user.lastName}
                    </Link>
                  </div>
                  {user.title && (
                    <p
                      className="mt-0.5 truncate text-xs text-muted-foreground"
                      data-testid={`user-list-title-${user.id}`}
                    >
                      {user.title}
                    </p>
                  )}
                  {user.status === "PENDING" && (
                    <span className="mt-1 inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                      {t.users.common("not_activated")}
                    </span>
                  )}
                </div>

                {/* Actions menu — fade in on hover */}
                {PermissionUtils.canAccess(permissionLevel) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Ellipsis className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      {user.status === "PENDING" && (
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => onResendActivationEmail(user)}
                          data-testid={`user-list-resend-activation-${user.id}`}
                        >
                          <RotateCw className="mr-2 h-4 w-4" />
                          {t.users.list("resend_activation_email")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => onDeleteUser(user)}
                        data-testid={`user-list-delete-${user.id}`}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        {t.common.buttons("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardHeader>

              <CardContent className="flex flex-col gap-1.5 text-sm text-muted-foreground pb-3">
                <div
                  className="flex items-center gap-1 truncate"
                  data-testid={`user-list-email-${user.id}`}
                >
                  <span className="shrink-0">{t.users.form("email")}:</span>
                  <Link
                    href={`mailto:${user.email}`}
                    className="truncate hover:text-primary hover:underline underline-offset-4 transition-colors"
                  >
                    {user.email}
                  </Link>
                </div>
                {user.timezone && (
                  <div
                    className="truncate"
                    data-testid={`user-list-timezone-${user.id}`}
                  >
                    {t.users.form("timezone")}: {user.timezone}
                  </div>
                )}
              </CardContent>

              <CardFooter className="border-t pt-3 text-xs text-muted-foreground">
                <span data-testid={`user-list-last-login-${user.id}`}>
                  {t.users.form("last_login_time")}:{" "}
                  {user.lastLoginTime
                    ? safeFormatDistanceToNow(user.lastLoginTime, {
                        addSuffix: true,
                      })
                    : t.users.common("no_recent_login")}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <div data-testid="user-list-pagination">
        <PaginationExt
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      <div data-testid="user-list-org-chart-dialog">
        <OrgChartDialog
          userId={undefined}
          isOpen={isOrgChartOpen}
          onClose={() => setIsOrgChartOpen(false)}
        />
      </div>

      <div data-testid="user-list-delete-dialog">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.users.list("delete_dialog_title")}</DialogTitle>
            </DialogHeader>
            <p>
              {t.users.list.rich("delete_confirmation", {
                name: `${selectedUser?.firstName} ${selectedUser?.lastName}`,
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setIsDialogOpen(false)}
                testId="user-list-cancel-delete"
              >
                {t.common.buttons("cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteUser}
                testId="user-list-confirm-delete"
              >
                {t.common.buttons("delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
