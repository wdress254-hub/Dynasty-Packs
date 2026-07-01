/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PlayerCard,
  PlayerTemplate,
  Position,
  Rarity,
  Era,
  Archetype,
  PlayerTrait,
  Roster,
  PackType,
  TeamStanding,
  GameResult,
  BoxScoreStats,
  PlayoffMatchup,
  PlayerStats
} from '../types';
import { PLAYER_TEMPLATES, TEAM_NAMES, getRarityFromOvr } from '../data/players';

// Generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Calculate player card Overall Rating (OVR) based on current stats
export function calculateOvr(stats: PlayerStats, position: Position, archetype: Archetype): number {
  let weights = {
    scoring: 0.25,
    defense: 0.20,
    rebounding: 0.15,
    playmaking: 0.15,
    shooting: 0.15,
    athleticism: 0.10
  };

  // Adjust weights slightly based on position to make overall rating highly authentic
  if (position === 'PG' || position === 'SG') {
    weights = {
      scoring: 0.25,
      defense: 0.15,
      rebounding: 0.05,
      playmaking: 0.30,
      shooting: 0.15,
      athleticism: 0.10
    };
  } else if (position === 'C' || position === 'PF') {
    weights = {
      scoring: 0.20,
      defense: 0.25,
      rebounding: 0.30,
      playmaking: 0.05,
      shooting: 0.05,
      athleticism: 0.15
    };
  }

  const shootingAvg = (stats.shooting3PT + stats.shootingMid + stats.shootingFT) / 3;
  const athleticismAvg = (stats.speed + stats.strength + stats.vertical) / 3;

  const score =
    stats.scoring * weights.scoring +
    stats.defense * weights.defense +
    stats.rebounding * weights.rebounding +
    stats.playmaking * weights.playmaking +
    shootingAvg * weights.shooting +
    athleticismAvg * weights.athleticism;

  return Math.max(50, Math.min(99, Math.round(score)));
}

// Instantiate a PlayerCard from a PlayerTemplate
export function instantiateCard(template: PlayerTemplate): PlayerCard {
  const rarity = getRarityFromOvr(template.baseOvr);
  
  // RPG System: newly pulled cards start at a slightly lower level so players can train them up!
  // Scale varies by rarity so Legendary/Gold pull rewards remain incredibly impactful and prestigious.
  let scale = 0.88;
  if (rarity === 'Legendary') {
    scale = 0.96;
  } else if (rarity === 'Epic') {
    scale = 0.92;
  } else if (rarity === 'Rare') {
    scale = 0.88;
  } else {
    scale = 0.84;
  }

  const scaledStats = { ...template.baseStats };
  (Object.keys(scaledStats) as (keyof PlayerStats)[]).forEach(key => {
    scaledStats[key] = Math.max(30, Math.min(99, Math.round(template.baseStats[key] * scale)));
  });
  
  let startingOvr = calculateOvr(scaledStats, template.primaryPosition, template.archetype);

  // CRITICAL REQUIREMENT: Guarantee any Gold/Legendary card pulled is ALWAYS over 90 overall!
  if (rarity === 'Legendary' && startingOvr < 90) {
    let safety = 0;
    while (startingOvr < 90 && safety < 12) {
      (Object.keys(scaledStats) as (keyof PlayerStats)[]).forEach(key => {
        if (scaledStats[key] < 99) {
          scaledStats[key] = Math.min(99, scaledStats[key] + 1);
        }
      });
      startingOvr = calculateOvr(scaledStats, template.primaryPosition, template.archetype);
      safety++;
    }
  }

  return {
    id: generateId(),
    templateId: template.id,
    name: template.name,
    era: template.era,
    primaryPosition: template.primaryPosition,
    secondaryPosition: template.secondaryPosition,
    archetype: template.archetype,
    teamHistory: template.teamHistory,
    rarity: rarity,
    stats: scaledStats,
    hiddenAttributes: { ...template.hiddenAttributes },
    traits: [...template.traits],
    ovr: startingOvr,
    evolutionTier: 1,
    isLegacy: false,
    upgradePointsSpent: 0,
    isInjured: false,
    injuryDuration: 0,
    gamesPlayed: 0,
    pointsAvg: 0,
    assistsAvg: 0,
    reboundsAvg: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 100
  };
}

// PACK DEFINITIONS
export const PACK_TYPES: PackType[] = [
  {
    id: 'basic-pack',
    name: 'Basic Pack',
    description: 'Contains 3 players. Mostly role players, with a small chance at a star.',
    cost: 150,
    cardCount: 3,
    rarityWeights: { Common: 80, Rare: 18, Epic: 1.8, Legendary: 0.2 },
    type: 'basic',
    icon: 'Sparkles',
    color: 'border-zinc-500 shadow-zinc-500/20'
  },
  {
    id: 'standard-pack',
    name: 'Standard Pack',
    description: 'Contains 5 players. Balanced distribution with solid starter potential.',
    cost: 400,
    cardCount: 5,
    rarityWeights: { Common: 65, Rare: 26, Epic: 8, Legendary: 1 },
    type: 'standard',
    icon: 'Layers',
    color: 'border-blue-500 shadow-blue-500/25'
  },
  {
    id: 'premium-pack',
    name: 'Premium Pack',
    description: 'Contains 5 players. Guaranteed 1+ Rare/Epic. Higher star drop rates.',
    cost: 1000,
    cardCount: 5,
    rarityWeights: { Common: 30, Rare: 45, Epic: 18, Legendary: 7 },
    guaranteeRule: 'Guaranteed 1+ Rare or Epic card',
    type: 'premium',
    icon: 'Crown',
    color: 'border-purple-500 shadow-purple-500/30'
  },
  {
    id: 'elite-pack',
    name: 'Elite Pack',
    description: 'Contains 5 players. Guaranteed 1+ Elite Legendary (90+ OVR) player!',
    cost: 2500,
    cardCount: 5,
    rarityWeights: { Common: 10, Rare: 30, Epic: 40, Legendary: 20 },
    guaranteeRule: 'Guaranteed 1+ Legendary card',
    type: 'elite',
    icon: 'Trophy',
    color: 'border-yellow-500 shadow-yellow-500/40'
  },

  // Stat Packs
  {
    id: 'scoring-pack',
    name: 'Scoring Specialty Pack',
    description: 'Guarantees cards with superior offensive scoring power.',
    cost: 800,
    cardCount: 4,
    rarityWeights: { Common: 40, Rare: 35, Epic: 18, Legendary: 7 },
    type: 'stat',
    subType: 'Scorer',
    icon: 'Flame',
    color: 'border-red-500 shadow-red-500/30'
  },
  {
    id: 'defensive-pack',
    name: 'Defense Specialty Pack',
    description: 'Guarantees locks and rim protectors with outstanding defensive ratings.',
    cost: 800,
    cardCount: 4,
    rarityWeights: { Common: 40, Rare: 35, Epic: 18, Legendary: 7 },
    type: 'stat',
    subType: 'Defender',
    icon: 'ShieldAlert',
    color: 'border-emerald-500 shadow-emerald-500/30'
  },

  // Era Packs
  {
    id: 'era-80s-90s',
    name: '80s-90s Retro Pack',
    description: 'Exclusive pack containing players only from the physical 1980s and 1990s eras.',
    cost: 1200,
    cardCount: 4,
    rarityWeights: { Common: 35, Rare: 35, Epic: 20, Legendary: 10 },
    type: 'era',
    subType: 'Retro', // Handled custom
    icon: 'History',
    color: 'border-orange-500 shadow-orange-500/30'
  },
  {
    id: 'era-modern',
    name: 'Modern Space Pack',
    description: 'Exclusive pack containing spacing-era sharpshooters and modern stars.',
    cost: 1200,
    cardCount: 4,
    rarityWeights: { Common: 35, Rare: 35, Epic: 20, Legendary: 10 },
    type: 'era',
    subType: 'Modern', // Handled custom
    icon: 'Zap',
    color: 'border-cyan-500 shadow-cyan-500/30'
  }
];

