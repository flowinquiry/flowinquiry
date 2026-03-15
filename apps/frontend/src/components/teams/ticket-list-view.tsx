"use client";

import React, { useEffect, useState } from "react";

import { Heading } from "@/components/heading";
import LoadingPlaceHolder from "@/components/shared/loading-place-holder";
import PaginationExt from "@/components/shared/pagination-ext";
import TicketAdvancedSearch from "@/components/teams/ticket-advanced-search";
import TicketList from "@/components/teams/ticket-list";
import { Separator } from "@/components/ui/separator";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { searchTickets } from "@/lib/actions/tickets.action";
import { obfuscate } from "@/lib/endecode";
import { BreadcrumbProvider } from "@/providers/breadcrumb-provider";
import { useError } from "@/providers/error-provider";
import { useTeam } from "@/providers/team-provider";
import { QueryDTO } from "@/types/query";
import { TicketDTO } from "@/types/tickets";

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

  const [searchText, setSearchText] = useState("");
  const [isAscending, setIsAscending] = useState(false);
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

  return (
    <BreadcrumbProvider items={breadcrumbItems}>
      <div
        className="flex flex-col gap-4"
        data-testid="ticket-list-view-container"
      >
        {/* ── Toolbar ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Heading
              title={t.teams.tickets.list("title", { count: totalElements })}
              description={t.teams.tickets.list("description")}
              data-testid="ticket-list-heading"
            />
          </div>
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
    </BreadcrumbProvider>
  );
};

export default TicketListView;
