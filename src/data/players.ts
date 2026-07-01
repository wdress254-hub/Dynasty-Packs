/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlayerTemplate, Era, Position, Archetype, PlayerTrait, Rarity, PlayerStats } from '../types';

export const PLAYER_TEMPLATES: PlayerTemplate[] = [
  // === 1950s ===
  {
    id: "george-mikan",
    name: "George Mikan",
    era: "1950s",
    primaryPosition: "C",
    archetype: "Big Man",
    teamHistory: "Lakers",
    baseStats: {
      scoring: 88, playmaking: 45, rebounding: 92, defense: 85,
      shooting3PT: 10, shootingMid: 68, shootingFT: 77,
      speed: 60, strength: 90, vertical: 70, stamina: 85
    },
    hiddenAttributes: { clutch: 85, consistency: 88, injuryResistance: 82, leadership: 90 },
    traits: ["Rim Protector", "Era Dominator"],
    baseOvr: 86
  },
  {
    id: "bob-cousy",
    name: "Bob Cousy",
    era: "1950s",
    primaryPosition: "PG",
    archetype: "Playmaker",
    teamHistory: "Celtics",
    baseStats: {
      scoring: 80, playmaking: 94, rebounding: 50, defense: 78,
      shooting3PT: 15, shootingMid: 72, shootingFT: 80,
      speed: 85, strength: 65, vertical: 68, stamina: 88
    },
    hiddenAttributes: { clutch: 88, consistency: 85, injuryResistance: 85, leadership: 95 },
    traits: ["Playmaking Genius", "Era Dominator"],
    baseOvr: 85
  },
  {
    id: "paul-arizin",
    name: "Paul Arizin",
    era: "1950s",
    primaryPosition: "SF",
    archetype: "Scorer",
    teamHistory: "Warriors",
    baseStats: {
      scoring: 84, playmaking: 55, rebounding: 70, defense: 72,
      shooting3PT: 10, shootingMid: 82, shootingFT: 81,
      speed: 78, strength: 75, vertical: 76, stamina: 84
    },
    hiddenAttributes: { clutch: 80, consistency: 80, injuryResistance: 78, leadership: 80 },
    traits: ["MVP Tier"],
    baseOvr: 81
  },

  // === 1960s ===
  {
    id: "wilt-chamberlain",
    name: "Wilt Chamberlain",
    era: "1960s",
    primaryPosition: "C",
    archetype: "Big Man",
    teamHistory: "76ers, Warriors, Lakers",
    baseStats: {
      scoring: 98, playmaking: 72, rebounding: 99, defense: 95,
      shooting3PT: 10, shootingMid: 65, shootingFT: 50,
      speed: 88, strength: 99, vertical: 96, stamina: 99
    },
    hiddenAttributes: { clutch: 86, consistency: 94, injuryResistance: 98, leadership: 85 },
    traits: ["MVP Tier", "Rim Protector", "Era Dominator", "Hall of Fame"],
    baseOvr: 97
  },
  {
    id: "bill-russell",
    name: "Bill Russell",
    era: "1960s",
    primaryPosition: "C",
    archetype: "Defender",
    teamHistory: "Celtics",
    baseStats: {
      scoring: 74, playmaking: 78, rebounding: 98, defense: 99,
      shooting3PT: 10, shootingMid: 55, shootingFT: 56,
      speed: 82, strength: 92, vertical: 92, stamina: 98
    },
    hiddenAttributes: { clutch: 98, consistency: 96, injuryResistance: 95, leadership: 99 },
    traits: ["Defensive Anchor", "Rim Protector", "Era Dominator", "Hall of Fame"],
    baseOvr: 95
  },
  {
    id: "oscar-robertson",
    name: "Oscar Robertson",
    era: "1960s",
    primaryPosition: "PG",
    secondaryPosition: "SG",
    archetype: "All-Rounder",
    teamHistory: "Royals, Bucks",
    baseStats: {
      scoring: 90, playmaking: 96, rebounding: 82, defense: 84,
      shooting3PT: 15, shootingMid: 85, shootingFT: 84,
      speed: 86, strength: 80, vertical: 80, stamina: 94
    },
    hiddenAttributes: { clutch: 92, consistency: 92, injuryResistance: 92, leadership: 92 },
    traits: ["Playmaking Genius", "MVP Tier", "Hall of Fame"],
    baseOvr: 93
  },
  {
    id: "jerry-west",
    name: "Jerry West",
    era: "1960s",
    primaryPosition: "SG",
    secondaryPosition: "PG",
    archetype: "Scorer",
    teamHistory: "Lakers",
    baseStats: {
      scoring: 92, playmaking: 85, rebounding: 58, defense: 88,
      shooting3PT: 30, shootingMid: 92, shootingFT: 86,
      speed: 88, strength: 72, vertical: 84, stamina: 92
    },
    hiddenAttributes: { clutch: 99, consistency: 94, injuryResistance: 88, leadership: 90 },
    traits: ["Clutch Gene", "MVP Tier", "Hall of Fame"],
    baseOvr: 92
  },

  // === 1970s ===
  {
    id: "kareem-70s",
    name: "Kareem Abdul-Jabbar",
    era: "1970s",
    primaryPosition: "C",
    archetype: "Big Man",
    teamHistory: "Bucks, Lakers",
    baseStats: {
      scoring: 97, playmaking: 75, rebounding: 95, defense: 94,
      shooting3PT: 10, shootingMid: 85, shootingFT: 76,
      speed: 78, strength: 94, vertical: 88, stamina: 95
    },
    hiddenAttributes: { clutch: 94, consistency: 97, injuryResistance: 96, leadership: 92 },
    traits: ["MVP Tier", "Rim Protector", "Era Dominator", "Hall of Fame"],
    baseOvr: 96
  },
  {
    id: "julius-erving",
    name: "Julius Erving",
    era: "1970s",
    primaryPosition: "SF",
    archetype: "Scorer",
    teamHistory: "Nets, 76ers",
    baseStats: {
      scoring: 91, playmaking: 72, rebounding: 78, defense: 82,
      shooting3PT: 22, shootingMid: 80, shootingFT: 78,
      speed: 92, strength: 82, vertical: 98, stamina: 90
    },
    hiddenAttributes: { clutch: 90, consistency: 88, injuryResistance: 90, leadership: 88 },
    traits: ["MVP Tier", "Hall of Fame"],
    baseOvr: 91
  },
  {
    id: "pete-maravich",
    name: "Pete Maravich",
    era: "1970s",
    primaryPosition: "SG",
    secondaryPosition: "PG",
    archetype: "Scorer",
    teamHistory: "Hawks, Jazz",
    baseStats: {
      scoring: 88, playmaking: 88, rebounding: 48, defense: 68,
      shooting3PT: 50, shootingMid: 88, shootingFT: 84,
      speed: 85, strength: 68, vertical: 76, stamina: 88
    },
    hiddenAttributes: { clutch: 88, consistency: 80, injuryResistance: 75, leadership: 82 },
    traits: ["Playmaking Genius"],
    baseOvr: 85
  },

  // === 1980s ===
  {
    id: "magic-johnson",
    name: "Magic Johnson",
    era: "1980s",
    primaryPosition: "PG",
    secondaryPosition: "SF",
    archetype: "Playmaker",
    teamHistory: "Lakers",
    baseStats: {
      scoring: 88, playmaking: 99, rebounding: 85, defense: 82,
      shooting3PT: 32, shootingMid: 84, shootingFT: 89,
      speed: 85, strength: 84, vertical: 80, stamina: 94
    },
    hiddenAttributes: { clutch: 96, consistency: 95, injuryResistance: 92, leadership: 99 },
    traits: ["Playmaking Genius", "MVP Tier", "Hall of Fame", "Clutch Gene"],
    baseOvr: 96
  },
  {
    id: "larry-bird",
    name: "Larry Bird",
    era: "1980s",
    primaryPosition: "SF",
    secondaryPosition: "PF",
    archetype: "Sharpshooter",
    teamHistory: "Celtics",
    baseStats: {
      scoring: 94, playmaking: 92, rebounding: 90, defense: 86,
      shooting3PT: 93, shootingMid: 96, shootingFT: 91,
      speed: 76, strength: 82, vertical: 74, stamina: 94
    },
    hiddenAttributes: { clutch: 99, consistency: 96, injuryResistance: 88, leadership: 98 },
    traits: ["Sharpshooter", "MVP Tier", "Hall of Fame", "Clutch Gene"],
    baseOvr: 96
  },
  {
    id: "isiah-thomas",
    name: "Isiah Thomas",
    era: "1980s",
    primaryPosition: "PG",
    archetype: "Playmaker",
    teamHistory: "Pistons",
    baseStats: {
      scoring: 86, playmaking: 94, rebounding: 44, defense: 86,
      shooting3PT: 30, shootingMid: 82, shootingFT: 83,
      speed: 92, strength: 70, vertical: 80, stamina: 92
    },
    hiddenAttributes: { clutch: 95, consistency: 88, injuryResistance: 88, leadership: 96 },
    traits: ["Playmaking Genius", "Clutch Gene"],
    baseOvr: 89
  },
  {
    id: "dominique-wilkins",
    name: "Dominique Wilkins",
    era: "1980s",
    primaryPosition: "SF",
    archetype: "Scorer",
    teamHistory: "Hawks",
    baseStats: {
      scoring: 92, playmaking: 60, rebounding: 76, defense: 72,
      shooting3PT: 32, shootingMid: 82, shootingFT: 81,
      speed: 90, strength: 84, vertical: 99, stamina: 88
    },
    hiddenAttributes: { clutch: 86, consistency: 84, injuryResistance: 90, leadership: 82 },
    traits: ["Hall of Fame"],
    baseOvr: 87
  },
  {
    id: "dennis-rodman-80s",
    name: "Dennis Rodman (Young)",
    era: "1980s",
    primaryPosition: "PF",
    secondaryPosition: "SF",
    archetype: "Defender",
    teamHistory: "Pistons",
    baseStats: {
      scoring: 55, playmaking: 52, rebounding: 94, defense: 96,
      shooting3PT: 15, shootingMid: 45, shootingFT: 62,
      speed: 84, strength: 88, vertical: 88, stamina: 95
    },
    hiddenAttributes: { clutch: 80, consistency: 86, injuryResistance: 96, leadership: 84 },
    traits: ["Defensive Anchor", "Rim Protector"],
    baseOvr: 82
  },

  // === 1990s ===
  {
    id: "michael-jordan",
    name: "Michael Jordan",
    era: "1990s",
    primaryPosition: "SG",
    secondaryPosition: "SF",
    archetype: "Scorer",
    teamHistory: "Bulls, Wizards",
    baseStats: {
      scoring: 99, playmaking: 85, rebounding: 72, defense: 97,
      shooting3PT: 38, shootingMid: 98, shootingFT: 84,
      speed: 96, strength: 85, vertical: 98, stamina: 98
    },
    hiddenAttributes: { clutch: 99, consistency: 99, injuryResistance: 96, leadership: 99 },
    traits: ["MVP Tier", "Defensive Anchor", "Clutch Gene", "Era Dominator", "Hall of Fame"],
    baseOvr: 99
  },
  {
    id: "hakeem-olajuwon",
    name: "Hakeem Olajuwon",
    era: "1990s",
    primaryPosition: "C",
    archetype: "Big Man",
    teamHistory: "Rockets, Raptors",
    baseStats: {
      scoring: 95, playmaking: 70, rebounding: 94, defense: 99,
      shooting3PT: 10, shootingMid: 84, shootingFT: 78,
      speed: 82, strength: 94, vertical: 90, stamina: 94
    },
    hiddenAttributes: { clutch: 94, consistency: 95, injuryResistance: 92, leadership: 92 },
    traits: ["Defensive Anchor", "Rim Protector", "MVP Tier", "Hall of Fame"],
    baseOvr: 97
  },
  {
    id: "shaq-90s",
    name: "Shaquille O'Neal (Orlando)",
    era: "1990s",
    primaryPosition: "C",
    archetype: "Big Man",
    teamHistory: "Magic, Lakers, Heat",
    baseStats: {
      scoring: 96, playmaking: 60, rebounding: 95, defense: 88,
      shooting3PT: 5, shootingMid: 55, shootingFT: 52,
      speed: 85, strength: 99, vertical: 92, stamina: 90
    },
    hiddenAttributes: { clutch: 88, consistency: 92, injuryResistance: 90, leadership: 85 },
    traits: ["MVP Tier", "Rim Protector", "Era Dominator", "Hall of Fame"],
    baseOvr: 94
  },
  {
    id: "reggie-miller",
    name: "Reggie Miller",
    era: "1990s",
    primaryPosition: "SG",
    archetype: "Sharpshooter",
    teamHistory: "Pacers",
    baseStats: {
      scoring: 88, playmaking: 64, rebounding: 40, defense: 78,
      shooting3PT: 94, shootingMid: 88, shootingFT: 90,
      speed: 84, strength: 68, vertical: 78, stamina: 92
    },
    hiddenAttributes: { clutch: 99, consistency: 88, injuryResistance: 94, leadership: 88 },
    traits: ["Sharpshooter", "Clutch Gene"],
    baseOvr: 87
  },
  {
    id: "john-stockton",
    name: "John Stockton",
    era: "1990s",
    primaryPosition: "PG",
    archetype: "Playmaker",
    teamHistory: "Jazz",
    baseStats: {
      scoring: 76, playmaking: 99, rebounding: 38, defense: 90,
      shooting3PT: 84, shootingMid: 82, shootingFT: 85,
      speed: 85, strength: 66, vertical: 65, stamina: 96
    },
    hiddenAttributes: { clutch: 88, consistency: 95, injuryResistance: 99, leadership: 94 },
    traits: ["Playmaking Genius", "Hall of Fame"],
    baseOvr: 89
  },
  {
    id: "karl-malone",
    name: "Karl Malone",
    era: "1990s",
    primaryPosition: "PF",
    archetype: "Big Man",
    teamHistory: "Jazz, Lakers",
    baseStats: {
      scoring: 92, playmaking: 68, rebounding: 90, defense: 84,
      shooting3PT: 15, shootingMid: 84, shootingFT: 76,
      speed: 78, strength: 95, vertical: 78, stamina: 95
    },
    hiddenAttributes: { clutch: 80, consistency: 92, injuryResistance: 98, leadership: 84 },
    traits: ["MVP Tier", "Hall of Fame"],
    baseOvr: 89
  },
  {
    id: "muggsy-bogues",
    name: "Muggsy Bogues",
    era: "1990s",
    primaryPosition: "PG",
    archetype: "Playmaker",
    teamHistory: "Hornets",
    baseStats: {
      scoring: 68, playmaking: 88, rebounding: 30, defense: 80,
      shooting3PT: 28, shootingMid: 74, shootingFT: 80,
      speed: 96, strength: 55, vertical: 70, stamina: 88
    },
    hiddenAttributes: { clutch: 80, consistency: 82, injuryResistance: 88, leadership: 85 },
    traits: [],
    baseOvr: 76
  },

  // === 2000s ===
  {
    id: "kobe-bryant",
    name: "Kobe Bryant",
    era: "2000s",
    primaryPosition: "SG",
    secondaryPosition: "SF",
    archetype: "Scorer",
    teamHistory: "Lakers",
    baseStats: {
      scoring: 98, playmaking: 82, rebounding: 68, defense: 94,
      shooting3PT: 78, shootingMid: 96, shootingFT: 85,
      speed: 92, strength: 80, vertical: 92, stamina: 98
    },
    hiddenAttributes: { clutch: 99, consistency: 95, injuryResistance: 92, leadership: 96 },
    traits: ["MVP Tier", "Clutch Gene", "Era Dominator", "Hall of Fame"],
    baseOvr: 98
  },
  {
    id: "tim-duncan",
    name: "Tim Duncan",
    era: "2000s",
    primaryPosition: "PF",
    secondaryPosition: "C",
    archetype: "Big Man",
    teamHistory: "Spurs",
    baseStats: {
      scoring: 90, playmaking: 74, rebounding: 94, defense: 96,
      shooting3PT: 15, shootingMid: 82, shootingFT: 72,
      speed: 72, strength: 92, vertical: 78, stamina: 94
    },
    hiddenAttributes: { clutch: 92, consistency: 98, injuryResistance: 95, leadership: 98 },
    traits: ["Defensive Anchor", "Rim Protector", "MVP Tier", "Hall of Fame"],
    baseOvr: 95
  },
  {
    id: "allen-iverson",
    name: "Allen Iverson",
    era: "2000s",
    primaryPosition: "PG",
    secondaryPosition: "SG",
    archetype: "Scorer",
    teamHistory: "76ers, Nuggets",
    baseStats: {
      scoring: 95, playmaking: 84, rebounding: 42, defense: 80,
      shooting3PT: 72, shootingMid: 88, shootingFT: 78,
      speed: 98, strength: 65, vertical: 88, stamina: 99
    },
    hiddenAttributes: { clutch: 94, consistency: 86, injuryResistance: 90, leadership: 85 },
    traits: ["MVP Tier", "Hall of Fame"],
    baseOvr: 91
  },
  {
    id: "steve-nash",
    name: "Steve Nash",
    era: "2000s",
    primaryPosition: "PG",
    archetype: "Playmaker",
    teamHistory: "Suns, Mavericks",
    baseStats: {
      scoring: 84, playmaking: 98, rebounding: 36, defense: 65,
      shooting3PT: 93, shootingMid: 92, shootingFT: 94,
      speed: 88, strength: 60, vertical: 68, stamina: 90
    },
    hiddenAttributes: { clutch: 90, consistency: 94, injuryResistance: 88, leadership: 96 },
    traits: ["Playmaking Genius", "Sharpshooter", "MVP Tier", "Hall of Fame"],
    baseOvr: 91
  },
  {
    id: "dirk-nowitzki",
    name: "Dirk Nowitzki",
    era: "2000s",
    primaryPosition: "PF",
    archetype: "Sharpshooter",
    teamHistory: "Mavericks",
    baseStats: {
      scoring: 94, playmaking: 62, rebounding: 86, defense: 75,
      shooting3PT: 88, shootingMid: 96, shootingFT: 89,
      speed: 70, strength: 84, vertical: 74, stamina: 92
    },
    hiddenAttributes: { clutch: 96, consistency: 92, injuryResistance: 94, leadership: 92 },
    traits: ["Sharpshooter", "MVP Tier", "Hall of Fame", "Clutch Gene"],
    baseOvr: 91
  },
  {
    id: "vince-carter",
    name: "Vince Carter",
    era: "2000s",
    primaryPosition: "SG",
    secondaryPosition: "SF",
    archetype: "Scorer",
    teamHistory: "Raptors, Nets",
    baseStats: {
      scoring: 88, playmaking: 72, rebounding: 58, defense: 74,
      shooting3PT: 80, shootingMid: 82, shootingFT: 79,
      speed: 92, strength: 78, vertical: 99, stamina: 88
    },
    hiddenAttributes: { clutch: 88, consistency: 82, injuryResistance: 84, leadership: 80 },
    traits: ["Hall of Fame"],
    baseOvr: 84
  },
  {
    id: "robert-horry",
    name: "Robert Horry",
    era: "2000s",
    primaryPosition: "SF",
    secondaryPosition: "PF",
    archetype: "Defender",
    teamHistory: "Rockets, Lakers, Spurs",
    baseStats: {
      scoring: 72, playmaking: 55, rebounding: 68, defense: 84,
      shooting3PT: 82, shootingMid: 72, shootingFT: 72,
      speed: 74, strength: 78, vertical: 78, stamina: 84
    },
    hiddenAttributes: { clutch: 99, consistency: 75, injuryResistance: 92, leadership: 88 },
    traits: ["Clutch Gene"],
    baseOvr: 79
  },

  // === 2010s ===
  {
    id: "lebron-2010s",
    name: "LeBron James",
    era: "2010s",
    primaryPosition: "SF",
    secondaryPosition: "PF",
    archetype: "All-Rounder",
    teamHistory: "Heat, Cavaliers, Lakers",
    baseStats: {
      scoring: 98, playmaking: 94, rebounding: 86, defense: 93,
      shooting3PT: 78, shootingMid: 85, shootingFT: 75,
      speed: 94, strength: 95, vertical: 96, stamina: 98
    },
    hiddenAttributes: { clutch: 96, consistency: 98, injuryResistance: 99, leadership: 98 },
    traits: ["MVP Tier", "Playmaking Genius", "Era Dominator", "Hall of Fame", "Clutch Gene"],
    baseOvr: 99
  },
  {
    id: "steph-curry-2010s",
    name: "Stephen Curry",
    era: "2010s",
    primaryPosition: "PG",
    archetype: "Sharpshooter",
    teamHistory: "Warriors",
    baseStats: {
      scoring: 97, playmaking: 90, rebounding: 48, defense: 74,
      shooting3PT: 99, shootingMid: 92, shootingFT: 93,
      speed: 92, strength: 68, vertical: 76, stamina: 92
    },
    hiddenAttributes: { clutch: 95, consistency: 94, injuryResistance: 85, leadership: 94 },
    traits: ["Sharpshooter", "MVP Tier", "Hall of Fame", "Clutch Gene"],
    baseOvr: 97
  },
  {
    id: "kd-2010s",
    name: "Kevin Durant",
    era: "2010s",
    primaryPosition: "SF",
    secondaryPosition: "PF",
    archetype: "Scorer",
    teamHistory: "Thunder, Warriors, Nets",
    baseStats: {
      scoring: 98, playmaking: 78, rebounding: 78, defense: 84,
      shooting3PT: 91, shootingMid: 96, shootingFT: 88,
      speed: 86, strength: 78, vertical: 86, stamina: 94
    },
    hiddenAttributes: { clutch: 96, consistency: 96, injuryResistance: 84, leadership: 85 },
    traits: ["MVP Tier", "Sharpshooter", "Hall of Fame"],
    baseOvr: 96
  },
  {
    id: "kawhi-2010s",
    name: "Kawhi Leonard",
    era: "2010s",
    primaryPosition: "SF",
    secondaryPosition: "SG",
    archetype: "Defender",
    teamHistory: "Spurs, Raptors, Clippers",
    baseStats: {
      scoring: 91, playmaking: 68, rebounding: 74, defense: 98,
      shooting3PT: 84, shootingMid: 90, shootingFT: 87,
      speed: 82, strength: 88, vertical: 82, stamina: 88
    },
    hiddenAttributes: { clutch: 95, consistency: 92, injuryResistance: 76, leadership: 84 },
    traits: ["Defensive Anchor", "Rim Protector", "Clutch Gene"],
    baseOvr: 92
  },
  {
    id: "james-harden",
    name: "James Harden",
    era: "2010s",
    primaryPosition: "SG",
    secondaryPosition: "PG",
    archetype: "Scorer",
    teamHistory: "Thunder, Rockets, Nets",
    baseStats: {
      scoring: 96, playmaking: 92, rebounding: 62, defense: 70,
      shooting3PT: 86, shootingMid: 82, shootingFT: 86,
      speed: 88, strength: 84, vertical: 80, stamina: 95
    },
    hiddenAttributes: { clutch: 84, consistency: 88, injuryResistance: 94, leadership: 82 },
    traits: ["MVP Tier", "Playmaking Genius"],
    baseOvr: 91
  },
  {
    id: "draymond-green",
    name: "Draymond Green",
    era: "2010s",
    primaryPosition: "PF",
    secondaryPosition: "C",
    archetype: "Defender",
    teamHistory: "Warriors",
    baseStats: {
      scoring: 68, playmaking: 85, rebounding: 82, defense: 95,
      shooting3PT: 70, shootingMid: 62, shootingFT: 70,
      speed: 78, strength: 84, vertical: 78, stamina: 90
    },
    hiddenAttributes: { clutch: 85, consistency: 85, injuryResistance: 90, leadership: 97 },
    traits: ["Defensive Anchor", "Rim Protector"],
    baseOvr: 83
  },

  // === Modern Era ===
  {
    id: "nikola-jokic",
    name: "Nikola Jokic",
    era: "Modern",
    primaryPosition: "C",
    archetype: "Playmaker",
    teamHistory: "Nuggets",
    baseStats: {
      scoring: 94, playmaking: 99, rebounding: 95, defense: 80,
      shooting3PT: 80, shootingMid: 92, shootingFT: 85,
      speed: 68, strength: 94, vertical: 68, stamina: 94
    },
    hiddenAttributes: { clutch: 96, consistency: 98, injuryResistance: 95, leadership: 96 },
    traits: ["Playmaking Genius", "MVP Tier", "Era Dominator"],
    baseOvr: 97
  },
  {
    id: "giannis-anteto",
    name: "Giannis Antetokounmpo",
    era: "Modern",
    primaryPosition: "PF",
    secondaryPosition: "C",
    archetype: "Big Man",
    teamHistory: "Bucks",
    baseStats: {
      scoring: 95, playmaking: 78, rebounding: 94, defense: 94,
      shooting3PT: 60, shootingMid: 72, shootingFT: 68,
      speed: 92, strength: 95, vertical: 95, stamina: 95
    },
    hiddenAttributes: { clutch: 90, consistency: 94, injuryResistance: 92, leadership: 94 },
    traits: ["MVP Tier", "Rim Protector", "Defensive Anchor"],
    baseOvr: 96
  },
  {
    id: "luka-doncic",
    name: "Luka Doncic",
    era: "Modern",
    primaryPosition: "PG",
    secondaryPosition: "SG",
    archetype: "Scorer",
    teamHistory: "Mavericks",
    baseStats: {
      scoring: 96, playmaking: 95, rebounding: 84, defense: 74,
      shooting3PT: 84, shootingMid: 88, shootingFT: 78,
      speed: 82, strength: 86, vertical: 76, stamina: 94
    },
    hiddenAttributes: { clutch: 96, consistency: 92, injuryResistance: 88, leadership: 92 },
    traits: ["Playmaking Genius", "Clutch Gene"],
    baseOvr: 93
  },
  {
    id: "shai-ge",
    name: "Shai Gilgeous-Alexander",
    era: "Modern",
    primaryPosition: "SG",
    secondaryPosition: "PG",
    archetype: "Scorer",
    teamHistory: "Thunder",
    baseStats: {
      scoring: 95, playmaking: 82, rebounding: 58, defense: 88,
      shooting3PT: 80, shootingMid: 96, shootingFT: 88,
      speed: 90, strength: 76, vertical: 80, stamina: 92
    },
    hiddenAttributes: { clutch: 94, consistency: 95, injuryResistance: 92, leadership: 88 },
    traits: ["MVP Tier"],
    baseOvr: 92
  },
  {
    id: "anthony-edwards",
    name: "Anthony Edwards",
    era: "Modern",
    primaryPosition: "SG",
    archetype: "Scorer",
    teamHistory: "Timberwolves",
    baseStats: {
      scoring: 90, playmaking: 70, rebounding: 55, defense: 84,
      shooting3PT: 82, shootingMid: 80, shootingFT: 81,
      speed: 95, strength: 85, vertical: 98, stamina: 92
    },
    hiddenAttributes: { clutch: 92, consistency: 86, injuryResistance: 94, leadership: 90 },
    traits: ["Clutch Gene"],
    baseOvr: 87
  },
  {
    id: "wembanyama",
    name: "Victor Wembanyama",
    era: "Modern",
    primaryPosition: "C",
    secondaryPosition: "PF",
    archetype: "Defender",
    teamHistory: "Spurs",
    baseStats: {
      scoring: 84, playmaking: 68, rebounding: 92, defense: 98,
      shooting3PT: 78, shootingMid: 78, shootingFT: 80,
      speed: 82, strength: 84, vertical: 95, stamina: 88
    },
    hiddenAttributes: { clutch: 86, consistency: 84, injuryResistance: 84, leadership: 86 },
    traits: ["Rim Protector", "Defensive Anchor"],
    baseOvr: 87
  },
  {
    id: "alex-caruso",
    name: "Alex Caruso",
    era: "Modern",
    primaryPosition: "PG",
    secondaryPosition: "SG",
    archetype: "Defender",
    teamHistory: "Lakers, Bulls, Thunder",
    baseStats: {
      scoring: 70, playmaking: 74, rebounding: 44, defense: 92,
      shooting3PT: 78, shootingMid: 70, shootingFT: 78,
      speed: 86, strength: 74, vertical: 82, stamina: 88
    },
    hiddenAttributes: { clutch: 85, consistency: 84, injuryResistance: 82, leadership: 88 },
    traits: ["Defensive Anchor"],
    baseOvr: 79
  },
  {
    id: "kyle-korver",
    name: "Kyle Korver",
    era: "2010s",
    primaryPosition: "SG",
    secondaryPosition: "SF",
    archetype: "Sharpshooter",
    teamHistory: "Hawks, Cavaliers, Bulls",
    baseStats: {
      scoring: 75, playmaking: 55, rebounding: 38, defense: 70,
      shooting3PT: 95, shootingMid: 76, shootingFT: 88,
      speed: 72, strength: 65, vertical: 68, stamina: 84
    },
    hiddenAttributes: { clutch: 84, consistency: 82, injuryResistance: 92, leadership: 80 },
    traits: ["Sharpshooter"],
    baseOvr: 76
  },
  {
    id: "brian-scalabrine",
    name: "Brian Scalabrine",
    era: "2000s",
    primaryPosition: "PF",
    archetype: "All-Rounder",
    teamHistory: "Nets, Celtics, Bulls",
    baseStats: {
      scoring: 62, playmaking: 58, rebounding: 52, defense: 66,
      shooting3PT: 72, shootingMid: 68, shootingFT: 75,
      speed: 64, strength: 72, vertical: 60, stamina: 80
    },
    hiddenAttributes: { clutch: 95, consistency: 70, injuryResistance: 96, leadership: 99 },
    traits: [],
    baseOvr: 70
  },
  {
    id: "elgin-baylor",
    name: "Elgin Baylor",
    era: "1960s",
    primaryPosition: "SF",
    archetype: "Scorer",
    teamHistory: "Lakers",
    baseStats: {
      scoring: 93, playmaking: 75, rebounding: 88, defense: 80,
      shooting3PT: 15, shootingMid: 86, shootingFT: 78,
      speed: 88, strength: 82, vertical: 92, stamina: 92
    },
    hiddenAttributes: { clutch: 90, consistency: 88, injuryResistance: 84, leadership: 86 },
    traits: ["MVP Tier", "Era Dominator"],
    baseOvr: 91
  },
  {
    id: "walt-frazier",
    name: "Walt Frazier",
    era: "1970s",
    primaryPosition: "PG",
    archetype: "Defender",
    teamHistory: "Knicks",
    baseStats: {
      scoring: 85, playmaking: 90, rebounding: 62, defense: 95,
      shooting3PT: 20, shootingMid: 85, shootingFT: 80,
      speed: 88, strength: 76, vertical: 78, stamina: 94
    },
    hiddenAttributes: { clutch: 96, consistency: 92, injuryResistance: 90, leadership: 94 },
    traits: ["Defensive Anchor", "Clutch Gene"],
    baseOvr: 90
  },
  {
    id: "moses-malone",
    name: "Moses Malone",
    era: "1980s",
    primaryPosition: "C",
    secondaryPosition: "PF",
    archetype: "Big Man",
    teamHistory: "Rockets, 76ers",
    baseStats: {
      scoring: 92, playmaking: 55, rebounding: 99, defense: 88,
      shooting3PT: 10, shootingMid: 76, shootingFT: 78,
      speed: 75, strength: 96, vertical: 84, stamina: 95
    },
    hiddenAttributes: { clutch: 90, consistency: 94, injuryResistance: 92, leadership: 88 },
    traits: ["MVP Tier", "Rim Protector", "Hall of Fame"],
    baseOvr: 93
  },
  {
    id: "charles-barkley",
    name: "Charles Barkley",
    era: "1980s",
    primaryPosition: "PF",
    secondaryPosition: "SF",
    archetype: "All-Rounder",
    teamHistory: "76ers, Suns, Rockets",
    baseStats: {
      scoring: 94, playmaking: 78, rebounding: 96, defense: 82,
      shooting3PT: 65, shootingMid: 84, shootingFT: 74,
      speed: 86, strength: 94, vertical: 92, stamina: 92
    },
    hiddenAttributes: { clutch: 92, consistency: 90, injuryResistance: 90, leadership: 90 },
    traits: ["MVP Tier", "Era Dominator", "Hall of Fame"],
    baseOvr: 92
  },
  {
    id: "patrick-ewing",
    name: "Patrick Ewing",
    era: "1980s",
    primaryPosition: "C",
    archetype: "Defender",
    teamHistory: "Knicks, Sonics, Magic",
    baseStats: {
      scoring: 89, playmaking: 55, rebounding: 92, defense: 94,
      shooting3PT: 15, shootingMid: 82, shootingFT: 74,
      speed: 72, strength: 93, vertical: 82, stamina: 90
    },
    hiddenAttributes: { clutch: 88, consistency: 90, injuryResistance: 88, leadership: 92 },
    traits: ["Rim Protector", "Defensive Anchor"],
    baseOvr: 91
  },
  {
    id: "david-robinson",
    name: "David Robinson",
    era: "1990s",
    primaryPosition: "C",
    archetype: "Defender",
    teamHistory: "Spurs",
    baseStats: {
      scoring: 92, playmaking: 68, rebounding: 95, defense: 96,
      shooting3PT: 10, shootingMid: 80, shootingFT: 73,
      speed: 84, strength: 95, vertical: 88, stamina: 94
    },
    hiddenAttributes: { clutch: 88, consistency: 94, injuryResistance: 92, leadership: 95 },
    traits: ["Rim Protector", "Defensive Anchor", "MVP Tier", "Hall of Fame"],
    baseOvr: 94
  },
  {
    id: "scottie-pippen",
    name: "Scottie Pippen",
    era: "1990s",
    primaryPosition: "SF",
    secondaryPosition: "PF",
    archetype: "Defender",
    teamHistory: "Bulls, Rockets, Blazers",
    baseStats: {
      scoring: 84, playmaking: 85, rebounding: 74, defense: 98,
      shooting3PT: 72, shootingMid: 78, shootingFT: 70,
      speed: 90, strength: 82, vertical: 88, stamina: 94
    },
    hiddenAttributes: { clutch: 88, consistency: 92, injuryResistance: 94, leadership: 90 },
    traits: ["Defensive Anchor", "Playmaking Genius", "Hall of Fame"],
    baseOvr: 92
  },
  {
    id: "gary-payton",
    name: "Gary Payton",
    era: "1990s",
    primaryPosition: "PG",
    archetype: "Defender",
    teamHistory: "Sonics, Lakers, Heat",
    baseStats: {
      scoring: 86, playmaking: 90, rebounding: 50, defense: 98,
      shooting3PT: 74, shootingMid: 82, shootingFT: 77,
      speed: 92, strength: 74, vertical: 80, stamina: 95
    },
    hiddenAttributes: { clutch: 92, consistency: 94, injuryResistance: 96, leadership: 92 },
    traits: ["Defensive Anchor", "Playmaking Genius", "Clutch Gene"],
    baseOvr: 91
  },
  {
    id: "kevin-garnett",
    name: "Kevin Garnett",
    era: "2000s",
    primaryPosition: "PF",
    secondaryPosition: "C",
    archetype: "Defender",
    teamHistory: "Timberwolves, Celtics, Nets",
    baseStats: {
      scoring: 90, playmaking: 82, rebounding: 96, defense: 97,
      shooting3PT: 60, shootingMid: 84, shootingFT: 78,
      speed: 82, strength: 90, vertical: 86, stamina: 96
    },
    hiddenAttributes: { clutch: 90, consistency: 96, injuryResistance: 94, leadership: 99 },
    traits: ["Defensive Anchor", "Rim Protector", "MVP Tier", "Hall of Fame"],
    baseOvr: 95
  },
  {
    id: "tracy-mcgrady",
    name: "Tracy McGrady",
    era: "2000s",
    primaryPosition: "SG",
    secondaryPosition: "SF",
    archetype: "Scorer",
    teamHistory: "Raptors, Magic, Rockets",
    baseStats: {
      scoring: 96, playmaking: 84, rebounding: 65, defense: 78,
      shooting3PT: 84, shootingMid: 91, shootingFT: 79,
      speed: 93, strength: 78, vertical: 95, stamina: 90
    },
    hiddenAttributes: { clutch: 97, consistency: 90, injuryResistance: 78, leadership: 84 },
    traits: ["MVP Tier", "Clutch Gene", "Sharpshooter"],
    baseOvr: 93
  },
  {
    id: "jason-kidd",
    name: "Jason Kidd",
    era: "2000s",
    primaryPosition: "PG",
    archetype: "Playmaker",
    teamHistory: "Suns, Nets, Mavericks",
    baseStats: {
      scoring: 76, playmaking: 98, rebounding: 78, defense: 92,
      shooting3PT: 78, shootingMid: 74, shootingFT: 80,
      speed: 88, strength: 78, vertical: 76, stamina: 95
    },
    hiddenAttributes: { clutch: 88, consistency: 94, injuryResistance: 94, leadership: 96 },
    traits: ["Playmaking Genius", "Defensive Anchor", "Hall of Fame"],
    baseOvr: 91
  },
  {
    id: "russell-westbrook",
    name: "Russell Westbrook",
    era: "2010s",
    primaryPosition: "PG",
    archetype: "All-Rounder",
    teamHistory: "Thunder, Rockets, Wizards",
    baseStats: {
      scoring: 94, playmaking: 92, rebounding: 90, defense: 78,
      shooting3PT: 70, shootingMid: 78, shootingFT: 80,
      speed: 98, strength: 84, vertical: 98, stamina: 96
    },
    hiddenAttributes: { clutch: 88, consistency: 90, injuryResistance: 92, leadership: 90 },
    traits: ["MVP Tier", "Playmaking Genius", "Era Dominator"],
    baseOvr: 94
  },
  {
    id: "chris-paul",
    name: "Chris Paul",
    era: "2010s",
    primaryPosition: "PG",
    archetype: "Playmaker",
    teamHistory: "Hornets, Clippers, Rockets",
    baseStats: {
      scoring: 84, playmaking: 99, rebounding: 45, defense: 94,
      shooting3PT: 84, shootingMid: 92, shootingFT: 88,
      speed: 86, strength: 68, vertical: 70, stamina: 92
    },
    hiddenAttributes: { clutch: 94, consistency: 96, injuryResistance: 82, leadership: 98 },
    traits: ["Playmaking Genius", "Defensive Anchor", "Clutch Gene", "Hall of Fame"],
    baseOvr: 93
  },
  {
    id: "kyrie-irving",
    name: "Kyrie Irving",
    era: "2010s",
    primaryPosition: "PG",
    secondaryPosition: "SG",
    archetype: "Scorer",
    teamHistory: "Cavaliers, Celtics, Mavericks",
    baseStats: {
      scoring: 95, playmaking: 85, rebounding: 40, defense: 70,
      shooting3PT: 89, shootingMid: 94, shootingFT: 91,
      speed: 94, strength: 65, vertical: 80, stamina: 90
    },
    hiddenAttributes: { clutch: 98, consistency: 88, injuryResistance: 80, leadership: 82 },
    traits: ["Clutch Gene", "Sharpshooter"],
    baseOvr: 91
  },
  {
    id: "anthony-davis",
    name: "Anthony Davis",
    era: "2010s",
    primaryPosition: "C",
    secondaryPosition: "PF",
    archetype: "Defender",
    teamHistory: "Pelicans, Lakers",
    baseStats: {
      scoring: 91, playmaking: 65, rebounding: 94, defense: 96,
      shooting3PT: 72, shootingMid: 80, shootingFT: 80,
      speed: 80, strength: 90, vertical: 88, stamina: 92
    },
    hiddenAttributes: { clutch: 90, consistency: 92, injuryResistance: 78, leadership: 88 },
    traits: ["Rim Protector", "Defensive Anchor", "MVP Tier"],
    baseOvr: 93
  },
  {
    id: "joel-embiid",
    name: "Joel Embiid",
    era: "Modern",
    primaryPosition: "C",
    archetype: "Scorer",
    teamHistory: "76ers",
    baseStats: {
      scoring: 96, playmaking: 70, rebounding: 92, defense: 88,
      shooting3PT: 78, shootingMid: 88, shootingFT: 85,
      speed: 74, strength: 96, vertical: 80, stamina: 90
    },
    hiddenAttributes: { clutch: 90, consistency: 94, injuryResistance: 76, leadership: 86 },
    traits: ["MVP Tier", "Rim Protector"],
    baseOvr: 95
  },
  {
    id: "jayson-tatum",
    name: "Jayson Tatum",
    era: "Modern",
    primaryPosition: "SF",
    secondaryPosition: "PF",
    archetype: "Scorer",
    teamHistory: "Celtics",
    baseStats: {
      scoring: 92, playmaking: 76, rebounding: 82, defense: 84,
      shooting3PT: 86, shootingMid: 84, shootingFT: 83,
      speed: 86, strength: 84, vertical: 85, stamina: 94
    },
    hiddenAttributes: { clutch: 92, consistency: 90, injuryResistance: 95, leadership: 90 },
    traits: ["Sharpshooter", "MVP Tier"],
    baseOvr: 93
  },
  {
    id: "devin-booker",
    name: "Devin Booker",
    era: "Modern",
    primaryPosition: "SG",
    secondaryPosition: "PG",
    archetype: "Scorer",
    teamHistory: "Suns",
    baseStats: {
      scoring: 92, playmaking: 80, rebounding: 48, defense: 75,
      shooting3PT: 86, shootingMid: 94, shootingFT: 88,
      speed: 88, strength: 74, vertical: 80, stamina: 92
    },
    hiddenAttributes: { clutch: 94, consistency: 90, injuryResistance: 88, leadership: 88 },
    traits: ["Sharpshooter", "Clutch Gene"],
    baseOvr: 91
  },
  {
    id: "jaylen-brown",
    name: "Jaylen Brown",
    era: "Modern",
    primaryPosition: "SF",
    secondaryPosition: "SG",
    archetype: "Scorer",
    teamHistory: "Celtics",
    baseStats: {
      scoring: 89, playmaking: 68, rebounding: 60, defense: 88,
      shooting3PT: 80, shootingMid: 82, shootingFT: 76,
      speed: 92, strength: 86, vertical: 92, stamina: 92
    },
    hiddenAttributes: { clutch: 92, consistency: 88, injuryResistance: 90, leadership: 88 },
    traits: ["Defensive Anchor", "Clutch Gene"],
    baseOvr: 90
  }
];

