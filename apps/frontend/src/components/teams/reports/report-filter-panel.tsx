"use client";

import React, { useEffect, useState } from "react";

import { UserAvatar } from "@/components/shared/avatar-display";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { findMembersByTeamId } from "@/lib/actions/teams.action";
import { useError } from "@/providers/error-provider";
import { Filter } from "@/types/query";
import { ReportFilterConfig } from "@/types/reports";
import { UserWithTeamRoleDTO } from "@/types/teams";
import { ticketPriorities, TicketPriority } from "@/types/tickets";

interface Props {
  teamId: number;
  config: ReportFilterConfig;
  onChange: (filters: Filter[]) => void;
}

type StatusValue = "open" | "closed" | "all";

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  Critical:
    "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300",
  High: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300",
  Medium:
    "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300",
  Low: "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300",
  Trivial:
    "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400",
};

const ReportFilterPanel: React.FC<Props> = ({ teamId, config, onChange }) => {
  const t = useAppClientTranslations();
  const { setError } = useError();

  // ── filter state ──────────────────────────────────────────────────────────
  const [status, setStatus] = useState<StatusValue>("open");
  const [assigneeId, setAssigneeId] = useState<number | "all">("all");
  const [selectedPriorities, setSelectedPriorities] = useState<
    TicketPriority[]
  >([]);

  // ── data for assignee picker ───────────────────────────────────────────────
  const hasAssignee = config.some((f) => f.type === "assignee");
  const [members, setMembers] = useState<UserWithTeamRoleDTO[]>([]);
  useEffect(() => {
    if (!hasAssignee) return;
    findMembersByTeamId(teamId, setError).then((res) => setMembers(res ?? []));
  }, [teamId, hasAssignee]);

  // ── build + emit filters whenever state changes ───────────────────────────
  useEffect(() => {
    const filters: Filter[] = [];

    for (const field of config) {
      if (field.type === "status") {
        if (status !== "all") {
          filters.push({
            field: field.field,
            operator: "eq",
            value: status === "closed",
          });
        }
      }

      if (field.type === "assignee" && assigneeId !== "all") {
        filters.push({
          field: field.field,
          operator: "eq",
          value: assigneeId,
        });
      }

      if (field.type === "priority" && selectedPriorities.length > 0) {
        filters.push({
          field: field.field,
          operator: "in",
          value: selectedPriorities,
        });
      }
    }

    onChange(filters);
  }, [status, assigneeId, selectedPriorities, config]);

  const togglePriority = (p: TicketPriority) =>
    setSelectedPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );

  const hasStatus = config.some((f) => f.type === "status");
  const hasPriority = config.some((f) => f.type === "priority");

  const isDirty =
    status !== "open" || assigneeId !== "all" || selectedPriorities.length > 0;

  const reset = () => {
    setStatus("open");
    setAssigneeId("all");
    setSelectedPriorities([]);
  };

  return (
    <aside className="flex flex-col gap-4 w-56 shrink-0 rounded-xl border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t.teams.reports("filters.heading")}
        </p>
        {isDirty && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={reset}
          >
            {t.teams.reports("filters.reset")}
          </Button>
        )}
      </div>

      <Separator />

      {/* ── Status ── */}
      {hasStatus && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            {t.teams.reports("filters.status.label")}
          </Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as StatusValue)}
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">
                {t.teams.reports("filters.status.open")}
              </SelectItem>
              <SelectItem value="closed">
                {t.teams.reports("filters.status.closed")}
              </SelectItem>
              <SelectItem value="all">
                {t.teams.reports("filters.status.all")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── Assignee ── */}
      {hasAssignee && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            {t.teams.reports("filters.assignee.label")}
          </Label>
          <Select
            value={assigneeId === "all" ? "all" : String(assigneeId)}
            onValueChange={(v) =>
              setAssigneeId(v === "all" ? "all" : Number(v))
            }
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t.teams.reports("filters.assignee.all")}
              </SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  <span className="flex items-center gap-2">
                    <UserAvatar imageUrl={m.imageUrl} size="w-5 h-5" />
                    {m.firstName} {m.lastName}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── Priority ── */}
      {hasPriority && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            {t.teams.reports("filters.priority.label")}
          </Label>
          <div className="flex flex-col gap-1.5">
            {ticketPriorities.map((p: TicketPriority) => {
              const active = selectedPriorities.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => togglePriority(p)}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-md border transition-all font-medium
                    ${active ? PRIORITY_COLORS[p as TicketPriority] : "border-border text-muted-foreground hover:border-primary/40 bg-background"}`}
                >
                  {p}
                </button>
              );
            })}
            {selectedPriorities.length > 0 && (
              <button
                onClick={() => setSelectedPriorities([])}
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline text-left mt-0.5"
              >
                {t.teams.reports("filters.priority.clear")}
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default ReportFilterPanel;
