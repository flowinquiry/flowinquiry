"use client";

import {
  ChevronDown,
  FolderPlus,
  GitBranch,
  Pencil,
  Ticket,
  UserPlus,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { Navbar } from "@/components/admin-panel/navbar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { VersionUpgradeBanner } from "@/components/dashboard/version-upgrade-banner";
import ProjectEditDialog from "@/components/projects/project-edit-dialog";
import { TeamAvatar } from "@/components/shared/avatar-display";
import AddUserToTeamDialog from "@/components/teams/team-add-user-dialog";
import TeamNavLayout from "@/components/teams/team-nav";
import TeamNewSheet from "@/components/teams/team-new-sheet";
import NewTicketToTeamDialog from "@/components/teams/team-new-ticket-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { getWorkflowsByTeam } from "@/lib/actions/workflows.action";
import { obfuscate } from "@/lib/endecode";
import { useTeam, useTeamRefresh } from "@/providers/team-provider";
import { useUserTeamRole } from "@/providers/user-team-role-provider";
import { PermissionUtils } from "@/types/resources";
import { WorkflowDTO } from "@/types/workflows";

/** Map URL segment → translation key (must match navigation keys in en.json) */
const SEGMENT_TO_NAV_KEY: Record<string, string> = {
  dashboard: "dashboard",
  members: "members",
  tickets: "tickets",
  projects: "projects",
  workflows: "workflows",
  reports: "reports",
};

export function TeamContentLayout({ children }: { children: React.ReactNode }) {
  const team = useTeam();
  const refreshTeam = useTeamRefresh();
  const router = useRouter();
  const t = useAppClientTranslations();
  const pathname = usePathname();
  const permissionLevel = usePagePermission();
  const teamRole = useUserTeamRole().role;
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDTO | null>(
    null,
  );
  const [workflows, setWorkflows] = useState<WorkflowDTO[]>([]);

  const segments = pathname.split("/").filter(Boolean);
  const teamIndex = segments.indexOf("teams");
  const sectionSegment = teamIndex !== -1 ? segments[teamIndex + 2] : undefined;
  const navKey = sectionSegment
    ? SEGMENT_TO_NAV_KEY[sectionSegment]
    : undefined;

  const isOnTicketsPage = sectionSegment === "tickets";

  const canManage =
    PermissionUtils.canWrite(permissionLevel) || teamRole === "manager";
  const canCreateTicket =
    PermissionUtils.canWrite(permissionLevel) ||
    teamRole === "manager" ||
    teamRole === "member" ||
    teamRole === "guest";

  // Load workflows for ticket creation sub-menu
  useEffect(() => {
    if (team.id) {
      getWorkflowsByTeam(team.id, false).then((data) => setWorkflows(data));
    }
  }, [team.id]);

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("teams"), link: "/portal/teams" },
    {
      title: team.name,
      link: `/portal/teams/${obfuscate(team.id)}/dashboard`,
    },
    ...(navKey
      ? [{ title: t.common.navigation(navKey as never), link: "#" }]
      : []),
  ];

  return (
    <div className="h-full">
      <VersionUpgradeBanner />
      <Navbar title={team.name} />

      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-8 pt-4 pb-12">
        <div
          className="rounded-xl border bg-background flex flex-col"
          style={{ minHeight: "calc(100vh - 4rem - 6rem)" }}
        >
          {/* ── Breadcrumbs ── */}
          <div className="px-6 pt-5 pb-3">
            <Breadcrumbs items={breadcrumbItems} />
          </div>

          {/* ── Team identity strip + actions ── */}
          <div className="flex items-center justify-between gap-3 px-6 pb-3">
            <div className="flex items-center gap-3 min-w-0">
              <TeamAvatar imageUrl={team.logoUrl} size="w-9 h-9" />
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight truncate">
                  {team.name}
                </p>
                {team.slogan && (
                  <p className="text-xs text-muted-foreground truncate">
                    {team.slogan}
                  </p>
                )}
              </div>
            </div>

            {(canManage || canCreateTicket) && (
              <div className="flex items-center shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="gap-1.5">
                      {t.teams.dashboard("actions")}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* New ticket sub-menu */}
                    {canCreateTicket && (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Ticket className="h-4 w-4 mr-2" />
                          {t.common.buttons("new")}{" "}
                          {t.common.navigation("tickets")}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {workflows.length > 0 ? (
                            workflows.map((wf) => (
                              <DropdownMenuItem
                                key={wf.id}
                                onClick={() => {
                                  setSelectedWorkflow(wf);
                                  setIsNewTicketOpen(true);
                                }}
                              >
                                {wf.requestName}
                              </DropdownMenuItem>
                            ))
                          ) : (
                            <DropdownMenuItem disabled>
                              {t.teams.tickets.list("no_workflow_available")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    )}

                    {canManage && (
                      <>
                        <DropdownMenuItem
                          onClick={() => setIsAddMemberOpen(true)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          {t.teams.users("add_user")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setIsAddProjectOpen(true)}
                        >
                          <FolderPlus className="h-4 w-4 mr-2" />
                          {t.teams.projects.list("new_project")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/portal/teams/${obfuscate(team.id)}/workflows/new`,
                            )
                          }
                        >
                          <GitBranch className="h-4 w-4 mr-2" />
                          {t.workflows.list("new_workflow")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setIsSheetOpen(true)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          {t.teams.dashboard("edit_team")}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* ── Horizontal tab navigation ── */}
          <div className="px-6">
            <TeamNavLayout teamId={team.id!} />
          </div>

          {/* ── Page content ── */}
          <div className="flex-1 p-6 flex flex-col gap-4">{children}</div>
        </div>
      </div>

      <TeamNewSheet
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        teamId={team.id!}
        onCreated={refreshTeam}
      />

      <AddUserToTeamDialog
        open={isAddMemberOpen}
        setOpen={setIsAddMemberOpen}
        teamEntity={team}
        onSaveSuccess={() => {
          setIsAddMemberOpen(false);
          router.push(`/portal/teams/${obfuscate(team.id)}/members`);
        }}
      />

      <ProjectEditDialog
        open={isAddProjectOpen}
        setOpen={setIsAddProjectOpen}
        teamEntity={team}
        project={null}
        onSaveSuccess={(savedProject) => {
          setIsAddProjectOpen(false);
          router.push(
            `/portal/teams/${obfuscate(team.id)}/projects/${savedProject.shortName}`,
          );
        }}
      />

      <NewTicketToTeamDialog
        open={isNewTicketOpen}
        setOpen={setIsNewTicketOpen}
        teamEntity={team}
        workflow={selectedWorkflow}
        onSaveSuccess={() => {
          setIsNewTicketOpen(false);
          if (isOnTicketsPage) router.refresh();
          else router.push(`/portal/teams/${obfuscate(team.id)}/tickets`);
        }}
      />
    </div>
  );
}
