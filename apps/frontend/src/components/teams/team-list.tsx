"use client";

import {
  ArrowDownAZ,
  ArrowUpAZ,
  Ellipsis,
  Pencil,
  Plus,
  Trash,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import React, { useState } from "react";
import useSWR from "swr";

import { Heading } from "@/components/heading";
import { TeamAvatar } from "@/components/shared/avatar-display";
import { EntitiesDeleteDialog } from "@/components/shared/entity-delete-dialog";
import LoadingPlaceHolder from "@/components/shared/loading-place-holder";
import PaginationExt from "@/components/shared/pagination-ext";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { deleteTeams, searchTeams } from "@/lib/actions/teams.action";
import { obfuscate } from "@/lib/endecode";
import { cn } from "@/lib/utils";
import { useError } from "@/providers/error-provider";
import { Filter, QueryDTO } from "@/types/query";
import { PermissionUtils } from "@/types/resources";
import { TeamDTO } from "@/types/teams";

export const TeamList = () => {
  const router = useRouter();
  const { setError } = useError();
  const { data: session } = useSession();

  const [teamSearchTerm, setTeamSearchTerm] = useState<string | undefined>(
    undefined,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterUserTeamsOnly, setFilterUserTeamsOnly] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamDTO | null>(null);

  const t = useAppClientTranslations();
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();
  const permissionLevel = usePagePermission();

  const fetchTeams = async () => {
    const filters: Filter[] = [];
    if (teamSearchTerm) {
      filters.push({ field: "name", operator: "lk", value: teamSearchTerm });
    }
    if (filterUserTeamsOnly) {
      filters.push({
        field: "users.id",
        operator: "eq",
        value: Number(session?.user?.id!),
      });
    }
    const query: QueryDTO = { filters };
    return searchTeams(
      query,
      {
        page: currentPage,
        size: 10,
        sort: [{ field: "name", direction: sortDirection }],
      },
      setError,
    );
  };

  const { data, isLoading, mutate } = useSWR(
    [
      "/api/teams",
      teamSearchTerm,
      currentPage,
      sortDirection,
      filterUserTeamsOnly,
    ],
    fetchTeams,
  );

  const teams = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const handleSearchTeams = useDebouncedCallback((teamName: string) => {
    const params = new URLSearchParams(searchParams);
    if (teamName) {
      params.set("name", teamName);
    } else {
      params.delete("name");
    }
    setTeamSearchTerm(teamName);
    replace(`${pathname}?${params.toString()}`);
  }, 2000);

  const toggleSortDirection = () =>
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));

  const showDeleteTeamConfirmationDialog = (team: TeamDTO) => {
    setSelectedTeam(team);
    setDialogOpen(true);
  };

  const deleteTeam = async (ids: number[]) => {
    await deleteTeams(ids, setError);
    mutate();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <Heading
          title={t.teams.list("title", { totalElements })}
          description={t.teams.list("description")}
        />
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Input
            className="w-48 lg:w-64"
            placeholder={t.teams.list("search_place_holder")}
            onChange={(e) => handleSearchTeams(e.target.value)}
            defaultValue={searchParams.get("name")?.toString()}
            testId="team-list-search"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleSortDirection}
                testId="team-list-sort"
              >
                {sortDirection === "asc" ? (
                  <ArrowDownAZ className="h-4 w-4" />
                ) : (
                  <ArrowUpAZ className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {sortDirection === "asc"
                ? t.teams.list("sort_a_z")
                : t.teams.list("sort_z_a")}
            </TooltipContent>
          </Tooltip>
          <div className="flex items-center gap-2">
            <Checkbox
              id="user-teams-only"
              checked={filterUserTeamsOnly}
              onCheckedChange={(checked) => setFilterUserTeamsOnly(!!checked)}
              data-testid="team-list-my-teams-only"
            />
            <label
              htmlFor="user-teams-only"
              className="cursor-pointer select-none text-sm"
            >
              {t.teams.list("my_teams_only")}
            </label>
          </div>
          {PermissionUtils.canWrite(permissionLevel) && (
            <Link
              href="/portal/teams/new/edit"
              className={cn(buttonVariants({ variant: "default" }))}
              data-testid="team-list-new-team"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t.teams.list("new_team")}
            </Link>
          )}
        </div>
      </div>

      <Separator />

      {/* Content */}
      {isLoading ? (
        <LoadingPlaceHolder
          message={t.common.misc("loading_data")}
          skeletonCount={6}
          skeletonWidth="100%"
        />
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Users className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {t.teams.list("no_teams")}
          </p>
          {PermissionUtils.canWrite(permissionLevel) && (
            <Link
              href="/portal/teams/new/edit"
              className={cn(buttonVariants({ variant: "default" }), "mt-1")}
              data-testid="team-list-new-team-empty"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t.teams.list("new_team")}
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {teams.map((team) => (
              <Card
                key={team.id}
                className="group flex flex-col transition-all hover:shadow-md hover:bg-muted/50"
                data-testid={`team-list-card-${team.id}`}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <TeamAvatar
                      imageUrl={team.logoUrl}
                      size="w-11 h-11 shrink-0"
                    />
                    <div className="min-w-0">
                      <CardTitle className="text-base leading-snug">
                        <Link
                          href={`/portal/teams/${obfuscate(team.id)}`}
                          className="hover:text-primary hover:underline underline-offset-4 transition-colors"
                          data-testid={`team-list-name-${team.id}`}
                        >
                          {team.name}
                        </Link>
                      </CardTitle>
                      {team.slogan && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground italic">
                          {team.slogan}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Hover-reveal actions */}
                  {PermissionUtils.canWrite(permissionLevel) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`team-list-actions-${team.id}`}
                        >
                          <Ellipsis className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() =>
                            router.push(
                              `/portal/teams/${obfuscate(team.id)}/edit`,
                            )
                          }
                          data-testid={`team-list-edit-${team.id}`}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          {t.common.buttons("edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-destructive focus:text-destructive"
                          onClick={() => showDeleteTeamConfirmationDialog(team)}
                          data-testid={`team-list-delete-${team.id}`}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          {t.common.buttons("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </CardHeader>

                <CardContent className="flex-1">
                  {team.description ? (
                    <p
                      className="line-clamp-3 text-sm text-muted-foreground"
                      data-testid={`team-list-description-${team.id}`}
                    >
                      {team.description}
                    </p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground/50">
                      {t.teams.common("no_description")}
                    </p>
                  )}
                </CardContent>

                <CardFooter className="border-t pt-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>
                      {team.usersCount ?? 0}{" "}
                      {(team.usersCount ?? 0) === 1
                        ? t.teams.common("member")
                        : t.teams.common("members")}
                    </span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div data-testid="team-list-pagination">
            <PaginationExt
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}

      {isDialogOpen && selectedTeam && (
        <div data-testid="team-list-delete-dialog">
          <EntitiesDeleteDialog
            entities={[selectedTeam]}
            entityName="Team"
            deleteEntitiesFn={deleteTeam}
            isOpen={isDialogOpen}
            onOpenChange={setDialogOpen}
          />
        </div>
      )}
    </div>
  );
};
