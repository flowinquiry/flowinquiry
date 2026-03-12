"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ExtInputField, ExtTextAreaField } from "@/components/ui/ext-form";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import WorkflowStatesSelectField from "@/components/workflows/workflow-states-select-field";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { WorkflowDetailDTO, WorkflowDetailSchema } from "@/types/workflows";

let temporaryIdCounter = -1;

const WorkflowEditForm = ({
  workflowDetail,
  onCancel,
  onSave,
  onPreviewChange,
}: {
  workflowDetail: WorkflowDetailDTO;
  onCancel: () => void;
  onSave: (values: WorkflowDetailDTO) => void;
  onPreviewChange: (values: WorkflowDetailDTO) => void;
}) => {
  const t = useAppClientTranslations();
  const form = useForm<WorkflowDetailDTO>({
    resolver: zodResolver(WorkflowDetailSchema),
    defaultValues: workflowDetail,
    mode: "onChange",
  });

  const {
    fields: stateFields,
    append: appendState,
    remove: removeState,
  } = useFieldArray({ control: form.control, name: "states" });

  const {
    fields: transitionFields,
    append: appendTransition,
    remove: removeTransition,
  } = useFieldArray({ control: form.control, name: "transitions" });

  const watchedValues = form.watch();

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onPreviewChange(watchedValues);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [watchedValues, onPreviewChange]);

  const handleSubmit = (values: WorkflowDetailDTO) => {
    onSave(values);
  };

  return (
    <div
      className="flex flex-col gap-5"
      data-testid="workflow-editor-container"
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5"
          data-testid="workflow-editor-form"
        >
          {/* ── Details ── */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            data-testid="workflow-editor-details-section"
          >
            <ExtInputField
              form={form}
              fieldName="name"
              label={t.workflows.add("name")}
              required
              testId="workflow-editor-name"
            />
            <ExtInputField
              form={form}
              fieldName="requestName"
              label={t.workflows.add("ticket_type")}
              required
              testId="workflow-editor-request-name"
            />
            <div className="md:col-span-2">
              <ExtTextAreaField
                form={form}
                fieldName="description"
                label={t.workflows.add("field_description")}
                testId="workflow-editor-description"
              />
            </div>
          </div>

          <Separator />

          {/* ── States ── */}
          <div data-testid="workflow-editor-states-section">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3
                  className="text-sm font-semibold"
                  data-testid="workflow-editor-states-title"
                >
                  {t.workflows.add("states")}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {stateFields.length}
                </Badge>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() =>
                  appendState({
                    stateName: "",
                    isInitial: false,
                    isFinal: false,
                    id: temporaryIdCounter--,
                    workflowId: workflowDetail.id!,
                  })
                }
                testId="workflow-editor-add-state"
              >
                <Plus className="h-3.5 w-3.5" />
                {t.workflows.add("add_state")}
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              {stateFields.length === 0 && (
                <div className="flex items-center justify-center rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground bg-muted/30">
                  No states yet — click &ldquo;Add state&rdquo; to begin
                </div>
              )}
              {stateFields.map((state, index) => (
                <div
                  key={state.id || index}
                  className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2.5"
                  data-testid={`workflow-editor-state-row-${index}`}
                >
                  <div className="flex-1 min-w-0">
                    <ExtInputField
                      form={form}
                      fieldName={`states.${index}.stateName`}
                      label={t.workflows.add("state_name")}
                      required
                      testId={`workflow-editor-state-name-${index}`}
                    />
                  </div>
                  <div
                    className="flex items-center gap-1.5 shrink-0 mt-5"
                    data-testid={`workflow-editor-state-initial-container-${index}`}
                  >
                    <Checkbox
                      checked={form.watch(`states.${index}.isInitial`)}
                      onCheckedChange={(v) =>
                        form.setValue(`states.${index}.isInitial`, Boolean(v))
                      }
                      data-testid={`workflow-editor-state-initial-${index}`}
                    />
                    <label className="text-xs text-muted-foreground cursor-pointer">
                      {t.workflows.add("initial")}
                    </label>
                  </div>
                  <div
                    className="flex items-center gap-1.5 shrink-0 mt-5"
                    data-testid={`workflow-editor-state-final-container-${index}`}
                  >
                    <Checkbox
                      checked={form.watch(`states.${index}.isFinal`)}
                      onCheckedChange={(v) =>
                        form.setValue(`states.${index}.isFinal`, Boolean(v))
                      }
                      data-testid={`workflow-editor-state-final-${index}`}
                    />
                    <label className="text-xs text-muted-foreground cursor-pointer">
                      {t.workflows.add("final")}
                    </label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 mt-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeState(index)}
                    testId={`workflow-editor-state-remove-${index}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* ── Transitions ── */}
          <div data-testid="workflow-editor-transitions-section">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3
                  className="text-sm font-semibold"
                  data-testid="workflow-editor-transitions-title"
                >
                  {t.workflows.add("transitions")}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {transitionFields.length}
                </Badge>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() =>
                  appendTransition({
                    sourceStateId: null,
                    targetStateId: null,
                    eventName: "",
                    slaDuration: null,
                    escalateOnViolation: false,
                    workflowId: workflowDetail.id!,
                  })
                }
                testId="workflow-editor-add-transition"
              >
                <Plus className="h-3.5 w-3.5" />
                {t.workflows.add("add_transition")}
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              {transitionFields.length === 0 && (
                <div className="flex items-center justify-center rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground bg-muted/30">
                  No transitions yet — add states first, then connect them
                </div>
              )}
              {transitionFields.map((transition, index) => (
                <div
                  key={transition.id || index}
                  className="rounded-lg border bg-muted/20 px-3 pt-3 pb-2.5"
                  data-testid={`workflow-editor-transition-row-${index}`}
                >
                  {/* Source → Target */}
                  <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 mb-3">
                    <WorkflowStatesSelectField
                      fieldName={`transitions.${index}.sourceStateId`}
                      form={form}
                      label={t.workflows.add("source_state")}
                      placeholder={t.workflows.add("source_state_place_holder")}
                      options={watchedValues.states.map((s) => ({
                        label: s.stateName,
                        value: s.id!,
                      }))}
                      required
                      testId={`workflow-editor-transition-source-${index}`}
                    />
                    <ArrowRight className="h-4 w-4 text-muted-foreground mb-2.5 shrink-0" />
                    <WorkflowStatesSelectField
                      fieldName={`transitions.${index}.targetStateId`}
                      form={form}
                      label={t.workflows.add("target_state")}
                      placeholder={t.workflows.add("target_state_place_holder")}
                      options={watchedValues.states.map((s) => ({
                        label: s.stateName,
                        value: s.id!,
                      }))}
                      required
                      testId={`workflow-editor-transition-target-${index}`}
                    />
                  </div>

                  {/* Event + SLA + Escalate + Remove */}
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <ExtInputField
                        form={form}
                        fieldName={`transitions.${index}.eventName`}
                        label={t.workflows.add("event_name")}
                        required
                        testId={`workflow-editor-transition-event-${index}`}
                      />
                    </div>
                    <div className="w-32 shrink-0">
                      <ExtInputField
                        form={form}
                        fieldName={`transitions.${index}.slaDuration`}
                        label={t.workflows.add("sla_duration")}
                        type="number"
                        onChange={(e) => {
                          const val = e.target.value;
                          form.setValue(
                            `transitions.${index}.slaDuration`,
                            val === "" ? null : Number(val),
                          );
                        }}
                        testId={`workflow-editor-transition-sla-${index}`}
                      />
                    </div>
                    <div
                      className="flex items-center gap-1.5 shrink-0 pb-2"
                      data-testid={`workflow-editor-transition-escalate-container-${index}`}
                    >
                      <Checkbox
                        checked={form.watch(
                          `transitions.${index}.escalateOnViolation`,
                        )}
                        onCheckedChange={(v) =>
                          form.setValue(
                            `transitions.${index}.escalateOnViolation`,
                            Boolean(v),
                          )
                        }
                        data-testid={`workflow-editor-transition-escalate-${index}`}
                      />
                      <label className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
                        {t.workflows.add("escalate")}
                      </label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 pb-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeTransition(index)}
                      testId={`workflow-editor-transition-remove-${index}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Actions ── */}
          <div
            className="flex justify-end gap-3 pt-1"
            data-testid="workflow-editor-buttons"
          >
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              testId="workflow-editor-cancel"
            >
              {t.common.buttons("discard")}
            </Button>
            <Button type="submit" testId="workflow-editor-save">
              {t.common.buttons("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default WorkflowEditForm;
