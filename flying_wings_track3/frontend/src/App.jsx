import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import StatsCards from "./components/StatsCards";
import LiveStatus from "./components/LiveStatus";
import DetectionHistory from "./components/DetectionHistory";
import AlertBanner from "./components/AlertBanner";
import PieChartPanel from "./components/PieChartPanel";
import {
  singleScan,
  startScanning,
  stopScanning,
  getDetections,
  getStats,
  getScanStatus,
  clearDetections,
} from "./api/api";

const socket = io("http://localhost:5000");

function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [detections, setDetections] = useState([]);
  const [stats, setStats] = useState({
    totalScans: 0,
    droneAlerts: 0,
    accuracy: 0,
    avgInferenceMs: 0,
    avgConfidence: 0,
  });
  const [latestDetection, setLatestDetection] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [detRes, statsRes, statusRes] = await Promise.all([
        getDetections(100),
        getStats(),
        getScanStatus(),
      ]);
      setDetections(detRes.data.data || []);
      setStats(statsRes.data.data || stats);
      setIsScanning(statusRes.data.active);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    socket.on("detection", (data) => {
      setLatestDetection(data);
      setDetections((prev) => [
        {
          id: Date.now(),
          timestamp: data.timestamp,
          prediction: data.prediction,
          confidence: data.confidence,
          inference_ms: data.inference_ms,
          ground_truth: data.ground_truth,
          correct: data.correct ? 1 : 0,
          is_alert: data.prediction === "drone" ? 1 : 0,
        },
        ...prev.slice(0, 99),
      ]);
      setStats((prev) => ({
        ...prev,
        totalScans: prev.totalScans + 1,
        droneAlerts: prev.droneAlerts + (data.prediction === "drone" ? 1 : 0),
      }));
      if (data.prediction === "drone") {
        setAlert({
          message: `DRONE DETECTED — Confidence: ${data.confidence}%`,
          time: data.timestamp,
        });
        setTimeout(() => setAlert(null), 5000);
      }
    });
    return () => socket.off("detection");
  }, []);

  const handleSingleScan = async () => {
    setLoading(true);
    try {
      const res = await singleScan();
      const data = res.data.data;
      setLatestDetection(data);
      if (data.prediction === "drone") {
        setAlert({
          message: `DRONE DETECTED — Confidence: ${data.confidence}%`,
          time: new Date().toLocaleTimeString(),
        });
        setTimeout(() => setAlert(null), 5000);
      }
      await fetchData();
    } catch (err) {
      console.error("Scan failed:", err);
    }
    setLoading(false);
  };

  const handleStartScan = async () => {
    try {
      await startScanning(2000);
      setIsScanning(true);
    } catch (err) {
      console.error("Failed to start:", err);
    }
  };

  const handleStopScan = async () => {
    try {
      await stopScanning();
      setIsScanning(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to stop:", err);
    }
  };

  const handleClear = async () => {
    try {
      await clearDetections();
      setDetections([]);
      setStats({
        totalScans: 0,
        droneAlerts: 0,
        accuracy: 0,
        avgInferenceMs: 0,
        avgConfidence: 0,
      });
      setLatestDetection(null);
    } catch (err) {
      console.error("Failed to clear:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Navbar />

      {alert && <AlertBanner alert={alert} onClose={() => setAlert(null)} />}

      <main className="max-w-7xl mx-auto px-4 py-5 space-y-4">
        {/* Control Panel */}
        <Dashboard
          isScanning={isScanning}
          loading={loading}
          onSingleScan={handleSingleScan}
          onStartScan={handleStartScan}
          onStopScan={handleStopScan}
          onClear={handleClear}
        />

        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Split Layout: Left (Status + Table) | Right (Pie Chart) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT SIDE — 2/3 width */}
          <div className="lg:col-span-2 space-y-4">
            <LiveStatus
              latestDetection={latestDetection}
              isScanning={isScanning}
            />
            <DetectionHistory detections={detections} />
          </div>

          {/* RIGHT SIDE — 1/3 width */}
          <div className="lg:col-span-1">
            <PieChartPanel detections={detections} stats={stats} />
          </div>
        </div>
      </main>

      <footer className="text-center py-3 text-gray-400 text-xs border-t border-gray-200">
        Flying Wings — Track 3 • Drone RF Detection System
      </footer>
    </div>
  );
}

export default App;