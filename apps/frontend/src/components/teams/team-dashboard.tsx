"use client";

import React, { useState } from "react";
import useSWR from "swr";

import { Heading } from "@/components/heading";
import TimeRangeSelector from "@/components/shared/time-range-selector";
import AddUserToTeamDialog from "@/components/teams/team-add-user-dialog";
import TeamDashboardTopSection from "@/components/teams/team-dashboard-kpis";
import RecentTeamActivities from "@/components/teams/team-dashboard-recent-activities";
import TicketDistributionChart from "@/components/teams/team-tickets-distribution-chart";
import TicketPriorityPieChart from "@/components/teams/team-tickets-priority-chart";
import UnassignedTickets from "@/components/teams/team-tickets-unassigned";
import TicketCreationByDaySeriesChart from "@/components/teams/tickets-creation-timeseries-chart";
import TeamOverdueTickets from "@/components/teams/tickets-overdue";
import { Separator } from "@/components/ui/separator";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { checkTeamHasAnyManager } from "@/lib/actions/teams.action";
import { BreadcrumbProvider } from "@/providers/breadcrumb-provider";
import { useTeam } from "@/providers/team-provider";

const TeamDashboard = () => {
  const team = useTeam();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const t = useAppClientTranslations();

  const { data: hasManager, isValidating } = useSWR(
    team.id ? ["checkTeamManager", team.id] : null,
    () => checkTeamHasAnyManager(team.id!),
    {
      onSuccess: (response) => {
        if (!response.result) {
          setDialogOpen(true);
        }
      },
    },
  );

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("teams"), link: "/portal/teams" },
    { title: team.name, link: "#" },
  ];

  return (
    <BreadcrumbProvider items={breadcrumbItems}>
      <div className="flex flex-col gap-4">
        {/* ── Toolbar ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Heading
            title={t.teams.dashboard("title")}
            description={t.teams.dashboard("description")}
          />
          <div className="flex shrink-0 items-center gap-2">
            <TimeRangeSelector />
          </div>
        </div>

        <Separator />

        {/* ── Dashboard widgets ── */}
        <div className="space-y-6">
          <TeamDashboardTopSection teamId={team.id!} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TicketCreationByDaySeriesChart teamId={team.id!} />
            <RecentTeamActivities teamId={team.id!} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <UnassignedTickets teamId={team.id!} />
            <TeamOverdueTickets teamId={team.id!} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TicketDistributionChart teamId={team.id!} />
            <TicketPriorityPieChart teamId={team.id!} />
          </div>
        </div>
      </div>

      {!isValidating && !hasManager?.result && (
        <AddUserToTeamDialog
          open={isDialogOpen}
          setOpen={setDialogOpen}
          teamEntity={team}
          onSaveSuccess={() => setDialogOpen(false)}
          forceManagerAssignment={true}
        />
      )}
    </BreadcrumbProvider>
  );
};

export default TeamDashboard;
