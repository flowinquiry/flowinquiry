// ============================================================================
// Query & Pagination
// ============================================================================

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
