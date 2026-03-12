import { post } from "@/lib/actions/commons.action";
import { HttpError } from "@/lib/errors";
import { AggregationQuery, AggregationResult } from "@/types/query";

/**
 * Generic aggregation query against the ReportEngine endpoint.
 * Covers any GROUP BY + COUNT/SUM/AVG/MIN/MAX report without a dedicated endpoint per chart.
 *
 * @example – channel distribution for a team
 * const results = await aggregate({
 *   entity: "Ticket",
 *   groupByFields: ["channel"],
 *   aggregations: [{ field: "id", function: "count", alias: "ticketCount" }],
 *   filters: { filters: [
 *     { field: "team.id",    operator: "eq", value: teamId },
 *     { field: "isDeleted",  operator: "eq", value: false },
 *   ]},
 *   sorts: [{ field: "ticketCount", direction: "desc" }],
 * });
 */
export const aggregate = async (
  query: AggregationQuery,
  setError?: (error: HttpError | string | null) => void,
): Promise<AggregationResult[]> => {
  const result = await post<AggregationQuery, AggregationResult[]>(
    `/api/reports/aggregate`,
    query,
    setError,
  );
  return result ?? [];
};