// Open a Pack: Uses weighted RNG to determine cards
export function openPack(pack: PackType, templates: PlayerTemplate[]): PlayerCard[] {
  const cardsOpened: PlayerCard[] = [];

  for (let i = 0; i < pack.cardCount; i++) {
    // Check guarantee rule on the last card
    let selectedRarity: Rarity = 'Common';
    const rand = Math.random() * 100;

    if (i === pack.cardCount - 1 && pack.type === 'elite') {
      selectedRarity = 'Legendary';
    } else if (i === pack.cardCount - 1 && pack.type === 'premium') {
      // Guaranteed Rare, Epic or Legendary
      selectedRarity = Math.random() < 0.25 ? 'Legendary' : (Math.random() < 0.5 ? 'Epic' : 'Rare');
    } else {
      // General weights
      let accumulated = 0;
      const rWeights = pack.rarityWeights;
      for (const rarity of ['Common', 'Rare', 'Epic', 'Legendary'] as Rarity[]) {
        accumulated += rWeights[rarity];
        if (rand <= accumulated) {
          selectedRarity = rarity;
          break;
        }
      }
    }

    // Filter templates matching criteria
    let candidates = templates.filter(t => getRarityFromOvr(t.baseOvr) === selectedRarity);

    // If no templates match exactly, back off
    if (candidates.length === 0) {
      candidates = templates.filter(t => getRarityFromOvr(t.baseOvr) === 'Rare' || getRarityFromOvr(t.baseOvr) === 'Common');
    }

    // Apply pack filters
    if (pack.type === 'stat') {
      const archetypeFilter = pack.subType;
      const matched = candidates.filter(t => t.archetype === archetypeFilter || (archetypeFilter === 'Defender' && t.traits.includes('Defensive Anchor')));
      if (matched.length > 0) candidates = matched;
    } else if (pack.type === 'era') {
      if (pack.subType === 'Retro') {
        const matched = candidates.filter(t => t.era === '1980s' || t.era === '1990s' || t.era === '1970s');
        if (matched.length > 0) candidates = matched;
      } else if (pack.subType === 'Modern') {
        const matched = candidates.filter(t => t.era === '2010s' || t.era === 'Modern');
        if (matched.length > 0) candidates = matched;
      }
    }

    // Fallback if filters are too restrictive
    if (candidates.length === 0) {
      candidates = templates;
    }

    const rollTemplate = candidates[Math.floor(Math.random() * candidates.length)];
    cardsOpened.push(instantiateCard(rollTemplate));
  }

  return cardsOpened;
}

const FIRST_NAMES = ['Marcus', 'David', 'James', 'Tariq', 'Tyler', 'Luke', 'DeAndre', 'Malik', 'Zach', 'Xavier', 'Jaden', 'Isaiah', 'Devin', 'Brandon', 'Cole', 'Austin', 'Justin', 'RJ', 'Trevor', 'Derrick'];
const LAST_NAMES = ['Jennings', 'Patterson', 'Rivers', 'Foster', 'Vance', 'Simmons', 'Washington', 'Griffin', 'Bridges', 'Calderon', 'Okoye', 'McDaniel', 'Barrett', 'Redd', 'Starks', 'Garrity', 'Szczerbiak', 'Outlaw', 'Divac', 'Lafrentz'];

