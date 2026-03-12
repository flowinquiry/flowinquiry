"use client";

import { Ellipsis, GitBranch, Plus, Trash, Workflow } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { Heading } from "@/components/heading";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  deleteTeamWorkflow,
  getWorkflowsByTeam,
} from "@/lib/actions/workflows.action";
import { obfuscate } from "@/lib/endecode";
import { cn } from "@/lib/utils";
import { BreadcrumbProvider } from "@/providers/breadcrumb-provider";
import { useError } from "@/providers/error-provider";
import { useTeam } from "@/providers/team-provider";
import { useUserTeamRole } from "@/providers/user-team-role-provider";
import { PermissionUtils } from "@/types/resources";
import { WorkflowDTO } from "@/types/workflows";

const TeamWorkflowsView = () => {
  const team = useTeam();
  const t = useAppClientTranslations();

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("teams"), link: "/portal/teams" },
    { title: team.name, link: `/portal/teams/${obfuscate(team.id)}` },
    { title: t.common.navigation("workflows"), link: "#" },
  ];

  const permissionLevel = usePagePermission();
  const teamRole = useUserTeamRole().role;
  const [loading, setLoading] = useState(false);
  const [workflows, setWorkflows] = useState<WorkflowDTO[]>([]);
  const { setError } = useError();

  const canManage =
    PermissionUtils.canWrite(permissionLevel) || teamRole === "manager";

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const result = await getWorkflowsByTeam(team.id!, undefined, setError);
      setWorkflows(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const getWorkflowViewRoute = (workflow: WorkflowDTO) => {
    if (workflow.ownerId === null) {
      return `/portal/settings/workflows/${obfuscate(workflow.id)}`;
    }
    return `/portal/teams/${obfuscate(workflow.ownerId)}/workflows/${obfuscate(workflow.id)}`;
  };

  const deleteWorkflowFromTeam = async (workflow: WorkflowDTO) => {
    await deleteTeamWorkflow(team.id!, workflow.id!, setError);
    await fetchWorkflows();
  };

  return (
    <BreadcrumbProvider items={breadcrumbItems}>
      <div className="flex flex-col gap-4">
        {/* ── Toolbar ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <Heading
            title={t.common.navigation("workflows")}
            description={t.workflows.list("description")}
          />

          {canManage && (
            <Link
              href={`/portal/teams/${obfuscate(team.id)}/workflows/new`}
              className={cn(buttonVariants({ variant: "default" }), "shrink-0")}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t.workflows.list("new_workflow")}
            </Link>
          )}
        </div>

        <Separator />

        {/* ── Content ── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-4 w-16" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
            <Workflow className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {t.workflows.list("no_workflows")}
            </p>
            {canManage && (
              <Link
                href={`/portal/teams/${obfuscate(team.id)}/workflows/new`}
                className={cn(buttonVariants({ variant: "default" }), "mt-1")}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t.workflows.list("new_workflow")}
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {workflows.map((workflow) => (
              <Card
                key={workflow.id}
                className="group flex flex-col transition-all hover:shadow-md hover:bg-muted/50"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                  <div className="min-w-0 flex-1">
                    {/* Global badge */}
                    {workflow.ownerId === null && (
                      <Badge variant="secondary" className="mb-1.5">
                        {t.workflows.common("global")}
                      </Badge>
                    )}
                    <CardTitle className="text-base leading-snug">
                      <Link
                        href={getWorkflowViewRoute(workflow)}
                        className="hover:text-primary hover:underline underline-offset-4 transition-colors"
                      >
                        {workflow.name}
                      </Link>
                    </CardTitle>
                    {workflow.requestName !== workflow.name && (
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {workflow.requestName}
                      </p>
                    )}
                  </div>

                  {/* Hover-reveal actions */}
                  {canManage &&
                    !workflow.useForProject &&
                    workflow.ownerId !== null && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Ellipsis className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuItem
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                  onClick={() =>
                                    deleteWorkflowFromTeam(workflow)
                                  }
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  {t.workflows.list("delete_workflow")}
                                </DropdownMenuItem>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs">
                                <p>
                                  {t.workflows.list(
                                    "delete_workflow_tooltip_1",
                                    {
                                      workflowName: workflow.name,
                                      teamName: team.name,
                                    },
                                  )}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                </CardHeader>

                <CardContent className="flex-1">
                  {workflow.description ? (
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {workflow.description}
                    </p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground/50">
                      {t.workflows.common("no_description")}
                    </p>
                  )}
                </CardContent>

                <CardFooter className="border-t pt-3 flex flex-wrap gap-2">
                  {workflow.tags
                    ?.split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  {workflow.useForProject && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <GitBranch className="h-3 w-3" />
                      {t.workflows.common("project_workflow")}
                    </Badge>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </BreadcrumbProvider>
  );
};

export default TeamWorkflowsView;
