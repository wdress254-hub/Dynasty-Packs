import React, { useState, useEffect } from 'react';
import { GameState, PlayerCard, Position, FranchiseAccount, PlayerTrait, Rarity, Archetype } from '../types';
import { ShieldAlert, Cpu, Sparkles, Terminal, Unlock, UserCheck, Key, Zap, RefreshCw, Layers, Edit, BadgeCheck, Sliders, CheckSquare, Square } from 'lucide-react';

interface HackMenuProps {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  accounts: FranchiseAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<FranchiseAccount[]>>;
  activeAccount: string | null;
  displayUserAccountId: boolean;
  setDisplayUserAccountId: (val: boolean) => void;
}

// Pre-seeded mock profiles for the database sniffer
const PRE_SEEDED_ACCOUNTS = [
  {
    id: '100284',
    username: 'AdamSilver',
    pin: '7777',
    teamName: 'League Office (NY)',
    coins: 999999,
    roster: [
      { name: 'ADAM SILVER (COMMISSIONER)', position: 'SF', ovr: 150, archetype: 'All-Rounder' },
      { name: 'LEAGUE OBSERVER (BOT)', position: 'PG', ovr: 99, archetype: 'Playmaker' }
    ]
  },
  {
    id: '592813',
    username: 'LeBronJames',
    pin: '2323',
    teamName: 'Akron Kings',
    coins: 450000,
    roster: [
      { name: 'LeBron James (90s)', position: 'SF', ovr: 99, archetype: 'Scorer' },
      { name: 'Anthony Davis', position: 'C', ovr: 91, archetype: 'Big Man' }
    ]
  },
  {
    id: '482910',
    username: 'StephenCurry',
    pin: '3030',
    teamName: 'Golden Bay Warriors',
    coins: 300000,
    roster: [
      { name: 'Stephen Curry', position: 'PG', ovr: 98, archetype: 'Sharpshooter' },
      { name: 'Klay Thompson', position: 'SG', ovr: 89, archetype: 'Sharpshooter' }
    ]
  },
  {
    id: '294812',
    username: 'MichaelJordan',
    pin: '2345',
    teamName: 'Chicago Air',
    coins: 888888,
    roster: [
      { name: 'Michael Jordan', position: 'SG', ovr: 99, archetype: 'Scorer' },
      { name: 'Scottie Pippen', position: 'SF', ovr: 94, archetype: 'Defender' }
    ]
  }
];

const AVAILABLE_TRAITS: PlayerTrait[] = [
  'Hall of Fame',
  'MVP Tier',
  'Defensive Anchor',
  'Sharpshooter',
  'Playmaking Genius',
  'Rim Protector',
  'Era Dominator',
  'Clutch Gene'
];

