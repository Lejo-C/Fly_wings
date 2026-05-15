import React from "react";

function Dashboard({ isScanning, loading, onSingleScan, onStartScan, onStopScan, onClear }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h2 className="text-sm font-semibold mb-3 text-gray-700">
        ⚡ Control Panel
      </h2>

      <div className="flex flex-wrap gap-2">
        {/* Single Scan */}
        <button
          onClick={onSingleScan}
          disabled={loading || isScanning}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 
                     disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium 
                     transition-colors flex items-center space-x-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Scanning...</span>
            </>
          ) : (
            <>
              <span>🔍</span>
              <span>Single Scan</span>
            </>
          )}
        </button>

        {/* Start */}
        <button
          onClick={onStartScan}
          disabled={isScanning}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg 
                     text-white text-sm font-medium transition-colors flex items-center space-x-2"
        >
          <span>▶</span>
          <span>Start Continuous</span>
        </button>

        {/* Stop */}
        <button
          onClick={onStopScan}
          disabled={!isScanning}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg 
                     text-white text-sm font-medium transition-colors flex items-center 
                     space-x-2"
        >
          <span>⏹</span>
          <span>Stop Scan</span>
        </button>

        {/* Clear */}
        <button
          onClick={onClear}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 
                     rounded-lg text-gray-600 text-sm font-medium transition-colors 
                     flex items-center space-x-2 ml-auto"
        >
          <span>🗑️</span>
          <span>Clear</span>
        </button>
      </div>

      {isScanning && (
        <div className="mt-3 flex items-center space-x-2 text-green-600">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs font-medium">
            Live scanning — monitoring every 2 seconds
          </span>
        </div>
      )}
    </div>
  );
}

export default Dashboard;