// Generate a randomized pool of low-rated free agents (55 to 75 OVR, with 5% chance of rolling exactly 80)
export function generateDraftProspects(year: number, count: number = 3): PlayerCard[] {
  const positions: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];
  const prospects: PlayerCard[] = [];

  for (let i = 0; i < count; i++) {
    const pos = positions[Math.floor(Math.random() * positions.length)];
    const fName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const name = `${fName} ${lName}`;

    // Draft prospects have high OVR (75-90) and good potential
    const targetOvr = Math.floor(Math.random() * 16) + 75; // 75 to 90

    const archetypes: Archetype[] = ['Scorer', 'Playmaker', 'Defender', 'Big Man', 'Sharpshooter', 'All-Rounder'];
    let archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
    if (pos === 'C' && archetype === 'Playmaker') archetype = 'Big Man';
    if (pos === 'PG' && archetype === 'Big Man') archetype = 'Playmaker';

    const rarity: Rarity = targetOvr >= 85 ? 'Legendary' : (targetOvr >= 80 ? 'Epic' : 'Rare');

    const baseStats: PlayerStats = {
      scoring: Math.max(50, targetOvr + Math.floor(Math.random() * 10) - 5),
      playmaking: Math.max(50, targetOvr + Math.floor(Math.random() * 10) - 5),
      rebounding: Math.max(50, targetOvr + Math.floor(Math.random() * 10) - 5),
      defense: Math.max(50, targetOvr + Math.floor(Math.random() * 10) - 5),
      shooting3PT: Math.max(30, targetOvr + Math.floor(Math.random() * 20) - 12),
      shootingMid: Math.max(40, targetOvr + Math.floor(Math.random() * 10) - 5),
      shootingFT: Math.max(50, targetOvr + Math.floor(Math.random() * 10) - 5),
      speed: Math.max(50, targetOvr + Math.floor(Math.random() * 10) - 5),
      strength: Math.max(50, targetOvr + Math.floor(Math.random() * 10) - 5),
      vertical: Math.max(50, targetOvr + Math.floor(Math.random() * 10) - 5),
      stamina: Math.max(60, 70 + Math.floor(Math.random() * 15) - 5)
    };

    if (pos === 'PG') {
      baseStats.playmaking += 15;
      baseStats.speed += 8;
      baseStats.rebounding = Math.max(25, baseStats.rebounding - 15);
    } else if (pos === 'SG') {
      baseStats.shooting3PT += 15;
      baseStats.scoring += 6;
    } else if (pos === 'SF') {
      baseStats.speed += 5;
    } else if (pos === 'PF') {
      baseStats.rebounding += 10;
      baseStats.strength += 8;
      baseStats.shooting3PT = Math.max(20, baseStats.shooting3PT - 10);
    } else if (pos === 'C') {
      baseStats.rebounding += 18;
      baseStats.defense += 8;
      baseStats.strength += 12;
      baseStats.speed = Math.max(30, baseStats.speed - 12);
      baseStats.shooting3PT = Math.max(10, baseStats.shooting3PT - 25);
    }

    const ovr = calculateOvr(baseStats, pos, archetype);

    const traits: PlayerTrait[] = [];
    if (ovr > 85) traits.push('Clutch Gene');
    if (ovr > 88) traits.push('Era Dominator');

    prospects.push({
      id: `draft-${generateId()}`,
      templateId: 'draft-prospect',
      name,
      era: 'Modern',
      primaryPosition: pos,
      archetype,
      teamHistory: `Drafted in Year ${year}`,
      rarity,
      stats: baseStats,
      hiddenAttributes: { clutch: 75, consistency: 75, injuryResistance: 80, leadership: 60 },
      traits,
      ovr,
      evolutionTier: 1,
      isLegacy: false,
      upgradePointsSpent: 0,
      isInjured: false,
      injuryDuration: 0,
      isFreeAgent: false
    });
  }

  return prospects;
}

export function generateFreeAgents(year: number): PlayerCard[] {
  const positions: Position[] = ['PG', 'SG', 'SF', 'PF', 'C', 'PG', 'SF', 'C'];
  // We keep exactly 6 free agents available in the pool
  const freeAgents: PlayerCard[] = [];
  const selectedPositions = positions.slice(0, 6);

  selectedPositions.forEach((pos, idx) => {
    const fName = FIRST_NAMES[(Math.floor(Math.random() * FIRST_NAMES.length) + idx) % FIRST_NAMES.length];
    const lName = LAST_NAMES[(Math.floor(Math.random() * LAST_NAMES.length) + idx) % LAST_NAMES.length];
    const name = `${fName} ${lName}`;

    // Roll overall rating: 55-75. Very rarely (5% chance) roll exactly 80.
    const roll80 = Math.random() < 0.05;
    const targetOvr = roll80 ? 80 : Math.floor(Math.random() * 21) + 55; // 55 to 75

    // Archetype selection
    const archetypes: Archetype[] = ['Scorer', 'Playmaker', 'Defender', 'Big Man', 'Sharpshooter', 'All-Rounder'];
    let archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
    if (pos === 'C' && archetype === 'Playmaker') archetype = 'Big Man';
    if (pos === 'PG' && archetype === 'Big Man') archetype = 'Playmaker';

    // Rarity determination
    const rarity: Rarity = targetOvr >= 80 ? 'Epic' : (targetOvr >= 70 ? 'Rare' : 'Common');

    // Create appropriate stats that average around the target OVR
    const baseStats: PlayerStats = {
      scoring: Math.max(30, targetOvr + Math.floor(Math.random() * 10) - 5),
      playmaking: Math.max(30, targetOvr + Math.floor(Math.random() * 10) - 5),
      rebounding: Math.max(30, targetOvr + Math.floor(Math.random() * 10) - 5),
      defense: Math.max(30, targetOvr + Math.floor(Math.random() * 10) - 5),
      shooting3PT: Math.max(15, targetOvr + Math.floor(Math.random() * 20) - 12),
      shootingMid: Math.max(25, targetOvr + Math.floor(Math.random() * 10) - 5),
      shootingFT: Math.max(35, targetOvr + Math.floor(Math.random() * 10) - 5),
      speed: Math.max(30, targetOvr + Math.floor(Math.random() * 10) - 5),
      strength: Math.max(30, targetOvr + Math.floor(Math.random() * 10) - 5),
      vertical: Math.max(30, targetOvr + Math.floor(Math.random() * 10) - 5),
      stamina: Math.max(50, 70 + Math.floor(Math.random() * 10) - 5)
    };

    // Adjust stats by position
    if (pos === 'PG') {
      baseStats.playmaking += 15;
      baseStats.speed += 8;
      baseStats.rebounding = Math.max(15, baseStats.rebounding - 15);
    } else if (pos === 'SG') {
      baseStats.shooting3PT += 15;
      baseStats.scoring += 6;
    } else if (pos === 'SF') {
      baseStats.speed += 5;
    } else if (pos === 'PF') {
      baseStats.rebounding += 10;
      baseStats.strength += 8;
      baseStats.shooting3PT = Math.max(15, baseStats.shooting3PT - 10);
    } else if (pos === 'C') {
      baseStats.rebounding += 18;
      baseStats.defense += 8;
      baseStats.strength += 12;
      baseStats.speed = Math.max(20, baseStats.speed - 12);
      baseStats.shooting3PT = Math.max(5, baseStats.shooting3PT - 25);
    }

    const traits: PlayerTrait[] = [];
    if (targetOvr >= 80) {
      traits.push('Clutch Gene');
    }

    // Recalculate OVR precisely
    const preciseOvr = calculateOvr(baseStats, pos, archetype);

    freeAgents.push({
      id: `fa-${generateId()}`,
      templateId: 'free-agent-placeholder',
      name,
      era: 'Modern',
      primaryPosition: pos,
      archetype,
      teamHistory: 'Free Agent',
      rarity,
      stats: baseStats,
      hiddenAttributes: {
        clutch: Math.floor(Math.random() * 30) + 45,
        consistency: Math.floor(Math.random() * 30) + 45,
        injuryResistance: Math.floor(Math.random() * 30) + 60,
        leadership: Math.floor(Math.random() * 35) + 40
      },
      traits,
      ovr: preciseOvr,
      evolutionTier: 1,
      isLegacy: false,
      upgradePointsSpent: 0,
      isInjured: false,
      injuryDuration: 0,
      gamesPlayed: 0,
      pointsAvg: 0,
      assistsAvg: 0,
      reboundsAvg: 0,
      isFreeAgent: true,
      level: 1,
      xp: 0,
      xpToNextLevel: 100
    });
  });

  return freeAgents;
}

