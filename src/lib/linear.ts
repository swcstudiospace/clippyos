/** Client-safe Linear Kanban bridge. Secrets never live here. */

export const LINEAR_QUERY_KEY = ["linear"] as const;
export const LINEAR_LINKS_QUERY_KEY = ["linear-links"] as const;

export const LINEAR_ENTITY_TYPES = [
  "AgentRun",
  "RenderJob",
  "SocialUploadJob",
  "KnowledgeProposal",
  "ApprovalRequest",
  "Milestone",
] as const;
export type LinearEntityType = (typeof LINEAR_ENTITY_TYPES)[number];

export const LINEAR_KANBAN_COLUMNS = [
  "backlog",
  "ready",
  "inProgress",
  "inReview",
  "done",
] as const;
export type LinearKanbanColumn = (typeof LINEAR_KANBAN_COLUMNS)[number];

export const LINEAR_COLUMN_LABELS: Record<LinearKanbanColumn, string> = {
  backlog: "Backlog",
  ready: "Ready",
  inProgress: "In Progress",
  inReview: "In Review",
  done: "Done",
};

export const LINEAR_COLUMN_HINTS: Record<LinearKanbanColumn, string> = {
  backlog: "Not scheduled",
  ready: "Specced, unblocked",
  inProgress: "Active build / running job",
  inReview: "PR / approval / client review",
  done: "Shipped / job succeeded",
};

export const LINEAR_DEFAULT_MILESTONES = ["M1", "M2", "M3", "M4", "M5", "M6", "M7"] as const;

export type LinearWorkflowState = {
  id: string;
  name: string;
  type: string;
  position: number;
};

export type LinearTeamOption = {
  id: string;
  name: string;
  key: string;
};

export type LinearProjectOption = {
  id: string;
  name: string;
};

export type LinearMilestoneOption = {
  id: string;
  name: string;
};

export type LinearStateMap = Record<LinearKanbanColumn, string | null>;

export const EMPTY_STATE_MAP: LinearStateMap = {
  backlog: null,
  ready: null,
  inProgress: null,
  inReview: null,
  done: null,
};

export type LinearFlags = {
  enabled: boolean;
  syncJobs: boolean;
  autoIssueOnFail: boolean;
  autoIssueOnProposal: boolean;
  membersCanCreate: boolean;
  failColumn: LinearKanbanColumn;
};

export const DEFAULT_LINEAR_FLAGS: LinearFlags = {
  enabled: false,
  syncJobs: false,
  autoIssueOnFail: true,
  autoIssueOnProposal: false,
  membersCanCreate: false,
  failColumn: "inProgress",
};

export type LinearPublicStatus = {
  configured: boolean;
  health: "not_configured" | "saved" | "connected" | "error";
  last4: string | null;
  oauthConfigured: boolean;
  viewerName: string | null;
  organizationId: string | null;
  organizationName: string | null;
  workspaceSlug: string | null;
  teamId: string | null;
  teamName: string | null;
  projectId: string | null;
  projectName: string | null;
  stateMap: LinearStateMap;
  stateNames: Partial<Record<LinearKanbanColumn, string>>;
  flags: LinearFlags;
  teams: LinearTeamOption[];
  projects: LinearProjectOption[];
  states: LinearWorkflowState[];
  milestones: LinearMilestoneOption[];
  lastTestedAt: string | null;
  lastError: string | null;
  callbackUrl: string;
};

export type LinearLink = {
  id: string;
  agencyEntityType: LinearEntityType;
  agencyEntityId: string;
  linearIssueId: string;
  linearIdentifier: string | null;
  linearUrl: string | null;
  lastStateId: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
};

export type LinearIssueView = {
  id: string;
  identifier: string;
  url: string;
  title: string;
  stateName: string | null;
};

export function isLinearEntityType(value: unknown): value is LinearEntityType {
  return typeof value === "string" && (LINEAR_ENTITY_TYPES as readonly string[]).includes(value);
}

export function isLinearColumn(value: unknown): value is LinearKanbanColumn {
  return typeof value === "string" && (LINEAR_KANBAN_COLUMNS as readonly string[]).includes(value);
}

export function guessColumnFromName(name: string): LinearKanbanColumn | null {
  const n = name.trim().toLowerCase();
  if (n === "backlog" || n === "triage") return "backlog";
  if (n === "ready" || n === "todo" || n === "to do" || n === "unstarted") return "ready";
  if (n === "in progress" || n === "in-progress" || n === "started" || n === "doing") return "inProgress";
  if (n === "in review" || n === "in-review" || n === "review" || n === "in qa") return "inReview";
  if (n === "done" || n === "completed" || n === "shipped" || n === "closed") return "done";
  return null;
}

export function guessColumnFromType(type: string, name: string): LinearKanbanColumn | null {
  const fromName = guessColumnFromName(name);
  if (fromName) return fromName;
  switch (type) {
    case "backlog":
    case "triage":
      return "backlog";
    case "unstarted":
      return "ready";
    case "started":
      return "inProgress";
    case "completed":
      return "done";
    default:
      return null;
  }
}
