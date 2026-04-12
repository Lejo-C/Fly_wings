const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const detectionRoutes = require("./routes/detection");

const app = express();
const server = http.createServer(app);

// ── Socket.IO Setup ──
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite dev server
    methods: ["GET", "POST"],
  },
});

// Store io instance for routes to use
app.set("io", io);

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── API Routes ──
app.use("/api", detectionRoutes);

// ── Root Route ──
app.get("/", (req, res) => {
  res.json({
    name: "Drone RF Detection API",
    team: "Flying Wings — Track 3",
    endpoints: [
      "POST   /api/scan          — Single scan",
      "POST   /api/scan/start    — Start continuous scanning",
      "POST   /api/scan/stop     — Stop scanning",
      "GET    /api/scan/status   — Scan status",
      "GET    /api/detections    — Detection history",
      "GET    /api/stats         — Overall statistics",
      "GET    /api/stats/hourly  — Hourly breakdown",
      "GET    /api/sessions      — Session history",
      "DELETE /api/detections    — Clear history",
      "GET    /api/health        — System health",
    ],
  });
});

// ── Socket.IO Connection ──
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ── Start Server ──
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("");
  console.log("=".repeat(60));
  console.log("  🛸 DRONE RF DETECTION — BACKEND SERVER");
  console.log("=".repeat(60));
  console.log(`  Server:    http://localhost:${PORT}`);
  console.log(`  API:       http://localhost:${PORT}/api`);
  console.log(`  WebSocket: ws://localhost:${PORT}`);
  console.log("=".repeat(60));
  console.log("");
});