// Calculate team Chemistry & Position penalties
export interface ChemistryAnalysis {
  score: number; // 0-100 scale
  eraMatches: number;
  archetypeSynergies: number;
  leadersCount: number;
  warnings: string[];
  bonuses: string[];
}

export function analyzeLineup(roster: Roster): ChemistryAnalysis {
  const starters = Object.entries(roster.starters) as [Position, PlayerCard | null][];
  const activePlayers = starters.filter(([_, p]) => p !== null).map(([_, p]) => p!) as PlayerCard[];

  let score = 50; // Starting base
  const warnings: string[] = [];
  const bonuses: string[] = [];

  if (activePlayers.length === 0) {
    return { score: 0, eraMatches: 0, archetypeSynergies: 0, leadersCount: 0, warnings, bonuses };
  }

  // 1. Position Validation
  starters.forEach(([slotPos, player]) => {
    if (!player) {
      warnings.push(`Empty slot at ${slotPos}`);
      return;
    }

    const isPrimaryMatch = player.primaryPosition === slotPos;
    const isSecondaryMatch = player.secondaryPosition === slotPos;

    if (!isPrimaryMatch && !isSecondaryMatch) {
      warnings.push(`${player.name} is playing out of position at ${slotPos} (-20% Penalty)`);
      score -= 10;
    } else if (isPrimaryMatch) {
      score += 4; // Bonus for perfect starting position
    } else {
      score += 2; // Minor bonus for secondary position
    }
  });

  // 2. Era Harmony
  const eras = activePlayers.map(p => p.era);
  const eraCounts: Record<string, number> = {};
  eras.forEach(e => { eraCounts[e] = (eraCounts[e] || 0) + 1; });

  let maxEraCombo = 0;
  Object.entries(eraCounts).forEach(([era, count]) => {
    if (count > maxEraCombo) maxEraCombo = count;
  });

  if (maxEraCombo >= 3) {
    const matchingEra = Object.keys(eraCounts).find(k => eraCounts[k] === maxEraCombo);
    const boost = maxEraCombo * 4;
    score += boost;
    bonuses.push(`Era Synergy: ${maxEraCombo} players from ${matchingEra} (+${boost} Chem)`);
  }

  // 3. Archetype Synergy
  // Pairings: Defender + Defender (Defensive Wall), Playmaker + Scorer (Duo), Big Man + Sharpshooter (Inside-Out)
  const archetypes = activePlayers.map(p => p.archetype);
  let scoringGenius = archetypes.filter(a => a === 'Scorer').length;
  let playmakerGenius = archetypes.filter(a => a === 'Playmaker').length;
  let defenderGenius = archetypes.filter(a => a === 'Defender').length;
  let bigManCount = archetypes.filter(a => a === 'Big Man').length;
  let shooterCount = archetypes.filter(a => a === 'Sharpshooter').length;

  if (playmakerGenius >= 1 && scoringGenius >= 1) {
    score += 8;
    bonuses.push("Pick & Roll Synergy: Playmaker + Elite Scorer present (+8 Chem)");
  }
  if (defenderGenius >= 2) {
    score += 10;
    bonuses.push("Lockdown Fortress: Multiple defensive stalwarts on court (+10 Chem)");
  }
  if (bigManCount >= 1 && shooterCount >= 1) {
    score += 8;
    bonuses.push("Inside-Out Spacing: Dominant big man with perimeter sharpshooter (+8 Chem)");
  }

  // 4. Leadership Bonus
  let leaders = 0;
  activePlayers.forEach(p => {
    if (p.traits.includes('Hall of Fame') || p.hiddenAttributes.leadership >= 90) {
      leaders++;
    }
  });

  if (leaders > 0) {
    const leadBoost = Math.min(15, leaders * 5);
    score += leadBoost;
    bonuses.push(`Veteran Leadership: ${leaders} general(s) guiding the floor (+${leadBoost} Chem)`);
  }

  // Bound the chemistry score between 0 and 100
  score = Math.max(10, Math.min(100, Math.round(score)));

  return {
    score,
    eraMatches: maxEraCombo,
    archetypeSynergies: (playmakerGenius && scoringGenius ? 1 : 0) + (defenderGenius >= 2 ? 1 : 0),
    leadersCount: leaders,
    warnings,
    bonuses
  };
}

// Calculate the effective OVR of a card including chemistry, position penalties, and stamina
export function getEffectiveOvr(card: PlayerCard, slotPos: Position, chemistryScore: number, stamina: number): number {
  let effective = card.ovr;

  // Position Penalty (-20% if played in wrong position)
  const isPrimary = card.primaryPosition === slotPos;
  const isSecondary = card.secondaryPosition === slotPos;
  if (!isPrimary && !isSecondary) {
    effective *= 0.80;
  } else if (isPrimary) {
    effective *= 1.05; // 5% bonus for slot match
  }

  // Chemistry Impact (Max +5% at 100 chemistry, Max -10% at low chemistry)
  const chemMultiplier = 0.90 + (chemistryScore / 100) * 0.15; // scales from 0.90 to 1.05
  effective *= chemMultiplier;

  // Stamina Impact (stamina scales from 0 to 100, below 70 we start losing stats)
  if (stamina < 70) {
    const staminaPenalty = 1.0 - ((70 - stamina) / 70) * 0.25; // up to -25% penalty at 0 stamina
    effective *= staminaPenalty;
  }

  return Math.max(40, Math.min(99, Math.round(effective)));
}

// SIMULATION ENGINE
export interface GameSimEngineInput {
  playerTeam: Roster;
  opponentTeamName: string;
  opponentOvr: number; // AI strength
  difficultyMultiplier: number; // For Rebirth
  chemistry: number;
}

