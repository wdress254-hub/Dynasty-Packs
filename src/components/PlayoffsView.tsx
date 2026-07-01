/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlayoffMatchup, Roster, GameResult, TeamStanding, PlayerCard, BoxScoreStats } from '../types';
import { simulateBasketballGame, analyzeLineup } from '../engine/simulation';
import { Trophy, ShieldAlert, Sparkles, AlertCircle, RefreshCw, Star, Zap, Play, Award, CheckCircle, Users } from 'lucide-react';

interface PlayoffsViewProps {
  playoffsActive: boolean;
  playoffRound: number;
  playoffBracket: PlayoffMatchup[];
  roster: Roster;
  chemistryScore: number;
  standings: TeamStanding[];
  onPlayoffCompleted: (winnerId: string, seriesCompleted: PlayoffMatchup[]) => void;
  onAdvanceRound: (nextBracket: PlayoffMatchup[]) => void;
  onUpdateBracket?: (nextBracket: PlayoffMatchup[]) => void;
  onRebirth: (legacyCardIds: string[]) => void;
  onViewRoster?: (teamId: string) => void;
}

export const PlayoffsView: React.FC<PlayoffsViewProps> = ({
  playoffsActive,
  playoffRound,
  playoffBracket,
  roster,
  chemistryScore,
  standings,
  onPlayoffCompleted,
  onAdvanceRound,
  onUpdateBracket,
  onRebirth,
  onViewRoster
}) => {
  const [activeMatchupId, setActiveMatchupId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simLog, setSimLog] = useState<string[]>([]);
  const [seriesResultMsg, setSeriesResultMsg] = useState<string | null>(null);
  const [activeSeries, setActiveSeries] = useState<PlayoffMatchup | null>(null);
  const [lastGameResult, setLastGameResult] = useState<GameResult | null>(null);

  const [selectedGameIndex, setSelectedGameIndex] = useState<number | null>(null);
  const [playoffBoxTab, setPlayoffBoxTab] = useState<'player' | 'opponent'>('player');

  // Selected legacy cards for Rebirth
  const [legacySelected, setLegacySelected] = useState<string[]>([]);

  // Get active matchup for the player
  const playerMatchup = playoffBracket.find(m =>
    m.round === playoffRound &&
    (m.team1Id === 'player-team' || m.team2Id === 'player-team')
  );

  React.useEffect(() => {
    if (playerMatchup && playerMatchup.games && playerMatchup.games.length > 0) {
      setSelectedGameIndex(playerMatchup.games.length - 1);
    } else {
      setSelectedGameIndex(null);
    }
  }, [playerMatchup?.games?.length]);

  const getTeamName = (id: string) => {
    if (id === 'player-team') return 'Your Franchise';
    return standings.find(t => t.id === id)?.name || 'AI Contender';
  };

  const getTeamOvr = (id: string) => {
    if (id === 'player-team') {
      // Calculate overall based on starter cards
      const cards = Object.values(roster.starters).filter(Boolean) as PlayerCard[];
      if (cards.length === 0) return 70;
      return Math.round(cards.reduce((acc: number, c) => acc + c.ovr, 0) / cards.length);
    }
    // AI team OVR
    const match = standings.find(t => t.id === id);
    if (!match) return 78;
    // Base approximation of AI team rating
    return 75 + (match.wins / 82) * 20;
  };

  const handleSimulateGame = async () => {
    if (!playerMatchup || simulating) return;

    setSimulating(true);
    setSimLog([]);
    setSeriesResultMsg(null);

    const opponentId = playerMatchup.team1Id === 'player-team' ? playerMatchup.team2Id : playerMatchup.team1Id;
    const opponentOvr = getTeamOvr(opponentId);
    const opponentName = getTeamName(opponentId);

    // Logs to simulate dramatic tension
    const logs = [
      `🏀 Tip-off! Playoff Round ${playoffRound}, Game ${playerMatchup.games.length + 1}...`,
      `🔥 ${opponentName} (OVR ${Math.round(opponentOvr)}) showing incredible defensive focus.`,
      `⚡ Your Franchise working the high pick-and-roll...`,
      `⏱️ Half-time adjustment: Stamina depletion playing a major factor.`,
      `🚀 4th Quarter: Momentum shifting back and forth. Clutch factor activates!`
    ];

    for (let i = 0; i < logs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 400));
      setSimLog(prev => [...prev, logs[i]]);
    }

    // Run the math simulation
    const gameResult = simulateBasketballGame({
      playerTeam: roster,
      opponentTeamName: opponentName,
      opponentOvr: opponentOvr,
      difficultyMultiplier: 1.03 + (playoffRound * 0.06), // Higher difficulty each round (increased)
      chemistry: chemistryScore
    });

    gameResult.gameNumber = playerMatchup.games.length + 1;
    setLastGameResult(gameResult);

    // Update the matchup record
    const updatedMatchup = { ...playerMatchup };
    updatedMatchup.games = [...updatedMatchup.games, gameResult];

    if (playerMatchup.team1Id === 'player-team') {
      if (gameResult.isPlayerWin) {
        updatedMatchup.team1Wins += 1;
      } else {
        updatedMatchup.team2Wins += 1;
      }
    } else {
      if (gameResult.isPlayerWin) {
        updatedMatchup.team2Wins += 1;
      } else {
        updatedMatchup.team1Wins += 1;
      }
    }

    setSimLog(prev => [
      ...prev,
      `🏁 Game Over! ${gameResult.team1Score} - ${gameResult.team2Score}. ${
        gameResult.isPlayerWin ? '🏆 YOU WIN!' : '❌ Opponent wins.'
      }`
    ]);

    // Check if series is completed (first to 4 wins)
    if (updatedMatchup.team1Wins === 4) {
      updatedMatchup.winnerId = updatedMatchup.team1Id;
    } else if (updatedMatchup.team2Wins === 4) {
      updatedMatchup.winnerId = updatedMatchup.team2Id;
    }

    // Update active bracket state in parent
    const nextBracket = playoffBracket.map(m => m.id === updatedMatchup.id ? updatedMatchup : m);

    if (updatedMatchup.winnerId) {
      // Simulate other AI series concurrently so bracket stays filled!
      simulateOtherSeries(nextBracket);

      if (updatedMatchup.winnerId === 'player-team') {
        if (playoffRound === 3) {
          // Player won the championship!
          setSeriesResultMsg("👑 CONGRATULATIONS! You won the NBA Finals Championship! The Rebirth legacy system is now unlocked!");
          onPlayoffCompleted('player-team', nextBracket);
        } else {
          setSeriesResultMsg(`🎉 You have won the series 4-${Math.min(updatedMatchup.team1Wins, updatedMatchup.team2Wins)} and advanced to the next round!`);
          if (onUpdateBracket) onUpdateBracket(nextBracket); // Wait for user to click Advance Round
        }
      } else {
        // Player eliminated
        const opId = updatedMatchup.team1Id === 'player-team' ? updatedMatchup.team2Id : updatedMatchup.team1Id;
        setSeriesResultMsg("❌ ELIMINATED! Your playoff run ends here. Your legacy can still be reborn! Start Year 1 again with premium bonuses.");
        onPlayoffCompleted(opId, nextBracket);
      }
    } else {
      if (onUpdateBracket) onUpdateBracket(nextBracket); // Update the game count but don't advance the round!
    }

    setSimulating(false);
  };

  // Helper to simulate other AI matches so bracket fills automatically
  const simulateOtherSeries = (bracket: PlayoffMatchup[]) => {
    bracket.forEach(m => {
      if (m.round === playoffRound && m.id !== playerMatchup?.id && !m.winnerId) {
        // Simple OVR comparison to determine winner of AI match
        const ovr1 = getTeamOvr(m.team1Id);
        const ovr2 = getTeamOvr(m.team2Id);
        const p1WinChance = ovr1 / (ovr1 + ovr2);

        while (m.team1Wins < 4 && m.team2Wins < 4) {
          if (Math.random() < p1WinChance) {
            m.team1Wins++;
          } else {
            m.team2Wins++;
          }
        }
        m.winnerId = m.team1Wins === 4 ? m.team1Id : m.team2Id;
      }
    });
  };

  // Legacy selections toggle
  const toggleLegacySelect = (cardId: string) => {
    setLegacySelected(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      }
      if (prev.length >= 3) {
        return prev; // max 3 cards kept
      }
      return [...prev, cardId];
    });
  };

  // Compile active inventory cards
  const allEligibleCards = [...roster.bench, ...Object.values(roster.starters).filter(Boolean)] as any[];

  return (
    <div className="space-y-6">
      {/* Playoff Banner Header */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-zinc-950 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div className="space-y-1 relative">
          <span className="text-[10px] bg-yellow-500 text-slate-950 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
            NBA Playoffs Arena
          </span>
          <h2 className="font-display font-black text-white text-2xl tracking-tight mt-2.5">
            {playoffRound === 1 ? 'QUARTERFINALS' : playoffRound === 2 ? 'CONFERENCE FINALS' : 'NBA WORLD FINALS'}
          </h2>
          <p className="text-xs text-slate-400">
            Series are Best-of-7 (first to 4 wins). Team stamina resets per game, but difficulty scales as you approach the ring!
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
          <Trophy className="w-8 h-8 text-yellow-400 animate-bounce" />
          <div className="font-mono">
            <span className="text-slate-500 text-[10px] block uppercase font-black">Playoff Standing</span>
            <span className="text-yellow-400 font-bold text-sm">Best-of-7 series active</span>
          </div>
        </div>
      </div>

      {/* SERIES SIMULATOR WORKSPACE */}
      {playerMatchup ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Series Dashboard */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <h3 className="font-display font-bold text-white text-base pb-3 border-b border-slate-800 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Active Playoff Series Matchup
              </h3>

              <div className="flex items-center justify-around py-6 bg-slate-950/40 rounded-lg border border-slate-800/60 mb-6">
                {/* Team 1: Player */}
                <div className="text-center space-y-1.5 w-1/3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="font-display font-black text-white text-xs md:text-sm line-clamp-1">Your Franchise</h4>
                  <span className="font-mono text-[10px] text-slate-400">OVR {getTeamOvr(playerMatchup.team1Id)}</span>
                  <div className="font-mono font-black text-3xl text-emerald-400 pt-1.5">{playerMatchup.team1Id === 'player-team' ? playerMatchup.team1Wins : playerMatchup.team2Wins}</div>
                </div>

                <div className="font-display font-bold text-slate-500 text-sm">VS</div>

                {/* Team 2: AI */}
                <div className="text-center space-y-1.5 w-1/3 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto mb-2">
                    <Award className="w-6 h-6 text-blue-400" />
                  </div>
                  <h4 className="font-display font-black text-white text-xs md:text-sm line-clamp-1">{getTeamName(playerMatchup.team1Id === 'player-team' ? playerMatchup.team2Id : playerMatchup.team1Id)}</h4>
                  <span className="font-mono text-[10px] text-slate-400">OVR {getTeamOvr(playerMatchup.team1Id === 'player-team' ? playerMatchup.team2Id : playerMatchup.team1Id)}</span>
                  {onViewRoster && (
                    <button
                      onClick={() => {
                        const oppId = playerMatchup.team1Id === 'player-team' ? playerMatchup.team2Id : playerMatchup.team1Id;
                        onViewRoster(oppId);
                      }}
                      className="text-[9px] bg-slate-850 hover:bg-slate-750 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/20 mt-1 transition-all inline-flex items-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <Users className="w-2.5 h-2.5" /> Scout
                    </button>
                  )}
                  <div className="font-mono font-black text-3xl text-slate-200 pt-1.5">{playerMatchup.team1Id === 'player-team' ? playerMatchup.team2Wins : playerMatchup.team1Wins}</div>
                </div>
              </div>

              {/* Simulation logs logger */}
              <div className="bg-slate-950 border border-slate-850 rounded-lg p-4 min-h-[160px] max-h-[220px] overflow-y-auto font-mono text-xs text-slate-300 space-y-1.5">
                <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-2">Sim Room Logs</div>
                {simLog.length === 0 ? (
                  <div className="text-slate-500 italic flex items-center gap-2 py-6 justify-center">
                    <Play className="w-4 h-4 text-slate-600" />
                    <span>Click Simulate below to launch Game {playerMatchup.games.length + 1}...</span>
                  </div>
                ) : (
                  simLog.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <span className="text-slate-600 font-bold shrink-0">{idx + 1}.</span>
                      <span>{log}</span>
                    </div>
                  ))
                )}
              </div>

              {/* SERIES GAME BOX SCORES (More Visible Playoff Stats) */}
              {selectedGameIndex !== null && playerMatchup.games && playerMatchup.games[selectedGameIndex] && (
                <div className="bg-slate-950 border border-slate-850 rounded-lg p-4 space-y-4 mt-4">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-yellow-400" />
                      <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                        Game #{selectedGameIndex + 1} Player Stats Recap
                      </span>
                    </div>
                    {/* Game Selector dots/pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] py-1">
                      {playerMatchup.games.map((_, gIdx) => (
                        <button
                          key={gIdx}
                          onClick={() => setSelectedGameIndex(gIdx)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all shrink-0 ${
                            selectedGameIndex === gIdx
                              ? 'bg-yellow-500 text-slate-950 shadow-sm'
                              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          G{gIdx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Score banner */}
                  {(() => {
                    const game = playerMatchup.games[selectedGameIndex];
                    const oppId = playerMatchup.team1Id === 'player-team' ? playerMatchup.team2Id : playerMatchup.team1Id;
                    const oppName = getTeamName(oppId);
                    
                    return (
                      <div className="space-y-4">
                        <div className="flex justify-around items-center text-center py-2 bg-slate-900/20 rounded-lg border border-slate-850/60">
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase font-bold">Your Franchise</span>
                            <span className="text-lg font-black font-mono text-emerald-400">{game.team1Score}</span>
                          </div>
                          <div className="text-[10px] bg-slate-850 px-2 py-0.5 rounded font-mono font-bold text-slate-400 uppercase">FINAL</div>
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase font-bold truncate max-w-[120px]">{oppName}</span>
                            <span className="text-lg font-black font-mono text-slate-300">{game.team2Score}</span>
                          </div>
                        </div>

                        {/* Team Selector Tabs */}
                        <div className="flex bg-slate-900/60 p-1 rounded-lg border border-slate-850">
                          <button
                            onClick={() => setPlayoffBoxTab('player')}
                            className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              playoffBoxTab === 'player'
                                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Your Franchise Box
                          </button>
                          <button
                            onClick={() => setPlayoffBoxTab('opponent')}
                            className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              playoffBoxTab === 'opponent'
                                ? 'bg-slate-800 text-blue-400 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {oppName} Box
                          </button>
                        </div>

                        {/* Stats Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-mono text-[11px]">
                            <thead>
                              <tr className="border-b border-slate-850 text-slate-500 text-[9px] uppercase">
                                <th className="py-1.5">Player</th>
                                <th className="py-1.5 text-center w-10">MIN</th>
                                <th className="py-1.5 text-center w-10">PTS</th>
                                <th className="py-1.5 text-center w-10">AST</th>
                                <th className="py-1.5 text-center w-10">REB</th>
                                <th className="py-1.5 text-center w-10">STL</th>
                                <th className="py-1.5 text-center w-10">BLK</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850/40 text-slate-300">
                              {playoffBoxTab === 'player' ? (
                                Object.entries(game.playerStats || {}).map(([cardId, statsObj]) => {
                                  const stats = statsObj as BoxScoreStats;
                                  const allCards = [...roster.bench, ...Object.values(roster.starters).filter(Boolean)] as any[];
                                  const player = allCards.find(c => c.id === cardId);
                                  if (!player) return null;

                                  return (
                                    <tr key={cardId} className="hover:bg-slate-900/20">
                                      <td className="py-1.5 font-sans font-medium text-white max-w-[100px] truncate">{player.name}</td>
                                      <td className="py-1.5 text-center text-slate-400">{stats.minutes}</td>
                                      <td className="py-1.5 text-center font-bold text-red-300">{stats.points}</td>
                                      <td className="py-1.5 text-center text-sky-300">{stats.assists}</td>
                                      <td className="py-1.5 text-center text-emerald-300">{stats.rebounds}</td>
                                      <td className="py-1.5 text-center text-slate-400">{stats.steals}</td>
                                      <td className="py-1.5 text-center text-slate-400">{stats.blocks}</td>
                                    </tr>
                                  );
                                })
                              ) : (
                                (() => {
                                  let oppPlayers = game.opponentPlayers;
                                  let oppStats = game.opponentStats;
                                  if (!oppStats || Object.keys(oppStats).length === 0) {
                                    oppPlayers = [
                                      { id: 'opp-pg', name: 'Opponent PG', primaryPosition: 'PG', ovr: 75, stats: { scoring: 75, shooting3PT: 75, playmaking: 75, defense: 75, rebounding: 75, stamina: 75 }, traits: [], hiddenAttributes: { clutch: 75, potential: 75 }, rarity: 'common', archetype: 'Slasher' },
                                      { id: 'opp-sg', name: 'Opponent SG', primaryPosition: 'SG', ovr: 76, stats: { scoring: 76, shooting3PT: 76, playmaking: 76, defense: 76, rebounding: 76, stamina: 76 }, traits: [], hiddenAttributes: { clutch: 76, potential: 76 }, rarity: 'common', archetype: 'Sharp' },
                                      { id: 'opp-sf', name: 'Opponent SF', primaryPosition: 'SF', ovr: 77, stats: { scoring: 77, shooting3PT: 77, playmaking: 77, defense: 77, rebounding: 77, stamina: 77 }, traits: [], hiddenAttributes: { clutch: 77, potential: 77 }, rarity: 'common', archetype: 'Lockdown' },
                                      { id: 'opp-pf', name: 'Opponent PF', primaryPosition: 'PF', ovr: 78, stats: { scoring: 78, shooting3PT: 78, playmaking: 78, defense: 78, rebounding: 78, stamina: 78 }, traits: [], hiddenAttributes: { clutch: 78, potential: 78 }, rarity: 'common', archetype: 'Glass Cleaner' },
                                      { id: 'opp-c', name: 'Opponent C', primaryPosition: 'C', ovr: 80, stats: { scoring: 80, shooting3PT: 80, playmaking: 80, defense: 80, rebounding: 80, stamina: 80 }, traits: [], hiddenAttributes: { clutch: 80, potential: 80 }, rarity: 'common', archetype: 'Rim Protector' }
                                    ] as any;
                                    oppStats = {
                                      'opp-pg': { points: Math.floor(game.team2Score * 0.25), assists: 6, rebounds: 2, steals: 1, blocks: 0, minutes: 36 },
                                      'opp-sg': { points: Math.floor(game.team2Score * 0.3), assists: 2, rebounds: 3, steals: 2, blocks: 0, minutes: 38 },
                                      'opp-sf': { points: Math.floor(game.team2Score * 0.2), assists: 3, rebounds: 5, steals: 1, blocks: 1, minutes: 35 },
                                      'opp-pf': { points: Math.floor(game.team2Score * 0.15), assists: 1, rebounds: 8, steals: 0, blocks: 1, minutes: 32 },
                                      'opp-c': { points: game.team2Score - Math.floor(game.team2Score * 0.25) - Math.floor(game.team2Score * 0.3) - Math.floor(game.team2Score * 0.2) - Math.floor(game.team2Score * 0.15), assists: 1, rebounds: 11, steals: 0, blocks: 3, minutes: 30 }
                                    };
                                  }

                                  return Object.entries(oppStats).map(([cardId, statsObj]) => {
                                    const stats = statsObj as BoxScoreStats;
                                    const player = oppPlayers?.find(c => c.id === cardId);
                                    if (!player) return null;

                                    return (
                                      <tr key={cardId} className="hover:bg-slate-900/20">
                                        <td className="py-1.5 font-sans font-medium text-white max-w-[100px] truncate">{player.name}</td>
                                        <td className="py-1.5 text-center text-slate-400">{stats.minutes}</td>
                                        <td className="py-1.5 text-center font-bold text-red-300">{stats.points}</td>
                                        <td className="py-1.5 text-center text-sky-300">{stats.assists}</td>
                                        <td className="py-1.5 text-center text-emerald-300">{stats.rebounds}</td>
                                        <td className="py-1.5 text-center text-slate-400">{stats.steals}</td>
                                        <td className="py-1.5 text-center text-slate-400">{stats.blocks}</td>
                                      </tr>
                                    );
                                  });
                                })()
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Simulated Action footers */}
            <div className="pt-5 border-t border-slate-850/60 mt-4 flex flex-col gap-2.5">
              {seriesResultMsg && (
                <div className={`p-3 rounded-lg text-xs font-mono border ${
                  playerMatchup.winnerId === 'player-team'
                    ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-300'
                    : 'bg-red-950/40 border-red-900/50 text-red-300'
                }`}>
                  {seriesResultMsg}
                </div>
              )}

              {!playerMatchup.winnerId ? (
                <button
                  onClick={handleSimulateGame}
                  className={`w-full py-3.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    simulating
                      ? 'bg-slate-850 text-slate-500 cursor-not-allowed'
                      : 'bg-yellow-500 text-slate-950 hover:bg-yellow-400 active:scale-97 shadow-lg shadow-yellow-500/10'
                  }`}
                  disabled={simulating}
                >
                  {simulating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                      <span>Simulating Quarters...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-slate-900 fill-slate-900" />
                      <span>Simulate Playoff Game {playerMatchup.games.length + 1}</span>
                    </>
                  )}
                </button>
              ) : playerMatchup.winnerId === 'player-team' && playoffRound < 3 ? (
                <button
                  onClick={() => onAdvanceRound(playoffBracket)}
                  className="w-full py-3.5 rounded-lg text-xs font-black uppercase tracking-wider bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-97 shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Advance to {playoffRound === 1 ? 'Conference Finals' : 'NBA World Finals'}</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Interactive Playoff Bracket tree */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <h3 className="font-display font-bold text-white text-base pb-3 border-b border-slate-800 mb-4">
              Playoff Bracket Standing
            </h3>

            <div className="space-y-4 font-mono text-xs">
              {playoffBracket.map(m => {
                const isActive = m.id === playerMatchup.id;
                const isWinner1 = m.winnerId === m.team1Id;
                const isWinner2 = m.winnerId === m.team2Id;

                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-lg border flex flex-col gap-1.5 ${
                      isActive
                        ? 'border-yellow-500/60 bg-yellow-500/5 shadow-[0_0_10px_rgba(234,179,8,0.1)]'
                        : 'border-slate-800 bg-slate-950/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                      <span>Matchup #{m.id.slice(-2)}</span>
                      <span className={isActive ? 'text-yellow-400 font-black' : ''}>
                        {m.round === 1 ? 'Quarterfinals' : m.round === 2 ? 'Semifinals' : 'Finals'}
                      </span>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-slate-900">
                      {/* Team 1 */}
                      <div className="flex justify-between items-center">
                        <span className={`font-sans font-medium ${isWinner1 ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                          {getTeamName(m.team1Id)}
                        </span>
                        <span className="font-bold text-slate-400">{m.team1Wins}</span>
                      </div>
                      {/* Team 2 */}
                      <div className="flex justify-between items-center">
                        <span className={`font-sans font-medium ${isWinner2 ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                          {getTeamName(m.team2Id)}
                        </span>
                        <span className="font-bold text-slate-400">{m.team2Wins}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* REBIRTH / NEW GAME+ INTERFACE (Shown if champion or eliminated and fully finished) */}
      {!playerMatchup && playoffsActive === false ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl mx-auto text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-2">
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>

          <div>
            <h3 className="font-display font-black text-2xl text-white tracking-tight">
              REBIRTH LEGACY SYSTEM
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
              Your season is fully completed. To progress to the next Year of your dynasty, initiate Rebirth. 
              You can keep up to <b>3 cards</b> to act as your legacy foundational pillars!
            </p>
          </div>

          <div className="text-left bg-slate-950 border border-slate-850 rounded-lg p-4">
            <div className="text-xs font-mono uppercase text-slate-500 font-bold mb-3">
              Select 3 Cards to Retain (Selected: {legacySelected.length} / 3)
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[180px] overflow-y-auto pr-1">
              {allEligibleCards.map((card, idx) => {
                const isSelected = legacySelected.includes(card.id);
                return (
                  <button
                    key={`${card.id}-${idx}`}
                    onClick={() => toggleLegacySelect(card.id)}
                    className={`p-2 rounded-lg border text-left flex justify-between items-center font-mono text-xs transition-all ${
                      isSelected
                        ? 'border-yellow-500 bg-yellow-500/10 text-yellow-300 font-bold'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="text-[10px] font-bold truncate text-white">{card.name}</div>
                      <span className="text-[9px] text-slate-500">{card.primaryPosition} • OVR {card.ovr}</span>
                    </div>
                    {isSelected && <CheckCircle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onRebirth(legacySelected)}
            className="w-full bg-emerald-500 text-slate-950 font-black py-3.5 rounded-lg hover:bg-emerald-400 transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 active:scale-97 shadow-lg"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Rebirth Dynasty & Enter New Year</span>
          </button>
        </div>
      ) : null}
    </div>
  );
};
