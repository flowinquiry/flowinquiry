"use client";

import { Eye, GitBranch } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WorkflowDiagram } from "@/components/workflows/workflow-diagram-view";
import WorkflowEditForm from "@/components/workflows/workflow-editor-form";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { saveWorkflowDetail } from "@/lib/actions/workflows.action";
import { obfuscate } from "@/lib/endecode";
import { useError } from "@/providers/error-provider";
import { WorkflowDetailDTO } from "@/types/workflows";

const defaultWorkflow: WorkflowDetailDTO = {
  id: undefined,
  requestName: "",
  name: "",
  description: "",
  states: [],
  transitions: [],
  ownerId: null,
  ownerName: "",
};

const NewWorkflowFromScratch = ({
  teamId = undefined,
}: {
  teamId?: number;
}) => {
  const [workflowDetail] = useState<WorkflowDetailDTO>(defaultWorkflow);
  const [previewWorkflowDetail, setPreviewWorkflowDetail] =
    useState<WorkflowDetailDTO>(defaultWorkflow);
  const router = useRouter();
  const { setError } = useError();
  const t = useAppClientTranslations();

  const handleSave = async (updatedWorkflow: WorkflowDetailDTO) => {
    const workflowToSave = {
      ...updatedWorkflow,
      visibility: teamId
        ? ("PRIVATE" as "PRIVATE" | "PUBLIC" | "TEAM")
        : ("PUBLIC" as "PRIVATE" | "PUBLIC" | "TEAM"),
      ownerId: teamId,
    };

    const workflow = await saveWorkflowDetail(workflowToSave, setError);

    if (workflow?.id) {
      if (teamId) {
        router.push(
          `/portal/teams/${obfuscate(teamId)}/workflows/${obfuscate(workflow.id)}`,
        );
      } else {
        router.push(`/portal/settings/workflows/${obfuscate(workflow.id)}`);
      }
    } else {
      console.error("Workflow save failed: Missing workflow ID.");
    }
  };

  const handleCancel = () => {
    if (teamId) {
      router.push(`/portal/teams/${obfuscate(teamId)}/workflows`);
    } else {
      router.push(`/portal/settings/workflows`);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      {/* ── Left: Editor form ── */}
      <Card className="h-fit">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-primary/10">
              <GitBranch className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                {t.workflows.add("title")}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {t.workflows.add("create_workflow_from_scratch_description")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <WorkflowEditForm
            workflowDetail={workflowDetail}
            onCancel={handleCancel}
            onSave={handleSave}
            onPreviewChange={setPreviewWorkflowDetail}
          />
        </CardContent>
      </Card>

      {/* ── Right: Live preview ── */}
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
          <CardContent className="pt-4 p-0 overflow-hidden rounded-b-xl">
            <WorkflowDiagram workflowDetails={previewWorkflowDetail} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewWorkflowFromScratch;
