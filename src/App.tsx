import React from 'react';
import { useSimulation } from './hooks/useSimulation';
import { WorldMap } from './components/WorldMap';
import { AgentCard } from './components/AgentCard';
import { Play, Pause, Terminal, Cpu, Database, Activity } from 'lucide-react';

export default function App() {
  const { agents, pois, logs, isRunning, setIsRunning, tickCount } = useSimulation();

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      {/* CRT Overlay */}
      <div className="crt-overlay"></div>

      {/* Header */}
      <header className="border-b border-cyan-900/50 bg-black/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-10 h-10">
              <div className="absolute inset-0 border border-cyan-500/50 rounded-sm animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-1 border border-cyan-400/30 rounded-full animate-[spin_7s_linear_infinite_reverse]" />
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-widest text-cyan-50 uppercase shadow-cyan-500/50 drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]">
                绿洲
              </h1>
              <div className="flex items-center gap-3 text-[10px] text-cyan-500/70 font-mono mt-0.5">
                <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> 系统周期: {tickCount.toString().padStart(6, '0')}</span>
                <span>|</span>
                <span>状态: {isRunning ? '在线' : '待机'}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-2 px-6 py-2 rounded-sm font-mono text-xs tracking-widest uppercase transition-all border ${
              isRunning 
                ? 'bg-red-950/40 text-red-400 border-red-500/50 hover:bg-red-900/60 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                : 'bg-cyan-950/40 text-cyan-400 border-cyan-500/50 hover:bg-cyan-900/60 hover:shadow-[0_0_15px_rgba(0,243,255,0.3)]'
            }`}
          >
            {isRunning ? <><Pause className="w-4 h-4" /> 暂停模拟</> : <><Play className="w-4 h-4" /> 启动模拟</>}
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 grid grid-cols-1 xl:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Column: World Map & Logs */}
        <div className="xl:col-span-8 flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-cyan-500 flex items-center gap-2">
                <Database className="w-4 h-4" /> 阿尔法扇区地图
              </h2>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-cyan-500 animate-pulse" />
                <div className="w-2 h-2 bg-cyan-500/50" />
                <div className="w-2 h-2 bg-cyan-500/20" />
              </div>
            </div>
            <div className="tech-panel p-1">
              <WorldMap agents={agents} pois={pois} />
            </div>
          </section>

          <section className="flex flex-col gap-3 flex-1">
            <h2 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-cyan-500 flex items-center gap-2">
              <Terminal className="w-4 h-4" /> 系统事件日志
            </h2>
            <div className="tech-panel p-4 h-56 overflow-y-auto font-mono text-[11px] flex flex-col gap-1.5">
              {logs.length === 0 ? (
                <span className="text-cyan-800 animate-pulse">_等待遥测数据...</span>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex gap-3 text-cyan-100/70 hover:bg-cyan-900/20 px-2 py-1 rounded transition-colors">
                    <span className="text-cyan-600 shrink-0">
                      [{log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit', fractionalSecondDigits: 3 })}]
                    </span>
                    <span className="font-bold text-cyan-300 shrink-0">{log.agentName}</span>
                    <span className="text-cyan-100/90">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Agents */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-cyan-500 flex items-center gap-2">
              <Activity className="w-4 h-4" /> 实体遥测数据
            </h2>
            <span className="text-[10px] font-mono text-cyan-700 border border-cyan-800 px-2 py-0.5">实时</span>
          </div>
          <div className="flex flex-col gap-5">
            {agents.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
