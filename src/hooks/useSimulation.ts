import { useState, useEffect, useCallback, useRef } from 'react';
import { Agent, POI, LogMessage } from '../types';
import { decideNextAction } from '../lib/gemini';

const INITIAL_POIS: POI[] = [
  { id: 'poi_cafe', name: '餐厅', x: 2, y: 2, type: 'EAT', icon: 'Utensils' },
  { id: 'poi_dorm', name: '宿舍', x: 8, y: 2, type: 'REST', icon: 'Bed' },
  { id: 'poi_factory', name: '工厂', x: 8, y: 8, type: 'WORK', icon: 'Hammer' },
  { id: 'poi_park', name: '中央公园', x: 2, y: 8, type: 'SOCIALIZE', icon: 'Trees' },
];

const GoalMap: Record<string, string> = { EAT: '进食', REST: '休息', WORK: '工作', SOCIALIZE: '社交', WANDER: '游荡' };

const INITIAL_AGENTS: Agent[] = [
  {
    id: 'agent_1',
    name: 'Alice',
    color: '#ff0055', // neon pink
    x: 5,
    y: 5,
    stats: { energy: 100, hunger: 0, social: 0 },
    state: 'IDLE',
    currentGoal: null,
    targetPoiId: null,
    thought: '系统初始化完成。等待输入。',
    isThinking: false,
    actionTicksLeft: 0,
    inventory: [],
  },
  {
    id: 'agent_2',
    name: 'Bob',
    color: '#00f3ff', // neon cyan
    x: 4,
    y: 6,
    stats: { energy: 80, hunger: 40, social: 20 },
    state: 'IDLE',
    currentGoal: null,
    targetPoiId: null,
    thought: '自检正常。就绪。',
    isThinking: false,
    actionTicksLeft: 0,
    inventory: [],
  },
  {
    id: 'agent_3',
    name: 'Charlie',
    color: '#00ff66', // neon green
    x: 6,
    y: 4,
    stats: { energy: 40, hunger: 80, social: 10 },
    state: 'IDLE',
    currentGoal: null,
    targetPoiId: null,
    thought: '能量水平临界。需要补给。',
    isThinking: false,
    actionTicksLeft: 0,
    inventory: [],
  },
];

export function useSimulation() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [pois] = useState<POI[]>(INITIAL_POIS);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [tickCount, setTickCount] = useState(0);

  const addLog = useCallback((agentName: string, message: string) => {
    setLogs((prev) => [
      { id: Math.random().toString(36).substring(7), timestamp: new Date(), agentName, message },
      ...prev,
    ].slice(0, 50)); // Keep last 50 logs
  }, []);

  // Use a ref to hold the latest state for the async Gemini calls to avoid stale closures
  const agentsRef = useRef(agents);
  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  const tick = useCallback(async () => {
    setTickCount((c) => c + 1);

    setAgents((currentAgents) => {
      const newAgents = [...currentAgents];

      newAgents.forEach((agent, index) => {
        // 1. Natural stat decay over time
        if (tickCount % 5 === 0) {
          agent.stats.hunger = Math.min(100, agent.stats.hunger + 2);
          agent.stats.energy = Math.max(0, agent.stats.energy - 1);
          agent.stats.social = Math.min(100, agent.stats.social + 1);
        }

        // 2. State Machine
        if (agent.state === 'IDLE' && !agent.isThinking) {
          // Trigger thinking
          agent.isThinking = true;
          
          // Fire async call to Gemini
          const otherAgents = agentsRef.current.filter(a => a.id !== agent.id);
          decideNextAction(agent, pois, otherAgents).then((decision) => {
            setAgents((prev) => {
              const updated = [...prev];
              const a = updated.find(x => x.id === agent.id);
              if (a) {
                a.isThinking = false;
                a.thought = decision.thought;
                a.currentGoal = decision.goal;
                a.targetPoiId = decision.targetPoiId;
                a.state = 'MOVING';
                addLog(a.name, `决定去 [${GoalMap[decision.goal] || decision.goal}]: "${decision.thought}"`);
              }
              return updated;
            });
          });
        } 
        else if (agent.state === 'MOVING') {
          // Find target
          const targetPoi = pois.find(p => p.id === agent.targetPoiId);
          if (targetPoi) {
            // Move towards target (Manhattan distance)
            if (agent.x < targetPoi.x) agent.x += 1;
            else if (agent.x > targetPoi.x) agent.x -= 1;
            else if (agent.y < targetPoi.y) agent.y += 1;
            else if (agent.y > targetPoi.y) agent.y -= 1;

            // Check if arrived
            if (agent.x === targetPoi.x && agent.y === targetPoi.y) {
              agent.state = 'PERFORMING';
              agent.actionTicksLeft = 5; // Takes 5 ticks to complete an action
              addLog(agent.name, `抵达 [${targetPoi.name}] 开始 [${GoalMap[agent.currentGoal as string] || agent.currentGoal}]`);
            }
          } else {
            // Wandering or invalid target
            agent.x += Math.floor(Math.random() * 3) - 1;
            agent.y += Math.floor(Math.random() * 3) - 1;
            // Keep in bounds (0-10)
            agent.x = Math.max(0, Math.min(10, agent.x));
            agent.y = Math.max(0, Math.min(10, agent.y));
            
            if (Math.random() > 0.7) {
              agent.state = 'IDLE'; // Stop wandering eventually
            }
          }
        }
        else if (agent.state === 'PERFORMING') {
          agent.actionTicksLeft -= 1;
          
          // Apply benefits of the action gradually
          if (agent.currentGoal === 'EAT') agent.stats.hunger = Math.max(0, agent.stats.hunger - 20);
          if (agent.currentGoal === 'REST') agent.stats.energy = Math.min(100, agent.stats.energy + 20);
          if (agent.currentGoal === 'SOCIALIZE') agent.stats.social = Math.max(0, agent.stats.social - 20);
          if (agent.currentGoal === 'WORK') agent.stats.energy = Math.max(0, agent.stats.energy - 5);

          if (agent.actionTicksLeft <= 0) {
            agent.state = 'IDLE';
            agent.currentGoal = null;
            agent.targetPoiId = null;
            addLog(agent.name, `动作执行完毕。`);
          }
        }
      });

      return newAgents;
    });
  }, [pois, addLog, tickCount]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(tick, 1500); // 1.5 seconds per tick
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  return {
    agents,
    pois,
    logs,
    isRunning,
    setIsRunning,
    tickCount
  };
}
