"use client";

import { Edit } from "lucide-react";
import React, { useEffect, useState } from "react";

import { Heading } from "@/components/heading";
import { TeamAvatar } from "@/components/shared/avatar-display";
import TeamNavLayout from "@/components/teams/team-nav";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
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
    useState<WorkflowDetailDTO | null>(null); // Separate state for preview
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { setError } = useError();
  const t = useAppClientTranslations();

  const permissionLevel = usePagePermission();
  const teamRole = useUserTeamRole().role;

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
        setWorkflowDetail(data);
        setPreviewWorkflowDetail(data);
        setIsEditing(false);
      },
    );
  };

  if (!workflowDetail) {
    return <div>{t.workflows.detail("error_loading")}</div>;
  }

  const breadcrumbItems = [
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
  ];

  return (
    <BreadcrumbProvider items={breadcrumbItems}>
      <TeamNavLayout teamId={workflowDetail.ownerId!}>
        <div className="grid grid-cols-1 gap-4">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <TeamAvatar imageUrl={team.logoUrl} size="w-20 h-20" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs whitespace-pre-wrap break-words">
                  <div className="text-left space-y-1">
                    <p className="font-bold">{team.name}</p>
                    <p className="text-sm ">
                      {team.slogan ?? t.teams.common("default_slogan")}
                    </p>
                    {team.description && (
                      <p className="text-sm ">{team.description}</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
              <Heading
                title={workflowDetail.name}
                description={workflowDetail.description ?? ""}
              />
            </div>
            {(PermissionUtils.canWrite(permissionLevel) ||
              teamRole === "manager") && (
              <div>
                <Button onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? t.workflows.detail("cancel_edit") : <Edit />}{" "}
                  {t.workflows.detail("customize_workflow")}
                </Button>
              </div>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <Spinner>
                <span>{t.common.misc("loading_data")}</span>
              </Spinner>
            </div>
          )}

          {isEditing && workflowDetail && !loading && (
            <WorkflowEditForm
              workflowDetail={workflowDetail}
              onCancel={() => setIsEditing(false)}
              onSave={handleSave}
              onPreviewChange={setPreviewWorkflowDetail} // Update preview in real-time
            />
          )}

          {previewWorkflowDetail && !loading && (
            <WorkflowDiagram workflowDetails={previewWorkflowDetail} />
          )}
        </div>
      </TeamNavLayout>
    </BreadcrumbProvider>
  );
};

export default TeamWorkflowDetailView;
