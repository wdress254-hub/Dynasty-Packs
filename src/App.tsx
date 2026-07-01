/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { GameState, PlayerCard, Position, PackType, TeamStanding, GameResult, BoxScoreStats, PlayoffMatchup, Roster, FranchiseAccount } from './types';
import { PLAYER_TEMPLATES, getRarityColor } from './data/players';
import { DEFAULT_STATE, storageManager, createStandings, createSchedule } from './engine/storage';
import { analyzeLineup, simulateBasketballGame, generateAiTeams, getAiMatchupsForGameDay, gainXpAndCheckLevelUp, generateDraftProspects } from './engine/simulation';
import { PlayerCardView } from './components/PlayerCardView';
import { StandingsView } from './components/StandingsView';
import { ShopView } from './components/ShopView';
import { UpgradeView } from './components/UpgradeView';
import { PlayoffsView } from './components/PlayoffsView';
import { SettingsView } from './components/SettingsView';
import {
  Sparkles,
  Award,
  Zap,
  ShoppingBag,
  Coins,
  LayoutDashboard,
  Users,
  TrendingUp,
  RotateCcw,
  Settings,
  Play,
  ClipboardList,
  AlertTriangle,
  Flame,
  Info,
  Calendar,
  Layers,
  ChevronRight,
  Plus,
  Trophy,
  UserPlus,
  Trash2,
  Radio,
  Gamepad2,
  Send
} from 'lucide-react';
import { MultiplayerView } from './components/MultiplayerView';
import { ArcadeLauncher } from './components/ArcadeLauncher';
import { HackMenu } from './components/HackMenu';
import { LegacyModeView } from './components/LegacyModeView';
import { LegacyLinkView } from './components/LegacyLinkView';

// Deterministic 6-digit numeric Player ID based on username
const getPlayerId = (username: string): string => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idNum = Math.abs(hash % 900000) + 100000;
  return idNum.toString();
};

