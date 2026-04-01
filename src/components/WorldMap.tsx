import React from 'react';
import { Agent, POI } from '../types';
import { Utensils, Bed, Hammer, Trees, Hexagon } from 'lucide-react';
import { motion } from 'motion/react';

interface WorldMapProps {
  agents: Agent[];
  pois: POI[];
}

const GRID_SIZE = 11; // 0 to 10

const IconMap: Record<string, React.ElementType> = {
  Utensils,
  Bed,
  Hammer,
  Trees,
};

export function WorldMap({ agents, pois }: WorldMapProps) {
  return (
    <div className="relative w-full aspect-[4/3] bg-[#02050a] overflow-hidden">
      {/* Holographic Grid Background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 243, 255, 0.15) 1px, transparent 1px), 
            linear-gradient(to bottom, rgba(0, 243, 255, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: `${100 / GRID_SIZE}% ${100 / (GRID_SIZE * 0.75)}%`
        }}
      />
      
      {/* Radar Sweep Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(0,243,255,0.1)_90deg,transparent_90deg)] animate-[spin_4s_linear_infinite] rounded-full" />
      </div>

      {/* Communication Links (Protocol Visualization) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {agents.map(agent => {
          if (agent.state === 'COMMUNICATING' && agent.targetAgentId) {
            const targetAgent = agents.find(a => a.id === agent.targetAgentId);
            if (targetAgent) {
              const startX = `${(agent.x / (GRID_SIZE - 1)) * 100}%`;
              const startY = `${(agent.y / (GRID_SIZE - 1)) * 100}%`;
              const endX = `${(targetAgent.x / (GRID_SIZE - 1)) * 100}%`;
              const endY = `${(targetAgent.y / (GRID_SIZE - 1)) * 100}%`;
              
              return (
                <g key={`link-${agent.id}-${targetAgent.id}`}>
                  {/* Base glowing line */}
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke={agent.color}
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className="animate-pulse"
                    style={{ filter: `drop-shadow(0 0 8px ${agent.color})` }}
                  />
                  {/* Data packet animation */}
                  <motion.circle
                    r="3"
                    fill="#fff"
                    style={{ filter: 'drop-shadow(0 0 5px #fff)' }}
                    initial={{ cx: startX, cy: startY }}
                    animate={{ cx: endX, cy: endY }}
                    transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                  />
                </g>
              );
            }
          }
          return null;
        })}
      </svg>

      {/* POIs (Nodes) */}
      {pois.map((poi) => {
        const Icon = IconMap[poi.icon] || Hexagon;
        return (
          <div
            key={poi.id}
            className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${(poi.x / (GRID_SIZE - 1)) * 100}%`,
              top: `${(poi.y / (GRID_SIZE - 1)) * 100}%`,
              width: `${100 / GRID_SIZE}%`,
              height: `${100 / (GRID_SIZE * 0.75)}%`,
            }}
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-500/20 blur-md rounded-full group-hover:bg-cyan-400/40 transition-all" />
              <div className="relative border border-cyan-500/50 bg-black/50 p-2 transform rotate-45">
                <Icon className="w-5 h-5 text-cyan-400 -rotate-45 opacity-80" strokeWidth={1.5} />
              </div>
            </div>
            <span className="text-[9px] font-mono text-cyan-300 mt-3 tracking-widest uppercase opacity-70">
              {poi.name}
            </span>
          </div>
        );
      })}

      {/* Agents (Entities) */}
      {agents.map((agent) => (
        <motion.div
          key={agent.id}
          className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 z-20"
          initial={false}
          animate={{
            left: `${(agent.x / (GRID_SIZE - 1)) * 100}%`,
            top: `${(agent.y / (GRID_SIZE - 1)) * 100}%`,
          }}
          transition={{ type: 'spring', stiffness: 40, damping: 12 }}
          style={{
            width: `${100 / GRID_SIZE}%`,
            height: `${100 / (GRID_SIZE * 0.75)}%`,
          }}
        >
          <div className="relative flex items-center justify-center">
            {/* Agent Glow */}
            <div 
              className="absolute w-8 h-8 rounded-full opacity-40 blur-md"
              style={{ backgroundColor: agent.color }}
            />
            {/* Agent Core */}
            <div 
              className="w-3 h-3 rounded-sm rotate-45 border border-white/50 relative z-10"
              style={{ 
                backgroundColor: agent.color,
                boxShadow: `0 0 15px ${agent.color}, inset 0 0 5px rgba(255,255,255,0.8)`
              }}
            />
            
            {/* Thinking Indicator */}
            {agent.isThinking && (
              <motion.div 
                className="absolute -top-6 -right-6 border border-purple-500/50 bg-black/80 p-1 rounded-sm backdrop-blur-sm"
                animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              </motion.div>
            )}

            {/* Action Indicator */}
            {(agent.state === 'PERFORMING' || agent.state === 'COMMUNICATING') && (
              <motion.div 
                className="absolute -top-8 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold tracking-widest uppercase bg-black/80 px-1.5 py-0.5 border border-white/20 whitespace-nowrap"
                style={{ color: agent.color, textShadow: `0 0 5px ${agent.color}` }}
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {agent.currentGoal === 'EAT' ? '进食' :
                 agent.currentGoal === 'REST' ? '休息' :
                 agent.currentGoal === 'WORK' ? '工作' :
                 agent.currentGoal === 'SOCIALIZE' ? '社交' :
                 agent.currentGoal === 'WANDER' ? '游荡' : 
                 agent.currentGoal === 'INVOKE_AGENT' ? '通信中' : agent.currentGoal}
              </motion.div>
            )}
          </div>
          <span 
            className="text-[10px] font-mono mt-2 px-1 py-0.5 tracking-wider uppercase"
            style={{ color: agent.color, textShadow: `0 0 8px ${agent.color}` }}
          >
            {agent.name}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
