import React from "react";

function StatsCards({ stats }) {
  const cards = [
    {
      title: "Total Scans",
      value: stats.totalScans || 0,
      icon: "📊",
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
    },
    {
      title: "Drone Alerts",
      value: stats.droneAlerts || 0,
      icon: "🚨",
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-600",
    },
    {
      title: "Accuracy",
      value: `${stats.accuracy || 0}%`,
      icon: "🎯",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
    },
    {
      title: "Avg Speed",
      value: `${stats.avgInferenceMs || 0}ms`,
      icon: "⚡",
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
    },
    {
      title: "Confidence",
      value: `${stats.avgConfidence || 0}%`,
      icon: "📈",
      bg: "bg-teal-50",
      border: "border-teal-200",
      text: "text-teal-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`${card.bg} ${card.border} border rounded-xl p-4 
                      transition-transform hover:scale-105`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-lg">{card.icon}</span>
          </div>
          <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{card.title}</p>
        </div>
      ))}
    </div>
  );
}

export default StatsCards;