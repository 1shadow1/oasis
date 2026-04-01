import React from 'react';
import { Agent } from '../types';
import { Battery, Pizza, Users, Cpu, Radio } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const StateMap: Record<string, string> = { IDLE: '空闲', MOVING: '移动中', PERFORMING: '执行中' };
  const GoalMap: Record<string, string> = { EAT: '进食', REST: '休息', WORK: '工作', SOCIALIZE: '社交', WANDER: '游荡' };

  return (
    <div className="tech-panel p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" 
            style={{ backgroundColor: agent.color, color: agent.color }} 
          />
          <h3 className="font-mono font-bold text-sm tracking-widest uppercase text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
            {agent.name}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono border border-cyan-800/50 bg-black/50 px-2 py-1">
          <Radio className="w-3 h-3 text-cyan-500 animate-pulse" />
          <span className="text-cyan-400 uppercase tracking-wider">
            {StateMap[agent.state] || agent.state} {agent.currentGoal ? `[${GoalMap[agent.currentGoal] || agent.currentGoal}]` : ''}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <StatBar icon={<Battery className="w-3 h-3" />} label="能量" value={agent.stats.energy} color="bg-cyan-400" glowColor="rgba(34,211,238,0.5)" />
        <StatBar icon={<Pizza className="w-3 h-3" />} label="饥饿" value={agent.stats.hunger} color="bg-amber-400" glowColor="rgba(251,191,36,0.5)" inverse />
        <StatBar icon={<Users className="w-3 h-3" />} label="社交" value={agent.stats.social} color="bg-purple-400" glowColor="rgba(192,132,252,0.5)" inverse />
      </div>

      {/* Thought Output */}
      <div className="bg-black/60 border border-cyan-900/50 p-3 relative overflow-hidden min-h-[60px] flex items-center">
        {/* Scanline inside thought box */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,243,255,0.05)_50%)] bg-[length:100%_4px] pointer-events-none" />
        
        {agent.isThinking ? (
          <div className="w-full flex items-center gap-2 text-cyan-500 text-xs font-mono">
            <Cpu className="w-4 h-4 animate-spin" />
            <span className="animate-pulse">查询神经核心...</span>
          </div>
        ) : (
          <div className="text-xs font-mono text-cyan-100/80 leading-relaxed">
            <span className="text-cyan-500 mr-2">{'>'}</span>
            {agent.thought}
            <span className="inline-block w-1.5 h-3 bg-cyan-500/70 ml-1 animate-pulse align-middle" />
          </div>
        )}
      </div>
    </div>
  );
}

function StatBar({ icon, label, value, color, glowColor, inverse = false }: { icon: React.ReactNode, label: string, value: number, color: string, glowColor: string, inverse?: boolean }) {
  const isWarning = inverse ? value > 70 : value < 30;
  const barColor = isWarning ? 'bg-red-500' : color;
  const shadowColor = isWarning ? 'rgba(239,68,68,0.5)' : glowColor;
  
  // Create segmented look
  const segments = 10;
  const filledSegments = Math.round((value / 100) * segments);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[10px] font-mono text-cyan-600 uppercase tracking-widest">
        <div className="flex items-center gap-1">
          {icon} <span>{label}</span>
        </div>
        <span className={isWarning ? 'text-red-400' : 'text-cyan-400'}>{Math.round(value)}%</span>
      </div>
      <div className="flex gap-[1px] h-2 w-full bg-black/50 p-[1px] border border-cyan-900/30">
        {Array.from({ length: segments }).map((_, i) => (
          <div 
            key={i}
            className={`flex-1 transition-all duration-300 ${i < filledSegments ? barColor : 'bg-transparent'}`}
            style={{
              boxShadow: i < filledSegments ? `0 0 8px ${shadowColor}` : 'none',
              opacity: i < filledSegments ? 1 : 0.1
            }}
          />
        ))}
      </div>
    </div>
  );
}
