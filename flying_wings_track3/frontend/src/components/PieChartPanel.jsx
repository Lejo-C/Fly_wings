import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function PieChartPanel({ detections, stats }) {
  // ── How drones were detected: Signal vs Sound ──
  const methodData = useMemo(() => {
    const signalCount = detections.filter(
      (d) => d.detection_method === "signal"
    ).length;
    const soundCount = detections.filter(
      (d) => d.detection_method === "sound"
    ).length;
    const totalAlerts = signalCount + soundCount;

    return {
      data: [
        {
          name: "RF Signal Detection",
          value: signalCount,
          percentage: totalAlerts > 0 ? ((signalCount / totalAlerts) * 100).toFixed(1) : 0,
        },
        {
          name: "Sound Detection",
          value: soundCount,
          percentage: totalAlerts > 0 ? ((soundCount / totalAlerts) * 100).toFixed(1) : 0,
        },
      ],
      totalAlerts,
      signalCount,
      soundCount,
    };
  }, [detections]);

  // ── Overall: Drone alerts vs Clear scans ──
  const overviewData = useMemo(() => {
    const alerts = detections.filter((d) => d.prediction === "drone").length;
    const clear = detections.filter((d) => d.prediction === "noise").length;
    const total = alerts + clear;

    return {
      data: [
        {
          name: "Drone Alerts",
          value: alerts,
          percentage: total > 0 ? ((alerts / total) * 100).toFixed(1) : 0,
        },
        {
          name: "Clear Scans",
          value: clear,
          percentage: total > 0 ? ((clear / total) * 100).toFixed(1) : 0,
        },
      ],
      total,
      alerts,
      clear,
    };
  }, [detections]);

  const METHOD_COLORS = ["#16a34a", "#f97316"];  // green for signal, orange for sound
  const OVERVIEW_COLORS = ["#ef4444", "#22c55e"]; // red for drone, green for clear

  // ── Custom Tooltip ──
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
          <p className="text-sm font-semibold text-gray-700">{data.name}</p>
          <p className="text-xs text-gray-500">
            Count: <span className="font-bold text-gray-700">{data.value}</span>
          </p>
          <p className="text-xs text-gray-500">
            Share: <span className="font-bold text-gray-700">{data.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // ── Label inside pie ──
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
    if (percentage === 0 || percentage === "0.0") return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
        {percentage}%
      </text>
    );
  };

  // ── Empty State ──
  if (overviewData.total === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-full flex flex-col">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          📊 Detection Analytics
        </h2>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-3">📡</div>
            <p className="text-gray-400 text-sm">No detections yet</p>
            <p className="text-gray-300 text-xs mt-1">
              Start scanning to see how drones are detected
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
        📊 Detection Analytics
      </h2>

      {/* ── PIE 1: How Drones Were Detected (Signal vs Sound) ── */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 mb-1 text-center">
          How Drones Were Detected
        </h3>
        <p className="text-[10px] text-gray-400 text-center mb-2">
          RF Signal Analysis vs Sound Analysis
        </p>

        {methodData.totalAlerts > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={methodData.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={renderLabel}
                  labelLine={false}
                  animationBegin={0}
                  animationDuration={800}
                >
                  {methodData.data.map((entry, index) => (
                    <Cell
                      key={`method-${index}`}
                      fill={METHOD_COLORS[index]}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex justify-center space-x-4 mt-2">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-green-600"></span>
                <span className="text-xs text-gray-600">
                  📡 Signal ({methodData.signalCount})
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                <span className="text-xs text-gray-600">
                  🔊 Sound ({methodData.soundCount})
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 text-xs">No drone alerts yet</p>
            <p className="text-gray-300 text-[10px] mt-1">
              Chart appears after first drone detection
            </p>
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <hr className="border-gray-100" />

      {/* ── PIE 2: Overall Alerts vs Clear ── */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 mb-1 text-center">
          Alert Overview
        </h3>
        <p className="text-[10px] text-gray-400 text-center mb-2">
          Drone Alerts vs Clear Scans
        </p>

        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={overviewData.data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
              label={renderLabel}
              labelLine={false}
              animationBegin={0}
              animationDuration={800}
            >
              {overviewData.data.map((entry, index) => (
                <Cell
                  key={`overview-${index}`}
                  fill={OVERVIEW_COLORS[index]}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex justify-center space-x-4 mt-2">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-xs text-gray-600">
              🚨 Alerts ({overviewData.alerts})
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-xs text-gray-600">
              ✅ Clear ({overviewData.clear})
            </span>
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <hr className="border-gray-100" />

      {/* ── Detection Method Bars ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-gray-500">Detection Breakdown</h3>

        {/* Signal Bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>📡 RF Signal Detection</span>
            <span>{methodData.totalAlerts > 0 ? methodData.data[0].percentage : 0}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 rounded-full transition-all duration-700"
              style={{ width: `${methodData.totalAlerts > 0 ? methodData.data[0].percentage : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Sound Bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>🔊 Sound Detection</span>
            <span>{methodData.totalAlerts > 0 ? methodData.data[1].percentage : 0}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-700"
              style={{ width: `${methodData.totalAlerts > 0 ? methodData.data[1].percentage : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Drone Alert Rate */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>🚨 Drone Alert Rate</span>
            <span>{overviewData.data[0].percentage}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-700"
              style={{ width: `${overviewData.data[0].percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* ── Summary Boxes ── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-green-700">
            {methodData.signalCount}
          </p>
          <p className="text-[10px] text-green-600">📡 Signal Alerts</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-orange-600">
            {methodData.soundCount}
          </p>
          <p className="text-[10px] text-orange-600">🔊 Sound Alerts</p>
        </div>
      </div>

      {/* ── Total ── */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
        <p className="text-2xl font-bold text-gray-700">{overviewData.total}</p>
        <p className="text-[10px] text-gray-500">Total Scans Completed</p>
      </div>
    </div>
  );
}

export default PieChartPanel;