"use client";

import {
  ArrowDownAZ,
  ArrowUpAZ,
  Ellipsis,
  Pencil,
  Plus,
  Trash,
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
  TooltipProvider,
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

  // **SWF Fetcher Function**
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

  // **Use SWR to Fetch Data**
  const { data, error, isLoading, mutate } = useSWR(
    [
      `/api/teams`,
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

  // **Handle Search with Debouncing**
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

  // **Toggle Sorting**
  const toggleSortDirection = () =>
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));

  // **Show Delete Confirmation**
  const showDeleteTeamConfirmationDialog = (team: TeamDTO) => {
    setSelectedTeam(team);
    setDialogOpen(true);
  };

  // **Delete Team and Refresh Data**
  const deleteTeam = async (ids: number[]) => {
    await deleteTeams(ids, setError);
    mutate(); // Refresh data after deletion
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-row justify-between items-center">
        <Heading
          title={t.teams.list("title", { totalElements })}
          description={t.teams.list("description")}
        />
        <div className="flex space-x-4">
          <Input
            className="w-[18rem]"
            placeholder={t.teams.list("search_place_holder")}
            onChange={(e) => handleSearchTeams(e.target.value)}
            defaultValue={searchParams.get("name")?.toString()}
            testId="team-list-search"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={toggleSortDirection}
                testId="team-list-sort"
              >
                {sortDirection === "asc" ? <ArrowDownAZ /> : <ArrowUpAZ />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>
                {sortDirection === "asc"
                  ? t.teams.list("sort_a_z")
                  : t.teams.list("sort_z_a")}
              </p>
            </TooltipContent>
          </Tooltip>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="user-teams-only"
              checked={filterUserTeamsOnly}
              onCheckedChange={(checked) => setFilterUserTeamsOnly(!!checked)}
              data-testid="team-list-my-teams-only"
            />
            <label htmlFor="user-teams-only" className="text-sm">
              {t.teams.list("my_teams_only")}
            </label>
          </div>
          {PermissionUtils.canWrite(permissionLevel) && (
            <Link
              href="/portal/teams/new/edit"
              className={cn(buttonVariants({ variant: "default" }))}
              data-testid="team-list-new-team"
            >
              <Plus className="mr-2 h-4 w-4" /> {t.teams.list("new_team")}
            </Link>
          )}
        </div>
      </div>
      <Separator />
      {isLoading ? (
        <div className="flex justify-center py-4">
          <LoadingPlaceHolder message={t.common.misc("loading_data")} />
        </div>
      ) : (
        <>
          <div className="flex flex-row flex-wrap gap-4">
            {teams.map((team) => {
              const shortDescription =
                team.description && team.description.length > 50
                  ? team.description.substring(0, 50) + "..."
                  : team.description;

              return (
                <div
                  key={team.id}
                  className="relative w-[24rem] flex flex-row gap-4 border rounded-2xl"
                  data-testid={`team-list-card-${team.id}`}
                >
                  <div className="px-4 py-4">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <TeamAvatar
                            imageUrl={team.logoUrl}
                            size="w-20 h-20"
                          />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs whitespace-pre-wrap break-words">
                          <div className="text-left">
                            <p className="font-bold">{team.name}</p>
                            <p className="text-sm ">
                              {team.slogan ?? t.teams.common("default_slogan")}
                            </p>
                            {team.description && (
                              <p className="text-sm">{team.description}</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div>
                    <Button
                      variant="link"
                      asChild
                      className="px-0"
                      testId={`team-list-name-${team.id}`}
                    >
                      <Link href={`/portal/teams/${obfuscate(team.id)}`}>
                        {team.name} ({team.usersCount})
                      </Link>
                    </Button>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="mt-1 text-muted-foreground cursor-pointer"
                            data-testid={`team-list-description-${team.id}`}
                          >
                            {shortDescription}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs whitespace-pre-wrap break-words">
                          {team.description}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {PermissionUtils.canWrite(permissionLevel) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Ellipsis className="cursor-pointer absolute top-2 right-2" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/portal/teams/${obfuscate(team.id)}/edit`,
                            )
                          }
                          data-testid={`team-list-edit-${team.id}`}
                        >
                          <Pencil /> {t.common.buttons("edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => showDeleteTeamConfirmationDialog(team)}
                          data-testid={`team-list-delete-${team.id}`}
                        >
                          <Trash /> {t.common.buttons("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
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
