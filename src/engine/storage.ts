/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState, TeamStanding, Roster } from '../types';
import { generateAiTeams, generateSchedule, generateFreeAgents, generateAiTeamRoster } from './simulation';

const LOCAL_STORAGE_KEY = 'nba_dynasty_packs_state';

// Lists of teams belonging to Eastern Conference to partition them 8-8
const EAST_TEAM_NAMES = [
  "Chicago Dynasties", "Miami Heatwave", "Philadelphia Phantoms", 
  "New York Skyscrapers", "Milwaukee Bucks", "Detroit Bad Boys", "Utah Jazz",
  "Boston Legends", "Your Franchise"
];

// Generate default initial standings
export function createStandings(year: number): TeamStanding[] {
  const standings: TeamStanding[] = [
    {
      id: 'player-team',
      name: 'Your Franchise',
      isPlayer: true,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      streak: 0,
      conference: 'East'
    }
  ];

  const aiTeams = generateAiTeams(year);
  aiTeams.forEach(t => {
    const isEast = EAST_TEAM_NAMES.includes(t.name);
    standings.push({
      id: t.id,
      name: t.name,
      isPlayer: false,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      streak: 0,
      conference: isEast ? 'East' : 'West'
    });
  });

  return standings;
}

// Generate schedule for 16 teams (player is index 0)
export function createSchedule(standings: TeamStanding[], gamesPerSeason: number = 82): string[][] {
  const teamIds = standings.map(t => t.id);
  return generateSchedule(teamIds, gamesPerSeason);
}

// Initial default state
export const DEFAULT_STATE = (year: number = 1, gamesPerSeason: number = 82): GameState => {
  const initialStandings = createStandings(year);
  const initialSchedule = createSchedule(initialStandings, gamesPerSeason);

  const aiTeamsRosters: Record<string, Roster> = {};
  const aiTeams = generateAiTeams(year);
  aiTeams.forEach(t => {
    aiTeamsRosters[t.id] = generateAiTeamRoster(t.name, t.ovr, year);
  });

  return {
    year,
    coins: 3000, // Starts with standard coins to buy packages too!
    inventory: [], // Empty inventory to start, opens starter packs
    roster: {
      starters: {
        PG: null,
        SG: null,
        SF: null,
        PF: null,
        C: null
      },
      bench: []
    },
    seasonProgress: 0,
    standings: initialStandings,
    seasonSchedule: initialSchedule,
    seasonGamesHistory: [],
    playoffsActive: false,
    playoffRound: 1,
    playoffBracket: [],
    isSeasonCompleted: false,
    championshipsWon: 0,
    upgradeTokens: 0,
    highestOvrReached: 70,
    freeAgentsMarket: generateFreeAgents(year),
    aiTeamsRosters,
    pendingDraftPicks: year > 1 ? 1 : 0,
    settings: {
      gamesPerSeason: 82,
      xpMultiplier: 1.0,
      coinsMultiplier: 1.0,
      difficultyModifier: 0.0
    }
  };
};

export const storageManager = {
  saveState(state: GameState): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving state to localStorage', e);
    }
  },

  loadState(): GameState {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data) as GameState;
        // Basic schema verification to ensure backward compatibility
        if (parsed.year && typeof parsed.coins === 'number' && Array.isArray(parsed.inventory)) {
          // Patch missing conference fields if they are absent in old saved standings
          if (parsed.standings && parsed.standings.length > 0) {
            parsed.standings = parsed.standings.map(s => {
              if (!s.conference) {
                const isEast = EAST_TEAM_NAMES.includes(s.name) || s.id === 'player-team';
                return { ...s, conference: isEast ? 'East' : 'West' };
              }
              return s;
            });
          }

          if (!parsed.freeAgentsMarket) {
            parsed.freeAgentsMarket = generateFreeAgents(parsed.year || 1);
          }
          if (!parsed.settings) {
            parsed.settings = {
              gamesPerSeason: 82,
              xpMultiplier: 1.0,
              coinsMultiplier: 1.0,
              difficultyModifier: 0.0
            };
          }
          if (!parsed.aiTeamsRosters) {
            const rosters: Record<string, Roster> = {};
            const aiTeams = generateAiTeams(parsed.year || 1);
            aiTeams.forEach(t => {
              const standing = parsed.standings.find(s => s.id === t.id);
              const teamOvr = standing ? Math.max(68, Math.min(98, Math.round(78 + (standing.wins / Math.max(1, parsed.seasonProgress || 1)) * 20))) : t.ovr;
              rosters[t.id] = generateAiTeamRoster(t.name, teamOvr, parsed.year || 1);
            });
            parsed.aiTeamsRosters = rosters;
          } else {
            // Also enforce the bench size rule for year 1 if it has been generated with 3 bench players on year 1
            if (parsed.year === 1) {
              Object.keys(parsed.aiTeamsRosters).forEach(id => {
                const roster = parsed.aiTeamsRosters![id];
                if (roster && roster.bench && roster.bench.length > 1) {
                  roster.bench = roster.bench.slice(0, 1);
                }
              });
            }
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading state from localStorage', e);
    }
    return DEFAULT_STATE(1);
  },

  clearState(): void {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error('Error clearing localStorage state', e);
    }
  }
};
