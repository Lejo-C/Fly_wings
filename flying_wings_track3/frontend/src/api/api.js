import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// ── Single Scan ──
export const singleScan = () => api.post("/scan");

// ── Scan File ──
export const scanFile = (formData) => api.post("/scan/file", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});

// ── Start Continuous Scan ──
export const startScanning = (interval = 2000) =>
  api.post("/scan/start", { interval });

// ── Stop Scanning ──
export const stopScanning = () => api.post("/scan/stop");

// ── Scan Status ──
export const getScanStatus = () => api.get("/scan/status");

// ── Get Detections ──
export const getDetections = (limit = 50) =>
  api.get(`/detections?limit=${limit}`);

// ── Get Stats ──
export const getStats = () => api.get("/stats");

// ── Get Hourly Stats ──
export const getHourlyStats = () => api.get("/stats/hourly");

// ── Get Sessions ──
export const getSessions = (limit = 20) =>
  api.get(`/sessions?limit=${limit}`);

// ── Clear Detections ──
export const clearDetections = () => api.delete("/detections");

// ── Health Check ──
export const healthCheck = () => api.get("/health");

export default api;