const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const router = express.Router();

const {
  insertDetection,
  getAllDetections,
  getStats,
  getDetectionMethodStats,
  getRecentDetections,
  getHourlyStats,
  clearDetections,
  createSession,
  endSession,
  getAllSessions,
} = require("../database");

let scanInterval = null;
let currentSessionId = null;
let scanCount = 0;
let droneCount = 0;
let correctCount = 0;

// ── Helper: Run Python prediction ──
function runPrediction(mode = "simulate", imagePath = null) {
  return new Promise((resolve, reject) => {
    const pythonPath = "python";
    const scriptPath = path.join(__dirname, "..", "..", "predict.py");

    const args = [scriptPath, "--mode", mode];
    if (imagePath) args.push("--image", imagePath);

    const process = spawn(pythonPath, args, {
      cwd: path.join(__dirname, "..", ".."),
    });

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => (stdout += data.toString()));
    process.stderr.on("data", (data) => (stderr += data.toString()));

    process.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Python exited with code ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch (e) {
        reject(new Error(`Failed to parse: ${stdout}`));
      }
    });
  });
}

// ── POST /api/scan ──
router.post("/scan", async (req, res) => {
  try {
    const result = await runPrediction("simulate");
    if (result.error) return res.status(500).json({ error: result.error });

    insertDetection.run(
      result.prediction,
      result.confidence,
      result.inference_ms,
      result.ground_truth || null,
      result.correct ? 1 : 0,
      result.model || "efficientnet",
      result.prediction === "drone" ? 1 : 0,
      result.detection_method || "none"
    );

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/scan/start ──
router.post("/scan/start", (req, res) => {
  const { interval = 2000 } = req.body;
  if (scanInterval) return res.status(400).json({ error: "Already scanning" });

  const session = createSession.run();
  currentSessionId = session.lastInsertRowid;
  scanCount = 0;
  droneCount = 0;
  correctCount = 0;

  scanInterval = setInterval(async () => {
    try {
      const result = await runPrediction("simulate");
      if (!result.error) {
        scanCount++;
        if (result.prediction === "drone") droneCount++;
        if (result.correct) correctCount++;

        insertDetection.run(
          result.prediction,
          result.confidence,
          result.inference_ms,
          result.ground_truth || null,
          result.correct ? 1 : 0,
          result.model || "efficientnet",
          result.prediction === "drone" ? 1 : 0,
          result.detection_method || "none"
        );

        const io = req.app.get("io");
        if (io) {
          io.emit("detection", {
            ...result,
            scanNumber: scanCount,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      }
    } catch (err) {
      console.error("Scan error:", err.message);
    }
  }, interval);

  res.json({ success: true, message: "Scanning started", sessionId: currentSessionId, interval });
});

// ── POST /api/scan/stop ──
router.post("/scan/stop", (req, res) => {
  if (!scanInterval) return res.status(400).json({ error: "No active scan" });

  clearInterval(scanInterval);
  scanInterval = null;

  if (currentSessionId) {
    const accuracy = scanCount > 0 ? (correctCount / scanCount) * 100 : 0;
    endSession.run(scanCount, droneCount, accuracy, currentSessionId);
  }

  res.json({
    success: true,
    message: "Scanning stopped",
    summary: { totalScans: scanCount, droneAlerts: droneCount, accuracy: scanCount > 0 ? ((correctCount / scanCount) * 100).toFixed(1) : 0 },
  });
});

// ── GET /api/scan/status ──
router.get("/scan/status", (req, res) => {
  res.json({ active: scanInterval !== null, scanCount, droneCount, sessionId: currentSessionId });
});

// ── GET /api/detections ──
router.get("/detections", (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const detections = getAllDetections.all(limit);
  res.json({ success: true, data: detections });
});

// ── GET /api/stats ──
router.get("/stats", (req, res) => {
  const stats = getStats.get();
  const methods = getDetectionMethodStats.get();

  res.json({
    success: true,
    data: {
      totalScans: stats.total_scans || 0,
      droneAlerts: stats.drone_alerts || 0,
      correctPredictions: stats.correct_predictions || 0,
      accuracy: stats.total_scans > 0 ? ((stats.correct_predictions / stats.total_scans) * 100).toFixed(1) : 0,
      avgInferenceMs: stats.avg_inference_ms ? stats.avg_inference_ms.toFixed(1) : 0,
      avgConfidence: stats.avg_confidence ? stats.avg_confidence.toFixed(1) : 0,
      signalDetections: methods.signal_count || 0,
      soundDetections: methods.sound_count || 0,
      noDetection: methods.no_detection_count || 0,
    },
  });
});

// ── GET /api/stats/hourly ──
router.get("/stats/hourly", (req, res) => {
  const hourly = getHourlyStats.all();
  res.json({ success: true, data: hourly });
});

// ── GET /api/sessions ──
router.get("/sessions", (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const sessions = getAllSessions.all(limit);
  res.json({ success: true, data: sessions });
});

// ── DELETE /api/detections ──
router.delete("/detections", (req, res) => {
  clearDetections.run();
  res.json({ success: true, message: "All detections cleared" });
});

// ── GET /api/health ──
router.get("/health", async (req, res) => {
  try {
    const result = await runPrediction("health");
    res.json({ server: "ok", model: result.status || "unknown", modelExists: result.model_exists || false });
  } catch (error) {
    res.json({ server: "ok", model: "error", error: error.message });
  }
});

module.exports = router;