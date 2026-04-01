import { useState, useEffect, useCallback, useRef } from 'react';
import { Agent, POI, LogMessage } from '../types';
import { decideNextAction } from '../lib/gemini';

const INITIAL_POIS: POI[] = [
  { id: 'poi_cafe', name: '餐厅', x: 2, y: 2, type: 'EAT', icon: 'Utensils' },
  { id: 'poi_dorm', name: '宿舍', x: 8, y: 2, type: 'REST', icon: 'Bed' },
  { id: 'poi_factory', name: '工厂', x: 8, y: 8, type: 'WORK', icon: 'Hammer' },
  { id: 'poi_park', name: '中央公园', x: 2, y: 8, type: 'SOCIALIZE', icon: 'Trees' },
];

const GoalMap: Record<string, string> = { EAT: '进食', REST: '休息', WORK: '工作', SOCIALIZE: '社交', WANDER: '游荡', INVOKE_AGENT: '调用智能体' };

const INITIAL_AGENTS: Agent[] = [
  {
    id: 'agent_1',
    name: 'Alice',
    color: '#ff0055', // neon pink
    card: {
      agent_id: 'agent_1',
      name: '数据分析专家',
      description: '专注于数据处理、逻辑推理和复杂信息分析',
      capabilities: ['数据分析', '逻辑推理', '信息摘要'],
      endpoint: 'internal://agent_1/invoke'
    },
    x: 5,
    y: 5,
    stats: { energy: 100, hunger: 0, social: 0 },
    state: 'IDLE',
    currentGoal: null,
    targetPoiId: null,
    targetAgentId: null,
    lastInvokeRequest: null,
    thought: '系统初始化完成。等待输入。',
    isThinking: false,
    actionTicksLeft: 0,
    inventory: [],
  },
  {
    id: 'agent_2',
    name: 'Bob',
    color: '#00f3ff', // neon cyan
    card: {
      agent_id: 'agent_2',
      name: '资源管理助手',
      description: '擅长资源收集、建造规划和环境交互',
      capabilities: ['资源收集', '建造规划', '环境交互'],
      endpoint: 'internal://agent_2/invoke'
    },
    x: 4,
    y: 6,
    stats: { energy: 80, hunger: 40, social: 20 },
    state: 'IDLE',
    currentGoal: null,
    targetPoiId: null,
    targetAgentId: null,
    lastInvokeRequest: null,
    thought: '自检正常。就绪。',
    isThinking: false,
    actionTicksLeft: 0,
    inventory: [],
  },
  {
    id: 'agent_3',
    name: 'Charlie',
    color: '#00ff66', // neon green
    card: {
      agent_id: 'agent_3',
      name: '环境探测器',
      description: '负责探索未知区域、危险预警和地形测绘',
      capabilities: ['环境探测', '危险预警', '地形测绘'],
      endpoint: 'internal://agent_3/invoke'
    },
    x: 6,
    y: 4,
    stats: { energy: 40, hunger: 80, social: 10 },
    state: 'IDLE',
    currentGoal: null,
    targetPoiId: null,
    targetAgentId: null,
    lastInvokeRequest: null,
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
      const newAgents = currentAgents.map(agent => ({ ...agent, stats: { ...agent.stats } }));

      // 1. Natural stat decay over time
      if (tickCount % 5 === 0) {
        newAgents.forEach(agent => {
          agent.stats.hunger = Math.min(100, agent.stats.hunger + 2);
          agent.stats.energy = Math.max(0, agent.stats.energy - 1);
          agent.stats.social = Math.min(100, agent.stats.social + 1);
        });
      }

      const updatedAgents = newAgents.map((agent) => {
        const updatedAgent = { ...agent, stats: { ...agent.stats } };
        // 2. State Machine
        if (updatedAgent.state === 'IDLE' && !updatedAgent.isThinking) {
          // Trigger thinking
          updatedAgent.isThinking = true;
          
          // Fire async call to Gemini
          const otherAgents = agentsRef.current.filter(a => a.id !== updatedAgent.id);
          decideNextAction(updatedAgent, pois, otherAgents).then((decision) => {
            setAgents((prev) => {
              const updated = prev.map(a => ({ ...a, stats: { ...a.stats } }));
              const a = updated.find(x => x.id === updatedAgent.id);
              if (a) {
                a.isThinking = false;
                a.thought = decision.thought;
                a.currentGoal = decision.goal;
                
                if (decision.goal === 'INVOKE_AGENT' && decision.targetAgentId) {
                  a.state = 'COMMUNICATING';
                  a.targetAgentId = decision.targetAgentId;
                  a.actionTicksLeft = 3; // Takes 3 ticks to communicate
                  
                  // Construct the Invoke Protocol request
                  const invokeReq = {
                    invoke_id: `call-${Math.random().toString(36).substring(2, 8)}`,
                    caller_id: a.card.agent_id,
                    callee_id: decision.targetAgentId,
                    task_type: decision.task_type || 'unknown',
                    payload: {
                      task: decision.payload_task || 'No task specified'
                    },
                    timestamp: new Date().toISOString()
                  };
                  a.lastInvokeRequest = invokeReq;
                  
                  addLog(a.name, `[INVOKE_PROTOCOL] 发起调用 -> ${decision.targetAgentId}`);
                  addLog('SYSTEM', `[INVOKE_PAYLOAD]\n${JSON.stringify(invokeReq, null, 2)}`);
                } else {
                  a.targetPoiId = decision.targetPoiId;
                  a.state = 'MOVING';
                  addLog(a.name, `决定去 [${GoalMap[decision.goal] || decision.goal}]: "${decision.thought}"`);
                }
              }
              return updated;
            });
          });
        } 
        else if (updatedAgent.state === 'MOVING') {
          // Find target
          const targetPoi = pois.find(p => p.id === updatedAgent.targetPoiId);
          if (targetPoi) {
            // Move towards target (Manhattan distance)
            if (updatedAgent.x < targetPoi.x) updatedAgent.x += 1;
            else if (updatedAgent.x > targetPoi.x) updatedAgent.x -= 1;
            else if (updatedAgent.y < targetPoi.y) updatedAgent.y += 1;
            else if (updatedAgent.y > targetPoi.y) updatedAgent.y -= 1;

            // Check if arrived
            if (updatedAgent.x === targetPoi.x && updatedAgent.y === targetPoi.y) {
              updatedAgent.state = 'PERFORMING';
              updatedAgent.actionTicksLeft = 5; // Takes 5 ticks to complete an action
              addLog(updatedAgent.name, `抵达 [${targetPoi.name}] 开始 [${GoalMap[updatedAgent.currentGoal as string] || updatedAgent.currentGoal}]`);
            }
          } else {
            // Wandering or invalid target
            updatedAgent.x += Math.floor(Math.random() * 3) - 1;
            updatedAgent.y += Math.floor(Math.random() * 3) - 1;
            // Keep in bounds (0-10)
            updatedAgent.x = Math.max(0, Math.min(10, updatedAgent.x));
            updatedAgent.y = Math.max(0, Math.min(10, updatedAgent.y));
            
            if (Math.random() > 0.7) {
              updatedAgent.state = 'IDLE'; // Stop wandering eventually
            }
          }
        }
        else if (updatedAgent.state === 'COMMUNICATING') {
          updatedAgent.actionTicksLeft -= 1;
          if (updatedAgent.actionTicksLeft <= 0) {
            updatedAgent.state = 'IDLE';
            updatedAgent.currentGoal = null;
            updatedAgent.targetAgentId = null;
            
            // Simulate receiving a response
            if (updatedAgent.lastInvokeRequest) {
              const response = {
                invoke_id: updatedAgent.lastInvokeRequest.invoke_id,
                status: 'success',
                result: { summary: '任务已接收并处理完成。', confidence: 0.95 },
                error: null,
                duration_ms: 1500
              };
              addLog('SYSTEM', `[RESPONSE] ${updatedAgent.lastInvokeRequest.callee_id} -> ${updatedAgent.name}: ${JSON.stringify(response)}`);
            }
            updatedAgent.lastInvokeRequest = null;
          }
        }
        else if (updatedAgent.state === 'PERFORMING') {
          updatedAgent.actionTicksLeft -= 1;
          
          // Apply benefits of the action gradually
          if (updatedAgent.currentGoal === 'EAT') updatedAgent.stats.hunger = Math.max(0, updatedAgent.stats.hunger - 20);
          if (updatedAgent.currentGoal === 'REST') updatedAgent.stats.energy = Math.min(100, updatedAgent.stats.energy + 20);
          if (updatedAgent.currentGoal === 'SOCIALIZE') updatedAgent.stats.social = Math.max(0, updatedAgent.stats.social - 20);
          if (updatedAgent.currentGoal === 'WORK') updatedAgent.stats.energy = Math.max(0, updatedAgent.stats.energy - 5);

          if (updatedAgent.actionTicksLeft <= 0) {
            updatedAgent.state = 'IDLE';
            updatedAgent.currentGoal = null;
            updatedAgent.targetPoiId = null;
            addLog(updatedAgent.name, `动作执行完毕。`);
          }
        }
        return updatedAgent;
      });

      return updatedAgents;
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
