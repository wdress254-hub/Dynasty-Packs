/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Gamepad2, Play, Plus, Trash2, Trophy, Sparkles, Cpu, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { GameState } from '../types';

interface CustomGame {
  name: string;
  description: string;
  genre: string;
  color: string;
}

interface ArcadeLauncherProps {
  state: GameState;
  onLaunchPrimary: () => void;
  onLaunchLegacy: () => void;
  customGames: CustomGame[];
  onAddGame: (game: CustomGame) => void;
  onRemoveGame: (index: number) => void;
}

export const ArcadeLauncher: React.FC<ArcadeLauncherProps> = ({
  state,
  onLaunchPrimary,
  onLaunchLegacy,
  customGames,
  onAddGame,
  onRemoveGame
}) => {
  const [addGameModalOpen, setAddGameModalOpen] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameDesc, setNewGameDesc] = useState('');
  const [newGameGenre, setNewGameGenre] = useState('Sports');
  const [newGameColor, setNewGameColor] = useState('emerald');

  // Sandbox emulator state
  const [activeSandbox, setActiveSandbox] = useState<CustomGame | null>(null);
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([]);
  const [sandboxScores, setSandboxScores] = useState<{ teamA: number; teamB: number } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleCreateGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName.trim()) return;
    
    onAddGame({
      name: newGameName.trim(),
      description: newGameDesc.trim() || 'Custom retro simulation game.',
      genre: newGameGenre,
      color: newGameColor
    });

    setNewGameName('');
    setNewGameDesc('');
    setNewGameGenre('Sports');
    setNewGameColor('emerald');
    setAddGameModalOpen(false);
  };

  const startSandboxSim = (game: CustomGame) => {
    setActiveSandbox(game);
    setSandboxScores(null);
    setSandboxLogs([
      `🎮 Loaded: ${game.name.toUpperCase()}`,
      `⚙️ System architecture: Standard 16-Bit Engine`,
      `⚙️ Generating conference rosters and randomized difficulty values...`,
      `🟢 Standby! Roster initialized and ready for simulation.`
    ]);
  };

  const runSandboxMatch = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSandboxLogs(prev => [...prev, `⏳ Commencing active CPU simulation...`]);

    setTimeout(() => {
      const scoreA = Math.floor(Math.random() * 45) + 80;
      const scoreB = Math.floor(Math.random() * 45) + 80;
      setSandboxScores({ teamA: scoreA, teamB: scoreB });
      setSandboxLogs(prev => [
        ...prev,
        `🏀 Q1: Early run sets pace...`,
        `🏀 Q3: Fast breaks fuel offense...`,
        `🏁 FINAL WHISTLE: Team Red [${scoreA}] vs Team Blue [${scoreB}]!`,
        `🏆 ${scoreA > scoreB ? 'Team Red' : 'Team Blue'} secures the victory.`
      ]);
      setIsSimulating(false);
    }, 1200);
  };

  const colorClasses: Record<string, { border: string; glow: string; text: string; bg: string }> = {
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-400',
      glow: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      bg: 'bg-emerald-500'
    },
    blue: {
      border: 'border-blue-500/20 hover:border-blue-400',
      glow: 'bg-blue-500/10',
      text: 'text-blue-400',
      bg: 'bg-blue-500'
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-400',
      glow: 'bg-purple-500/10',
      text: 'text-purple-400',
      bg: 'bg-purple-500'
    },
    red: {
      border: 'border-red-500/20 hover:border-red-400',
      glow: 'bg-red-500/10',
      text: 'text-red-400',
      bg: 'bg-red-500'
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-400',
      glow: 'bg-amber-500/10',
      text: 'text-amber-400',
      bg: 'bg-amber-500'
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col relative overflow-hidden">
      {/* Background radial overlays */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* HUB HEADER */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Gamepad2 className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="font-display font-black text-white text-base tracking-tight leading-none uppercase">
              All-in-One Sports Arcade Launcher
            </h1>
            <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block mt-1">
              Dynasty Engine v3.4 • Unified Console
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-lg text-[10px] font-mono">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-500">Core Engine:</span> <b className="text-emerald-400">Stable</b>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-lg text-[10px] font-mono">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-emerald-400 font-bold uppercase">Online Lobby</span>
          </div>
        </div>
      </header>

      {/* MAIN LAUNCHER GRID */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-8 relative z-10 overflow-y-auto">
        {/* Pitch Hero Panel */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-1.5">
            <h2 className="text-lg font-black text-white uppercase tracking-wide">Select or Expand Your Dynasty</h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Welcome to the central retro simulation platform. Install, configure, and launch individual sports dynasty simulations below, or add completely custom game templates to your personalized local hub.
            </p>
          </div>

          <button
            onClick={() => setAddGameModalOpen(true)}
            className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs font-black px-5 py-3 rounded-xl uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-emerald-500/10 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4 text-slate-950 font-bold" />
            <span>Add Custom Game</span>
          </button>
        </div>

        {/* GAMES SECTION */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-black text-slate-500 uppercase tracking-widest block">Installed Sim Engines</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary NBA Game Card */}
            <div className="bg-slate-900 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-6 transition-all shadow-md flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-400" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-900/40">
                    Basketball Sim • Primary
                  </span>
                  <span className="text-xs text-slate-500 font-mono font-semibold">
                    Wins: {state.standings.find(t => t.isPlayer)?.wins || 0}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-lg font-display font-black text-white group-hover:text-emerald-400 transition-colors uppercase">
                    NBA Dynasty Packs Manager
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Open legendary card packs, manage roster minutes, complete season schedules, and earn Championship rings! Includes crossplay 1v1 lobbies, real-time match logs, and dynamic draft picks.
                  </p>
                </div>

                <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 border-t border-slate-850 pt-3">
                  <span>Year: <b className="text-slate-300">{state.year}</b></span>
                  <span>Coins: <b className="text-yellow-500">{state.coins.toLocaleString()}</b></span>
                  <span>Championships: <b className="text-yellow-400">{state.championshipsWon}</b></span>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={onLaunchPrimary}
                  className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-black py-3.5 rounded-xl transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 active:scale-97 cursor-pointer"
                >
                  <Play className="w-4 h-4 text-slate-950 fill-slate-950" />
                  <span>Launch Primary Simulation</span>
                </button>
              </div>
            </div>

            {/* Legacy NBA Game Card */}
            <div className="bg-slate-900 border border-sky-500/20 hover:border-sky-500/40 rounded-2xl p-6 transition-all shadow-md flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-sky-500 to-indigo-500" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-sky-950 text-sky-400 border border-sky-900/40">
                    Basketball Sim • Legacy Era
                  </span>
                  <span className="text-xs text-slate-500 font-mono font-semibold">
                    Retro Sandbox
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-lg font-display font-black text-white group-hover:text-sky-400 transition-colors uppercase">
                    NBA Dynasty: Legacy Mode
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Build your all-time greatest squad! Link players from active campaign seasons over to this standalone historic mode. Experience retro rules, simulation matchups, and custom modifiers.
                  </p>
                </div>

                <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 border-t border-slate-850 pt-3">
                  <span>Linked Cards: <b className="text-sky-400 font-bold">{(() => {
                    const saved = localStorage.getItem('nba_legacy_linked_cards');
                    return saved ? JSON.parse(saved).length : 0;
                  })()}</b></span>
                  <span>Ruleset: <b className="text-indigo-400 font-semibold">Retro Classic</b></span>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={onLaunchLegacy}
                  className="w-full bg-sky-500 text-slate-950 hover:bg-sky-400 font-black py-3.5 rounded-xl transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 active:scale-97 cursor-pointer"
                >
                  <Play className="w-4 h-4 text-slate-950 fill-slate-950" />
                  <span>Launch Legacy Sandbox</span>
                </button>
              </div>
            </div>

            {/* Render Custom Added Games */}
            {customGames.map((game, index) => {
              const activeTheme = colorClasses[game.color] || colorClasses.blue;

              return (
                <div key={index} className={`bg-slate-900 border ${activeTheme.border} rounded-2xl p-6 transition-all shadow-md flex flex-col justify-between relative overflow-hidden group`}>
                  <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${activeTheme.bg}`} />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider ${activeTheme.glow} ${activeTheme.text} border border-white/5`}>
                        {game.genre} Sim
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono font-bold uppercase bg-slate-950 px-2 py-0.5 rounded">Custom Added</span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-lg font-display font-black text-white group-hover:text-sky-400 transition-colors uppercase">
                        {game.name}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {game.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 flex gap-2">
                    <button
                      onClick={() => startSandboxSim(game)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black py-3 rounded-xl transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 active:scale-97 cursor-pointer border border-slate-700"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Sim Sandbox</span>
                    </button>
                    <button
                      onClick={() => onRemoveGame(index)}
                      className="px-4 bg-slate-950 hover:bg-red-950/30 text-slate-500 hover:text-red-400 rounded-xl transition-all border border-slate-850 hover:border-red-900/20 active:scale-97 cursor-pointer"
                      title="Remove game record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Custom Games Placeholder */}
            {customGames.length === 0 && (
              <div className="border border-dashed border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3 bg-slate-900/20">
                <div className="w-10 h-10 rounded-full bg-slate-850 flex items-center justify-center text-slate-500 font-bold">
                  🕹️
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wide">Roster is customizable</span>
                  <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed">
                    Add custom football engines, baseball simulators, or fantasy leagues using the form to build a personal multi-sport launcher hub.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ADD CUSTOM GAME MODAL */}
      {addGameModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <h3 className="font-display font-black text-lg text-white uppercase tracking-tight">Add New Retro Sim Game</h3>
            <p className="text-xs text-slate-400">Configure parameters to generate a custom-themed arcade launcher card.</p>
            
            <form onSubmit={handleCreateGame} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500 block">Game Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Football Retro Bowl"
                  value={newGameName}
                  onChange={e => setNewGameName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block">Genre</label>
                  <select
                    value={newGameGenre}
                    onChange={e => setNewGameGenre(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none"
                  >
                    <option value="Sports">Sports Sim</option>
                    <option value="Arcade">Retro Arcade</option>
                    <option value="Strategy">Strategy Manager</option>
                    <option value="RPG">Action RPG</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block">Theme Color</label>
                  <select
                    value={newGameColor}
                    onChange={e => setNewGameColor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none"
                  >
                    <option value="emerald">Emerald Green</option>
                    <option value="blue">Electric Blue</option>
                    <option value="purple">Royal Purple</option>
                    <option value="red">Crimson Red</option>
                    <option value="amber">Warm Amber</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500 block">Description</label>
                <textarea
                  placeholder="Summarize features, game modes, and CPU engine specifications..."
                  value={newGameDesc}
                  onChange={e => setNewGameDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono h-20 resize-none focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddGameModalOpen(false)}
                  className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-400 py-3 rounded-xl uppercase tracking-wider font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 text-slate-950 hover:bg-emerald-400 py-3 rounded-xl uppercase tracking-wider font-black shadow-lg shadow-emerald-500/10"
                >
                  Install Game
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SANDBOX EMULATOR MODAL */}
      {activeSandbox && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h3 className="font-display font-black text-white uppercase tracking-tight text-sm">
                  {activeSandbox.name} • Sandbox Console
                </h3>
              </div>
              <button
                onClick={() => setActiveSandbox(null)}
                className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-1 rounded-full text-xs"
              >
                ✕
              </button>
            </div>

            {/* Sandbox Scoreboard */}
            {sandboxScores && (
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-around text-center font-mono">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block font-bold">Team Red</span>
                  <span className="text-2xl font-black text-red-400">{sandboxScores.teamA}</span>
                </div>
                <div className="bg-slate-900 px-3 py-1 rounded text-[9px] text-slate-400 font-bold uppercase">FINAL</div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block font-bold">Team Blue</span>
                  <span className="text-2xl font-black text-blue-400">{sandboxScores.teamB}</span>
                </div>
              </div>
            )}

            {/* Log Output Terminal */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl h-48 overflow-y-auto font-mono text-xs text-slate-300 space-y-1.5 select-text">
              {sandboxLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-slate-600 font-bold">{idx + 1}.</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setActiveSandbox(null)}
                className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-400 py-3 rounded-xl uppercase tracking-wider font-bold text-xs"
              >
                Exit Simulator
              </button>
              <button
                onClick={runSandboxMatch}
                disabled={isSimulating}
                className="flex-1 bg-emerald-500 text-slate-950 hover:bg-emerald-400 py-3 rounded-xl uppercase tracking-wider font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 disabled:opacity-50"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Quarters...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                    <span>Run CPU Matchup</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
