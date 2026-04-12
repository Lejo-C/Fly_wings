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
            <tr className="text-gray-400 border-b border-gray-100 text-xs text-center">
              <th className="text-left py-2 px-3">#</th>
              <th className="text-left py-2 px-3">Time</th>
              <th className="text-left py-2 px-3">Result</th>
              <th className="text-left py-2 px-3">Confidence</th>
              <th className="text-center py-2 px-3">Speed</th>
              <th className="text-center py-2 px-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {detections.map((det, index) => {
              const isDrone = det.prediction === "drone";

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
                  <td className="py-2.5 px-3 text-gray-600 font-medium">
                    {det.timestamp || "—"}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight ${
                        isDrone
                          ? "bg-red-100 text-red-600 border border-red-200"
                          : "bg-green-100 text-green-700 border border-green-200"
                      }`}
                    >
                      <span>{isDrone ? "🚨" : "✅"}</span>
                      <span>{isDrone ? "DRONE SIGNATURE" : "BACKGROUND"}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isDrone ? "bg-red-400" : "bg-green-500"
                          }`}
                          style={{ width: `${det.confidence}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-600 font-bold">{det.confidence}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600 text-center">
                    {det.inference_ms}ms
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {det.correct ? (
                      <span className="text-green-600 font-black">✓</span>
                    ) : (
                      <span className="text-red-500 font-black">✗</span>
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