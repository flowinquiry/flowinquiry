import { Pagination, QueryDTO } from "../types";
import { parseQueryDTO } from "../utils";

export type PaginationOptions = {
  page?: string | number;
  size?: string | number;
  sortField?: string;
  sortDirection?: string;
};

export function buildPagination(options: PaginationOptions): Pagination {
  const page = Number(options.page ?? 1);
  const size = Number(options.size ?? 20);
  const sortField = options.sortField;
  const sortDirection = options.sortDirection as "asc" | "desc" | undefined;

  return {
    page: Number.isNaN(page) ? 1 : page,
    size: Number.isNaN(size) ? 20 : size,
    sort: sortField
      ? [{ field: sortField, direction: sortDirection ?? "asc" }]
      : undefined,
  };
}

export function paginationToParams(pagination: Pagination) {
  const params = new URLSearchParams({
    page: String(pagination.page - 1),
    size: String(pagination.size),
  });
  if (pagination.sort?.length) {
    const sort = pagination.sort[0];
    params.set("sort", `${sort.field},${sort.direction}`);
  }
  return params;
}

export function buildQueryFromOptions(options: {
  filter?: string[];
  filterJson?: string;
}): QueryDTO {
  return parseQueryDTO(options.filter, options.filterJson);
}
