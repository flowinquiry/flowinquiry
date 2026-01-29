import { request } from "../http";
import { CliConfig } from "../config";
import { TicketDTO, TicketPriority } from "../types";

export type TicketCreateInput = {
  teamId: number;
  workflowId: number;
  stateId: number;
  requesterId: number;
  priority: TicketPriority;
  title: string;
  description: string;
};

export async function createTicket(
  config: CliConfig,
  input: TicketCreateInput,
): Promise<TicketDTO> {
  const payload: Partial<TicketDTO> = {
    teamId: input.teamId,
    workflowId: input.workflowId,
    currentStateId: input.stateId,
    requestUserId: input.requesterId,
    priority: input.priority,
    requestTitle: input.title,
    requestDescription: input.description,
  };

  return request<TicketDTO>("POST", "/api/tickets", config, payload);
}
