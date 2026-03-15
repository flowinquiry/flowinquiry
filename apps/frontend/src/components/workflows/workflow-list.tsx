"use client";

import {
  ArrowDownAZ,
  ArrowUpAZ,
  Ellipsis,
  GitBranch,
  Plus,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

import { Heading } from "@/components/heading";
import LoadingPlaceholder from "@/components/shared/loading-place-holder";
import PaginationExt from "@/components/shared/pagination-ext";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  deleteWorkflow,
  searchWorkflows,
} from "@/lib/actions/workflows.action";
import { obfuscate } from "@/lib/endecode";
import { cn } from "@/lib/utils";
import { useError } from "@/providers/error-provider";
import { QueryDTO } from "@/types/query";
import { PermissionUtils } from "@/types/resources";
import { WorkflowDTO, WorkflowVisibility } from "@/types/workflows";

const WorkflowsView = () => {
  const [items, setItems] = useState<Array<WorkflowDTO>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [workflowSearchTerm, setWorkflowSearchTerm] = useState<
    string | undefined
  >(undefined);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const { setError } = useError();
  const permissionLevel = usePagePermission();
  const t = useAppClientTranslations();

  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);

    const query: QueryDTO = {
      filters: workflowSearchTerm
        ? [
            {
              field: "name",
              operator: "lk",
              value: workflowSearchTerm,
            },
          ]
        : [],
    };

    searchWorkflows(
      query,
      {
        page: currentPage,
        size: 10,
        sort: [
          {
            field: "name",
            direction: sortDirection,
          },
        ],
      },
      setError,
    )
      .then((pageResult) => {
        setItems(pageResult.content);
        setTotalElements(pageResult.totalElements);
        setTotalPages(pageResult.totalPages);
      })
      .finally(() => setLoading(false));
  }, [
    workflowSearchTerm,
    currentPage,
    sortDirection,
    setLoading,
    setItems,
    setTotalElements,
    setTotalPages,
  ]);

  const handleSearchTeams = useDebouncedCallback((userName: string) => {
    const params = new URLSearchParams(searchParams);
    if (userName) {
      params.set("name", userName);
    } else {
      params.delete("name");
    }
    setWorkflowSearchTerm(userName);
    replace(`${pathname}?${params.toString()}`);
  }, 2000);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const getWorkflowViewRoute = (workflow: WorkflowDTO) => {
    if (workflow.ownerId === null) {
      return `/portal/settings/workflows/${obfuscate(workflow.id)}`;
    }
    return `/portal/teams/${obfuscate(workflow.ownerId)}/workflows/${obfuscate(workflow.id)}`;
  };

  const deleteWorkflowOutOfWorkspace = async (workflow: WorkflowDTO) => {
    await deleteWorkflow(workflow.id!, setError);
    await fetchWorkflows();
  };

  const visibilityConfig: Record<
    WorkflowVisibility,
    { label: string; className: string }
  > = {
    PUBLIC: {
      label: "Public",
      className:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    PRIVATE: {
      label: "Private",
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
    TEAM: {
      label: "Team",
      className:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <Heading
          title={t.workflows.list("title", { totalElements })}
          description={t.workflows.list("description")}
        />
        <div className="flex shrink-0 items-center gap-2">
          <Input
            className="w-48 lg:w-64"
            placeholder={t.workflows.common("search_workflow")}
            onChange={(e) => handleSearchTeams(e.target.value)}
            defaultValue={searchParams.get("name")?.toString()}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleSortDirection}
              >
                {sortDirection === "asc" ? (
                  <ArrowDownAZ className="h-4 w-4" />
                ) : (
                  <ArrowUpAZ className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {sortDirection === "asc"
                ? t.workflows.list("sort_a_z")
                : t.workflows.list("sort_z_a")}
            </TooltipContent>
          </Tooltip>
          {PermissionUtils.canWrite(permissionLevel) && (
            <Link
              href="/portal/settings/workflows/new"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t.workflows.list("new_workflow")}
            </Link>
          )}
        </div>
      </div>

      <Separator />

      {/* Content */}
      {loading ? (
        <LoadingPlaceholder
          message={t.common.misc("loading_data")}
          skeletonCount={6}
          skeletonWidth="100%"
        />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <GitBranch className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No workflows found. Create one to get started.
          </p>
          {PermissionUtils.canWrite(permissionLevel) && (
            <Link
              href="/portal/settings/workflows/new"
              className={cn(buttonVariants({ variant: "default" }), "mt-1")}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t.workflows.list("new_workflow")}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((workflow) => {
            const vis = workflow.visibility as WorkflowVisibility | undefined;
            const visConfig = vis ? visibilityConfig[vis] : null;

            return (
              <Card
                key={workflow.id}
                className="group flex flex-col transition-shadow hover:shadow-md gap-0 py-0"
              >
                <CardHeader className="px-4 flex flex-row items-start justify-between gap-2 pb-2 pt-3">
                  <CardTitle className="text-base leading-snug">
                    <Link
                      href={getWorkflowViewRoute(workflow)}
                      className="hover:text-primary hover:underline underline-offset-4 transition-colors line-clamp-2"
                    >
                      {workflow.name}
                    </Link>
                  </CardTitle>

                  {PermissionUtils.canWrite(permissionLevel) &&
                    !workflow.useForProject && (
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
                                    deleteWorkflowOutOfWorkspace(workflow)
                                  }
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete workflow
                                </DropdownMenuItem>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p>
                                  Remove workflow &ldquo;{workflow.name}&rdquo;
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                </CardHeader>

                <CardContent className="p-0 px-4 py-2 flex-1">
                  {workflow.description ? (
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {workflow.description}
                    </p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground/50">
                      No description provided.
                    </p>
                  )}
                </CardContent>

                <CardFooter className="p-0 px-4 flex items-center justify-between gap-2 py-2 border-t [&.border-t]:pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Ticket type:</span>
                    <Badge variant="secondary" className="text-xs">
                      {workflow.requestName}
                    </Badge>
                  </div>
                  {visConfig && (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        visConfig.className,
                      )}
                    >
                      {visConfig.label}
                    </span>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <PaginationExt
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
};

export default WorkflowsView;
