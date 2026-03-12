"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { GitBranch, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExtInputField, ExtTextAreaField } from "@/components/ui/ext-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  createWorkflowFromCloning,
  createWorkflowFromReference,
  getGlobalWorkflowHasNotLinkedWithTeam,
} from "@/lib/actions/workflows.action";
import { obfuscate } from "@/lib/endecode";
import { useError } from "@/providers/error-provider";
import { WorkflowDTO } from "@/types/workflows";

const workflowReferenceSchema = z.object({
  referenceWorkflowId: z
    .number()
    .positive("You must select a global workflow."),
  name: z.string().min(1, "Workflow name is required."),
  requestName: z.string().min(1, "Ticket type is required"),
  description: z.string().optional(),
});

type WorkflowReferenceFormValues = z.infer<typeof workflowReferenceSchema>;

const NewTeamWorkflowReferFromSharedOne = ({
  teamId,
  isRefer,
}: {
  teamId: number;
  isRefer: boolean;
}) => {
  const t = useAppClientTranslations();
  const router = useRouter();
  const [globalWorkflows, setGlobalWorkflows] = useState<WorkflowDTO[]>([]);
  const { setError } = useError();

  useEffect(() => {
    async function loadGlobalWorkflowsNotLinkWithTeamYet() {
      getGlobalWorkflowHasNotLinkedWithTeam(teamId, setError).then((data) =>
        setGlobalWorkflows(data),
      );
    }
    loadGlobalWorkflowsNotLinkWithTeamYet();
  }, [teamId]);

  const form = useForm<WorkflowReferenceFormValues>({
    resolver: zodResolver(workflowReferenceSchema),
    defaultValues: {
      referenceWorkflowId: -1,
      name: "",
      requestName: "",
      description: "",
    },
  });

  const onSubmit = (values: WorkflowReferenceFormValues) => {
    if (isRefer) {
      createWorkflowFromReference(
        teamId,
        values.referenceWorkflowId,
        {
          name: values.name,
          requestName: values.requestName,
          description: values.description,
          ownerId: teamId,
        },
        setError,
      ).then((data) => {
        router.push(
          `/portal/teams/${obfuscate(teamId)}/workflows/${obfuscate(data.id)}`,
        );
      });
    } else {
      createWorkflowFromCloning(
        teamId,
        values.referenceWorkflowId,
        {
          name: values.name,
          requestName: values.requestName,
          description: values.description,
          ownerId: teamId,
        },
        setError,
      ).then((data) => {
        router.push(
          `/portal/teams/${obfuscate(teamId)}/workflows/${obfuscate(data.id)}`,
        );
      });
    }
  };

  const hasWorkflows =
    Array.isArray(globalWorkflows) && globalWorkflows.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-4 max-w-3xl">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <GitBranch className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      {isRefer
                        ? t.workflows.add("create_workflow_from_reference")
                        : t.workflows.add("create_workflow_by_cloning")}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {isRefer
                        ? t.workflows.add(
                            "create_workflow_from_reference_description",
                          )
                        : t.workflows.add(
                            "create_workflow_by_cloning_description",
                          )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-5 flex flex-col gap-5">
                {/* Source workflow selector */}
                <FormField
                  control={form.control}
                  name="referenceWorkflowId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t.workflows.add("workflow_reference")}
                        <span className="text-destructive"> *</span>
                      </FormLabel>
                      <FormControl>
                        {hasWorkflows ? (
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value, 10))
                            }
                            value={field.value?.toString()}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t.workflows.add(
                                  "select_workflow_place_holder",
                                )}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {globalWorkflows.map((workflow) => (
                                <SelectItem
                                  key={workflow.id!.toString()}
                                  value={workflow.id!.toString()}
                                >
                                  {workflow.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-2 rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground bg-muted/40">
                            <GitBranch className="h-4 w-4 shrink-0" />
                            {t.workflows.add("no_global_workflow")}
                          </div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Name + ticket type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ExtInputField
                    form={form}
                    fieldName="name"
                    label={t.workflows.add("name")}
                    required
                  />
                  <ExtInputField
                    form={form}
                    fieldName="requestName"
                    label={t.workflows.add("ticket_type")}
                    required
                  />
                </div>

                {/* Description */}
                <ExtTextAreaField
                  form={form}
                  fieldName="description"
                  label={t.workflows.add("field_description")}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sticky action bar */}
          <div className="sticky bottom-0 max-w-3xl flex items-center justify-end gap-3 rounded-xl border bg-background/80 px-4 py-3 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/60">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
            >
              {t.common.buttons("discard")}
            </Button>
            <Button type="submit" disabled={!hasWorkflows}>
              <Save className="h-4 w-4" />
              {t.workflows.add("create_workflow")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewTeamWorkflowReferFromSharedOne;
