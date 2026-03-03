"use client";

import { Ellipsis, Plus, Shield, ShieldOff, Trash, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { Heading } from "@/components/heading";
import PaginationExt from "@/components/shared/pagination-ext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  deleteAuthority,
  getAuthorities,
} from "@/lib/actions/authorities.action";
import { obfuscate } from "@/lib/endecode";
import { useError } from "@/providers/error-provider";
import { AuthorityDTO } from "@/types/authorities";
import { PermissionUtils } from "@/types/resources";

export function AuthoritiesView() {
  const router = useRouter();
  const t = useAppClientTranslations();
  const permissionLevel = usePagePermission();

  const [authorities, setAuthorities] = useState<Array<AuthorityDTO>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedAuthority, setSelectedAuthority] =
    useState<AuthorityDTO | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { setError } = useError();

  const fetchAuthorities = async () => {
    getAuthorities(currentPage, setError).then((pageableResult) => {
      setAuthorities(pageableResult.content);
      setTotalPages(pageableResult.totalPages);
      setTotalElements(pageableResult.totalElements);
    });
  };

  useEffect(() => {
    fetchAuthorities();
  }, [currentPage]);

  function handleDeleteClick(authority: AuthorityDTO) {
    setSelectedAuthority(authority);
    setIsDialogOpen(true);
  }

  async function confirmDeleteAuthority() {
    if (selectedAuthority) {
      await deleteAuthority(selectedAuthority.name, setError);
      setSelectedAuthority(null);
      fetchAuthorities();
    }
    setIsDialogOpen(false);
    setSelectedAuthority(null);
  }

  return (
    <div className="flex flex-col gap-4" data-testid="authority-list-container">
      {/* Toolbar */}
      <div
        className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        data-testid="authority-list-heading"
      >
        <Heading
          title={t.authorities.list("title", { totalElements })}
          description={t.authorities.list("description")}
        />
        {PermissionUtils.canWrite(permissionLevel) && (
          <Button
            className="shrink-0"
            onClick={() => router.push("/portal/settings/authorities/new/edit")}
            testId="authority-list-new-button"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t.authorities.list("new_authority")}
          </Button>
        )}
      </div>

      <Separator />

      {/* Content */}
      <div data-testid="authority-list-content">
        {authorities.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <ShieldOff className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No authorities found. Create one to get started.
            </p>
            {PermissionUtils.canWrite(permissionLevel) && (
              <Button
                className="mt-1"
                onClick={() =>
                  router.push("/portal/settings/authorities/new/edit")
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                {t.authorities.list("new_authority")}
              </Button>
            )}
          </div>
        ) : (
          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
            data-testid="authority-list-items"
          >
            {authorities.map((authority) => (
              <Card
                key={authority.name}
                className="group flex flex-col transition-all hover:shadow-md hover:bg-muted/50"
                data-testid={`authority-list-item-${authority.name}`}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                  <div className="flex min-w-0 flex-col gap-1">
                    <CardTitle className="text-base leading-snug">
                      <Link
                        href={`/portal/settings/authorities/${obfuscate(authority.name)}`}
                        className="hover:text-primary hover:underline underline-offset-4 transition-colors"
                        data-testid={`authority-list-item-link-${authority.name}`}
                      >
                        {authority.descriptiveName}
                      </Link>
                    </CardTitle>
                    {authority.systemRole && (
                      <Badge
                        variant="outline"
                        className="w-fit text-blue-600 border-blue-400 dark:text-blue-300 dark:border-blue-600"
                        data-testid={`authority-list-item-system-badge-${authority.name}`}
                      >
                        <Shield className="mr-1 h-3 w-3" />
                        {t.authorities.common("system_role")}
                      </Badge>
                    )}
                  </div>

                  {PermissionUtils.canAccess(permissionLevel) &&
                    !authority.systemRole && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`authority-list-item-actions-${authority.name}`}
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
                                  onClick={() => handleDeleteClick(authority)}
                                  data-testid={`authority-list-item-delete-${authority.name}`}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  {t.authorities.list("remove_authority")}
                                </DropdownMenuItem>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p>
                                  {t.authorities.list(
                                    "remove_authority_tooltip",
                                  )}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                </CardHeader>

                <CardContent className="flex-1">
                  {authority.description ? (
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {authority.description}
                    </p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground/50">
                      No description provided.
                    </p>
                  )}
                </CardContent>

                <CardFooter className="border-t pt-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>
                      {authority.usersCount ?? 0}{" "}
                      {(authority.usersCount ?? 0) === 1 ? "user" : "users"}
                    </span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-4" data-testid="authority-list-pagination">
          <PaginationExt
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <div data-testid="authority-list-delete-dialog">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle data-testid="authority-list-delete-dialog-title">
                {t.authorities.list("remove_dialog_title")}
              </DialogTitle>
            </DialogHeader>
            <p data-testid="authority-list-delete-dialog-content">
              {t.authorities.list.rich("remove_dialog_content", {
                name: selectedAuthority?.descriptiveName ?? "",
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setIsDialogOpen(false)}
                testId="authority-list-delete-dialog-cancel"
              >
                {t.common.buttons("cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteAuthority}
                testId="authority-list-delete-dialog-confirm"
              >
                {t.common.buttons("delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