// Run a complete 4-quarter basketball game simulation returning box score and score
// Run a complete 4-quarter basketball game simulation returning box score and score
export function simulateBasketballGame(input: GameSimEngineInput): GameResult {
  const starters = Object.entries(input.playerTeam.starters) as [Position, PlayerCard | null][];
  const playerLineup = starters.filter(([_, p]) => p !== null).map(([pos, p]) => ({ slot: pos, card: p! }));

  const bench = [...input.playerTeam.bench].filter(b => b !== null);

  // Generate Opponent's roster and starting lineup to simulate detailed opponent stats
  const opponentRoster = generateAiTeamRoster(input.opponentTeamName, input.opponentOvr);
  const oppStarters = Object.entries(opponentRoster.starters) as [Position, PlayerCard | null][];
  const oppLineup = oppStarters.filter(([_, p]) => p !== null).map(([pos, p]) => ({ slot: pos, card: p! }));
  const oppBench = [...opponentRoster.bench].filter(b => b !== null);

  // Keep track of active player stats for ALL players on roster (starters + bench)
  const boxScore: Record<string, BoxScoreStats> = {};
  playerLineup.forEach(({ card }) => {
    boxScore[card.id] = { points: 0, assists: 0, rebounds: 0, steals: 0, blocks: 0, minutes: 0 };
  });
  bench.forEach(card => {
    boxScore[card.id] = { points: 0, assists: 0, rebounds: 0, steals: 0, blocks: 0, minutes: 0 };
  });

  // Keep track of active opponent player stats for ALL opponent players (starters + bench)
  const boxScoreOpponent: Record<string, BoxScoreStats> = {};
  oppLineup.forEach(({ card }) => {
    boxScoreOpponent[card.id] = { points: 0, assists: 0, rebounds: 0, steals: 0, blocks: 0, minutes: 0 };
  });
  oppBench.forEach(card => {
    boxScoreOpponent[card.id] = { points: 0, assists: 0, rebounds: 0, steals: 0, blocks: 0, minutes: 0 };
  });

  // Track stamina of ALL roster players (starters and bench)
  const playerStamina: Record<string, number> = {};
  playerLineup.forEach(({ card }) => { playerStamina[card.id] = 100; });
  bench.forEach(card => { playerStamina[card.id] = 100; });

  const oppStamina: Record<string, number> = {};
  oppLineup.forEach(({ card }) => { oppStamina[card.id] = 100; });
  oppBench.forEach(card => { oppStamina[card.id] = 100; });

  // Sets to track which starting players are currently sitting on the bench to recover
  const playerRestingStarters = new Set<string>();
  const oppRestingStarters = new Set<string>();

  let playerTotalScore = 0;
  let opponentTotalScore = 0;
  let momentum = 0; // Negative for opponent, positive for player

  // Simulate 4 quarters (and potential overtime periods if tied!)
  let q = 1;
  while (q <= 4 || playerTotalScore === opponentTotalScore) {
    const isOT = q > 4;
    const quarterMinutes = isOT ? 5 : 12;

    // Simulate minute-by-minute segments to manage fatigue, clutch, and player statistics
    for (let m = 0; m < quarterMinutes; m++) {
      // 1. Determine active player lineup on court for this minute
      const activePlayerLineup: { slot: Position; card: PlayerCard }[] = [];
      const busyPlayerBenchIds = new Set<string>();

      playerLineup.forEach(({ slot, card }) => {
        let activeCard = card;
        const starterId = card.id;

        if (playerRestingStarters.has(starterId)) {
          // Starter is resting. Check if they have recovered to >= 90 stamina
          if (playerStamina[starterId] >= 90) {
            playerRestingStarters.delete(starterId);
            activeCard = card;
          } else {
            // Find an available bench player to play this slot position if possible
            const availableBench = bench.filter(b => !busyPlayerBenchIds.has(b.id));
            const bestBackup = availableBench.find(b => b.primaryPosition === slot || b.secondaryPosition === slot) 
              || availableBench[0];

            if (bestBackup && playerStamina[bestBackup.id] > 65) {
              activeCard = bestBackup;
              busyPlayerBenchIds.add(bestBackup.id);
            } else {
              // No fresh bench player available, starter has to step back on court
              playerRestingStarters.delete(starterId);
              activeCard = card;
            }
          }
        } else {
          // Starter is playing. Check if they are fatigued (< 80) and we can rest them
          if (playerStamina[starterId] < 80 && bench.length > 0) {
            const availableBench = bench.filter(b => !busyPlayerBenchIds.has(b.id));
            const bestBackup = availableBench.find(b => b.primaryPosition === slot || b.secondaryPosition === slot) 
              || availableBench[0];

            if (bestBackup && playerStamina[bestBackup.id] > 65) {
              activeCard = bestBackup;
              busyPlayerBenchIds.add(bestBackup.id);
              playerRestingStarters.add(starterId);
            }
          }
        }
        activePlayerLineup.push({ slot, card: activeCard });
      });

      // 2. Determine active opponent lineup on court for this minute
      const activeOppLineup: { slot: Position; card: PlayerCard }[] = [];
      const busyOppBenchIds = new Set<string>();

      oppLineup.forEach(({ slot, card }) => {
        let activeCard = card;
        const starterId = card.id;

        if (oppRestingStarters.has(starterId)) {
          // Opponent Starter is resting. Check if they have recovered to >= 90 stamina
          if (oppStamina[starterId] >= 90) {
            oppRestingStarters.delete(starterId);
            activeCard = card;
          } else {
            // Find an available bench player to play this slot position if possible
            const availableBench = oppBench.filter(b => !busyOppBenchIds.has(b.id));
            const bestBackup = availableBench.find(b => b.primaryPosition === slot || b.secondaryPosition === slot) 
              || availableBench[0];

            if (bestBackup && oppStamina[bestBackup.id] > 65) {
              activeCard = bestBackup;
              busyOppBenchIds.add(bestBackup.id);
            } else {
              // No fresh bench player available, starter has to play
              oppRestingStarters.delete(starterId);
              activeCard = card;
            }
          }
        } else {
          // Opponent Starter is playing. Check if they are fatigued (< 80) and we can rest them
          if (oppStamina[starterId] < 80 && oppBench.length > 0) {
            const availableBench = oppBench.filter(b => !busyOppBenchIds.has(b.id));
            const bestBackup = availableBench.find(b => b.primaryPosition === slot || b.secondaryPosition === slot) 
              || availableBench[0];

            if (bestBackup && oppStamina[bestBackup.id] > 65) {
              activeCard = bestBackup;
              busyOppBenchIds.add(bestBackup.id);
              oppRestingStarters.add(starterId);
            }
          }
        }
        activeOppLineup.push({ slot, card: activeCard });
      });

      // Track active on-court IDs for stamina tracking
      const activePlayerOnCourtIds = new Set(activePlayerLineup.map(item => item.card.id));
      const activeOppOnCourtIds = new Set(activeOppLineup.map(item => item.card.id));

      // Calculate Player Team offensive/defensive powers for this minute
      let playerOff = 0;
      let playerDef = 0;
      let playerReb = 0;

      activePlayerLineup.forEach(({ slot, card }) => {
        // Track minutes
        boxScore[card.id].minutes += 1;

        const effectiveOvr = getEffectiveOvr(card, slot, input.chemistry, playerStamina[card.id] || 90);
        playerOff += effectiveOvr * (card.stats.scoring / 90);
        playerDef += effectiveOvr * (card.stats.defense / 90);
        playerReb += card.stats.rebounding;
      });

      playerOff /= 5;
      playerDef /= 5;
      playerReb /= 5;

      // Calculate Opponent Team offensive/defensive powers for this minute
      const baseOpponentRating = input.opponentOvr * input.difficultyMultiplier;
      let oppOff = 0;
      let oppDef = 0;
      let oppReb = 0;

      activeOppLineup.forEach(({ slot, card }) => {
        // Track minutes
        boxScoreOpponent[card.id].minutes += 1;

        // Opponent is treated with standard chemistry of 80 and the dynamic stamina map
        const effectiveOvr = getEffectiveOvr(card, slot, 80, oppStamina[card.id] || 90);
        oppOff += effectiveOvr * (card.stats.scoring / 90);
        oppDef += effectiveOvr * (card.stats.defense / 90);
        oppReb += card.stats.rebounding;
      });

      oppOff = (oppOff / 5) * 1.0;
      oppDef = (oppDef / 5) * 0.98;
      oppReb = (oppReb / 5) * 1.0;

      // Clutch Factor in 4th Quarter/OT (close games, final minutes)
      let clutchBoost = 0;
      if (q >= 4 && Math.abs(playerTotalScore - opponentTotalScore) <= 6) {
        // Find players on court with high clutch or Clutch Gene
        activePlayerLineup.forEach(({ card }) => {
          if (card.traits.includes('Clutch Gene')) {
            clutchBoost += 8;
          }
          clutchBoost += (card.hiddenAttributes.clutch - 80) * 0.15;
        });
      }

      // Possessions determination (usually 1-2 per minute)
      const possessions = Math.random() > 0.5 ? 2 : 1;
      for (let p = 0; p < possessions; p++) {
        // PLAYER ATTACK
        const playerScoringChance = (playerOff + clutchBoost + momentum * 2) / (oppDef + playerOff + clutchBoost);
        const playerRoll = Math.random() + 0.15; // Favor player slightly at baseline
        if (playerRoll < playerScoringChance) {
          // Score! Determine who scored based on individual scoring ratings
          const totalScoringWeights = activePlayerLineup.reduce((acc, { card }) => acc + card.stats.scoring, 0);
          let scorerRoll = Math.random() * totalScoringWeights;
          let scorer = activePlayerLineup[0].card;

          for (const item of activePlayerLineup) {
            scorerRoll -= item.card.stats.scoring;
            if (scorerRoll <= 0) {
              scorer = item.card;
              break;
            }
          }

          // Point allocation (3PT vs 2PT)
          const isThree = Math.random() < (scorer.stats.shooting3PT / 200) + 0.1;
          const pointsGained = isThree ? 3 : 2;
          playerTotalScore += pointsGained;
          boxScore[scorer.id].points += pointsGained;

          // Assister allocation
          if (Math.random() < 0.65) {
            const passers = activePlayerLineup.filter(item => item.card.id !== scorer.id);
            if (passers.length > 0) {
              const totalPassWeights = passers.reduce((acc, item) => acc + item.card.stats.playmaking, 0);
              let passerRoll = Math.random() * totalPassWeights;
              let passer = passers[0].card;
              for (const item of passers) {
                passerRoll -= item.card.stats.playmaking;
                if (passerRoll <= 0) {
                  passer = item.card;
                  break;
                }
              }
              boxScore[passer.id].assists += 1;
            }
          }

          momentum = Math.min(5, momentum + 0.5);
        } else {
          // Opponent defensive stops (Blocks/Steals)
          if (Math.random() < 0.15) {
            const defenderIndex = Math.floor(Math.random() * activeOppLineup.length);
            const defender = activeOppLineup[defenderIndex].card;
            if (Math.random() > 0.5) {
              boxScoreOpponent[defender.id].steals += 1;
            } else {
              boxScoreOpponent[defender.id].blocks += 1;
            }
          }

          // Rebound on player miss
          const rebChance = playerReb / (playerReb + oppReb);
          if (Math.random() < rebChance) {
            // Player gets offensive rebound
            const totalRebWeights = activePlayerLineup.reduce((acc, { card }) => acc + card.stats.rebounding, 0);
            let rebRoll = Math.random() * totalRebWeights;
            let reber = activePlayerLineup[0].card;
            for (const item of activePlayerLineup) {
              rebRoll -= item.card.stats.rebounding;
              if (rebRoll <= 0) {
                reber = item.card;
                break;
              }
            }
            boxScore[reber.id].rebounds += 1;
          } else {
            // Opponent gets defensive rebound
            const totalOppRebWeights = activeOppLineup.reduce((acc, { card }) => acc + card.stats.rebounding, 0);
            let oppRebRoll = Math.random() * totalOppRebWeights;
            let oppReber = activeOppLineup[0].card;
            for (const item of activeOppLineup) {
              oppRebRoll -= item.card.stats.rebounding;
              if (oppRebRoll <= 0) {
                oppReber = item.card;
                break;
              }
            }
            boxScoreOpponent[oppReber.id].rebounds += 1;
          }
          momentum = Math.max(-5, momentum - 0.3);
        }

        // OPPONENT ATTACK
        const oppScoringChance = oppOff / (playerDef + oppOff + (momentum < 0 ? -momentum : 0));
        const oppRoll = Math.random() + 0.15;
        if (oppRoll < oppScoringChance) {
          const totalOppScoringWeights = activeOppLineup.reduce((acc, { card }) => acc + card.stats.scoring, 0);
          let oppScorerRoll = Math.random() * totalOppScoringWeights;
          let oppScorer = activeOppLineup[0].card;

          for (const item of activeOppLineup) {
            oppScorerRoll -= item.card.stats.scoring;
            if (oppScorerRoll <= 0) {
              oppScorer = item.card;
              break;
            }
          }

          const isThree = Math.random() < (oppScorer.stats.shooting3PT / 200) + 0.1;
          const pointsGained = isThree ? 3 : 2;
          opponentTotalScore += pointsGained;
          boxScoreOpponent[oppScorer.id].points += pointsGained;

          // Opponent Assister allocation
          if (Math.random() < 0.65) {
            const oppPassers = activeOppLineup.filter(item => item.card.id !== oppScorer.id);
            if (oppPassers.length > 0) {
              const totalOppPassWeights = oppPassers.reduce((acc, item) => acc + item.card.stats.playmaking, 0);
              let oppPasserRoll = Math.random() * totalOppPassWeights;
              let oppPasser = oppPassers[0].card;
              for (const item of oppPassers) {
                oppPasserRoll -= item.card.stats.playmaking;
                if (oppPasserRoll <= 0) {
                  oppPasser = item.card;
                  break;
                }
              }
              boxScoreOpponent[oppPasser.id].assists += 1;
            }
          }

          momentum = Math.max(-5, momentum - 0.5);
        } else {
          // Player defensive stop stats (Blocks/Steals)
          if (Math.random() < 0.15) {
            const defenderIndex = Math.floor(Math.random() * activePlayerLineup.length);
            const defender = activePlayerLineup[defenderIndex].card;
            if (Math.random() > 0.5) {
              boxScore[defender.id].steals += 1;
            } else if (defender.stats.defense > 75) {
              boxScore[defender.id].blocks += 1;
            }
          }

          // Defensive rebound
          if (Math.random() < 0.75) {
            const totalRebWeights = activePlayerLineup.reduce((acc, { card }) => acc + card.stats.rebounding, 0);
            let rebRoll = Math.random() * totalRebWeights;
            let reber = activePlayerLineup[0].card;
            for (const item of activePlayerLineup) {
              rebRoll -= item.card.stats.rebounding;
              if (rebRoll <= 0) {
                reber = item.card;
                break;
              }
            }
            boxScore[reber.id].rebounds += 1;
          } else {
            // Opponent offensive rebound
            const totalOppRebWeights = activeOppLineup.reduce((acc, { card }) => acc + card.stats.rebounding, 0);
            let oppRebRoll = Math.random() * totalOppRebWeights;
            let oppReber = activeOppLineup[0].card;
            for (const item of activeOppLineup) {
              oppRebRoll -= item.card.stats.rebounding;
              if (oppRebRoll <= 0) {
                oppReber = item.card;
                break;
              }
            }
            boxScoreOpponent[oppReber.id].rebounds += 1;
          }
          momentum = Math.min(5, momentum + 0.3);
        }
      }

      // 3. Deplete/recover stamina for ALL player and opponent cards based on active presence
      playerLineup.forEach(({ card }) => {
        const isOnCourt = activePlayerOnCourtIds.has(card.id);
        if (isOnCourt) {
          const depletionRate = 1.6 - (card.stats.stamina / 100) * 0.8;
          playerStamina[card.id] = Math.max(30, playerStamina[card.id] - depletionRate);
        } else {
          playerStamina[card.id] = Math.min(100, playerStamina[card.id] + 3.0);
        }
      });
      bench.forEach(card => {
        const isOnCourt = activePlayerOnCourtIds.has(card.id);
        if (isOnCourt) {
          const depletionRate = 1.6 - (card.stats.stamina / 100) * 0.8;
          playerStamina[card.id] = Math.max(30, playerStamina[card.id] - depletionRate);
        } else {
          playerStamina[card.id] = Math.min(100, playerStamina[card.id] + 3.0);
        }
      });

      oppLineup.forEach(({ card }) => {
        const isOnCourt = activeOppOnCourtIds.has(card.id);
        if (isOnCourt) {
          const depletionRate = 1.6 - (card.stats.stamina / 100) * 0.8;
          oppStamina[card.id] = Math.max(30, oppStamina[card.id] - depletionRate);
        } else {
          oppStamina[card.id] = Math.min(100, oppStamina[card.id] + 3.0);
        }
      });
      oppBench.forEach(card => {
        const isOnCourt = activeOppOnCourtIds.has(card.id);
        if (isOnCourt) {
          const depletionRate = 1.6 - (card.stats.stamina / 100) * 0.8;
          oppStamina[card.id] = Math.max(30, oppStamina[card.id] - depletionRate);
        } else {
          oppStamina[card.id] = Math.min(100, oppStamina[card.id] + 3.0);
        }
      });
    }

    // Stamina recovery during quarter break
    playerLineup.forEach(({ card }) => { playerStamina[card.id] = Math.min(100, playerStamina[card.id] + 15); });
    bench.forEach(card => { playerStamina[card.id] = Math.min(100, playerStamina[card.id] + 15); });
    oppLineup.forEach(({ card }) => { oppStamina[card.id] = Math.min(100, oppStamina[card.id] + 15); });
    oppBench.forEach(card => { oppStamina[card.id] = Math.min(100, oppStamina[card.id] + 15); });

    q++;
  }

  return {
    gameNumber: 0, // Will be set by controller
    team1Score: playerTotalScore,
    team2Score: opponentTotalScore,
    isPlayerWin: playerTotalScore > opponentTotalScore,
    playerStats: boxScore,
    opponentStats: boxScoreOpponent,
    opponentPlayers: [...oppLineup.map(item => item.card), ...oppBench]
  };
}

