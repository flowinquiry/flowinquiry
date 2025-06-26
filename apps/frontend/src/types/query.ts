import * as z from "zod/v4";

export type Operator = "gt" | "lt" | "eq" | "ne" | "in" | "lk";

export type Filter = {
  field: string;
  operator: Operator;
  value: string | number | boolean | null | (string | number | boolean)[];
};

export type GroupFilter = {
  filters?: Filter[]; // Simple filters in this group
  groups?: GroupFilter[]; // Nested groups
  logicalOperator: "AND" | "OR";
};

export type QueryDTO = {
  groups?: GroupFilter[]; // Groups for advanced filtering
  filters?: Filter[]; // Simple filters for backward compatibility
};

// Pagination type for handling pagination and sorting
export type Pagination = {
  page: number;
  size: number;
  sort?: { field: string; direction: "asc" | "desc" }[];
};

// Zod schema for filters
const filterSchema = z.object({
  field: z.string(),
  operator: z.enum(["eq", "ne", "gt", "lt", "lk", "in"]),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(z.union([z.string(), z.number(), z.boolean()])),
  ]),
});

const groupFilterSchema: z.ZodType<GroupFilter> = z.lazy(() =>
  z.object({
    filters: z.array(filterSchema).optional(),
    groups: z.array(groupFilterSchema).optional(),
    logicalOperator: z.enum(["AND", "OR"]),
  }),
);

export const querySchema = z.object({
  groups: z.array(groupFilterSchema).optional(),
});

// Zod schema for pagination
export const paginationSchema = z.object({
  page: z.number().min(1),
  size: z.number().min(1),
  sort: z
    .array(
      z.object({
        field: z.string().min(1),
        direction: z.enum(["asc", "desc"]),
      }),
    )
    .optional(),
});

export const createQueryParams = (pagination: Pagination): URLSearchParams => {
  return new URLSearchParams({
    page: pagination.page.toString(),
    size: pagination.size.toString(),
    ...pagination.sort?.reduce(
      (acc, sort) => {
        acc[`sort`] = `${sort.field},${sort.direction}`;
        return acc;
      },
      {} as { [key: string]: string },
    ),
  });
};
