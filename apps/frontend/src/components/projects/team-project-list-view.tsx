"use client";

import {
  Archive,
  CalendarDays,
  Ellipsis,
  FolderOpen,
  Pencil,
  Plus,
  Trash,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { Heading } from "@/components/heading";
import ProjectEditDialog from "@/components/projects/project-edit-dialog";
import { TeamAvatar } from "@/components/shared/avatar-display";
import LoadingPlaceHolder from "@/components/shared/loading-place-holder";
import PaginationExt from "@/components/shared/pagination-ext";
import TeamNavLayout from "@/components/teams/team-nav";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  deleteProject,
  searchProjects,
  updateProject,
} from "@/lib/actions/project.action";
import { obfuscate } from "@/lib/endecode";
import { BreadcrumbProvider } from "@/providers/breadcrumb-provider";
import { useError } from "@/providers/error-provider";
import { useTeam } from "@/providers/team-provider";
import { useUserTeamRole } from "@/providers/user-team-role-provider";
import { ProjectDTO, ProjectStatus } from "@/types/projects";
import { Filter, QueryDTO } from "@/types/query";
import { PermissionUtils } from "@/types/resources";

const TeamProjectListView = () => {
  const team = useTeam();
  const t = useAppClientTranslations();

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("teams"), link: "/portal/teams" },
    { title: team.name, link: `/portal/teams/${obfuscate(team.id)}` },
    { title: t.common.navigation("projects"), link: "#" },
  ];

  const permissionLevel = usePagePermission();
  const teamRole = useUserTeamRole().role;

  const [openDialog, setOpenDialog] = useState(false);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus>("Active");
  const { setError } = useError();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectDTO | null>(
    null,
  );

  const canManage =
    PermissionUtils.canWrite(permissionLevel) || teamRole === "manager";

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const filters: Filter[] = [
        { field: "team.id", operator: "eq", value: team.id! },
        { field: "status", operator: "eq", value: statusFilter },
      ];
      if (debouncedSearch.trim()) {
        filters.push({
          field: "name",
          operator: "lk",
          value: `%${debouncedSearch}%`,
        });
      }
      const query: QueryDTO = { groups: [{ logicalOperator: "AND", filters }] };
      const pageResult = await searchProjects(
        query,
        {
          page: currentPage,
          size: 12,
          sort: [{ field: "createdAt", direction: "desc" }],
        },
        setError,
      );
      setProjects(pageResult.content);
      setTotalElements(pageResult.totalElements);
      setTotalPages(pageResult.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [currentPage, statusFilter, debouncedSearch]);

  const confirmDelete = (project: ProjectDTO) => {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    await deleteProject(selectedProject.id!);
    setDeleteDialogOpen(false);
    fetchProjects();
  };

  const handleStatusChange = async (
    project: ProjectDTO,
    newStatus: ProjectStatus,
  ) => {
    await updateProject(
      project.id!,
      { ...project, status: newStatus },
      setError,
    );
    fetchProjects();
  };

  const formatDate = (date?: string | null) =>
    date ? new Date(date).toLocaleDateString() : null;

  return (
    <BreadcrumbProvider items={breadcrumbItems}>
      <TeamNavLayout teamId={team.id!}>
        <div
          className="flex flex-col gap-4"
          data-testid="project-list-container"
        >
          {/* ── Toolbar ── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                title={t.teams.projects.list("title", { totalElements })}
                description={t.teams.projects.list("description")}
              />
            </div>

            {canManage && (
              <div className="flex shrink-0 items-center">
                <Button
                  onClick={() => {
                    setSelectedProject(null);
                    setOpenDialog(true);
                  }}
                  data-testid="new-project-button"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t.teams.projects.list("new_project")}
                </Button>
                <ProjectEditDialog
                  open={openDialog}
                  setOpen={setOpenDialog}
                  teamEntity={team}
                  project={selectedProject}
                  onSaveSuccess={fetchProjects}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* ── Search & status filter ── */}
          <div
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
            data-testid="project-search-filter"
          >
            <Input
              type="text"
              placeholder={t.teams.projects.list("search_place_holder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64"
              data-testid="project-search-input"
            />
            <ToggleGroup
              type="single"
              value={statusFilter}
              onValueChange={(value) => {
                if (value === "Active" || value === "Closed")
                  setStatusFilter(value as ProjectStatus);
              }}
              data-testid="project-status-filter"
            >
              <ToggleGroupItem
                value="Active"
                data-testid="project-status-active"
              >
                {t.teams.projects.list("status_active")}
              </ToggleGroupItem>
              <ToggleGroupItem
                value="Closed"
                data-testid="project-status-closed"
              >
                {t.teams.projects.list("status_closed")}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* ── Content ── */}
          {loading ? (
            <LoadingPlaceHolder
              message={t.common.misc("loading_data")}
              skeletonCount={6}
              skeletonWidth="100%"
              data-testid="project-loading"
            />
          ) : projects.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center"
              data-testid="no-projects-message"
            >
              <FolderOpen className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {t.teams.projects.list("no_projects_found")}
              </p>
              {canManage && (
                <Button
                  onClick={() => {
                    setSelectedProject(null);
                    setOpenDialog(true);
                  }}
                  className="mt-1"
                  data-testid="new-project-button-empty"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t.teams.projects.list("new_project")}
                </Button>
              )}
            </div>
          ) : (
            <>
              <div
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                data-testid="project-grid"
              >
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className="group flex flex-col transition-all hover:shadow-md hover:bg-muted/50"
                    data-testid={`project-card-${project.id}`}
                  >
                    <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              project.status === "Active"
                                ? "default"
                                : "secondary"
                            }
                            data-testid={`project-status-${project.id}`}
                          >
                            {project.status}
                          </Badge>
                          <span
                            className="text-xs text-muted-foreground font-mono"
                            data-testid={`project-short-name-${project.id}`}
                          >
                            {project.shortName}
                          </span>
                        </div>
                        <CardTitle className="text-base leading-snug">
                          <Link
                            href={`/portal/teams/${obfuscate(team.id)}/projects/${project.shortName}`}
                            className="hover:text-primary hover:underline underline-offset-4 transition-colors"
                            data-testid={`project-name-link-${project.id}`}
                          >
                            {project.name}
                          </Link>
                        </CardTitle>
                      </div>

                      {/* Hover-reveal actions */}
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              data-testid={`project-actions-${project.id}`}
                            >
                              <Ellipsis className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => {
                                setSelectedProject(project);
                                setOpenDialog(true);
                              }}
                              data-testid={`project-edit-${project.id}`}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              {t.common.buttons("edit")}
                            </DropdownMenuItem>
                            {project.status === "Active" ? (
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() =>
                                  handleStatusChange(project, "Closed")
                                }
                                data-testid={`project-close-${project.id}`}
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                {t.teams.projects.list("close_project")}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() =>
                                  handleStatusChange(project, "Active")
                                }
                                data-testid={`project-reopen-${project.id}`}
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                {t.teams.projects.list("reopen_project")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="cursor-pointer text-destructive focus:text-destructive"
                              onClick={() => confirmDelete(project)}
                              data-testid={`project-delete-${project.id}`}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              {t.common.buttons("delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </CardHeader>

                    <CardContent className="flex-1">
                      {project.description ? (
                        <p
                          className="line-clamp-3 text-sm text-muted-foreground"
                          data-testid={`project-description-${project.id}`}
                        >
                          {project.description}
                        </p>
                      ) : (
                        <p className="text-sm italic text-muted-foreground/50">
                          {t.teams.projects.list("no_description")}
                        </p>
                      )}
                    </CardContent>

                    <CardFooter className="border-t pt-3 flex flex-wrap gap-x-4 gap-y-1">
                      {(project.startDate || project.endDate) && (
                        <div
                          className="flex items-center gap-1.5 text-xs text-muted-foreground"
                          data-testid={`project-dates-${project.id}`}
                        >
                          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {formatDate(project.startDate) ?? "—"}
                            {" → "}
                            {formatDate(project.endDate) ?? "—"}
                          </span>
                        </div>
                      )}
                      {project.createdAt && (
                        <div
                          className="flex items-center gap-1.5 text-xs text-muted-foreground"
                          data-testid={`project-created-at-${project.id}`}
                        >
                          <span>{t.teams.projects.form("created_at")}:</span>
                          <span>{formatDate(project.createdAt)}</span>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>

              <PaginationExt
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                data-testid="project-pagination"
              />
            </>
          )}
        </div>

        {/* ── Delete confirmation ── */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent data-testid="delete-project-dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t.teams.projects.list("delete_project_dialog_title")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t.teams.projects.list("delete_project_dialog_confirmation", {
                  projectName: selectedProject?.name ?? "",
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="cancel-delete-project">
                {t.common.buttons("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="confirm-delete-project"
              >
                {t.common.buttons("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TeamNavLayout>
    </BreadcrumbProvider>
  );
};

export default TeamProjectListView;
