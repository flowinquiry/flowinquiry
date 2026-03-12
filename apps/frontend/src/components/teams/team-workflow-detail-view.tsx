"use client";

import { Edit, Eye, GitBranch, Workflow, X } from "lucide-react";
import React, { useEffect, useState } from "react";

import { Heading } from "@/components/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useUserTeamRole } from "@/providers/user-team-role-provider";
import { PermissionUtils } from "@/types/resources";
import { WorkflowDetailDTO } from "@/types/workflows";

const TeamWorkflowDetailView = ({ workflowId }: { workflowId: number }) => {
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
      <div className="flex flex-col gap-4">
        {/* ── Toolbar ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
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
                        <Badge key={tag} variant="outline" className="text-xs">
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

        {!loading && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            {/* ── Left: editor (editing) or full-width diagram (view-only) ── */}
            {isEditing && workflowDetail ? (
              <Card className="h-fit">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <GitBranch className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        {t.workflows.add("edit_workflow")}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {t.workflows.detail("ticket_type_label", {
                          requestName: workflowDetail.requestName,
                        })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-5">
                  <WorkflowEditForm
                    workflowDetail={workflowDetail}
                    onCancel={() => setIsEditing(false)}
                    onSave={handleSave}
                    onPreviewChange={setPreviewWorkflowDetail}
                  />
                </CardContent>
              </Card>
            ) : (
              previewWorkflowDetail && (
                <Card className="xl:col-span-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <Workflow className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">
                          {previewWorkflowDetail.name}
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {t.workflows.detail("ticket_type_label", {
                            requestName: previewWorkflowDetail.requestName,
                          })}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-0 p-0 overflow-hidden rounded-b-xl">
                    <WorkflowDiagram workflowDetails={previewWorkflowDetail} />
                  </CardContent>
                </Card>
              )
            )}

            {/* ── Right: sticky live preview (only while editing) ── */}
            {isEditing && previewWorkflowDetail && (
              <div className="sticky top-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <Eye className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">
                          Live Preview
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          Diagram updates as you edit states and transitions
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-0 p-0 overflow-hidden rounded-b-xl">
                    <WorkflowDiagram workflowDetails={previewWorkflowDetail} />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── Error / not found ── */}
            {!workflowDetail && (
              <div className="xl:col-span-2 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
                <Workflow className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {t.workflows.detail("error_loading")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </BreadcrumbProvider>
  );
};

export default TeamWorkflowDetailView;
