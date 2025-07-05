"use client";

import {Loader } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

import { Heading } from "@/components/heading";
import PaginationExt from "@/components/shared/pagination-ext";
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
import { useAppClientTranslations } from "@/hooks/use-translations";
import { findProjectsByUserId } from "@/lib/actions/project.action";
import { obfuscate } from "@/lib/endecode";
import { BreadcrumbProvider } from "@/providers/breadcrumb-provider";
import { useError } from "@/providers/error-provider";
import { ProjectDTO, ProjectStatus } from "@/types/projects";

const ProjectListView = () => {
  const t = useAppClientTranslations();
  const { data: session } = useSession();
  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("projects"), link: "#" },
  ];

  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus>("Active");
  const { setError } = useError();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchProjects = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const userId = session.user.id;
      const pageResult = await findProjectsByUserId(userId, setError);

      // Filter projects based on status and search query
      let filteredProjects = pageResult.content.filter(
        (project) => project.status === statusFilter,
      );

      if (debouncedSearch.trim()) {
        filteredProjects = filteredProjects.filter((project) =>
          project.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
        );
      }

      setProjects(filteredProjects);
      setTotalElements(filteredProjects.length);
      setTotalPages(Math.ceil(filteredProjects.length / 10));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [session, statusFilter, debouncedSearch]);

  return (
    <BreadcrumbProvider items={breadcrumbItems}>
      <div
        className="grid grid-cols-1 gap-4"
        data-testid="user-project-list-container"
      >
        <div className="flex items-center justify-between">
          <Heading
            title={t.teams.projects.list("title", { totalElements })}
            description={t.teams.projects.list("description")}
          />
        </div>

        {/* Search & Status Filter Row */}
        <div
          className="flex items-center gap-4 p-4 rounded-lg shadow-md border"
          data-testid="project-search-filter"
        >
          <Input
            type="text"
            placeholder={t.teams.projects.list("search_place_holder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
            data-testid="project-search-input"
          />
          <ToggleGroup
            type="single"
            value={statusFilter}
            onValueChange={(value) => {
              if (value && (value === "Active" || value === "Closed")) {
                setStatusFilter(value as ProjectStatus);
              }
            }}
            data-testid="project-status-filter"
          >
            <ToggleGroupItem value="Active" data-testid="project-status-active">
              Active
            </ToggleGroupItem>
            <ToggleGroupItem value="Closed" data-testid="project-status-closed">
              Closed
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div
          className="p-4 rounded-lg shadow-sm"
          data-testid="project-table-container"
        >
          {loading ? (
            <div
              className="flex items-center justify-center p-6"
              data-testid="project-loading"
            >
              <Loader className="w-6 h-6 animate-spin" />
            </div>
          ) : projects.length > 0 ? (
            <>
              <Table data-testid="project-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.teams.projects.form("name")}</TableHead>
                    <TableHead>{t.teams.projects.form("short_name")}</TableHead>
                    <TableHead>{t.teams.projects.form("status")}</TableHead>
                    <TableHead>{t.common.navigation("team")}</TableHead>
                    <TableHead>{t.teams.projects.form("start_date")}</TableHead>
                    <TableHead>{t.teams.projects.form("end_date")}</TableHead>
                    <TableHead>{t.teams.projects.form("created_at")}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects
                    .slice((currentPage - 1) * 10, currentPage * 10)
                    .map((project) => (
                      <TableRow
                        key={project.id}
                        data-testid={`project-row-${project.id}`}
                      >
                        <TableCell>
                          <Link
                            href={`/portal/teams/${obfuscate(project.teamId)}/projects/${project.shortName}`}
                            className="hover:underline"
                            data-testid={`project-name-link-${project.id}`}
                          >
                            {project.name}
                          </Link>
                        </TableCell>
                        <TableCell
                          data-testid={`project-short-name-${project.id}`}
                        >
                          {project.shortName}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              project.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                            data-testid={`project-status-${project.id}`}
                          >
                            {project.status}
                          </span>
                        </TableCell>
                        <TableCell data-testid={`project-team-${project.id}`}>
                          <Link
                            href={`/portal/teams/${obfuscate(project.teamId)}`}
                            className="hover:underline"
                            data-testid={`project-team-link-${project.id}`}
                          >
                            {project.teamName}
                          </Link>
                        </TableCell>
                        <TableCell
                          data-testid={`project-start-date-${project.id}`}
                        >
                          {project.startDate
                            ? new Date(project.startDate).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell
                          data-testid={`project-end-date-${project.id}`}
                        >
                          {project.endDate
                            ? new Date(project.endDate).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell
                          data-testid={`project-created-at-${project.id}`}
                        >
                          {project.createdAt
                            ? new Date(project.createdAt).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <PaginationExt
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                data-testid="project-pagination"
              />
            </>
          ) : (
            <p className=" text-center" data-testid="no-projects-message">
              {t.teams.projects.list("no_projects_found")}
            </p>
          )}
        </div>
      </div>
    </BreadcrumbProvider>
  );
};

export default ProjectListView;
