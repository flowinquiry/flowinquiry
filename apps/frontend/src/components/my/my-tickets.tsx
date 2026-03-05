"use client";

import { Filter, SlidersHorizontal, Ticket } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import React, { useState } from "react";
import useSWR from "swr";

import { Heading } from "@/components/heading";
import DynamicQueryBuilder from "@/components/my/ticket-query-component";
import CollapsibleCard from "@/components/shared/collapsible-card";
import PaginationExt from "@/components/shared/pagination-ext";
import TicketList from "@/components/teams/ticket-list";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { searchTickets } from "@/lib/actions/tickets.action";
import { useError } from "@/providers/error-provider";
import {
  Filter as FilterType,
  Operator,
  Pagination,
  QueryDTO,
} from "@/types/query";

const validTicketTypes = ["reported", "assigned"] as const;
type TicketType = (typeof validTicketTypes)[number];

const MyTicketsView = () => {
  const { data: session } = useSession();
  const { setError } = useError();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useAppClientTranslations();

  const ticketTypeParam = searchParams.get("ticketType") as TicketType;
  const [ticketType, setTicketType] = useState<TicketType>(
    validTicketTypes.includes(ticketTypeParam) ? ticketTypeParam : "reported",
  );

  React.useEffect(() => {
    if (validTicketTypes.includes(ticketTypeParam)) {
      setTicketType(ticketTypeParam);
    } else {
      setTicketType("reported");
    }
  }, [ticketTypeParam]);

  const [query, setQuery] = useState<QueryDTO | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    size: 10,
    sort: [{ field: "createdAt", direction: "desc" }],
  });

  const handleSearch = (newQuery: QueryDTO) => {
    setQuery(newQuery);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const userFilter: FilterType = {
    field: ticketType === "reported" ? "requestUser.id" : "assignUser.id",
    operator: "eq" as Operator,
    value: session?.user?.id ?? "",
  };

  const combinedQuery: QueryDTO = {
    groups: [
      {
        logicalOperator: "AND",
        filters: [userFilter],
        groups: query?.groups || [],
      },
    ],
  };

  const { data, isLoading } = useSWR(
    session?.user?.id ? [`/api/tickets`, combinedQuery, pagination] : null,
    async () => searchTickets(combinedQuery, pagination, setError),
    { keepPreviousData: true },
  );

  const totalPages = data?.totalPages ?? 1;

  const handleTicketTypeChange = (newType: TicketType) => {
    if (newType !== ticketType) {
      setTicketType(newType);
      router.push(`?ticketType=${newType}`, { scroll: false });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Heading
          title={
            ticketType === "reported"
              ? t.header.my_tickets("reported_tickets")
              : t.header.my_tickets("assigned_tickets")
          }
          description={t.header.my_tickets("description")}
        />

        {/* Toggle — styled to match other segmented controls */}
        <ToggleGroup
          type="single"
          value={ticketType}
          onValueChange={(value) => {
            if (value) handleTicketTypeChange(value as TicketType);
          }}
          className="rounded-lg border bg-muted/50 p-1 gap-1 self-start sm:self-auto"
        >
          <ToggleGroupItem
            value="reported"
            className="rounded-md px-4 text-sm data-[state=on]:bg-background data-[state=on]:shadow-sm data-[state=on]:text-foreground text-muted-foreground transition-all"
          >
            <Ticket className="h-3.5 w-3.5 mr-1.5" />
            {t.header.my_tickets("reported")}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="assigned"
            className="rounded-md px-4 text-sm data-[state=on]:bg-background data-[state=on]:shadow-sm data-[state=on]:text-foreground text-muted-foreground transition-all"
          >
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            {t.header.my_tickets("assigned")}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Separator />

      {/* ── Body ── */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Query builder — collapsible card */}
        <div className="w-full lg:w-105 shrink-0">
          <CollapsibleCard
            icon={
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            }
            title="Filters"
          >
            <DynamicQueryBuilder onSearch={handleSearch} />
          </CollapsibleCard>
        </div>

        {/* Ticket list */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              <TicketList tickets={data?.content || []} instantView={false} />
              <PaginationExt
                currentPage={pagination.page}
                totalPages={totalPages}
                onPageChange={(page) =>
                  setPagination((prev) => ({ ...prev, page }))
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTicketsView;
