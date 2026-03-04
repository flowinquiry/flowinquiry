"use client";

import { CaretDownIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { Heading } from "@/components/heading";
import { TeamAvatar } from "@/components/shared/avatar-display";
import LoadingPlaceHolder from "@/components/shared/loading-place-holder";
import PaginationExt from "@/components/shared/pagination-ext";
import TeamNavLayout from "@/components/teams/team-nav";
import NewTicketToTeamDialog from "@/components/teams/team-new-ticket-dialog";
import TicketAdvancedSearch from "@/components/teams/ticket-advanced-search";
import TicketList from "@/components/teams/ticket-list";
import { Button } from "@/components/ui/button";
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
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { searchTickets } from "@/lib/actions/tickets.action";
import { getWorkflowsByTeam } from "@/lib/actions/workflows.action";
import { obfuscate } from "@/lib/endecode";
import { BreadcrumbProvider } from "@/providers/breadcrumb-provider";
import { useError } from "@/providers/error-provider";
import { useTeam } from "@/providers/team-provider";
import { useUserTeamRole } from "@/providers/user-team-role-provider";
import { QueryDTO } from "@/types/query";
import { PermissionUtils } from "@/types/resources";
import { TicketDTO } from "@/types/tickets";
import { WorkflowDTO } from "@/types/workflows";

export type Pagination = {
  page: number;
  size: number;
  sort?: { field: string; direction: "asc" | "desc" }[];
};

const TicketListView = () => {
  const team = useTeam();
  const t = useAppClientTranslations();

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("teams"), link: "/portal/teams" },
    { title: team.name, link: `/portal/teams/${obfuscate(team.id)}` },
    { title: t.common.navigation("tickets"), link: "#" },
  ];

  const permissionLevel = usePagePermission();
  const teamRole = useUserTeamRole().role;

  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isAscending, setIsAscending] = useState(false);
  const [workflows, setWorkflows] = useState<WorkflowDTO[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDTO | null>(
    null,
  );
  const [requests, setRequests] = useState<TicketDTO[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState<string[]>(["New", "Assigned"]);
  const { setError } = useError();
  const [fullQuery, setFullQuery] = useState<QueryDTO | null>(null);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    size: 10,
    sort: [{ field: "createdAt", direction: isAscending ? "asc" : "desc" }],
  });

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      sort: [{ field: "createdAt", direction: isAscending ? "asc" : "desc" }],
    }));
  }, [isAscending]);

  useEffect(() => {
    getWorkflowsByTeam(team.id!, false, setError).then((data) =>
      setWorkflows(data),
    );
  }, [team.id]);

  const handleFilterChange = (query: QueryDTO) => {
    setFullQuery(query);
    setCurrentPage(1);
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      if (!fullQuery) {
        setRequests([]);
        setTotalElements(0);
        setTotalPages(0);
        return;
      }
      const combinedQuery: QueryDTO = {
        groups: [
          {
            logicalOperator: "AND",
            filters: [
              { field: "team.id", operator: "eq", value: team.id! },
              { field: "project", operator: "eq", value: null },
            ],
            groups: fullQuery.groups || [],
          },
        ],
      };
      const pageResult = await searchTickets(
        combinedQuery,
        { page: currentPage, size: 10, sort: pagination.sort },
        setError,
      );
      setRequests(pageResult.content);
      setTotalElements(pageResult.totalElements);
      setTotalPages(pageResult.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [fullQuery, currentPage, pagination.sort]);

  const onCreatedTicketSuccess = () => fetchTickets();

  const canCreateTicket =
    PermissionUtils.canWrite(permissionLevel) ||
    teamRole === "manager" ||
    teamRole === "member" ||
    teamRole === "guest";

  return (
    <BreadcrumbProvider items={breadcrumbItems}>
      <TeamNavLayout teamId={team.id!}>
        <div
          className="flex flex-col gap-4"
          data-testid="ticket-list-view-container"
        >
          {/* ── Toolbar ── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            {/* Team identity + heading */}
            <div className="flex items-center gap-3 min-w-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="shrink-0 cursor-default"
                    data-testid="team-avatar"
                  >
                    <TeamAvatar imageUrl={team.logoUrl} size="w-10 h-10" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs" side="bottom">
                  <p className="font-semibold">{team.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {team.slogan ?? t.teams.common("default_slogan")}
                  </p>
                  {team.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {team.description}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
              <Heading
                title={t.teams.tickets.list("title", { count: totalElements })}
                description={t.teams.tickets.list("description")}
                data-testid="ticket-list-heading"
              />
            </div>

            {/* New ticket split-button */}
            {canCreateTicket && (
              <div
                className="flex shrink-0 items-center"
                data-testid="new-ticket-container"
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button data-testid="new-ticket-button">
                      {t.common.buttons("new")}
                      <CaretDownIcon className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  {Array.isArray(workflows) && workflows.length > 0 ? (
                    <DropdownMenuContent
                      align="end"
                      data-testid="workflow-dropdown-content"
                    >
                      {workflows.map((workflow) => (
                        <DropdownMenuItem
                          key={workflow.id}
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedWorkflow(workflow);
                            setOpen(true);
                          }}
                          data-testid={`workflow-item-${workflow.id}`}
                        >
                          {workflow.requestName}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  ) : (
                    <DropdownMenuContent
                      align="end"
                      className="max-w-xs p-3 text-sm"
                      data-testid="no-workflow-dropdown-content"
                    >
                      <p>{t.teams.tickets.list("no_workflow_available")}</p>
                      {PermissionUtils.canWrite(permissionLevel) ||
                      teamRole === "manager" ? (
                        <span data-testid="create-workflow-cta">
                          {t.teams.tickets.list.rich("create_workflow_cta", {
                            button: (chunks) => (
                              <Button
                                variant="link"
                                className="h-auto px-0 py-0"
                                data-testid="create-workflow-button"
                              >
                                {chunks}
                              </Button>
                            ),
                            link: (chunks) => (
                              <Link
                                href={`/portal/teams/${obfuscate(team.id)}/workflows`}
                                data-testid="create-workflow-link"
                              >
                                {chunks}
                              </Link>
                            ),
                          })}
                        </span>
                      ) : (
                        <span data-testid="contact-manager-message">
                          {t.teams.tickets.list(
                            "contact_manager_to_create_workflow",
                          )}
                        </span>
                      )}
                    </DropdownMenuContent>
                  )}
                </DropdownMenu>

                <NewTicketToTeamDialog
                  open={open}
                  setOpen={setOpen}
                  teamEntity={team}
                  workflow={selectedWorkflow!}
                  onSaveSuccess={onCreatedTicketSuccess}
                  data-testid="new-ticket-dialog"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* ── Filters ── */}
          <TicketAdvancedSearch
            searchText={searchText}
            setSearchText={setSearchText}
            statuses={statuses}
            setStatuses={setStatuses}
            isAscending={isAscending}
            setIsAscending={setIsAscending}
            onFilterChange={handleFilterChange}
            data-testid="ticket-advanced-search"
          />

          {/* ── List ── */}
          {loading ? (
            <LoadingPlaceHolder
              message={t.common.misc("loading_data")}
              data-testid="ticket-list-loading"
            />
          ) : (
            <>
              <TicketList tickets={requests} data-testid="ticket-list" />
              <PaginationExt
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                data-testid="ticket-list-pagination"
              />
            </>
          )}
        </div>
      </TeamNavLayout>
    </BreadcrumbProvider>
  );
};

export default TicketListView;
