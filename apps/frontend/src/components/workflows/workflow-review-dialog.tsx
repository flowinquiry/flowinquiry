"use client";

import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkflowDiagram } from "@/components/workflows/workflow-diagram-view";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { getWorkflowDetail } from "@/lib/actions/workflows.action";
import { useError } from "@/providers/error-provider";
import { WorkflowDetailDTO, WorkflowTransitionDTO } from "@/types/workflows";

interface WorkflowReviewDialogProps {
  workflowId: number;
  open: boolean;
  onClose: () => void;
}

export default function WorkflowReviewDialog({
  workflowId,
  open,
  onClose,
}: WorkflowReviewDialogProps) {
  const { setError } = useError();
  const [loading, setLoading] = useState(false);
  const [workflowDetail, setWorkflowDetail] =
    useState<WorkflowDetailDTO | null>(null);
  const t = useAppClientTranslations();

  useEffect(() => {
    if (open) {
      async function fetchWorkflowDetail() {
        setLoading(true);
        try {
          const data = await getWorkflowDetail(workflowId, setError);
          setWorkflowDetail(data);
        } finally {
          setLoading(false);
        }
      }

      fetchWorkflowDetail();
    }
  }, [open, workflowId, setError]);

  /**
   * Finds state name by state ID
   */
  const getStateName = (stateId: number | null) => {
    return (
      workflowDetail?.states.find((state) => state.id === stateId)?.stateName ||
      "Unknown"
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full !max-w-7xl h-[85vh] max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Review Workflow: {workflowDetail?.name}</DialogTitle>
        </DialogHeader>

        {/* Layout: Left -> Diagram | Right -> Transitions List */}
        <div className="flex grow h-full overflow-hidden">
          {/* Left: Workflow Diagram */}
          <div className="grow h-full overflow-hidden border-r">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">{t.common.misc("loading_data")}</span>
              </div>
            ) : (
              workflowDetail && (
                <div className="w-full h-full">
                  <WorkflowDiagram workflowDetails={workflowDetail} />
                </div>
              )
            )}
          </div>

          {/* Right: Transitions & SLA Info */}
          <div className="w-[400px] bg-muted-100 flex flex-col h-full">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">State Transitions</h3>
            </div>
            <ScrollArea className="grow p-4">
              <div className="space-y-2">
                {workflowDetail?.transitions.length ? (
                  workflowDetail.transitions.map(
                    (transition: WorkflowTransitionDTO) => (
                      <div
                        key={transition.id}
                        className="p-3 rounded-md bg-background border"
                      >
                        <p className="text-sm font-medium">
                          <span className="inline-block px-2 py-0.5 bg-primary-100 text-primary rounded-md mb-1">
                            {transition.eventName}
                          </span>
                        </p>
                        <p className="text-sm">
                          {getStateName(transition.sourceStateId!)} →{" "}
                          {getStateName(transition.targetStateId!)}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center">
                            SLA:{" "}
                            {transition.slaDuration
                              ? `${transition.slaDuration} hours`
                              : "No SLA"}
                          </span>
                          <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground"></span>
                          <span className="inline-flex items-center">
                            Escalated:{" "}
                            {transition.escalateOnViolation
                              ? t.common.misc("yes")
                              : t.common.misc("no")}
                          </span>
                        </div>
                      </div>
                    ),
                  )
                ) : (
                  <p className="text-sm text-muted-foreground py-4">
                    No transitions available
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
