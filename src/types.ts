export type ActionState = 'IDLE' | 'MOVING' | 'PERFORMING' | 'COMMUNICATING';
export type GoalType = 'EAT' | 'REST' | 'WORK' | 'SOCIALIZE' | 'WANDER' | 'INVOKE_AGENT';

export interface POI {
  id: string;
  name: string;
  x: number;
  y: number;
  type: GoalType;
  icon: string;
}

export interface AgentStats {
  energy: number; // 0-100 (0 is exhausted, 100 is fully rested)
  hunger: number; // 0-100 (0 is full, 100 is starving)
  social: number; // 0-100 (0 is satisfied, 100 is lonely)
}

export interface AgentCard {
  agent_id: string;
  name: string;
  description: string;
  capabilities: string[];
  endpoint: string;
}

export interface InvokeRequest {
  invoke_id: string;
  caller_id: string;
  callee_id: string;
  task_type: string;
  payload: {
    task: string;
    context?: any;
  };
  timestamp: string;
}

export interface Agent {
  id: string;
  name: string;
  color: string;
  card: AgentCard;
  x: number;
  y: number;
  stats: AgentStats;
  state: ActionState;
  currentGoal: GoalType | null;
  targetPoiId: string | null;
  targetAgentId: string | null;
  lastInvokeRequest: InvokeRequest | null;
  thought: string;
  isThinking: boolean;
  actionTicksLeft: number;
  inventory: string[];
}

export interface LogMessage {
  id: string;
  timestamp: Date;
  agentName: string;
  message: string;
}
