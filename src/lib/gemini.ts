import { GoogleGenAI, Type } from '@google/genai';
import { Agent, POI, GoalType } from '../types';

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const decisionSchema = {
  type: Type.OBJECT,
  properties: {
    thought: {
      type: Type.STRING,
      description: "A short internal monologue (1-2 sentences) explaining why you are making this decision based on your current stats. MUST BE IN CHINESE (简体中文).",
    },
    goal: {
      type: Type.STRING,
      description: "The action you want to take. Must be one of: EAT, REST, WORK, SOCIALIZE, WANDER, INVOKE_AGENT.",
    },
    targetPoiId: {
      type: Type.STRING,
      description: "The ID of the Point of Interest you want to go to. Leave empty if wandering or invoking an agent.",
    },
    targetAgentId: {
      type: Type.STRING,
      description: "If goal is INVOKE_AGENT, the agent_id of the agent you want to call.",
    },
    task_type: {
      type: Type.STRING,
      description: "If goal is INVOKE_AGENT, the capability/task_type you are requesting from them.",
    },
    payload_task: {
      type: Type.STRING,
      description: "If goal is INVOKE_AGENT, the natural language description of the task you want them to do.",
    }
  },
  required: ["thought", "goal"],
};

export async function decideNextAction(
  agent: Agent,
  pois: POI[],
  otherAgents: Agent[]
): Promise<{ thought: string; goal: GoalType; targetPoiId: string | null; targetAgentId: string | null; task_type: string | null; payload_task: string | null }> {
  try {
    const prompt = `
You are an autonomous AI agent named ${agent.name} living in a simulated 2D world.
You need to decide your next action to survive and thrive.

YOUR CURRENT STATS (Scale 0-100):
- Energy: ${agent.stats.energy} (Lower means you are tired. If < 30, you desperately need REST)
- Hunger: ${agent.stats.hunger} (Higher means you are starving. If > 70, you desperately need to EAT)
- Social: ${agent.stats.social} (Higher means you are lonely. If > 70, you should SOCIALIZE)

AVAILABLE LOCATIONS (Points of Interest):
${pois.map((p) => `- ID: ${p.id} | Name: ${p.name} | Provides: ${p.type}`).join('\n')}

[DISCOVERY API] OTHER AGENTS IN THE NETWORK:
You can collaborate with other agents by invoking them using the INVOKE_AGENT goal.
${otherAgents.map((a) => `
- Agent ID: ${a.card.agent_id}
  Name: ${a.card.name}
  Description: ${a.card.description}
  Capabilities: [${a.card.capabilities.join(', ')}]
`).join('\n')}

INSTRUCTIONS:
1. Evaluate your stats. Prioritize critical needs (e.g., high hunger or low energy).
2. Choose a Goal (EAT, REST, WORK, SOCIALIZE, WANDER, INVOKE_AGENT).
   - If you need help that matches another agent's capabilities, choose INVOKE_AGENT.
3. If going to a location, provide targetPoiId.
4. If invoking an agent, provide targetAgentId, task_type (must be one of their capabilities), and payload_task.
5. Provide a brief thought process in character. MUST BE IN CHINESE (简体中文).

Respond strictly in JSON format matching the schema.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: decisionSchema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const decision = JSON.parse(text);
    
    // Validate goal
    const validGoals: GoalType[] = ['EAT', 'REST', 'WORK', 'SOCIALIZE', 'WANDER', 'INVOKE_AGENT'];
    const goal = validGoals.includes(decision.goal as GoalType) ? (decision.goal as GoalType) : 'WANDER';

    return {
      thought: decision.thought,
      goal: goal,
      targetPoiId: decision.targetPoiId || null,
      targetAgentId: decision.targetAgentId || null,
      task_type: decision.task_type || null,
      payload_task: decision.payload_task || null,
    };
  } catch (error) {
    console.error(`Error getting decision for ${agent.name}:`, error);
    // Fallback decision if API fails
    return {
      thought: "系统出现干扰，我先随便走走。",
      goal: 'WANDER',
      targetPoiId: null,
      targetAgentId: null,
      task_type: null,
      payload_task: null,
    };
  }
}
