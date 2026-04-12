import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function PieChartPanel({ detections, stats }) {
  // ── Detection Stats ──
  const droneStats = useMemo(() => {
    const alerts = detections.filter((d) => d.prediction === "drone").length;
    const total = detections.length;
    const rate = total > 0 ? ((alerts / total) * 100).toFixed(1) : 0;

    return {
      alerts,
      total,
      rate,
    };
  }, [detections]);

  // ── Empty State ──
  if (droneStats.total === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-full flex flex-col">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          📊 Signal Analytics
        </h2>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-3">📡</div>
            <p className="text-gray-400 text-sm">Waiting for signal scan...</p>
            <p className="text-gray-300 text-xs mt-1">
              Start scanning to analyze RF environment
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-6 sticky top-4">

      {/* ── Header ── */}
      <h2 className="text-sm font-semibold text-gray-700">
        📊 Signal Analytics
      </h2>

      {/* ── Signal Awareness Section ── */}
      <div className="py-4 px-6 bg-green-50 rounded-xl border border-green-100 flex flex-col items-center justify-center space-y-2">
        <div className="text-4xl text-green-600">📡</div>
        <div className="text-center">
          <p className="text-xs font-medium text-green-700 uppercase tracking-wider">Detection Mode</p>
          <p className="text-lg font-bold text-green-900">RF SIGNAL ONLY</p>
        </div>
      </div>

      {/* ── Detection Method Bars ── */}
      <div className="space-y-4">
        <h3 className="text-xs font-medium text-gray-500 uppercase">Alert Metrics</h3>

        {/* Drone Alert Rate */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span className="font-medium text-gray-700">🚨 Drone Threat Rate</span>
            <span className="font-bold text-red-600">{droneStats.rate}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-100 shadow-inner">
            <div
              className={`h-full transition-all duration-1000 ease-out rounded-full ${
                parseFloat(droneStats.rate) > 50 ? 'bg-red-500' : 'bg-red-400'
              }`}
              style={{ width: `${droneStats.rate}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            Percentage of scans identifying a signature matching drone waveforms.
          </p>
        </div>

        {/* Signal Reliability (Mock/Stat based on confidence) */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span className="font-medium text-gray-700">📈 Avg Signal Confidence</span>
            <span className="font-bold text-blue-600">{stats.avgConfidence || 0}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-100 shadow-inner">
            <div
              className="h-full bg-blue-500 transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${stats.avgConfidence || 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <hr className="border-gray-100" />

      {/* ── Summary Boxes ── */}
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center space-x-4">
          <div className="bg-red-100 p-2 rounded-lg text-red-600 text-xl font-bold">🚨</div>
          <div>
            <p className="text-2xl font-black text-red-700 leading-none">
              {droneStats.alerts}
            </p>
            <p className="text-xs font-semibold text-red-600 mt-1">Drones Confirmed</p>
          </div>
        </div>
        
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center space-x-4">
          <div className="bg-gray-200 p-2 rounded-lg text-gray-600 text-xl font-bold">📊</div>
          <div>
            <p className="text-2xl font-black text-gray-700 leading-none">
              {droneStats.total}
            </p>
            <p className="text-xs font-semibold text-gray-500 mt-1">Total Signals Scanned</p>
          </div>
        </div>
      </div>

      {/* ── Technical Info ── */}
      <div className="text-[10px] text-gray-400 text-center leading-relaxed px-2">
        Acoustic and ambient noise filtering is active. 
        Detection is performed purely via RF spectrum analysis.
      </div>
    </div>
  );
}

export default PieChartPanel;