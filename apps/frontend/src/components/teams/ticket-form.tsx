"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Calendar, FileText, Settings2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Heading } from "@/components/heading";
import CollapsibleCard from "@/components/shared/collapsible-card";
import RichTextEditor from "@/components/shared/rich-text-editor";
import TicketChannelSelectField from "@/components/teams/team-ticket-channel-select";
import TeamUserSelectField from "@/components/teams/team-users-select-field";
import { TicketPrioritySelect } from "@/components/teams/ticket-priority-select";
import { Button } from "@/components/ui/button";
import {
  DatePickerField,
  ExtInputField,
  SubmitButton,
} from "@/components/ui/ext-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import WorkflowStateSelectField from "@/components/workflows/workflow-state-select-field";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { findTicketById, updateTicket } from "@/lib/actions/tickets.action";
import { obfuscate } from "@/lib/endecode";
import { randomPair } from "@/lib/utils";
import { validateForm } from "@/lib/validator";
import { BreadcrumbProvider } from "@/providers/breadcrumb-provider";
import { useError } from "@/providers/error-provider";
import { TicketDTO, TicketDTOSchema, TicketPriority } from "@/types/tickets";

export const TicketForm = ({ ticketId }: { ticketId: number }) => {
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDTO | undefined>(undefined);
  const { setError } = useError();
  const [loading, setLoading] = useState(true);
  const t = useAppClientTranslations();

  const form = useForm<TicketDTO>({
    resolver: zodResolver(TicketDTOSchema),
    defaultValues: undefined,
    mode: "onChange",
  });

  useEffect(() => {
    setLoading(true);
    findTicketById(ticketId, setError)
      .then((data) => setTicket(data))
      .finally(() => setLoading(false));
  }, [ticketId]);

  useEffect(() => {
    form.reset(ticket ?? undefined);
  }, [ticket]);

  async function onSubmit(formValues: TicketDTO) {
    if (validateForm(formValues, TicketDTOSchema, form)) {
      await updateTicket(formValues.id!, formValues, setError);
      router.push(
        `/portal/teams/${obfuscate(formValues.teamId)}/tickets/${obfuscate(formValues.id)}?${randomPair()}`,
      );
    }
  }

  /* ── Skeleton loading ── */
  if (loading) {
    return (
      <div className="flex flex-col gap-4" data-testid="ticket-form-loading">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Separator />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!ticket) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center"
        data-testid="ticket-form-error"
      >
        <FileText className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {t.common.misc("error")}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          data-testid="ticket-form-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.common.buttons("go_back")}
        </Button>
      </div>
    );
  }

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("teams"), link: "/portal/teams" },
    {
      title: ticket.teamName!,
      link: `/portal/teams/${obfuscate(ticket.teamId!)}`,
    },
    ...(ticket.projectId
      ? [
          {
            title: t.common.navigation("projects"),
            link: `/portal/teams/${obfuscate(ticket.teamId!)}/projects`,
          },
          {
            title: ticket.projectName!,
            link: `/portal/teams/${obfuscate(ticket.teamId!)}/projects/${obfuscate(ticket.projectId!)}`,
          },
          {
            title: ticket.requestTitle!,
            link: `/portal/teams/${obfuscate(ticket.teamId!)}/projects/${obfuscate(ticket.projectId!)}/${obfuscate(ticket.id!)}`,
          },
          { title: t.common.buttons("edit"), link: "#" },
        ]
      : [
          {
            title: t.common.navigation("tickets"),
            link: `/portal/teams/${obfuscate(ticket.teamId!)}/tickets`,
          },
          {
            title: ticket.requestTitle!,
            link: `/portal/teams/${obfuscate(ticket.teamId!)}/tickets/${obfuscate(ticket.id!)}`,
          },
          { title: t.common.buttons("edit"), link: "#" },
        ]),
  ];

  return (
    <BreadcrumbProvider items={breadcrumbItems}>
      <div className="flex flex-col gap-4" data-testid="ticket-form-container">
        {/* ── Toolbar ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Heading
            title={`${ticket.workflowRequestName}: ${t.teams.tickets.form.base("edit_ticket_title")}`}
            description={t.teams.tickets.form.base("edit_ticket_description")}
          />
        </div>

        <Separator />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            data-testid="ticket-form"
          >
            {/* ── Main 2/3 + 1/3 grid ── */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* ── Left column: title + description ── */}
              <div className="flex flex-col gap-4 lg:col-span-2">
                <CollapsibleCard
                  icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                  title={t.teams.tickets.form.base("description")}
                >
                  <div className="flex flex-col gap-4">
                    <ExtInputField
                      form={form}
                      fieldName="requestTitle"
                      label={t.teams.tickets.form.base("name")}
                      required
                      testId="ticket-form-title"
                    />
                    <FormField
                      control={form.control}
                      name="requestDescription"
                      render={({ field }) => (
                        <FormItem data-testid="ticket-form-description-container">
                          <FormLabel>
                            {t.teams.tickets.form.base("description")}
                            <span className="text-destructive ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <RichTextEditor
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CollapsibleCard>
              </div>

              {/* ── Right column: metadata cards ── */}
              <div className="flex flex-col gap-4">
                {/* People */}
                <CollapsibleCard
                  icon={<User className="h-4 w-4 text-muted-foreground" />}
                  title={t.teams.tickets.detail("people")}
                >
                  <TeamUserSelectField
                    form={form}
                    fieldName="assignUserId"
                    label={t.teams.tickets.form.base("assignee")}
                    teamId={ticket.teamId!}
                    testId="ticket-form-assignee"
                  />
                </CollapsibleCard>

                {/* Details */}
                <CollapsibleCard
                  icon={<Settings2 className="h-4 w-4 text-muted-foreground" />}
                  title={t.teams.tickets.detail("ticker_detail")}
                >
                  <div className="flex flex-col gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem data-testid="ticket-form-priority">
                          <FormLabel>
                            {t.teams.tickets.form.base("priority")}
                          </FormLabel>
                          <FormControl>
                            <TicketPrioritySelect
                              value={
                                field.value || ("Medium" as TicketPriority)
                              }
                              onChange={(value: TicketPriority) =>
                                field.onChange(value)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <TicketChannelSelectField
                      form={form}
                      testId="ticket-form-channel"
                    />
                    <WorkflowStateSelectField
                      form={form}
                      name="currentStateId"
                      label={t.teams.tickets.form.base("state")}
                      required
                      workflowId={ticket.workflowId!}
                      workflowStateId={ticket.currentStateId!}
                      includeSelf
                      testId="ticket-form-state"
                    />
                  </div>
                </CollapsibleCard>

                {/* Dates */}
                <CollapsibleCard
                  icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                  title={t.teams.tickets.detail("important_dates")}
                >
                  <div className="flex flex-col gap-4">
                    <DatePickerField
                      form={form}
                      fieldName="estimatedCompletionDate"
                      label={t.teams.tickets.form.base(
                        "target_completion_date",
                      )}
                      placeholder={t.common.misc("date_select_place_holder")}
                      testId="ticket-form-target-date"
                    />
                    <DatePickerField
                      form={form}
                      fieldName="actualCompletionDate"
                      label={t.teams.tickets.form.base(
                        "actual_completion_date",
                      )}
                      placeholder={t.common.misc("date_select_place_holder")}
                      testId="ticket-form-actual-date"
                    />
                  </div>
                </CollapsibleCard>
              </div>
            </div>

            {/* ── Action bar ── */}
            <div className="mt-4 flex items-center gap-3 border-t pt-4">
              <SubmitButton
                label={t.common.buttons("save")}
                labelWhileLoading={t.common.buttons("saving")}
                testId="ticket-form-submit"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                data-testid="ticket-form-cancel"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.common.buttons("discard")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </BreadcrumbProvider>
  );
};
