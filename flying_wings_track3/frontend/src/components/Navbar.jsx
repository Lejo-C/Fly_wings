import React from "react";

function Navbar({ currentTab, onTabChange, sdrStatus }) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🛸</span>
            <h1 className="text-sm font-bold text-gray-800">
              Drone RF Detection
            </h1>
            <span className="text-[10px] text-gray-400 hidden sm:inline">
              — Flying Wings Track 3
            </span>
          </div>

          <div className="hidden sm:flex space-x-1">
            <button
              onClick={() => onTabChange("dashboard")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                currentTab === "dashboard"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Live Dashboard
            </button>
            <button
              onClick={() => onTabChange("test_dataset")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                currentTab === "test_dataset"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Test Method
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {sdrStatus === "connected" ? (
            <span className="flex items-center space-x-1.5 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
              <span className="text-[11px] text-blue-700 font-medium" title="RTL-SDR Connected">RTL-SDR Active</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              <span className="text-[11px] text-red-700 font-medium" title="RTL-SDR Disconnected">No SDR Found</span>
            </span>
          )}
          <span className="flex items-center space-x-1.5 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[11px] text-green-700 font-medium">Server Online</span>
          </span>
          <span className="text-[11px] text-gray-400">
            EfficientNet-B0
          </span>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;