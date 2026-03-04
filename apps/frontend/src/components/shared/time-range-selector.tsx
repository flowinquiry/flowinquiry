"use client";

import { format } from "date-fns";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import React, { useState } from "react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { TimeRange, useTimeRange } from "@/providers/time-range-provider";

const PRESETS: { value: Exclude<TimeRange, "custom">; labelKey: string }[] = [
  { value: "7d", labelKey: "last_7_days" },
  { value: "14d", labelKey: "last_14_days" },
  { value: "30d", labelKey: "last_30_days" },
  { value: "90d", labelKey: "last_90_days" },
];

const TimeRangeSelector = () => {
  const t = useAppClientTranslations();
  const { timeRange, setTimeRange, customDates } = useTimeRange();
  const [open, setOpen] = useState(false);
  const [pendingDates, setPendingDates] = useState<DateRange | undefined>(
    customDates,
  );
  const [showCalendar, setShowCalendar] = useState(timeRange === "custom");

  const getLabel = () => {
    if (timeRange === "custom" && customDates?.from && customDates?.to) {
      return `${format(customDates.from, "MMM d, yyyy")} – ${format(customDates.to, "MMM d, yyyy")}`;
    }
    const preset = PRESETS.find((p) => p.value === timeRange);
    return preset
      ? t.teams.dashboard(preset.labelKey)
      : t.teams.dashboard("custom_range");
  };

  const handlePresetClick = (value: Exclude<TimeRange, "custom">) => {
    setTimeRange(value);
    setShowCalendar(false);
    setOpen(false);
  };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    // When closing, reset calendar view unless we're already in custom mode
    if (!o) setShowCalendar(timeRange === "custom");
  };

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pendingDates?.from && pendingDates?.to) {
      setTimeRange("custom", pendingDates);
      setOpen(false);
      setShowCalendar(false);
    }
  };

  const canApply = !!(pendingDates?.from && pendingDates?.to);

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 min-w-36 justify-between"
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{getLabel()}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-auto min-w-44 p-1">
        {!showCalendar ? (
          <>
            {PRESETS.map((preset) => (
              <DropdownMenuItem
                key={preset.value}
                className="cursor-pointer flex items-center justify-between gap-4"
                onSelect={() => handlePresetClick(preset.value)}
              >
                {t.teams.dashboard(preset.labelKey)}
                {timeRange === preset.value && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer flex items-center justify-between gap-4"
              onSelect={(e) => {
                e.preventDefault();
                setPendingDates(customDates);
                setShowCalendar(true);
              }}
            >
              {t.teams.dashboard("custom_range")}
              {timeRange === "custom" && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          </>
        ) : (
          /* ── Calendar panel ── */
          <div className="p-2" onPointerDown={(e) => e.stopPropagation()}>
            {/* Back link */}
            <button
              className="mb-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowCalendar(false);
              }}
            >
              ← {t.teams.dashboard("back_to_presets")}
            </button>

            {/* Selected range summary */}
            <div className="mb-2 flex items-center justify-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
              <span
                className={
                  pendingDates?.from ? "text-foreground font-medium" : ""
                }
              >
                {pendingDates?.from
                  ? format(pendingDates.from, "MMM d, yyyy")
                  : t.teams.dashboard("start_date")}
              </span>
              <span>→</span>
              <span
                className={
                  pendingDates?.to ? "text-foreground font-medium" : ""
                }
              >
                {pendingDates?.to
                  ? format(pendingDates.to, "MMM d, yyyy")
                  : t.teams.dashboard("end_date")}
              </span>
            </div>

            <Calendar
              mode="range"
              selected={pendingDates}
              onSelect={(range) => setPendingDates(range ?? undefined)}
              numberOfMonths={2}
            />

            {/* Action row */}
            <div className="mt-2 flex items-center justify-end gap-2 border-t pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingDates(undefined);
                }}
              >
                {t.common.buttons("reset")}
              </Button>
              <Button size="sm" disabled={!canApply} onClick={handleApply}>
                {t.common.buttons("apply")}
              </Button>
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TimeRangeSelector;
