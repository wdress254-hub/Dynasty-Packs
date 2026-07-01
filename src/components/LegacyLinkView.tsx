import React, { useState, useEffect } from 'react';
import { GameState, PlayerCard } from '../types';
import { PlayerCardView } from './PlayerCardView';
import { Send, CheckCircle2, Sparkles, AlertTriangle, ArrowUpRight, Award, Trophy } from 'lucide-react';

interface LegacyLinkViewProps {
  state: GameState;
}

export const LegacyLinkView: React.FC<LegacyLinkViewProps> = ({ state }) => {
  const [linkedIds, setLinkedIds] = useState<string[]>([]);
  const [copiedSuccess, setCopiedSuccess] = useState<string | null>(null);

  // Sync currently linked cards from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nba_legacy_linked_cards');
    if (saved) {
      const cards: PlayerCard[] = JSON.parse(saved);
      setLinkedIds(cards.map(c => c.id));
    }
  }, []);

  const handleLinkCard = (card: PlayerCard) => {
    const saved = localStorage.getItem('nba_legacy_linked_cards');
    const existing: PlayerCard[] = saved ? JSON.parse(saved) : [];

    if (existing.some(c => c.id === card.id)) {
      setCopiedSuccess(`⚠️ Player "${card.name}" is already linked in the Legacy Vault!`);
      setTimeout(() => setCopiedSuccess(null), 3000);
      return;
    }

    // Copy card and add a legacy flag or timestamp
    const legacyCardCopy: PlayerCard = {
      ...card,
      isLegacy: true,
      id: `${card.id}-legacy-${Date.now()}` // Unique instance for the legacy vault
    };

    const updated = [...existing, legacyCardCopy];
    localStorage.setItem('nba_legacy_linked_cards', JSON.stringify(updated));
    setLinkedIds(prev => [...prev, card.id]);

    setCopiedSuccess(`🌟 SUCCESS: Transmitted "${card.name}" (OVR ${card.ovr}) to the Retro Legacy Arena!`);
    setTimeout(() => setCopiedSuccess(null), 3500);
  };

  // Get all unique cards from player inventory & starters & bench
  const allPlayerCards = (() => {
    const list: PlayerCard[] = [];
    
    // Add starters
    Object.values(state.roster.starters).forEach(item => {
      const c = item as PlayerCard | null;
      if (c && !list.some(x => x.id === c.id)) list.push(c);
    });

    // Add bench
    state.roster.bench.forEach(c => {
      if (c && !list.some(x => x.id === c.id)) list.push(c);
    });

    // Add inventory
    state.inventory.forEach(c => {
      if (c && !list.some(x => x.id === c.id)) list.push(c);
    });

    return list;
  })();

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex items-end justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] text-sky-400 font-mono uppercase font-bold tracking-widest block mb-1">
            Quantum Multi-Era Bridge
          </span>
          <h2 className="font-display font-black text-2xl text-white tracking-tight uppercase">
            Legacy Link Transmitters
          </h2>
        </div>
      </div>

      {/* DETAILED MOTIVATING EXPLANATION CARD */}
      <div className="bg-gradient-to-r from-sky-950/40 to-indigo-950/30 border border-sky-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-sky-400 animate-pulse" />
              <span className="font-mono text-xs text-sky-400 font-bold uppercase tracking-wider">CROSS-GAME PLATFORM PIPELINE</span>
            </div>
            <h3 className="text-base font-black text-white uppercase tracking-tight">Export Your Superstars to Retro Legacy Mode</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Build your absolute Dream Team across campaign seasons. In <b>Legacy Mode</b> (launched from the Arcade Launcher home screen), you can bypass standard roster limits, collect historic championship rings, and pit your all-time greatest players against historic NBA rosters in classic exhibition matches!
            </p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-sky-900/40 text-[10.5px] font-mono space-y-1.5 self-stretch shrink-0 md:w-64">
            <span className="text-sky-400 font-bold block uppercase border-b border-slate-800 pb-1">INSTRUCTIONS</span>
            <p className="text-slate-400">1. Click "Transmit to Legacy" below</p>
            <p className="text-slate-400">2. Exit simulation back to Hub</p>
            <p className="text-slate-400">3. Boot up the "Legacy Mode" engine</p>
            <p className="text-slate-400">4. Formulate your ultimate lineup!</p>
          </div>
        </div>
      </div>

      {copiedSuccess && (
        <div className="bg-emerald-950/60 border border-emerald-900/50 rounded-xl p-4 text-emerald-400 text-xs flex items-center gap-2 font-bold font-mono animate-bounce shadow-lg shadow-emerald-500/5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{copiedSuccess}</span>
        </div>
      )}

      {/* INVENTORY VIEWER GRID */}
      <div className="space-y-4">
        <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest block">Available Campaign Players ({allPlayerCards.length})</h4>

        {allPlayerCards.length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-10 text-center text-xs text-slate-500 italic">
            You do not own any player cards yet. Open some packs in the Packs Store to collect cards first!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {allPlayerCards.map(card => {
              const alreadyLinked = linkedIds.includes(card.id);

              return (
                <div key={card.id} className="bg-slate-900 border border-slate-850 rounded-2xl p-4 hover:border-sky-500/20 transition-all flex flex-col justify-between items-center relative overflow-hidden group shadow-sm">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 group-hover:from-sky-500 group-hover:to-indigo-500 transition-all" />
                  
                  {alreadyLinked && (
                    <div className="absolute top-2.5 right-2.5 bg-sky-950 border border-sky-900 text-sky-400 font-mono text-[8px] font-black uppercase px-2 py-0.5 rounded-full z-10">
                      LINKED
                    </div>
                  )}

                  <div className="w-full flex justify-center py-4">
                    <PlayerCardView card={card} size="sm" showStats={false} />
                  </div>

                  <div className="w-full pt-3 border-t border-slate-850 space-y-3 text-center">
                    <div>
                      <span className="font-bold text-white text-xs block leading-tight">{card.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5 uppercase">OVR {card.ovr} • {card.primaryPosition}</span>
                    </div>

                    <button
                      onClick={() => handleLinkCard(card)}
                      className={`w-full font-mono text-[10px] font-black py-2 rounded-lg uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        alreadyLinked
                          ? 'bg-sky-950/30 border border-sky-900/40 text-sky-400 hover:bg-sky-950/60'
                          : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                      }`}
                    >
                      <Send className="w-3 h-3" />
                      <span>{alreadyLinked ? 'Link Again' : 'Transmit to Legacy'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
