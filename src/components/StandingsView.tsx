/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TeamStanding } from '../types';
import { Trophy, HelpCircle } from 'lucide-react';

interface StandingsViewProps {
  standings: TeamStanding[];
  currentWeek: number;
  onViewRoster?: (teamId: string) => void;
}

export const StandingsView: React.FC<StandingsViewProps> = ({ standings, currentWeek, onViewRoster }) => {
  // Sort helper function
  const sortConference = (teams: TeamStanding[]) => {
    return [...teams].sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      const aRatio = a.pointsFor - a.pointsAgainst;
      const bRatio = b.pointsFor - b.pointsAgainst;
      return bRatio - aRatio;
    });
  };

  const eastTeams = sortConference(standings.filter(t => t.conference === 'East'));
  const westTeams = sortConference(standings.filter(t => t.conference === 'West'));

  const renderConferenceTable = (title: string, teams: TeamStanding[]) => {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden p-4">
        <h3 className="font-display font-black text-sm text-slate-200 tracking-wide pb-3 border-b border-slate-800 mb-4 uppercase">
          {title}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                <th className="py-2.5 px-2 text-center w-10">Rank</th>
                <th className="py-2.5 px-3">Team</th>
                <th className="py-2.5 px-2 text-center w-12">W</th>
                <th className="py-2.5 px-2 text-center w-12">L</th>
                <th className="py-2.5 px-2 text-center w-14">PCT</th>
                <th className="py-2.5 px-2 text-center w-14">Streak</th>
                <th className="py-2.5 px-2 text-center w-14">DIFF</th>
                <th className="py-2.5 px-2 text-center w-16">Roster</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {teams.map((team, index) => {
                const totalGames = team.wins + team.losses;
                const winPct = totalGames > 0 ? (team.wins / totalGames).toFixed(3) : '.000';
                const diff = team.pointsFor - team.pointsAgainst;
                const diffSign = diff > 0 ? `+${diff}` : `${diff}`;

                // Top 4 qualify for Playoffs in each conference
                const isPlayoffSpot = index < 4;

                return (
                  <tr
                    key={team.id}
                    className={`transition-colors font-mono ${
                      team.isPlayer
                        ? 'bg-emerald-950/20 text-emerald-300 border-l-4 border-l-emerald-500 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                          isPlayoffSpot
                            ? team.isPlayer
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'bg-slate-850 text-slate-200 border border-slate-700'
                            : 'bg-zinc-950 text-slate-500'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="line-clamp-1">{team.name}</span>
                        {team.isPlayer && (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1 rounded uppercase font-black">
                            User
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold">{team.wins}</td>
                    <td className="py-2.5 px-2 text-center">{team.losses}</td>
                    <td className="py-2.5 px-2 text-center text-slate-400 text-xs">{winPct}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] ${
                          team.streak > 0
                            ? 'bg-emerald-950/40 text-emerald-400'
                            : team.streak < 0
                            ? 'bg-red-950/40 text-red-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {team.streak > 0 ? `W${team.streak}` : team.streak < 0 ? `L${Math.abs(team.streak)}` : '-'}
                      </span>
                    </td>
                    <td
                      className={`py-2.5 px-2 text-center text-xs ${
                        diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-slate-500'
                      }`}
                    >
                      {diffSign}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() => onViewRoster?.(team.id)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-sans font-bold text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Standings Header */}
      <div id="standings-panel" className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden p-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="font-display font-bold text-white text-base">NBA Dynasty Standings (Year {Math.floor(currentWeek / 82) + 1 || 1})</h2>
          </div>
          <span className="text-xs bg-slate-850 border border-slate-750 text-slate-300 font-mono px-2 py-1 rounded-sm">
            Game {Math.min(82, currentWeek)} / 82
          </span>
        </div>

        {/* Responsive dual column grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {renderConferenceTable("Eastern Conference", eastTeams)}
          {renderConferenceTable("Western Conference", westTeams)}
        </div>

        {/* Standings key */}
        <div className="mt-4 flex items-center gap-2.5 text-[11px] text-slate-400 border-t border-slate-800 pt-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" />
            Playoff Cutoff (Top 4 per Conference qualify)
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-slate-500">
            <HelpCircle className="w-3 h-3" />
            Tiebreakers decided by Point Differential
          </span>
        </div>
      </div>
    </div>
  );
};