// Generate schedule for 16 teams over 82 games
export function generateSchedule(teamIds: string[], gamesPerSeason: number = 82): string[][] {
  const schedule: string[][] = [];
  const teamCount = teamIds.length;

  // Circle method to generate round robin rounds
  // To reach gamesPerSeason, we duplicate/cycle the round robin matchups
  const rounds: string[][] = [];
  const list = [...teamIds];

  for (let r = 0; r < (teamCount - 1) * 6; r++) { // Run 6 cycles of round robin
    for (let i = 0; i < teamCount / 2; i++) {
      const home = list[i];
      const away = list[teamCount - 1 - i];
      rounds.push([home, away]);
    }
    // Rotate list, keeping first element fixed
    const first = list[0];
    const rest = list.slice(1);
    const last = rest.pop()!;
    list.length = 0;
    list.push(first, last, ...rest);
  }

  // Slice to exactly gamesPerSeason games for the player's matches
  // Actually, schedule contains all player matches in sequence
  // Standings update dynamically
  return rounds.slice(0, gamesPerSeason);
}

// Generate 15 AI opponent teams with OVR scaled by difficulty
export function generateAiTeams(year: number): { id: string; name: string; ovr: number }[] {
  // lower base difficulty from 76+ to 66+ so player overalls are in high 60s / 70s, not all 80+
  const baseDifficulty = 66 + Math.min(25, year * 3.5); 
  return TEAM_NAMES.slice(1).map((name, idx) => {
    // Variance in team strength
    const variance = (idx % 3 === 0) ? 6 : ((idx % 2 === 0) ? 3 : -3);
    return {
      id: `ai-team-${idx}`,
      name: name,
      ovr: Math.max(62, Math.min(98, Math.round(baseDifficulty + variance)))
    };
  });
}

