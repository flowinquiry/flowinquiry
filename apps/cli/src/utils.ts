import { TicketPriority } from "./types";

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
