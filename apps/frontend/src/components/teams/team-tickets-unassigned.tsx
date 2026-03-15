"use client";

import { ArrowDownUp, Inbox } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import useSWR from "swr";

import CollapsibleCard from "@/components/shared/collapsible-card";
import PaginationExt from "@/components/shared/pagination-ext";
import { TicketPriorityDisplay } from "@/components/teams/ticket-priority-display";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { getUnassignedTickets } from "@/lib/actions/tickets.action";
import { formatDateTimeDistanceToNow } from "@/lib/datetime";
import { obfuscate } from "@/lib/endecode";
import { useError } from "@/providers/error-provider";
import { TicketPriority } from "@/types/tickets";

const UnassignedTickets = ({ teamId }: { teamId: number }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy] = useState("priority");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const { setError } = useError();
  const t = useAppClientTranslations();

  useEffect(() => {
    setCurrentPage(1);
  }, [sortDirection]);

  const fetchTickets = async () => {
    return getUnassignedTickets(
      teamId,
      currentPage,
      sortBy,
      sortDirection,
      "modifiedAt",
      "desc",
      setError,
    );
  };

  const { data, error, isLoading } = useSWR(
    [
      `/api/team/${teamId}/unassigned-tickets`,
      currentPage,
      sortBy,
      sortDirection,
    ],
    fetchTickets,
    { revalidateOnFocus: false },
  );

  const tickets = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalTickets = data?.totalElements ?? 0;

  const handlePageChange = (page: number) => {
    if (page < 1) page = 1;
    if (totalPages > 0 && page > totalPages) page = totalPages;
    setCurrentPage(page);
  };

  const toggleSortDirection = () =>
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));

  return (
    <CollapsibleCard
      icon={<Inbox className="h-4 w-4 text-muted-foreground" />}
      title={t.teams.dashboard("unassigned_tickets.title", { totalTickets })}
      headerAction={
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSortDirection}
              className="h-7 w-7"
            >
              <ArrowDownUp className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {sortDirection === "asc"
              ? t.teams.common("priority_sort_ascending")
              : t.teams.common("priority_sort_descending")}
          </TooltipContent>
        </Tooltip>
      }
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <Spinner className="h-8 w-8">
            <span>{t.common.misc("loading_data")}</span>
          </Spinner>
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">
          {t.common.misc("fail_to_load_data")}
        </p>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          {t.teams.dashboard("unassigned_tickets.no_data")}
        </p>
      ) : (
        <div className="flex flex-col">
          {tickets.map((ticket, index) => (
            <div
              key={ticket.id}
              className={`py-2.5 px-2 rounded-md transition-all ${
                index % 2 === 0
                  ? "bg-muted/30 hover:bg-muted/50"
                  : "hover:bg-muted/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col min-w-0 flex-1">
                  {/* Title */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={
                          ticket.projectId && ticket.projectId > 0
                            ? `/portal/teams/${obfuscate(ticket.teamId)}/projects/${ticket.projectShortName}/${ticket.projectTicketNumber}`
                            : `/portal/teams/${obfuscate(ticket.teamId)}/tickets/${obfuscate(ticket.id)}`
                        }
                        className="text-sm font-medium hover:text-primary hover:underline underline-offset-4 transition-colors truncate"
                      >
                        {ticket.requestTitle}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>{ticket.requestTitle}</TooltipContent>
                  </Tooltip>

                  {/* Project badge */}
                  {ticket.projectId &&
                    ticket.projectId > 0 &&
                    ticket.projectName && (
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                          {t.teams.common("project")}
                        </span>
                        <Link
                          href={`/portal/teams/${obfuscate(ticket.teamId)}/projects/${ticket.projectShortName}`}
                          className="text-xs text-primary hover:underline underline-offset-4"
                        >
                          {ticket.projectName}
                        </Link>
                      </div>
                    )}
                </div>

                {/* Priority */}
                <div className="shrink-0">
                  <TicketPriorityDisplay
                    priority={ticket.priority as TicketPriority}
                  />
                </div>
              </div>

              {/* Description */}
              {ticket.requestDescription && (
                <div
                  className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground **:my-0 mt-1"
                  dangerouslySetInnerHTML={{
                    __html: ticket.requestDescription,
                  }}
                />
              )}

              {/* Modified at */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground/70 mt-1 cursor-default">
                    {ticket.modifiedAt
                      ? formatDateTimeDistanceToNow(ticket.modifiedAt)
                      : "N/A"}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  {ticket.modifiedAt
                    ? new Date(ticket.modifiedAt).toLocaleString()
                    : "N/A"}
                </TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      )}

      {totalPages > 0 && (
        <PaginationExt
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          className="pt-2"
        />
      )}
    </CollapsibleCard>
  );
};

export default UnassignedTickets;
