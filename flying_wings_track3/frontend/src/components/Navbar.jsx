import React from "react";

function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🛸</span>
          <h1 className="text-sm font-bold text-gray-800">
            Drone RF Detection
          </h1>
          <span className="text-[10px] text-gray-400 hidden sm:inline">
            — Flying Wings Track 3
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[11px] text-green-700 font-medium">Online</span>
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