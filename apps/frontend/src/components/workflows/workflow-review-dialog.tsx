"use client";

import { ArrowRight, Clock, GitMerge, Workflow, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
    if (!open) return;
    setLoading(true);
    getWorkflowDetail(workflowId, setError)
      .then(setWorkflowDetail)
      .finally(() => setLoading(false));
  }, [open, workflowId, setError]);

  const getStateName = (stateId: number | null) =>
    workflowDetail?.states.find((s) => s.id === stateId)?.stateName ??
    "Unknown";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-7xl! h-[85vh] max-h-[85vh] p-0 flex flex-col">
        {/* ── Header ── */}
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Workflow className="h-4 w-4 text-muted-foreground shrink-0" />
            {loading ? (
              <Skeleton className="h-5 w-48" />
            ) : (
              <span>
                {t.workflows.detail("ticket_type_label", {
                  requestName: workflowDetail?.requestName ?? "",
                })}
              </span>
            )}
            {workflowDetail?.name && !loading && (
              <Badge variant="secondary" className="ml-1 font-normal">
                {workflowDetail.name}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* ── Body ── */}
        <div className="flex grow overflow-hidden min-h-0">
          {/* Left: diagram */}
          <div className="grow overflow-hidden border-r">
            {loading ? (
              <div className="flex flex-col gap-3 p-6 h-full">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="flex-1 w-full rounded-xl" />
              </div>
            ) : workflowDetail ? (
              <WorkflowDiagram workflowDetails={workflowDetail} />
            ) : null}
          </div>

          {/* Right: transitions panel */}
          <div className="w-80 shrink-0 flex flex-col bg-muted/30">
            {/* Panel header */}
            <div className="px-4 py-3 border-b bg-background/60 shrink-0">
              <div className="flex items-center gap-2">
                <GitMerge className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">
                  {t.workflows.review("state_transitions")}
                </h3>
                {workflowDetail && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    {workflowDetail.transitions.length}
                  </Badge>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-3 flex flex-col gap-2">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-lg border bg-background p-3 space-y-2"
                    >
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))
                ) : workflowDetail?.transitions.length ? (
                  workflowDetail.transitions.map(
                    (transition: WorkflowTransitionDTO) => (
                      <div
                        key={transition.id}
                        className="rounded-lg border bg-background p-3 hover:shadow-sm hover:bg-muted/40 transition-all"
                      >
                        {/* Event name */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="text-xs font-semibold text-primary truncate">
                            {transition.eventName}
                          </span>
                        </div>

                        {/* From → To */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant="secondary"
                            className="text-xs font-normal rounded-full px-2"
                          >
                            {getStateName(transition.sourceStateId!)}
                          </Badge>
                          <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                          <Badge
                            variant="default"
                            className="text-xs font-normal rounded-full px-2"
                          >
                            {getStateName(transition.targetStateId!)}
                          </Badge>
                        </div>

                        <Separator className="my-2" />

                        {/* SLA + escalation */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0" />
                            {transition.slaDuration
                              ? t.workflows.review("sla_hours", {
                                  hours: transition.slaDuration,
                                })
                              : t.workflows.review("no_sla")}
                          </span>
                          {transition.escalateOnViolation && (
                            <Badge
                              variant="destructive"
                              className="text-[10px] px-1.5 py-0 h-4 font-normal"
                            >
                              {t.workflows.review("escalates")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ),
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                    <GitMerge className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      {t.workflows.review("no_transitions")}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
