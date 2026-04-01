export type ActionState = 'IDLE' | 'MOVING' | 'PERFORMING';
export type GoalType = 'EAT' | 'REST' | 'WORK' | 'SOCIALIZE' | 'WANDER';

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

export interface Agent {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  stats: AgentStats;
  state: ActionState;
  currentGoal: GoalType | null;
  targetPoiId: string | null;
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
