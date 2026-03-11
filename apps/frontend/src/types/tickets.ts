import { z } from "zod";

export type TicketPriority = "Critical" | "High" | "Medium" | "Low" | "Trivial";

// Define the TicketHealthLevel enum
export enum TicketHealthLevel {
  Excellent = "Excellent",
  Good = "Good",
  Fair = "Fair",
  Poor = "Poor",
  Critical = "Critical",
}

export const TicketConversationHealthDTOSchema = z.object({
  id: z.number().optional(),
  ticketId: z.number().optional(),
  conversationHealth: z.number().optional(),
  cumulativeSentiment: z.number().optional(),
  totalMessages: z.number().optional(),
  totalQuestions: z.number().optional(),
  resolvedQuestions: z.number().optional(),
  healthLevel: z.nativeEnum(TicketHealthLevel).optional(),
});

export const TicketDTOSchema = z.object({
  id: z.number().optional(),
  teamId: z.number().optional(),
  teamName: z.string().optional(),
  workflowId: z.number().optional(),
  workflowName: z.string().nullish(),
  workflowRequestName: z.string().nullish(),
  projectId: z.number().nullish(),
  projectName: z.string().nullish(),
  projectShortName: z.string().nullish(),
  projectTicketNumber: z.number().nullable().optional(),
  priority: z.enum(["Critical", "High", "Medium", "Low", "Trivial"]),
  requestUserId: z.number().optional(),
  requestUserName: z.string().nullish(),
  requestUserImageUrl: z.string().nullish(),
  assignUserId: z.number().nullish(),
  assignUserName: z.string().nullish(),
  assignUserImageUrl: z.string().nullish(),
  currentStateId: z.number().nullish(),
  currentStateName: z.string().nullish(),
  iterationId: z.number().nullish(),
  iterationName: z.string().nullish(),
  epicId: z.number().nullish(),
  epicName: z.string().nullish(),
  requestTitle: z.string(),
  requestDescription: z.string(),
  isNew: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
  createdAt: z.string().optional(),
  modifiedAt: z.string().optional(),
  estimatedCompletionDate: z.string().optional().nullable(),
  actualCompletionDate: z.string().optional().nullable(),
  channel: z.string().nullish(),
  numberAttachments: z.number().optional(),
  numberWatchers: z.number().optional(),
  conversationHealth: TicketConversationHealthDTOSchema.nullish(),
  parentTicketId: z.number().nullish(),
  childTicketIds: z.array(z.number()).optional(),
});

export type TicketDTO = z.infer<typeof TicketDTOSchema>;

export type TicketConversationHealthDTO = z.infer<
  typeof TicketConversationHealthDTOSchema
>;

export type TicketChannel =
  | "email"
  | "phone"
  | "web_portal"
  | "chat"
  | "social_media"
  | "in_person"
  | "mobile_app"
  | "api"
  | "system_generated"
  | "internal";

export const ticketChannels = [
  "email",
  "phone",
  "web_portal",
  "chat",
  "social_media",
  "in_person",
  "mobile_app",
  "api",
  "system_generated",
  "internal",
] as const;

export type TicketDistributionDTO = {
  userId: number | null; // Null for unassigned tickets
  userName: string | null; // Null for unassigned tickets
  ticketCount: number;
};

export type PriorityDistributionDTO = {
  priority: TicketPriority;
  ticketCount: number;
};

export interface TicketStatisticsDTO {
  totalTickets: number;
  pendingTickets: number;
  completedTickets: number;
}