// Generate a roster of 5 starters and 1 (if year 1) or 3 (if year > 1) bench players for an AI team based on targetOvr
export function generateAiTeamRoster(teamName: string, targetOvr: number, year: number = 1): Roster {
  const positions: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];
  const starters: Record<Position, PlayerCard | null> = {
    PG: null,
    SG: null,
    SF: null,
    PF: null,
    C: null
  };
  const bench: PlayerCard[] = [];

  // Filter templates by positions to select candidates
  positions.forEach((pos, idx) => {
    let candidates = PLAYER_TEMPLATES.filter(p => p.primaryPosition === pos);
    if (candidates.length === 0) candidates = PLAYER_TEMPLATES;

    // Deterministic selection based on team name hash + index
    const seed = teamName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + idx;
    const template = candidates[seed % candidates.length];

    // Introduce realistic player-to-player rating variance so they are not all uniform
    const starterVariance = idx === 2 ? 4 : (idx % 2 === 0 ? 1 : -3);
    const starterOvr = Math.max(55, Math.min(99, Math.round(targetOvr + starterVariance)));

    // Instantiate as a PlayerCard with scaled stats matching the targetOvr
    starters[pos] = instantiateAiCard(template, starterOvr, `ai-${teamName}-${pos}-${idx}`);
  });

  // Generate bench players: 1 for year 1, 3 for year > 1
  const benchCount = year === 1 ? 1 : 3;
  for (let b = 0; b < benchCount; b++) {
    const pos = positions[b % positions.length];
    let candidates = PLAYER_TEMPLATES.filter(p => p.primaryPosition === pos);
    if (candidates.length === 0) candidates = PLAYER_TEMPLATES;

    const seed = teamName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + 10 + b;
    const template = candidates[seed % candidates.length];

    // Bench players are slightly lower rated than starters
    const benchOvr = Math.max(50, Math.min(95, targetOvr - 7 - b * 2));
    bench.push(instantiateAiCard(template, benchOvr, `ai-${teamName}-bench-${b}`));
  }

  return { starters: starters as any, bench };
}

