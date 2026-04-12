const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const dbPath = path.join(logsDir, "detections.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

// ── Create Tables ──
db.exec(`
  CREATE TABLE IF NOT EXISTS detections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    prediction TEXT NOT NULL,
    confidence REAL NOT NULL,
    inference_ms REAL NOT NULL,
    ground_truth TEXT,
    correct INTEGER DEFAULT 1,
    model_name TEXT DEFAULT 'efficientnet',
    is_alert INTEGER DEFAULT 0,
    detection_method TEXT DEFAULT 'none'
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    end_time TEXT,
    total_scans INTEGER DEFAULT 0,
    drone_alerts INTEGER DEFAULT 0,
    accuracy REAL DEFAULT 0,
    status TEXT DEFAULT 'active'
  );
`);

// ── Try to add column if table already exists without it ──
try {
  db.exec(`ALTER TABLE detections ADD COLUMN detection_method TEXT DEFAULT 'none'`);
} catch (e) {
  // Column already exists, ignore
}

// ── Prepared Statements ──
const insertDetection = db.prepare(`
  INSERT INTO detections (timestamp, prediction, confidence, inference_ms, ground_truth, correct, model_name, is_alert, detection_method)
  VALUES (datetime('now', 'localtime'), ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getAllDetections = db.prepare(`
  SELECT * FROM detections ORDER BY id DESC LIMIT ?
`);

const getStats = db.prepare(`
  SELECT
    COUNT(*) as total_scans,
    SUM(CASE WHEN is_alert = 1 THEN 1 ELSE 0 END) as drone_alerts,
    SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct_predictions,
    AVG(inference_ms) as avg_inference_ms,
    AVG(confidence) as avg_confidence
  FROM detections
`);

const getDetectionMethodStats = db.prepare(`
  SELECT
    SUM(CASE WHEN detection_method = 'signal' THEN 1 ELSE 0 END) as signal_count
  FROM detections
`);

const getRecentDetections = db.prepare(`
  SELECT * FROM detections
  WHERE timestamp >= datetime('now', 'localtime', ?)
  ORDER BY id DESC
`);

const getHourlyStats = db.prepare(`
  SELECT
    strftime('%H:00', timestamp) as hour,
    COUNT(*) as total,
    SUM(CASE WHEN is_alert = 1 THEN 1 ELSE 0 END) as alerts
  FROM detections
  WHERE timestamp >= datetime('now', 'localtime', '-24 hours')
  GROUP BY hour
  ORDER BY hour
`);

const clearDetections = db.prepare(`DELETE FROM detections`);

const createSession = db.prepare(`
  INSERT INTO sessions (start_time, status) VALUES (datetime('now', 'localtime'), 'active')
`);

const endSession = db.prepare(`
  UPDATE sessions SET
    end_time = datetime('now', 'localtime'),
    total_scans = ?,
    drone_alerts = ?,
    accuracy = ?,
    status = 'completed'
  WHERE id = ?
`);

const getActiveSessions = db.prepare(`
  SELECT * FROM sessions WHERE status = 'active'
`);

const getAllSessions = db.prepare(`
  SELECT * FROM sessions ORDER BY id DESC LIMIT ?
`);

module.exports = {
  db,
  insertDetection,
  getAllDetections,
  getStats,
  getDetectionMethodStats,
  getRecentDetections,
  getHourlyStats,
  clearDetections,
  createSession,
  endSession,
  getActiveSessions,
  getAllSessions,
};