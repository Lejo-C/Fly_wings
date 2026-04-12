import React from "react";

function AlertBanner({ alert, onClose }) {
  if (!alert) return null;

  return (
    <div className="bg-red-500 text-white px-6 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center space-x-2">
        <span className="text-lg">🚨</span>
        <span className="font-semibold">{alert.message}</span>
        <span className="text-red-200 text-xs">({alert.time})</span>
      </div>
      <button
        onClick={onClose}
        className="text-white hover:text-red-200 font-bold"
      >
        ✕
      </button>
    </div>
  );
}

export default AlertBanner;