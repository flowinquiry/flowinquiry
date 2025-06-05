"use client";

import { Archive, Loader, MoreHorizontal, Pencil, Trash } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { Heading } from "@/components/heading";
import ProjectEditDialog from "@/components/projects/project-edit-dialog";
import { TeamAvatar } from "@/components/shared/avatar-display";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const ProjectListView = () => {
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

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectDTO | null>(
    null,
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
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
          size: 10,
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

  const onCreatedOrUpdatedProjectSuccess = () => {
    fetchProjects();
  };

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
    const updatedProject = { ...project, status: newStatus };
    await updateProject(project.id!, updatedProject, setError);
    fetchProjects();
  };

  return (
    <BreadcrumbProvider items={breadcrumbItems}>
      <TeamNavLayout teamId={team.id!}>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger>
                  <TeamAvatar imageUrl={team.logoUrl} size="w-20 h-20" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs whitespace-pre-wrap break-words">
                  <div className="text-left">
                    <p className="font-bold">{team.name}</p>
                    <p className="text-sm text-gray-500">
                      {team.slogan ?? t.teams.common("default_slogan")}
                    </p>
                    {team.description && (
                      <p className="text-sm text-gray-500">
                        {team.description}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
              <Heading
                title={t.teams.projects.list("title", { totalElements })}
                description={t.teams.projects.list("description")}
              />
            </div>
            {(PermissionUtils.canWrite(permissionLevel) ||
              teamRole === "manager") && (
              <div className="flex items-center">
                <Button
                  onClick={() => {
                    setSelectedProject(null);
                    setOpenDialog(true);
                  }}
                >
                  {t.teams.projects.list("new_project")}
                </Button>
                <ProjectEditDialog
                  open={openDialog}
                  setOpen={setOpenDialog}
                  teamEntity={team}
                  project={selectedProject}
                  onSaveSuccess={onCreatedOrUpdatedProjectSuccess}
                />
              </div>
            )}
          </div>

          {/* Search & Status Filter Row */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md border border-gray-300 dark:border-gray-700">
            <Input
              type="text"
              placeholder={t.teams.projects.list("search_place_holder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <ToggleGroup
              type="single"
              value={statusFilter}
              onValueChange={(value) => {
                if (value && (value === "Active" || value === "Closed")) {
                  setStatusFilter(value as ProjectStatus);
                }
              }}
            >
              <ToggleGroupItem value="Active">Active</ToggleGroupItem>
              <ToggleGroupItem value="Closed">Closed</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center p-6">
                <Loader className="w-6 h-6 animate-spin" />
              </div>
            ) : projects.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.teams.projects.form("name")}</TableHead>
                      <TableHead>
                        {t.teams.projects.form("short_name")}
                      </TableHead>
                      <TableHead>{t.teams.projects.form("status")}</TableHead>
                      <TableHead>
                        {t.teams.projects.form("start_date")}
                      </TableHead>
                      <TableHead>{t.teams.projects.form("end_date")}</TableHead>
                      <TableHead>
                        {t.teams.projects.form("created_at")}
                      </TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <Link
                            href={`/portal/teams/${obfuscate(team.id)}/projects/${project.shortName}`}
                            className="text-blue-500 hover:underline"
                          >
                            {project.name}
                          </Link>
                        </TableCell>
                        <TableCell>{project.shortName}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              project.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {project.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {project.startDate
                            ? new Date(project.startDate).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {project.endDate
                            ? new Date(project.endDate).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {project.createdAt
                            ? new Date(project.createdAt).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-5 h-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => {
                                  setSelectedProject(project);
                                  setOpenDialog(true);
                                }}
                              >
                                <Pencil className="w-4 h-4 mr-2" />{" "}
                                {t.common.buttons("edit")}
                              </DropdownMenuItem>
                              {project.status === "Active" ? (
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() =>
                                    handleStatusChange(project, "Closed")
                                  }
                                >
                                  <Archive className="w-4 h-4 mr-2" />{" "}
                                  {t.teams.projects.list("close_project")}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() =>
                                    handleStatusChange(project, "Active")
                                  }
                                >
                                  <Archive className="w-4 h-4 mr-2" />{" "}
                                  {t.teams.projects.list("reopen_project")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="cursor-pointer text-red-600"
                                onClick={() => confirmDelete(project)}
                              >
                                <Trash className="w-4 h-4 mr-2" />{" "}
                                {t.common.buttons("delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationExt
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            ) : (
              <p className="text-gray-500 text-center">
                {t.teams.projects.list("no_projects_found")}
              </p>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
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
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
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

export default ProjectListView;
