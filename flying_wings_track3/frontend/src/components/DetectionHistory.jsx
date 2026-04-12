import React from "react";

function DetectionHistory({ detections }) {
  if (detections.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">📋 Detection History</h2>
        <p className="text-gray-400 text-sm text-center py-6">No detections recorded yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">📋 Detection History</h2>
        <span className="text-[11px] text-gray-400">{detections.length} records</span>
      </div>

      <div className="overflow-y-auto max-h-[400px] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="text-gray-400 border-b border-gray-100 text-xs">
              <th className="text-left py-2 px-3">#</th>
              <th className="text-left py-2 px-3">Time</th>
              <th className="text-left py-2 px-3">Result</th>
              <th className="text-left py-2 px-3">Detected Via</th>
              <th className="text-left py-2 px-3">Confidence</th>
              <th className="text-left py-2 px-3">Speed</th>
              <th className="text-left py-2 px-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {detections.map((det, index) => {
              const isDrone = det.prediction === "drone";
              const method = det.detection_method;

              return (
                <tr
                  key={det.id || index}
                  className={`border-b border-gray-50 hover:bg-gray-50 transition-colors text-xs ${
                    isDrone ? "bg-red-50/50" : ""
                  }`}
                >
                  <td className="py-2.5 px-3 text-gray-400">
                    {detections.length - index}
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">
                    {det.timestamp || "—"}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        isDrone
                          ? "bg-red-100 text-red-600 border border-red-200"
                          : "bg-green-100 text-green-700 border border-green-200"
                      }`}
                    >
                      <span>{isDrone ? "🚨" : "✅"}</span>
                      <span>{isDrone ? "DRONE" : "CLEAR"}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {isDrone && method && method !== "none" ? (
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          method === "signal"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-orange-50 text-orange-700 border border-orange-200"
                        }`}
                      >
                        <span>{method === "signal" ? "📡" : "🔊"}</span>
                        <span>{method === "signal" ? "Signal" : "Sound"}</span>
                      </span>
                    ) : (
                      <span className="text-gray-300 text-[10px]">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isDrone ? "bg-red-400" : "bg-green-500"
                          }`}
                          style={{ width: `${det.confidence}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-600">{det.confidence}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">
                    {det.inference_ms}ms
                  </td>
                  <td className="py-2.5 px-3">
                    {det.correct ? (
                      <span className="text-green-600 font-bold">✓</span>
                    ) : (
                      <span className="text-red-500 font-bold">✗</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DetectionHistory;