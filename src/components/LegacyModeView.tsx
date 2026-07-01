import React, { useState, useEffect, useRef } from 'react';
import { PlayerCard, Position, Roster } from '../types';
import { PlayerCardView } from './PlayerCardView';
import { 
  Trophy, 
  ShieldAlert, 
  Sparkles, 
  Send, 
  Gamepad2, 
  Settings, 
  Trash2, 
  Cpu, 
  Flame, 
  RefreshCw, 
  Layers, 
  Plus, 
  Globe, 
  Wifi, 
  UserPlus, 
  MessageSquare, 
  Share2, 
  Power, 
  Activity, 
  Tv 
} from 'lucide-react';
import { Peer, DataConnection } from 'peerjs';

interface LegacyModeViewProps {
  onBackToLauncher: () => void;
  cheatsEnabled: boolean;
}

export const LegacyModeView: React.FC<LegacyModeViewProps> = ({ onBackToLauncher, cheatsEnabled }) => {
  const [legacyInventory, setLegacyInventory] = useState<PlayerCard[]>(() => {
    const saved = localStorage.getItem('nba_legacy_linked_cards');
    return saved ? JSON.parse(saved) : [];
  });

  const [legacyRoster, setLegacyRoster] = useState<Roster>(() => {
    const saved = localStorage.getItem('nba_legacy_roster');
    if (saved) return JSON.parse(saved);
    return {
      starters: { PG: null, SG: null, SF: null, PF: null, C: null },
      bench: []
    };
  });

  const [activeSlotAssign, setActiveSlotAssign] = useState<Position | 'bench' | null>(null);
  const [logs, setLogs] = useState<string[]>([
    '🔴 Standby! Legacy simulation database offline.',
    '🟢 Legacy state engine initialized. Waiting for cards to be sent from primary game state...',
  ]);
  const [simulating, setSimulating] = useState(false);
  const [score, setScore] = useState<{ me: number; opp: number } | null>(null);

  // Connection/Online Game States
  const [activeTab, setActiveTab] = useState<'offline' | 'online'>('offline');
  const [localIp, setLocalIp] = useState<string>('');
  const [peerId, setPeerId] = useState<string>('');
  const [joinAddress, setJoinAddress] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string>('');
  const [role, setRole] = useState<'host' | 'guest' | null>(null);
  
  const [opponent, setOpponent] = useState<{
    coachName: string;
    teamName: string;
    teamOvr: number;
    starters: Record<Position, PlayerCard | null>;
  } | null>(null);

  const [chatMessages, setChatMessages] = useState<{ sender: 'me' | 'opponent' | 'system'; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  
  // Simulation status states for online match
  const [onlineSimPlayByPlay, setOnlineSimPlayByPlay] = useState<string[]>([]);
  const [onlineScores, setOnlineScores] = useState<{ me: number; opponent: number }>({ me: 0, opponent: 0 });
  const [onlineQuarter, setOnlineQuarter] = useState<number>(1);
  const [onlineMinutesRemaining, setOnlineMinutesRemaining] = useState<number>(12);
  const [onlineSimulating, setOnlineSimulating] = useState<boolean>(false);
  const [onlineSimComplete, setOnlineSimComplete] = useState<boolean>(false);
  const [onlineSimWinner, setOnlineSimWinner] = useState<'me' | 'opponent' | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);

  // Auto save state whenever linked cards/roster change
  useEffect(() => {
    localStorage.setItem('nba_legacy_linked_cards', JSON.stringify(legacyInventory));
  }, [legacyInventory]);

  useEffect(() => {
    localStorage.setItem('nba_legacy_roster', JSON.stringify(legacyRoster));
  }, [legacyRoster]);

  // Calculate roster overall
  const rosterOverall = (() => {
    const active = Object.values(legacyRoster.starters).filter(c => c !== null) as PlayerCard[];
    if (active.length === 0) return 0;
    const total = active.reduce((acc, c) => acc + c.ovr, 0);
    return Math.round(total / active.length);
  })();

  const deleteLegacyCard = (cardId: string) => {
    if (confirm(`Are you sure you want to permanently delete this card from the Legacy Mode Vault?`)) {
      setLegacyInventory(prev => prev.filter(c => c.id !== cardId));
      
      // Unassign card from active starters or bench if it's there
      setLegacyRoster(prev => {
        const startersClone = { ...prev.starters };
        Object.keys(startersClone).forEach(pos => {
          if (startersClone[pos as Position]?.id === cardId) {
            startersClone[pos as Position] = null;
          }
        });
        const benchClone = prev.bench.filter(c => c.id !== cardId);
        return {
          starters: startersClone,
          bench: benchClone
        };
      });

      setLogs(prev => [...prev, `🗑️ Permanently deleted card from Legacy mode database.`]);
    }
  };

  const handleAssignPlayer = (card: PlayerCard) => {
    if (!activeSlotAssign) return;

    if (activeSlotAssign === 'bench') {
      // Remove from starters if they were there
      const starterClone = { ...legacyRoster.starters };
      Object.keys(starterClone).forEach(k => {
        if (starterClone[k as Position]?.id === card.id) {
          starterClone[k as Position] = null;
        }
      });

      setLegacyRoster(prev => {
        if (prev.bench.some(c => c.id === card.id)) return prev;
        return {
          starters: starterClone,
          bench: [...prev.bench, card]
        };
      });
    } else {
      // Clean previous slot holder if any, put back in inventory
      const nextStarters = { ...legacyRoster.starters };
      
      // Remove this card from any other slots or bench
      Object.keys(nextStarters).forEach(k => {
        if (nextStarters[k as Position]?.id === card.id) {
          nextStarters[k as Position] = null;
        }
      });
      const nextBench = legacyRoster.bench.filter(c => c.id !== card.id);

      nextStarters[activeSlotAssign] = card;

      setLegacyRoster({
        starters: nextStarters,
        bench: nextBench
      });
    }

    setLogs(prev => [...prev, `📋 Assigned ${card.name} (OVR ${card.ovr}) to slot: [${activeSlotAssign.toUpperCase()}]`]);
    setActiveSlotAssign(null);
  };

  const removeSlot = (pos: Position) => {
    setLegacyRoster(prev => ({
      ...prev,
      starters: {
        ...prev.starters,
        [pos]: null
      }
    }));
  };

  const removeBench = (id: string) => {
    setLegacyRoster(prev => ({
      ...prev,
      bench: prev.bench.filter(c => c.id !== id)
    }));
  };

  const simulateMatch = () => {
    const starterList = Object.values(legacyRoster.starters).filter(c => c !== null);
    if (starterList.length < 5) {
      alert("❌ ROSTER INVALID: You must assign players to all 5 starter positions before simulating matchups!");
      return;
    }

    setSimulating(true);
    setScore(null);
    setLogs(prev => [...prev, `⏳ Commencing BEST-OF-LEGACY simulated championship game...`]);

    setTimeout(() => {
      const myScore = Math.floor(Math.random() * 40) + 90 + (rosterOverall - 80) * 2;
      const oppScore = Math.floor(Math.random() * 40) + 85;
      
      setScore({ me: myScore, opp: oppScore });
      setLogs(prev => [
        ...prev,
        `🏀 Q1: Legacy starters open fire with chemistry index.`,
        `🏀 Q3: Fast break transition points are dominated.`,
        `🏁 FINAL WHISTLE: Your Legacy Team [${myScore}] vs All-Star Legends [${oppScore}]!`,
        myScore > oppScore 
          ? `🏆 VICTORY: You secured the Retro Legacy Championship Ring! +500 Coins deposited.`
          : `❌ DEFEAT: All-Star Legends clutch the buzzer-beater. Train cards in primary and resend.`
      ]);
      setSimulating(false);
    }, 1500);
  };

  // --- ONLINE P2P LOBBY CONTROLS ---

  // Peer Event Handlers
  const setupConnection = (conn: DataConnection) => {
    connRef.current = conn;
    setIsConnecting(false);
    setIsConnected(true);
    setConnectionError('');
    
    addOnlineLog('system', `P2P connection secured. Sharing rosters...`);

    const myCoach = localStorage.getItem('nba_active_account_name') || 'Retro Legend';
    
    const sendProfile = () => {
      conn.send({
        type: 'LEGACY_PROFILE',
        payload: {
          coachName: myCoach,
          teamName: 'Legacy Franchise',
          teamOvr: rosterOverall,
          starters: legacyRoster.starters
        }
      });
    };

    conn.on('open', sendProfile);
    if (conn.open) {
      sendProfile();
    }

    conn.on('data', (data: any) => {
      if (!data || typeof data !== 'object') return;

      switch (data.type) {
        case 'LEGACY_PROFILE':
          setOpponent(data.payload);
          addOnlineLog('system', `Coach ${data.payload.coachName} (${data.payload.teamOvr} OVR) entered Lobby!`);
          break;
        case 'LEGACY_CHAT':
          addOnlineLog('opponent', data.payload);
          break;
        case 'LEGACY_START_SIM':
          setOnlineSimulating(true);
          setOnlineSimComplete(false);
          setOnlineSimWinner(null);
          setOnlineSimPlayByPlay(['🏀 Game began! Direct sync connection active...']);
          setOnlineScores({ me: 0, opponent: 0 });
          setOnlineQuarter(1);
          setOnlineMinutesRemaining(12);
          break;
        case 'LEGACY_SIM_PLAY':
          setOnlineSimPlayByPlay(prev => [...prev, data.log]);
          // Flip me vs opponent roles if we are guest
          setOnlineScores({
            me: data.guestScore,
            opponent: data.hostScore
          });
          setOnlineQuarter(data.quarter);
          setOnlineMinutesRemaining(data.minutesRemaining);
          break;
        case 'LEGACY_SIM_END':
          setOnlineSimulating(false);
          setOnlineSimComplete(true);
          const iWon = data.guestScore > data.hostScore;
          setOnlineSimWinner(iWon ? 'me' : 'opponent');
          break;
        default:
          break;
      }
    });

    conn.on('close', () => {
      cleanupConnection();
      addOnlineLog('system', `Opponent terminated connection.`);
    });

    conn.on('error', (err) => {
      setConnectionError(`Lobby Pipe Error: ${err.message}`);
      cleanupConnection();
    });
  };

  const cleanupConnection = () => {
    connRef.current = null;
    setIsConnected(false);
    setOpponent(null);
    setRole(null);
    setOnlineSimulating(false);
    setOnlineSimComplete(false);
    setOnlineSimWinner(null);
  };

  const addOnlineLog = (sender: 'me' | 'opponent' | 'system', text: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setChatMessages(prev => [...prev, { sender, text, time: timeStr }]);
  };

  // Lifecycle monitoring for Peer network creation
  useEffect(() => {
    if (activeTab !== 'online') {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      cleanupConnection();
      return;
    }

    // Direct Match IP simulator address
    const randSubnet = Math.floor(Math.random() * 254) + 1;
    setLocalIp(`192.168.1.${randSubnet}`);

    // Create cloud peer server link securely
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
        ]
      }
    });

    peer.on('open', (id) => {
      setPeerId(id);
      peerRef.current = peer;
    });

    peer.on('error', (err) => {
      console.error('Legacy PeerJS failure:', err);
      setConnectionError(`Network Signaling error: ${err.message}`);
      setIsConnecting(false);
    });

    peer.on('connection', (conn) => {
      if (connRef.current) {
        conn.close();
        return;
      }
      setRole('host');
      setupConnection(conn);
    });

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [activeTab]);

  const handleConnectOnline = () => {
    if (!joinAddress.trim()) {
      setConnectionError('Please enter a target Simulation Node Match Code.');
      return;
    }
    setConnectionError('');
    setIsConnecting(true);
    setRole('guest');

    const conn = peerRef.current?.connect(joinAddress.trim().replace(/\s+/g, ''));
    if (conn) {
      setupConnection(conn);
    } else {
      setConnectionError('Direct network connection failed to boot.');
      setIsConnecting(false);
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || !connRef.current) return;
    const msgText = chatInput.trim();
    setChatInput('');

    addOnlineLog('me', msgText);
    connRef.current.send({
      type: 'LEGACY_CHAT',
      payload: msgText
    });
  };

  const startOnlineSimulation = () => {
    if (!isConnected || !connRef.current || role !== 'host' || !opponent) {
      alert("❌ Only host can initiate the Legacy simulation with a connected peer.");
      return;
    }

    const starterList = Object.values(legacyRoster.starters).filter(c => c !== null);
    if (starterList.length < 5) {
      alert("❌ ROSTER INVALID: Complete your 5 legacy starters before starting 1v1!");
      return;
    }

    setOnlineSimulating(true);
    setOnlineSimComplete(false);
    setOnlineSimWinner(null);
    setOnlineScores({ me: 0, opponent: 0 });
    setOnlineQuarter(1);
    setOnlineMinutesRemaining(12);

    connRef.current.send({ type: 'LEGACY_START_SIM' });

    const playLogs = [
      "🏀 Game started! The referee tosses the ball for jump-ball...",
      `🏀 Q1: ${localStorage.getItem('nba_active_account_name') || 'Host'} team matches overall density early.`,
      `🏀 Q1: ${opponent.coachName} answers with an absolute clutch mid-range fadeaway.`,
      "🏀 Q2: Fast break transition defense gets heavily tested. Heavy pressure on the rims.",
      `🏀 Q3: Back-and-forth shooting masterclass. Both franchise rosters are locked in.`,
      `🏀 Q4: Final minutes of legacy battle under intense simulated audience noise!`,
    ];

    let currentStep = 0;
    let currentScoreMe = 0;
    let currentScoreOpp = 0;

    const interval = setInterval(() => {
      if (currentStep < playLogs.length) {
        const stepLog = playLogs[currentStep];
        
        currentScoreMe += Math.floor(Math.random() * 15) + 12;
        currentScoreOpp += Math.floor(Math.random() * 15) + 12;

        const currentQ = Math.min(4, Math.floor(currentStep / 2) + 1);
        const minsRemaining = Math.max(1, 12 - (currentStep % 2) * 6);

        setOnlineSimPlayByPlay(prev => [...prev, stepLog]);
        setOnlineScores({ me: currentScoreMe, opponent: currentScoreOpp });
        setOnlineQuarter(currentQ);
        setOnlineMinutesRemaining(minsRemaining);

        connRef.current?.send({
          type: 'LEGACY_SIM_PLAY',
          log: stepLog,
          hostScore: currentScoreMe,
          guestScore: currentScoreOpp,
          quarter: currentQ,
          minutesRemaining: minsRemaining
        });

        currentStep++;
      } else {
        clearInterval(interval);

        const hostFinal = currentScoreMe + Math.floor(Math.random() * 6);
        const guestFinal = currentScoreOpp + Math.floor(Math.random() * 6);
        
        const finalLog = `🏁 FINAL WHISTLE: ${localStorage.getItem('nba_active_account_name') || 'Host'} [${hostFinal}] vs ${opponent.coachName} [${guestFinal}]!`;
        const winnerLog = hostFinal > guestFinal 
          ? `🏆 VICTORY: Host franchise reigns supreme in the Legacy Matchup!` 
          : `🏆 VICTORY: Guest coach ${opponent.coachName} conquers the sandbox arena!`;

        setOnlineSimPlayByPlay(prev => [...prev, finalLog, winnerLog]);
        setOnlineScores({ me: hostFinal, opponent: guestFinal });
        setOnlineSimulating(false);
        setOnlineSimComplete(true);
        setOnlineSimWinner(hostFinal > guestFinal ? 'me' : 'opponent');

        connRef.current?.send({
          type: 'LEGACY_SIM_PLAY',
          log: finalLog,
          hostScore: hostFinal,
          guestScore: guestFinal,
          quarter: 4,
          minutesRemaining: 0
        });
        connRef.current?.send({
          type: 'LEGACY_SIM_PLAY',
          log: winnerLog,
          hostScore: hostFinal,
          guestScore: guestFinal,
          quarter: 4,
          minutesRemaining: 0
        });
        connRef.current?.send({
          type: 'LEGACY_SIM_END',
          hostScore: hostFinal,
          guestScore: guestFinal
        });
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col relative overflow-hidden">
      {/* Background radial overlays */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/10">
            <Trophy className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="font-display font-black text-white text-base tracking-tight leading-none uppercase">
              Retro Legacy Championship Mode
            </h1>
            <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block mt-1">
              Historic Sandbox Edition • Isolated Sim Node
            </span>
          </div>
        </div>

        <button
          onClick={onBackToLauncher}
          className="bg-slate-900 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all"
        >
          Exit Legacy Mode
        </button>
      </header>

      {/* WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6 relative z-10 overflow-y-auto">
        
        {/* LEAGUE BANNER AND STATS */}
        <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-black text-white uppercase tracking-wide">LEGACY FRANCHISE OVERALL INDEX</h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Assemble linked cards from your primary campaign. Once you send them across, they persist in legacy memory to build the greatest multi-era roster imaginable!
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-slate-950/80 border border-sky-950 px-4 py-2.5 rounded-xl text-center">
              <span className="text-[9px] text-slate-500 uppercase font-mono block">TEAM OVR</span>
              <span className="text-2xl font-black text-sky-400 font-mono">{rosterOverall || '--'}</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-850 px-4 py-2.5 rounded-xl text-center">
              <span className="text-[9px] text-slate-500 uppercase font-mono block">LINKED CARDS</span>
              <span className="text-2xl font-black text-slate-300 font-mono">{legacyInventory.length}</span>
            </div>
          </div>
        </div>

        {/* ROW: ASSIGNMENTS FLOOR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* STARTERS FLOOR (LEFT) */}
          <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-display font-black text-sm text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Legacy Starters Lineup
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {(['PG', 'SG', 'SF', 'PF', 'C'] as Position[]).map(pos => {
                const card = legacyRoster.starters[pos];
                return (
                  <div key={pos} className="flex flex-col items-center gap-1.5 w-full">
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-850 uppercase w-full text-center">
                      {pos}
                    </span>
                    
                    {card ? (
                      <div className="relative group w-full flex flex-col items-center">
                        <PlayerCardView card={card} size="sm" showStats={false} />
                        <button
                          onClick={() => removeSlot(pos)}
                          className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 text-[10px] shadow-md transition-all active:scale-90"
                          title="Unassign player slot"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveSlotAssign(pos)}
                        className={`w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 transition-all ${
                          activeSlotAssign === pos 
                            ? 'border-sky-500 bg-sky-950/10 text-sky-400 scale-[0.98]' 
                            : 'border-slate-800 hover:border-slate-700 bg-slate-950/20 text-slate-600 hover:text-slate-500'
                        }`}
                      >
                        <Plus className={`w-6 h-6 mb-1 ${activeSlotAssign === pos ? 'animate-bounce text-sky-400' : 'text-slate-600'}`} />
                        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">Assign {pos}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* BENCH SECTION */}
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center">
                <h4 className="font-mono text-[10px] font-black text-slate-400 uppercase tracking-widest">Bench Rotation</h4>
                <button
                  onClick={() => setActiveSlotAssign('bench')}
                  className="bg-slate-950 border border-slate-800 hover:bg-slate-850 px-2.5 py-1 rounded text-[10px] text-sky-400 font-mono font-bold uppercase"
                >
                  + Add Bench
                </button>
              </div>

              {legacyRoster.bench.length === 0 ? (
                <div className="bg-slate-950/20 border border-dashed border-slate-800 p-4 rounded-xl text-center text-[11px] text-slate-500 italic font-mono">
                  No players assigned to legacy bench rotation.
                </div>
              ) : (
                <div className="flex flex-wrap gap-4 pt-2">
                  {legacyRoster.bench.map(card => (
                    <div key={card.id} className="relative group flex flex-col items-center">
                      <PlayerCardView card={card} size="sm" showStats={false} />
                      <button
                        onClick={() => removeBench(card.id)}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 text-[9px] shadow-md transition-all active:scale-90"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SIMULATION FLOOR / ARENA TABS (RIGHT) */}
          <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            
            {/* TAB SELECTORS */}
            <div className="flex border-b border-slate-800/80 pb-2">
              <button
                onClick={() => { setActiveTab('offline'); cleanupConnection(); }}
                className={`flex-1 font-mono text-[10px] font-bold py-2 px-1.5 uppercase tracking-wider text-center border-b-2 transition-all ${
                  activeTab === 'offline' 
                    ? 'text-sky-400 border-sky-400' 
                    : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
              >
                🤖 CPU Exhibition
              </button>
              <button
                onClick={() => { setActiveTab('online'); }}
                className={`flex-1 font-mono text-[10px] font-bold py-2 px-1.5 uppercase tracking-wider text-center border-b-2 transition-all ${
                  activeTab === 'online' 
                    ? 'text-sky-400 border-sky-400' 
                    : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
              >
                📡 Online IP 1v1
              </button>
            </div>

            {/* TAB 1: OFFLINE SIMULATOR PANEL */}
            {activeTab === 'offline' && (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="pb-1">
                    <span className="text-[9px] uppercase tracking-widest text-sky-400 font-mono font-bold block">Retro Match Core</span>
                    <h3 className="font-display font-black text-white text-sm mt-0.5 uppercase">Legacy CPU Sandbox</h3>
                  </div>

                  {score && (
                    <div className="bg-slate-950 border border-sky-950 p-4 rounded-xl flex justify-around items-center text-center font-mono relative overflow-hidden">
                      <div className="absolute inset-0 bg-sky-500/5 pointer-events-none" />
                      <div>
                        <span className="text-[9px] text-sky-400 uppercase block font-bold">LEGACY CO</span>
                        <span className="text-xl font-black text-white">{score.me}</span>
                      </div>
                      <div className="bg-sky-950/60 border border-sky-900 px-2 py-0.5 rounded text-[8px] text-sky-400 font-bold uppercase">FINAL</div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase block font-bold">ALL-STARS</span>
                        <span className="text-xl font-black text-slate-300">{score.opp}</span>
                      </div>
                    </div>
                  )}

                  {/* TERMINAL LOGGER */}
                  <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl h-48 overflow-y-auto font-mono text-[10.5px] text-slate-300 space-y-1">
                    {logs.map((log, idx) => (
                      <div key={idx} className="flex gap-1.5">
                        <span className="text-slate-600 font-bold select-none">{idx + 1}.</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={simulateMatch}
                  disabled={simulating}
                  className="w-full bg-sky-500 text-slate-950 hover:bg-sky-400 font-black py-3.5 rounded-xl transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/10 disabled:opacity-40 cursor-pointer"
                >
                  {simulating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating Engine...</span>
                    </>
                  ) : (
                    <>
                      <Gamepad2 className="w-4 h-4 text-slate-950 fill-slate-950" />
                      <span>Simulate Legacy Matchup</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 2: ONLINE IP 1v1 PANEL */}
            {activeTab === 'online' && (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                
                {/* NOT CONNECTED STATE */}
                {!isConnected && (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-sky-400 font-mono font-bold block">Legacy Arena Link</span>
                      <h3 className="font-display font-black text-white text-sm mt-0.5 uppercase">Direct Cross-Play Lobbies</h3>
                    </div>

                    {/* HOST BOX */}
                    <div className="bg-slate-950/80 border border-slate-850 p-3.5 rounded-xl space-y-2">
                      <span className="text-[9px] text-sky-400 font-mono font-bold uppercase tracking-wider block">Host 1v1 Room (Match Code)</span>
                      
                      {peerId ? (
                        <div className="space-y-1.5">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              readOnly
                              value={peerId}
                              className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-mono p-2 rounded-lg flex-1 outline-none select-all text-center"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(peerId);
                                alert("📋 Lobby Match Code copied to clipboard!");
                              }}
                              className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-2.5 rounded-lg text-xs font-bold font-mono uppercase"
                              title="Copy Match Code"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-[8.5px] text-slate-500 uppercase leading-snug">
                            Host Sim Node IP: <span className="text-slate-400 font-bold">{localIp}</span> • Share this Match Code with your friend to connect instantly!
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-slate-500 py-1 font-mono">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                          <span>Establishing Multi-Arena IP Link...</span>
                        </div>
                      )}
                    </div>

                    {/* JOIN LOBBY BOX */}
                    <div className="bg-slate-950/80 border border-slate-850 p-3.5 rounded-xl space-y-2">
                      <span className="text-[9px] text-indigo-400 font-mono font-bold uppercase tracking-wider block">Join Opponent Direct IP Room</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Paste Opponent's Match Code..."
                          value={joinAddress}
                          onChange={(e) => setJoinAddress(e.target.value)}
                          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono p-2.5 rounded-lg flex-1 outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={handleConnectOnline}
                          disabled={isConnecting || !joinAddress}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 rounded-lg text-xs font-bold font-mono uppercase disabled:opacity-40 cursor-pointer"
                        >
                          {isConnecting ? '...' : 'Connect'}
                        </button>
                      </div>
                    </div>

                    {connectionError && (
                      <div className="bg-red-950/40 border border-red-500/30 p-2.5 rounded-lg text-red-400 text-[9.5px] font-mono leading-relaxed">
                        ⚠️ {connectionError}
                      </div>
                    )}
                  </div>
                )}

                {/* CONNECTED PEER LOBBY / MATCH PLAY */}
                {isConnected && opponent && (
                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      
                      {/* OPPONENT BANNER */}
                      <div className="bg-sky-950/20 border border-sky-500/20 p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[8px] bg-sky-500 text-slate-950 px-1.5 py-0.5 rounded font-black font-mono block w-fit uppercase">PEER ONLINE</span>
                          <span className="text-[11px] font-bold text-white block mt-1">Opponent: {opponent.coachName}</span>
                          <span className="text-[9px] text-slate-400 block font-mono">Legacy Deck OVR: {opponent.teamOvr} OVR</span>
                        </div>
                        <button
                          onClick={cleanupConnection}
                          className="bg-red-950/30 border border-red-900/40 hover:bg-red-900 hover:text-white text-red-400 p-1.5 rounded-lg text-[9px] font-bold uppercase transition-all"
                        >
                          Disconnect
                        </button>
                      </div>

                      {/* SCOREBOARD DISPLAY */}
                      {onlineSimulating || onlineSimComplete ? (
                        <div className="bg-slate-950 border border-sky-950 p-3 rounded-xl flex justify-around items-center text-center font-mono relative overflow-hidden">
                          <div className="absolute inset-0 bg-sky-500/5 pointer-events-none" />
                          <div>
                            <span className="text-[8px] text-sky-400 uppercase block font-bold">ME</span>
                            <span className="text-lg font-black text-white">{onlineScores.me}</span>
                          </div>
                          <div className="bg-sky-950 border border-sky-900 px-2 py-0.5 rounded text-[8px] text-sky-400 font-bold uppercase animate-pulse">
                            {onlineSimulating ? `Q${onlineQuarter} - ${onlineMinutesRemaining}M` : 'FINAL'}
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-500 uppercase block font-bold">OPPONENT</span>
                            <span className="text-lg font-black text-slate-300">{onlineScores.opponent}</span>
                          </div>
                        </div>
                      ) : null}

                      {/* GAME LOGS / CHAT PANEL */}
                      <div className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 h-44 overflow-y-auto flex flex-col gap-1">
                        
                        {/* Simulation outputs override */}
                        {onlineSimPlayByPlay.length > 0 ? (
                          <div className="space-y-1">
                            <span className="text-[8px] text-sky-400 uppercase font-mono block border-b border-slate-850 pb-0.5 font-bold mb-1">🎮 Real-Time Sim Ticker</span>
                            {onlineSimPlayByPlay.map((play, pIdx) => (
                              <div key={pIdx} className="text-[9.5px] font-mono text-emerald-400 leading-snug">
                                {play}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-[8px] text-slate-500 uppercase font-mono block border-b border-slate-850 pb-0.5 font-bold mb-1">💬 Direct Lobby Chat</span>
                            {chatMessages.length === 0 ? (
                              <p className="text-[9.5px] text-slate-600 italic font-mono pt-4 text-center">Connected! Formulate line ups or chat below...</p>
                            ) : (
                              chatMessages.map((msg, mIdx) => (
                                <div key={mIdx} className="text-[10px] font-mono leading-relaxed">
                                  {msg.sender === 'system' ? (
                                    <span className="text-indigo-400 font-bold">[SYSTEM] {msg.text}</span>
                                  ) : (
                                    <>
                                      <span className={msg.sender === 'me' ? 'text-sky-400 font-bold' : 'text-slate-400 font-bold'}>
                                        {msg.sender === 'me' ? 'Me' : opponent.coachName}:
                                      </span>
                                      <span className="text-slate-200 ml-1">{msg.text}</span>
                                    </>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      {/* CHAT INPUT FIELD */}
                      {!onlineSimulating && (
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Type a smack-talk message..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
                            className="bg-slate-950 border border-slate-800 text-xs font-mono px-2 py-1.5 rounded-lg flex-1 outline-none"
                          />
                          <button
                            onClick={handleSendChat}
                            className="bg-sky-500 text-slate-950 hover:bg-sky-400 px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase cursor-pointer"
                          >
                            Send
                          </button>
                        </div>
                      )}
                    </div>

                    {/* LAUNCH ACTIONS */}
                    {role === 'host' ? (
                      <button
                        onClick={startOnlineSimulation}
                        disabled={onlineSimulating || legacyInventory.length === 0}
                        className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-black py-3 rounded-xl transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-40"
                      >
                        {onlineSimulating ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>In-Play Simulation...</span>
                          </>
                        ) : (
                          <>
                            <Gamepad2 className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                            <span>Launch Legacy 1v1 Arena</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-2.5 text-center text-[9.5px] font-mono text-slate-500 uppercase leading-snug">
                        ⚡ Connected as Guest • Waiting for Host {opponent.coachName} to initiate simulation.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* LOWER SECTION: UNASSIGNED/LINKED CARDS VAULT */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <div>
              <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">
                Legacy Linked Cards Vault ({legacyInventory.length})
              </h3>
              <p className="text-[11px] text-slate-400">These cards have been linked from your campaign state. Click them to allocate starter positions or delete them permanently from memory.</p>
            </div>
          </div>

          {legacyInventory.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-2 bg-slate-950/20">
              <Send className="w-8 h-8 text-slate-600 animate-pulse" />
              <div className="space-y-1">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">No Legacy Linked Cards Detected</span>
                <p className="text-[10px] text-slate-500 max-w-sm leading-relaxed">
                  Head over to the primary game simulation, select the <b>Legacy Link</b> tab, and transmit your favorite player cards over to this roster database.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 pt-2">
              {legacyInventory.map(card => {
                const isAssigned = Object.values(legacyRoster.starters).some(item => {
                  const c = item as PlayerCard | null;
                  return c?.id === card.id;
                }) || legacyRoster.bench.some(c => c.id === card.id);

                return (
                  <div key={card.id} className="relative group">
                    <PlayerCardView card={card} size="sm" showStats={false} />
                    
                    <div className="absolute inset-0 bg-slate-950/90 rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-all p-3 text-center">
                      {isAssigned ? (
                        <div className="flex flex-col items-center gap-1.5 w-full">
                          <span className="text-[9px] bg-sky-950 border border-sky-900 text-sky-400 px-2 py-1 rounded font-mono uppercase font-black">
                            ASSIGNED ACTIVE
                          </span>
                          <button
                            onClick={() => deleteLegacyCard(card.id)}
                            className="w-full bg-red-600/30 border border-red-500/30 hover:bg-red-600 hover:text-white text-red-400 text-[10px] font-bold py-1 rounded uppercase font-mono tracking-wider mt-1.5 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Card</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 w-full">
                          <button
                            onClick={() => {
                              setActiveSlotAssign(card.primaryPosition);
                              handleAssignPlayer(card);
                            }}
                            className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 text-[10px] font-black py-1 rounded uppercase font-mono tracking-wider cursor-pointer"
                          >
                            Assign {card.primaryPosition}
                          </button>
                          <button
                            onClick={() => {
                              setActiveSlotAssign('bench');
                              handleAssignPlayer(card);
                            }}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold py-1 rounded uppercase font-mono tracking-wider cursor-pointer"
                          >
                            + Bench
                          </button>
                          
                          <div className="border-t border-slate-800/80 my-1 pt-1">
                            <button
                              onClick={() => deleteLegacyCard(card.id)}
                              className="w-full bg-red-600/30 border border-red-500/30 hover:bg-red-600 hover:text-white text-red-400 text-[10px] font-bold py-1 rounded uppercase font-mono tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Card</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
