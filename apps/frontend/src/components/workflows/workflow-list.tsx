"use client";

import { ArrowDownAZ, ArrowUpAZ, Ellipsis, Plus, Trash } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

import { Heading } from "@/components/heading";
import LoadingPlaceholder from "@/components/shared/loading-place-holder";
import PaginationExt from "@/components/shared/pagination-ext";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { WorkflowDTO } from "@/types/workflows";

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

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-row justify-between">
        <Heading
          title={t.workflows.list("title", { totalElements })}
          description={t.workflows.list("description")}
        />

        <div className="flex space-x-4">
          <Input
            className="w-[18rem]"
            placeholder={t.workflows.common("search_workflow")}
            onChange={(e) => {
              handleSearchTeams(e.target.value);
            }}
            defaultValue={searchParams.get("name")?.toString()}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" onClick={toggleSortDirection}>
                {sortDirection === "asc" ? <ArrowDownAZ /> : <ArrowUpAZ />}
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
              href={"/portal/settings/workflows/new"}
              className={cn(buttonVariants({ variant: "default" }))}
            >
              <Plus className="mr-2 h-4 w-4" />{" "}
              {t.workflows.list("new_workflow")}
            </Link>
          )}
        </div>
      </div>
      <Separator />
      {loading ? (
        <LoadingPlaceholder
          message={t.common.misc("loading_data")}
          skeletonCount={3}
          skeletonWidth="28rem"
        />
      ) : (
        <div className="flex flex-row flex-wrap gap-4 content-around">
          {items?.map((workflow) => (
            <div
              key={workflow.id}
              className="w-md flex flex-col gap-4 border px-4 py-4 rounded-2xl relative"
            >
              {/* Ribbon for visibility */}
              {workflow.visibility === "PUBLIC" && (
                <div className="absolute bottom-0 right-0 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-br-2xl rounded-tl-md shadow-md border">
                  PUBLIC
                </div>
              )}
              {workflow.visibility === "PRIVATE" && (
                <div className="absolute bottom-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-br-2xl rounded-tl-md shadow-md border">
                  PRIVATE
                </div>
              )}
              {workflow.visibility === "TEAM" && (
                <div className="absolute bottom-0 right-0 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-br-2xl rounded-tl-md shadow-md border">
                  TEAM
                </div>
              )}

              <div>
                <Link
                  href={`${getWorkflowViewRoute(workflow)}`}
                  className={cn(
                    buttonVariants({ variant: "link" }),
                    "w-full text-left block px-0",
                  )}
                >
                  {workflow.name}
                </Link>
              </div>
              <div className="text-sm">
                Ticket type:{" "}
                <Badge variant="secondary">{workflow.requestName}</Badge>
              </div>
              <div className="text-sm">{workflow.description}</div>
              {PermissionUtils.canWrite(permissionLevel) &&
                !workflow.useForProject && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Ellipsis className="cursor-pointer absolute top-2 right-2" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                deleteWorkflowOutOfWorkspace(workflow)
                              }
                            >
                              <Trash /> Delete workflow
                            </DropdownMenuItem>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              This action will remove workflow {workflow.name}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
            </div>
          ))}
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