export const HackMenu: React.FC<HackMenuProps> = ({
  isOpen,
  onClose,
  state,
  setState,
  accounts,
  setAccounts,
  activeAccount,
  displayUserAccountId,
  setDisplayUserAccountId
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'editor' | 'online' | 'account'>('card');
  const [crackId, setCrackId] = useState('');
  const [cracking, setCracking] = useState(false);
  const [crackLog, setCrackLog] = useState<string[]>([]);
  const [foundAccount, setFoundAccount] = useState<any | null>(null);
  
  // --- ACCOUNT EXPLOITER EXTENSIONS STATE ---
  const [bannedUsernames, setBannedUsernames] = useState<string[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('nba_banned_accounts') : null;
    return saved ? JSON.parse(saved) : [];
  });
  const [bannedIps, setBannedIps] = useState<string[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('nba_banned_ips') : null;
    return saved ? JSON.parse(saved) : [];
  });
  const [overlayMsgInput, setOverlayMsgInput] = useState('');
  const [packetLogs, setPacketLogs] = useState<string[]>([]);
  const [isSniffing, setIsSniffing] = useState(false);
  
  // Real-time modding inputs
  const [modSuccess, setModSuccess] = useState<string | null>(null);

  // --- FULL CARD EDITOR STATE ---
  const [editingCardId, setEditingCardId] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editPrimaryPosition, setEditPrimaryPosition] = useState<Position>('SF');
  const [editSecondaryPosition, setEditSecondaryPosition] = useState<Position | undefined>(undefined);
  const [editArchetype, setEditArchetype] = useState<Archetype>('All-Rounder');
  const [editRarity, setEditRarity] = useState<Rarity>('Legendary');
  const [editLevel, setEditLevel] = useState<number>(10);
  const [editXp, setEditXp] = useState<number>(999);
  const [editStats, setEditStats] = useState<Record<string, number>>({
    scoring: 150, playmaking: 150, rebounding: 150, defense: 150,
    shooting3PT: 150, shootingMid: 150, shootingFT: 150,
    speed: 150, strength: 150, vertical: 150, stamina: 150
  });
  const [editTraits, setEditTraits] = useState<PlayerTrait[]>([]);

  // Generate a list of editable cards
  const editableCards = (() => {
    const cards: { id: string; name: string; ovr: number; source: 'primary' | 'legacy'; originalCard: PlayerCard }[] = [];
    
    // Add active roster starters
    Object.entries(state.roster.starters).forEach(([pos, card]) => {
      const c = card as PlayerCard | null;
      if (c) {
        cards.push({ id: c.id, name: `${c.name} (${pos})`, ovr: c.ovr, source: 'primary', originalCard: c });
      }
    });
    
    // Add active roster bench
    state.roster.bench.forEach(card => {
      if (card) {
        cards.push({ id: card.id, name: `${card.name} (Bench)`, ovr: card.ovr, source: 'primary', originalCard: card });
      }
    });

    // Add inventory
    state.inventory.forEach(card => {
      if (card) {
        cards.push({ id: card.id, name: `${card.name} (Inventory)`, ovr: card.ovr, source: 'primary', originalCard: card });
      }
    });

    // Add legacy inventory cards
    const saved = localStorage.getItem('nba_legacy_linked_cards');
    if (saved) {
      try {
        const legacyCards: PlayerCard[] = JSON.parse(saved);
        legacyCards.forEach(card => {
          cards.push({ id: card.id, name: `[LEGACY] ${card.name}`, ovr: card.ovr, source: 'legacy', originalCard: card });
        });
      } catch (e) {
        console.error(e);
      }
    }

    // Deduplicate by ID
    const seen = new Set<string>();
    return cards.filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  })();

  // Handle loading a card into the full editor
  useEffect(() => {
    if (editingCardId) {
      const target = editableCards.find(c => c.id === editingCardId);
      if (target) {
        const card = target.originalCard;
        setEditName(card.name);
        setEditPrimaryPosition(card.primaryPosition);
        setEditSecondaryPosition(card.secondaryPosition);
        setEditArchetype(card.archetype);
        setEditRarity(card.rarity);
        setEditLevel(card.level || 1);
        setEditXp(card.xp || 0);
        setEditStats({ ...card.stats });
        setEditTraits(card.traits || []);
      }
    }
  }, [editingCardId]);

  // Apply Full Overcharge / Edit mutations
  const handleApplyFullMutations = () => {
    if (!editingCardId) {
      alert("Please select a player card to modify first!");
      return;
    }
    
    const target = editableCards.find(c => c.id === editingCardId);
    if (!target) return;

    // Calculate new overall rating as the average of edited stats (which can go past 99!)
    const allVals = Object.values(editStats) as number[];
    const calculatedOvr = Math.max(Math.round(allVals.reduce((a, b) => a + b, 0) / allVals.length), 30);

    const updatedProps: Partial<PlayerCard> = {
      name: editName.toUpperCase().trim(),
      primaryPosition: editPrimaryPosition,
      secondaryPosition: editSecondaryPosition === ('None' as any) ? undefined : editSecondaryPosition,
      archetype: editArchetype,
      rarity: editRarity,
      level: editLevel,
      xp: editXp,
      stats: editStats as any,
      traits: editTraits,
      ovr: calculatedOvr
    };

    const updateCard = (card: PlayerCard): PlayerCard => {
      if (card.id !== target.id) return card;
      return {
        ...card,
        ...updatedProps
      } as PlayerCard;
    };

    if (target.source === 'primary') {
      setState(prev => {
        // 1. Check starters
        const startersClone = { ...prev.roster.starters };
        Object.keys(startersClone).forEach(pos => {
          const c = startersClone[pos as Position];
          if (c && c.id === target.id) {
            startersClone[pos as Position] = updateCard(c as PlayerCard);
          }
        });

        // 2. Check bench
        const benchClone = prev.roster.bench.map(c => c.id === target.id ? updateCard(c) : c);

        // 3. Check inventory
        const invClone = prev.inventory.map(c => c.id === target.id ? updateCard(c) : c);

        return {
          ...prev,
          roster: {
            ...prev.roster,
            starters: startersClone,
            bench: benchClone
          },
          inventory: invClone
        };
      });
      
      setModSuccess(`⚡ MUTATION SUCCESS: Overcharged "${editName.toUpperCase()}" with custom parameters (OVR ${calculatedOvr})!`);
    } else {
      // Legacy inventory update
      const saved = localStorage.getItem('nba_legacy_linked_cards');
      if (saved) {
        try {
          const legacyCards: PlayerCard[] = JSON.parse(saved);
          const updatedLegacy = legacyCards.map(c => c.id === target.id ? updateCard(c) : c);
          localStorage.setItem('nba_legacy_linked_cards', JSON.stringify(updatedLegacy));
          
          // Also check starters/bench in legacy mode
          const savedRoster = localStorage.getItem('nba_legacy_roster');
          if (savedRoster) {
            const lRoster = JSON.parse(savedRoster);
            const updatedStarters = { ...lRoster.starters };
            Object.keys(updatedStarters).forEach(pos => {
              const c = updatedStarters[pos as Position];
              if (c && c.id === target.id) {
                updatedStarters[pos as Position] = updateCard(c);
              }
            });
            const updatedBench = lRoster.bench.map((c: any) => c.id === target.id ? updateCard(c) : c);
            localStorage.setItem('nba_legacy_roster', JSON.stringify({ starters: updatedStarters, bench: updatedBench }));
          }
        } catch (e) {
          console.error(e);
        }
      }
      
      // Force App state update to trigger render cascade
      setState(prev => ({ ...prev }));
      setModSuccess(`⚡ RETRO OVERCHARGE SUCCESS: Injected mutations into Legacy Card "${editName.toUpperCase()}"!`);
    }

    setTimeout(() => setModSuccess(null), 4000);
  };

  const handleTraitToggle = (trait: PlayerTrait) => {
    if (editTraits.includes(trait)) {
      setEditTraits(prev => prev.filter(t => t !== trait));
    } else {
      setEditTraits(prev => [...prev, trait]);
    }
  };

  const handleStatChange = (statKey: string, value: number) => {
    setEditStats(prev => ({
      ...prev,
      [statKey]: Math.min(999, Math.max(0, value))
    }));
  };

  useEffect(() => {
    // Escape key closes modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // --- DETAILED CLIENT INTEL GENERATION ---
  interface IpGeoInfo {
    ip: string;
    location: string;
    isp: string;
    carrier: string;
    ping: string;
    vpn: boolean;
    device: string;
    email: string;
    regDate: string;
  }

  const getAccountDetails = (username: string): IpGeoInfo => {
    const normalized = username.toLowerCase();
    if (normalized === 'adam_silver' || normalized === 'adamsilver') {
      return {
        ip: '204.14.8.102',
        location: 'Manhattan, New York, USA',
        isp: 'Verizon Enterprise',
        carrier: 'Direct Corporate Fiber',
        ping: '3ms',
        vpn: false,
        device: 'MacBook Pro M3 Max (MacOS 14.5)',
        email: 'commissioner@nba.com',
        regDate: '2021-10-12 08:34:11 UTC'
      };
    }
    if (normalized === 'lebronjames') {
      return {
        ip: '172.56.21.104',
        location: 'Akron, Ohio, USA',
        isp: 'AT&T Mobility',
        carrier: 'LTE/5G Mobile',
        ping: '42ms',
        vpn: false,
        device: 'iPhone 15 Pro Max (iOS 17.2)',
        email: 'kingjames@nike.com',
        regDate: '2023-01-15 14:10:55 UTC'
      };
    }
    if (normalized === 'stephencurry') {
      return {
        ip: '73.162.84.19',
        location: 'San Francisco, California, USA',
        isp: 'Comcast Cable Communications',
        carrier: 'Xfinity Residential Broadband',
        ping: '12ms',
        vpn: false,
        device: 'iPad Pro 12.9 (iPadOS 17.1)',
        email: 'chef.curry@sc30.com',
        regDate: '2023-04-20 21:05:40 UTC'
      };
    }
    if (normalized === 'michaeljordan') {
      return {
        ip: '68.12.210.55',
        location: 'Chicago, Illinois, USA',
        isp: 'Charter Communications',
        carrier: 'Spectrum Business',
        ping: '31ms',
        vpn: true,
        device: 'Apple Vision Pro (visionOS 1.1)',
        email: 'mj23@airjordan.com',
        regDate: '2022-06-23 11:15:30 UTC'
      };
    }
    
    // Deterministic generation for custom or active user
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    
    const cities = [
      'Los Angeles, CA, USA', 'Houston, TX, USA', 'Philadelphia, PA, USA', 'Phoenix, AZ, USA', 
      'San Antonio, TX, USA', 'San Diego, CA, USA', 'Dallas, TX, USA', 'San Jose, CA, USA',
      'Boston, MA, USA', 'Miami, FL, USA', 'Seattle, WA, USA', 'Toronto, ON, Canada',
      'London, United Kingdom', 'Paris, France', 'Tokyo, Japan', 'Berlin, Germany'
    ];
    const isps = [
      'Comcast Cable', 'Spectrum', 'Cox Communications', 'Optimum', 'AT&T Internet', 
      'Verizon Fios', 'CenturyLink', 'Frontier Communications', 'Rogers Cable', 'Bell Canada'
    ];
    const carriers = [
      'Residential Broadband', 'Cellular LTE/5G', 'Fiber Node', 'Satellite Starlink Feed'
    ];
    const devices = [
      'iPhone 14 Pro (iOS 16.5)', 'Samsung Galaxy S23 Ultra (Android 14)', 'Google Pixel 8 Pro', 'iPad Air',
      'Windows 11 Gaming Rig', 'Linux Workstation', 'PlayStation 5 Console', 'Mac Studio M2'
    ];
    
    const ip = `${100 + (hash % 120)}.${50 + ((hash >> 4) % 150)}.${10 + ((hash >> 8) % 200)}.${hash % 254}`;
    const location = cities[hash % cities.length];
    const isp = isps[(hash >> 2) % isps.length];
    const carrier = carriers[(hash >> 3) % carriers.length];
    const ping = `${8 + (hash % 50)}ms`;
    const vpn = hash % 3 === 0;
    const device = devices[(hash >> 5) % devices.length];
    const email = `${normalized.replace(/\s+/g, '')}@nba-sandbox.org`;
    const regDate = `2024-02-${10 + (hash % 18)} ${10 + (hash % 13)}:${10 + (hash % 49)}:${10 + (hash % 49)} UTC`;

    return { ip, location, isp, carrier, ping, vpn, device, email, regDate };
  };

  // --- LIVE SOCKET PACKET SNIFFER LOOP ---
  useEffect(() => {
    if (!isSniffing || !foundAccount) return;
    
    const details = getAccountDetails(foundAccount.username);
    const mockPackets = [
      `[UDP] ${details.ip}:61205 => 10.0.8.21:443 | Len=512 | [ACK=0x1a8c]`,
      `[TCP] ${details.ip}:31491 => 10.0.8.21:3000 | [PSH, ACK] Seq=19208 Ack=2381 | Hex: 4e 42 41 5f 43 41 52 44 5f 53 59 4e 43`,
      `[HTTP] Request: GET /api/v2/roster/accounts/${foundAccount.id}/inventory`,
      `[HTTP] User-Agent: ${details.device}`,
      `[DATABASE] Fetching PIN sequence (expected: ${foundAccount.pin})`,
      `[AUTH] TLS Session established: cipher=ECDHE-RSA-AES256-GCM-SHA384`,
      `[LOG] Heartbeat accepted from player ${foundAccount.username} | Latency: ${details.ping}`,
      `[UDP] P2P Node synced | Active Starters count = 5`,
      `[TCP] Payload: { "user": "${foundAccount.username}", "action": "browse_auction_house" }`,
      `[RAW] HexDump: 1a 9f 3c 4b fa 12 e9 88 db c2 49 fd a2 00 1c d4`
    ];

    const interval = setInterval(() => {
      const randomLog = mockPackets[Math.floor(Math.random() * mockPackets.length)];
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setPacketLogs(prev => {
        const next = [...prev, `[${time}] ${randomLog}`];
        if (next.length > 30) next.shift(); // limit logs length
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSniffing, foundAccount]);

  if (!isOpen) return null;

  // Helper to compute ID for real accounts
  const getPlayerId = (username: string): string => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idNum = Math.abs(hash % 900000) + 100000;
    return idNum.toString();
  };

  // Run simulated decryption sequence
  const executeDecrypt = () => {
    if (!crackId.trim()) return;
    setCracking(true);
    setFoundAccount(null);
    setCrackLog([]);
    setModSuccess(null);

    const targetId = crackId.trim();
    const logs = [
      `🛰️ Sniffing target pipeline headers [${targetId}]...`,
      `⚙️ Querying database rosters index...`,
      `🔓 Access granted! Compiling active lineups...`
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < logs.length) {
        setCrackLog(prev => [...prev, logs[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        
        // Look up pre-seeded first
        let matched: any = PRE_SEEDED_ACCOUNTS.find(a => a.id === targetId);
        
        // If not found, look up in real registered accounts
        if (!matched) {
          const realAcc = accounts.find(acc => getPlayerId(acc.username) === targetId);
          if (realAcc) {
            matched = {
              id: targetId,
              username: realAcc.username,
              pin: realAcc.pin,
              teamName: realAcc.gameState.standings.find(s => s.isPlayer)?.name || 'Franchise Roster',
              coins: realAcc.gameState.coins,
              isReal: true,
              roster: Object.entries(realAcc.gameState.roster.starters)
                .filter(([_, card]) => card !== null)
                .map(([pos, card]) => {
                  const pCard = card as PlayerCard;
                  return {
                    name: pCard.name,
                    position: pos,
                    ovr: pCard.ovr,
                    archetype: pCard.archetype,
                    id: pCard.id
                  };
                })
            };
          }
        }

        if (matched) {
          setFoundAccount(matched);
        } else {
          setCrackLog(prev => [...prev, `❌ ERROR: Target Account ID [${targetId}] not resolved.`]);
        }
        setCracking(false);
      }
    }, 300);
  };

  // Bulk overcharge target accounts
  const modTargetCards = (rating: number) => {
    if (!foundAccount) return;

    const buffStats = (stats: any) => ({
      scoring: rating, playmaking: rating, rebounding: rating, defense: rating,
      shooting3PT: rating, shootingMid: rating, shootingFT: rating,
      speed: rating, strength: rating, vertical: rating, stamina: rating
    });

    if (foundAccount.isReal) {
      const isCurrentlyActiveUser = activeAccount && activeAccount.toLowerCase() === foundAccount.username.toLowerCase();
      
      if (isCurrentlyActiveUser) {
        setState(prev => {
          const startersClone = { ...prev.roster.starters };
          Object.keys(startersClone).forEach(pos => {
            const card = startersClone[pos as Position];
            if (card) {
              startersClone[pos as Position] = {
                ...card,
                ovr: rating,
                stats: buffStats(card.stats)
              };
            }
          });
          return { ...prev, roster: { ...prev.roster, starters: startersClone } };
        });
      }

      setAccounts(prev => {
        return prev.map(acc => {
          if (acc.username.toLowerCase() === foundAccount.username.toLowerCase()) {
            const startersClone = { ...acc.gameState.roster.starters };
            Object.keys(startersClone).forEach(pos => {
              const card = startersClone[pos as Position];
              if (card) {
                startersClone[pos as Position] = {
                  ...card,
                  ovr: rating,
                  stats: buffStats(card.stats)
                };
              }
            });
            return {
              ...acc,
              gameState: {
                ...acc.gameState,
                roster: { ...acc.gameState.roster, starters: startersClone }
              }
            };
          }
          return acc;
        });
      });

      setFoundAccount((prev: any) => ({
        ...prev,
        roster: prev.roster.map((p: any) => ({ ...p, ovr: rating }))
      }));

      setModSuccess(`⚡ SUCCESS: Injected ${rating} OVR parameters directly into database player models for user "${foundAccount.username}"!`);
    } else {
      setFoundAccount((prev: any) => ({
        ...prev,
        roster: prev.roster.map((p: any) => ({ ...p, ovr: rating }))
      }));
      setModSuccess(`⚡ SUCCESS (Simulated): Overcharged pre-seeded account player cards to ${rating} OVR!`);
    }

    setTimeout(() => setModSuccess(null), 4000);
  };

  const renamePlayerInAccount = (playerIdx: number, newName: string) => {
    if (!foundAccount || !newName.trim()) return;

    if (foundAccount.isReal) {
      const targetPlayer = foundAccount.roster[playerIdx];
      if (!targetPlayer) return;

      const isCurrentlyActiveUser = activeAccount && activeAccount.toLowerCase() === foundAccount.username.toLowerCase();
      if (isCurrentlyActiveUser) {
        setState(prev => {
          const startersClone = { ...prev.roster.starters };
          Object.keys(startersClone).forEach(pos => {
            const card = startersClone[pos as Position];
            if (card && card.id === targetPlayer.id) {
              startersClone[pos as Position] = { ...card, name: newName.toUpperCase() };
            }
          });
          return { ...prev, roster: { ...prev.roster, starters: startersClone } };
        });
      }

      setAccounts(prev => {
        return prev.map(acc => {
          if (acc.username.toLowerCase() === foundAccount.username.toLowerCase()) {
            const startersClone = { ...acc.gameState.roster.starters };
            Object.keys(startersClone).forEach(pos => {
              const card = startersClone[pos as Position];
              if (card && card.id === targetPlayer.id) {
                startersClone[pos as Position] = { ...card, name: newName.toUpperCase() };
              }
            });
            return {
              ...acc,
              gameState: {
                ...acc.gameState,
                roster: { ...acc.gameState.roster, starters: startersClone }
              }
            };
          }
          return acc;
        });
      });

      setFoundAccount((prev: any) => {
        const updated = [...prev.roster];
        updated[playerIdx] = { ...updated[playerIdx], name: newName.toUpperCase() };
        return { ...prev, roster: updated };
      });

      setModSuccess(`⚡ SUCCESS: Renamed player card to "${newName.toUpperCase()}" inside "${foundAccount.username}"'s database table!`);
    } else {
      setFoundAccount((prev: any) => {
        const updated = [...prev.roster];
        updated[playerIdx] = { ...updated[playerIdx], name: newName.toUpperCase() };
        return { ...prev, roster: updated };
      });
      setModSuccess(`⚡ SUCCESS (Simulated): Renamed pre-seeded card to "${newName.toUpperCase()}".`);
    }
    setTimeout(() => setModSuccess(null), 4000);
  };

  const deletePlayerFromAccount = (playerIdx: number) => {
    if (!foundAccount) return;

    if (foundAccount.isReal) {
      const targetPlayer = foundAccount.roster[playerIdx];
      if (!targetPlayer) return;

      const isCurrentlyActiveUser = activeAccount && activeAccount.toLowerCase() === foundAccount.username.toLowerCase();
      if (isCurrentlyActiveUser) {
        setState(prev => {
          const startersClone = { ...prev.roster.starters };
          Object.keys(startersClone).forEach(pos => {
            const card = startersClone[pos as Position];
            if (card && card.id === targetPlayer.id) {
              startersClone[pos as Position] = null;
            }
          });
          return { ...prev, roster: { ...prev.roster, starters: startersClone } };
        });
      }

      setAccounts(prev => {
        return prev.map(acc => {
          if (acc.username.toLowerCase() === foundAccount.username.toLowerCase()) {
            const startersClone = { ...acc.gameState.roster.starters };
            Object.keys(startersClone).forEach(pos => {
              const card = startersClone[pos as Position];
              if (card && card.id === targetPlayer.id) {
                startersClone[pos as Position] = null;
              }
            });
            return {
              ...acc,
              gameState: {
                ...acc.gameState,
                roster: { ...acc.gameState.roster, starters: startersClone }
              }
            };
          }
          return acc;
        });
      });

      setFoundAccount((prev: any) => ({
        ...prev,
        roster: prev.roster.filter((_: any, idx: number) => idx !== playerIdx)
      }));

      setModSuccess(`🚨 SYSTEM CORRUPTION SUCCESSFUL: Erased player card ID from "${foundAccount.username}"'s active database!`);
    } else {
      setFoundAccount((prev: any) => ({
        ...prev,
        roster: prev.roster.filter((_: any, idx: number) => idx !== playerIdx)
      }));
      setModSuccess(`🚨 Simulated player erasure executed on local preview.`);
    }
    setTimeout(() => setModSuccess(null), 4000);
  };

  // --- ACTIONS EXECUTED ON TARGETED DATABASE ACCOUNT ---
  const toggleBanAccount = (username: string) => {
    const userLower = username.toLowerCase();
    let updated: string[];
    if (bannedUsernames.includes(userLower)) {
      updated = bannedUsernames.filter(u => u !== userLower);
      setModSuccess(`🔓 UNBANNED: "${username}" is now authorized to play on local arcade nodes!`);
    } else {
      updated = [...bannedUsernames, userLower];
      setModSuccess(`🚫 TERMINATED: Account "${username}" has been permanently suspended in database!`);
    }
    setBannedUsernames(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nba_banned_accounts', JSON.stringify(updated));
    }
    setTimeout(() => setModSuccess(null), 4000);
  };

  const toggleIpBan = (ip: string) => {
    let updated: string[];
    if (bannedIps.includes(ip)) {
      updated = bannedIps.filter(item => item !== ip);
      setModSuccess(`🔓 SUBNET UNBLOCKED: IP address ${ip} removed from global firewalls.`);
    } else {
      updated = [...bannedIps, ip];
      setModSuccess(`🚨 IP FIREWALL BANNED: Traffic from ${ip} is now blacklisted.`);
    }
    setBannedIps(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nba_banned_ips', JSON.stringify(updated));
    }
    setTimeout(() => setModSuccess(null), 4000);
  };

  const wipeTargetWallet = () => {
    if (!foundAccount) return;
    if (foundAccount.isReal) {
      const isCurrentlyActiveUser = activeAccount && activeAccount.toLowerCase() === foundAccount.username.toLowerCase();
      if (isCurrentlyActiveUser) {
        setState(prev => ({ ...prev, coins: 0 }));
      }
      setAccounts(prev => {
        return prev.map(acc => {
          if (acc.username.toLowerCase() === foundAccount.username.toLowerCase()) {
            return {
              ...acc,
              gameState: {
                ...acc.gameState,
                coins: 0
              }
            };
          }
          return acc;
        });
      });
      setFoundAccount((prev: any) => ({ ...prev, coins: 0 }));
      setModSuccess(`💸 WALLET WIPED: Erased all coins inside account "${foundAccount.username}"!`);
    } else {
      setFoundAccount((prev: any) => ({ ...prev, coins: 0 }));
      setModSuccess(`💸 WALLET WIPED (Simulated): Set pre-seeded account's cash index to 0.`);
    }
    setTimeout(() => setModSuccess(null), 4000);
  };

  const grantMaxCoins = () => {
    if (!foundAccount) return;
    const maxVal = 99999999;
    if (foundAccount.isReal) {
      const isCurrentlyActiveUser = activeAccount && activeAccount.toLowerCase() === foundAccount.username.toLowerCase();
      if (isCurrentlyActiveUser) {
        setState(prev => ({ ...prev, coins: maxVal }));
      }
      setAccounts(prev => {
        return prev.map(acc => {
          if (acc.username.toLowerCase() === foundAccount.username.toLowerCase()) {
            return {
              ...acc,
              gameState: {
                ...acc.gameState,
                coins: maxVal
              }
            };
          }
          return acc;
        });
      });
      setFoundAccount((prev: any) => ({ ...prev, coins: maxVal }));
      setModSuccess(`💰 INFINITE FUNDS: Granted 99,999,999 Coins to "${foundAccount.username}"!`);
    } else {
      setFoundAccount((prev: any) => ({ ...prev, coins: maxVal }));
      setModSuccess(`💰 COINS GRANTED (Simulated): Injected 99,999,999 coins into pre-seeded credentials.`);
    }
    setTimeout(() => setModSuccess(null), 4000);
  };

  const injectSystemOverlay = () => {
    if (!foundAccount || !overlayMsgInput.trim()) return;
    const userLower = foundAccount.username.toLowerCase();
    if (typeof window !== 'undefined') {
      localStorage.setItem(`nba_system_overlay_${userLower}`, overlayMsgInput.trim());
    }
    setModSuccess(`🛰️ INTERFERENCE SENT: Transmitted custom HUD warning directly to "${foundAccount.username}"!`);
    setOverlayMsgInput('');
    setTimeout(() => setModSuccess(null), 4000);
  };

  const corruptDatabaseSector = () => {
    if (!foundAccount) return;
    const glitchedName = `☣ CØRRUPT_SECT_${Math.floor(Math.random() * 900 + 100)} ☣`;
    if (foundAccount.isReal) {
      const isCurrentlyActiveUser = activeAccount && activeAccount.toLowerCase() === foundAccount.username.toLowerCase();
      if (isCurrentlyActiveUser) {
        setState(prev => {
          const startersClone = { ...prev.roster.starters };
          Object.keys(startersClone).forEach(pos => {
            const card = startersClone[pos as Position];
            if (card) {
              startersClone[pos as Position] = {
                ...card,
                name: glitchedName,
                ovr: 30,
              };
            }
          });
          return { ...prev, roster: { ...prev.roster, starters: startersClone } };
        });
      }

      setAccounts(prev => {
        return prev.map(acc => {
          if (acc.username.toLowerCase() === foundAccount.username.toLowerCase()) {
            const startersClone = { ...acc.gameState.roster.starters };
            Object.keys(startersClone).forEach(pos => {
              const card = startersClone[pos as Position];
              if (card) {
                startersClone[pos as Position] = {
                  ...card,
                  name: glitchedName,
                  ovr: 30
                };
              }
            });
            return {
              ...acc,
              gameState: {
                ...acc.gameState,
                roster: { ...acc.gameState.roster, starters: startersClone }
              }
            };
          }
          return acc;
        });
      });

      setFoundAccount((prev: any) => ({
        ...prev,
        roster: prev.roster.map((p: any) => ({ ...p, name: glitchedName, ovr: 30 }))
      }));

      setModSuccess(`☣ FATAL: Database sectors corrupted for "${foundAccount.username}"! Roster wiped and glitched.`);
    } else {
      setFoundAccount((prev: any) => ({
        ...prev,
        roster: prev.roster.map((p: any) => ({ ...p, name: glitchedName, ovr: 30 }))
      }));
      setModSuccess(`☣ Simulated sector corruption on pre-seeded records!`);
    }
    setTimeout(() => setModSuccess(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-red-500/40 rounded-2xl p-6 max-w-4xl w-full flex flex-col md:flex-row gap-5 shadow-2xl relative border-glow my-8">
        
        {/* CLOSE CONTROL */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-slate-800 p-1 rounded-full text-xs cursor-pointer z-10"
          title="Exit Command Injection Console"
        >
          ✕
        </button>

        {/* LEFT NAV PANEL */}
        <div className="w-full md:w-52 shrink-0 flex flex-col gap-2 border-r border-slate-800/80 pr-5">
          <div className="flex items-center gap-1.5 text-red-400 mb-2">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
            <h3 className="font-display font-black text-white text-xs uppercase tracking-wider leading-none">
              COMMISH CONSOLE
            </h3>
          </div>
          
          <button
            onClick={() => setActiveTab('card')}
            className={`w-full text-left font-mono text-[11px] font-black uppercase px-3 py-2.5 rounded-lg border transition-all ${
              activeTab === 'card'
                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                : 'text-slate-400 border-transparent hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            🧬 Bulk Quick Hacks
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`w-full text-left font-mono text-[11px] font-black uppercase px-3 py-2.5 rounded-lg border transition-all ${
              activeTab === 'editor'
                ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                : 'text-slate-400 border-transparent hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            🔬 DNA Limit-Breaker Lab
          </button>

          <button
            onClick={() => setActiveTab('online')}
            className={`w-full text-left font-mono text-[11px] font-black uppercase px-3 py-2.5 rounded-lg border transition-all ${
              activeTab === 'online'
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                : 'text-slate-400 border-transparent hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            📡 Network Hacks
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`w-full text-left font-mono text-[11px] font-black uppercase px-3 py-2.5 rounded-lg border transition-all ${
              activeTab === 'account'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : 'text-slate-400 border-transparent hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            🕵️ Account Exploiter
          </button>

          <div className="mt-auto pt-4 border-t border-slate-800 font-mono text-[8px] text-slate-500 uppercase leading-snug">
            <p>Access: League Director</p>
            <p>Node: Standby_01</p>
            <p>DNA Link Status: Locked On</p>
          </div>
        </div>

        {/* RIGHT CONTENT WORKSPACE */}
        <div className="flex-1 min-h-[460px] flex flex-col justify-between overflow-x-hidden">
          
          {/* TAB 1: BULK QUICK HACKS */}
          {activeTab === 'card' && (
            <div className="space-y-4 text-xs font-mono">
              <div>
                <h4 className="text-red-400 font-bold uppercase text-[12px] border-b border-slate-850 pb-1.5 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> GLOBAL DNA BULK OVERRIDES
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Bulk injection commands targeting entire collections in standard game state memory tables.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    const buffStats = (stats: any) => ({
                      scoring: 150, playmaking: 150, rebounding: 150, defense: 150,
                      shooting3PT: 150, shootingMid: 150, shootingFT: 150,
                      speed: 150, strength: 150, vertical: 150, stamina: 150
                    });
                    
                    setState(prev => {
                      const startersClone = { ...prev.roster.starters };
                      Object.keys(startersClone).forEach(pos => {
                        const card = startersClone[pos as Position];
                        if (card) {
                          startersClone[pos as Position] = {
                            ...card,
                            stats: buffStats(card.stats),
                            ovr: 150
                          };
                        }
                      });
                      const benchClone = prev.roster.bench.map(c => ({
                        ...c, stats: buffStats(c.stats), ovr: 150
                      }));
                      const invClone = prev.inventory.map(c => ({
                        ...c, stats: buffStats(c.stats), ovr: 150
                      }));
                      return {
                        ...prev,
                        roster: { ...prev.roster, starters: startersClone, bench: benchClone },
                        inventory: invClone
                      };
                    });
                    alert("🧬 SYSTEM: All roster/inventory player cards overcharged to 150 OVR!");
                  }}
                  className="bg-red-950/30 border border-red-500/30 hover:bg-red-900/40 text-red-300 p-3.5 rounded-lg text-left transition-all space-y-1 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 font-bold text-white text-[11px] uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-red-400" />
                    Force Lineup to 150 OVR
                  </div>
                  <p className="text-[9px] text-slate-400 leading-tight">Elevate all card values up to 150 attributes instantly.</p>
                </button>

                <button
                  onClick={() => {
                    const adamSilverCard: PlayerCard = {
                      id: `adam-silver-hacks-${Date.now()}`,
                      templateId: 'adam-silver-hack',
                      name: 'ADAM SILVER (COMMISSIONER)',
                      era: 'Modern',
                      primaryPosition: 'SF',
                      secondaryPosition: 'PG',
                      archetype: 'All-Rounder',
                      teamHistory: 'League Office (NY)',
                      rarity: 'Legendary',
                      stats: {
                        scoring: 150, playmaking: 150, rebounding: 150, defense: 150,
                        shooting3PT: 150, shootingMid: 150, shootingFT: 150,
                        speed: 150, strength: 150, vertical: 150, stamina: 150
                      },
                      hiddenAttributes: {
                        clutch: 150, consistency: 150, injuryResistance: 150, leadership: 150
                      },
                      traits: ['Hall of Fame', 'MVP Tier', 'Era Dominator', 'Clutch Gene'],
                      ovr: 150,
                      evolutionTier: 3,
                      isLegacy: true,
                      upgradePointsSpent: 0,
                      isInjured: false,
                      injuryDuration: 0,
                      level: 10,
                      xp: 999,
                      xpToNextLevel: 1000
                    };

                    setState(prev => ({
                      ...prev,
                      inventory: [...prev.inventory, adamSilverCard],
                      coins: prev.coins + 100000
                    }));
                    alert("👑 SYSTEM: Summoned Legendary Commissioner Adam Silver and +100k Coins added!");
                  }}
                  className="bg-purple-950/30 border border-purple-500/30 hover:bg-purple-900/40 text-purple-300 p-3.5 rounded-lg text-left transition-all space-y-1 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 font-bold text-white text-[11px] uppercase">
                    <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                    Summon Adam Silver SF/PG
                  </div>
                  <p className="text-[9px] text-slate-400 leading-tight">Generate max-rated secret administrator card.</p>
                </button>

                <button
                  onClick={() => {
                    setState(prev => ({ ...prev, coins: prev.coins + 250000 }));
                    alert("🪙 SYSTEM: Injected +250,000 Budget Coins!");
                  }}
                  className="bg-slate-900 border border-slate-800 hover:bg-emerald-950/20 hover:border-emerald-500/30 text-emerald-400 p-3.5 rounded-lg text-left transition-all space-y-1 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 font-bold text-white text-[11px] uppercase">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    Inject +250k Budget Coins
                  </div>
                  <p className="text-[9px] text-slate-500 leading-tight">Fulfill immediate luxury tax cap coin limits.</p>
                </button>

                <button
                  onClick={() => {
                    setState(prev => {
                      const updated = prev.inventory.map(c => ({
                        ...c,
                        level: 10,
                        xp: 1000,
                        xpToNextLevel: 1000
                      }));
                      return { ...prev, inventory: updated };
                    });
                    alert("🚀 SYSTEM: Elevated all inventory cards to Level 10!");
                  }}
                  className="bg-slate-900 border border-slate-800 hover:bg-blue-950/20 hover:border-blue-500/30 text-blue-400 p-3.5 rounded-lg text-left transition-all space-y-1 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 font-bold text-white text-[11px] uppercase">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    Max Level All Cards
                  </div>
                  <p className="text-[9px] text-slate-500 leading-tight">Overcharge player level states directly to 10.</p>
                </button>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl text-[11px] text-slate-400 leading-relaxed space-y-1.5">
                <span className="font-bold text-slate-200">ℹ️ MULTIPLAYER CROSSPLAY HACKS NOTE</span>
                <p>To keep online head-to-head match lobbies stable and fair, direct real-time in-game panels have been moved off the active screen. You can still apply any limit-breaker parameters inside the Tab menu prior to connecting or matchmaking!</p>
              </div>
            </div>
          )}

          {/* TAB 2: DNA LIMIT-BREAKER LAB (INDIVIDUAL DETAILED EDITOR) */}
          {activeTab === 'editor' && (
            <div className="space-y-4 text-xs font-mono max-h-[500px] overflow-y-auto pr-1">
              <div>
                <h4 className="text-orange-400 font-bold uppercase text-[12px] border-b border-slate-850 pb-1.5 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-orange-400" /> INDIVIDUAL DNA MOLECULAR DECK (LIMIT-BREAKER)
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Select a specific player card in your roster/inventory/legacy deck, customize stats up to <b>999</b>, modify positions, badges, rarity, level, or name!
                </p>
              </div>

              {/* CARD SELECTION */}
              <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-850">
                <label className="text-[10px] text-orange-400 uppercase font-black block">1. Select Target Player Card</label>
                <select
                  value={editingCardId}
                  onChange={e => setEditingCardId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2.5 text-xs text-white outline-none focus:border-orange-500"
                >
                  <option value="">-- Choose Card to Mutate --</option>
                  {editableCards.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Current OVR: {c.ovr}) [{c.source === 'legacy' ? 'LEGACY' : 'PRIMARY'}]
                    </option>
                  ))}
                </select>
              </div>

              {editingCardId && (
                <div className="space-y-4 pt-1">
                  {/* CARD FIELDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase font-bold">Player Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* Primary position */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase font-bold">Primary Position</label>
                      <select
                        value={editPrimaryPosition}
                        onChange={e => setEditPrimaryPosition(e.target.value as Position)}
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-orange-500"
                      >
                        <option value="PG">PG</option>
                        <option value="SG">SG</option>
                        <option value="SF">SF</option>
                        <option value="PF">PF</option>
                        <option value="C">C</option>
                      </select>
                    </div>

                    {/* Secondary position */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase font-bold">Secondary Position</label>
                      <select
                        value={editSecondaryPosition || 'None'}
                        onChange={e => setEditSecondaryPosition(e.target.value === 'None' ? undefined : e.target.value as Position)}
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-orange-500"
                      >
                        <option value="None">None</option>
                        <option value="PG">PG</option>
                        <option value="SG">SG</option>
                        <option value="SF">SF</option>
                        <option value="PF">PF</option>
                        <option value="C">C</option>
                      </select>
                    </div>

                    {/* Archetype */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase font-bold">Archetype</label>
                      <select
                        value={editArchetype}
                        onChange={e => setEditArchetype(e.target.value as Archetype)}
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-orange-500"
                      >
                        <option value="Scorer">Scorer</option>
                        <option value="Playmaker">Playmaker</option>
                        <option value="Defender">Defender</option>
                        <option value="Big Man">Big Man</option>
                        <option value="Sharpshooter">Sharpshooter</option>
                        <option value="All-Rounder">All-Rounder</option>
                      </select>
                    </div>

                    {/* Rarity */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase font-bold">Rarity</label>
                      <select
                        value={editRarity}
                        onChange={e => setEditRarity(e.target.value as Rarity)}
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-orange-500"
                      >
                        <option value="Common">Common</option>
                        <option value="Rare">Rare</option>
                        <option value="Epic">Epic</option>
                        <option value="Legendary">Legendary</option>
                      </select>
                    </div>

                    {/* Level */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase font-bold">RPG Level (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={editLevel}
                        onChange={e => setEditLevel(Math.min(10, Math.max(1, Number(e.target.value))))}
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* STATS MATRIX (LIMIT-BREAKER SLIDERS / INPUTS UP TO 999) */}
                  <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-orange-400 uppercase font-black block border-b border-slate-850 pb-1">Stats Attributes Override (Ceiling unlocked up to 999!)</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                      {Object.keys(editStats).map(statKey => (
                        <div key={statKey} className="space-y-1">
                          <label className="text-[9px] text-slate-400 uppercase font-bold truncate block">{statKey}</label>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              min="1"
                              max="999"
                              value={editStats[statKey] || 0}
                              onChange={e => handleStatChange(statKey, Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-850 rounded-lg p-1.5 text-xs text-center font-bold text-white outline-none focus:border-orange-500 font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* TRAITS / BADGES CHECKS */}
                  <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-orange-400 uppercase font-black block border-b border-slate-850 pb-1">Assign Hall of Fame Badges / Traits</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
                      {AVAILABLE_TRAITS.map(trait => {
                        const isChecked = editTraits.includes(trait);
                        return (
                          <button
                            key={trait}
                            onClick={() => handleTraitToggle(trait)}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                              isChecked
                                ? 'bg-orange-500/10 border-orange-500/40 text-orange-300 font-bold'
                                : 'bg-slate-900 border-slate-850 text-slate-400 hover:border-slate-800'
                            }`}
                          >
                            {isChecked ? <CheckSquare className="w-4 h-4 text-orange-400 shrink-0" /> : <Square className="w-4 h-4 shrink-0" />}
                            <span className="text-[10.5px] truncate">{trait}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* EXECUTE ACTION */}
                  <button
                    onClick={handleApplyFullMutations}
                    className="w-full bg-orange-500 text-slate-950 hover:bg-orange-400 font-black py-3.5 rounded-xl transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/10"
                  >
                    <Sliders className="w-4 h-4 text-slate-950" />
                    <span>Apply Custom DNA Mutations & Stat Explode</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ONLINE HACKS */}
          {activeTab === 'online' && (
            <div className="space-y-4 text-xs font-mono">
              <div>
                <h4 className="text-purple-400 font-bold uppercase text-[12px] border-b border-slate-850 pb-1.5 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" /> ONLINE PACKET MANIPULATORS
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Alter parameters inside active peer match sessions or reveal credential headers.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-[11px] block uppercase">Display User Account ID</span>
                    <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">Toggle display of 6-digit User Account IDs on active profile logs, matchup lobbies, and player banners.</span>
                  </div>
                  <button
                    onClick={() => setDisplayUserAccountId(!displayUserAccountId)}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      displayUserAccountId 
                        ? 'bg-purple-600 text-white hover:bg-purple-500' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {displayUserAccountId ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      alert("Simulated DDoS exploit initiated on peer channels. Saturated buffer packets.");
                    }}
                    className="bg-slate-900 border border-slate-800 hover:bg-purple-950/20 text-slate-400 hover:text-purple-300 p-3.5 rounded-lg text-left transition-all space-y-1 cursor-pointer"
                  >
                    <div className="font-bold text-white text-[11px] uppercase">Force Opponent DC (DDoS)</div>
                    <p className="text-[9px] text-slate-500">Forfeit simulation matching triggers immediate lobby win.</p>
                  </button>

                  <button
                    onClick={() => {
                      alert("Force Score Booster active. +10 PTS injected to local court index.");
                    }}
                    className="bg-slate-900 border border-slate-800 hover:bg-purple-950/20 text-slate-400 hover:text-purple-300 p-3.5 rounded-lg text-left transition-all space-y-1 cursor-pointer"
                  >
                    <div className="font-bold text-white text-[11px] uppercase">Force Point Inject (+10 PTS)</div>
                    <p className="text-[9px] text-slate-500">Inject 10 scoreboard points to active lobby match play.</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACCOUNT HACKS (DATABASE EXPLOITER) */}
          {activeTab === 'account' && (
            <div className="space-y-4 text-xs font-mono">
              <div>
                <h4 className="text-blue-400 font-bold uppercase text-[12px] border-b border-slate-850 pb-1.5 flex items-center gap-1.5">
                  <Unlock className="w-3.5 h-3.5" /> ACCOUNT CREDENTIAL DECOMPILER
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Decrypt and decompile account tables by targeting user unique 6-digit Account IDs (e.g. <b>100284</b>, <b>592813</b>, <b>482910</b>, <b>294812</b>, or any active player).
                </p>
              </div>

              {/* SEARCH FIELD */}
              <div className="flex gap-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                <input
                  type="text"
                  placeholder="Enter 6-Digit User Account ID (e.g., 592813)..."
                  value={crackId}
                  onChange={e => setCrackId(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-blue-500 transition-all"
                />
                <button
                  onClick={executeDecrypt}
                  disabled={cracking}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 rounded-lg uppercase tracking-wider text-[11px] flex items-center gap-1 disabled:opacity-40 shrink-0 cursor-pointer"
                >
                  {cracking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5" />}
                  <span>Decompile</span>
                </button>
              </div>

              {/* CRACKING MATRIX TERMINAL */}
              {cracking && (
                <div className="bg-slate-950 border border-blue-900/40 rounded-xl p-3 h-28 overflow-y-auto text-[10px] text-blue-400 space-y-1 font-mono">
                  {crackLog.map((log, idx) => (
                    <div key={idx} className="flex gap-1">
                      <span>▶</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* MATCHED ACCOUNT DOSSIER */}
              {foundAccount && (() => {
                const details = getAccountDetails(foundAccount.username);
                const isUserBanned = bannedUsernames.includes(foundAccount.username.toLowerCase());
                const isIpBanned = bannedIps.includes(details.ip);

                return (
                  <div className="bg-slate-950/80 border border-blue-900/40 rounded-xl p-4 space-y-4">
                    {/* DOSSIER HEADER */}
                    <div className="flex justify-between items-start border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-blue-950 text-blue-400 border border-blue-900/30 px-1.5 py-0.5 rounded font-bold uppercase">
                            FOUND RECORD
                          </span>
                          {isUserBanned && (
                            <span className="text-[9px] bg-red-950 text-red-400 border border-red-900/30 px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">
                              🚫 ACCOUNT BANNED
                            </span>
                          )}
                          {isIpBanned && (
                            <span className="text-[9px] bg-yellow-950 text-yellow-500 border border-yellow-900/30 px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">
                              📡 IP BLACKLISTED
                            </span>
                          )}
                        </div>
                        <h5 className="font-sans font-bold text-sm text-white mt-1.5 flex items-center gap-1.5">
                          Username: <span className="text-blue-400 font-mono text-sm font-black">{foundAccount.username}</span>
                        </h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">Franchise: {foundAccount.teamName}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">PASSWORD/PIN</span>
                        <span className="text-xs text-emerald-400 font-mono font-bold font-black bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/30 tracking-widest block mt-1">
                          {foundAccount.pin}
                        </span>
                      </div>
                    </div>

                    {/* INTEL/METRICS SUB-PANEL */}
                    <div className="bg-slate-900/60 border border-slate-850 rounded-lg p-3 space-y-2 text-[10px]">
                      <div className="text-blue-400 uppercase font-black tracking-wider text-[10px] pb-1 border-b border-slate-850 flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5" /> DECOMPILED CLIENT TELEMETRY & INTEL
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-slate-300">
                        <div>
                          <span className="text-slate-500">IP ADDRESS:</span>{" "}
                          <span className={`font-bold ${isIpBanned ? 'text-red-400 line-through' : 'text-amber-400'}`}>{details.ip}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">LOCATION:</span> <span className="text-white">{details.location}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">ISP/HOST:</span> <span className="text-white">{details.isp}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">CARRIER:</span> <span className="text-white">{details.carrier}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">DEVICE TYPE:</span> <span className="text-sky-400">{details.device}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">EMAIL LINK:</span> <span className="text-emerald-400 underline">{details.email}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">NODE LATENCY:</span> <span className="text-white">{details.ping}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">REGISTRATION:</span> <span className="text-slate-400">{details.regDate}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-slate-500">VPN / ANONYMOUS PROXY DETECTED:</span>{" "}
                          <span className={`font-bold ${details.vpn ? 'text-red-400' : 'text-emerald-400'}`}>
                            {details.vpn ? 'YES (HIGH RISK SOURCING)' : 'NO (DIRECT LINK)'}
                          </span>
                        </div>
                      </div>

                      {/* CONCURRENT ACTIONS FOR IP BANNING */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => toggleBanAccount(foundAccount.username)}
                          className={`flex-1 py-1.5 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            isUserBanned 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30 hover:bg-emerald-900 hover:text-white' 
                              : 'bg-red-950 text-red-400 border border-red-900/30 hover:bg-red-900 hover:text-white'
                          }`}
                        >
                          {isUserBanned ? '🔓 Unban User Account' : '🚫 Ban User Account'}
                        </button>
                        <button
                          onClick={() => toggleIpBan(details.ip)}
                          className={`flex-1 py-1.5 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            isIpBanned 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30 hover:bg-emerald-900 hover:text-white' 
                              : 'bg-amber-950/40 text-amber-500 border border-amber-900/30 hover:bg-amber-900 hover:text-white'
                          }`}
                        >
                          {isIpBanned ? '🔓 Unblock IP Address' : '🚨 IP Ban Subnet'}
                        </button>
                      </div>
                    </div>

                    {/* OVERLAY INTERFERENCE CONSOLE */}
                    <div className="bg-slate-900/60 border border-slate-850 rounded-lg p-3 space-y-2">
                      <div className="text-blue-400 uppercase font-black tracking-wider text-[10px] pb-1 border-b border-slate-850 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 animate-pulse" /> OVERLAY INTERFERENCE BROADCAST
                      </div>
                      <p className="text-[9px] text-slate-400">
                        Force-inject a full-screen or banner warning message directly onto this user's active client layout screen.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g., GM ADVISORY: Suspicious network lag detected on your franchise node..."
                          value={overlayMsgInput}
                          onChange={e => setOverlayMsgInput(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-[10px] font-mono text-white outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={injectSystemOverlay}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider text-[9px] cursor-pointer shrink-0"
                        >
                          Send Overlay
                        </button>
                      </div>
                    </div>

                    {/* SOCKET PORT SNIFFER / PACKET TERMINAL */}
                    <div className="bg-slate-900/60 border border-slate-850 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-center pb-1 border-b border-slate-850">
                        <div className="text-blue-400 uppercase font-black tracking-wider text-[10px] flex items-center gap-1">
                          <Terminal className="w-3.5 h-3.5" /> LIVE WEBSOCKET PACKET STREAM
                        </div>
                        <button
                          onClick={() => setIsSniffing(prev => !prev)}
                          className={`px-2 py-0.5 rounded font-black text-[8px] uppercase tracking-wider ${
                            isSniffing 
                              ? 'bg-red-950 text-red-400 animate-pulse border border-red-900/30' 
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {isSniffing ? '■ STOP DECK' : '▶ SNIFF PACKETS'}
                        </button>
                      </div>
                      {isSniffing ? (
                        <div className="bg-slate-950 border border-slate-850 rounded-lg p-2 h-28 overflow-y-auto font-mono text-[9px] text-emerald-400 space-y-0.5">
                          {packetLogs.length === 0 ? (
                            <span className="text-slate-500 animate-pulse">[ESTABLISHING SUBNET TAP PIPELINE...]</span>
                          ) : (
                            packetLogs.slice(-20).map((log, idx) => (
                              <div key={idx} className="truncate">
                                <span className="text-slate-500 mr-1">⚡</span>
                                {log}
                              </div>
                            ))
                          )}
                        </div>
                      ) : (
                        <p className="text-[9px] text-slate-500 text-center py-2 font-mono">
                          TAP PIPELINE OFFLINE • CLICK "SNIFF PACKETS" TO CAPTURE OUTGOING UDP/TCP GAME TRAFFIC
                        </p>
                      )}
                    </div>

                    {/* ACTIVE CARDS IN TARGET ROSTER */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 block uppercase font-black tracking-wider">Target Roster Cards:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-24 overflow-y-auto pr-1">
                        {foundAccount.roster && foundAccount.roster.map((player: any, idx: number) => (
                          <div key={idx} className="bg-slate-900 border border-slate-850 p-2 rounded-lg flex justify-between items-center text-[10px] hover:border-blue-900/30 transition-all">
                            <div>
                              <span className="font-bold text-white block truncate max-w-[120px]">{player.name}</span>
                              <span className="text-[9px] text-slate-500 uppercase font-mono">{player.position} • OVR {player.ovr}</span>
                            </div>
                            
                            {/* INDIVIDUAL PLAYER CONTROLS */}
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  const newN = prompt("Enter new player card name:", player.name);
                                  if (newN) renamePlayerInAccount(idx, newN);
                                }}
                                className="bg-slate-800 hover:bg-slate-750 text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase text-[8px] cursor-pointer"
                              >
                                Rename
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Permanently wipe player "${player.name}" from account database?`)) {
                                    deletePlayerFromAccount(idx);
                                  }
                                }}
                                className="bg-red-950/40 hover:bg-red-900 hover:text-white text-red-400 px-1.5 py-0.5 rounded font-bold uppercase text-[8px] cursor-pointer"
                              >
                                Erase
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* MASTER ACCOUNT ALTERATION ACTIONS */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => modTargetCards(150)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Overcharge All Cards (150 OVR)
                      </button>
                      <button
                        onClick={() => modTargetCards(50)}
                        className="bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-900/30 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Nerf (50 OVR)
                      </button>
                      <button
                        onClick={grantMaxCoins}
                        className="bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-900/30 text-emerald-400 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Infect Max Wallet (99M)
                      </button>
                      <button
                        onClick={wipeTargetWallet}
                        className="bg-slate-900 hover:bg-red-950 border border-slate-800 hover:border-red-900 text-slate-400 hover:text-red-400 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Wipe Coins (0)
                      </button>
                      <button
                        onClick={corruptDatabaseSector}
                        className="bg-amber-950/30 hover:bg-amber-900/60 border border-amber-900/30 hover:border-amber-500 text-amber-500 hover:text-white px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Corrupt Database Sector
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* NOTIFICATION TOAST */}
          {modSuccess && (
            <div className="bg-emerald-950/40 border border-emerald-900/40 rounded-lg p-3 text-emerald-400 text-[10.5px] leading-tight flex items-start gap-1.5 font-bold animate-pulse mt-3">
              <span>🚀</span>
              <span>{modSuccess}</span>
            </div>
          )}

          {/* BOTTOM MODAL CONTROLS */}
          <div className="flex justify-end gap-2 border-t border-slate-800 pt-4 mt-5">
            <span className="text-[9px] text-slate-500 font-mono mt-2.5 self-start flex-1 text-left hidden sm:inline uppercase">
              ⚡ PRESS TAB KEY ANYWHERE IN THE APP TO TOGGLE COMMANDS DECK
            </span>
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-5 py-2.5 rounded-xl uppercase text-[11px] font-black tracking-wider transition-colors font-mono cursor-pointer"
            >
              Close Console
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
