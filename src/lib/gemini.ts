import { GoogleGenAI, Type } from '@google/genai';
import { Agent, POI, GoalType } from '../types';

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const decisionSchema = {
  type: Type.OBJECT,
  properties: {
    thought: {
      type: Type.STRING,
      description: "A short internal monologue (1-2 sentences) explaining why you are making this decision based on your current stats.",
    },
    goal: {
      type: Type.STRING,
      description: "The action you want to take. Must be one of: EAT, REST, WORK, SOCIALIZE, WANDER.",
    },
    targetPoiId: {
      type: Type.STRING,
      description: "The ID of the Point of Interest you want to go to. If wandering, leave empty.",
    },
  },
  required: ["thought", "goal", "targetPoiId"],
};

export async function decideNextAction(
  agent: Agent,
  pois: POI[],
  otherAgents: Agent[]
): Promise<{ thought: string; goal: GoalType; targetPoiId: string | null }> {
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

OTHER AGENTS IN THE WORLD:
${otherAgents.map((a) => `- ${a.name} (Currently at X:${a.x}, Y:${a.y})`).join('\n')}

INSTRUCTIONS:
1. Evaluate your stats. Prioritize critical needs (e.g., high hunger or low energy).
2. Choose a Goal (EAT, REST, WORK, SOCIALIZE, WANDER).
3. Choose a target location ID that provides that goal.
4. Provide a brief thought process in character. MUST BE IN CHINESE (简体中文).

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
    const validGoals: GoalType[] = ['EAT', 'REST', 'WORK', 'SOCIALIZE', 'WANDER'];
    const goal = validGoals.includes(decision.goal as GoalType) ? (decision.goal as GoalType) : 'WANDER';

    return {
      thought: decision.thought,
      goal: goal,
      targetPoiId: decision.targetPoiId || null,
    };
  } catch (error) {
    console.error(`Error getting decision for ${agent.name}:`, error);
    // Fallback decision if API fails
    return {
      thought: "I feel confused, I'll just wander around for a bit.",
      goal: 'WANDER',
      targetPoiId: null,
    };
  }
}
