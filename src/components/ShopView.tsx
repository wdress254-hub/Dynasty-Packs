/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PackType, PlayerCard } from '../types';
import { PACK_TYPES, openPack } from '../engine/simulation';
import { PLAYER_TEMPLATES, getRarityColor } from '../data/players';
import { PlayerCardView } from './PlayerCardView';
import { Coins, Sparkles, AlertCircle, ShoppingBag, ArrowRight, Eye, RefreshCw, Star, Info } from 'lucide-react';

interface ShopViewProps {
  coins: number;
  onBuyPack: (pack: PackType, cards: PlayerCard[]) => void;
}

export const ShopView: React.FC<ShopViewProps> = ({ coins, onBuyPack }) => {
  const [selectedPack, setSelectedPack] = useState<PackType | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [revealQueue, setRevealQueue] = useState<PlayerCard[]>([]);
  const [revealedCards, setRevealedCards] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Buy pack handler
  const handlePurchase = (pack: PackType) => {
    if (coins < pack.cost) {
      setErrorMsg(`Insufficient coins to buy ${pack.name}! Run some simulations to win coins.`);
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    const newCards = openPack(pack, PLAYER_TEMPLATES);
    // Deduct coins and add to inventory immediately so it auto-saves and cannot be exploited
    onBuyPack(pack, newCards);

    setIsOpening(true);
    setSelectedPack(pack);
    setRevealQueue(newCards);
    setRevealedCards({});
  };

  // Flip a card in the opening view
  const flipCard = (cardId: string) => {
    setRevealedCards(prev => ({
      ...prev,
      [cardId]: true
    }));
  };

  // Check if all cards in the pack have been flipped/revealed
  const allRevealed = revealQueue.length > 0 && revealQueue.every(card => revealedCards[card.id]);

  // Complete pack opening and close the panel (cards are already saved in inventory!)
  const handleClaim = () => {
    setIsOpening(false);
    setSelectedPack(null);
    setRevealQueue([]);
    setRevealedCards({});
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
        <div>
          <h2 className="font-display font-black text-white text-lg tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            DYNASTY CARD PACK STORE
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Spend your franchise coins on elite player packs. Pull rare Hall-of-Famers to accelerate your team OVR.
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-lg shrink-0">
          <Coins className="w-5 h-5 text-yellow-400 animate-pulse" />
          <div className="font-mono">
            <span className="text-slate-500 text-[10px] block uppercase font-bold tracking-widest leading-none">Coins</span>
            <span className="text-yellow-400 font-black text-lg">{coins.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 bg-red-950/50 border border-red-900/50 text-red-300 p-3 rounded-lg text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Shop packs listing */}
      {!isOpening ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PACK_TYPES.map(pack => (
            <div
              key={pack.id}
              className={`relative rounded-xl border-2 flex flex-col justify-between overflow-hidden bg-slate-900/90 transition-all duration-300 ${
                pack.color
              } hover:translate-y-[-4px] hover:shadow-lg`}
            >
              {/* Pack Box */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-slate-800 text-slate-300 px-2 py-0.5 rounded-sm">
                    {pack.type}
                  </span>
                  <Coins className="w-5 h-5 text-slate-500" />
                </div>

                <h3 className="font-display font-bold text-white text-base mt-3.5 tracking-tight">
                  {pack.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed min-h-[48px]">
                  {pack.description}
                </p>

                {/* Guarantees or hints */}
                {pack.guaranteeRule && (
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] text-amber-300 font-medium bg-amber-950/20 border border-amber-900/30 p-1.5 rounded">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>{pack.guaranteeRule}</span>
                  </div>
                )}

                {/* Probability Table summary */}
                <div className="mt-4 border-t border-slate-800/60 pt-3 space-y-1 text-[10px] font-mono text-slate-400">
                  <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Pull Probabilities</div>
                  <div className="flex justify-between">
                    <span>Common:</span>
                    <span className="text-slate-300 font-bold">{pack.rarityWeights.Common}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rare:</span>
                    <span className="text-blue-400 font-bold">{pack.rarityWeights.Rare}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Epic:</span>
                    <span className="text-purple-400 font-bold">{pack.rarityWeights.Epic}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Legendary:</span>
                    <span className="text-yellow-400 font-bold">{pack.rarityWeights.Legendary}%</span>
                  </div>
                </div>
              </div>

              {/* Purchase Footer */}
              <div className="p-4 bg-slate-950 border-t border-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-1 font-mono">
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-white font-bold text-sm">{pack.cost}</span>
                </div>

                <button
                  onClick={() => handlePurchase(pack)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                    coins >= pack.cost
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md active:scale-95'
                      : 'bg-slate-850 text-slate-500 cursor-not-allowed'
                  }`}
                  disabled={coins < pack.cost}
                >
                  <span>Buy Pack</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* INTERACTIVE PACK OPENING VIEW */
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 flex flex-col items-center justify-center min-h-[500px]">
          <div className="text-center mb-6">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-1 rounded-full">
              Opening {selectedPack?.name}
            </span>
            <h3 className="font-display font-black text-2xl text-white mt-2 tracking-tight">
              Flip Cards to Reveal Roster Pulls
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Click on each facedown card to flip it over. Once all {revealQueue.length} are revealed, click claim!
            </p>
          </div>

          {/* Cards container with Perspective */}
          <div className="flex flex-wrap items-center justify-center gap-6 py-6 w-full max-w-5xl">
            {revealQueue.map((card, idx) => {
              const isRevealed = revealedCards[card.id];
              const rarityColor = getRarityColor(card.rarity);

              return (
                <div
                  key={card.id}
                  className="perspective-1000 w-48 h-72 cursor-pointer group"
                  onClick={() => !isRevealed && flipCard(card.id)}
                >
                  <div
                    className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${
                      isRevealed ? 'rotate-y-180' : ''
                    }`}
                  >
                    {/* CARD FRONT (REVEALED STATE) */}
                    <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-slate-950 rounded-xl">
                      {/* Scaled down version for reveal screen */}
                      <PlayerCardView card={card} size="sm" showStats={true} />
                    </div>

                    {/* CARD BACK (FACEDOWN STATE) */}
                    <div
                      className="absolute inset-0 w-full h-full backface-hidden bg-zinc-900 border-2 border-slate-700 hover:border-slate-400 rounded-xl flex flex-col items-center justify-center p-4 shadow-xl transition-all duration-300 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                    >
                      {/* Holographic lines */}
                      <div className="absolute inset-2 border border-slate-800/45 rounded-lg pointer-events-none" />

                      <div className="relative flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-900/80 border border-slate-700/60 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Sparkles className="w-6 h-6 text-slate-500 group-hover:text-amber-400 transition-colors" />
                        </div>
                        <span className="font-display font-black text-sm text-slate-400 tracking-wider">
                          DYNASTY
                        </span>
                        <span className="font-mono text-[9px] text-slate-600 uppercase tracking-widest mt-0.5">
                          Pull #{idx + 1}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action button */}
          <div className="mt-8 border-t border-slate-850 pt-5 w-full max-w-md flex flex-col items-center">
            {allRevealed ? (
              <button
                onClick={handleClaim}
                className="w-full bg-emerald-500 text-slate-950 font-black py-3 rounded-lg hover:bg-emerald-400 transition-all shadow-lg text-sm tracking-wider uppercase flex items-center justify-center gap-2 active:scale-97"
              >
                <span>Add Pulls to My Franchise</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-600" />
                <span>Waiting for all pulls to be flipped...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