export default function App() {
  const [state, setState] = useState<GameState>(() => storageManager.loadState());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'roster' | 'shop' | 'upgrades' | 'playoffs' | 'history' | 'freeagents' | 'multiplayer' | 'settings' | 'legacylink'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('join')) {
        return 'multiplayer';
      }
    }
    return 'dashboard';
  });
  const [disableXpAlerts, setDisableXpAlerts] = useState<boolean>(() => localStorage.getItem('nba_disable_xp_alerts') === 'true');
  
  // Dialog / Sub-menu states
  const [assigningSlot, setAssigningSlot] = useState<Position | 'bench' | null>(null);
  const [selectedBoxScore, setSelectedBoxScore] = useState<GameResult | null>(null);
  const [boxScoreTab, setBoxScoreTab] = useState<'player' | 'opponent'>('player');
  const [welcomeOpen, setWelcomeOpen] = useState(true);

  // Arcade Launcher Hub GUI state
  const [launcherOpen, setLauncherOpen] = useState<boolean>(true);
  const [addGameModalOpen, setAddGameModalOpen] = useState<boolean>(false);
  const [customGames, setCustomGames] = useState<Array<{ name: string; description: string; genre: string; color: string }>>(() => {
    const saved = localStorage.getItem('arcade_custom_games');
    return saved ? JSON.parse(saved) : [];
  });
  const [newGameName, setNewGameName] = useState('');
  const [newGameDesc, setNewGameDesc] = useState('');
  const [newGameGenre, setNewGameGenre] = useState('Sports');
  const [newGameColor, setNewGameColor] = useState('blue');

  // Sandbox emulator states
  const [sandboxGame, setSandboxGame] = useState<any>(null);
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([]);
  const [sandboxTeamScores, setSandboxTeamScores] = useState<{ score1: number; score2: number }>({ score1: 0, score2: 0 });

  // Custom non-blocking popups states to replace iframe-blocked alert/confirm window functions
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [draftClass, setDraftClass] = useState<PlayerCard[]>([]);

  useEffect(() => {
    if (state.pendingDraftPicks && state.pendingDraftPicks > 0 && draftClass.length === 0) {
      setDraftClass(generateDraftProspects(state.year, 3));
    }
  }, [state.pendingDraftPicks, state.year, draftClass.length]);

  const handleSelectDraftProspect = (card: PlayerCard) => {
    setState(prev => ({
      ...prev,
      inventory: [...prev.inventory, card],
      pendingDraftPicks: Math.max(0, (prev.pendingDraftPicks || 1) - 1)
    }));
    if ((state.pendingDraftPicks || 1) <= 1) {
      setDraftClass([]);
    }
  };
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [releaseConfirmCardId, setReleaseConfirmCardId] = useState<string | null>(null);
  const [viewingRosterTeamId, setViewingRosterTeamId] = useState<string | null>(null);

  // Secret Developer Cheats Unlocked State
  const [cheatsUnlocked, setCheatsUnlocked] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('nba_cheats_unlocked') === 'true' : false;
  });

  // Legacy Game Mode and Hack States
  const [activeGameMode, setActiveGameMode] = useState<'primary' | 'legacy'>('primary');
  const [hackMenuOpen, setHackMenuOpen] = useState<boolean>(false);
  const [displayUserAccountId, setDisplayUserAccountId] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('nba_display_uid') === 'true' : false;
  });

  // Sync displayUserAccountId to localStorage
  useEffect(() => {
    localStorage.setItem('nba_display_uid', String(displayUserAccountId));
  }, [displayUserAccountId]);

  // Capture Tab key for Hack Menu
  useEffect(() => {
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && cheatsUnlocked) {
        e.preventDefault();
        setHackMenuOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleTabKey);
    return () => window.removeEventListener('keydown', handleTabKey);
  }, [cheatsUnlocked]);

  // --- GM Account Management State & Handlers ---
  const [activeAccount, setActiveAccount] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('nba_active_account_name') : null;
  });

  const [accounts, setAccounts] = useState<FranchiseAccount[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nba_dynasty_accounts');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountAction, setAccountAction] = useState<'menu' | 'login' | 'create'>('menu');
  const [createStep, setCreateStep] = useState<'name' | 'pin'>('name');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [createUsername, setCreateUsername] = useState('');
  const [createPin, setCreatePin] = useState('');
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountSuccess, setAccountSuccess] = useState<string | null>(null);

  // Auto-sync current active account's game progress
  useEffect(() => {
    storageManager.saveState(state);
    if (activeAccount) {
      const savedAccounts = localStorage.getItem('nba_dynasty_accounts');
      const accountsList: FranchiseAccount[] = savedAccounts ? JSON.parse(savedAccounts) : [];
      const updated = accountsList.map(acc => {
        if (acc.username.toLowerCase() === activeAccount.toLowerCase()) {
          return { ...acc, gameState: state };
        }
        return acc;
      });
      localStorage.setItem('nba_dynasty_accounts', JSON.stringify(updated));
    }
  }, [state, activeAccount]);

  const handleCreateAccountComplete = () => {
    if (createPin.length !== 4) {
      setAccountError('PIN password must be exactly 4 digits.');
      return;
    }

    const trimmedName = createUsername.trim();
    const newAccount: FranchiseAccount = {
      username: trimmedName,
      pin: createPin,
      gameState: { ...state } // Save current progress as initial state for this new GM profile!
    };

    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    localStorage.setItem('nba_dynasty_accounts', JSON.stringify(updatedAccounts));

    // Sign in automatically
    setActiveAccount(trimmedName);
    localStorage.setItem('nba_active_account_name', trimmedName);

    setAccountSuccess(`GM Profile "${trimmedName}" successfully registered! Welcome aboard.`);
    setAccountError(null);
    setCreateUsername('');
    setCreatePin('');

    setTimeout(() => {
      setAccountModalOpen(false);
      setAccountSuccess(null);
    }, 1500);
  };

  const handleLoginComplete = () => {
    const trimmedName = loginUsername.trim();
    const account = accounts.find(acc => acc.username.toLowerCase() === trimmedName.toLowerCase());

    if (!account) {
      setAccountError('GM Profile username not found.');
      return;
    }

    if (account.pin !== loginPin) {
      setAccountError('Incorrect 4-digit PIN password.');
      return;
    }

    // Success login!
    setActiveAccount(account.username);
    localStorage.setItem('nba_active_account_name', account.username);
    setState(account.gameState);

    setAccountSuccess(`Signed in successfully as GM ${account.username}! Loading franchise...`);
    setAccountError(null);
    setLoginUsername('');
    setLoginPin('');

    setTimeout(() => {
      setAccountModalOpen(false);
      setAccountSuccess(null);
    }, 1500);
  };

  const handleLogout = () => {
    setActiveAccount(null);
    localStorage.removeItem('nba_active_account_name');
    
    // Return to local guest state
    const guestState = storageManager.loadState();
    setState(guestState);

    setAccountSuccess('Signed out of GM Profile. Loaded guest session.');
    setAccountError(null);
    setAccountAction('menu');
  };

  const handleDeleteAccount = (username: string) => {
    const updated = accounts.filter(acc => acc.username.toLowerCase() !== username.toLowerCase());
    setAccounts(updated);
    localStorage.setItem('nba_dynasty_accounts', JSON.stringify(updated));

    if (activeAccount?.toLowerCase() === username.toLowerCase()) {
      setActiveAccount(null);
      localStorage.removeItem('nba_active_account_name');
      setState(storageManager.loadState());
    }

    setAccountSuccess(`Deleted GM Profile "${username}".`);
    setTimeout(() => setAccountSuccess(null), 2500);
  };

  // Active Chemistry Analysis
  const chemistryAnalysis = analyzeLineup(state.roster);

  // Handle signing a Free Agent
  const handleSignFreeAgent = (cardId: string) => {
    // Check total signed Free Agents in inventory + roster
    const signedFAsInInventory = state.inventory.filter(c => c.isFreeAgent).length;
    let signedFAsInRoster = 0;
    (Object.values(state.roster.starters) as (PlayerCard | null)[]).forEach(c => {
      if (c?.isFreeAgent) signedFAsInRoster++;
    });
    state.roster.bench.forEach(c => {
      if (c?.isFreeAgent) signedFAsInRoster++;
    });

    const totalSigned = signedFAsInInventory + signedFAsInRoster;

    if (totalSigned >= 2) {
      setAlertMessage("⚠️ Possession Limit Reached!\n\nYou can only sign up to 2 Free Agents to your franchise at any one time. Please release one of your existing Free Agents first.");
      return;
    }

    const playerToSign = state.freeAgentsMarket.find(c => c.id === cardId);
    if (!playerToSign) return;

    setState(prev => {
      const nextMarket = prev.freeAgentsMarket.filter(c => c.id !== cardId);
      const nextInventory = [...prev.inventory, playerToSign];

      return {
        ...prev,
        freeAgentsMarket: nextMarket,
        inventory: nextInventory
      };
    });
  };

  // Trigger custom release dialog instead of prompt-confirm
  const handleReleaseFreeAgent = (cardId: string) => {
    setReleaseConfirmCardId(cardId);
  };

  // Handle actually releasing a player card
  const executeReleaseFreeAgent = (cardId: string) => {
    setState(prev => {
      // Find the card to put back in free agents pool if it was a Free Agent
      const cardToRelease = prev.inventory.find(c => c.id === cardId) ||
        (Object.values(prev.roster.starters) as (PlayerCard | null)[]).find(c => c?.id === cardId) ||
        prev.roster.bench.find(c => c.id === cardId);

      if (!cardToRelease) return prev;

      const nextInventory = prev.inventory.filter(c => c.id !== cardId);

      const starters = { ...prev.roster.starters };
      (Object.keys(starters) as Position[]).forEach(pos => {
        if (starters[pos]?.id === cardId) {
          starters[pos] = null;
        }
      });

      const nextBench = prev.roster.bench.filter(c => c.id !== cardId);

      // If it was a free agent, put them back on the market. Otherwise they are discarded/released.
      let nextMarket = prev.freeAgentsMarket;
      if (cardToRelease.isFreeAgent) {
        // Remove individual averages/stats when going back to market
        const cleanedCard = {
          ...cardToRelease,
          gamesPlayed: 0,
          pointsAvg: 0,
          assistsAvg: 0,
          reboundsAvg: 0
        };
        nextMarket = [...prev.freeAgentsMarket, cleanedCard];
      }

      return {
        ...prev,
        inventory: nextInventory,
        roster: { starters, bench: nextBench },
        freeAgentsMarket: nextMarket
      };
    });
    setReleaseConfirmCardId(null);
  };

  // Save state on change
  useEffect(() => {
    storageManager.saveState(state);
  }, [state]);

  // Initial welcome message check
  useEffect(() => {
    if (state.inventory.length > 0) {
      setWelcomeOpen(false);
    }
  }, [state.inventory]);

  // Handle free starter pack openings (gives 6 random players)
  const handleOpenStarterPacks = () => {
    // Generate 6 starter cards
    const starterCards: PlayerCard[] = [];
    const rollCount = 6;
    
    for (let i = 0; i < rollCount; i++) {
      // Pick random templates to form a modest, challenging starter team
      let candidates = PLAYER_TEMPLATES;
      if (i === 0) {
        // Star player: OVR between 76 and 82 (Epic or Rare tier role model)
        candidates = PLAYER_TEMPLATES.filter(p => p.baseOvr >= 76 && p.baseOvr <= 82);
        if (candidates.length === 0) {
          candidates = PLAYER_TEMPLATES.filter(p => p.baseOvr < 83);
        }
      } else {
        // Role players: OVR between 60 and 75 (Common or lower-end Rare)
        candidates = PLAYER_TEMPLATES.filter(p => p.baseOvr >= 60 && p.baseOvr <= 75);
        if (candidates.length === 0) {
          candidates = PLAYER_TEMPLATES.filter(p => p.baseOvr < 78);
        }
      }
      
      const randomTemplate = candidates[Math.floor(Math.random() * candidates.length)];
      
      // Instantiate card
      const uniqueId = Math.random().toString(36).substring(2, 11);
      starterCards.push({
        id: uniqueId,
        templateId: randomTemplate.id,
        name: randomTemplate.name,
        era: randomTemplate.era,
        primaryPosition: randomTemplate.primaryPosition,
        secondaryPosition: randomTemplate.secondaryPosition,
        archetype: randomTemplate.archetype,
        teamHistory: randomTemplate.teamHistory,
        rarity: randomTemplate.baseOvr >= 90 ? 'Legendary' : (randomTemplate.baseOvr >= 83 ? 'Epic' : (randomTemplate.baseOvr >= 78 ? 'Rare' : 'Common')),
        stats: { ...randomTemplate.baseStats },
        hiddenAttributes: { ...randomTemplate.hiddenAttributes },
        traits: [...randomTemplate.traits],
        ovr: randomTemplate.baseOvr,
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
      });
    }

    setState(prev => ({
      ...prev,
      inventory: [...prev.inventory, ...starterCards],
      coins: prev.coins + 250 // starter bonus
    }));
    
    setWelcomeOpen(false);
    setActiveTab('roster');
  };

  // Buy custom pack store handler
  const handleBuyPack = (pack: PackType, cards: PlayerCard[]) => {
    setState(prev => {
      const nextInventory = [...prev.inventory, ...cards];
      return {
        ...prev,
        inventory: nextInventory,
        coins: Math.max(0, prev.coins - pack.cost)
      };
    });
  };

  // Upgrade player card handler
  const handleUpgradeCard = (updatedCard: PlayerCard, cost: number) => {
    setState(prev => {
      // Update inventory
      const nextInventory = prev.inventory.map(c => c.id === updatedCard.id ? updatedCard : c);
      
      // Update roster starters if present
      const nextStarters = { ...prev.roster.starters };
      Object.keys(nextStarters).forEach(key => {
        const k = key as Position;
        if (nextStarters[k]?.id === updatedCard.id) {
          nextStarters[k] = updatedCard;
        }
      });

      // Update roster bench if present
      const nextBench = prev.roster.bench.map(c => c.id === updatedCard.id ? updatedCard : c);

      return {
        ...prev,
        inventory: nextInventory,
        roster: { starters: nextStarters, bench: nextBench },
        coins: Math.max(0, prev.coins - cost)
      };
    });
  };

  // Lineup Slot Assignments
  const handleAssignCard = (card: PlayerCard) => {
    if (!assigningSlot) return;

    setState(prev => {
      const starters = { ...prev.roster.starters };
      let bench = [...prev.roster.bench];

      // Remove from old slot if already positioned on field
      Object.keys(starters).forEach(k => {
        const pos = k as Position;
        if (starters[pos]?.id === card.id) {
          starters[pos] = null;
        }
      });
      bench = bench.filter(b => b.id !== card.id);

      if (assigningSlot === 'bench') {
        bench.push(card);
      } else {
        // Check if slot has a player already, if so send back to bench or inventory
        const existing = starters[assigningSlot];
        if (existing) {
          bench.push(existing);
        }
        starters[assigningSlot] = card;
      }

      return {
        ...prev,
        roster: { starters, bench }
      };
    });

    setAssigningSlot(null);
  };

  const handleRemoveCard = (cardId: string, slot: Position | 'bench') => {
    setState(prev => {
      const starters = { ...prev.roster.starters };
      let bench = [...prev.roster.bench];

      if (slot === 'bench') {
        bench = bench.filter(b => b.id !== cardId);
      } else {
        starters[slot] = null;
      }

      return {
        ...prev,
        roster: { starters, bench }
      };
    });
  };

  // SIMULATE NEXT GAME
  const handleSimulateNextGame = () => {
    const nextGameIndex = state.seasonProgress;
    const maxGames = state.settings?.gamesPerSeason || 82;
    if (nextGameIndex >= maxGames) return;

    // Check lineup eligibility (must have at least all 5 starters assigned)
    const isLineupReady = Object.values(state.roster.starters).every(Boolean);
    if (!isLineupReady) {
      setAlertMessage("⚠️ Roster Incomplete!\n\nPlease assign a starting player to all 5 positions (PG, SG, SF, PF, C) in the Lineup tab before playing.");
      setActiveTab('roster');
      return;
    }

    const nextMatchup = state.seasonSchedule[nextGameIndex];
    if (!nextMatchup) return;

    const opponentId = nextMatchup[0] === 'player-team' ? nextMatchup[1] : nextMatchup[0];
    const opponent = state.standings.find(t => t.id === opponentId)!;

    // Calculate dynamic OVR for the player for this matchup
    const cards = Object.values(state.roster.starters).filter(Boolean) as PlayerCard[];
    const avgOvr = cards.reduce((acc: number, c) => acc + c.ovr, 0) / cards.length;

    const gameResult = simulateBasketballGame({
      playerTeam: state.roster,
      opponentTeamName: opponent.name,
      opponentOvr: 78 + (opponent.wins / Math.max(1, state.seasonProgress)) * 20, // dynamic AI overall (harder base)
      difficultyMultiplier: 1.02 + (state.year * 0.05) + (state.settings?.difficultyModifier || 0), // scale difficulty per New Game+ (increased)
      chemistry: chemistryAnalysis.score
    });

    gameResult.gameNumber = nextGameIndex + 1;

    // Update standing and coins
    setState(prev => {
      const allTeamIds = prev.standings.map(s => s.id);
      const aiMatchups = getAiMatchupsForGameDay(allTeamIds, opponentId, prev.seasonProgress);

      const aiResults: Record<string, { isWin: boolean; ptsFor: number; ptsAgainst: number }> = {};
      aiMatchups.forEach(([teamA, teamB]) => {
        const stdA = prev.standings.find(s => s.id === teamA);
        const stdB = prev.standings.find(s => s.id === teamB);
        
        // Dynamically get their overall ratings based on wins
        const ovrA = stdA ? Math.round(78 + (stdA.wins / Math.max(1, prev.seasonProgress)) * 20) : 75;
        const ovrB = stdB ? Math.round(78 + (stdB.wins / Math.max(1, prev.seasonProgress)) * 20) : 75;

        // Weighted win probability based on team overall ratings
        const probA = 0.5 + (ovrA - ovrB) * 0.025;
        const isWinA = Math.random() < Math.max(0.15, Math.min(0.85, probA));

        const scoreWinner = Math.floor(Math.random() * 25) + 100;
        const scoreLoser = scoreWinner - Math.floor(Math.random() * 15) - 2;

        aiResults[teamA] = {
          isWin: isWinA,
          ptsFor: isWinA ? scoreWinner : scoreLoser,
          ptsAgainst: isWinA ? scoreLoser : scoreWinner
        };
        aiResults[teamB] = {
          isWin: !isWinA,
          ptsFor: !isWinA ? scoreWinner : scoreLoser,
          ptsAgainst: !isWinA ? scoreLoser : scoreWinner
        };
      });

      const nextStandings = prev.standings.map(t => {
        if (t.id === 'player-team') {
          const wins = gameResult.isPlayerWin ? t.wins + 1 : t.wins;
          const losses = !gameResult.isPlayerWin ? t.losses + 1 : t.losses;
          const streak = gameResult.isPlayerWin ? (t.streak > 0 ? t.streak + 1 : 1) : (t.streak < 0 ? t.streak - 1 : -1);
          return {
            ...t,
            wins,
            losses,
            streak,
            pointsFor: t.pointsFor + gameResult.team1Score,
            pointsAgainst: t.pointsAgainst + gameResult.team2Score
          };
        } else if (t.id === opponentId) {
          const wins = !gameResult.isPlayerWin ? t.wins + 1 : t.wins;
          const losses = gameResult.isPlayerWin ? t.losses + 1 : t.losses;
          const streak = !gameResult.isPlayerWin ? (t.streak > 0 ? t.streak + 1 : 1) : (t.streak < 0 ? t.streak - 1 : -1);
          return {
            ...t,
            wins,
            losses,
            streak,
            pointsFor: t.pointsFor + gameResult.team2Score,
            pointsAgainst: t.pointsAgainst + gameResult.team1Score
          };
        }
        
        // Sim other matches in standings
        const res = aiResults[t.id];
        if (res) {
          const wins = res.isWin ? t.wins + 1 : t.wins;
          const losses = !res.isWin ? t.losses + 1 : t.losses;
          const streak = res.isWin ? (t.streak > 0 ? t.streak + 1 : 1) : (t.streak < 0 ? t.streak - 1 : -1);
          return {
            ...t,
            wins,
            losses,
            streak,
            pointsFor: t.pointsFor + res.ptsFor,
            pointsAgainst: t.pointsAgainst + res.ptsAgainst
          };
        }
        return t;
      });

      // Earn Coins (wins grant 100 base + 50 streak bonuses. Loss gets nothing!)
      let coinsEarned = 0;
      if (gameResult.isPlayerWin) {
        coinsEarned = 100;
        const currentStreak = prev.standings.find(t => t.id === 'player-team')?.streak || 0;
        if (currentStreak > 1) {
          coinsEarned += Math.min(100, currentStreak * 15); // streak multipliers
        }
      }
      coinsEarned = Math.round(coinsEarned * (prev.settings?.coinsMultiplier || 1.0));

      // Update Individual Player Card Stats (for box scores averages & RPG leveling!)
      let levelUpAlerts: string[] = [];
      const nextInventory = prev.inventory.map(c => {
        const statsGained = gameResult.playerStats?.[c.id];
        if (statsGained) {
          const prevGames = c.gamesPlayed || 0;
          const nextGames = prevGames + 1;
          const pointsAvg = (((c.pointsAvg || 0) * prevGames) + statsGained.points) / nextGames;
          const assistsAvg = (((c.assistsAvg || 0) * prevGames) + statsGained.assists) / nextGames;
          const reboundsAvg = (((c.reboundsAvg || 0) * prevGames) + statsGained.rebounds) / nextGames;
          
          // Apply RPG XP and Leveling
          const xpResult = gainXpAndCheckLevelUp(c, statsGained.points, statsGained.assists, statsGained.rebounds, prev.settings?.xpMultiplier || 1.0);
          
          if (xpResult.leveledUp) {
            levelUpAlerts.push(`⚡ ${c.name} leveled up to Lv. ${xpResult.card.level}! (OVR improved to ${xpResult.card.ovr})`);
          }
          
          return {
            ...xpResult.card,
            gamesPlayed: nextGames,
            pointsAvg,
            assistsAvg,
            reboundsAvg
          };
        }
        return c;
      });

      if (levelUpAlerts.length > 0 && !disableXpAlerts) {
        setTimeout(() => {
          setAlertMessage(`🎉 PLAYER LEVEL UP!\n\n${levelUpAlerts.join('\n')}\n\nYour players have grown stronger! Check the Upgrades tab to view their new stats.`);
        }, 100);
      }

      return {
        ...prev,
        seasonProgress: prev.seasonProgress + 1,
        standings: nextStandings,
        coins: prev.coins + coinsEarned,
        inventory: nextInventory,
        seasonGamesHistory: [gameResult, ...prev.seasonGamesHistory]
      };
    });

    setSelectedBoxScore(gameResult);
  };

  // Simulate multiple games rapidly
  const handleFastSimulateGames = (gamesCount: number) => {
    const isLineupReady = Object.values(state.roster.starters).every(Boolean);
    if (!isLineupReady) {
      setAlertMessage("⚠️ Complete your Lineup before simulating regular-season games.");
      setActiveTab('roster');
      return;
    }

    const maxGames = state.settings?.gamesPerSeason || 82;
    const gamesToSim = Math.min(gamesCount, maxGames - state.seasonProgress);
    if (gamesToSim <= 0) return;

    let levelUpAlerts: string[] = [];

    for (let i = 0; i < gamesToSim; i++) {
      // Simulate sequentially in loop using state closure references
      // To run instantly, we will let the parent state update in a bulk batch
    }

    // Fast-bulk simulate state generator
    setState(prev => {
      let currentProgress = prev.seasonProgress;
      let currentCoins = prev.coins;
      let standingsClone = prev.standings.map(t => ({ ...t }));
      let inventoryClone = prev.inventory.map(c => ({ ...c }));
      const newHistory: GameResult[] = [];

      for (let i = 0; i < gamesToSim; i++) {
        const matchIdx = currentProgress;
        const matchup = prev.seasonSchedule[matchIdx];
        if (!matchup) break;

        const opponentId = matchup[0] === 'player-team' ? matchup[1] : matchup[0];
        const opp = standingsClone.find(t => t.id === opponentId)!;

        const result = simulateBasketballGame({
          playerTeam: prev.roster,
          opponentTeamName: opp.name,
          opponentOvr: 78 + (opp.wins / Math.max(1, currentProgress)) * 20, // dynamic AI overall (harder base)
          difficultyMultiplier: 1.02 + (prev.year * 0.05) + (prev.settings?.difficultyModifier || 0), // scale difficulty per New Game+ (increased)
          chemistry: chemistryAnalysis.score
        });

        result.gameNumber = currentProgress + 1;
        newHistory.unshift(result);

        const allTeamIds = standingsClone.map(s => s.id);
        const aiMatchups = getAiMatchupsForGameDay(allTeamIds, opponentId, currentProgress);

        const aiResults: Record<string, { isWin: boolean; ptsFor: number; ptsAgainst: number }> = {};
        aiMatchups.forEach(([teamA, teamB]) => {
          const stdA = standingsClone.find(s => s.id === teamA);
          const stdB = standingsClone.find(s => s.id === teamB);
          
          const ovrA = stdA ? Math.round(78 + (stdA.wins / Math.max(1, currentProgress)) * 20) : 75;
          const ovrB = stdB ? Math.round(78 + (stdB.wins / Math.max(1, currentProgress)) * 20) : 75;

          const probA = 0.5 + (ovrA - ovrB) * 0.025;
          const isWinA = Math.random() < Math.max(0.15, Math.min(0.85, probA));

          const scoreWinner = Math.floor(Math.random() * 25) + 100;
          const scoreLoser = scoreWinner - Math.floor(Math.random() * 15) - 2;

          aiResults[teamA] = {
            isWin: isWinA,
            ptsFor: isWinA ? scoreWinner : scoreLoser,
            ptsAgainst: isWinA ? scoreLoser : scoreWinner
          };
          aiResults[teamB] = {
            isWin: !isWinA,
            ptsFor: !isWinA ? scoreWinner : scoreLoser,
            ptsAgainst: !isWinA ? scoreLoser : scoreWinner
          };
        });

        // Update standing entries
        standingsClone = standingsClone.map(t => {
          if (t.id === 'player-team') {
            const wins = result.isPlayerWin ? t.wins + 1 : t.wins;
            const losses = !result.isPlayerWin ? t.losses + 1 : t.losses;
            const streak = result.isPlayerWin ? (t.streak > 0 ? t.streak + 1 : 1) : (t.streak < 0 ? t.streak - 1 : -1);
            return {
              ...t,
              wins,
              losses,
              streak,
              pointsFor: t.pointsFor + result.team1Score,
              pointsAgainst: t.pointsAgainst + result.team2Score
            };
          } else if (t.id === opponentId) {
            const wins = !result.isPlayerWin ? t.wins + 1 : t.wins;
            const losses = result.isPlayerWin ? t.losses + 1 : t.losses;
            const streak = !result.isPlayerWin ? (t.streak > 0 ? t.streak + 1 : 1) : (t.streak < 0 ? t.streak - 1 : -1);
            return {
              ...t,
              wins,
              losses,
              streak,
              pointsFor: t.pointsFor + result.team2Score,
              pointsAgainst: t.pointsAgainst + result.team1Score
            };
          }
          
          // Sim AI-vs-AI
          const res = aiResults[t.id];
          if (res) {
            const wins = res.isWin ? t.wins + 1 : t.wins;
            const losses = !res.isWin ? t.losses + 1 : t.losses;
            const streak = res.isWin ? (t.streak > 0 ? t.streak + 1 : 1) : (t.streak < 0 ? t.streak - 1 : -1);
            return {
              ...t,
              wins,
              losses,
              streak,
              pointsFor: t.pointsFor + res.ptsFor,
              pointsAgainst: t.pointsAgainst + res.ptsAgainst
            };
          }
          return t;
        });

        // Coins multiplier
        if (result.isPlayerWin) {
          currentCoins += Math.round(100 * (prev.settings?.coinsMultiplier || 1.0));
        }

        // Stats tracking
        inventoryClone = inventoryClone.map(c => {
          const statsGained = result.playerStats?.[c.id];
          if (statsGained) {
            const prevGames = c.gamesPlayed || 0;
            const nextGames = prevGames + 1;
            const pointsAvg = (((c.pointsAvg || 0) * prevGames) + statsGained.points) / nextGames;
            const assistsAvg = (((c.assistsAvg || 0) * prevGames) + statsGained.assists) / nextGames;
            const reboundsAvg = (((c.reboundsAvg || 0) * prevGames) + statsGained.rebounds) / nextGames;
            
            // Apply RPG XP and Leveling
            const xpResult = gainXpAndCheckLevelUp(c, statsGained.points, statsGained.assists, statsGained.rebounds, prev.settings?.xpMultiplier || 1.0);
            
            if (xpResult.leveledUp) {
              const alertStr = `⚡ ${c.name} leveled up to Lv. ${xpResult.card.level}! (OVR improved to ${xpResult.card.ovr})`;
              if (!levelUpAlerts.includes(alertStr)) {
                levelUpAlerts.push(alertStr);
              }
            }

            return {
              ...xpResult.card,
              gamesPlayed: nextGames,
              pointsAvg,
              assistsAvg,
              reboundsAvg
            };
          }
          return c;
        });

        currentProgress++;
      }

      if (levelUpAlerts.length > 0 && !disableXpAlerts) {
        setTimeout(() => {
          setAlertMessage(`🎉 PLAYERS LEVELED UP DURING SIMULATION!\n\n${levelUpAlerts.join('\n')}\n\nThey have automatically grown stronger! Check the Upgrades tab to view their new stats.`);
        }, 100);
      }

      return {
        ...prev,
        seasonProgress: currentProgress,
        standings: standingsClone,
        coins: currentCoins,
        inventory: inventoryClone,
        seasonGamesHistory: [...newHistory, ...prev.seasonGamesHistory]
      };
    });
  };

  // QUALIFY AND INIT PLAYOFFS
  const handleStartPlayoffs = () => {
    // Rank conference standings
    const eastRanked = state.standings.filter(t => t.conference === 'East').sort((a, b) => b.wins - a.wins);
    const westRanked = state.standings.filter(t => t.conference === 'West').sort((a, b) => b.wins - a.wins);

    // Player conference rank (Player is always in East)
    const playerConferenceRank = eastRanked.findIndex(t => t.isPlayer) + 1;

    if (playerConferenceRank > 4) {
      setAlertMessage(`❌ Missed playoffs!\n\nYou finished Rank #${playerConferenceRank} in the Eastern Conference (Top 4 required). Please restart your season or spend coins to Rebirth.`);
      setState(prev => ({ ...prev, isSeasonCompleted: true, playoffsActive: false }));
      return;
    }

    // Initialize Best of 7 playoff brackets for East and West Conferences
    const qualifiedEast = eastRanked.slice(0, 4).map(t => t.id);
    const qualifiedWest = westRanked.slice(0, 4).map(t => t.id);
    
    // R1 Conference Semifinals:
    // Matchup 0: East #1 vs East #4
    // Matchup 1: East #2 vs East #3
    // Matchup 2: West #1 vs West #4
    // Matchup 3: West #2 vs West #3
    const pairings = [
      [qualifiedEast[0], qualifiedEast[3]],
      [qualifiedEast[1], qualifiedEast[2]],
      [qualifiedWest[0], qualifiedWest[3]],
      [qualifiedWest[1], qualifiedWest[2]]
    ];

    const matchups: PlayoffMatchup[] = pairings.map((pair, idx) => ({
      id: `playoff-r1-${idx}`,
      round: 1,
      team1Id: pair[0],
      team2Id: pair[1],
      team1Wins: 0,
      team2Wins: 0,
      winnerId: null,
      games: []
    }));

    setState(prev => ({
      ...prev,
      playoffsActive: true,
      playoffRound: 1,
      playoffBracket: matchups
    }));

    setActiveTab('dashboard');
  };

  // Playoff Round advance
  const handleAdvancePlayoffRound = (currentBracket: PlayoffMatchup[]) => {
    setState(prev => {
      const nextRound = prev.playoffRound + 1;
      
      let nextMatchups: PlayoffMatchup[] = [];
      if (nextRound === 2) {
        // Semifinals (Conference Finals):
        // Matchup 0 winner vs Matchup 1 winner (East Final)
        // Matchup 2 winner vs Matchup 3 winner (West Final)
        const win0 = currentBracket.find(m => m.id === 'playoff-r1-0')?.winnerId || 'AI Team';
        const win1 = currentBracket.find(m => m.id === 'playoff-r1-1')?.winnerId || 'AI Team';
        const win2 = currentBracket.find(m => m.id === 'playoff-r1-2')?.winnerId || 'AI Team';
        const win3 = currentBracket.find(m => m.id === 'playoff-r1-3')?.winnerId || 'AI Team';

        nextMatchups = [
          {
            id: 'playoff-r2-0',
            round: 2,
            team1Id: win0,
            team2Id: win1,
            team1Wins: 0,
            team2Wins: 0,
            winnerId: null,
            games: []
          },
          {
            id: 'playoff-r2-1',
            round: 2,
            team1Id: win2,
            team2Id: win3,
            team1Wins: 0,
            team2Wins: 0,
            winnerId: null,
            games: []
          }
        ];
      } else if (nextRound === 3) {
        // NBA Finals:
        // Winner of r2-0 vs Winner of r2-1
        const win0 = currentBracket.find(m => m.id === 'playoff-r2-0')?.winnerId || 'AI Team';
        const win1 = currentBracket.find(m => m.id === 'playoff-r2-1')?.winnerId || 'AI Team';

        nextMatchups = [
          {
            id: 'playoff-r3-0',
            round: 3,
            team1Id: win0,
            team2Id: win1,
            team1Wins: 0,
            team2Wins: 0,
            winnerId: null,
            games: []
          }
        ];
      }

      return {
        ...prev,
        playoffRound: nextRound,
        playoffBracket: [...currentBracket, ...nextMatchups]
      };
    });
  };

  const handlePlayoffCompleted = (winnerId: string, seriesCompleted: PlayoffMatchup[]) => {
    if (winnerId === 'player-team') {
      // Won championship!
      setState(prev => ({
        ...prev,
        championshipsWon: prev.championshipsWon + 1,
        coins: prev.coins + 5000, // Massive champ bonus!
        playoffsActive: false,
        isSeasonCompleted: true,
        playoffBracket: seriesCompleted
      }));
    } else {
      // Eliminated
      setState(prev => ({
        ...prev,
        playoffsActive: false,
        isSeasonCompleted: true,
        playoffBracket: seriesCompleted
      }));
    }
  };

  // REBIRTH / NEW GAME+ SYSTEM IMPLEMENTATION
  const handleRebirth = (legacyIds: string[]) => {
    // Keep specified inventory cards
    const keptCards = state.inventory.filter(c => legacyIds.includes(c.id));
    
    // Clear matches count for kept cards
    const resetKeptCards = keptCards.map(c => ({
      ...c,
      isLegacy: true,
      gamesPlayed: 0,
      pointsAvg: 0,
      assistsAvg: 0,
      reboundsAvg: 0
    }));

    // Reset whole game state to New Year!
    const nextYear = state.year + 1;
    const currentSettings = state.settings || {
      gamesPerSeason: 82,
      xpMultiplier: 1.0,
      coinsMultiplier: 1.0,
      difficultyModifier: 0.0
    };
    const freshState = DEFAULT_STATE(nextYear, currentSettings.gamesPerSeason);

    setState({
      ...freshState,
      year: nextYear,
      inventory: resetKeptCards,
      championshipsWon: state.championshipsWon,
      coins: Math.max(1000, state.coins - 500), // Carry over coins with small base tax or guarantee 1000
      settings: currentSettings
    });

    setActiveTab('dashboard');
  };

  // Trigger custom reset franchise confirmation dialog instead of prompt confirm
  const handleFullReset = () => {
    setResetConfirmOpen(true);
  };

  // Perform the actual reset execution when confirmed in the modal
  const executeFullReset = () => {
    storageManager.clearState();
    
    const currentSettings = state.settings || {
      gamesPerSeason: 82,
      xpMultiplier: 1.0,
      coinsMultiplier: 1.0,
      difficultyModifier: 0.0
    };
    
    const freshState = DEFAULT_STATE(1, currentSettings.gamesPerSeason);
    freshState.settings = currentSettings;
    
    setState(freshState);
    setActiveTab('dashboard');
    setWelcomeOpen(true);
    setResetConfirmOpen(false);
  };

  const handleLaunchCustomSandbox = (game: any) => {
    setSandboxGame(game);
    setSandboxLogs([
      `🎮 Initializing customized sandbox for ${game.name.toUpperCase()}...`,
      `⚙️ Generating default rival conferences and roster templates...`,
      `🟢 Standby! Roster initialized and ready for automated scheduling.`
    ]);
    setSandboxTeamScores({ score1: 0, score2: 0 });
  };

  const handleRemoveCustomGame = (index: number) => {
    setCustomGames(prev => {
      const updated = prev.filter((_, idx) => idx !== index);
      localStorage.setItem('arcade_custom_games', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSaveCustomGame = () => {
    if (!newGameName.trim()) {
      setAlertMessage("⚠️ Please enter a game name.");
      return;
    }
    const newGame = {
      name: newGameName.trim(),
      description: newGameDesc.trim() || "No custom description provided.",
      genre: newGameGenre,
      color: newGameColor
    };
    setCustomGames(prev => {
      const updated = [...prev, newGame];
      localStorage.setItem('arcade_custom_games', JSON.stringify(updated));
      return updated;
    });
    setNewGameName('');
    setNewGameDesc('');
    setNewGameGenre('Sports');
    setNewGameColor('blue');
    setAddGameModalOpen(false);
  };

  const handleSimulateSandboxMatch = () => {
    if (!sandboxGame) return;
    const score1 = Math.floor(Math.random() * 45) + 80;
    const score2 = Math.floor(Math.random() * 45) + 80;
    setSandboxTeamScores({ score1, score2 });
    setSandboxLogs(prev => [
      ...prev,
      `🔄 Simulating dynamic sandbox game play...`,
      `⏱️ Q1/Q2/Q3/Q4 Completed in standard CPU time...`,
      `🏁 FINAL SCORES: Team A [${score1}] - Team B [${score2}] in ${sandboxGame.name}!`,
      `🏆 Simulation completed successfully.`
    ]);
  };

  // Quick stats computed
  const playerOverall = (() => {
    const cards = Object.values(state.roster.starters).filter(Boolean) as PlayerCard[];
    if (cards.length === 0) return 0;
    return Math.round(cards.reduce((acc: number, c) => acc + c.ovr, 0) / cards.length);
  })();

  const signedFAs = (() => {
    const signedFAsInInventory = state.inventory.filter(c => c.isFreeAgent).length;
    let signedFAsInRoster = 0;
    (Object.values(state.roster.starters) as (PlayerCard | null)[]).forEach(c => {
      if (c?.isFreeAgent) signedFAsInRoster++;
    });
    state.roster.bench.forEach(c => {
      if (c?.isFreeAgent) signedFAsInRoster++;
    });
    return signedFAsInInventory + signedFAsInRoster;
  })();

  const signedFACards = (() => {
    const list: PlayerCard[] = [];
    state.inventory.forEach(c => {
      if (c.isFreeAgent) list.push(c);
    });
    (Object.values(state.roster.starters) as (PlayerCard | null)[]).forEach(c => {
      if (c?.isFreeAgent && !list.some(x => x.id === c.id)) list.push(c);
    });
    state.roster.bench.forEach(c => {
      if (c.isFreeAgent && !list.some(x => x.id === c.id)) list.push(c);
    });
    return list;
  })();

  const currentMatchup = state.seasonSchedule[state.seasonProgress];
  const upcomingOpponent = currentMatchup
    ? (currentMatchup[0] === 'player-team' ? currentMatchup[1] : currentMatchup[0])
    : null;
  const opponentTeam = upcomingOpponent ? state.standings.find(t => t.id === upcomingOpponent) : null;

  if (launcherOpen) {
    return (
      <ArcadeLauncher
        state={state}
        onLaunchPrimary={() => {
          setLauncherOpen(false);
          setActiveGameMode('primary');
        }}
        onLaunchLegacy={() => {
          setLauncherOpen(false);
          setActiveGameMode('legacy');
        }}
        customGames={customGames}
        onAddGame={(newGame) => {
          setCustomGames(prev => {
            const updated = [...prev, newGame];
            localStorage.setItem('arcade_custom_games', JSON.stringify(updated));
            return updated;
          });
        }}
        onRemoveGame={(index) => {
          setCustomGames(prev => {
            const updated = prev.filter((_, idx) => idx !== index);
            localStorage.setItem('arcade_custom_games', JSON.stringify(updated));
            return updated;
          });
        }}
      />
    );
  }

  if (activeGameMode === 'legacy') {
    return (
      <>
        <LegacyModeView
          onBackToLauncher={() => setLauncherOpen(true)}
          cheatsEnabled={cheatsUnlocked}
        />
        <HackMenu
          isOpen={hackMenuOpen}
          onClose={() => setHackMenuOpen(false)}
          state={state}
          setState={setState}
          accounts={accounts}
          setAccounts={setAccounts}
          activeAccount={activeAccount}
          displayUserAccountId={displayUserAccountId}
          setDisplayUserAccountId={setDisplayUserAccountId}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* GLOW DECORATIONS */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER STATUS */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.35)]">
            <Flame className="w-5 h-5 text-slate-950 fill-slate-950" />
          </div>
          <div>
            <h1 className="font-display font-black text-white text-sm md:text-base tracking-tight leading-none">
              NBA DYNASTY PACKS
            </h1>
            <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block mt-0.5">
              Era Builder Simulator
            </span>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="flex items-center gap-3.5 md:gap-5">
          {/* Year info */}
          <div className="font-mono text-right hidden sm:block">
            <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-widest leading-none">Progression</span>
            <span className="text-white font-bold text-xs md:text-sm">Year {state.year}</span>
          </div>

          {/* Championship trophy */}
          {state.championshipsWon > 0 && (
            <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-md text-yellow-400 font-mono text-xs font-bold">
              <Trophy className="w-3.5 h-3.5 shrink-0" />
              <span>{state.championshipsWon} Rings</span>
            </div>
          )}

          {/* Record info */}
          <div className="font-mono text-right">
            <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-widest leading-none">Regular Record</span>
            <span className="text-emerald-400 font-black text-xs md:text-sm">
              {state.standings.find(t => t.isPlayer)?.wins || 0} - {state.standings.find(t => t.isPlayer)?.losses || 0}
            </span>
          </div>

          {/* Economy Gold Coins */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg font-mono text-xs">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-bold">{state.coins.toLocaleString()}</span>
          </div>

          {/* GM Profile Account Button */}
          <button
            onClick={() => {
              setAccountAction('menu');
              setAccountModalOpen(true);
            }}
            className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 ${
              activeAccount
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-300 hover:bg-purple-950/60 font-semibold'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700 animate-pulse'
            }`}
            title="Manage GM Accounts"
          >
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>
              {activeAccount 
                ? `GM: ${activeAccount}${displayUserAccountId ? ` (${getPlayerId(activeAccount)})` : ''}` 
                : 'Login/Register'}
            </span>
          </button>

          {/* Launcher Return Button */}
          <button
            onClick={() => setLauncherOpen(true)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-300 transition-all cursor-pointer active:scale-95"
            title="Return to Multi-Game Arcade Hub Launcher"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden md:inline">Exit to Launcher</span>
          </button>
        </div>
      </header>

      {/* DRAFT MODAL */}
      {(state.pendingDraftPicks || 0) > 0 && draftClass.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-purple-500/30 rounded-2xl p-6 max-w-4xl w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
              </div>

              <h3 className="font-display font-black text-3xl text-white tracking-tight uppercase">Year {state.year} NBA Draft</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto">
                You have {state.pendingDraftPicks} draft pick(s). Select a prospect to join your franchise!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {draftClass.map(prospect => (
                  <div key={prospect.id} className="flex flex-col items-center gap-4">
                    <PlayerCardView card={prospect} size="md" showStats={true} />
                    <button
                      onClick={() => handleSelectDraftProspect(prospect)}
                      className="w-full bg-purple-500 text-slate-950 font-black py-3 rounded-lg hover:bg-purple-400 transition-all uppercase tracking-wider text-xs active:scale-95"
                    >
                      Draft Prospect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GM ACCOUNT MANAGER DIALOG */}
      {accountModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-purple-400" />
              </div>

              <div className="text-center">
                <h3 className="font-display font-black text-2xl text-white tracking-tight uppercase">GM Profiles Manager</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {activeAccount ? `Logged in as GM ${activeAccount}` : 'Manage your official franchise accounts'}
                </p>
              </div>

              {accountError && (
                <div className="bg-rose-950/30 border border-rose-900/50 text-rose-300 p-2.5 rounded-lg text-xs font-mono text-center">
                  ⚠️ {accountError}
                </div>
              )}

              {accountSuccess && (
                <div className="bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 p-2.5 rounded-lg text-xs font-mono text-center">
                  ✅ {accountSuccess}
                </div>
              )}

              {/* ACTION: MAIN MENU */}
              {accountAction === 'menu' && (
                <div className="space-y-3 pt-2">
                  {activeAccount ? (
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 text-center">
                      <p className="text-xs text-slate-400 font-mono">CURRENT ACTIVE GM PROFILE</p>
                      <p className="font-display font-black text-xl text-purple-400 tracking-tight mt-0.5">{activeAccount}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">Year {state.year} • {state.championshipsWon} Rings • {state.coins} Coins</p>
                      <button
                        onClick={handleLogout}
                        className="mt-3 bg-red-950/30 hover:bg-red-900/30 border border-red-900/30 text-red-400 font-mono text-[11px] font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer w-full"
                      >
                        Sign Out of GM Account
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 text-center text-xs text-slate-400 font-mono">
                      Currently playing as Guest. Create a GM profile to save and share your franchise progress anytime!
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => {
                        setAccountAction('login');
                        setAccountError(null);
                        setAccountSuccess(null);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold py-2.5 px-4 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Login GM
                    </button>
                    <button
                      onClick={() => {
                        setAccountAction('create');
                        setAccountError(null);
                        setAccountSuccess(null);
                        setCreateStep('name');
                      }}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold py-2.5 px-4 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Create GM
                    </button>
                  </div>

                  {/* Saved Accounts Switcher List */}
                  {accounts.length > 0 && (
                    <div className="pt-3 border-t border-slate-850">
                      <span className="text-[10px] uppercase text-slate-500 font-mono font-bold tracking-wider block mb-2">
                        Switch Registered GM Profiles ({accounts.length})
                      </span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {accounts.map(acc => (
                          <div
                            key={acc.username}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono ${
                              activeAccount?.toLowerCase() === acc.username.toLowerCase()
                                ? 'bg-purple-950/20 border-purple-900/50 text-purple-300'
                                : 'bg-slate-950 border-slate-850 text-slate-400'
                            }`}
                          >
                            <div>
                              <span className="font-bold text-white block">
                                {acc.username}
                                {displayUserAccountId && (
                                  <span className="text-purple-400 font-mono text-[9px] font-normal ml-1.5">
                                    ({getPlayerId(acc.username)})
                                  </span>
                                )}
                              </span>
                              <span className="text-[9px] text-slate-500 block">Year {acc.gameState?.year || 1} • {acc.gameState?.championshipsWon || 0} Rings</span>
                            </div>
                            <div className="flex gap-1.5">
                              {activeAccount?.toLowerCase() !== acc.username.toLowerCase() && (
                                <button
                                  onClick={() => {
                                    setLoginUsername(acc.username);
                                    setLoginPin('');
                                    setAccountAction('login');
                                    setAccountError(null);
                                    setAccountSuccess(null);
                                  }}
                                  className="bg-slate-850 hover:bg-slate-750 text-emerald-400 font-bold px-2 py-1 rounded text-[10px] transition-colors cursor-pointer"
                                >
                                  Login
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteAccount(acc.username)}
                                className="hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                                title="Delete account profile"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setAccountModalOpen(false)}
                    className="w-full bg-slate-900 text-slate-400 hover:text-slate-300 font-mono text-xs py-2 rounded-lg border border-slate-800 transition-colors mt-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* ACTION: CREATE GM */}
              {accountAction === 'create' && (
                <div className="space-y-4 pt-2">
                  {createStep === 'name' ? (
                    <div className="space-y-3">
                      <label className="text-xs font-mono font-bold text-slate-400 block">SELECT GM PROFILE NAME:</label>
                      <input
                        type="text"
                        placeholder="e.g. Coach Carter"
                        value={createUsername}
                        onChange={e => setCreateUsername(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-white outline-none focus:border-purple-500 transition-colors"
                        maxLength={20}
                        autoFocus
                      />
                      <p className="text-[10px] text-slate-500 font-mono">This will be your official franchise manager signature.</p>

                      <div className="flex gap-2.5 pt-2">
                        <button
                          onClick={() => setAccountAction('menu')}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs py-2 rounded-lg transition-colors cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => {
                            if (!createUsername.trim()) {
                              setAccountError('Please enter a GM Profile Name.');
                              return;
                            }
                            const exists = accounts.some(acc => acc.username.toLowerCase() === createUsername.trim().toLowerCase());
                            if (exists) {
                              setAccountError('This GM Name is already registered. Please select another.');
                              return;
                            }
                            setAccountError(null);
                            setCreateStep('pin');
                          }}
                          className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs py-2 rounded-lg transition-colors cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="text-xs font-mono font-bold text-slate-400 block">CREATE 4-DIGIT PIN PASSWORD:</label>
                      <input
                        type="password"
                        placeholder="••••"
                        value={createPin}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 4) setCreatePin(val);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-center text-lg tracking-widest font-mono text-white outline-none focus:border-purple-500 transition-colors"
                        maxLength={4}
                        autoFocus
                      />
                      <p className="text-[10px] text-slate-500 font-mono text-center">Type a simple 4-digit PIN to secure and load your GM profile.</p>

                      <div className="flex gap-2.5 pt-2">
                        <button
                          onClick={() => setCreateStep('name')}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs py-2 rounded-lg transition-colors cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleCreateAccountComplete}
                          className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs py-2 rounded-lg transition-colors cursor-pointer"
                        >
                          Create GM Profile
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ACTION: LOGIN GM */}
              {accountAction === 'login' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase mb-1">GM Profile Name:</label>
                    <input
                      type="text"
                      placeholder="Enter username"
                      value={loginUsername}
                      onChange={e => setLoginUsername(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-purple-500 transition-colors"
                      maxLength={20}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase mb-1">4-Digit PIN Password:</label>
                    <input
                      type="password"
                      placeholder="••••"
                      value={loginPin}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 4) setLoginPin(val);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-center text-sm tracking-widest font-mono text-white outline-none focus:border-purple-500 transition-colors"
                      maxLength={4}
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      onClick={() => setAccountAction('menu')}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleLoginComplete}
                      className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TUTORIAL WELCOME MODAL FOR FIRST PLAYERS */}
      {welcomeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500/30 rounded-2xl p-6 max-w-md w-full text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-emerald-400 animate-pulse" />
            </div>

            <div>
              <h3 className="font-display font-black text-xl text-white tracking-tight">WELCOME COACH!</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Welcome to the ultimate NBA Era simulation. Your goal is to buy packs, pull legendary cards across history, optimize team chemistry, train stats, and win championships.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-850 p-4 rounded-lg text-left text-xs space-y-2 font-mono">
              <p className="text-emerald-400 font-bold">💎 FRANCHISE BUDGET GRANTED:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                <li>Received <b>3,000 starting coins</b> to spend on packs</li>
                <li>Sign up to <b>2 cheap/free low-rated fillers</b> from the Free Agents tab</li>
                <li>Assemble your starting 5 to begin simulating the season</li>
                <li>Earn massive coin bonuses for wins and streaks</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setWelcomeOpen(false);
                setActiveTab('shop');
              }}
              className="w-full bg-emerald-500 text-slate-950 font-black py-3 rounded-lg hover:bg-emerald-400 transition-all uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 active:scale-97"
            >
              <span>Go to Packs Store</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER LAYOUT */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* SIDE NAVIGATION MENU */}
        <nav className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-850 bg-slate-950/50 p-4 flex md:flex-col justify-start md:justify-between gap-1.5 md:gap-4 overflow-x-auto shrink-0">
          <div className="flex md:flex-col gap-1.5 w-full">
            {/* Dashboard tab */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all w-full shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-emerald-400 border-l-2 border-l-emerald-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden md:inline">Season Office</span>
            </button>

            {/* Lineup / Roster tab */}
            <button
              onClick={() => setActiveTab('roster')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all w-full shrink-0 ${
                activeTab === 'roster'
                  ? 'bg-slate-900 text-emerald-400 border-l-2 border-l-emerald-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span className="hidden md:inline">Lineup Floor</span>
              </div>
              {playerOverall > 0 && (
                <span className="bg-slate-950 font-mono text-[10px] text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-900/30 hidden md:inline">
                  {playerOverall} OVR
                </span>
              )}
            </button>

            {/* Free Agents Market tab */}
            <button
              onClick={() => setActiveTab('freeagents')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all w-full shrink-0 ${
                activeTab === 'freeagents'
                  ? 'bg-slate-900 text-emerald-400 border-l-2 border-l-emerald-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-4 h-4" />
                <span className="hidden md:inline">Free Agents</span>
              </div>
              <span className="bg-slate-950 font-mono text-[10px] text-slate-400 px-1.5 py-0.5 rounded border border-slate-800 hidden md:inline">
                Market
              </span>
            </button>

            {/* Store Card packs tab */}
            <button
              onClick={() => setActiveTab('shop')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all w-full shrink-0 ${
                activeTab === 'shop'
                  ? 'bg-slate-900 text-emerald-400 border-l-2 border-l-emerald-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden md:inline">Packs Store</span>
            </button>

            {/* Upgrades tab */}
            <button
              onClick={() => setActiveTab('upgrades')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all w-full shrink-0 ${
                activeTab === 'upgrades'
                  ? 'bg-slate-900 text-emerald-400 border-l-2 border-l-emerald-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden md:inline">Train & Evolve</span>
            </button>

            {/* Match History tab */}
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all w-full shrink-0 ${
                activeTab === 'history'
                  ? 'bg-slate-900 text-emerald-400 border-l-2 border-l-emerald-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden md:inline">Match Logs</span>
            </button>

            {/* Multiplayer 1v1 tab */}
            <button
              onClick={() => {
                if (!activeAccount) {
                  setAlertMessage("🔒 1v1 Matchmaking Locked!\n\nYou must register a GM Profile Account or sign in first to access live P2P 1v1 matchups.");
                  return;
                }
                setActiveTab('multiplayer');
              }}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all w-full shrink-0 ${
                activeTab === 'multiplayer'
                  ? 'bg-slate-900 text-emerald-400 border-l-2 border-l-emerald-500'
                  : !activeAccount
                  ? 'text-slate-600 opacity-40 cursor-not-allowed bg-slate-950/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <Radio className="w-4 h-4" />
              <div className="flex items-center justify-between w-full">
                <span className="hidden md:inline">1v1 Cross-Play</span>
                {!activeAccount && (
                  <span className="hidden md:inline text-[8px] bg-slate-950 text-slate-500 border border-slate-900 px-1 py-0.5 rounded uppercase tracking-wider font-mono">LOCKED</span>
                )}
              </div>
            </button>
            
            {/* Legacy Link tab */}
            <button
              onClick={() => setActiveTab('legacylink')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all w-full shrink-0 ${
                activeTab === 'legacylink'
                  ? 'bg-slate-900 text-sky-400 border-l-2 border-l-sky-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <Send className="w-4 h-4 text-sky-400" />
              <span className="hidden md:inline">Legacy Link</span>
            </button>

            {/* Settings tab */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all w-full shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-slate-900 text-emerald-400 border-l-2 border-l-emerald-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">Settings</span>
            </button>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="hidden md:flex flex-col gap-2 pt-4 border-t border-slate-850">
            <button
              onClick={handleFullReset}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-[10px] text-slate-500 hover:text-red-400 transition-colors w-full font-mono font-bold uppercase"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Franchise</span>
            </button>
          </div>
        </nav>

        {/* VIEWPORTS DISPLAY CONTAINER */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          
          {/* TAB 1: SEASON DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* STATUS BAR CONTAINER */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* UPCOMING MATCHUP BOX */}
                <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-mono font-bold block">
                      League Match Room
                    </span>
                    <h3 className="font-display font-black text-white text-base mt-1 tracking-tight">
                      Next Scheduled Opponent
                    </h3>

                    {opponentTeam ? (
                      <div className="flex items-center justify-around py-5 bg-slate-950/40 rounded-lg border border-slate-800/60 mt-4">
                        <div className="text-center w-2/5">
                          <div className="font-display font-bold text-xs text-emerald-400">YOUR FRANCHISE</div>
                          <span className="text-[10px] text-slate-400 font-mono">OVR {playerOverall || 'N/A'}</span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 font-bold uppercase">VS</div>
                        <div className="text-center w-2/5 flex flex-col items-center">
                          <div className="font-display font-bold text-xs text-white line-clamp-1">{opponentTeam.name}</div>
                          <span className="text-[10px] text-slate-400 font-mono">OVR {Math.round(78 + (opponentTeam.wins / Math.max(1, state.seasonProgress)) * 20)}</span>
                          <button
                            onClick={() => setViewingRosterTeamId(opponentTeam.id)}
                            className="text-[9px] bg-slate-850 hover:bg-slate-750 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/20 mt-1 transition-all inline-flex items-center gap-1 active:scale-95 cursor-pointer"
                          >
                            <Users className="w-2.5 h-2.5" /> Scout
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-xs text-slate-500 font-mono">
                        Regular Season Completed! Click below to start the playoffs.
                      </div>
                    )}
                  </div>

                  {/* SIMULATE CONTROLS */}
                  <div className="pt-4 border-t border-slate-850/60 mt-4">
                    {state.seasonProgress < (state.settings?.gamesPerSeason || 82) && (
                      <div className="flex items-center justify-between mb-3 bg-slate-950/20 border border-slate-850/50 rounded-lg p-2.5">
                        <span className="text-[10.5px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          ⚡ Level-Up Alerts
                        </span>
                        <button
                          onClick={() => {
                            setDisableXpAlerts(prev => {
                              const next = !prev;
                              localStorage.setItem('nba_disable_xp_alerts', String(next));
                              return next;
                            });
                          }}
                          className={`text-[9.5px] font-mono font-bold px-2 py-1 rounded transition-colors border cursor-pointer ${
                            disableXpAlerts 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          }`}
                        >
                          {disableXpAlerts ? 'MUTED (LEVELS STILL GAINED)' : 'ENABLED'}
                        </button>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {state.seasonProgress < (state.settings?.gamesPerSeason || 82) ? (
                        <>
                          <button
                            onClick={handleSimulateNextGame}
                            className="bg-emerald-500 text-slate-950 font-black px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-md active:scale-97 cursor-pointer"
                          >
                            <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
                            <span>Simulate Game {state.seasonProgress + 1}</span>
                          </button>
                          
                          <button
                            onClick={() => handleFastSimulateGames(5)}
                            className="bg-slate-800 text-slate-300 font-bold px-3 py-2.5 rounded-lg text-xs uppercase tracking-wider hover:bg-slate-700 transition-all font-mono cursor-pointer"
                          >
                            Sim 5
                          </button>

                          <button
                            onClick={() => handleFastSimulateGames(state.settings?.gamesPerSeason || 82)}
                            className="bg-slate-850 text-slate-400 hover:text-white font-bold px-3 py-2.5 rounded-lg text-xs uppercase tracking-wider hover:bg-slate-800 transition-all font-mono border border-slate-800 cursor-pointer"
                          >
                            Sim End
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleStartPlayoffs}
                          className="w-full bg-yellow-500 text-slate-950 font-black py-3 rounded-lg text-xs uppercase tracking-wider hover:bg-yellow-400 transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-97 cursor-pointer"
                        >
                          <Award className="w-4 h-4" />
                          <span>Enter Best-of-7 NBA Playoffs Bracket</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* CHEMISTRY DIAL */}
                <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-mono font-bold block">
                      Roster Synergy
                    </span>
                    <h3 className="font-display font-black text-white text-base mt-1 tracking-tight">
                      Lineup Chemistry
                    </h3>

                    <div className="flex items-center gap-4 mt-4">
                      <div className="relative w-16 h-16 shrink-0 flex items-center justify-center rounded-full border-4 border-emerald-500/20 bg-emerald-500/5">
                        <span className="font-mono text-xl font-black text-emerald-400">
                          {chemistryAnalysis.score}%
                        </span>
                      </div>
                      <div className="text-[11px] leading-snug text-slate-400">
                        <p>💡 Affects player simulation metrics.</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Match Eras (80s, 90s, Modern) or Archetypes.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-850 text-[10px] font-mono space-y-1 text-slate-400 mt-4 max-h-[100px] overflow-y-auto">
                    {chemistryAnalysis.bonuses.length === 0 ? (
                      <span className="text-slate-500 italic">No chemistry synergies active. Swap matching players!</span>
                    ) : (
                      chemistryAnalysis.bonuses.map((b, i) => (
                        <div key={i} className="text-emerald-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-yellow-400 shrink-0" />
                          <span>{b}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* REBIRTH PROGRESSION AREA */}
                <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-purple-400 font-mono font-bold block">
                      Dynasty Sanctuary
                    </span>
                    <h3 className="font-display font-black text-white text-base mt-1 tracking-tight">
                      Rebirth Progression
                    </h3>

                    <div className="mt-4 space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between border-b border-slate-850 pb-1">
                        <span className="text-slate-400">Current Year:</span>
                        <span className="text-purple-400 font-bold">Year {state.year}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-850 pb-1">
                        <span className="text-slate-400">Championships:</span>
                        <span className="text-yellow-400 font-bold flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> {state.championshipsWon} Rings
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-850 pb-1">
                        <span className="text-slate-400">AI Buff Rating:</span>
                        <span className="text-red-400 font-bold">
                          +{Math.round((state.year - 1) * 3.5)} OVR Team OVR
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-850 text-[10px] font-mono text-slate-400 mt-4">
                    <p className="text-purple-300 font-bold mb-0.5">🏆 REBIRTH NG+ RULE:</p>
                    <p className="leading-tight text-[10.5px]">
                      Win the championship to unlock Rebirth. Keep your Hall of Fame players, but the league gets harder each season (+3.5 OVR to AI)!
                    </p>
                  </div>
                </div>

              </div>

              {/* DYNAMIC MIDDLE SCREEN: IF IN PLAYOFFS SHOW BRACKET, ELSE SHOW STANDINGS */}
              {state.playoffsActive ? (
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                    <Award className="w-6 h-6 text-yellow-400 animate-pulse" />
                    <div>
                      <h3 className="font-display font-black text-xl text-white tracking-tight uppercase">Best-of-7 Playoff Bracket</h3>
                      <p className="text-xs text-slate-400">Advance rounds to win the prestigious Year {state.year} Larry O'Brien Championship Trophy</p>
                    </div>
                  </div>
                  
                  <PlayoffsView
                    playoffsActive={state.playoffsActive}
                    playoffRound={state.playoffRound}
                    playoffBracket={state.playoffBracket}
                    roster={state.roster}
                    chemistryScore={chemistryAnalysis.score}
                    standings={state.standings}
                    onPlayoffCompleted={handlePlayoffCompleted}
                    onAdvanceRound={handleAdvancePlayoffRound}
                    onUpdateBracket={(bracket) => setState(prev => ({ ...prev, playoffBracket: bracket }))}
                    onRebirth={handleRebirth}
                    onViewRoster={setViewingRosterTeamId}
                  />
                </div>
              ) : (
                /* STANDINGS TABLE PANEL */
                <StandingsView standings={state.standings} currentWeek={state.seasonProgress} onViewRoster={setViewingRosterTeamId} />
              )}
            </div>
          )}

          {/* TAB 2: ACTIVE LINEUP FLOOR (COURT DISPLAY) */}
          {activeTab === 'roster' && (
            <div className="space-y-6">
              
              {/* Header */}
              <div>
                <h2 className="font-display font-black text-white text-lg tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  LINEUP FLOOR & FRANCHISE ROSTER
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Assign player cards from your inventory into court slots. Match positions to avoid the severe <b className="text-red-400">-20% out-of-position penalty</b>.
                </p>
              </div>

              {/* Roster Chemistry and Warnings */}
              {chemistryAnalysis.warnings.length > 0 && (
                <div className="bg-red-950/30 border border-red-900/40 p-3 rounded-lg text-xs font-mono text-red-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>ROSTER NOTIFICATION WARNINGS:</span>
                  </div>
                  {chemistryAnalysis.warnings.map((w, idx) => (
                    <div key={idx} className="pl-5">• {w}</div>
                  ))}
                </div>
              )}

              {/* INTERACTIVE BASKETBALL COURT VISUALIZATION */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Visual half-court board */}
                <div className="lg:col-span-7 bg-zinc-950 border border-slate-800 rounded-2xl p-6 relative flex flex-col items-center justify-center min-h-[480px]">
                  
                  {/* Basketball half-court vector markings */}
                  <div className="absolute inset-x-0 bottom-0 top-1/2 border-t-2 border-slate-800/40 pointer-events-none" />
                  <div className="absolute top-0 w-24 h-12 border-2 border-t-0 border-slate-800/40 rounded-b-full pointer-events-none" />
                  <div className="absolute top-0 w-48 h-40 border-2 border-t-0 border-slate-800/40 pointer-events-none" />
                  <div className="absolute top-40 w-48 h-24 border-2 border-t-0 border-slate-800/40 rounded-b-full pointer-events-none" />

                  {/* COURT SLOTS */}
                  <div className="relative w-full h-full flex flex-col justify-between items-center gap-8 z-10">
                    
                    {/* Position 5: Center key */}
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-500 font-bold tracking-widest font-mono">C - CENTER SLOT</span>
                      {state.roster.starters.C ? (
                        <div className="relative group">
                          <PlayerCardView card={state.roster.starters.C} slotPos="C" size="sm" showStats={false} />
                          <button
                            onClick={() => handleRemoveCard(state.roster.starters.C!.id, 'C')}
                            className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAssigningSlot('C')}
                          className="w-40 h-44 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950/80 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-slate-500 hover:text-slate-300"
                        >
                          <Plus className="w-5 h-5" />
                          <span className="font-mono text-[10px] font-bold">Assign C</span>
                        </button>
                      )}
                    </div>

                    {/* Positions 3 and 4: Forwards left/right */}
                    <div className="flex justify-around w-full gap-4">
                      {/* PF Power Forward */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-500 font-bold tracking-widest font-mono">PF - POWER FORWARD</span>
                        {state.roster.starters.PF ? (
                          <div className="relative group">
                            <PlayerCardView card={state.roster.starters.PF} slotPos="PF" size="sm" showStats={false} />
                            <button
                              onClick={() => handleRemoveCard(state.roster.starters.PF!.id, 'PF')}
                              className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAssigningSlot('PF')}
                            className="w-40 h-44 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950/80 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-slate-500 hover:text-slate-300"
                          >
                            <Plus className="w-5 h-5" />
                            <span className="font-mono text-[10px] font-bold">Assign PF</span>
                          </button>
                        )}
                      </div>

                      {/* SF Small Forward */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-500 font-bold tracking-widest font-mono">SF - SMALL FORWARD</span>
                        {state.roster.starters.SF ? (
                          <div className="relative group">
                            <PlayerCardView card={state.roster.starters.SF} slotPos="SF" size="sm" showStats={false} />
                            <button
                              onClick={() => handleRemoveCard(state.roster.starters.SF!.id, 'SF')}
                              className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAssigningSlot('SF')}
                            className="w-40 h-44 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950/80 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-slate-500 hover:text-slate-300"
                          >
                            <Plus className="w-5 h-5" />
                            <span className="font-mono text-[10px] font-bold">Assign SF</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Positions 1 and 2: Guards left/right perimeter */}
                    <div className="flex justify-around w-full gap-4">
                      {/* PG Point Guard */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-500 font-bold tracking-widest font-mono">PG - POINT GUARD</span>
                        {state.roster.starters.PG ? (
                          <div className="relative group">
                            <PlayerCardView card={state.roster.starters.PG} slotPos="PG" size="sm" showStats={false} />
                            <button
                              onClick={() => handleRemoveCard(state.roster.starters.PG!.id, 'PG')}
                              className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAssigningSlot('PG')}
                            className="w-40 h-44 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950/80 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-slate-500 hover:text-slate-300"
                          >
                            <Plus className="w-5 h-5" />
                            <span className="font-mono text-[10px] font-bold">Assign PG</span>
                          </button>
                        )}
                      </div>

                      {/* SG Shooting Guard */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-500 font-bold tracking-widest font-mono">SG - SHOOTING GUARD</span>
                        {state.roster.starters.SG ? (
                          <div className="relative group">
                            <PlayerCardView card={state.roster.starters.SG} slotPos="SG" size="sm" showStats={false} />
                            <button
                              onClick={() => handleRemoveCard(state.roster.starters.SG!.id, 'SG')}
                              className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAssigningSlot('SG')}
                            className="w-40 h-44 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950/80 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-slate-500 hover:text-slate-300"
                          >
                            <Plus className="w-5 h-5" />
                            <span className="font-mono text-[10px] font-bold">Assign SG</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* BENCH AND INVENTORY SELECTION DRAWER */}
                <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col h-[520px]">
                  
                  {assigningSlot ? (
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                          <h4 className="font-display font-bold text-white text-sm">Assigning to [{assigningSlot.toUpperCase()}]</h4>
                          <button
                            onClick={() => setAssigningSlot(null)}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 px-2 py-0.5 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mb-4">
                          Choose a player card below to assign to the active {assigningSlot.toUpperCase()} slot.
                        </p>
                      </div>

                      {/* Filter eligible */}
                      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[300px] pr-1">
                        {state.inventory.length === 0 ? (
                          <div className="text-center py-8 text-slate-600 text-xs italic">Inventory empty. Buy some packs!</div>
                        ) : (() => {
                          let displayList = [...state.inventory];
                          let hasSpotSpecificPlayers = false;

                          if (assigningSlot && assigningSlot !== 'bench') {
                            const eligible = displayList.filter(card => 
                              card.primaryPosition === assigningSlot || card.secondaryPosition === assigningSlot
                            );
                            if (eligible.length > 0) {
                              displayList = eligible;
                              hasSpotSpecificPlayers = true;
                            }
                          }
                          
                          // Sort by OVR descending (highest rated first)
                          displayList.sort((a, b) => b.ovr - a.ovr);

                          return (
                            <>
                              {assigningSlot && assigningSlot !== 'bench' && (
                                <div className="text-[10px] font-mono text-slate-400 bg-slate-950/50 border border-slate-800/40 px-2 py-1 rounded-md mb-3 uppercase flex items-center justify-between">
                                  <span>
                                    {hasSpotSpecificPlayers 
                                      ? `Filtered: Eligible ${assigningSlot} players` 
                                      : `No direct ${assigningSlot} players. Showing all positions.`}
                                  </span>
                                  <span className="text-emerald-400">Sorted by OVR</span>
                                </div>
                              )}
                              {displayList.map(card => {
                                // Check if already in starter slot
                                const isStarterAlready = (Object.values(state.roster.starters) as (PlayerCard | null)[]).some(s => s?.id === card.id);
                                const isBenchAlready = state.roster.bench.some(b => b.id === card.id);
                                
                                return (
                                  <div
                                    key={card.id}
                                    className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                                      isStarterAlready ? 'border-slate-850 opacity-40 bg-slate-950/20' : 'border-slate-800 bg-slate-950/40'
                                    }`}
                                  >
                                    <div className="font-mono text-xs">
                                      <div className="font-sans font-bold text-white text-sm">{card.name}</div>
                                      <span className="text-slate-500 font-bold">{card.primaryPosition}</span>
                                      {card.secondaryPosition && (
                                        <>
                                          <span className="text-slate-700 mx-1">/</span>
                                          <span className="text-slate-500 font-bold">{card.secondaryPosition}</span>
                                        </>
                                      )}
                                      <span className="text-slate-600 mx-1">•</span>
                                      <span className="text-slate-400">{card.era} {card.archetype}</span>
                                      <span className="text-slate-600 mx-1">•</span>
                                      <span className="text-emerald-400 font-bold">OVR {card.ovr}</span>
                                      <span className="text-slate-600 mx-1">•</span>
                                      <span className="text-amber-400 font-bold">Lv.{card.level || 1}</span>
                                      {isBenchAlready && (
                                        <span className="ml-2 text-[9px] bg-blue-500/10 text-blue-400 px-1 rounded uppercase font-bold">
                                          Bench
                                        </span>
                                      )}
                                    </div>

                                    <button
                                      onClick={() => handleAssignCard(card)}
                                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded text-xs transition-colors cursor-pointer"
                                      disabled={isStarterAlready}
                                    >
                                      Assign
                                    </button>
                                  </div>
                                );
                              })}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                          <h4 className="font-display font-bold text-white text-sm">Active 6th Man / Bench Roster</h4>
                          <button
                            onClick={() => setAssigningSlot('bench')}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2 py-1 rounded text-[11px] font-mono"
                          >
                            + Add to Bench
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mb-4">
                          Bench players automatically substitute during quarter simulations when starters deplete their stamina. Minimum 3 bench slots recommended.
                        </p>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[340px] pr-1">
                        {state.roster.bench.length === 0 ? (
                          <div className="text-center py-10 border border-dashed border-slate-800 rounded-lg text-xs text-slate-600 italic">
                            No bench players. Press "+ Add to Bench" to assign backups.
                          </div>
                        ) : (
                          state.roster.bench.map(card => (
                            <div
                              key={card.id}
                              className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between"
                            >
                              <div className="font-mono text-xs">
                                <div className="font-sans font-bold text-white text-sm">{card.name}</div>
                                <span className="text-slate-400">{card.primaryPosition} • {card.era} • OVR {card.ovr}</span>
                              </div>
                              <button
                                onClick={() => handleRemoveCard(card.id, 'bench')}
                                className="text-xs bg-red-950/40 text-red-400 border border-red-900/40 px-2 py-1 rounded hover:bg-red-900/20"
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PACKS SHOP */}
          {activeTab === 'shop' && (
            <ShopView coins={state.coins} onBuyPack={handleBuyPack} />
          )}

          {/* TAB 4: TRAINING & RPG PROGRESSION */}
          {activeTab === 'upgrades' && (
            <UpgradeView
              state={state}
              setState={setState}
            />
          )}

          {/* TAB 6: MATCH LOGS */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display font-black text-white text-lg tracking-tight flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-emerald-400" />
                  FRANCHISE SEASON GAME HISTORY
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Review box scores, player statistics, and historical results for the current year.
                </p>
              </div>

              {state.seasonGamesHistory.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500 italic font-mono">
                  No games simulated yet in Year {state.year}. Go to the Season Office to play your first match!
                </div>
              ) : (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden p-4">
                  <div className="space-y-3.5">
                    {state.seasonGamesHistory.map((game, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-slate-950/80 border border-slate-850 rounded-lg flex items-center justify-between cursor-pointer hover:border-slate-600 transition-colors"
                        onClick={() => setSelectedBoxScore(game)}
                      >
                        <div className="font-mono text-xs">
                          <span className="text-[10px] font-bold uppercase text-slate-500 block">Game #{game.gameNumber}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={game.isPlayerWin ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                              {game.team1Score}
                            </span>
                            <span className="text-slate-600">-</span>
                            <span className={!game.isPlayerWin ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                              {game.team2Score}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-black ml-2 ${
                              game.isPlayerWin ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                            }`}>
                              {game.isPlayerWin ? 'Win' : 'Loss'}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs text-slate-500 font-mono font-bold hover:text-slate-300">
                          View Box Score →
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: FREE AGENTS MARKET */}
          {activeTab === 'freeagents' && (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h2 className="font-display font-black text-white text-lg tracking-tight flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                  NBA FREE AGENT MARKET
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Sign low-rated role players (OVR 55-75, rare 80) to complete empty roster slots. You can have <b>at most 2 Free Agents signed</b> in your franchise at any given time.
                </p>
              </div>

              {/* POSSESSION METER */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">Salary Cap Space</span>
                  <h3 className="font-display font-black text-white text-sm md:text-base flex items-center gap-1.5">
                    Currently Signed Free Agents: <span className="text-emerald-400">{signedFAs} / 2</span>
                  </h3>
                </div>
                <div className="flex-1 max-w-xs">
                  <div className="w-full bg-slate-950 rounded-full h-3.5 border border-slate-800 overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-300 ${
                        signedFAs === 1 ? 'w-1/2 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : signedFAs === 2 ? 'w-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'w-0'
                      }`}
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono block mt-1 text-right">
                    {signedFAs === 2 ? '⚠️ Limit Reached - Release one to sign more' : 'Space available'}
                  </span>
                </div>
              </div>

              {/* CURRENTLY SIGNED FREE AGENTS */}
              <div className="space-y-3.5">
                <h3 className="font-display font-bold text-white text-xs md:text-sm tracking-tight uppercase text-slate-400">
                  Currently Signed Free Agents ({signedFAs} / 2)
                </h3>
                {signedFACards.length === 0 ? (
                  <div className="bg-slate-900/40 border border-dashed border-slate-800 p-6 rounded-xl text-center text-xs text-slate-500 italic">
                    No active Free Agent contracts signed.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {signedFACards.map(card => (
                      <div
                        key={card.id}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-mono font-black text-sm text-emerald-400">
                            {card.ovr}
                          </div>
                          <div>
                            <h4 className="font-sans font-bold text-white text-sm leading-tight">{card.name}</h4>
                            <span className="text-[11px] text-slate-400 font-mono uppercase block mt-0.5">
                              {card.primaryPosition} • {card.archetype}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleReleaseFreeAgent(card.id)}
                          className="bg-red-950/40 border border-red-900/40 text-red-400 hover:bg-red-900 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Release Contract</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AVAILABLE FREE AGENTS MARKET */}
              <div className="space-y-4">
                <h3 className="font-display font-bold text-white text-xs md:text-sm tracking-tight uppercase text-slate-400">
                  Available Players in Pool
                </h3>
                {state.freeAgentsMarket.length === 0 ? (
                  <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-xl text-center text-xs text-slate-500 italic">
                    No free agents available. Reset/advance the season to regenerate new role players.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {state.freeAgentsMarket.map(card => (
                      <div
                        key={card.id}
                        className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
                      >
                        {/* Upper card area */}
                        <div className="p-4 border-b border-slate-850 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-mono text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase">
                                {card.primaryPosition}
                              </span>
                              <h4 className="font-sans font-bold text-white text-sm leading-tight mt-1">{card.name}</h4>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-slate-500 font-mono uppercase block">OVR</span>
                              <span className="text-base font-mono font-black text-emerald-400">{card.ovr}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[10px] font-mono text-slate-400 bg-slate-950/40 rounded-lg p-2 border border-slate-850/60">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Archetype:</span>
                              <span className="font-bold text-slate-300">{card.archetype}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Defense:</span>
                              <span className="text-slate-300">{card.stats.defense}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Scoring:</span>
                              <span className="text-slate-300">{card.stats.scoring}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Passing:</span>
                              <span className="text-slate-300">{card.stats.playmaking}</span>
                            </div>
                          </div>
                        </div>

                        {/* Sign Action Button */}
                        <div className="p-3 bg-slate-950/40 flex justify-end">
                          <button
                            onClick={() => handleSignFreeAgent(card.id)}
                            disabled={signedFAs >= 2}
                            className={`w-full text-center py-2 px-3 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                              signedFAs >= 2
                                ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-800'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md active:scale-97'
                            }`}
                          >
                            {signedFAs >= 2 ? 'Limit Reached (2/2)' : 'Sign Free Agent (0 🪙)'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: MULTIPLAYER 1V1 LOBBY */}
          {activeTab === 'multiplayer' && (
            <MultiplayerView 
              state={state} 
              setState={setState} 
              activeAccount={activeAccount}
              cheatsEnabled={cheatsUnlocked}
            />
          )}

          {/* TAB 9: LEGACY LINK BRIDGE */}
          {activeTab === 'legacylink' && (
            <LegacyLinkView state={state} />
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <SettingsView 
              settings={state.settings!}
              onUpdateSettings={(newSettings) => setState(prev => ({ ...prev, settings: newSettings }))}
              activeAccount={activeAccount}
              cheatsUnlocked={cheatsUnlocked}
              onUnlockCheats={() => {
                setCheatsUnlocked(true);
                localStorage.setItem('nba_cheats_unlocked', 'true');
              }}
            />
          )}

        </main>
      </div>

      {/* BOX SCORE POPUP OVERLAY */}
      {selectedBoxScore && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-5 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="font-mono text-xs">
                <span className="text-[10px] uppercase text-emerald-400 font-bold block">Simulation Recap Room</span>
                <h3 className="font-display font-black text-white text-base mt-0.5">Game #{selectedBoxScore.gameNumber} Box Score</h3>
              </div>
              <button
                onClick={() => setSelectedBoxScore(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2.5 py-1 rounded text-xs"
              >
                Close Box Score
              </button>
            </div>

            {/* Scoreboard banner */}
            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-850 flex justify-around items-center text-center">
              <div className="w-2/5">
                <div className="font-display font-black text-sm text-emerald-400">YOUR FRANCHISE</div>
                <div className="font-mono font-black text-2xl text-white mt-1">{selectedBoxScore.team1Score}</div>
              </div>
              <div className="font-mono text-xs text-slate-600 font-bold">FINAL</div>
              <div className="w-2/5">
                <div className="font-display font-bold text-sm text-slate-400">OPPONENT</div>
                <div className="font-mono font-black text-2xl text-white mt-1">{selectedBoxScore.team2Score}</div>
              </div>
            </div>

            {/* Team Selector Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
              <button
                onClick={() => setBoxScoreTab('player')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  boxScoreTab === 'player' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Your Franchise
              </button>
              <button
                onClick={() => setBoxScoreTab('opponent')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  boxScoreTab === 'opponent' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Opponent
              </button>
            </div>

            {/* Players Box score Table */}
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                {boxScoreTab === 'player' ? 'Your Franchise Player Stats' : 'Opponent Team Player Stats'}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase">
                      <th className="py-2">Player</th>
                      <th className="py-2 text-center w-12">MIN</th>
                      <th className="py-2 text-center w-12">PTS</th>
                      <th className="py-2 text-center w-12">AST</th>
                      <th className="py-2 text-center w-12">REB</th>
                      <th className="py-2 text-center w-12">STL</th>
                      <th className="py-2 text-center w-12">BLK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {boxScoreTab === 'player' ? (
                      Object.entries(selectedBoxScore.playerStats || {}).map(([cardId, statsObj]) => {
                        const stats = statsObj as BoxScoreStats;
                        const player = state.inventory.find(c => c.id === cardId);
                        if (!player) return null;

                        return (
                          <tr key={cardId} className="hover:bg-slate-850/20">
                            <td className="py-2 font-sans font-medium text-white">
                              <div>
                                <span>{player.name}</span>
                                <span className="text-[9px] bg-slate-900 text-slate-500 px-1 py-0.5 rounded ml-1 font-mono">
                                  {player.primaryPosition}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 text-center text-slate-400">{stats.minutes}</td>
                            <td className="py-2 text-center font-bold text-red-300">{stats.points}</td>
                            <td className="py-2 text-center text-sky-300">{stats.assists}</td>
                            <td className="py-2 text-center text-emerald-300">{stats.rebounds}</td>
                            <td className="py-2 text-center text-slate-400">{stats.steals}</td>
                            <td className="py-2 text-center text-slate-400">{stats.blocks}</td>
                          </tr>
                        );
                      })
                    ) : (
                      Object.entries(selectedBoxScore.opponentStats || {}).map(([cardId, statsObj]) => {
                        const stats = statsObj as BoxScoreStats;
                        const player = selectedBoxScore.opponentPlayers?.find(c => c.id === cardId);
                        const playerName = player ? player.name : 'Opponent Player';
                        const playerPos = player ? player.primaryPosition : 'N/A';

                        return (
                          <tr key={cardId} className="hover:bg-slate-850/20">
                            <td className="py-2 font-sans font-medium text-white">
                              <div>
                                <span>{playerName}</span>
                                <span className="text-[9px] bg-slate-900 text-slate-500 px-1 py-0.5 rounded ml-1 font-mono">
                                  {playerPos}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 text-center text-slate-400">{stats.minutes}</td>
                            <td className="py-2 text-center font-bold text-red-300">{stats.points}</td>
                            <td className="py-2 text-center text-sky-300">{stats.assists}</td>
                            <td className="py-2 text-center text-emerald-300">{stats.rebounds}</td>
                            <td className="py-2 text-center text-slate-400">{stats.steals}</td>
                            <td className="py-2 text-center text-slate-400">{stats.blocks}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick coaching recap */}
            <div className="bg-slate-950/40 border border-slate-850 p-3 rounded text-[11px] text-slate-400 leading-relaxed font-mono">
              💡 <b>Recap</b>: Averages are based on simulated quarter-by-quarter fatigue levels. Upgrading your card's <b>stamina</b> minimizes physical drop-offs in the second half.
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM ALERT MODAL */}
      {alertMessage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">Notice</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-line text-left bg-slate-950/50 p-3 rounded-lg border border-slate-850">
                {alertMessage}
              </p>
            </div>
            <button
              onClick={() => setAlertMessage(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-lg text-xs transition-all uppercase tracking-wider active:scale-97 cursor-pointer"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM RESET FRANCHISE CONFIRM MODAL */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400 text-xl font-bold">
              <RotateCcw className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">Reset Entire Franchise?</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed text-left bg-slate-950/50 p-3 rounded-lg border border-slate-850">
                Are you sure you want to reset your entire franchise? This will delete all your earned cards, upgrades, accumulated coins, and start your progress over back at Year 1.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-lg text-xs transition-all uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeFullReset}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg text-xs transition-all uppercase tracking-wider shadow-md shadow-red-600/10 cursor-pointer"
              >
                Reset Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM RELEASE CARD CONFIRM MODAL */}
      {releaseConfirmCardId && (() => {
        const cardToRelease = state.inventory.find(c => c.id === releaseConfirmCardId) ||
          (Object.values(state.roster.starters) as (PlayerCard | null)[]).find(c => c?.id === releaseConfirmCardId) ||
          state.roster.bench.find(c => c.id === releaseConfirmCardId);
        if (!cardToRelease) return null;

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400 text-xl font-bold">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">Release Player?</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed text-left bg-slate-950/50 p-3 rounded-lg border border-slate-850">
                  Are you sure you want to release <b>{cardToRelease.name}</b> (OVR {cardToRelease.ovr})? This permanently removes them from your team and inventory.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setReleaseConfirmCardId(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-lg text-xs transition-all uppercase tracking-wider cursor-pointer"
                >
                  Keep Card
                </button>
                <button
                  onClick={() => executeReleaseFreeAgent(releaseConfirmCardId)}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg text-xs transition-all uppercase tracking-wider shadow-md shadow-red-600/10 cursor-pointer"
                >
                  Release Player
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CUSTOM VIEW TEAM ROSTER MODAL (SCOUT MODE) */}
      {viewingRosterTeamId && (() => {
        const isPlayerTeam = viewingRosterTeamId === 'player-team';
        let teamName = "Your Franchise";
        let teamOvr = playerOverall || 0;
        let recordText = "0W - 0L";
        let teamRoster: Roster | null = null;

        if (isPlayerTeam) {
          teamRoster = state.roster;
          const standing = state.standings.find(s => s.id === 'player-team');
          if (standing) {
            recordText = `${standing.wins}W - ${standing.losses}L`;
          }
        } else {
          const standing = state.standings.find(s => s.id === viewingRosterTeamId);
          if (standing) {
            teamName = standing.name;
            teamOvr = Math.round(78 + (standing.wins / Math.max(1, state.seasonProgress)) * 20);
            recordText = `${standing.wins}W - ${standing.losses}L`;
          }
          teamRoster = state.aiTeamsRosters?.[viewingRosterTeamId] || null;
        }

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-5xl w-full text-center space-y-6 shadow-2xl relative my-8">
              {/* Close Button */}
              <button
                onClick={() => setViewingRosterTeamId(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-slate-800 p-1.5 rounded-full hover:bg-slate-750 cursor-pointer"
              >
                <span className="text-xl leading-none">✕</span>
              </button>

              <div className="text-left border-b border-slate-800 pb-4">
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono font-bold block">
                  Scout View: Lineup & Attributes
                </span>
                <h2 className="font-display font-black text-xl text-white tracking-tight mt-1 uppercase">
                  {teamName}
                </h2>
                <div className="flex gap-4 items-center mt-2 font-mono text-xs">
                  <span className="text-slate-300">
                    OVR: <b className="text-amber-400 text-sm">{teamOvr}</b>
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-300">
                    Record: <b className="text-white">{recordText}</b>
                  </span>
                  {!isPlayerTeam && (
                    <>
                      <span className="text-slate-500">|</span>
                      <span className="text-xs text-emerald-400 font-bold uppercase">AI Opponent</span>
                    </>
                  )}
                </div>
              </div>

              {teamRoster ? (
                <div className="space-y-6 text-left">
                  {/* STARTERS SECTION */}
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 border-l-2 border-emerald-500 pl-2">
                      Starting Lineup
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 justify-items-center">
                      {(['PG', 'SG', 'SF', 'PF', 'C'] as Position[]).map(pos => {
                        const card = teamRoster!.starters[pos];
                        return (
                          <div key={pos} className="flex flex-col items-center w-full">
                            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase mb-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-850 w-full text-center">
                              {pos}
                            </span>
                            {card ? (
                              <PlayerCardView card={card} size="sm" showStats={true} />
                            ) : (
                              <div className="w-48 h-72 border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center bg-slate-950/20 text-slate-600 font-mono text-xs text-center p-4">
                                Empty Slot
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* BENCH SECTION */}
                  {teamRoster.bench && teamRoster.bench.length > 0 && (
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 border-l-2 border-blue-500 pl-2">
                        Bench Rotation
                      </h3>
                      <div className="flex flex-wrap gap-4 justify-start">
                        {teamRoster.bench.map((card, idx) => (
                          <div key={card.id || idx} className="flex flex-col items-center">
                            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase mb-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                              BENCH
                            </span>
                            <PlayerCardView card={card} size="sm" showStats={true} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-slate-400 font-mono">
                  No roster data found for this team.
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setViewingRosterTeamId(null)}
                  className="bg-slate-800 hover:bg-slate-750 text-white font-bold py-2.5 px-6 rounded-lg text-xs transition-all uppercase tracking-wider cursor-pointer"
                >
                  Close Scout View
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* FLOATING HACK MENU OVERLAY */}
      <HackMenu
        isOpen={hackMenuOpen}
        onClose={() => setHackMenuOpen(false)}
        state={state}
        setState={setState}
        accounts={accounts}
        setAccounts={setAccounts}
        activeAccount={activeAccount}
        displayUserAccountId={displayUserAccountId}
        setDisplayUserAccountId={setDisplayUserAccountId}
      />
    </div>
  );
}
