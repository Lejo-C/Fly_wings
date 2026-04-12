#!/usr/bin/env python3
"""
Generates synthetic drone RF spectrograms for training.

In a real deployment you'd capture IQ samples from an SDR.
This script creates REALISTIC synthetic spectrograms so you can
train and demo without hardware.

Usage:
    python generate_dataset.py
    python generate_dataset.py --train_per_class 8000 --val_per_class 2000
"""

import os
import argparse
import numpy as np
from PIL import Image
from tqdm import tqdm

IMG_SIZE = 224  # EfficientNet-B0 default input


def make_drone_spectrogram(size: int = IMG_SIZE) -> np.ndarray:
    """
    Simulates a drone RF spectrogram.
    Drones produce:
      - Strong narrowband carriers (control link ~2.4 GHz)
      - Periodic hopping patterns
      - Harmonics
    """
    img = np.random.normal(loc=30, scale=10, size=(size, size)).astype(np.float32)
    
    # ── Primary carrier frequency (strong horizontal band) ──
    carrier_freq = np.random.randint(size // 4, 3 * size // 4)
    carrier_width = np.random.randint(2, 6)
    carrier_strength = np.random.uniform(180, 255)
    for i in range(max(0, carrier_freq - carrier_width), min(size, carrier_freq + carrier_width)):
        img[i, :] += carrier_strength + np.random.normal(0, 10, size)
    
    # ── Frequency hopping pattern (vertical stripes) ──
    num_hops = np.random.randint(5, 20)
    for _ in range(num_hops):
        t_start = np.random.randint(0, size - 5)
        t_width = np.random.randint(2, 8)
        f_center = carrier_freq + np.random.randint(-30, 30)
        f_width = np.random.randint(1, 4)
        f_lo = max(0, f_center - f_width)
        f_hi = min(size, f_center + f_width)
        t_hi = min(size, t_start + t_width)
        img[f_lo:f_hi, t_start:t_hi] += np.random.uniform(120, 200)
    
    # ── Harmonics ──
    for harmonic in [2, 3]:
        h_freq = carrier_freq * harmonic % size
        h_width = max(1, carrier_width // harmonic)
        h_lo = max(0, h_freq - h_width)
        h_hi = min(size, h_freq + h_width)
        img[h_lo:h_hi, :] += np.random.uniform(60, 120)
    
    # ── Burst transmissions ──
    num_bursts = np.random.randint(3, 10)
    for _ in range(num_bursts):
        bx = np.random.randint(0, size - 10)
        by = np.random.randint(0, size - 10)
        bw = np.random.randint(5, 15)
        bh = np.random.randint(3, 8)
        img[by:min(size, by+bh), bx:min(size, bx+bw)] += np.random.uniform(100, 180)
    
    return np.clip(img, 0, 255).astype(np.uint8)


def make_noise_spectrogram(size: int = IMG_SIZE) -> np.ndarray:
    """
    Simulates background RF noise (no drone).
    Contains:
      - Gaussian noise floor
      - Occasional WiFi/Bluetooth blips
      - Thermal noise gradients
    """
    img = np.random.normal(loc=25, scale=15, size=(size, size)).astype(np.float32)
    
    # ── Thermal gradient ──
    gradient = np.linspace(0, np.random.uniform(10, 40), size).reshape(-1, 1)
    img += gradient
    
    # ── Random WiFi-like bursts (short, wide) ──
    num_wifi = np.random.randint(0, 5)
    for _ in range(num_wifi):
        t = np.random.randint(0, size - 3)
        f = np.random.randint(0, size - 40)
        img[f:f+np.random.randint(20, 40), t:t+np.random.randint(1, 3)] += np.random.uniform(40, 90)
    
    # ── Narrowband interference (thin lines, weaker than drone) ──
    num_interference = np.random.randint(0, 3)
    for _ in range(num_interference):
        f = np.random.randint(0, size)
        img[max(0, f-1):min(size, f+1), :] += np.random.uniform(20, 50)
    
    return np.clip(img, 0, 255).astype(np.uint8)


def generate_dataset(train_per_class: int, val_per_class: int, base_dir: str = "dataset"):
    splits = {
        "train": train_per_class,
        "val": val_per_class,
    }
    
    for split, count in splits.items():
        for label, generator in [("drone", make_drone_spectrogram), ("noise", make_noise_spectrogram)]:
            out_dir = os.path.join(base_dir, split, label)
            os.makedirs(out_dir, exist_ok=True)
            
            existing = len([f for f in os.listdir(out_dir) if f.endswith(".png")])
            if existing >= count:
                print(f"[SKIP] {out_dir} already has {existing} images")
                continue
            
            print(f"[GEN]  {out_dir} → {count} images ...")
            for i in tqdm(range(count), desc=f"  {split}/{label}"):
                img_array = generator()
                # Save as RGB (3 channels) for pretrained models
                img_rgb = np.stack([img_array] * 3, axis=-1)
                img = Image.fromarray(img_rgb, mode="RGB")
                img.save(os.path.join(out_dir, f"{label}_{i:05d}.png"))
    
    print("\n✅ Dataset generation complete!")
    print(f"   Train: {train_per_class} drone + {train_per_class} noise")
    print(f"   Val:   {val_per_class} drone + {val_per_class} noise")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic drone RF spectrograms")
    parser.add_argument("--train_per_class", type=int, default=5000)
    parser.add_argument("--val_per_class", type=int, default=1000)
    parser.add_argument("--dataset_dir", type=str, default="dataset")
    args = parser.parse_args()
    
    generate_dataset(args.train_per_class, args.val_per_class, args.dataset_dir)