import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parse JSON payloads
  app.use(express.json());

  // Lobby item definition
  interface LobbyRoom {
    peerId: string;
    coachName: string;
    teamName: string;
    teamOvr: number;
    year: number;
    createdAt: number;
    lastPing: number;
  }

  // Thread-safe in-memory global matchmaking state
  let activeLobbies: LobbyRoom[] = [];

  // API Endpoint to publish / ping a public room
  app.post("/api/lobbies", (req, res) => {
    const { peerId, coachName, teamName, teamOvr, year } = req.body;
    if (!peerId || !coachName || !teamName) {
      return res.status(400).json({ error: "Missing lobby registration details" });
    }

    const cleanPeerId = peerId.trim().replace(/\s+/g, '');
    const existingIndex = activeLobbies.findIndex(l => l.peerId === cleanPeerId);
    
    const lobbyItem: LobbyRoom = {
      peerId: cleanPeerId,
      coachName: String(coachName).trim().slice(0, 20),
      teamName: String(teamName).trim().slice(0, 24),
      teamOvr: Number(teamOvr) || 60,
      year: Number(year) || 2026,
      createdAt: existingIndex > -1 ? activeLobbies[existingIndex].createdAt : Date.now(),
      lastPing: Date.now()
    };

    if (existingIndex > -1) {
      activeLobbies[existingIndex] = lobbyItem;
    } else {
      activeLobbies.push(lobbyItem);
    }

    // Filter out inactive lobbies (no ping in last 20 seconds) on every registry modify
    const cutoff = Date.now() - 20000;
    activeLobbies = activeLobbies.filter(l => l.lastPing > cutoff);

    res.json({ success: true, lobby: lobbyItem });
  });

  // API Endpoint to list current open matchmaking lobbies
  app.get("/api/lobbies", (req, res) => {
    const cutoff = Date.now() - 20000;
    // Auto-prune stale rooms
    activeLobbies = activeLobbies.filter(l => l.lastPing > cutoff);
    res.json({ lobbies: activeLobbies });
  });

  // API Endpoint to explicitly remove a room (e.g. game started or host closed)
  app.delete("/api/lobbies/:peerId", (req, res) => {
    const { peerId } = req.params;
    const cleanPeerId = peerId.trim().replace(/\s+/g, '');
    activeLobbies = activeLobbies.filter(l => l.peerId !== cleanPeerId);
    res.json({ success: true });
  });

  // Health API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", lobbiesCount: activeLobbies.length });
  });

  // Integrate Vite for development or serve index.html for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NBA Dynasty Express server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server startup failure:", err);
});
