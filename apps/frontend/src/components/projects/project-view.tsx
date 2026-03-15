"use client";

import {
  BarChart2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import ProjectBoardView from "@/components/projects/project-board-view";
import ProjectEditDialog from "@/components/projects/project-edit-dialog";
import ProjectSettings from "@/components/projects/project-settings";
import ProjectReportsView from "@/components/projects/reports/project-reports-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  findByShortName,
  findProjectWorkflowByTeam,
} from "@/lib/actions/project.action";
import { calculateDuration } from "@/lib/datetime";
import { obfuscate } from "@/lib/endecode";
import { useError } from "@/providers/error-provider";
import { useTeam } from "@/providers/team-provider";
import { TimeRangeProvider } from "@/providers/time-range-provider";
import { useUserTeamRole } from "@/providers/user-team-role-provider";
import { ProjectDTO } from "@/types/projects";
import { PermissionUtils } from "@/types/resources";
import { WorkflowDetailDTO } from "@/types/workflows";

export default function ProjectView({
  projectShortName,
}: {
  projectShortName: string;
}) {
  const team = useTeam();
  const permissionLevel = usePagePermission();
  const teamRole = useUserTeamRole().role;
  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const { setError } = useError();
  const t = useAppClientTranslations();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [isProjectEditDialogOpen, setIsProjectEditDialogOpen] = useState(false);

  // Persist active top-level tab in ?tab= param
  const VALID_TABS = ["board", "reports", "settings"] as const;
  type TabView = (typeof VALID_TABS)[number];
  const rawTab = searchParams.get("tab") ?? "board";
  const currentView: TabView = VALID_TABS.includes(rawTab as TabView)
    ? (rawTab as TabView)
    : "board";

  const setCurrentView = (v: TabView) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", v);
    // When switching away from board, remove the sub-view param to keep URL clean
    if (v !== "board") params.delete("view");
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Board height — measured dynamically
  const headerRef = useRef<HTMLDivElement>(null);

  const fetchProjectData = useCallback(async () => {
    setLoading(true);
    try {
      const projectData = await findByShortName(projectShortName, setError);
      setProject(projectData);
      const workflowData = await findProjectWorkflowByTeam(team.id!, setError);
      setWorkflow(workflowData);
    } finally {
      setLoading(false);
    }
  }, [projectShortName, team.id, setError]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("teams"), link: "/portal/teams" },
    { title: team.name, link: `/portal/teams/${obfuscate(team.id)}` },
    {
      title: t.common.navigation("projects"),
      link: `/portal/teams/${obfuscate(team.id)}/projects`,
    },
    { title: project?.name!, link: "#" },
  ];

  return (
    <div className="min-w-0" data-testid="project-view-container">
      {loading ? (
        <p className="text-lg font-semibold" data-testid="project-view-loading">
          {t.common.misc("loading_data")}
        </p>
      ) : project && workflow ? (
        <>
          {/* ── Project Header ── */}
          <div
            ref={headerRef}
            className="mb-4"
            data-testid="project-view-header"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <h1
                  className="text-2xl font-bold truncate"
                  data-testid="project-view-title"
                >
                  {project.name}
                </h1>
                {project.shortName && (
                  <Badge
                    variant="outline"
                    className="font-mono text-xs shrink-0"
                  >
                    {project.shortName}
                  </Badge>
                )}
                {project.status && (
                  <Badge
                    variant={
                      project.status === "Active" ? "default" : "secondary"
                    }
                    className="shrink-0"
                  >
                    {project.status}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                  className="h-7 w-7 shrink-0"
                  testId="project-view-collapse-button"
                >
                  {isHeaderCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {(PermissionUtils.canWrite(permissionLevel) ||
                teamRole === "manager") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setIsProjectEditDialogOpen(true)}
                  testId="project-view-edit-project"
                >
                  <Edit className="w-4 h-4" />
                  {t.teams.projects.view("edit_project")}
                </Button>
              )}
            </div>

            <div data-testid="project-view-breadcrumbs">
              <Breadcrumbs items={breadcrumbItems} />
            </div>

            {!isHeaderCollapsed && (
              <div
                className="mt-4 space-y-3"
                data-testid="project-view-details"
              >
                {project.description && (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground **:my-0"
                    dangerouslySetInnerHTML={{ __html: project.description }}
                    data-testid="project-view-description"
                  />
                )}
                <div
                  className="flex flex-wrap items-center gap-3"
                  data-testid="project-view-metadata"
                >
                  {project.startDate && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-medium">
                        {t.teams.projects.form("start_date")}:
                      </span>
                      <span>
                        {new Date(project.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {project.endDate && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-medium">
                        {t.teams.projects.form("end_date")}:
                      </span>
                      <span>
                        {new Date(project.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {project.startDate && project.endDate && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-medium">
                        {t.teams.projects.view("duration")}:
                      </span>
                      <span>
                        {calculateDuration(project.startDate, project.endDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator className="mb-4" />

          {/* ── View Tabs ── */}
          <Tabs
            defaultValue="board"
            value={currentView}
            onValueChange={(v) => setCurrentView(v as typeof currentView)}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="board" data-testid="board-view-tab">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                {t.teams.projects.view("board")}
              </TabsTrigger>
              <TabsTrigger value="reports" data-testid="reports-view-tab">
                <BarChart2 className="mr-2 h-4 w-4" />
                {t.teams.projects.list("reports")}
              </TabsTrigger>
              <TabsTrigger value="settings" data-testid="settings-view-tab">
                <Settings className="mr-2 h-4 w-4" />
                {t.teams.projects.list("settings")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="board" className="min-w-0">
              <ProjectBoardView project={project} workflow={workflow} />
            </TabsContent>

            <TabsContent value="reports">
              <TimeRangeProvider>
                <Suspense>
                  <ProjectReportsView
                    teamId={team.id!}
                    projectId={project.id!}
                  />
                </Suspense>
              </TimeRangeProvider>
            </TabsContent>

            <TabsContent value="settings">
              <ProjectSettings projectId={project.id!} />
            </TabsContent>
          </Tabs>

          {/* ── Project Edit Dialog ── */}
          <ProjectEditDialog
            open={isProjectEditDialogOpen}
            setOpen={setIsProjectEditDialogOpen}
            teamEntity={team}
            project={project}
            onSaveSuccess={async () => {
              setIsProjectEditDialogOpen(false);
              await fetchProjectData();
            }}
          />
        </>
      ) : (
        <p className="text-destructive" data-testid="project-view-not-found">
          {t.teams.projects.view("project_not_found")}.
        </p>
      )}
    </div>
  );
}
