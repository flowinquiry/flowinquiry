import { QueryDTO, QueryFilter, TicketPriority } from "./types";

const allowedPriorities: TicketPriority[] = [
  "Critical",
  "High",
  "Medium",
  "Low",
  "Trivial",
];

export function parsePriority(value: string): TicketPriority {
  if (allowedPriorities.includes(value as TicketPriority)) {
    return value as TicketPriority;
  }
  throw new Error(
    `Invalid priority. Use one of: ${allowedPriorities.join(", ")}`,
  );
}

const allowedOperators: QueryFilter["operator"][] = [
  "eq",
  "ne",
  "gt",
  "lt",
  "lk",
  "in",
];

type PrimitiveValue = string | number | boolean | null;

function parsePrimitiveValue(raw: string): PrimitiveValue {
  if (raw === "null") return null;
  if (raw === "true") return true;
  if (raw === "false") return false;

  const numeric = Number(raw);
  if (!Number.isNaN(numeric) && raw.trim() !== "") return numeric;

  return raw;
}

function parseFilterValue(raw: string, operator: QueryFilter["operator"]): QueryFilter["value"] {
  if (operator === "in") {
    return raw.split(",").map((value) => parsePrimitiveValue(value.trim())) as (string | number | boolean)[];
  }
  return parsePrimitiveValue(raw);
}

export function parseFilters(inputs?: string[]): QueryFilter[] {
  if (!inputs?.length) return [];

  return inputs.map((entry) => {
    const parts = entry.split(":");
    if (parts.length < 2) {
      throw new Error(
        `Invalid filter "${entry}". Use field:op:value or field:value.`,
      );
    }

    const field = parts[0].trim();
    const operator = (parts.length === 2 ? "eq" : parts[1].trim()) as QueryFilter["operator"];
    const valuePart = parts.length === 2 ? parts[1] : parts.slice(2).join(":");

    if (!field) {
      throw new Error(`Invalid filter "${entry}". Field is required.`);
    }
    if (!allowedOperators.includes(operator)) {
      throw new Error(
        `Invalid filter operator "${operator}". Use one of: ${allowedOperators.join(", ")}`,
      );
    }

    return {
      field,
      operator,
      value: parseFilterValue(valuePart.trim(), operator),
    };
  });
}

export function parseQueryDTO(
  filters?: string[],
  filterJson?: string,
): QueryDTO {
  if (filterJson) {
    try {
      return JSON.parse(filterJson) as QueryDTO;
    } catch (error) {
      throw new Error(
        `Invalid --filter-json payload: ${(error as Error).message}`,
      );
    }
  }

  return { filters: parseFilters(filters) };
}

export function parseNumberList(value: string): number[] {
  if (!value.trim()) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const parsed = Number(entry);
      if (Number.isNaN(parsed)) {
        throw new Error(`Invalid number "${entry}" in list "${value}".`);
      }
      return parsed;
    });
}

export function parseJsonInput<T>(value: string, label: string): T {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    throw new Error(`Invalid JSON for ${label}: ${(error as Error).message}`);
  }
}