// Helper to instantiate an AI card with scaled stats targeting a specific overall rating
function instantiateAiCard(template: PlayerTemplate, targetOvr: number, uniqueId: string): PlayerCard {
  const scale = targetOvr / template.baseOvr;
  const scaledStats: PlayerStats = { ...template.baseStats };
  (Object.keys(scaledStats) as (keyof PlayerStats)[]).forEach(key => {
    // scale stats proportionally, keeping them between 30 and 99
    scaledStats[key] = Math.max(30, Math.min(99, Math.round(template.baseStats[key] * scale)));
  });

  const rarity: Rarity = targetOvr >= 90 ? 'Legendary' : (targetOvr >= 83 ? 'Epic' : (targetOvr >= 78 ? 'Rare' : 'Common'));

  return {
    id: uniqueId,
    templateId: template.id,
    name: template.name,
    era: template.era,
    primaryPosition: template.primaryPosition,
    secondaryPosition: template.secondaryPosition,
    archetype: template.archetype,
    teamHistory: template.teamHistory,
    rarity,
    stats: scaledStats,
    hiddenAttributes: { ...template.hiddenAttributes },
    traits: [...template.traits],
    ovr: targetOvr,
    evolutionTier: 1,
    isLegacy: false,
    upgradePointsSpent: 0,
    isInjured: false,
    injuryDuration: 0,
    gamesPlayed: 0,
    pointsAvg: 0,
    assistsAvg: 0,
    reboundsAvg: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 100
  };
}

// Get AI-vs-AI matchups for a game day given all team IDs and the player's opponent on that day
export function getAiMatchupsForGameDay(teamIds: string[], playerOpponentId: string, gameDayIndex: number): string[][] {
  const activeAiTeams = teamIds.filter(id => id !== 'player-team' && id !== playerOpponentId); // should be exactly 14 teams
  
  const matchups: string[][] = [];
  const list = [...activeAiTeams];
  // Sort/rotate to vary matchups deterministically per gameDayIndex so everyone plays everyone
  const rotation = gameDayIndex % list.length;
  const rotated = [...list.slice(rotation), ...list.slice(0, rotation)];
  
  for (let i = 0; i < 7; i++) {
    matchups.push([rotated[i], rotated[13 - i]]);
  }
  
  return matchups;
}

// Gain XP and handle level up increments automatically
export function gainXpAndCheckLevelUp(card: PlayerCard, points: number, assists: number, rebounds: number, xpMultiplier: number = 1.0): { card: PlayerCard; leveledUp: boolean; xpGained: number } {
  const currentLvl = card.level || 1;
  const currentXp = card.xp || 0;
  
  // RPG XP Gained: base 15 XP + 1 XP per point + 1.5 XP per assist + 1.2 XP per rebound
  const xpGained = Math.round((15 + points + assists * 1.5 + rebounds * 1.2) * xpMultiplier);
  let newXp = currentXp + xpGained;
  let newLvl = currentLvl;
  let leveledUp = false;
  
  let xpNeeded = card.xpToNextLevel || 100;
  
  const stats = { ...card.stats };
  
  // Can level up multiple times if huge XP gained
  while (newXp >= xpNeeded) {
    newLvl += 1;
    newXp = newXp - xpNeeded;
    leveledUp = true;
    xpNeeded = 100 + (newLvl - 1) * 20; // level up scaling
    
    // Automatically boost 1-2 random stats to reinforce active RPG progression!
    const statKeys: (keyof PlayerCard['stats'])[] = ['scoring', 'playmaking', 'rebounding', 'defense'];
    const randomKey = statKeys[Math.floor(Math.random() * statKeys.length)];
    if (stats[randomKey] < 99) {
      stats[randomKey] = Math.min(99, stats[randomKey] + 1);
    }
    if (Math.random() > 0.5) {
      const secondKey = statKeys[Math.floor(Math.random() * statKeys.length)];
      if (stats[secondKey] < 99) {
        stats[secondKey] = Math.min(99, stats[secondKey] + 1);
      }
    }
  }
  
  const finalOvr = leveledUp 
    ? calculateOvr(stats, card.primaryPosition, card.archetype)
    : card.ovr;
    
  return {
    card: {
      ...card,
      level: newLvl,
      xp: newXp,
      xpToNextLevel: xpNeeded,
      stats,
      ovr: finalOvr
    },
    leveledUp,
    xpGained
  };
}
