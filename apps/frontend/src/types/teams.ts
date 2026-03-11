import { z } from "zod";

import { TicketPriority } from "@/types/tickets";

export const TeamDTOSchema = z.object({
  id: z.number().nullish(),
  name: z.string(),
  logoUrl: z.string().nullish(),
  slogan: z.string().nullish(),
  description: z.string().nullish(),
  organizationId: z.number().nullish(),
  usersCount: z.number().nullish(),
});

export type TeamDTO = z.infer<typeof TeamDTOSchema>;

export const TeamRoleSchema = z.enum(["manager", "member", "guest", "none"]);

export type TeamRole = z.infer<typeof TeamRoleSchema>;

export interface TransitionItemDTO {
  fromState: string;
  toState: string;
  eventName: string;
  transitionDate: string; // Use ISO 8601 format for ZonedDateTime
  slaDueDate?: string; // Optional, since ZonedDateTime can be null
  status: string;
}

export interface TransitionItemCollectionDTO {
  ticketId: number;
  transitions: TransitionItemDTO[];
}

export interface TicketActionCountByDateDTO {
  date: string; // LocalDate is represented as an ISO 8601 string in TypeScript
  createdCount: number;
  closedCount: number;
}

export interface TeamTicketPriorityDistributionDTO {
  teamId: number;
  teamName: string;
  priority: TicketPriority;
  count: number;
}

export const UserWithTeamRoleDTOSchema = z.object({
  id: z.number().nullable().optional(),
  email: z.string().email().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  teamId: z.number().nullable().optional(),
  teamRole: TeamRoleSchema.nullable().optional(),
});

export type UserWithTeamRoleDTO = z.infer<typeof UserWithTeamRoleDTOSchema>;
