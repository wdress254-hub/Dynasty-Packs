import React, { useState, useEffect, useRef } from 'react';
import { GameState, PlayerCard, Position, BoxScoreStats, GameResult } from '../types';
import { getRarityColor, getRarityTextGlow } from '../data/players';
import { 
  Radio, 
  Send, 
  MessageSquare, 
  Copy, 
  Check, 
  Tv, 
  CheckCircle, 
  XCircle, 
  Flame, 
  Coins, 
  Sparkles, 
  Gamepad2, 
  Users,
  Award,
  TrendingUp,
  Info,
  Globe,
  RefreshCw,
  Wifi,
  Search
} from 'lucide-react';
import { Peer, DataConnection } from 'peerjs';

// Simple function to get initials for player card rendering
const getInitials = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

interface MultiplayerViewProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  activeAccount: string | null;
  cheatsEnabled?: boolean;
}

interface ChatMessage {
  sender: 'me' | 'opponent' | 'system';
  text: string;
  timestamp: string;
}

interface OpponentProfile {
  coachName: string;
  teamName: string;
  teamOvr: number;
  starters: Record<Position, { name: string; ovr: number; position: Position; rarity: string; archetype: string } | null>;
}

export const MultiplayerView: React.FC<MultiplayerViewProps> = ({ state, setState, activeAccount, cheatsEnabled }) => {
  // Profiles
  const [coachName, setCoachName] = useState<string>(() => activeAccount || localStorage.getItem('mp_coach_name') || `Coach_${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
  const [teamName, setTeamName] = useState<string>(() => localStorage.getItem('mp_team_name') || "Player Dynasty");
  const [savedProfile, setSavedProfile] = useState<boolean>(() => !!activeAccount || !!localStorage.getItem('mp_coach_name'));

  // Sync with activeAccount
  useEffect(() => {
    if (activeAccount) {
      setCoachName(activeAccount);
      setSavedProfile(true);
    }
  }, [activeAccount]);

  // Connection State
  const [peerId, setPeerId] = useState<string>('');
  const [localIp, setLocalIp] = useState<string>('');
  const [joinAddress, setJoinAddress] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('join') || '';
  });
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Role: 'host' | 'guest' | null
  const [role, setRole] = useState<'host' | 'guest' | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [opponent, setOpponent] = useState<OpponentProfile | null>(null);

  // Ready state
  const [isMeReady, setIsMeReady] = useState<boolean>(false);
  const [isOpponentReady, setIsOpponentReady] = useState<boolean>(false);

  // Global Matchmaking Lobbies State
  const [mpSubTab, setMpSubTab] = useState<'public' | 'friends'>('public');
  const [isPublicLobby, setIsPublicLobby] = useState<boolean>(false);
  const [publicLobbies, setPublicLobbies] = useState<any[]>([]);
  const [isLoadingLobbies, setIsLoadingLobbies] = useState<boolean>(false);
  const [lobbiesSearchQuery, setLobbiesSearchQuery] = useState<string>('');

  // Chat
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Simulation Game State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simPlayByPlay, setSimPlayByPlay] = useState<string[]>([]);
  const [liveScores, setLiveScores] = useState<{ me: number; opponent: number }>({ me: 0, opponent: 0 });
  const [liveQuarter, setLiveQuarter] = useState<number>(1);
  const [liveMinutesRemaining, setLiveMinutesRemaining] = useState<number>(12);
  const [liveBoxScore, setLiveBoxScore] = useState<Record<string, { points: number; assists: number; rebounds: number }>>({});
  const [simComplete, setSimComplete] = useState<boolean>(false);
  const [simWinner, setSimWinner] = useState<'me' | 'opponent' | null>(null);
  const [coinsReward, setCoinsReward] = useState<number>(0);

  // References
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const playByPlayEndRef = useRef<HTMLDivElement | null>(null);

  // Save profile to storage
  const handleSaveProfile = () => {
    localStorage.setItem('mp_coach_name', coachName);
    localStorage.setItem('mp_team_name', teamName);
    setSavedProfile(true);
    addChatMessage('system', `Your profile saved! Coach: ${coachName} | Team: ${teamName}`);
  };

  // Compute player team OVR
  const starters = Object.values(state.roster.starters).filter(Boolean) as PlayerCard[];
  const teamOvr = starters.length > 0 
    ? Math.round(starters.reduce((acc, c) => acc + c.ovr, 0) / starters.length) 
    : 0;

  // Initialize PeerJS
  useEffect(() => {
    // Detect Electron LAN IP
    if ((window as any).electronAPI && typeof (window as any).electronAPI.getLocalIP === 'function') {
      const ip = (window as any).electronAPI.getLocalIP();
      setLocalIp(ip);
    } else {
      // Browser fallback - generate a neat LAN address style placeholder
      const randSubnet = Math.floor(Math.random() * 254) + 1;
      setLocalIp(`192.168.1.${randSubnet}`);
    }

    // Connect to PeerJS cloud securely
    const peer = new Peer({
      host: '0.peerjs.com',
      port: 443,
      path: '/',
      secure: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ]
      }
    });

    peer.on('open', (id) => {
      setPeerId(id);
      peerRef.current = peer;
    });

    peer.on('error', (err) => {
      console.error('PeerJS error:', err);
      setConnectionError(`Network/Signaling Error: ${err.message}`);
      setIsConnecting(false);
    });

    // Handle incoming connections (We are the HOST)
    peer.on('connection', (conn) => {
      if (connRef.current) {
        // Reject if already connected to someone
        conn.close();
        return;
      }
      setRole('host');
      setupConnection(conn);
    });

    return () => {
      peer.destroy();
    };
  }, []);

  // 1. Automatic heartbeat registration for Host Public Lobby
  useEffect(() => {
    if (!isPublicLobby || !peerId || isConnected) return;

    const registerAndPing = async () => {
      try {
        await fetch('/api/lobbies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            peerId,
            coachName,
            teamName,
            teamOvr,
            year: state.year
          })
        });
      } catch (err) {
        console.error('Failed to publish public lobby:', err);
      }
    };

    // Ping immediately
    registerAndPing();

    // Ping every 8 seconds to stay in matchmaking directory
    const interval = setInterval(registerAndPing, 8000);

    return () => {
      clearInterval(interval);
      // Clean up lobby on unmount or toggle off
      if (peerId) {
        fetch(`/api/lobbies/${peerId}`, { method: 'DELETE' }).catch(err => {
          console.error('Failed to unregister lobby:', err);
        });
      }
    };
  }, [isPublicLobby, peerId, isConnected, coachName, teamName, teamOvr, state.year]);

  // 2. Automatically unpublish lobby when host accepts a challenger
  useEffect(() => {
    if (isConnected && isPublicLobby) {
      setIsPublicLobby(false);
    }
  }, [isConnected, isPublicLobby]);

  // 3. Fetch public lobbies list from matchmaking API
  const fetchPublicLobbies = async () => {
    if (!peerId) return;
    try {
      const res = await fetch('/api/lobbies');
      const data = await res.json();
      if (data && data.lobbies) {
        // Exclude our own peerId from the global list
        setPublicLobbies(data.lobbies.filter((l: any) => l.peerId !== peerId));
      }
    } catch (err) {
      console.error('Failed to fetch public lobbies:', err);
    }
  };

  // 4. Poll active lobbies list when public tab is selected
  useEffect(() => {
    if (mpSubTab !== 'public' || isConnected || !peerId) return;

    fetchPublicLobbies();
    const interval = setInterval(fetchPublicLobbies, 4000);

    return () => clearInterval(interval);
  }, [mpSubTab, isConnected, peerId]);

  // Set up connection callbacks
  const setupConnection = (conn: DataConnection) => {
    connRef.current = conn;

    conn.on('open', () => {
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError('');

      // Send our profile info immediately
      const myStartersSerialized: Record<string, any> = {};
      Object.entries(state.roster.starters as Record<string, any>).forEach(([pos, card]) => {
        myStartersSerialized[pos] = card ? {
          name: card.name,
          ovr: card.ovr,
          position: card.primaryPosition,
          rarity: card.rarity,
          archetype: card.archetype
        } : null;
      });

      conn.send({
        type: 'PROFILE',
        payload: {
          coachName,
          teamName,
          teamOvr,
          starters: myStartersSerialized
        }
      });

      addChatMessage('system', `Successfully connected to 1v1 Lobby!`);
    });

    conn.on('data', (data: any) => {
      if (!data || typeof data !== 'object') return;

      switch (data.type) {
        case 'PROFILE':
          setOpponent(data.payload);
          addChatMessage('system', `Coach ${data.payload.coachName} (${data.payload.teamOvr} OVR) joined the lobby!`);
          break;
        case 'CHAT':
          addChatMessage('opponent', data.payload);
          break;
        case 'READY_STATE':
          setIsOpponentReady(data.payload);
          break;
        case 'START_SIM':
          // Host started the simulation, prepare our view
          setIsSimulating(true);
          setSimComplete(false);
          setSimWinner(null);
          setSimPlayByPlay(['🏀 Game started by Host! Synchronizing play-by-play...']);
          setLiveScores({ me: 0, opponent: 0 });
          setLiveQuarter(1);
          setLiveMinutesRemaining(12);
          // Initialize box scores
          const box: Record<string, { points: number; assists: number; rebounds: number }> = {};
          starters.forEach(c => { box[c.name] = { points: 0, assists: 0, rebounds: 0 }; });
          if (data.opponentStarters) {
            Object.values(data.opponentStarters).forEach((s: any) => {
              if (s) box[s.name] = { points: 0, assists: 0, rebounds: 0 };
            });
          }
          setLiveBoxScore(box);
          break;
        case 'SIM_PLAY':
          // Append play-by-play, updates score, update box scores
          setSimPlayByPlay(prev => [...prev, data.log]);
          // Note that for Guest, 'me' and 'opponent' roles are flipped!
          setLiveScores({
            me: data.guestScore,
            opponent: data.hostScore
          });
          setLiveQuarter(data.quarter);
          setLiveMinutesRemaining(data.minutesRemaining);
          if (data.boxScore) {
            setLiveBoxScore(data.boxScore);
          }
          break;
        case 'SIM_END':
          setIsSimulating(false);
          setSimComplete(true);
          const didIWin = data.guestScore > data.hostScore;
          setSimWinner(didIWin ? 'me' : 'opponent');
          // Update actual coins in parent state
          const rewardAmount = didIWin ? 300 : 100;
          setCoinsReward(rewardAmount);
          setState(prev => ({
            ...prev,
            coins: prev.coins + rewardAmount
          }));
          break;
        default:
          break;
      }
    });

    conn.on('close', () => {
      cleanupConnection();
      addChatMessage('system', `Opponent disconnected. Connection lost.`);
    });

    conn.on('error', (err) => {
      setConnectionError(`Connection Error: ${err.message}`);
      cleanupConnection();
    });
  };

  const cleanupConnection = () => {
    connRef.current = null;
    setIsConnected(false);
    setOpponent(null);
    setRole(null);
    setIsMeReady(false);
    setIsOpponentReady(false);
    setIsSimulating(false);
    setSimComplete(false);
    setSimWinner(null);
  };

  // Automatic URL parameter join check
  useEffect(() => {
    if (!peerId || !peerRef.current || isConnected || isConnecting) return;
    
    const params = new URLSearchParams(window.location.search);
    const autoJoinId = params.get('join')?.trim();
    if (autoJoinId) {
      console.log('Detected auto-join parameter. Connecting to:', autoJoinId);
      setJoinAddress(autoJoinId);
      setIsConnecting(true);
      setRole('guest');
      
      const conn = peerRef.current.connect(autoJoinId.replace(/\s+/g, ''));
      if (conn) {
        setupConnection(conn);
      } else {
        setConnectionError('Auto-connection to match failed.');
        setIsConnecting(false);
      }
    }
  }, [peerId, isConnected, isConnecting]);

  // Connect to another peer (JOIN MATCH)
  const handleConnect = () => {
    if (!joinAddress.trim()) {
      setConnectionError('Please enter a Match Code or local IP address.');
      return;
    }
    setConnectionError('');
    setIsConnecting(true);
    setRole('guest');

    // Create outbound connection
    const conn = peerRef.current?.connect(joinAddress.trim().replace(/\s+/g, ''));
    if (conn) {
      setupConnection(conn);
    } else {
      setConnectionError('Could not instantiate Peer connection. Try reloading.');
      setIsConnecting(false);
    }
  };

  // Connect to a public matchmaking room
  const handleConnectToPeer = (targetPeerId: string) => {
    if (!peerRef.current) return;
    setConnectionError('');
    setIsConnecting(true);
    setRole('guest');
    setJoinAddress(targetPeerId);

    const conn = peerRef.current.connect(targetPeerId.trim().replace(/\s+/g, ''));
    if (conn) {
      setupConnection(conn);
    } else {
      setConnectionError('Could not connect to the selected matchmaking room.');
      setIsConnecting(false);
    }
  };

  // Close connection / Disconnect
  const handleDisconnect = () => {
    connRef.current?.close();
    cleanupConnection();
  };

  // Send a Chat Message
  const handleSendChat = () => {
    if (!chatInput.trim() || !connRef.current) return;
    const msgText = chatInput.trim();
    connRef.current.send({
      type: 'CHAT',
      payload: msgText
    });
    addChatMessage('me', msgText);
    setChatInput('');
  };

  const addChatMessage = (sender: 'me' | 'opponent' | 'system', text: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setChatMessages(prev => [...prev, { sender, text, timestamp }]);
  };

  // Auto-scroll references
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    playByPlayEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simPlayByPlay]);

  // Toggle my ready state
  const handleToggleReady = () => {
    const nextReady = !isMeReady;
    setIsMeReady(nextReady);
    connRef.current?.send({
      type: 'READY_STATE',
      payload: nextReady
    });
  };

  // Copy Match Code helper
  const copyToClipboard = () => {
    navigator.clipboard.writeText(peerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // RUN LIVE SIMULATION (HOST ONLY)
  const handleStartSimulation = async () => {
    if (!connRef.current || !opponent || role !== 'host') return;

    // Verify lineup eligibility
    if (starters.length < 5) {
      alert("Host starting lineup is incomplete! Please assign all 5 slots.");
      return;
    }

    // Inform Guest that we are starting
    connRef.current.send({
      type: 'START_SIM',
      opponentStarters: (Object.values(state.roster.starters) as any[]).map(c => c ? {
        name: c.name,
        ovr: c.ovr,
        position: c.primaryPosition,
        archetype: c.archetype,
        rarity: c.rarity
      } : null)
    });

    setIsSimulating(true);
    setSimComplete(false);
    setSimWinner(null);
    setSimPlayByPlay(['🏀 Host initiated live match simulation!', '📊 Computing rosters and strategies...']);
    setLiveScores({ me: 0, opponent: 0 });
    setLiveQuarter(1);
    setLiveMinutesRemaining(12);

    // Box Scores inside multiplayer
    const boxScore: Record<string, { points: number; assists: number; rebounds: number }> = {};
    starters.forEach(c => { boxScore[c.name] = { points: 0, assists: 0, rebounds: 0 }; });
    Object.values(opponent.starters as Record<string, any>).forEach(s => {
      if (s) boxScore[s.name] = { points: 0, assists: 0, rebounds: 0 };
    });
    setLiveBoxScore(boxScore);

    // Host & Guest scoring averages
    const hostAvgOvr = teamOvr;
    const guestAvgOvr = opponent.teamOvr;

    let hostScore = 0;
    let guestScore = 0;

    // Helper functions for randomized realistic basketball actions
    const selectScorer = (isHostAttack: boolean): any => {
      const rosterList = (isHostAttack ? starters : Object.values(opponent.starters as Record<string, any>).filter(Boolean)) as any[];
      if (rosterList.length === 0) return { name: isHostAttack ? 'Host Scorer' : 'Guest Scorer' };
      // Weight scorer slightly by OVR
      const weights = rosterList.map(p => p!.ovr);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let rand = Math.random() * totalWeight;
      for (let i = 0; i < rosterList.length; i++) {
        rand -= weights[i];
        if (rand <= 0) return rosterList[i]!;
      }
      return rosterList[0]!;
    };

    const actionPhrases = [
      "drives hard down the lane, spinning past defenses for a beautiful layup!",
      "pulls up from deep... BANG! Hits a spectacular contested 3-pointer!",
      "spots up from the elbow and nails a silky smooth mid-range jumper.",
      "slams down a ferocious alley-oop dunk that rocks the backboard!",
      "absorbs heavy contact inside, scoring the tough lay-in and drawing a foul!",
      "knocks down a clutch corner three-pointer off a quick pass.",
      "hits a signature step-back jumper over outstretched defensive arms."
    ];

    const assistPhrases = [
      "dribble-penetrates and dishes a beautiful assist to",
      "hustles hard, throwing a magnificent cross-court skip-pass to",
      "intercepts a sloppy pass and kicks out a rapid transition look to",
      "fakes a shot and drops a gorgeous pocket bounce-pass inside to"
    ];

    const reboundPhrases = [
      "snatches a crucial contested rebound, locking down possession.",
      "soars high above the rim to pull down the offensive rebound.",
      "clears the defensive glass after box-out, halting the attack."
    ];

    const defensivePhrases = [
      "reads the play perfectly, swatting away the shot with an elite block!",
      "picks the pocket cleanly for a transition steal!",
      "contests the shot heavily forcing an airball violation.",
      "blocks the paint completely, locking down inside access."
    ];

    // Simulating 4 Quarters, 4-5 key plays per quarter
    for (let q = 1; q <= 4; q++) {
      setLiveQuarter(q);
      
      // Quarter start message
      const startLog = `🔔 START OF QUARTER ${q} - Coaches rallying their squads!`;
      setSimPlayByPlay(prev => [...prev, startLog]);
      connRef.current.send({
        type: 'SIM_PLAY',
        log: startLog,
        hostScore,
        guestScore,
        quarter: q,
        minutesRemaining: 12,
        boxScore
      });
      await new Promise(resolve => setTimeout(resolve, 1500));

      const playsInQuarter = 5;
      for (let p = 0; p < playsInQuarter; p++) {
        const minutesLeft = Math.max(1, 12 - Math.floor((p / playsInQuarter) * 12));
        setLiveMinutesRemaining(minutesLeft);

        const isHostAttack = Math.random() < 0.5 + (hostAvgOvr - guestAvgOvr) * 0.01;
        const attackSuceeded = Math.random() < 0.48; // Base scoring success rate

        let logPlay = '';

        if (attackSuceeded) {
          const scorer = selectScorer(isHostAttack);
          const isThree = Math.random() < 0.35;
          const points = isThree ? 3 : 2;

          if (isHostAttack) {
            hostScore += points;
          } else {
            guestScore += points;
          }

          // Update scoring box statistics
          if (boxScore[scorer.name]) {
            boxScore[scorer.name].points += points;
          }

          // Check assist
          const hasAssist = Math.random() < 0.6;
          let assisterName = '';
          if (hasAssist) {
            const teamStarters = (isHostAttack ? starters : Object.values(opponent.starters as Record<string, any>).filter(Boolean)) as any[];
            const otherPlayers = teamStarters.filter(p => p && p.name !== scorer.name);
            if (otherPlayers.length > 0) {
              const assister = otherPlayers[Math.floor(Math.random() * otherPlayers.length)]!;
              assisterName = assister.name;
              if (boxScore[assisterName]) {
                boxScore[assisterName].assists += 1;
              }
            }
          }

          const action = actionPhrases[Math.floor(Math.random() * actionPhrases.length)];
          if (hasAssist && assisterName) {
            const assistText = assistPhrases[Math.floor(Math.random() * assistPhrases.length)];
            logPlay = `[Q${q} - ${minutesLeft}:00] 🏀 ${assisterName} ${assistText} ${scorer.name}, who ${action} (+${points} PTS)`;
          } else {
            logPlay = `[Q${q} - ${minutesLeft}:00] 🏀 ${scorer.name} ${action} (+${points} PTS)`;
          }

        } else {
          // Missed attack - defense or rebound
          const isStealOrBlock = Math.random() < 0.4;
          const attacker = selectScorer(isHostAttack);
          const defender = selectScorer(!isHostAttack);

          if (isStealOrBlock) {
            const blockOrSteal = Math.random() > 0.5 ? 'block' : 'steal';
            const defAction = defensivePhrases[blockOrSteal === 'block' ? 0 : 1];
            logPlay = `[Q${q} - ${minutesLeft}:00] 🚫 ${defender.name} ${defAction} stopping ${attacker.name}'s attack!`;
          } else {
            const reber = selectScorer(Math.random() > 0.4 ? !isHostAttack : isHostAttack);
            const rebAction = reboundPhrases[Math.floor(Math.random() * reboundPhrases.length)];
            logPlay = `[Q${q} - ${minutesLeft}:00] 🔄 ${reber.name} ${rebAction}`;
            if (boxScore[reber.name]) {
              boxScore[reber.name].rebounds += 1;
            }
          }
        }

        // Display locally
        setSimPlayByPlay(prev => [...prev, logPlay]);
        setLiveScores({ me: hostScore, opponent: guestScore });
        setLiveBoxScore({ ...boxScore });

        // Send to guest
        connRef.current.send({
          type: 'SIM_PLAY',
          log: logPlay,
          hostScore,
          guestScore,
          quarter: q,
          minutesRemaining: minutesLeft,
          boxScore
        });

        // Delay to allow watching
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Handle tie breaker sudden death
    if (hostScore === guestScore) {
      hostScore += Math.random() > 0.5 ? 2 : 3;
      const tieLog = `🚨 OVERTIME DRAMA! Host scores clutch jumper to win!`;
      setSimPlayByPlay(prev => [...prev, tieLog]);
      setLiveScores({ me: hostScore, opponent: guestScore });
      connRef.current.send({
        type: 'SIM_PLAY',
        log: tieLog,
        hostScore,
        guestScore,
        quarter: 4,
        minutesRemaining: 0,
        boxScore
      });
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Match Completed
    const endLog = `🏆 FINAL WHISTLE: Game Over! Host: ${hostScore} - Guest: ${guestScore}`;
    setSimPlayByPlay(prev => [...prev, endLog]);
    connRef.current.send({
      type: 'SIM_PLAY',
      log: endLog,
      hostScore,
      guestScore,
      quarter: 4,
      minutesRemaining: 0,
      boxScore
    });

    setIsSimulating(false);
    setSimComplete(true);
    const didIWin = hostScore > guestScore;
    setSimWinner(didIWin ? 'me' : 'opponent');

    // Update actual coins in parent state for HOST
    const rewardAmount = didIWin ? 300 : 100;
    setCoinsReward(rewardAmount);
    setState(prev => ({
      ...prev,
      coins: prev.coins + rewardAmount
    }));

    // Notify guest of final results
    connRef.current.send({
      type: 'SIM_END',
      hostScore,
      guestScore
    });
  };

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?join=${peerId}`
    : '';

  return (
    <div className="space-y-6 max-w-6xl mx-auto" id="multiplayer-lobby-panel">
      
      {/* HEADER SECTION */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h2 className="text-lg md:text-xl font-display font-black tracking-tight text-white uppercase">
              1v1 Direct Cross-Play Lobby
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Directly challenge your friends and cross-play in real-time matchups. Earn coins for competing, which helps you unlock elite retro packs!
          </p>
        </div>

        {/* PROFILE CHIP OR PROFILE SAVE */}
        {!savedProfile ? (
          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="space-y-1.5 w-full sm:w-auto">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Multiplayer Coach Profile</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={coachName} 
                  disabled={!!activeAccount}
                  onChange={(e) => !activeAccount && setCoachName(e.target.value.slice(0, 15))}
                  placeholder="Coach Name"
                  className={`bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-bold focus:outline-none focus:border-emerald-500 w-32 ${activeAccount ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <input 
                  type="text" 
                  value={teamName} 
                  onChange={(e) => setTeamName(e.target.value.slice(0, 18))}
                  placeholder="Team Name"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-bold focus:outline-none focus:border-emerald-500 w-36"
                />
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              className="w-full sm:w-auto bg-emerald-500 text-slate-950 text-xs font-black px-4 py-2.5 rounded-lg hover:bg-emerald-400 transition-all uppercase shrink-0 self-end mt-2 sm:mt-0"
            >
              Set Profile
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-xs font-mono">
              GM
            </div>
            <div className="text-left">
              <h4 className="text-xs text-white font-black leading-tight flex items-center gap-1.5">
                <span>{coachName}</span>
                {activeAccount && (
                  <span className="text-[8px] bg-purple-950/50 text-purple-400 border border-purple-900/30 font-mono px-1 rounded uppercase font-bold">Verified</span>
                )}
              </h4>
              <span className="text-[10px] text-slate-400 font-mono block uppercase">{teamName} ({teamOvr} OVR)</span>
            </div>
            {activeAccount ? (
              <div className="flex flex-col items-end pl-2 border-l border-slate-850">
                <span className="text-[8px] text-slate-500 uppercase tracking-widest font-mono">GM ACCOUNT</span>
                <span className="text-[9px] text-purple-400 font-bold uppercase font-mono tracking-tight">{activeAccount}</span>
              </div>
            ) : (
              <button 
                onClick={() => setSavedProfile(false)}
                className="text-[10px] text-slate-500 hover:text-emerald-400 font-mono uppercase pl-2 border-l border-slate-850 ml-1.5"
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>



      {/* CONNECTION SETUP ROW */}
      {!isConnected && (
        <div className="space-y-6">
          {/* MULTIPLAYER SUB-TABS */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
            <div className="flex gap-1">
              <button
                onClick={() => setMpSubTab('public')}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  mpSubTab === 'public'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-950/40'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${mpSubTab === 'public' ? 'animate-pulse' : ''}`} />
                <span>Global Matchmaking</span>
              </button>
              <button
                onClick={() => setMpSubTab('friends')}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  mpSubTab === 'friends'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-950/40'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Direct Friend Match</span>
              </button>
            </div>
            
            <div className="text-right px-4 py-1.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between sm:justify-end gap-3.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">My Global Status</span>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${peerId ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] text-slate-200 font-mono font-bold uppercase tracking-wider">{peerId ? 'CONNECTED' : 'OFFLINE'}</span>
              </div>
            </div>
          </div>

          {mpSubTab === 'friends' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* PANEL 1: HOST A 1v1 MATCH */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-lg">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white uppercase tracking-tight">Host Friend Match</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Start a direct lobby. Your friends can join using your unique global Match Code or scan the QR code to connect instantly.
                    </p>
                  </div>

                  {peerId ? (
                    <div className="space-y-3 pt-2">
                      
                      {/* GLOBAL MATCH CODE */}
                      <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">GLOBAL MATCH CODE</span>
                          <span className="font-mono text-sm font-black text-white tracking-widest uppercase mt-0.5 block">{peerId}</span>
                        </div>
                        <button
                          onClick={copyToClipboard}
                          className="bg-slate-900 hover:bg-slate-850 text-slate-300 p-2.5 rounded-lg border border-slate-800 transition-all flex items-center gap-1.5 text-xs font-mono cursor-pointer"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      {/* LOCAL NETWORK IP (LAN) */}
                      <div className="bg-slate-950/60 border border-slate-850 p-3.5 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">LOCAL NETWORK IP (LAN)</span>
                          <span className="font-mono text-xs font-bold text-emerald-400/90 mt-0.5 block">{localIp}:3000</span>
                        </div>
                        <span className="bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase font-mono px-2 py-0.5 rounded">
                          Local Play
                        </span>
                      </div>

                      {/* SCAN TO JOIN QR CODE */}
                      <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">iPhone Scan to Join</span>
                          <p className="text-[10px] text-slate-400 max-w-[240px] leading-tight">
                            Scan this QR code with your iPhone camera to open this lobby and connect instantly without typing any codes!
                          </p>
                        </div>
                        
                        <div className="bg-white p-2.5 rounded-xl inline-block shadow-lg">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(joinUrl)}`}
                            alt="Join Match QR Code"
                            className="w-36 h-36 object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        
                        <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                          Auto-Link Active
                        </span>
                      </div>

                    </div>
                  ) : (
                    <div className="py-4 flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
                    </div>
                  )}
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg text-[11px] text-emerald-400 font-mono leading-relaxed flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Waiting for a challenger to input your code and connect... Ensure you have at least 5 starters placed in your Lineup.</span>
                </div>
              </div>

              {/* PANEL 2: JOIN A 1v1 MATCH */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-lg">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white uppercase tracking-tight">Join Friend Match</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Enter your friend's global Match Code or local LAN IP address below to connect directly into their active simulation room.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Enter Code or IP</label>
                    <input
                      type="text"
                      value={joinAddress}
                      onChange={(e) => setJoinAddress(e.target.value)}
                      placeholder="Paste Match Code (e.g. peer-id-uuid) or IP"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono tracking-widest uppercase focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {joinAddress.includes('.') && (
                    <div className="p-3.5 bg-yellow-950/30 border border-yellow-900/40 rounded-xl text-[11px] text-yellow-300 leading-relaxed font-sans space-y-1">
                      <p className="font-bold">💡 WebRTC Crossplay Tip:</p>
                      <p className="text-slate-300">
                        Local IP addresses only work if you and your friend are on the <b>same Wi-Fi network</b>.
                      </p>
                      <p className="text-slate-300">
                        Since you are on different networks, please ask your friend for their <b>Global Match Code</b> (the code shown in their lobby) instead, and paste it here!
                      </p>
                    </div>
                  )}

                  {typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('join') && (
                    <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-400 font-sans font-medium animate-pulse flex items-center gap-2">
                      <span>🎯 Match Code auto-loaded from scanned link! Tap <b>"Join Friend Match"</b> below to connect now.</span>
                    </div>
                  )}

                  {connectionError && (
                    <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-xs text-red-300 font-mono">
                      ⚠️ {connectionError}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleConnect}
                  disabled={isConnecting || !joinAddress.trim()}
                  className="w-full bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-xs font-black py-3 rounded-xl hover:bg-emerald-400 transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-slate-950" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Gamepad2 className="w-4 h-4" />
                      <span>Connect to Lobby</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT SIDE: PUBLISH YOUR LOBBY */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-xl">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Globe className="w-5 h-5" />
                    </div>
                    
                    {/* TOGGLE BUTTON */}
                    <button
                      onClick={() => setIsPublicLobby(!isPublicLobby)}
                      disabled={!peerId}
                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        isPublicLobby
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600'
                      }`}
                    >
                      {isPublicLobby ? 'Stop Publishing' : 'Go Live / Publish'}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white uppercase tracking-tight">Open Room to the World</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Publish your 1v1 lobby to the global matchmaking directory. Anyone in the world will be able to browse and connect to challenge you instantly!
                    </p>
                  </div>

                  {/* ACTIVE STATUS DISPLAY */}
                  {isPublicLobby ? (
                    <div className="bg-slate-950 border border-emerald-500/20 p-4 rounded-xl space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </div>
                        <div className="text-left">
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block font-mono">LOBBY PUBLISHED & LIVE</span>
                          <p className="text-[10px] text-slate-400 leading-tight">Waiting for an online player to challenge your room...</p>
                        </div>
                      </div>

                      <div className="border-t border-slate-900 pt-3 grid grid-cols-2 gap-2 text-left">
                        <div>
                          <span className="text-[8px] text-slate-500 uppercase tracking-wider font-bold block">Coach Name</span>
                          <span className="text-xs text-slate-200 font-black truncate block">{coachName}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-500 uppercase tracking-wider font-bold block">Team & OVR</span>
                          <span className="text-xs text-slate-200 font-black block">{teamName} ({teamOvr} OVR)</span>
                        </div>
                        <div className="col-span-2 pt-1">
                          <span className="text-[8px] text-slate-500 uppercase tracking-wider font-bold block">Match ID</span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold truncate block">{peerId}</span>
                        </div>
                      </div>

                      <div className="bg-slate-900/60 p-2.5 rounded-lg flex items-center justify-between text-[9px] font-mono font-bold text-emerald-400">
                        <span>📡 LOBBY DIRECTORY SYNC</span>
                        <span className="animate-pulse">ONLINE PING ACTIVE</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl text-center py-6 space-y-3">
                      <Wifi className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Lobby Currently Private</span>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-normal">
                          Only friends who enter your direct Match Code or scan your QR code can challenge you. Click <strong className="text-emerald-400">"Go Live / Publish"</strong> above to join the worldwide lobby board.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg text-[11px] text-slate-400 font-mono leading-normal flex items-start gap-2">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Ensure your lineup has 5 active starting players so candidates can see your team's accurate power rating!</span>
                </div>
              </div>

              {/* RIGHT SIDE: GLOBAL MATCHMAKING BOARD */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col space-y-5 shadow-xl">
                
                {/* FILTER & RELOAD BAR */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={lobbiesSearchQuery}
                      onChange={(e) => setLobbiesSearchQuery(e.target.value)}
                      placeholder="Search active coaches or teams..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  
                  <button
                    onClick={fetchPublicLobbies}
                    disabled={isConnecting}
                    className="p-2.5 bg-slate-950 hover:bg-slate-850 text-slate-300 rounded-xl border border-slate-850 transition-all cursor-pointer disabled:opacity-50"
                    title="Refresh lobbies"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* BOARD CONTENT */}
                <div className="flex-1 overflow-y-auto max-h-[360px] min-h-[280px] space-y-3 pr-1">
                  {publicLobbies.filter(l => 
                    l.coachName.toLowerCase().includes(lobbiesSearchQuery.toLowerCase()) ||
                    l.teamName.toLowerCase().includes(lobbiesSearchQuery.toLowerCase())
                  ).length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-16 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800">
                        <Radio className="w-7 h-7 text-slate-600 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">No Active Lobbies</h4>
                        <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                          There are currently no other coaches hosting public matches. Be the pioneer — click "Go Live" on the left to start a game and wait for an opponent!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {publicLobbies
                        .filter(l => 
                          l.coachName.toLowerCase().includes(lobbiesSearchQuery.toLowerCase()) ||
                          l.teamName.toLowerCase().includes(lobbiesSearchQuery.toLowerCase())
                        )
                        .map((lobby) => (
                          <div 
                            key={lobby.peerId}
                            className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4 hover:border-emerald-500/40 transition-all hover:bg-slate-950/80"
                          >
                            <div className="text-left space-y-1 col-span-1">
                              <div className="flex items-center gap-2">
                                <span className="font-display font-black text-sm text-white tracking-tight uppercase leading-none">
                                  {lobby.coachName}
                                </span>
                                <span className="bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono font-bold text-emerald-400 px-1.5 py-0.5 rounded leading-none">
                                  {lobby.teamOvr} OVR
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 leading-tight">
                                {lobby.teamName} <span className="text-slate-600">•</span> <span className="font-mono text-[10px] text-amber-500/90 font-bold">{lobby.year} Era</span>
                              </p>
                            </div>

                            <button
                              onClick={() => handleConnectToPeer(lobby.peerId)}
                              disabled={isConnecting}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 text-xs font-black rounded-lg transition-all uppercase tracking-wider flex items-center gap-1.5 shrink-0 cursor-pointer"
                            >
                              {isConnecting && joinAddress === lobby.peerId ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-950" />
                                  <span>Chall...</span>
                                </>
                              ) : (
                                <>
                                  <Gamepad2 className="w-3.5 h-3.5" />
                                  <span>Challenge</span>
                                </>
                              )}
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {connectionError && (
                  <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-xs text-red-300 font-mono">
                    ⚠️ {connectionError}
                  </div>
                )}

              </div>

            </div>
          )}

        </div>
      )}

      {/* LOBBY / MATCH PLAY SCREEN */}
      {isConnected && opponent && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT SIDE: MATCHUP PROFILE COMPARISON & SIMULATOR */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* MATCH STATE PANEL */}
            {!isSimulating && !simComplete && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                    <h3 className="text-sm font-black text-white uppercase tracking-wide">Dynamic Lobby Active</h3>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="text-xs text-red-400 hover:text-red-300 border border-red-950 hover:bg-red-950/20 px-3 py-1.5 rounded-lg transition-all font-mono uppercase"
                  >
                    Leave Match
                  </button>
                </div>

                {/* VISUAL 1v1 HEAD-TO-HEAD ROSTER COMPARISON */}
                <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
                  
                  {/* ME SIDE */}
                  <div className="md:col-span-5 bg-slate-950/60 border border-slate-850 p-4 rounded-xl text-center space-y-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-emerald-400 font-mono block uppercase">Coach Profile</span>
                      <h4 className="text-sm font-black text-white truncate">{coachName}</h4>
                      <span className="text-[11px] text-slate-400 truncate block font-bold">{teamName}</span>
                    </div>
                    <div className="py-2">
                      <span className="text-3xl font-mono font-black text-emerald-400">{teamOvr}</span>
                      <span className="text-[9px] text-slate-500 font-mono block uppercase font-bold">Lineup OVR</span>
                    </div>

                    {/* Compact Starter List */}
                    <div className="space-y-1.5 text-left text-xs pt-2 border-t border-slate-900">
                      {Object.entries(state.roster.starters as Record<string, any>).map(([pos, c]) => (
                        <div key={pos} className="flex justify-between items-center text-[11px] bg-slate-900/60 px-2 py-1 rounded">
                          <span className="font-mono text-slate-500 font-bold">{pos}</span>
                          <span className="text-slate-200 font-bold truncate max-w-28">{c?.name || 'Empty'}</span>
                          <span className="font-mono text-emerald-400 font-bold">{c?.ovr || '-'}</span>
                        </div>
                      ))}
                    </div>

                    {/* READY STATE */}
                    <button
                      onClick={handleToggleReady}
                      className={`w-full py-2.5 rounded-lg font-black text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 border ${
                        isMeReady
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {isMeReady ? <CheckCircle className="w-3.5 h-3.5" /> : null}
                      <span>{isMeReady ? 'READY TO PLAY!' : 'SET READY'}</span>
                    </button>
                  </div>

                  {/* VERSUS CIRCLE */}
                  <div className="md:col-span-1 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xs font-mono font-black text-slate-400 shadow-md">
                      VS
                    </div>
                  </div>

                  {/* OPPONENT SIDE */}
                  <div className="md:col-span-5 bg-slate-950/60 border border-slate-850 p-4 rounded-xl text-center space-y-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-blue-400 font-mono block uppercase">Opponent Coach</span>
                      <h4 className="text-sm font-black text-white truncate">{opponent.coachName}</h4>
                      <span className="text-[11px] text-slate-400 truncate block font-bold">{opponent.teamName}</span>
                    </div>
                    <div className="py-2">
                      <span className="text-3xl font-mono font-black text-blue-400">{opponent.teamOvr}</span>
                      <span className="text-[9px] text-slate-500 font-mono block uppercase font-bold">Lineup OVR</span>
                    </div>

                    {/* Compact Starter List */}
                    <div className="space-y-1.5 text-left text-xs pt-2 border-t border-slate-900">
                      {Object.entries(opponent.starters as Record<string, any>).map(([pos, c]) => (
                        <div key={pos} className="flex justify-between items-center text-[11px] bg-slate-900/60 px-2 py-1 rounded">
                          <span className="font-mono text-slate-500 font-bold">{pos}</span>
                          <span className="text-slate-200 font-bold truncate max-w-28">{c?.name || 'Empty'}</span>
                          <span className="font-mono text-blue-400 font-bold">{c?.ovr || '-'}</span>
                        </div>
                      ))}
                    </div>

                    {/* OPPONENT READY STATE */}
                    <div className={`py-2.5 rounded-lg border text-xs font-black uppercase text-center ${
                      isOpponentReady 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                        : 'bg-slate-900 text-slate-500 border-slate-850'
                    }`}>
                      {isOpponentReady ? 'READY TO PLAY!' : 'NOT READY'}
                    </div>
                  </div>

                </div>

                {/* HOST LAUNCH BAR */}
                {role === 'host' ? (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-center sm:text-left space-y-0.5">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide">You are the Lobby Host</h4>
                      <p className="text-[11px] text-slate-400">Wait for both coaches to light up "READY TO PLAY" to start the simulation.</p>
                    </div>
                    <button
                      onClick={handleStartSimulation}
                      disabled={!isMeReady || !isOpponentReady}
                      className="w-full sm:w-auto bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-xs font-black px-6 py-3 rounded-lg hover:bg-emerald-400 transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      <span>Start 1v1 Simulation</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-center text-xs text-slate-400">
                    📢 Waiting for Lobby Host <b className="text-white">{opponent.coachName}</b> to launch the simulation match once everyone is ready!
                  </div>
                )}

              </div>
            )}

            {/* LIVE SIMULATION ACTIVE SCREEN */}
            {isSimulating && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                
                {/* LIVE SCOREBOARD */}
                <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl text-center relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-blue-500 animate-pulse" />
                  
                  <div className="flex items-center justify-between font-mono max-w-md mx-auto">
                    {/* ME TEAM */}
                    <div className="text-center space-y-1 w-2/5">
                      <span className="text-[9px] text-emerald-400 uppercase font-black tracking-widest block leading-none">
                        {role === 'host' ? 'HOST' : 'GUEST'}
                      </span>
                      <h4 className="text-xs font-bold text-slate-300 truncate">{coachName}</h4>
                      <span className="text-4xl font-black text-white">{liveScores.me}</span>
                    </div>

                    {/* LIVE QUARTER & TIMER */}
                    <div className="text-center space-y-1 w-1/5 shrink-0 px-2">
                      <div className="bg-red-500/10 border border-red-500/30 text-red-400 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-widest inline-block animate-pulse">
                        LIVE
                      </div>
                      <span className="text-sm font-black text-slate-200 block mt-1">Q{liveQuarter}</span>
                      <span className="text-[11px] text-slate-500 block font-bold leading-none">{liveMinutesRemaining}:00</span>
                    </div>

                    {/* OPPONENT TEAM */}
                    <div className="text-center space-y-1 w-2/5">
                      <span className="text-[9px] text-blue-400 uppercase font-black tracking-widest block leading-none">
                        {role === 'host' ? 'GUEST' : 'HOST'}
                      </span>
                      <h4 className="text-xs font-bold text-slate-300 truncate">{opponent.coachName}</h4>
                      <span className="text-4xl font-black text-white">{liveScores.opponent}</span>
                    </div>
                  </div>
                </div>

                {/* PLAY-BY-PLAY TERMINAL STREAM */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Live Play-by-Play Telemetry Feed</span>
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl h-64 overflow-y-auto font-mono text-xs text-slate-300 space-y-2 select-text custom-scrollbar">
                    {simPlayByPlay.map((log, index) => {
                      const isQuarterHeader = log.includes('🔔') || log.includes('🏆') || log.includes('🚨');
                      const isAttack = log.includes('🏀');
                      const isStop = log.includes('🚫') || log.includes('🔄');
                      let textColor = 'text-slate-300';
                      if (isQuarterHeader) textColor = 'text-yellow-400 font-bold pt-2.5 border-t border-slate-900';
                      else if (isAttack) textColor = 'text-emerald-400';
                      else if (isStop) textColor = 'text-slate-400';
                      
                      return (
                        <div key={index} className={`leading-relaxed ${textColor}`}>
                          {log}
                        </div>
                      );
                    })}
                    <div ref={playByPlayEndRef} />
                  </div>
                </div>

                {/* LIVE BOX STATS DRAWER */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Real-time Player Statistics</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ME PLAYERS */}
                    <div className="bg-slate-950/60 border border-slate-850 p-3.5 rounded-xl space-y-2">
                      <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wide border-b border-slate-900 pb-1.5">{coachName}'s Lineup</h4>
                      <div className="space-y-1.5 font-mono text-[11px]">
                        {starters.map(p => (
                          <div key={p.id} className="flex justify-between items-center text-slate-300">
                            <span className="font-sans font-medium text-slate-400 truncate max-w-28">{p.name}</span>
                            <span className="font-bold">{liveBoxScore[p.name]?.points || 0} PTS | {liveBoxScore[p.name]?.rebounds || 0} REB | {liveBoxScore[p.name]?.assists || 0} AST</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* OPPONENT PLAYERS */}
                    <div className="bg-slate-950/60 border border-slate-850 p-3.5 rounded-xl space-y-2">
                      <h4 className="text-xs font-black text-blue-400 uppercase tracking-wide border-b border-slate-900 pb-1.5">{opponent.coachName}'s Lineup</h4>
                      <div className="space-y-1.5 font-mono text-[11px]">
                        {Object.values(opponent.starters as Record<string, any>).map((p: any) => p && (
                          <div key={p.name} className="flex justify-between items-center text-slate-300">
                            <span className="font-sans font-medium text-slate-400 truncate max-w-28">{p.name}</span>
                            <span className="font-bold">{liveBoxScore[p.name]?.points || 0} PTS | {liveBoxScore[p.name]?.rebounds || 0} REB | {liveBoxScore[p.name]?.assists || 0} AST</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* SIMULATION COMPLETE SCREEN */}
            {simComplete && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 text-center">
                
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                  <Award className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">
                    {simWinner === 'me' ? '👑 MATCH VICTORY!' : '💔 MATCH DEFEAT'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    The 1v1 match has officially completed! Both teams played extremely hard. Check your payout bonus below!
                  </p>
                </div>

                {/* FINAL SCORE BOX */}
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl max-w-sm mx-auto flex items-center justify-center gap-6 font-mono text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Your Score</span>
                    <span className={`text-3xl font-black ${simWinner === 'me' ? 'text-emerald-400' : 'text-slate-400'}`}>{liveScores.me}</span>
                  </div>
                  <div className="text-slate-700 text-xl font-bold font-sans">
                    -
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Opponent</span>
                    <span className={`text-3xl font-black ${simWinner === 'opponent' ? 'text-blue-400' : 'text-slate-400'}`}>{liveScores.opponent}</span>
                  </div>
                </div>

                {/* REWARD CALLOUT */}
                <div className="bg-yellow-500/10 border-2 border-yellow-500/30 max-w-xs mx-auto p-4 rounded-xl flex items-center justify-center gap-3 animate-pulse">
                  <Coins className="w-6 h-6 text-yellow-400 shrink-0" />
                  <div className="text-left font-mono">
                    <span className="text-[10px] text-yellow-500 block uppercase font-bold">Franchise Coin Payout</span>
                    <span className="text-white text-base font-black">+{coinsReward} GOLD COINS</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSimComplete(false);
                      setSimWinner(null);
                      setIsMeReady(false);
                      setIsOpponentReady(false);
                      connRef.current?.send({ type: 'READY_STATE', payload: false });
                    }}
                    className="bg-slate-950 hover:bg-slate-850 text-slate-300 text-xs font-black px-6 py-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-all uppercase tracking-wider"
                  >
                    Return to Lobby Floor
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* RIGHT SIDE: LIVE LOBBY LOBBY CHAT & STATUS */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* LOBBY CONNECTION OVERVIEW CARD */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 shadow-md">
              <h4 className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Lobby Room State</span>
              </h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Your Code:</span>
                  <span className="text-slate-300 font-bold">{peerId ? peerId.substring(0, 10) + '...' : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Local Network:</span>
                  <span className="text-emerald-400/90 font-bold">{localIp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Connection Role:</span>
                  <span className="text-yellow-400 font-bold uppercase">{role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Latency Broker:</span>
                  <span className="text-slate-400">Google STUN</span>
                </div>
              </div>
            </div>

            {/* CHAT WINDOW */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-96 shadow-md">
              
              {/* CHAT HEADER */}
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-300 uppercase tracking-wide">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Room Feed</span>
                </div>
                <span className="font-mono text-[9px] text-slate-500 uppercase">Secure Link</span>
              </div>

              {/* CHAT STREAM */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 custom-scrollbar text-xs">
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-1 font-mono">
                    <MessageSquare className="w-5 h-5 opacity-40" />
                    <span>Lobby room feed is empty. Type a message below to greet your opponent!</span>
                  </div>
                )}
                
                {chatMessages.map((msg, index) => {
                  if (msg.sender === 'system') {
                    return (
                      <div key={index} className="text-center bg-slate-950/60 text-slate-400 text-[10px] font-mono py-1 px-2.5 rounded-md leading-relaxed border border-slate-900">
                        ⚡ {msg.text}
                      </div>
                    );
                  }

                  const isMe = msg.sender === 'me';
                  return (
                    <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                        <span className="font-bold">{isMe ? coachName : opponent.coachName}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div className={`mt-0.5 px-3 py-1.5 rounded-xl max-w-[85%] leading-relaxed break-words font-medium ${
                        isMe 
                          ? 'bg-emerald-500 text-slate-950 rounded-tr-none' 
                          : 'bg-slate-800 text-slate-200 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* CHAT INPUT AREA */}
              <div className="bg-slate-950 p-2.5 border-t border-slate-800 flex gap-1.5">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Type message to coach..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  className="bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 p-2 rounded-lg hover:bg-emerald-400 transition-all shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
