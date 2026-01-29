export type QueryFilter = {
  field: string;
  operator: "eq" | "ne" | "gt" | "lt" | "lk" | "in";
  value: string | number | boolean | null | Array<string | number | boolean>;
};

export type QueryDTO = {
  groups?: Array<{
    filters?: QueryFilter[];
    groups?: QueryDTO["groups"];
    logicalOperator: "AND" | "OR";
  }>;
  filters?: QueryFilter[];
};

export type Pagination = {
  page: number;
  size: number;
  sort?: Array<{ field: string; direction: "asc" | "desc" }>;
};

export type PageableResult<T> = {
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  size: number;
  content: T[];
};

export type TicketPriority = "Critical" | "High" | "Medium" | "Low" | "Trivial";
