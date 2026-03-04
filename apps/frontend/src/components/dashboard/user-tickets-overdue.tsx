"use client";

import { AlertTriangle, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import { UserAvatar } from "@/components/shared/avatar-display";
import CollapsibleCard from "@/components/shared/collapsible-card";
import PaginationExt from "@/components/shared/pagination-ext";
import TruncatedHtmlLabel from "@/components/shared/truncate-html-label";
import { TicketPriorityDisplay } from "@/components/teams/ticket-priority-display";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getOverdueTicketsByUser } from "@/lib/actions/tickets.action";
import { formatDateTimeDistanceToNow } from "@/lib/datetime";
import { obfuscate } from "@/lib/endecode";
import { useError } from "@/providers/error-provider";
import { TicketDTO, TicketPriority } from "@/types/tickets";

const UserTeamsOverdueTickets = () => {
  const { data: session } = useSession();
  const userId = Number(session?.user?.id!);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const { setError } = useError();
  const pageT = useTranslations("dashboard.overdue_tickets");

  useEffect(() => {
    setLoading(true);
    getOverdueTicketsByUser(
      userId,
      currentPage,
      "priority",
      sortDirection,
      setError,
    )
      .then((data) => {
        setTickets(data.content);
        setTotalPages(data.totalPages);
        setTotalTickets(data.totalElements);
      })
      .finally(() => setLoading(false));
  }, [userId, currentPage, sortDirection]);

  return (
    <CollapsibleCard
      icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
      title={pageT("title", { totalTickets })}
      className="flex flex-col"
      headerAction={
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() =>
                setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
              }
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {sortDirection === "asc"
              ? pageT("priority_asc")
              : pageT("priority_desc")}
          </TooltipContent>
        </Tooltip>
      }
    >
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <AlertTriangle className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{pageT("no_data")}</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {tickets.map((ticket, index) => (
            <div
              key={ticket.id}
              className={`py-2.5 px-2 rounded-md border-l-2 border-transparent hover:border-primary transition-all ${
                index % 2 === 0
                  ? "bg-muted/30 hover:bg-muted/50"
                  : "hover:bg-muted/40"
              }`}
            >
              {/* Title + priority */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={`/portal/teams/${obfuscate(ticket.teamId)}/tickets/${obfuscate(
                        ticket.id,
                      )}`}
                      className="text-sm font-medium hover:text-primary hover:underline underline-offset-4 transition-colors line-clamp-1"
                    >
                      {ticket.requestTitle}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    {ticket.requestTitle}
                  </TooltipContent>
                </Tooltip>
                <div className="shrink-0">
                  <TicketPriorityDisplay
                    priority={ticket.priority as TicketPriority}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="text-xs text-muted-foreground mb-2">
                <TruncatedHtmlLabel
                  htmlContent={ticket.requestDescription!}
                  wordLimit={60}
                />
              </div>

              {/* Assignee + timestamp */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {ticket.assignUserId ? (
                    <>
                      <UserAvatar
                        imageUrl={ticket.assignUserImageUrl}
                        size="w-4 h-4"
                      />
                      <Link
                        href={`/portal/users/${obfuscate(ticket.assignUserId)}`}
                        className="hover:text-primary hover:underline underline-offset-4 transition-colors"
                      >
                        {ticket.assignUserName}
                      </Link>
                    </>
                  ) : (
                    <span className="italic">Unassigned</span>
                  )}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground/70 cursor-default">
                      {formatDateTimeDistanceToNow(
                        new Date(ticket.modifiedAt!),
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {new Date(ticket.modifiedAt!).toLocaleString()}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      )}

      <PaginationExt
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
        className="pt-2"
      />
    </CollapsibleCard>
  );
};

export default UserTeamsOverdueTickets;
