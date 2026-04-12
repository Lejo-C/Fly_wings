import React from "react";

function LiveStatus({ latestDetection, isScanning }) {
  if (!latestDetection) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
        <div className="text-5xl mb-3">📡</div>
        <h3 className="text-lg font-semibold text-gray-400">No Scans Yet</h3>
        <p className="text-gray-400 text-sm mt-1">
          Click "Single Scan" or "Start Continuous" to begin
        </p>
      </div>
    );
  }

  const isDrone = latestDetection.prediction === "drone";
  const confidence = latestDetection.confidence;

  return (
    <div
      className={`rounded-xl border-2 p-5 transition-all duration-500 shadow-sm ${
        isDrone ? "bg-red-50 border-red-300" : "bg-green-50 border-green-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`text-5xl ${isDrone ? "animate-bounce" : ""}`}>
            {isDrone ? "🚨" : "✅"}
          </div>
          <div>
            <h3 className={`text-xl font-bold ${isDrone ? "text-red-700" : "text-green-700"}`}>
              {isDrone ? "DRONE DETECTED" : "ALL CLEAR"}
            </h3>
            <p className="text-gray-500 text-xs">
              {latestDetection.timestamp || "Just now"} •{" "}
              {latestDetection.model || "EfficientNet-B0"} • RF Signal Analysis
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className={`text-3xl font-bold ${isDrone ? "text-red-600" : "text-green-600"}`}>
            {confidence}%
          </p>
          <p className="text-[11px] text-gray-500">Confidence</p>
          <div className="w-40 h-2.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isDrone ? "bg-red-500" : "bg-green-500"
              }`}
              style={{ width: `${confidence}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="flex items-center space-x-5 mt-4 pt-3 border-t border-gray-200">
        <span className="text-xs text-gray-500">
          ⚡ {latestDetection.inference_ms}ms
        </span>

        {isDrone && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
            Detected via 📡 Signal Signature
          </span>
        )}

        {!isDrone && (
          <span className="text-xs text-gray-500">🏷️ No threat detected</span>
        )}

        {latestDetection.correct !== undefined && (
          <span
            className={`text-xs font-semibold ${
              latestDetection.correct ? "text-green-600" : "text-red-500"
            }`}
          >
            {latestDetection.correct ? "✓ Correct" : "✗ Wrong"}
          </span>
        )}

        {isScanning && (
          <span className="ml-auto flex items-center space-x-1.5 text-green-600 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="font-semibold">LIVE</span>
          </span>
        )}
      </div>
    </div>
  );
}

export default LiveStatus;