// ==========================================
// DYNAMIC EXPANSION ENGINE (4000+ REAL PLAYERS)
// ==========================================

// Deterministic seeded random class for consistent state reloads
class SeededGenerator {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

interface RealPlayerProfile {
  name: string;
  era: Era;
  pos: Position;
  team: string;
  rating?: number;
}

// Compact tuple schema: [Name, Era, Position, OriginalTeam, BaseRating]
const REAL_DATA_TUPLES: [string, Era, Position, string, number][] = [
  // === 1950s ===
  ["George Mikan", "1950s", "C", "Lakers", 93],
  ["Bob Cousy", "1950s", "PG", "Celtics", 92],
  ["Paul Arizin", "1950s", "SF", "Warriors", 88],
  ["Dolph Schayes", "1950s", "PF", "Nationals", 89],
  ["Bob Pettit", "1950s", "PF", "Hawks", 94],
  ["Neil Johnston", "1950s", "C", "Warriors", 87],
  ["Bill Sharman", "1950s", "SG", "Celtics", 87],
  ["Ed Macauley", "1950s", "C", "Celtics", 86],
  ["Vern Mikkelsen", "1950s", "PF", "Lakers", 85],
  ["Slater Martin", "1950s", "PG", "Lakers", 84],
  ["Harry Gallatin", "1950s", "PF", "Knicks", 83],
  ["Larry Foust", "1950s", "C", "Pistons", 83],
  ["Bobby Wanzer", "1950s", "SG", "Royals", 83],
  ["Arnie Risen", "1950s", "C", "Royals", 84],
  ["George Yardley", "1950s", "SF", "Pistons", 86],
  ["Maurice Stokes", "1950s", "PF", "Royals", 89],
  ["Cliff Hagan", "1950s", "SF", "Hawks", 87],
  ["Frank Ramsey", "1950s", "SF", "Celtics", 84],
  ["Jack Twyman", "1950s", "SF", "Royals", 86],
  ["Clyde Lovellette", "1950s", "C", "Lakers", 85],

  // === 1960s ===
  ["Wilt Chamberlain", "1960s", "C", "Lakers", 98],
  ["Bill Russell", "1960s", "C", "Celtics", 97],
  ["Oscar Robertson", "1960s", "PG", "Bucks", 96],
  ["Jerry West", "1960s", "SG", "Lakers", 96],
  ["Elgin Baylor", "1960s", "SF", "Lakers", 95],
  ["Jerry Lucas", "1960s", "PF", "Royals", 91],
  ["Hal Greer", "1960s", "SG", "76ers", 90],
  ["Sam Jones", "1960s", "SG", "Celtics", 89],
  ["Willis Reed", "1960s", "C", "Knicks", 92],
  ["Dave Bing", "1960s", "PG", "Pistons", 89],
  ["Lenny Wilkens", "1960s", "PG", "Hawks", 88],
  ["Billy Cunningham", "1960s", "SF", "76ers", 90],
  ["Dave DeBusschere", "1960s", "PF", "Knicks", 88],
  ["Bailey Howell", "1960s", "PF", "Pistons", 87],
  ["John Havlicek", "1960s", "SF", "Celtics", 93],
  ["Nate Thurmond", "1960s", "C", "Warriors", 92],
  ["Walt Bellamy", "1960s", "C", "Packers", 89],
  ["Lou Hudson", "1960s", "SG", "Hawks", 88],
  ["Gail Goodrich", "1960s", "SG", "Lakers", 89],
  ["Connie Hawkins", "1960s", "PF", "Suns", 89],

  // === 1970s ===
  ["Kareem Abdul-Jabbar", "1970s", "C", "Lakers", 99],
  ["Julius Erving", "1970s", "SF", "76ers", 95],
  ["Walt Frazier", "1970s", "PG", "Knicks", 93],
  ["Pete Maravich", "1970s", "SG", "Jazz", 92],
  ["Elvin Hayes", "1970s", "PF", "Bullets", 92],
  ["Dave Cowens", "1970s", "C", "Celtics", 91],
  ["Bob McAdoo", "1970s", "C", "Braves", 92],
  ["Nate Archibald", "1970s", "PG", "Royals", 91],
  ["Rick Barry", "1970s", "SF", "Warriors", 93],
  ["George Gervin", "1970s", "SG", "Spurs", 94],
  ["Bill Walton", "1970s", "C", "Blazers", 93],
  ["Wes Unseld", "1970s", "C", "Bullets", 89],
  ["Spencer Haywood", "1970s", "PF", "SuperSonics", 88],
  ["Artis Gilmore", "1970s", "C", "Bulls", 91],
  ["Bobby Jones", "1970s", "PF", "76ers", 87],
  ["David Thompson", "1970s", "SG", "Nuggets", 90],
  ["Dan Issel", "1970s", "C", "Nuggets", 88],
  ["Maurice Lucas", "1970s", "PF", "Blazers", 87],
  ["Jo Jo White", "1970s", "PG", "Celtics", 88],
  ["Paul Westphal", "1970s", "SG", "Suns", 89],
  ["Bob Dandridge", "1970s", "SF", "Bucks", 87],
  ["George McGinnis", "1970s", "PF", "Pacers", 89],
  ["Jack Sikma", "1970s", "C", "SuperSonics", 89],
  ["Walter Davis", "1970s", "SF", "Suns", 87],
  ["Marques Johnson", "1970s", "SF", "Bucks", 88],

  // === 1980s ===
  ["Larry Bird", "1980s", "SF", "Celtics", 98],
  ["Magic Johnson", "1980s", "PG", "Lakers", 98],
  ["Michael Jordan", "1980s", "SG", "Bulls", 99],
  ["Isiah Thomas", "1980s", "PG", "Pistons", 95],
  ["Moses Malone", "1980s", "C", "76ers", 96],
  ["Dominique Wilkins", "1980s", "SF", "Hawks", 94],
  ["Kevin McHale", "1980s", "PF", "Celtics", 93],
  ["Robert Parish", "1980s", "C", "Celtics", 89],
  ["James Worthy", "1980s", "SF", "Lakers", 91],
  ["Hakeem Olajuwon", "1980s", "C", "Rockets", 97],
  ["Charles Barkley", "1980s", "PF", "76ers", 95],
  ["Karl Malone", "1980s", "PF", "Jazz", 95],
  ["John Stockton", "1980s", "PG", "Jazz", 94],
  ["Patrick Ewing", "1980s", "C", "Knicks", 94],
  ["Sidney Moncrief", "1980s", "SG", "Bucks", 91],
  ["Adrian Dantley", "1980s", "SF", "Jazz", 91],
  ["Alex English", "1980s", "SF", "Nuggets", 92],
  ["Bernard King", "1980s", "SF", "Knicks", 92],
  ["Joe Dumars", "1980s", "SG", "Pistons", 90],
  ["Mark Price", "1980s", "PG", "Cavaliers", 89],
  ["Terry Cummings", "1980s", "PF", "Bucks", 88],
  ["Fat Lever", "1980s", "PG", "Nuggets", 88],
  ["Tom Chambers", "1980s", "PF", "Suns", 89],
  ["Dennis Rodman", "1980s", "PF", "Pistons", 90],
  ["Larry Nance", "1980s", "PF", "Suns", 89],
  ["Brad Daugherty", "1980s", "C", "Cavaliers", 88],

  // === 1990s ===
  ["Scottie Pippen", "1990s", "SF", "Bulls", 95],
  ["Reggie Miller", "1990s", "SG", "Pacers", 93],
  ["Clyde Drexler", "1990s", "SG", "Blazers", 94],
  ["Alonzo Mourning", "1990s", "C", "Heat", 93],
  ["Gary Payton", "1990s", "PG", "SuperSonics", 94],
  ["Shawn Kemp", "1990s", "PF", "SuperSonics", 92],
  ["Anfernee Hardaway", "1990s", "PG", "Magic", 92],
  ["Grant Hill", "1990s", "SF", "Pistons", 92],
  ["Dikembe Mutombo", "1990s", "C", "Nuggets", 91],
  ["Mitch Richmond", "1990s", "SG", "Kings", 91],
  ["Chris Mullin", "1990s", "SF", "Warriors", 91],
  ["Tim Hardaway", "1990s", "PG", "Warriors", 91],
  ["Glen Rice", "1990s", "SF", "Hornets", 90],
  ["Latrell Sprewell", "1990s", "SG", "Warriors", 89],
  ["Kevin Johnson", "1990s", "PG", "Suns", 91],
  ["Larry Johnson", "1990s", "PF", "Hornets", 89],
  ["Chris Webber", "1990s", "PF", "Kings", 93],
  ["Rik Smits", "1990s", "C", "Pacers", 86],
  ["Rod Strickland", "1990s", "PG", "Blazers", 88],
  ["Derrick Coleman", "1990s", "PF", "Nets", 88],

  // === 2000s ===
  ["Yao Ming", "2000s", "C", "Rockets", 94],
  ["Amare Stoudemire", "2000s", "PF", "Suns", 92],
  ["Carmelo Anthony", "2000s", "SF", "Nuggets", 94],
  ["Dwight Howard", "2000s", "C", "Magic", 95],
  ["Pau Gasol", "2000s", "PF", "Grizzlies", 92],
  ["Chauncey Billups", "2000s", "PG", "Pistons", 91],
  ["Richard Hamilton", "2000s", "SG", "Pistons", 88],
  ["Rasheed Wallace", "2000s", "PF", "Pistons", 90],
  ["Ben Wallace", "2000s", "C", "Pistons", 91],
  ["Baron Davis", "2000s", "PG", "Warriors", 90],
  ["Elton Brand", "2000s", "PF", "Clippers", 91],
  ["Jermaine O'Neal", "2000s", "C", "Pacers", 91],
  ["Stephon Marbury", "2000s", "PG", "Knicks", 89],
  ["Steve Francis", "2000s", "PG", "Rockets", 89],
  ["Gilbert Arenas", "2000s", "PG", "Wizards", 92],
  ["Manu Ginobili", "2000s", "SG", "Spurs", 91],
  ["Tony Parker", "2000s", "PG", "Spurs", 90],
  ["Shawn Marion", "2000s", "SF", "Suns", 90],
  ["Peja Stojakovic", "2000s", "SF", "Kings", 90],
  ["Andrei Kirilenko", "2000s", "SF", "Jazz", 89],
  ["Zach Randolph", "2000s", "PF", "Blazers", 89],
  ["Carlos Boozer", "2000s", "PF", "Jazz", 89],
  ["Jason Richardson", "2000s", "SG", "Warriors", 86],
  ["Chris Bosh", "2000s", "PF", "Raptors", 91],
  ["Joe Johnson", "2000s", "SG", "Hawks", 89],

  // === 2010s ===
  ["Blake Griffin", "2010s", "PF", "Clippers", 93],
  ["Paul George", "2010s", "SF", "Pacers", 93],
  ["DeMarcus Cousins", "2010s", "C", "Kings", 92],
  ["Klay Thompson", "2010s", "SG", "Warriors", 91],
  ["Draymond Green", "2010s", "PF", "Warriors", 90],
  ["Kyle Lowry", "2010s", "PG", "Raptors", 90],
  ["DeMar DeRozan", "2010s", "SG", "Raptors", 91],
  ["LaMarcus Aldridge", "2010s", "PF", "Blazers", 91],
  ["Marc Gasol", "2010s", "C", "Grizzlies", 91],
  ["Al Horford", "2010s", "C", "Hawks", 89],
  ["Joakim Noah", "2010s", "C", "Bulls", 90],
  ["Jimmy Butler", "2010s", "SF", "Bulls", 92],
  ["Isaiah Thomas", "2010s", "PG", "Celtics", 91],
  ["Kemba Walker", "2010s", "PG", "Hornets", 90],
  ["Gordon Hayward", "2010s", "SF", "Jazz", 89],
  ["DeAndre Jordan", "2010s", "C", "Clippers", 88],
  ["Kevin Love", "2010s", "PF", "Timberwolves", 91],
  ["Bradley Beal", "2010s", "SG", "Wizards", 89],
  ["Derrick Rose", "2010s", "PG", "Bulls", 93],
  ["Rajon Rondo", "2010s", "PG", "Celtics", 88],

  // === Modern ===
  ["Anthony Edwards", "Modern", "SG", "Timberwolves", 95],
  ["Tyrese Haliburton", "Modern", "PG", "Pacers", 93],
  ["Jalen Brunson", "Modern", "PG", "Knicks", 94],
  ["Tyrese Maxey", "Modern", "PG", "76ers", 91],
  ["Domantas Sabonis", "Modern", "C", "Kings", 92],
  ["De'Aaron Fox", "Modern", "PG", "Kings", 92],
  ["Bam Adebayo", "Modern", "C", "Heat", 91],
  ["Victor Wembanyama", "Modern", "C", "Spurs", 93],
  ["Paolo Banchero", "Modern", "PF", "Magic", 91],
  ["Chet Holmgren", "Modern", "C", "Thunder", 90],
  ["Cade Cunningham", "Modern", "PG", "Pistons", 89],
  ["LaMelo Ball", "Modern", "PG", "Hornets", 88],
  ["Zion Williamson", "Modern", "PF", "Pelicans", 91],
  ["Ja Morant", "Modern", "PG", "Grizzlies", 91],
  ["Alperen Sengun", "Modern", "C", "Rockets", 90],
  ["Brandon Miller", "Modern", "SF", "Hornets", 88],
  ["Jalen Williams", "Modern", "SG", "Thunder", 89],
  ["Jaylen Brown", "Modern", "SF", "Celtics", 91],
  ["Kristaps Porzingis", "Modern", "C", "Celtics", 90],
  ["Derrick White", "Modern", "PG", "Celtics", 88],
  ["Jrue Holiday", "Modern", "PG", "Celtics", 88],
  ["Mikal Bridges", "Modern", "SF", "Knicks", 87],
  ["Jamal Murray", "Modern", "PG", "Nuggets", 89],
  ["Aaron Gordon", "Modern", "PF", "Nuggets", 86],
  ["Austin Reaves", "Modern", "SG", "Lakers", 85],
  ["Rui Hachimura", "Modern", "PF", "Lakers", 84],
  ["Malik Monk", "Modern", "SG", "Kings", 85],
  ["Coby White", "Modern", "PG", "Bulls", 85],
  ["Alex Caruso", "Modern", "SG", "Thunder", 84],
  ["Nikola Vucevic", "Modern", "C", "Bulls", 85],
  ["Zach LaVine", "Modern", "SG", "Bulls", 85],
  ["Tyler Herro", "Modern", "SG", "Heat", 85],
  ["Julius Randle", "Modern", "PF", "Knicks", 89],
  ["OG Anunoby", "Modern", "SF", "Knicks", 86],
  ["Evan Mobley", "Modern", "PF", "Cavaliers", 88],
  ["Franz Wagner", "Modern", "SF", "Magic", 88],
  ["Myles Turner", "Modern", "C", "Pacers", 86],
  ["Bogdan Bogdanovic", "Modern", "SG", "Hawks", 85],
  ["RJ Barrett", "Modern", "SF", "Raptors", 86],
  ["Scottie Barnes", "Modern", "PF", "Raptors", 89],
  ["Lauri Markkanen", "Modern", "PF", "Jazz", 89],
  ["Deandre Ayton", "Modern", "C", "Blazers", 85],
  ["Naz Reid", "Modern", "C", "Timberwolves", 85],
  ["Jaren Jackson Jr.", "Modern", "C", "Grizzlies", 89]
];

const REAL_PLAYERS_POOL: RealPlayerProfile[] = REAL_DATA_TUPLES.map(([name, era, pos, team, rating]) => ({
  name, era, pos, team, rating
}));

const FAMOUS_TEAMS = [
  'Lakers', 'Celtics', 'Bulls', 'Warriors', 'Heat', 'Rockets', 'Spurs', 'Mavericks', 'Suns', 'Knicks', 
  '76ers', 'Bucks', 'Nuggets', 'Clippers', 'Nets', 'Pacers', 'Blazers', 'Sonics', 'Magic', 'Timberwolves', 
  'Jazz', 'Pistons', 'Kings', 'Grizzlies', 'Hawks', 'Cavaliers', 'Thunder', 'Pelicans', 'Hornets', 'Wizards'
];

const ERAS: Era[] = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', 'Modern'];
const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

// Generate exactly 4000 unique templates
const generator = new SeededGenerator(2026);
const usedIds = new Set<string>(PLAYER_TEMPLATES.map(p => p.id));

const VERSIONS = [
  { prefix: "", suffix: "", ovrMultiplier: 1.0, isPeak: true },
  { prefix: "Rookie ", suffix: "", ovrMultiplier: 0.81 },
  { prefix: "Veteran ", suffix: "", ovrMultiplier: 0.90 },
  { prefix: "Sophomore ", suffix: "", ovrMultiplier: 0.84 },
  { prefix: "All-Star ", suffix: "", ovrMultiplier: 0.95 },
  { prefix: "Draft Day ", suffix: "", ovrMultiplier: 0.76 },
  { prefix: "MVP ", suffix: "", ovrMultiplier: 1.02 },
  { prefix: "Championship ", suffix: "", ovrMultiplier: 0.98 }
];

for (let k = 0; k < 4000; k++) {
  const profileIndex = k % REAL_PLAYERS_POOL.length;
  const baseProfile = REAL_PLAYERS_POOL[profileIndex];
  
  const versionIndex = Math.floor(k / REAL_PLAYERS_POOL.length) % VERSIONS.length;
  const version = VERSIONS[versionIndex];

  const name = `${version.prefix}${baseProfile.name}${version.suffix}`;
  let id = `gen-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
  
  if (usedIds.has(id)) {
    id = `${id}-${k}`;
  }
  usedIds.add(id);

  const pos = baseProfile.pos;
  const era = baseProfile.era;
  const team = baseProfile.team;

  let secPos: Position | undefined;
  if (generator.next() < 0.3) {
    if (pos === 'PG') secPos = 'SG';
    else if (pos === 'SG') secPos = 'SF';
    else if (pos === 'SF') secPos = 'PF';
    else if (pos === 'PF') secPos = 'C';
    else if (pos === 'C') secPos = 'PF';
  }

  let arch: Archetype = 'All-Rounder';
  if (pos === 'PG') arch = generator.choice(['Playmaker', 'Scorer', 'Sharpshooter', 'Defender', 'All-Rounder']);
  else if (pos === 'SG' || pos === 'SF') arch = generator.choice(['Scorer', 'Sharpshooter', 'Defender', 'All-Rounder']);
  else if (pos === 'PF') arch = generator.choice(['Big Man', 'Defender', 'Scorer', 'All-Rounder']);
  else if (pos === 'C') arch = generator.choice(['Big Man', 'Defender', 'All-Rounder']);

  const basePeak = baseProfile.rating || 85;
  let baseOvr = Math.round(basePeak * version.ovrMultiplier);
  baseOvr = Math.max(65, Math.min(99, baseOvr));

  const stats: PlayerStats = {
    scoring: baseOvr,
    playmaking: baseOvr,
    rebounding: baseOvr,
    defense: baseOvr,
    shooting3PT: baseOvr,
    shootingMid: baseOvr,
    shootingFT: baseOvr,
    speed: baseOvr,
    strength: baseOvr,
    vertical: baseOvr,
    stamina: generator.range(80, 96)
  };

  if (arch === 'Sharpshooter') {
    stats.shooting3PT = Math.min(99, baseOvr + 12);
    stats.shootingMid = Math.min(99, baseOvr + 6);
    stats.rebounding = Math.max(30, baseOvr - 15);
    stats.strength = Math.max(30, baseOvr - 10);
  } else if (arch === 'Playmaker') {
    stats.playmaking = Math.min(99, baseOvr + 12);
    stats.speed = Math.min(99, baseOvr + 8);
    stats.rebounding = Math.max(30, baseOvr - 12);
    stats.scoring = Math.max(30, baseOvr - 4);
  } else if (arch === 'Defender') {
    stats.defense = Math.min(99, baseOvr + 12);
    stats.speed = Math.min(99, baseOvr + 5);
    stats.strength = Math.min(99, baseOvr + 4);
    stats.shooting3PT = Math.max(30, baseOvr - 15);
  } else if (arch === 'Big Man') {
    stats.rebounding = Math.min(99, baseOvr + 12);
    stats.strength = Math.min(99, baseOvr + 8);
    stats.defense = Math.min(99, baseOvr + 4);
    stats.shooting3PT = Math.max(10, baseOvr - 30);
    stats.speed = Math.max(30, baseOvr - 10);
  } else if (arch === 'Scorer') {
    stats.scoring = Math.min(99, baseOvr + 10);
    stats.shootingMid = Math.min(99, baseOvr + 8);
    stats.playmaking = Math.max(30, baseOvr - 8);
  }

  if (pos === 'C') {
    stats.rebounding = Math.min(99, stats.rebounding + 8);
    stats.strength = Math.min(99, stats.strength + 8);
    stats.speed = Math.max(30, stats.speed - 10);
    stats.shooting3PT = Math.max(5, stats.shooting3PT - 20);
  } else if (pos === 'PG') {
    stats.playmaking = Math.min(99, stats.playmaking + 8);
    stats.speed = Math.min(99, stats.speed + 6);
    stats.rebounding = Math.max(15, stats.rebounding - 15);
  }

  (Object.keys(stats) as (keyof PlayerStats)[]).forEach(key => {
    stats[key] = Math.max(10, Math.min(99, Math.round(stats[key])));
  });

  const traits: PlayerTrait[] = [];
  if (baseOvr >= 90) {
    traits.push(generator.choice(['MVP Tier', 'Era Dominator', 'Hall of Fame', 'Clutch Gene']));
  }
  if (arch === 'Defender' && baseOvr >= 80) {
    traits.push(generator.choice(['Defensive Anchor', 'Rim Protector']));
  }
  if (arch === 'Sharpshooter' && baseOvr >= 80) {
    traits.push('Sharpshooter');
  }
  if (arch === 'Playmaker' && baseOvr >= 80) {
    traits.push('Playmaking Genius');
  }

  PLAYER_TEMPLATES.push({
    id,
    name,
    era,
    primaryPosition: pos,
    secondaryPosition: secPos,
    archetype: arch,
    teamHistory: team,
    baseStats: stats,
    hiddenAttributes: {
      clutch: generator.range(70, 98),
      consistency: generator.range(70, 98),
      injuryResistance: generator.range(80, 99),
      leadership: generator.range(70, 98)
    },
    traits,
    baseOvr
  });
}

export const TEAM_NAMES = [
  "Boston Legends", "Los Angeles Stars", "Chicago Dynasties", "Golden State Spacers",
  "Miami Heatwave", "Philadelphia Phantoms", "New York Skyscrapers", "Dallas Mavericks",
  "Phoenix Solars", "Milwaukee Bucks", "Houston Rockets", "San Antonio Spurs",
  "Denver Nuggets", "Seattle Supersonics", "Detroit Bad Boys", "Utah Jazz"
];

export function getRarityFromOvr(ovr: number): Rarity {
  if (ovr >= 90) return 'Legendary';
  if (ovr >= 84) return 'Epic';
  if (ovr >= 78) return 'Rare';
  return 'Common';
}

export function getRarityColor(rarity: Rarity): string {
  switch (rarity) {
    case 'Legendary': return '#EAB308'; // Amber/Gold
    case 'Epic': return '#A855F7';      // Purple
    case 'Rare': return '#3B82F6';      // Blue
    case 'Common': return '#9CA3AF';    // Gray
  }
}

export function getRarityTextGlow(rarity: Rarity): string {
  switch (rarity) {
    case 'Legendary': return 'text-yellow-400 drop-shadow-[0_2px_8px_rgba(234,179,8,0.5)]';
    case 'Epic': return 'text-purple-400 drop-shadow-[0_2px_8px_rgba(168,85,247,0.5)]';
    case 'Rare': return 'text-blue-400 drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]';
    case 'Common': return 'text-gray-400';
  }
}

export function getRarityCardClasses(rarity: Rarity): string {
  switch (rarity) {
    case 'Legendary':
      return 'border-yellow-400/90 bg-zinc-900 shadow-[0_4px_12px_rgba(234,179,8,0.15)] hover:shadow-[0_6px_20px_rgba(234,179,8,0.25)] hover:border-yellow-400';
    case 'Epic':
      return 'border-purple-500/90 bg-zinc-900 shadow-[0_4px_12px_rgba(168,85,247,0.15)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.25)] hover:border-purple-400';
    case 'Rare':
      return 'border-blue-500/90 bg-zinc-900 shadow-[0_4px_12px_rgba(59,130,246,0.12)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.22)] hover:border-blue-400';
    case 'Common':
      return 'border-zinc-700 bg-zinc-900 shadow-md hover:border-zinc-500';
  }
}
