/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlayerCard, PlayerTrait, GameState, Position } from '../types';
import { calculateOvr } from '../engine/simulation';
import { PlayerCardView } from './PlayerCardView';
import { Coins, Shield, Sparkles, Star, Zap, Flame, Award, ArrowUp, AlertCircle, CheckCircle, FlaskConical, Link2, DollarSign } from 'lucide-react';

interface UpgradeViewProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
}

type TabType = 'train' | 'lab' | 'combine' | 'sell';

export const UpgradeView: React.FC<UpgradeViewProps> = ({ state, setState }) => {
  const { coins, inventory, roster } = state;
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [combineTargetId, setCombineTargetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('train');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedCard = inventory.find(c => c.id === selectedCardId);
  const combineTargetCard = inventory.find(c => c.id === combineTargetId);

  // Cost definitions
  const STAT_UPGRADE_COST = 100;
  const EVOLUTION_COSTS = [0, 600, 1500]; // Tier 2 cost is 600, Tier 3 cost is 1500
  const POSITION_MOD_COST = 500;
  const COMBINE_COST = 1000;

  const handleUpgradeCard = (updatedCard: PlayerCard, cost: number) => {
    setState(prev => ({
      ...prev,
      coins: prev.coins - cost,
      inventory: prev.inventory.map(c => c.id === updatedCard.id ? updatedCard : c),
      roster: {
        ...prev.roster,
        starters: {
          PG: prev.roster.starters.PG?.id === updatedCard.id ? updatedCard : prev.roster.starters.PG,
          SG: prev.roster.starters.SG?.id === updatedCard.id ? updatedCard : prev.roster.starters.SG,
          SF: prev.roster.starters.SF?.id === updatedCard.id ? updatedCard : prev.roster.starters.SF,
          PF: prev.roster.starters.PF?.id === updatedCard.id ? updatedCard : prev.roster.starters.PF,
          C: prev.roster.starters.C?.id === updatedCard.id ? updatedCard : prev.roster.starters.C,
        },
        bench: prev.roster.bench.map(c => c.id === updatedCard.id ? updatedCard : c)
      }
    }));
  };

  // Apply stat boost to selected card
  const handleStatUpgrade = (statKey: keyof PlayerCard['stats']) => {
    if (!selectedCard) return;

    if (coins < STAT_UPGRADE_COST) {
      triggerError("Insufficient coins for stat training!");
      return;
    }

    if (selectedCard.stats[statKey] >= 99) {
      triggerError("This attribute has already reached the maximum 99 rating!");
      return;
    }

    // Clone the card and stats
    const updatedCard = { ...selectedCard };
    const updatedStats = { ...updatedCard.stats };

    // Increase rating (+1 to +3 random boost based on consistency)
    const boost = Math.random() > 0.6 ? 2 : 1;
    updatedStats[statKey] = Math.min(99, updatedStats[statKey] + boost);
    updatedCard.stats = updatedStats;

    // Recalculate OVR
    updatedCard.ovr = calculateOvr(updatedStats, updatedCard.primaryPosition, updatedCard.archetype);
    updatedCard.upgradePointsSpent += 1;

    handleUpgradeCard(updatedCard, STAT_UPGRADE_COST);
    triggerSuccess(`Successfully trained ${selectedCard.name}! ${String(statKey).toUpperCase()} boosted +${boost}!`);
  };

  // Evolve Card to next evolution tier
  const handleEvolution = () => {
    if (!selectedCard) return;

    const nextTier = selectedCard.evolutionTier + 1;
    if (nextTier > 3) {
      triggerError("This card has already reached maximum Evolution Tier 3!");
      return;
    }

    const cost = EVOLUTION_COSTS[nextTier - 1];
    if (coins < cost) {
      triggerError(`Insufficient coins for evolution! Need ${cost} coins.`);
      return;
    }

    const updatedCard = { ...selectedCard };
    updatedCard.evolutionTier = nextTier;

    // Apply massive all-around stat boost
    const statsBoost = nextTier === 2 ? 3 : 5;
    const updatedStats = { ...updatedCard.stats };
    Object.keys(updatedStats).forEach((key) => {
      const k = key as keyof PlayerCard['stats'];
      updatedStats[k] = Math.min(99, updatedStats[k] + statsBoost);
    });
    updatedCard.stats = updatedStats;

    // Unlock special archetype trait based on Tier level
    const availableTraits: PlayerTrait[] = [
      'Clutch Gene',
      'Defensive Anchor',
      'Sharpshooter',
      'Playmaking Genius',
      'Rim Protector',
      'Era Dominator'
    ];
    // Find a trait they don't already have
    const newTrait = availableTraits.find(t => !updatedCard.traits.includes(t)) || 'Clutch Gene';
    if (!updatedCard.traits.includes(newTrait)) {
      updatedCard.traits.push(newTrait);
    }

    // Recalculate OVR
    updatedCard.ovr = calculateOvr(updatedStats, updatedCard.primaryPosition, updatedCard.archetype);

    handleUpgradeCard(updatedCard, cost);
    triggerSuccess(`EVOLUTION COMPLETED! ${selectedCard.name} is now Tier ${nextTier} and unlocked the [${newTrait}] trait!`);
  };

  const handleAddSecondaryPosition = (pos: Position) => {
    if (!selectedCard) return;
    if (coins < POSITION_MOD_COST) {
      triggerError(`Need ${POSITION_MOD_COST} coins to modify position.`);
      return;
    }
    if (selectedCard.primaryPosition === pos) {
      triggerError("Already primary position.");
      return;
    }

    const updatedCard = { ...selectedCard, secondaryPosition: pos };
    handleUpgradeCard(updatedCard, POSITION_MOD_COST);
    triggerSuccess(`${selectedCard.name} can now play ${pos} effectively!`);
  };

  const handleCombine = () => {
    if (!selectedCard || !combineTargetCard) return;
    if (selectedCard.id === combineTargetCard.id) {
      triggerError("Cannot combine a card with itself.");
      return;
    }
    if (coins < COMBINE_COST) {
      triggerError(`Need ${COMBINE_COST} coins to combine.`);
      return;
    }

    // Logic: merge names, take maximum of each attribute and add a supercharged +5 Hybrid Synergy Boost!
    const mergedName = `${selectedCard.name.split(' ')[0]} ${combineTargetCard.name.split(' ').pop()}`;
    const newStats = { ...selectedCard.stats };
    Object.keys(newStats).forEach(key => {
      const k = key as keyof PlayerCard['stats'];
      // Take the max of both players, plus a massive +5 hybrid boost!
      newStats[k] = Math.min(99, Math.max(selectedCard.stats[k], combineTargetCard.stats[k]) + 5);
    });

    // Combine all unique traits from both players, up to 5!
    let combinedTraits = Array.from(new Set([...selectedCard.traits, ...combineTargetCard.traits]));
    // Add Hall of Fame or MVP Tier if resulting OVR is extremely high
    const estimatedOvr = calculateOvr(newStats, selectedCard.primaryPosition, 'All-Rounder');
    if (estimatedOvr >= 92 && !combinedTraits.includes('Hall of Fame')) {
      combinedTraits.unshift('Hall of Fame');
    } else if (estimatedOvr >= 85 && !combinedTraits.includes('MVP Tier')) {
      combinedTraits.unshift('MVP Tier');
    }
    const newTraits = combinedTraits.slice(0, 5);

    const newOvr = calculateOvr(newStats, selectedCard.primaryPosition, 'All-Rounder');

    const newCard: PlayerCard = {
      ...selectedCard,
      id: `hybrid-${Date.now()}`,
      name: mergedName,
      stats: newStats,
      traits: newTraits,
      ovr: newOvr,
      evolutionTier: Math.min(3, Math.max(selectedCard.evolutionTier, combineTargetCard.evolutionTier) + 1), // Increase evolution tier by 1 as bonus!
      archetype: 'All-Rounder', // Combined players become elite all-rounders
      secondaryPosition: combineTargetCard.primaryPosition
    };

    // Remove both old cards and add new one
    setState(prev => {
      const newInv = prev.inventory.filter(c => c.id !== selectedCard.id && c.id !== combineTargetCard.id);
      newInv.push(newCard);
      
      const newStarters = { ...prev.roster.starters };
      // Clear them from starters if they were there
      (Object.keys(newStarters) as Position[]).forEach(pos => {
        if (newStarters[pos]?.id === selectedCard.id || newStarters[pos]?.id === combineTargetCard.id) {
          newStarters[pos] = null;
        }
      });

      const newBench = prev.roster.bench.filter(c => c.id !== selectedCard.id && c.id !== combineTargetCard.id);
      
      // Try to place the new card somewhere
      let placed = false;
      if (!newStarters[newCard.primaryPosition]) {
        newStarters[newCard.primaryPosition] = newCard;
        placed = true;
      }
      if (!placed) {
        newBench.push(newCard);
      }

      return {
        ...prev,
        coins: prev.coins - COMBINE_COST,
        inventory: newInv,
        roster: {
          starters: newStarters,
          bench: newBench
        }
      };
    });

    setSelectedCardId(null);
    setCombineTargetId(null);
    triggerSuccess(`SUCCESS! Created hybrid monster: ${newCard.name} (OVR ${newCard.ovr})`);
  };

  const handleQuickSell = () => {
    if (!selectedCard) return;
    
    // Evaluate sell value based on OVR and Tier
    const baseValue = Math.max(10, (selectedCard.ovr - 60) * 5);
    const tierMultiplier = selectedCard.evolutionTier;
    const sellValue = Math.floor((baseValue * tierMultiplier) + (Math.random() * 50)); // Some RNG 10 to ~300

    // Prevent selling if it's the last 5 players (need 5 starters)
    if (inventory.length <= 5) {
      triggerError("Cannot sell! You must maintain a minimum of 5 players.");
      return;
    }

    setState(prev => {
      const newInv = prev.inventory.filter(c => c.id !== selectedCard.id);
      const newStarters = { ...prev.roster.starters };
      (Object.keys(newStarters) as Position[]).forEach(pos => {
        if (newStarters[pos]?.id === selectedCard.id) {
          newStarters[pos] = null;
        }
      });
      const newBench = prev.roster.bench.filter(c => c.id !== selectedCard.id);

      return {
        ...prev,
        coins: prev.coins + sellValue,
        inventory: newInv,
        roster: {
          starters: newStarters,
          bench: newBench
        }
      };
    });

    setSelectedCardId(null);
    triggerSuccess(`Sold ${selectedCard.name} to another team for ${sellValue} coins!`);
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3500);
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT COLUMN: Owned Cards inventory list */}
      <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col h-[650px]">
        <div className="pb-3 border-b border-slate-800 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="font-display font-bold text-white text-base">Select Card to Upgrade</h2>
          </div>
          <span className="text-xs bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded">
            Total: {inventory.length}
          </span>
        </div>

        {/* Scrollable list of cards */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 gap-3 pb-4">
          {inventory.map(card => {
            const isSelected = selectedCardId === card.id;
            return (
              <div
                key={card.id}
                onClick={() => {
                  setSelectedCardId(card.id);
                  setSuccessMsg(null);
                  setErrorMsg(null);
                }}
                className={`p-2.5 rounded-lg border cursor-pointer select-none transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-950/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-900/40'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] text-slate-500 font-bold">{card.era}</span>
                    <span className="bg-slate-900 text-slate-400 px-1 py-0.5 rounded text-[9px] font-bold font-mono">
                      {card.primaryPosition}
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-white text-xs mt-1 line-clamp-1">
                    {card.name}
                  </h4>
                  <div className="flex items-center gap-0.5 mt-0.5 text-[9px] text-yellow-400">
                    {Array.from({ length: card.evolutionTier }).map((_, i) => (
                      <Star key={i} className="w-2.5 h-2.5 fill-current" />
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-end mt-2.5 pt-1.5 border-t border-slate-900">
                  <span className="text-[10px] text-slate-500 truncate max-w-[80px]">{card.archetype}</span>
                  <span className="font-mono text-xs font-black text-slate-200">
                    OVR: <span className="text-emerald-400">{card.ovr}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Upgrade panels & controls */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {successMsg && (
          <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-900/50 text-emerald-300 p-3 rounded-lg text-xs font-mono">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 bg-red-950/50 border border-red-900/50 text-red-300 p-3 rounded-lg text-xs font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {selectedCard ? (
          <div className="flex flex-col gap-4 bg-slate-900/40 border border-slate-800 p-5 rounded-xl">
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <button onClick={() => setActiveTab('train')} className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${activeTab === 'train' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}><ArrowUp className="w-3.5 h-3.5 inline mr-1" />Train</button>
              <button onClick={() => setActiveTab('lab')} className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${activeTab === 'lab' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}><FlaskConical className="w-3.5 h-3.5 inline mr-1" />Lab</button>
              <button onClick={() => setActiveTab('combine')} className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${activeTab === 'combine' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}><Link2 className="w-3.5 h-3.5 inline mr-1" />Combine</button>
              <button onClick={() => setActiveTab('sell')} className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${activeTab === 'sell' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}><DollarSign className="w-3.5 h-3.5 inline mr-1" />Trade</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Visual card */}
              <div className="md:col-span-5 flex justify-center items-start">
                <PlayerCardView card={selectedCard} size="md" showStats={false} />
              </div>

              {/* Dynamic Content based on Tab */}
              <div className="md:col-span-7 space-y-5">
                {activeTab === 'train' && (
                  <>
                    <div>
                      <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold tracking-widest block">
                        Upgrade & Evolve Center
                      </span>
                      <h3 className="font-display font-black text-xl text-white tracking-tight mt-1">
                        Train {selectedCard.name}
                      </h3>
                    </div>

                    {/* STAT UPGRADE SECTIONS */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 font-bold uppercase tracking-wider">Stat Upgrades</span>
                        <div className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-sm">
                          <Coins className="w-3.5 h-3.5" />
                          <span>{STAT_UPGRADE_COST} Coins</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        {/* Scoring */}
                        <button
                          onClick={() => handleStatUpgrade('scoring')}
                          className="flex justify-between items-center p-2.5 bg-slate-950 border border-slate-800 rounded hover:border-red-500/50 transition-colors group"
                        >
                          <span className="text-slate-400 group-hover:text-red-400 transition-colors">Scoring</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{selectedCard.stats.scoring}</span>
                            <ArrowUp className="w-3.5 h-3.5 text-red-400" />
                          </div>
                        </button>

                        {/* Playmaking */}
                        <button
                          onClick={() => handleStatUpgrade('playmaking')}
                          className="flex justify-between items-center p-2.5 bg-slate-950 border border-slate-800 rounded hover:border-sky-500/50 transition-colors group"
                        >
                          <span className="text-slate-400 group-hover:text-sky-400 transition-colors">Playmaking</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{selectedCard.stats.playmaking}</span>
                            <ArrowUp className="w-3.5 h-3.5 text-sky-400" />
                          </div>
                        </button>

                        {/* Rebounding */}
                        <button
                          onClick={() => handleStatUpgrade('rebounding')}
                          className="flex justify-between items-center p-2.5 bg-slate-950 border border-slate-800 rounded hover:border-emerald-500/50 transition-colors group"
                        >
                          <span className="text-slate-400 group-hover:text-emerald-400 transition-colors">Rebounding</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{selectedCard.stats.rebounding}</span>
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                        </button>

                        {/* Defense */}
                        <button
                          onClick={() => handleStatUpgrade('defense')}
                          className="flex justify-between items-center p-2.5 bg-slate-950 border border-slate-800 rounded hover:border-amber-500/50 transition-colors group"
                        >
                          <span className="text-slate-400 group-hover:text-amber-400 transition-colors">Defense</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{selectedCard.stats.defense}</span>
                            <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* EVOLUTION SECTION */}
                    <div className="border-t border-slate-800/80 pt-4 space-y-3.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 font-bold uppercase tracking-wider">Evolution Tiers</span>
                        {selectedCard.evolutionTier < 3 ? (
                          <div className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-sm">
                            <Coins className="w-3.5 h-3.5" />
                            <span>{EVOLUTION_COSTS[selectedCard.evolutionTier]} Coins</span>
                          </div>
                        ) : null}
                      </div>

                      {selectedCard.evolutionTier < 3 ? (
                        <div className="bg-slate-950 border border-slate-850 p-4 rounded-lg flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="font-display font-bold text-white text-sm">
                                Tier {selectedCard.evolutionTier} → Tier {selectedCard.evolutionTier + 1}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                              Evolution grants <b className="text-emerald-400">+{selectedCard.evolutionTier === 1 ? '3' : '5'}</b> to ALL ratings, improves physical stats, and unlocks an elite signature player trait.
                            </p>
                          </div>

                          <button
                            onClick={handleEvolution}
                            className="w-full bg-yellow-500 text-slate-950 font-bold py-2 rounded text-xs transition-all hover:bg-yellow-400 flex items-center justify-center gap-1.5 active:scale-97"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Evolve Card (Spend {EVOLUTION_COSTS[selectedCard.evolutionTier]} Coins)</span>
                          </button>
                        </div>
                      ) : (
                        <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-lg flex items-center gap-3 text-emerald-300 text-xs font-medium">
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                          <div>
                            <p className="font-bold">MAXIMUM EVOLUTION TIER REACHED</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">This card is at maximum evolution potency (Tier 3)! Standard stat training is still available.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {activeTab === 'lab' && (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] text-sky-400 font-mono uppercase font-bold tracking-widest block">
                        Position Modification Lab
                      </span>
                      <h3 className="font-display font-black text-xl text-white tracking-tight mt-1">
                        Modify {selectedCard.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Add a secondary position to this player for {POSITION_MOD_COST} coins.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {(['PG', 'SG', 'SF', 'PF', 'C'] as Position[]).map(pos => (
                        <button
                          key={pos}
                          onClick={() => handleAddSecondaryPosition(pos)}
                          disabled={selectedCard.primaryPosition === pos || selectedCard.secondaryPosition === pos}
                          className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                            selectedCard.primaryPosition === pos
                              ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-500 cursor-not-allowed opacity-50'
                              : selectedCard.secondaryPosition === pos
                              ? 'bg-sky-950/20 border-sky-900/50 text-sky-500 cursor-not-allowed opacity-50'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-sky-500/50 hover:text-sky-400'
                          }`}
                        >
                          <span className="font-black text-lg">{pos}</span>
                          {selectedCard.primaryPosition === pos ? <span>Primary</span> : selectedCard.secondaryPosition === pos ? <span>Secondary</span> : <span>Assign</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'combine' && (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] text-purple-400 font-mono uppercase font-bold tracking-widest block">
                        Hybrid Player Combiner
                      </span>
                      <h3 className="font-display font-black text-xl text-white tracking-tight mt-1">
                        Merge DNA
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Sacrifice two players to create an elite Hybrid All-Rounder! Takes the <b>maximum of each attribute</b> from both players and adds a permanent <b className="text-purple-400 font-mono">+5 Hybrid Synergy Boost</b>. Inherits all unique traits from both players (up to 5 total) and boosts evolution tier by +1!</p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-2">
                        <span className="text-slate-400">Target 2:</span>
                        <select
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 outline-none"
                          value={combineTargetId || ''}
                          onChange={e => setCombineTargetId(e.target.value)}
                        >
                          <option value="" disabled>Select a card...</option>
                          {inventory.filter(c => c.id !== selectedCard.id).map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.ovr} OVR)</option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={handleCombine}
                        disabled={!combineTargetId}
                        className={`w-full py-2.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 ${
                          !combineTargetId
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-purple-500 text-slate-950 hover:bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        }`}
                      >
                        <Link2 className="w-4 h-4" />
                        Combine for {COMBINE_COST} Coins
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'sell' && (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] text-amber-400 font-mono uppercase font-bold tracking-widest block">
                        Trade / Quick Sell
                      </span>
                      <h3 className="font-display font-black text-xl text-white tracking-tight mt-1">
                        Trade {selectedCard.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Trade this player to another team for coins. Values are evaluated based on OVR and Evolution Tier (Approx. 10 - 300+ coins).</p>
                    </div>

                    <div className="bg-amber-950/10 border border-amber-900/30 p-4 rounded-lg">
                      <button
                        onClick={handleQuickSell}
                        className="w-full bg-amber-500 text-slate-950 font-bold font-mono py-3 rounded-lg hover:bg-amber-400 transition-all flex items-center justify-center gap-2 active:scale-97 shadow-lg shadow-amber-500/20"
                      >
                        <DollarSign className="w-5 h-5" />
                        Offer Trade to AI Teams
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center mb-4 border border-slate-800">
              <Sparkles className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="font-display font-bold text-white text-base">No Card Selected</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Choose a player from your franchise inventory list on the left to start their physical training or evolve their tiers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
