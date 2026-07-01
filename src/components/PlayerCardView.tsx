/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlayerCard, Position } from '../types';
import { getRarityColor, getRarityTextGlow } from '../data/players';
import { Shield, Sparkles, Star, Zap, Award, Flame, AlertCircle } from 'lucide-react';

const getInitials = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

interface PlayerCardViewProps {
  card: PlayerCard;
  slotPos?: Position; // If in a roster slot, check position compliance
  onClick?: () => void;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStats?: boolean;
}

export const PlayerCardView: React.FC<PlayerCardViewProps> = ({
  card,
  slotPos,
  onClick,
  selected = false,
  size = 'md',
  showStats = true
}) => {
  const isOutOfPosition = slotPos && card.primaryPosition !== slotPos && card.secondaryPosition !== slotPos;
  const isPrimaryMatch = slotPos && card.primaryPosition === slotPos;

  const [activeTraitDesc, setActiveTraitDesc] = useState<string | null>(null);

  const TRAIT_DESCRIPTIONS: Record<string, string> = {
    'Hall of Fame': 'Hall of Fame: Elevates clutch performance (+15%) and massively boosts team chemistry.',
    'MVP Tier': 'MVP Tier: Permanent +10% boost to scoring and playmaking in high-stakes situations.',
    'Defensive Anchor': 'Defensive Anchor: Controls the floor to raise the entire team\'s defense by +8%.',
    'Sharpshooter': 'Sharpshooter: Maximizes 3PT and mid-range shooting frequency and efficiency.',
    'Playmaking Genius': 'Playmaking Genius: Elevates passing flow, making surrounding players perform +5% better.',
    'Rim Protector': 'Rim Protector: Shuts down the paint and reduces opponent inside scoring by +12%.',
    'Era Dominator': 'Era Dominator: Dominant presence that boosts stats by +10% against classic era rivals.',
    'Clutch Gene': 'Clutch Gene: Massive +25% rating boost during the final minutes of close games.'
  };

  // Render trait icon
  const renderTraitIcon = (trait: string) => {
    switch (trait) {
      case 'Clutch Gene':
        return <Zap className="w-3.5 h-3.5 text-orange-400" />;
      case 'Sharpshooter':
        return <Flame className="w-3.5 h-3.5 text-red-400" />;
      case 'Defensive Anchor':
      case 'Rim Protector':
        return <Shield className="w-3.5 h-3.5 text-emerald-400" />;
      case 'MVP Tier':
      case 'Hall of Fame':
        return <Award className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  // Dimensions based on size
  const dimensionClasses = {
    sm: 'w-48 h-72 text-xs',
    md: 'w-60 h-90 text-sm',
    lg: 'w-68 h-100 text-sm',
    xl: 'w-76 h-112 text-base'
  };

  const borderColors = {
    Legendary: 'border-amber-400 bg-zinc-950 shadow-[0_4px_12px_rgba(234,179,8,0.12)]',
    Epic: 'border-purple-500 bg-zinc-950 shadow-[0_4px_12px_rgba(168,85,247,0.12)]',
    Rare: 'border-blue-500 bg-zinc-950 shadow-[0_4px_12px_rgba(59,130,246,0.1)]',
    Common: 'border-slate-700 bg-zinc-950 shadow-md'
  };

  const textRarityClass = getRarityTextGlow(card.rarity);

  return (
    <div
      onClick={onClick}
      id={`card-${card.id}`}
      className={`relative rounded-xl border-2 overflow-hidden flex flex-col transition-all duration-300 select-none cursor-pointer ${
        dimensionClasses[size]
      } ${borderColors[card.rarity]} ${
        selected ? 'ring-4 ring-emerald-500 scale-102 z-10' : 'hover:-translate-y-1.5'
      }`}
    >
      {/* Rarity & Position Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-950 border-b border-slate-800/80 font-display">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-bold tracking-wider ${textRarityClass}`}>
            {card.rarity.toUpperCase()}
          </span>
          <span className="text-[10px] text-slate-400">•</span>
          <span className="text-slate-300 font-mono text-[11px]">
            {card.era}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Position Tag */}
          <span className="bg-slate-800 text-white font-mono px-2 py-0.5 rounded-sm text-xs font-bold">
            {card.primaryPosition}
          </span>
          {card.secondaryPosition && (
            <span className="bg-slate-900 text-slate-400 font-mono px-1.5 py-0.5 rounded-sm text-[10px]">
              {card.secondaryPosition}
            </span>
          )}
        </div>
      </div>

      {/* Main card body */}
      <div className="flex-1 flex flex-col justify-between p-3.5 bg-zinc-900/45">
        {/* Overall Rating & Name */}
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`font-display font-bold text-white tracking-tight line-clamp-2 ${card.name.length > 15 ? 'text-xs md:text-sm' : 'text-sm md:text-base'}`}>
                {card.name}
              </h3>
              <p className="text-[10px] text-slate-400 italic line-clamp-1">
                {card.teamHistory}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <span className={`font-mono font-black text-2xl md:text-3xl leading-none ${textRarityClass}`}>
                {card.ovr}
              </span>
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">OVR</span>
            </div>
          </div>

          {/* Evolution Tier Stars */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Star
                  key={idx}
                  className={`w-3.5 h-3.5 ${
                    idx < card.evolutionTier ? 'fill-yellow-400 text-yellow-400' : 'text-slate-700'
                  }`}
                />
              ))}
            </div>
            <span className="font-mono text-[9px] text-slate-500 font-bold uppercase tracking-wider">
              {card.primaryPosition}
            </span>
          </div>

          {/* RPG Level & XP Bar */}
          <div className="mt-2 pt-2 border-t border-slate-800/40 font-mono text-[9.5px]">
            <div className="flex items-center justify-between text-slate-400 font-bold">
              <span className="text-emerald-400">LV {card.level || 1}</span>
              <span className="text-[8.5px] text-slate-500">{(card.xp || 0)} / {(card.xpToNextLevel || 100)} XP</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1 mt-1 border border-slate-800/60 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, ((card.xp || 0) / (card.xpToNextLevel || 100)) * 100))}%` }}
              />
            </div>
          </div>

          {/* Player Emblem Monogram (Sleek minimalist, no random stock photos) */}
          <div className={`relative w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-850 my-2 flex items-center justify-center shrink-0 group ${
            size === 'sm' ? 'h-16' : size === 'md' ? 'h-20' : size === 'lg' ? 'h-24' : 'h-28'
          }`}>
            {/* Radial glow background based on card rarity */}
            <div className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity animate-pulse" style={{
              background: `radial-gradient(circle, ${getRarityColor(card.rarity)} 0%, transparent 70%)`
            }} />
            
            {/* Giant elegant initials */}
            <span className="font-display font-black text-slate-800 select-none tracking-tighter opacity-50 group-hover:opacity-75 transition-opacity" style={{
              fontSize: size === 'sm' ? '2rem' : size === 'md' ? '2.5rem' : size === 'lg' ? '3rem' : '3.5rem'
            }}>
              {getInitials(card.name)}
            </span>

            {/* Subtly display the archetype label overlay */}
            <span className="absolute bottom-1.5 right-1.5 bg-slate-900/90 text-[8px] font-mono text-slate-400 px-1 py-0.5 rounded border border-slate-800/50 uppercase scale-90 origin-bottom-right">
              {card.archetype}
            </span>
          </div>

          {/* Traits Badges */}
          {card.traits.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {card.traits.slice(0, size === 'sm' ? 1 : 2).map((trait, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    const desc = TRAIT_DESCRIPTIONS[trait] || `${trait}: Premium performance-enhancing player attribute.`;
                    setActiveTraitDesc(activeTraitDesc === desc ? null : desc);
                  }}
                  className="flex items-center gap-1 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-yellow-500/60 px-1.5 py-0.5 rounded text-[10px] text-slate-300 transition-all cursor-pointer"
                  title="Click to view trait details"
                >
                  {renderTraitIcon(trait)}
                  <span className="font-medium">{trait}</span>
                </button>
              ))}
              {card.traits.length > (size === 'sm' ? 1 : 2) && (
                <span className="text-[10px] text-slate-500 self-center">
                  +{card.traits.length - (size === 'sm' ? 1 : 2)}
                </span>
              )}
            </div>
          )}

          {activeTraitDesc && (
            <div className="my-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/30 text-[10.5px] text-yellow-300 font-mono leading-relaxed relative flex items-start justify-between gap-1.5 shadow-sm">
              <span>{activeTraitDesc}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTraitDesc(null);
                }}
                className="text-slate-500 hover:text-slate-300 font-bold cursor-pointer px-1 -mt-0.5 text-xs select-none"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Out of position Warning */}
        {isOutOfPosition && (
          <div className="my-2 flex items-center gap-1.5 bg-red-950/40 border border-red-900/50 p-1.5 rounded text-[11px] text-red-300 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Position Penalty (-20% OVR)</span>
          </div>
        )}

        {isPrimaryMatch && (
          <div className="my-2 flex items-center gap-1.5 bg-emerald-950/30 border border-emerald-900/50 p-1.5 rounded text-[11px] text-emerald-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span>Primary Slot Boost (+5%)</span>
          </div>
        )}

        {/* Stats Panel */}
        {showStats && size !== 'sm' && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-3 border-t border-slate-850 text-xs font-mono text-slate-300">
            <div className="flex justify-between items-center bg-slate-900/40 px-1.5 py-0.5 rounded border border-slate-800/40">
              <span className="text-slate-400 text-[10px]">SCOR:</span>
              <span className="font-bold text-red-300">{card.stats.scoring}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/40 px-1.5 py-0.5 rounded border border-slate-800/40">
              <span className="text-slate-400 text-[10px]">PLAY:</span>
              <span className="font-bold text-sky-300">{card.stats.playmaking}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/40 px-1.5 py-0.5 rounded border border-slate-800/40">
              <span className="text-slate-400 text-[10px]">REB:</span>
              <span className="font-bold text-emerald-300">{card.stats.rebounding}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/40 px-1.5 py-0.5 rounded border border-slate-800/40">
              <span className="text-slate-400 text-[10px]">DEF:</span>
              <span className="font-bold text-amber-300">{card.stats.defense}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/40 px-1.5 py-0.5 rounded border border-slate-800/40 col-span-2">
              <span className="text-slate-400 text-[10px]">SHOOT (3P/Mid/FT):</span>
              <span className="font-bold">
                {card.stats.shooting3PT}/{card.stats.shootingMid}/{card.stats.shootingFT}
              </span>
            </div>
          </div>
        )}

        {/* Small version compact footer */}
        {size === 'sm' && (
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-850 font-mono">
            <span>{card.archetype}</span>
            <span className="text-emerald-400 font-bold">⭐ T{card.evolutionTier}</span>
          </div>
        )}

        {/* Season Statistics flavor */}
        {card.gamesPlayed && card.gamesPlayed > 0 ? (
          <div className="mt-2.5 pt-2 border-t border-slate-850 flex justify-between text-[10px] text-slate-400 font-mono">
            <span>PPG: <b className="text-white">{card.pointsAvg?.toFixed(1)}</b></span>
            <span>APG: <b className="text-white">{card.assistsAvg?.toFixed(1)}</b></span>
            <span>RPG: <b className="text-white">{card.reboundsAvg?.toFixed(1)}</b></span>
          </div>
        ) : null}
      </div>
    </div>
  );
};
