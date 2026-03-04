/**
 * FW Commons data. Get the session data with code
 * const gwSession = useSession();
 */

type ISODateString = string;
export interface FwSession {
  user?: User;
  expires: ISODateString;
}

export interface User {
  id?: string | null;
  email?: string | null;
  imageUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  createdAt?: ISODateString | null;
  updatedAt?: ISODateString | null;
  authorities?: string[] | null;
}

export interface PageableResult<Entity> {
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  size: number;
  content: Entity[];
}

export type EntityAttachmentDTO = {
  id: number;
  entityType: EntityType;
  entityId: number;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  fileUrl: string;
  uploadedAt: string;
};

export interface EntityValueDefinition {
  value: string;
  description?: string;
}

import { z } from "zod";

export enum NotificationType {
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  SLA_BREACH = "SLA_BREACH",
  SLA_WARNING = "SLA_WARNING",
  ESCALATION_NOTICE = "ESCALATION_NOTICE",
}

export const NotificationDTOSchema = z.object({
  id: z.number().nullable(),
  type: z.nativeEnum(NotificationType), // ✅ Enforcing the type from the enum
  content: z.string(),
  createdAt: z.string(),
  userId: z.number(),
  isRead: z.boolean(),
});

export type NotificationDTO = z.infer<typeof NotificationDTOSchema>;

export const CommentDTOSchema = z.object({
  id: z.number().optional(),
  content: z.string().optional(),
  createdById: z.number(),
  createdByName: z.string().optional(),
  createdByImageUrl: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  entityType: z.string(),
  entityId: z.number(),
});

export type CommentDTO = z.infer<typeof CommentDTOSchema>;

export type EntityType = "Ticket" | "Team" | "Comment";

export type EntityWatcherDTO = {
  id: number;
  entityType: EntityType;
  entityId: number;
  watchUserId: number;
  watchUserName: string;
  watcherImageUrl: string;
  createdAt: string; // ISO 8601 format
  createdBy: number;
};

export const AppSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
  type: z.string(),
  group: z.string().nullable(),
  description: z.string().nullable(),
});

export type AppSettingDTO = z.infer<typeof AppSettingSchema>;

export interface VersionCheckResponse {
  isOutdated: boolean;
  latestVersion: string;
  releaseDate: string;
  releaseNotes: string;
  instruction_link: string;
}
