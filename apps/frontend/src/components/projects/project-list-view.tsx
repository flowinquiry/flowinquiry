"use client";

import { CalendarDays, FolderOpen, LayoutList, Users } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

import { Heading } from "@/components/heading";
import LoadingPlaceHolder from "@/components/shared/loading-place-holder";
import PaginationExt from "@/components/shared/pagination-ext";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { findProjectsByUserId } from "@/lib/actions/project.action";
import { obfuscate } from "@/lib/endecode";
import { useError } from "@/providers/error-provider";
import { ProjectDTO, ProjectStatus } from "@/types/projects";

type ViewMode = "flat" | "grouped";
const PAGE_SIZE = 12;

const ProjectListView = () => {
  const t = useAppClientTranslations();
  const { data: session } = useSession();

  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus>("Active");
  const [viewMode, setViewMode] = useState<ViewMode>("flat");
  const { setError } = useError();

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchProjects = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const pageResult = await findProjectsByUserId(session.user.id, setError);
      let filtered = pageResult.content.filter(
        (p) => p.status === statusFilter,
      );
      if (debouncedSearch.trim()) {
        filtered = filtered.filter((p) =>
          p.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
        );
      }
      setProjects(filtered);
      setTotalElements(filtered.length);
      setTotalPages(Math.ceil(filtered.length / PAGE_SIZE));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    setCurrentPage(1);
  }, [session, statusFilter, debouncedSearch, viewMode]);

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString() : null;

  const pagedProjects = projects.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  /* ── grouped data ── */
  const groupedByTeam = Object.entries(
    projects.reduce(
      (acc, p) => {
        const key = p.teamId;
        if (!acc[key])
          acc[key] = { teamName: p.teamName ?? "Unknown", projects: [] };
        acc[key].projects.push(p);
        return acc;
      },
      {} as Record<number, { teamName: string; projects: ProjectDTO[] }>,
    ),
  ).sort(([, a], [, b]) => a.teamName.localeCompare(b.teamName));

  /* ── shared card renderer ── */
  const ProjectCard = ({ project }: { project: ProjectDTO }) => (
    <Card
      key={project.id}
      className="group flex flex-col transition-all hover:shadow-md hover:bg-muted/50"
      data-testid={`project-card-${project.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Badge
            variant={project.status === "Active" ? "default" : "secondary"}
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
            href={`/portal/teams/${obfuscate(project.teamId)}/projects/${project.shortName}`}
            className="hover:text-primary hover:underline underline-offset-4 transition-colors"
            data-testid={`project-name-link-${project.id}`}
          >
            {project.name}
          </Link>
        </CardTitle>
        {project.teamName && viewMode === "flat" && (
          <Link
            href={`/portal/teams/${obfuscate(project.teamId)}`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-0.5 w-fit"
            data-testid={`project-team-link-${project.id}`}
          >
            <Users className="h-3 w-3" />
            {project.teamName}
          </Link>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        {project.description ? (
          <div
            className="line-clamp-3 text-sm text-muted-foreground prose prose-sm max-w-none dark:prose-invert **:my-0"
            dangerouslySetInnerHTML={{ __html: project.description }}
            data-testid={`project-description-${project.id}`}
          />
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
  );

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="user-project-list-container"
    >
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Heading
          title={t.teams.projects.list("title", { totalElements })}
          description={t.teams.projects.list("description")}
        />
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(v) => {
            if (v === "flat" || v === "grouped") setViewMode(v as ViewMode);
          }}
          className="shrink-0 rounded-lg border bg-muted p-1 gap-1"
          data-testid="project-view-mode-toggle"
        >
          <ToggleGroupItem
            value="flat"
            className="rounded-md px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm data-[state=on]:text-foreground text-muted-foreground"
            data-testid="project-view-flat"
          >
            <LayoutList className="mr-1.5 h-4 w-4" />
            {t.teams.projects.list("flat_view")}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="grouped"
            className="rounded-md px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm data-[state=on]:text-foreground text-muted-foreground"
            data-testid="project-view-grouped"
          >
            <Users className="mr-1.5 h-4 w-4" />
            {t.teams.projects.list("group_by_team")}
          </ToggleGroupItem>
        </ToggleGroup>
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
          onValueChange={(v) => {
            if (v === "Active" || v === "Closed")
              setStatusFilter(v as ProjectStatus);
          }}
          className="rounded-lg border bg-muted p-1 gap-1"
          data-testid="project-status-filter"
        >
          <ToggleGroupItem
            value="Active"
            className="rounded-md px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm data-[state=on]:text-foreground text-muted-foreground"
            data-testid="project-status-active"
          >
            {t.teams.projects.list("status_active")}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="Closed"
            className="rounded-md px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm data-[state=on]:text-foreground text-muted-foreground"
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
        </div>
      ) : viewMode === "flat" ? (
        <>
          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
            data-testid="project-grid"
          >
            {pagedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          <PaginationExt
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            data-testid="project-pagination"
          />
        </>
      ) : (
        /* ── Grouped view ── */
        <div
          className="flex flex-col gap-6"
          data-testid="grouped-projects-container"
        >
          {groupedByTeam.map(
            ([teamId, { teamName, projects: teamProjects }]) => (
              <section key={teamId} data-testid={`team-group-${teamId}`}>
                {/* Pill header */}
                <div className="flex items-center gap-2 mb-3">
                  <Link
                    href={`/portal/teams/${obfuscate(Number(teamId))}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                    data-testid={`team-name-link-${teamId}`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    {teamName}
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {teamProjects.length}
                    </span>
                  </Link>
                </div>

                <div
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                  data-testid={`team-projects-grid-${teamId}`}
                >
                  {teamProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </section>
            ),
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectListView;
