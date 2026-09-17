export const TICKET_STATES = [
  'backlog',
  'spec-draft',
  'spec-approved',
  'planned',
  'in-review',
  'changes-requested',
  'merged',
  'done',
] as const;
export type TicketState = (typeof TICKET_STATES)[number];

/** The two points where a human has to act. */
export const GATE_STATES: Partial<Record<TicketState, string>> = {
  'spec-draft': 'Spec freigeben',
  'in-review': 'PR mergen',
};

export type Risk = 'low' | 'medium' | 'high' | '';

export const TICKET_TYPES = ['product', 'factory', 'bug'] as const;
export type TicketType = (typeof TICKET_TYPES)[number];

export interface Ticket {
  id: string;
  title: string;
  type: TicketType;
  risk: Risk;
  state: TicketState;
  created: string;
  branch: string;
  pr: string;
  spec: string;
  report: string;
  /** path relative to the repo root */
  file: string;
  /** everything below the frontmatter */
  body: string;
}

export interface RepoConfig {
  id: string;
  path: string;
  name: string;
}

export interface DoctorFinding {
  check: string;
  message: string;
  fix: string;
}

export type RunStatus = 'running' | 'ok' | 'failed' | 'waiting-for-human';

export interface Run {
  id: string;
  repoId: string;
  ticketId: string;
  command: string;
  status: RunStatus;
  startedAt: string;
  sessionId?: string;
}

export type RunEventType =
  | 'run.started'
  | 'agent.message'
  | 'agent.tool_use'
  | 'agent.tool_result'
  | 'agent.question'
  | 'agent.permission'
  | 'ticket.state'
  | 'run.finished';

export interface RunEvent {
  type: RunEventType;
  at: string;
  /** agent.message */
  role?: string;
  text?: string;
  /** agent.tool_use / agent.tool_result */
  tool?: string;
  input?: unknown;
  output?: string;
  ok?: boolean;
  /** agent.question / agent.permission */
  questionId?: string;
  requestId?: string;
  /** ticket.state */
  ticketId?: string;
  from?: TicketState;
  to?: TicketState;
  /** run.started / run.finished */
  runId?: string;
  command?: string;
  status?: RunStatus;
  summary?: string;
}

export interface Report {
  id: string;
  title: string;
  /** hours, null when the timeline is incomplete */
  leadTimeHours: number | null;
  prToMergeHours: number | null;
  reviewRounds: number | null;
  autonomousRatePct: number | null;
  doneAt: string | null;
}

/** The next command for a ticket, or null when a human has to act. */
export function nextCommand(state: TicketState): string | null {
  switch (state) {
    case 'backlog':
      return 'factory-spec';
    case 'spec-approved':
      return 'factory-plan';
    case 'planned':
      return 'factory-implement';
    case 'changes-requested':
      return 'factory-implement';
    case 'merged':
      return 'factory-release';
    default:
      return null;
  }
}
