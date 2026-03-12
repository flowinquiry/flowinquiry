"use client";

import { Plus, Search, Trash2 } from "lucide-react";
import React, { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Operator, QueryDTO } from "@/types/query";
import { ticketChannels } from "@/types/tickets";

/* ── Field definitions ── */
const fieldDefinitions = [
  { name: "requestTitle", label: "Title", type: "text" },
  { name: "requestDescription", label: "Description", type: "text" },
  { name: "isCompleted", label: "Completed", type: "boolean" },
  {
    name: "channel",
    label: "Channel",
    type: "select",
    options: [...ticketChannels],
  },
] as const;

const operatorLabels: Record<Operator, string> = {
  eq: "=",
  lk: "contains",
  gt: ">",
  gte: "≥",
  lt: "<",
  lte: "≤",
  in: "in",
  ne: "≠",
};

const operatorMappings: Record<string, Operator[]> = {
  text: ["eq", "lk"],
  number: ["eq", "gt", "lt"],
  date: ["eq", "gt", "lt"],
  boolean: ["eq"],
  select: ["eq", "in"],
};

const DynamicQueryBuilder = ({
  onSearch,
}: {
  onSearch: (query: QueryDTO) => void;
}) => {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addFilter = () =>
    setFilters((prev) => [...prev, { field: "", operator: "eq", value: "" }]);

  const removeFilter = (index: number) =>
    setFilters((prev) => prev.filter((_, i) => i !== index));

  const handleFieldChange = (index: number, value: string) => {
    setFilters((prev) => {
      const next = [...prev];
      const fieldDef = fieldDefinitions.find((f) => f.name === value);
      next[index] = {
        field: value,
        operator: fieldDef ? operatorMappings[fieldDef.type][0] : "eq",
        value: fieldDef?.type === "boolean" ? false : "",
      };
      return next;
    });
  };

  const handleOperatorChange = (index: number, value: string) =>
    setFilters((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], operator: value as Operator };
      return next;
    });

  const handleValueChange = (index: number, value: string | boolean) =>
    setFilters((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], value };
      return next;
    });

  const validateQuery = () => {
    for (const f of filters) {
      if (!f.field) {
        setError("Each filter must have a selected field.");
        return false;
      }
      if (!f.operator) {
        setError("Each filter must have a selected operator.");
        return false;
      }
      if (f.value === "" || f.value === undefined) {
        setError("Each filter must have a valid value.");
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleSearch = () => {
    if (!validateQuery()) return;
    onSearch({ groups: [{ logicalOperator: "AND", filters }] });
  };

  const renderValue = (filter: Filter, index: number) => {
    const def = fieldDefinitions.find((f) => f.name === filter.field);
    if (!def) return null;

    switch (def.type) {
      case "text":
        return (
          <Input
            type="text"
            placeholder="Value"
            className="flex-1 min-w-0"
            value={filter.value as string}
            onChange={(e) => handleValueChange(index, e.target.value)}
          />
        );
      case "boolean":
        return (
          <div className="flex items-center gap-2 flex-1">
            <Checkbox
              id={`bool-${index}`}
              checked={filter.value === "true"}
              onCheckedChange={(checked) =>
                handleValueChange(index, checked ? "true" : "false")
              }
            />
            <Label htmlFor={`bool-${index}`} className="text-sm cursor-pointer">
              {filter.value === "true" ? "Yes" : "No"}
            </Label>
          </div>
        );
      case "select":
        return (
          <Select
            onValueChange={(val) => handleValueChange(index, val)}
            value={filter.value as string}
          >
            <SelectTrigger className="flex-1 min-w-0">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {(def as any).options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── Active filters ── */}
      {filters.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4 rounded-lg border border-dashed border-muted-foreground/25">
          No filters applied — all tickets shown.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filters.map((filter, index) => {
            const def = fieldDefinitions.find((f) => f.name === filter.field);
            const operators = def ? operatorMappings[def.type] : [];

            return (
              <div
                key={index}
                className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
              >
                {/* Row 1: field + operator */}
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="shrink-0 text-xs font-normal text-muted-foreground"
                  >
                    #{index + 1}
                  </Badge>

                  <Select
                    onValueChange={(v) => handleFieldChange(index, v)}
                    value={filter.field || undefined}
                  >
                    <SelectTrigger className="flex-1 min-w-0 h-8 text-sm">
                      <SelectValue placeholder="Select field…" />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldDefinitions.map((f) => (
                        <SelectItem key={f.name} value={f.name}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    onValueChange={(v) => handleOperatorChange(index, v)}
                    value={filter.operator}
                    disabled={!filter.field}
                  >
                    <SelectTrigger className="w-28 shrink-0 h-8 text-sm">
                      <SelectValue placeholder="Op" />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((op) => (
                        <SelectItem key={op} value={op}>
                          {operatorLabels[op] ?? op}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <button
                    type="button"
                    onClick={() => removeFilter(index)}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    aria-label="Remove filter"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Row 2: value input */}
                {filter.field && (
                  <div className="flex items-center gap-2 pl-6">
                    {renderValue(filter, index)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Validation error ── */}
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addFilter}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add filter
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={handleSearch}
          className="gap-1.5 ml-auto"
        >
          <Search className="h-3.5 w-3.5" />
          Search
        </Button>
      </div>
    </div>
  );
};

export default DynamicQueryBuilder;
