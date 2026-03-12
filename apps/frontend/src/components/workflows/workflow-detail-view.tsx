"use client";

import { Edit, Eye, GitBranch, Trash, Workflow } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { WorkflowDiagram } from "@/components/workflows/workflow-diagram-view";
import WorkflowEditForm from "@/components/workflows/workflow-editor-form";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  deleteWorkflow,
  getWorkflowDetail,
  updateWorkflowDetail,
} from "@/lib/actions/workflows.action";
import { useError } from "@/providers/error-provider";
import { PermissionUtils } from "@/types/resources";
import { WorkflowDetailDTO } from "@/types/workflows";

const GlobalWorkflowDetailView = ({ workflowId }: { workflowId: number }) => {
  const router = useRouter();
  const t = useAppClientTranslations();

  const permissionLevel = usePagePermission();
  const [workflowDetail, setWorkflowDetail] =
    useState<WorkflowDetailDTO | null>(null);
  const [previewWorkflowDetail, setPreviewWorkflowDetail] =
    useState<WorkflowDetailDTO | null>(null); // Separate state for preview
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { setError } = useError();

  useEffect(() => {
    async function fetchWorkflowDetail() {
      setLoading(true);
      getWorkflowDetail(workflowId, setError)
        .then((data) => {
          setWorkflowDetail(data);
          setPreviewWorkflowDetail(data); // Initialize preview with the original workflow
        })
        .finally(() => setLoading(false));
    }

    fetchWorkflowDetail();
  }, [workflowId]);

  const handleSave = (updatedWorkflow: WorkflowDetailDTO) => {
    updateWorkflowDetail(updatedWorkflow.id!, updatedWorkflow, setError).then(
      (data) => {
        setWorkflowDetail(data); // Update the main workflow detail
        setPreviewWorkflowDetail(data); // Sync preview with saved workflow
        setIsEditing(false);
      },
    );
  };

  const removeWorkflow = async (workflow: WorkflowDetailDTO) => {
    await deleteWorkflow(workflow.id!, setError);
    router.push("/portal/settings/workflows");
  };

  if (!workflowDetail) {
    return <div>Error loading workflow detail.</div>;
  }

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    {
      title: t.common.navigation("workflows"),
      link: `/portal/settings/workflows`,
    },
    { title: workflowDetail.name, link: "#" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <Heading
          title={workflowDetail.name}
          description={workflowDetail.description ?? ""}
        />
        <div className="flex items-center gap-2">
          {PermissionUtils.canWrite(permissionLevel) && (
            <Button
              variant={isEditing ? "outline" : "default"}
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="mr-2 h-4 w-4" />
              {isEditing
                ? t.workflows.detail("cancel_edit")
                : t.workflows.detail("customize_workflow")}
            </Button>
          )}
          {PermissionUtils.canAccess(permissionLevel) &&
            !workflowDetail.useForProject && (
              <Button
                variant="destructive"
                onClick={() => removeWorkflow(workflowDetail)}
              >
                <Trash className="mr-2 h-4 w-4" />
                {t.common.buttons("delete")}
              </Button>
            )}
        </div>
      </div>

      <Separator />

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Spinner>
            <span>{t.common.misc("loading_data")}</span>
          </Spinner>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          {/* ── Left: editor (editing) or diagram (view-only) ── */}
          {isEditing ? (
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
            <Card className="xl:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Workflow className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      {workflowDetail.name}
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
              <CardContent className="pt-0 p-0 overflow-hidden rounded-b-xl">
                <WorkflowDiagram workflowDetails={previewWorkflowDetail!} />
              </CardContent>
            </Card>
          )}

          {/* ── Right: live preview (only while editing) ── */}
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
        </div>
      )}
    </div>
  );
};

export default GlobalWorkflowDetailView;
