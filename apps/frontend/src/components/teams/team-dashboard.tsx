"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import useSWR from "swr";

import { Heading } from "@/components/heading";
import { TeamAvatar } from "@/components/shared/avatar-display";
import TimeRangeSelector from "@/components/shared/time-range-selector";
import AddUserToTeamDialog from "@/components/teams/team-add-user-dialog";
import TeamDashboardTopSection from "@/components/teams/team-dashboard-kpis";
import RecentTeamActivities from "@/components/teams/team-dashboard-recent-activities";
import TeamNavLayout from "@/components/teams/team-nav";
import TicketDistributionChart from "@/components/teams/team-tickets-distribution-chart";
import TicketPriorityPieChart from "@/components/teams/team-tickets-priority-chart";
import UnassignedTickets from "@/components/teams/team-tickets-unassigned";
import TicketCreationByDaySeriesChart from "@/components/teams/tickets-creation-timeseries-chart";
import TeamOverdueTickets from "@/components/teams/tickets-overdue";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { checkTeamHasAnyManager } from "@/lib/actions/teams.action";
import { obfuscate } from "@/lib/endecode";
import { cn } from "@/lib/utils";
import { BreadcrumbProvider } from "@/providers/breadcrumb-provider";
import { useTeam } from "@/providers/team-provider";
import { PermissionUtils } from "@/types/resources";

const TeamDashboard = () => {
  const team = useTeam();
  const permissionLevel = usePagePermission();
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
      <TeamNavLayout teamId={team.id!}>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Tooltip>
                  <TooltipTrigger>
                    <TeamAvatar imageUrl={team.logoUrl} size="w-20 h-20" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs whitespace-pre-wrap break-words">
                    <div className="text-left">
                      <p className="font-bold">{team.name}</p>
                      <p className="text-sm ">
                        {team.slogan ?? t.teams.common("default_slogan")}
                      </p>
                      {team.description && (
                        <p className="text-sm ">{team.description}</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
                <Heading
                  title={t.teams.dashboard("title")}
                  description={t.teams.dashboard("description")}
                />
              </div>
              {PermissionUtils.canWrite(permissionLevel) && (
                <Link
                  href={`/portal/teams/${obfuscate(team.id)}/edit`}
                  className={cn(buttonVariants({ variant: "default" }))}
                >
                  <Plus className="mr-2 h-4 w-4" />{" "}
                  {t.teams.dashboard("edit_team")}
                </Link>
              )}
            </div>
            <div className="flex items-start">
              <TimeRangeSelector />
            </div>
          </div>

          <Separator />

          <div className="space-y-8">
            <TeamDashboardTopSection teamId={team.id!} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col">
                <TicketCreationByDaySeriesChart teamId={team.id!} />
              </div>
              <div className="flex flex-col">
                <RecentTeamActivities teamId={team.id!} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col">
                <UnassignedTickets teamId={team.id!} />
              </div>
              <div className="flex flex-col">
                <TeamOverdueTickets teamId={team.id!} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="w-full h-full flex">
                <TicketDistributionChart teamId={team.id!} />
              </div>
              <div className="w-full h-full flex">
                <TicketPriorityPieChart teamId={team.id!} />
              </div>
            </div>
          </div>
        </div>
      </TeamNavLayout>

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
