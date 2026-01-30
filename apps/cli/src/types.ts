// ============================================================================
// Query & Pagination
// ============================================================================

export type ApiObject = Record<string, unknown>;
export type ApiList<T = ApiObject> = T[];

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

// ============================================================================
// Enums
// ============================================================================

export type TicketPriority = "Critical" | "High" | "Medium" | "Low" | "Trivial";
export type ProjectStatus = "Active" | "Closed" | "Cancelled";
export type WorkflowVisibility = "PUBLIC" | "PRIVATE" | "TEAM";
export type TicketChannel = "Web" | "Email" | "Slack" | "Teams";
export type TShirtSize = "XS" | "S" | "M" | "L" | "XL";

// ============================================================================
// Team
// ============================================================================

export type TeamDTO = {
  id: number;
  name: string;
  logoUrl?: string;
  slogan?: string;
  description?: string;
  organizationId?: number;
  usersCount?: number;
};

export type UserWithTeamRoleDTO = {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  timezone?: string;
  imageUrl?: string;
  title?: string;
  teamId?: number;
  teamRole?: string;
};

// ============================================================================
// Workflow
// ============================================================================

export type WorkflowDTO = {
  id: number;
  name: string;
  description?: string;
  requestName?: string;
  ownerId?: number;
  ownerName?: string;
  visibility?: WorkflowVisibility;
  level1EscalationTimeout?: number;
  level2EscalationTimeout?: number;
  level3EscalationTimeout?: number;
  tags?: string;
  useForProject?: boolean;
};

export type WorkflowStateDTO = {
  id: number;
  workflowId: number;
  stateName: string;
  isInitial?: boolean;
  isFinal?: boolean;
};

export type WorkflowTransitionDTO = {
  id?: number;
  workflowId: number;
  sourceStateId: number;
  targetStateId: number;
};

export type WorkflowDetailedDTO = WorkflowDTO & {
  states: WorkflowStateDTO[];
  transitions: WorkflowTransitionDTO[];
};

// ============================================================================
// Project
// ============================================================================

export type ProjectDTO = {
  id: number;
  name: string;
  description?: string;
  shortName: string;
  teamId: number;
  teamName?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  createdBy?: number;
  createdAt?: string;
  modifiedBy?: number;
  modifiedAt?: string;
};

// ============================================================================
// Ticket
// ============================================================================

export type TicketDTO = {
  id?: number;
  teamId: number;
  teamName?: string;
  workflowId: number;
  workflowName?: string;
  workflowRequestName?: string;
  projectId?: number;
  projectName?: string;
  projectShortName?: string;
  projectTicketNumber?: number;
  requestUserId: number;
  requestUserName?: string;
  requestUserImageUrl?: string;
  assignUserId?: number;
  assignUserName?: string;
  assignUserImageUrl?: string;
  requestTitle: string;
  requestDescription?: string;
  priority: TicketPriority;
  estimatedCompletionDate?: string;
  actualCompletionDate?: string;
  currentStateId: number;
  currentStateName?: string;
  iterationId?: number;
  iterationName?: string;
  epicId?: number;
  epicName?: string;
  channel?: TicketChannel;
  isNew?: boolean;
  isCompleted?: boolean;
  createdAt?: string;
  modifiedAt?: string;
  numberAttachments?: number;
  numberWatchers?: number;
  size?: TShirtSize;
  estimate?: number;
  parentTicketId?: number;
  childTicketIds?: number[];
};

// ============================================================================
// Users & Auth
// ============================================================================

export type AuthResponseDTO = {
  id_token: string;
};

export type UserDTO = {
  id?: number;
  email?: string;
  login?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  activated?: boolean;
  langKey?: string;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  authorities?: string[];
  timezone?: string;
  title?: string;
  managerId?: number;
};

export type AuthorityDTO = {
  id?: number;
  name: string;
  description?: string;
};

export type ResourceDTO = {
  id?: number;
  name?: string;
  description?: string;
  code?: string;
};

// ============================================================================
// Organizations
// ============================================================================

export type OrganizationDTO = {
  id?: number;
  name: string;
  description?: string;
  website?: string;
};

// ============================================================================
// Project Iterations & Epics
// ============================================================================

export type ProjectIterationDTO = {
  id?: number;
  name: string;
  projectId: number;
  startDate?: string;
  endDate?: string;
  status?: string;
};

export type ProjectEpicDTO = {
  id?: number;
  name: string;
  projectId: number;
  description?: string;
  status?: string;
};

export type ProjectSettingDTO = {
  id?: number;
  projectId: number;
  settings?: ApiObject;
};

// ============================================================================
// Collaboration
// ============================================================================

export type CommentDTO = {
  id?: number;
  entityType?: string;
  entityId?: number;
  content?: string;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type NotificationDTO = {
  id?: number;
  userId?: number;
  title?: string;
  message?: string;
  isRead?: boolean;
  createdAt?: string;
};

export type ActivityLogDTO = {
  id?: number;
  userId?: number;
  action?: string;
  entityType?: string;
  entityId?: number;
  createdAt?: string;
  metadata?: ApiObject;
};

export type WatcherDTO = {
  id?: number;
  entityType?: string;
  entityId?: number;
  userId?: number;
};

export type AppSettingDTO = {
  id?: number;
  key: string;
  value?: string;
  description?: string;
};

// ============================================================================
// Files
// ============================================================================

export type FileUploadDTO = {
  id?: number;
  name?: string;
  url?: string;
  size?: number;
  contentType?: string;
};

export type AttachmentDTO = {
  id?: number;
  entityType?: string;
  entityId?: number;
  file?: FileUploadDTO;
};

// ============================================================================
// Shared / Misc
// ============================================================================

export type TimezoneDTO = {
  id?: string;
  label?: string;
  offset?: string;
};

export type VersionDTO = {
  version?: string;
  build?: string;
  commit?: string;
};

export type AiResponseDTO = {
  summary?: string;
  metadata?: ApiObject;
};
