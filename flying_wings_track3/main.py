#!/usr/bin/env python3
"""
Main entry point for live drone RF detection.

Simulates continuous RF monitoring:
  1. Generates a spectrogram (simulating SDR capture)
  2. Classifies it using the trained model
  3. Logs results to SQLite database

Usage:
    python main.py
    python main.py --model_path saved_models/drone_classifier_final.pth
    python main.py --interval 2.0 --duration 60
"""

import os
import sys
import time
import json
import sqlite3
import argparse
from datetime import datetime

import torch
import numpy as np
from torchvision import transforms
from PIL import Image
import scipy.signal

from models import get_model
from generate_dataset import make_drone_spectrogram, make_noise_spectrogram


class DroneDetector:
    """Real-time drone RF detection engine."""
    
    def __init__(self, model_path: str, device: str = "auto"):
        if device == "auto":
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        # Load model
        checkpoint = torch.load(model_path, map_location=self.device, weights_only=False)
        self.model_name = checkpoint.get("model_name", "efficientnet")
        self.classes = checkpoint.get("classes", ["drone", "noise"])
        self.img_size = checkpoint.get("img_size", 224)
        
        self.model = get_model(self.model_name, num_classes=len(self.classes), pretrained=False)
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model = self.model.to(self.device)
        self.model.eval()
        
        self.transform = transforms.Compose([
            transforms.Resize((self.img_size, self.img_size)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])
        
        # Database
        os.makedirs("logs", exist_ok=True)
        self.db_path = os.path.join("logs", "detections.sqlite")
        self._init_db()
        
        print(f"  ✅ Detector initialized")
        print(f"     Model: {self.model_name}")
        print(f"     Device: {self.device}")
        print(f"     Classes: {self.classes}")
    
    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS detections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                prediction TEXT NOT NULL,
                confidence REAL NOT NULL,
                inference_ms REAL NOT NULL,
                alert INTEGER DEFAULT 0
            )
        """)
        conn.commit()
        conn.close()
    
    def _log_detection(self, prediction: str, confidence: float, inference_ms: float):
        conn = sqlite3.connect(self.db_path)
        conn.execute(
            "INSERT INTO detections (timestamp, prediction, confidence, inference_ms, alert) VALUES (?, ?, ?, ?, ?)",
            (datetime.now().isoformat(), prediction, confidence, inference_ms, 1 if prediction == "drone" else 0)
        )
        conn.commit()
        conn.close()
    
    def classify_spectrogram(self, img_array: np.ndarray) -> tuple:
        """Classify a spectrogram array. Returns (label, confidence, time_ms)."""
        # Convert to PIL Image
        if img_array.ndim == 2:
            img_rgb = np.stack([img_array] * 3, axis=-1)
        else:
            img_rgb = img_array
        img = Image.fromarray(img_rgb.astype(np.uint8))
        
        tensor = self.transform(img).unsqueeze(0).to(self.device)
        
        t0 = time.perf_counter()
        with torch.no_grad():
            output = self.model(tensor)
            probs = torch.softmax(output, dim=1)
            confidence, predicted = probs.max(1)
        inference_ms = (time.perf_counter() - t0) * 1000
        
        label = self.classes[predicted.item()]
        conf = confidence.item()
        
        self._log_detection(label, conf, inference_ms)
        
        return label, conf, inference_ms
    
    def get_stats(self) -> dict:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM detections")
        total = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM detections WHERE alert = 1")
        alerts = cursor.fetchone()[0]
        
        cursor.execute("SELECT AVG(inference_ms) FROM detections")
        avg_ms = cursor.fetchone()[0] or 0
        
        conn.close()
        return {"total_scans": total, "drone_alerts": alerts, "avg_inference_ms": avg_ms}


def get_sdr_spectrogram(sdr, sample_rate, img_size=224) -> np.ndarray:
    """Reads from real SDR and generates a spectrogram of proper size."""
    try:
        # Read a chunk of samples
        samples = sdr.read_samples(256*1024)
    except Exception as e:
        print(f"  [ERROR] SDR reading failed: {e}")
        return make_noise_spectrogram(img_size)

    # Compute spectrogram
    f, t, Sxx = scipy.signal.spectrogram(
        samples, fs=sample_rate, window='hamming', 
        nperseg=256, noverlap=128, return_onesided=False
    )
    
    # Format and normalize the spectrogram
    Sxx = np.fft.fftshift(Sxx, axes=0)
    Sxx = 10 * np.log10(Sxx + 1e-10) # convert to dB
    
    Sxx_norm = (Sxx - Sxx.min()) / (Sxx.max() - Sxx.min() + 1e-6)
    Sxx_norm = (Sxx_norm * 255).astype(np.uint8)
    
    # Resize to the target image size
    img = Image.fromarray(Sxx_norm)
    img_resized = img.resize((img_size, img_size), Image.Resampling.LANCZOS)
    
    return np.array(img_resized)

def cleanup_captures(max_files=100, captures_dir="captures"):
    """Deletes oldest captures if the count exceeds max_files."""
    if not os.path.exists(captures_dir):
        return
    
    files = [os.path.join(captures_dir, f) for f in os.listdir(captures_dir) if f.endswith(".png")]
    if len(files) <= max_files:
        return
    
    # Sort by modification time (oldest first)
    files.sort(key=os.path.getmtime)
    
    # Delete oldest
    to_delete = files[:len(files) - max_files]
    for f in to_delete:
        try:
            os.remove(f)
        except Exception as e:
            print(f"  [WARNING] Failed to delete old capture {f}: {e}")

def run_live_detection(detector: DroneDetector, interval: float, duration: float, use_sdr: bool = False, center_freq: float = 915e6, sample_rate: float = 2.0e6, gain: str = 'auto'):
    """Run live RF monitoring (SDR or Simulated)."""
    sdr = None
    if use_sdr:
        try:
            import warnings
            warnings.filterwarnings('ignore', category=UserWarning, module='rtlsdr')
            import os
            import sys
            if sys.platform == 'win32' and hasattr(os, 'add_dll_directory'):
                os.add_dll_directory(os.getcwd())
            from rtlsdr import RtlSdr
            sdr = RtlSdr()
            sdr.sample_rate = sample_rate
            sdr.center_freq = center_freq
            sdr.gain = gain
            print(f"  📡 RTL-SDR CONNECTED (Freq: {center_freq/1e6} MHz, SR: {sample_rate/1e6} MHz)")
        except Exception as e:
            print(f"  ❌ Failed to connect to RTL-SDR: {e}")
            print(f"     Falling back to SIMULATION mode.")
            use_sdr = False

    print(f"\n{'='*60}")
    print(f"  🔍 LIVE DRONE RF DETECTION {'(SDR)' if use_sdr else '(SIMULATED)'}")
    print(f"     Scan interval: {interval}s")
    print(f"     Duration: {duration}s")
    print(f"{'='*60}\n")
    
    start_time = time.time()
    scan_count = 0
    drone_count = 0
    
    try:
        while time.time() - start_time < duration:
            scan_count += 1
            
            if use_sdr:
                spectrogram = get_sdr_spectrogram(sdr, sample_rate)
                ground_truth = "?"
            else:
                # Simulate: 30% chance of drone signal
                if np.random.random() < 0.3:
                    spectrogram = make_drone_spectrogram()
                    ground_truth = "drone"
                else:
                    spectrogram = make_noise_spectrogram()
                    ground_truth = "noise"
            
            label, conf, ms = detector.classify_spectrogram(spectrogram)
            
            is_drone = label == "drone"
            if is_drone:
                drone_count += 1
            
            # Save the spectrogram photo ONLY if it's a drone
            photo_path = None
            if use_sdr and is_drone:
                os.makedirs("captures", exist_ok=True)
                timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
                img_to_save = Image.fromarray(spectrogram).convert("RGB")
                photo_path = f"captures/sdr_drone_{timestamp_str}.png"
                img_to_save.save(photo_path)
                cleanup_captures(max_files=50) # Auto-delete old photos to save space
            
            # Display
            icon = "🚨 DRONE" if is_drone else "✅ Clear"
            bar = "█" * int(conf * 20)
            timestamp = datetime.now().strftime("%H:%M:%S")
            
            if use_sdr:
                status_msg = f"Saved: {photo_path}" if photo_path else "Skipped (Clear)"
            else:
                status_msg = f"{label == ground_truth and '✓' or '✗'}"
            
            print(f"  [{timestamp}] Scan #{scan_count:03d}  "
                  f"{icon}  conf={conf:.1%} {bar}  "
                  f"{ms:.0f}ms  {status_msg}")
            
            time.sleep(interval)
    
    except KeyboardInterrupt:
        print("\n\n  ⏹ Stopped by user")
    finally:
        if sdr is not None:
            sdr.close()
    
    # Summary
    stats = detector.get_stats()
    elapsed = time.time() - start_time
    print(f"\n{'='*60}")
    print(f"  SESSION SUMMARY")
    print(f"{'='*60}")
    print(f"  Duration:        {elapsed:.0f}s")
    print(f"  Total scans:     {scan_count}")
    print(f"  Drone alerts:    {drone_count}")
    print(f"  Avg inference:   {stats['avg_inference_ms']:.1f}ms")
    print(f"  Logs saved to:   {detector.db_path}")
    print(f"{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(description="Live drone RF detection")
    parser.add_argument("--model_path", type=str,
                        default="saved_models/drone_classifier_final.pth")
    parser.add_argument("--interval", type=float, default=1.0,
                        help="Seconds between scans")
    parser.add_argument("--duration", type=float, default=30.0,
                        help="Total monitoring duration in seconds")
    parser.add_argument("--sdr", action="store_true", 
                        help="Use real RTL-SDR input instead of simulation")
    parser.add_argument("--freq", type=float, default=915e6, 
                        help="Tuning center frequency in Hz (default: 915MHz - within RTL-SDR range)")
    parser.add_argument("--rate", type=float, default=2.0e6, 
                        help="Sample rate in Hz (default: 2.0MHz)")
    args = parser.parse_args()
    
    if not os.path.isfile(args.model_path):
        print(f"\n❌ Trained model not found: {args.model_path}")
        print(f"   Run these first:")
        print(f"     1. python generate_dataset.py")
        print(f"     2. python train.py")
        sys.exit(1)
    
    detector = DroneDetector(args.model_path)
    run_live_detection(detector, interval=args.interval, duration=args.duration, 
                       use_sdr=args.sdr, center_freq=args.freq, sample_rate=args.rate)

if __name__ == "__main__":
    main()