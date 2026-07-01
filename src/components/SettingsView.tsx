import React, { useState } from 'react';
import { GameSettings } from '../types';
import { ShieldAlert, Award } from 'lucide-react';

interface SettingsViewProps {
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  activeAccount: string | null;
  cheatsUnlocked: boolean;
  onUnlockCheats: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  settings, 
  onUpdateSettings,
  activeAccount,
  cheatsUnlocked,
  onUnlockCheats
}) => {
  const [debugInput, setDebugInput] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    onUpdateSettings({
      ...settings,
      [name]: parseFloat(value)
    });
  };

  // Deterministic 6-digit numeric Player ID based on username
  const getPlayerId = (username: string): string => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idNum = Math.abs(hash % 900000) + 100000;
    return idNum.toString();
  };

  const playerId = activeAccount ? getPlayerId(activeAccount) : '-';

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold tracking-widest block mb-1">System Configuration</span>
          <h2 className="font-display font-black text-2xl text-white tracking-tight">Gameplay Settings</h2>
        </div>
      </div>

      {activeAccount && (
        <div className="bg-slate-900/80 border border-purple-500/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <ShieldAlert className="w-4.5 h-4.5 text-purple-400" />
            <h3 className="font-bold text-white text-sm uppercase tracking-wide">GM Profile Account Terminal (Debug Operations)</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 font-mono">
              <p className="text-slate-400">Signed In As: <span className="text-white font-bold">{activeAccount}</span></p>
              <p className="text-slate-400">Player ID: <span className="text-purple-400 font-bold tracking-widest text-sm bg-purple-950/40 border border-purple-900/30 px-2 py-0.5 rounded">{playerId}</span></p>
              <p className="text-[10px] text-slate-500 mt-1">Your unique 6-digit player code tracking all active stats, roster indexes, and historical records.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Secret Developer Access Prompt</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter secret authorization key..."
                  value={debugInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDebugInput(val);
                    if (val.trim().toUpperCase() === 'ADAMSILVER') {
                      onUnlockCheats();
                      setDebugInput('');
                    }
                  }}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-white outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">Provide official league commissioner clearance passcode (e.g. ADAMSILVER) to execute administrative sandbox commands.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-white text-sm">Season Length</h3>
          <p className="text-xs text-slate-400 leading-relaxed">Adjust the number of games per regular season. Shorter seasons are faster, while longer seasons offer more XP.</p>
          <select 
            name="gamesPerSeason" 
            value={settings.gamesPerSeason} 
            onChange={handleChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-emerald-500/50 transition-colors"
          >
            <option value="14">14 Games (Sprint)</option>
            <option value="28">28 Games (Short)</option>
            <option value="42">42 Games (Half)</option>
            <option value="82">82 Games (Full NBA)</option>
          </select>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-white text-sm">Progression Speed (XP)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">Multiplier for Player Card XP gained after every game simulation.</p>
          <select 
            name="xpMultiplier" 
            value={settings.xpMultiplier} 
            onChange={handleChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-emerald-500/50 transition-colors"
          >
            <option value="0.5">0.5x (Hardcore)</option>
            <option value="1.0">1.0x (Standard)</option>
            <option value="1.5">1.5x (Fast)</option>
            <option value="2.0">2.0x (Insane)</option>
            <option value="5.0">5.0x (Sandbox)</option>
          </select>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-white text-sm">Economy (Coins)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">Multiplier for Coins earned from game wins and streak bonuses.</p>
          <select 
            name="coinsMultiplier" 
            value={settings.coinsMultiplier} 
            onChange={handleChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-emerald-500/50 transition-colors"
          >
            <option value="0.5">0.5x (Hardcore)</option>
            <option value="1.0">1.0x (Standard)</option>
            <option value="2.0">2.0x (Generous)</option>
            <option value="5.0">5.0x (Sandbox)</option>
          </select>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-white text-sm">Simulation Difficulty</h3>
          <p className="text-xs text-slate-400 leading-relaxed">Modifies the strength of opposing AI teams in simulations.</p>
          <select 
            name="difficultyModifier" 
            value={settings.difficultyModifier} 
            onChange={handleChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-emerald-500/50 transition-colors"
          >
            <option value="-0.1">Easy (-10% Enemy OVR)</option>
            <option value="0">Normal (Default)</option>
            <option value="0.05">Hard (+5% Enemy OVR)</option>
            <option value="0.1">Legend (+10% Enemy OVR)</option>
          </select>
        </div>
      </div>
      
      <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-lg p-4">
        <p className="text-xs text-emerald-400/80 font-mono">
          Note: Changes apply immediately to new games and actions. Modifying season length takes effect on the next season (or immediately if fewer games are requested).
        </p>
      </div>
    </div>
  );
};
