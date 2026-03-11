"use client";

import { Edit, Workflow, X } from "lucide-react";
import React, { useEffect, useState } from "react";

import { Heading } from "@/components/heading";
import { TeamAvatar } from "@/components/shared/avatar-display";
import TeamNavLayout from "@/components/teams/team-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkflowDiagram } from "@/components/workflows/workflow-diagram-view";
import WorkflowEditForm from "@/components/workflows/workflow-editor-form";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  getWorkflowDetail,
  updateWorkflowDetail,
} from "@/lib/actions/workflows.action";
import { obfuscate } from "@/lib/endecode";
import { BreadcrumbProvider } from "@/providers/breadcrumb-provider";
import { useError } from "@/providers/error-provider";
import { useTeam } from "@/providers/team-provider";
import { useUserTeamRole } from "@/providers/user-team-role-provider";
import { PermissionUtils } from "@/types/resources";
import { WorkflowDetailDTO } from "@/types/workflows";

const TeamWorkflowDetailView = ({ workflowId }: { workflowId: number }) => {
  const team = useTeam();
  const [workflowDetail, setWorkflowDetail] =
    useState<WorkflowDetailDTO | null>(null);
  const [previewWorkflowDetail, setPreviewWorkflowDetail] =
    useState<WorkflowDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { setError } = useError();
  const t = useAppClientTranslations();

  const permissionLevel = usePagePermission();
  const teamRole = useUserTeamRole().role;

  const canManage =
    PermissionUtils.canWrite(permissionLevel) || teamRole === "manager";

  useEffect(() => {
    async function fetchWorkflowDetail() {
      setLoading(true);
      getWorkflowDetail(workflowId, setError)
        .then((data) => {
          setWorkflowDetail(data);
          setPreviewWorkflowDetail(data);
        })
        .finally(() => setLoading(false));
    }
    fetchWorkflowDetail();
  }, [workflowId]);

  const handleSave = (updatedWorkflow: WorkflowDetailDTO) => {
    updateWorkflowDetail(updatedWorkflow.id!, updatedWorkflow, setError).then(
      (data) => {
        setWorkflowDetail(data);
        setPreviewWorkflowDetail(data);
        setIsEditing(false);
      },
    );
  };

  const breadcrumbItems = workflowDetail
    ? [
        { title: t.common.navigation("dashboard"), link: "/portal" },
        { title: t.common.navigation("teams"), link: "/portal/teams" },
        {
          title: workflowDetail.ownerName!,
          link: `/portal/teams/${obfuscate(workflowDetail.ownerId)}`,
        },
        {
          title: t.common.navigation("workflows"),
          link: `/portal/teams/${obfuscate(workflowDetail.ownerId)}/workflows`,
        },
        { title: workflowDetail.name, link: "#" },
      ]
    : [];

  return (
    <BreadcrumbProvider items={breadcrumbItems}>
      <TeamNavLayout teamId={workflowDetail?.ownerId ?? team.id!}>
        <div className="flex flex-col gap-4">
          {/* ── Toolbar ── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="shrink-0 cursor-default">
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
              </TooltipProvider>

              {loading ? (
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              ) : (
                <div className="min-w-0">
                  <Heading
                    title={workflowDetail?.name ?? ""}
                    description={workflowDetail?.description ?? ""}
                  />
                  {workflowDetail?.tags && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {workflowDetail.tags
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                        .map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {canManage && !loading && (
              <Button
                variant={isEditing ? "outline" : "default"}
                onClick={() => setIsEditing(!isEditing)}
                className="shrink-0"
              >
                {isEditing ? (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    {t.workflows.detail("cancel_edit")}
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    {t.workflows.detail("customize_workflow")}
                  </>
                )}
              </Button>
            )}
          </div>

          <Separator />

          {/* ── Loading skeleton ── */}
          {loading && (
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full rounded-lg" />
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Edit form ── */}
          {isEditing && workflowDetail && !loading && (
            <WorkflowEditForm
              workflowDetail={workflowDetail}
              onCancel={() => setIsEditing(false)}
              onSave={handleSave}
              onPreviewChange={setPreviewWorkflowDetail}
            />
          )}

          {/* ── Diagram ── */}
          {previewWorkflowDetail && !loading && (
            <Card>
              <CardHeader className="border-b pb-4">
                <div className="flex items-center gap-2 text-base font-semibold">
                  <Workflow className="h-4 w-4 text-muted-foreground" />
                  {t.workflows.detail("ticket_type_label", {
                    requestName: previewWorkflowDetail.requestName,
                  })}
                </div>
              </CardHeader>
              <CardContent className="pt-4 p-0 overflow-hidden rounded-b-xl">
                <WorkflowDiagram workflowDetails={previewWorkflowDetail} />
              </CardContent>
            </Card>
          )}

          {/* ── Error / not found ── */}
          {!loading && !workflowDetail && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
              <Workflow className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {t.workflows.detail("error_loading")}
              </p>
            </div>
          )}
        </div>
      </TeamNavLayout>
    </BreadcrumbProvider>
  );
};

export default TeamWorkflowDetailView;
