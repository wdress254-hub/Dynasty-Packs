/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C';

export type Era = '1950s' | '1960s' | '1970s' | '1980s' | '1990s' | '2000s' | '2010s' | 'Modern';

export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export type Archetype = 'Scorer' | 'Playmaker' | 'Defender' | 'Big Man' | 'Sharpshooter' | 'All-Rounder';

export interface PlayerStats {
  scoring: number;       // PTS impact
  playmaking: number;    // AST IQ
  rebounding: number;    // REB strength
  defense: number;       // DEF rating
  shooting3PT: number;   // 3PT shooting
  shootingMid: number;   // Mid-range
  shootingFT: number;    // Free throw
  speed: number;         // Pace impact
  strength: number;      // Matchup power
  vertical: number;      // Finishing/blocking
  stamina: number;       // Fatigue resistance (base max is 100)
}

export interface PlayerHiddenAttributes {
  clutch: number;            // Performance boost in close 4th quarters
  consistency: number;       // RNG variance reducer
  injuryResistance: number;  // Lowers chance of injury during sim
  leadership: number;        // Chemistry boost
}

export type PlayerTrait =
  | 'Hall of Fame'
  | 'MVP Tier'
  | 'Defensive Anchor'
  | 'Sharpshooter'
  | 'Playmaking Genius'
  | 'Rim Protector'
  | 'Era Dominator'
  | 'Clutch Gene';

// Player template representing a static historical player
export interface PlayerTemplate {
  id: string; // e.g. "mj-90s"
  name: string;
  era: Era;
  primaryPosition: Position;
  secondaryPosition?: Position;
  archetype: Archetype;
  teamHistory: string;
  baseStats: PlayerStats;
  hiddenAttributes: PlayerHiddenAttributes;
  traits: PlayerTrait[];
  baseOvr: number;
}

// Active player card owned by the user
export interface PlayerCard {
  id: string;               // Unique card instance ID (e.g., GUID or timestamp)
  templateId: string;       // References the PlayerTemplate
  name: string;
  era: Era;
  primaryPosition: Position;
  secondaryPosition?: Position;
  archetype: Archetype;
  teamHistory: string;
  rarity: Rarity;
  stats: PlayerStats;       // Current stats (base + upgrades)
  hiddenAttributes: PlayerHiddenAttributes;
  traits: PlayerTrait[];
  ovr: number;              // Calculated overall rating (0-99)
  evolutionTier: number;    // 1, 2, or 3
  isLegacy: boolean;        // Persistent card flag for Rebirth / New Game+
  upgradePointsSpent: number; // Tracker for total spent upgrades
  isInjured: boolean;       // Injury state (temporary during season)
  injuryDuration: number;   // Games remaining for injury
  gamesPlayed?: number;     // Current season tracking
  pointsAvg?: number;
  assistsAvg?: number;
  reboundsAvg?: number;
  isFreeAgent?: boolean;    // Is this a signed free agent card?
  level?: number;           // RPG level (e.g., 1-10)
  xp?: number;              // Current XP progress
  xpToNextLevel?: number;   // XP needed to level up
}

// Roster Slot Definitions
export interface Roster {
  starters: {
    PG: PlayerCard | null;
    SG: PlayerCard | null;
    SF: PlayerCard | null;
    PF: PlayerCard | null;
    C: PlayerCard | null;
  };
  bench: PlayerCard[]; // Minimum 3 players, stores up to any length
}

// Pack configurations
export interface PackType {
  id: string;
  name: string;
  description: string;
  cost: number;
  cardCount: number;
  rarityWeights: Record<Rarity, number>; // Weights out of 100
  guaranteeRule?: string; // Descriptive text
  type: 'basic' | 'standard' | 'premium' | 'elite' | 'stat' | 'era';
  subType?: string; // e.g. 'Scoring', '1980s'
  icon: string;     // Lucide icon key
  color: string;    // CSS Tailwind classes for border/glow
}

// Standings row
export interface TeamStanding {
  id: string;
  name: string;
  isPlayer: boolean;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  streak: number; // positive for wins, negative for losses
  conference: 'East' | 'West';
}

// Playoff bracket structures
export interface PlayoffMatchup {
  id: string;
  round: number; // 1 (Quarterfinals), 2 (Semifinals), 3 (Finals)
  team1Id: string;
  team2Id: string;
  team1Wins: number;
  team2Wins: number;
  winnerId: string | null;
  games: GameResult[];
}

export interface GameResult {
  gameNumber: number;
  team1Score: number;
  team2Score: number;
  isPlayerWin: boolean;
  playerStats?: Record<string, BoxScoreStats>; // player ID to stats
  opponentStats?: Record<string, BoxScoreStats>; // opponent player ID to stats
  opponentPlayers?: PlayerCard[]; // list of opponent players who played
}

export interface BoxScoreStats {
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  minutes: number;
}

export interface GameSettings {
  gamesPerSeason: number;
  xpMultiplier: number;
  coinsMultiplier: number;
  difficultyModifier: number;
}

// Complete game state for persistence
export interface GameState {
  year: number;                  // Current progression year
  coins: number;                 // Economy currency
  inventory: PlayerCard[];       // All owned player cards
  roster: Roster;                // Assigned active lineup
  seasonProgress: number;        // 0 to X games played
  standings: TeamStanding[];     // Standings for current year
  seasonSchedule: string[][];    // X games, each is [team1Id, team2Id]
  seasonGamesHistory: GameResult[]; // User's detailed game history for current season
  playoffsActive: boolean;       // Is playoff mode running
  playoffRound: number;          // 1, 2, or 3
  playoffBracket: PlayoffMatchup[]; // Playoff tree
  isSeasonCompleted: boolean;    // Has season finished (ended in champ or elimination)
  championshipsWon: number;      // Total historic championships for Rebirth
  upgradeTokens: number;         // Upgrade currency (or standard coins used)
  highestOvrReached: number;
  freeAgentsMarket: PlayerCard[]; // Low-rated available free agents
  aiTeamsRosters?: Record<string, Roster>; // AI teams rosters for user to view
  pendingDraftPicks?: number;    // Number of draft picks to make
  settings: GameSettings;        // Gameplay configuration tweaks
}

export interface FranchiseAccount {
  username: string;
  pin: string; // 4-digit PIN password
  gameState: GameState;
}
