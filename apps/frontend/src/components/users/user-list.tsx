"use client";

import {
  ArrowDownAZ,
  ArrowUpAZ,
  Ellipsis,
  Network,
  Plus,
  RotateCw,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Heading } from "@/components/heading";
import { UserAvatar } from "@/components/shared/avatar-display";
import LoadingPlaceholder from "@/components/shared/loading-place-holder";
import PaginationExt from "@/components/shared/pagination-ext";
import { Button, buttonVariants } from "@/components/ui/button";
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

  const t = useAppClientTranslations();

  const permissionLevel = usePagePermission();

  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();
  const { setError } = useError();

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    const query: QueryDTO = {
      filters: userSearchTerm
        ? [
            {
              field: "firstName,lastName",
              operator: "lk",
              value: userSearchTerm,
            },
          ]
        : [],
    };

    findUsers(
      query,
      {
        page: currentPage,
        size: 10,
        sort: [
          {
            field: "firstName,lastName",
            direction: sortDirection,
          },
        ],
      },
      setError,
    )
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
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-row justify-between">
        <Heading
          title={t.users.list("title", { totalElements })}
          description={t.users.list("description")}
        />

        <div className="flex space-x-4">
          <Input
            className="w-[18rem]"
            placeholder={t.users.list("search_place_holder")}
            onChange={(e) => {
              handleSearchTeams(e.target.value);
            }}
            defaultValue={searchParams.get("name")?.toString()}
            testId="user-list-search"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={toggleSortDirection}
                testId="user-list-sort"
              >
                {sortDirection === "asc" ? <ArrowDownAZ /> : <ArrowUpAZ />}
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
              href={"/portal/users/new/edit"}
              className={cn(buttonVariants({ variant: "default" }))}
              data-testid="user-list-new-user"
            >
              <Plus className="mr-2 h-4 w-4" /> {t.users.list("invite_user")}
            </Link>
          )}
          <Button
            onClick={() => setIsOrgChartOpen(true)}
            testId="user-list-org-chart"
          >
            <Network />
            {t.users.common("org_chart")}
          </Button>
        </div>
      </div>
      <Separator />
      {loading ? (
        <div data-testid="user-list-loading">
          <LoadingPlaceholder
            message={t.common.misc("loading_data")}
            skeletonCount={3}
            skeletonWidth="28rem"
          />
        </div>
      ) : (
        <div className="flex flex-row flex-wrap gap-4 content-around">
          {items?.map((user) => (
            <div
              key={user.id}
              className="relative w-md flex flex-row gap-4 border px-4 py-4 rounded-2xl bg-white dark:bg-gray-800"
              data-testid={`user-list-card-${user.id}`}
            >
              {PermissionUtils.canAccess(permissionLevel) && (
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Ellipsis className="cursor-pointer text-gray-400" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {user.status == "PENDING" && (
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => onResendActivationEmail(user)}
                          data-testid={`user-list-resend-activation-${user.id}`}
                        >
                          <RotateCw />
                          {t.users.list("resend_activation_email")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => onDeleteUser(user)}
                        data-testid={`user-list-delete-${user.id}`}
                      >
                        <Trash />
                        {t.common.buttons("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              <div
                className="relative w-24 h-24"
                data-testid={`user-list-avatar-${user.id}`}
              >
                <UserAvatar imageUrl={user.imageUrl} size="w-24 h-24" />
                {user.status !== "ACTIVE" && (
                  <div
                    className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center"
                    data-testid={`user-list-inactive-${user.id}`}
                  >
                    <span className="text-white text-xs font-bold">
                      {t.users.common("not_activated")}
                    </span>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="grid grid-cols-1">
                <div
                  className="text-2xl"
                  data-testid={`user-list-name-${user.id}`}
                >
                  <Button
                    variant="link"
                    className="px-0"
                    testId={`user-list-name-button-${user.id}`}
                  >
                    <Link href={`/portal/users/${obfuscate(user.id)}`}>
                      {user.firstName}, {user.lastName}
                    </Link>
                  </Button>
                </div>
                <div data-testid={`user-list-email-${user.id}`}>
                  {t.users.form("email")}:{" "}
                  <Button
                    variant="link"
                    className="px-0 py-0 h-0"
                    testId={`user-list-email-button-${user.id}`}
                  >
                    <Link href={`mailto:${user.email}`}>{user.email}</Link>
                  </Button>
                </div>
                <div data-testid={`user-list-title-${user.id}`}>
                  {t.users.form("title")}: {user.title}
                </div>
                <div data-testid={`user-list-timezone-${user.id}`}>
                  {t.users.form("timezone")}: {user.timezone}
                </div>
                <div data-testid={`user-list-last-login-${user.id}`}>
                  {t.users.form("last_login_time")}:{" "}
                  {user.lastLoginTime
                    ? safeFormatDistanceToNow(user.lastLoginTime, {
                        addSuffix: true,
                      })
                    : t.users.common("no_recent_login")}
                </div>
              </div>
            </div>
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
          userId={undefined} // Pass undefined to load the top-level org chart
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
