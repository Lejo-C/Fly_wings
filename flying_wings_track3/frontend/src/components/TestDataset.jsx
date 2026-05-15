import React, { useState } from "react";
import { scanFile } from "../api/api";

function TestDataset() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState({
    total: 0,
    processed: 0,
    correct: 0,
    truePositives: 0,
    falsePositives: 0,
    falseNegatives: 0,
    trueNegatives: 0,
    avgLatency: 0,
  });

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      setResults([]);
      setMetrics({
        total: selectedFiles.length,
        processed: 0,
        correct: 0,
        truePositives: 0,
        falsePositives: 0,
        falseNegatives: 0,
        trueNegatives: 0,
        avgLatency: 0,
      });
      setProgress(0);
    }
  };

  const inferGroundTruth = (filename) => {
    const lower = filename.toLowerCase();
    if (lower.includes("drone")) return "drone";
    if (lower.includes("noise") || lower.includes("clutter")) return "noise";
    return null; // Unknown
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setResults([]);

    let processedCount = 0;
    let tp = 0;
    let fp = 0;
    let fn = 0;
    let tn = 0;
    let totalLatency = 0;
    let correctCount = 0;

    const newResults = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      
      const groundTruth = inferGroundTruth(file.name);
      if (groundTruth) {
        formData.append("ground_truth", groundTruth);
      }

      try {
        const res = await scanFile(formData);
        const data = res.data.data;
        
        processedCount++;
        totalLatency += data.inference_ms;
        
        const isDronePrediction = data.prediction === "drone";
        const isDroneTruth = groundTruth === "drone";

        if (groundTruth) {
          if (isDronePrediction && isDroneTruth) tp++;
          if (isDronePrediction && !isDroneTruth) fp++;
          if (!isDronePrediction && isDroneTruth) fn++;
          if (!isDronePrediction && !isDroneTruth) tn++;
          
          if (data.prediction === groundTruth) correctCount++;
        }

        newResults.push({
          filename: file.name,
          prediction: data.prediction,
          confidence: data.confidence,
          latency: data.inference_ms,
          groundTruth: groundTruth || "Unknown",
          correct: data.correct,
        });

      } catch (err) {
        console.error(`Failed to process ${file.name}`, err);
        newResults.push({
          filename: file.name,
          prediction: "error",
          confidence: 0,
          latency: 0,
          groundTruth: groundTruth || "Unknown",
          correct: false,
        });
        processedCount++;
      }

      setProgress(Math.round((processedCount / files.length) * 100));
      
      setMetrics(prev => ({
        ...prev,
        processed: processedCount,
        correct: correctCount,
        truePositives: tp,
        falsePositives: fp,
        falseNegatives: fn,
        trueNegatives: tn,
        avgLatency: processedCount > 0 ? totalLatency / processedCount : 0,
      }));
      
      setResults([...newResults]);
    }

    setIsProcessing(false);
  };

  const pd = (metrics.truePositives + metrics.falseNegatives) > 0 
    ? (metrics.truePositives / (metrics.truePositives + metrics.falseNegatives) * 100).toFixed(2) 
    : 0;
  
  const far = (metrics.falsePositives + metrics.trueNegatives) > 0 
    ? (metrics.falsePositives / (metrics.falsePositives + metrics.trueNegatives) * 100).toFixed(2) 
    : 0;

  const f1 = (metrics.truePositives + 0.5 * (metrics.falsePositives + metrics.falseNegatives)) > 0
    ? (metrics.truePositives / (metrics.truePositives + 0.5 * (metrics.falsePositives + metrics.falseNegatives))).toFixed(4)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Test Dataset Evaluation</h2>
      <p className="text-sm text-gray-500 mb-6">
        Upload a hidden dataset containing mixed RF clutter and UAS-like events. 
        Files should be named with 'drone' or 'noise' to automatically infer ground truth.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
        <label className="block w-full sm:w-auto">
          <span className="text-sm font-semibold block mb-1 text-gray-700">Select Folder:</span>
          <input 
            type="file" 
            multiple 
            webkitdirectory="true"
            onChange={handleFileChange}
            disabled={isProcessing}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100 disabled:opacity-50"
          />
        </label>

        <label className="block w-full sm:w-auto">
          <span className="text-sm font-semibold block mb-1 text-gray-700">Or Select Files (Images / IQ):</span>
          <input 
            type="file" 
            multiple 
            accept="image/*,.npy,.bin,.iq,.dat"
            onChange={handleFileChange}
            disabled={isProcessing}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-emerald-50 file:text-emerald-700
              hover:file:bg-emerald-100 disabled:opacity-50"
          />
        </label>
        
        <button
          onClick={processFiles}
          disabled={files.length === 0 || isProcessing}
          className={`px-6 py-2 rounded-full font-medium transition-colors ${
            files.length === 0 || isProcessing
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
          }`}
        >
          {isProcessing ? "Processing..." : "Run Test Method"}
        </button>
      </div>

      {files.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-700">Progress</span>
            <span className="text-gray-500">{metrics.processed} / {files.length} ({progress}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {/* Metrics Scorecard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-wider">Detection (Pd)</div>
          <div className="text-2xl font-bold text-gray-800">{pd}%</div>
          <div className="text-[10px] text-gray-500 mt-1">True Positive Rate</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-100">
          <div className="text-xs text-red-600 font-semibold mb-1 uppercase tracking-wider">False Alarm (FAR)</div>
          <div className="text-2xl font-bold text-gray-800">{far}%</div>
          <div className="text-[10px] text-gray-500 mt-1">False Positive Rate</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <div className="text-xs text-purple-600 font-semibold mb-1 uppercase tracking-wider">UAS-like F1 Score</div>
          <div className="text-2xl font-bold text-gray-800">{f1}</div>
          <div className="text-[10px] text-gray-500 mt-1">Harmonic mean of precision & recall</div>
        </div>
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
          <div className="text-xs text-emerald-600 font-semibold mb-1 uppercase tracking-wider">Alert Latency</div>
          <div className="text-2xl font-bold text-gray-800">{metrics.avgLatency.toFixed(1)} ms</div>
          <div className="text-[10px] text-gray-500 mt-1">Average inference time</div>
        </div>
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">File</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Ground Truth</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Prediction</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Confidence</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Latency</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Correct</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs text-gray-600 truncate max-w-[200px]" title={r.filename}>
                    {r.filename}
                  </td>
                  <td className="px-4 py-2 text-gray-600 capitalize">{r.groundTruth}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                      r.prediction === 'drone' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {r.prediction === 'drone' ? 'drone' : 'not a drone'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{r.confidence}%</td>
                  <td className="px-4 py-2 text-gray-600">{r.latency} ms</td>
                  <td className="px-4 py-2">
                    {r.correct ? (
                      <span className="text-green-500 font-bold">✓</span>
                    ) : (
                      <span className="text-red-500 font-bold">✗</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TestDataset;
