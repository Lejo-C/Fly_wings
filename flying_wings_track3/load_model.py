#!/usr/bin/env python3
"""
Load a trained model and benchmark its inference speed.

Usage:
    python load_model.py
    python load_model.py --weights saved_models/drone_classifier_final.pth
"""

import os
import sys
import time
import argparse

import torch
import numpy as np
from torchvision import transforms
from PIL import Image

from models import get_model


def load_trained_model(weights_path: str, device: torch.device):
    """Load model from checkpoint."""
    if not os.path.isfile(weights_path):
        print(f"❌ Weights not found: {weights_path}")
        print(f"   Run training first:  python train.py")
        sys.exit(1)
    
    checkpoint = torch.load(weights_path, map_location=device, weights_only=False)
    
    model_name = checkpoint.get("model_name", "efficientnet")
    classes = checkpoint.get("classes", ["drone", "noise"])
    img_size = checkpoint.get("img_size", 224)
    val_acc = checkpoint.get("val_acc", 0)
    
    print(f"  Model:    {model_name}")
    print(f"  Classes:  {classes}")
    print(f"  Val Acc:  {val_acc:.2f}%")
    print(f"  Img Size: {img_size}")
    
    model = get_model(model_name, num_classes=len(classes), pretrained=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.to(device)
    model.eval()
    
    return model, classes, img_size


def benchmark(model, device, img_size: int = 224, num_runs: int = 100):
    """Measure average inference time."""
    dummy = torch.randn(1, 3, img_size, img_size).to(device)
    
    # Warmup
    for _ in range(10):
        with torch.no_grad():
            _ = model(dummy)
    
    # Timed runs
    times = []
    for _ in range(num_runs):
        t0 = time.perf_counter()
        with torch.no_grad():
            _ = model(dummy)
        times.append((time.perf_counter() - t0) * 1000)  # ms
    
    avg = np.mean(times)
    std = np.std(times)
    print(f"\n  Inference Benchmark ({num_runs} runs):")
    print(f"    Average: {avg:.1f} ms")
    print(f"    Std Dev: {std:.1f} ms")
    print(f"    Min:     {min(times):.1f} ms")
    print(f"    Max:     {max(times):.1f} ms")
    return avg


def predict_single(model, image_path: str, classes: list, img_size: int, device: torch.device):
    """Predict a single spectrogram image."""
    transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    
    img = Image.open(image_path).convert("RGB")
    tensor = transform(img).unsqueeze(0).to(device)
    
    with torch.no_grad():
        output = model(tensor)
        probs = torch.softmax(output, dim=1)
        confidence, predicted = probs.max(1)
    
    label = classes[predicted.item()]
    conf = confidence.item() * 100
    print(f"\n  Prediction: {label} ({conf:.1f}% confidence)")
    return label, conf


def main():
    parser = argparse.ArgumentParser(description="Load & benchmark trained model")
    parser.add_argument("--weights", type=str,
                        default="saved_models/drone_classifier_final.pth")
    parser.add_argument("--image", type=str, default=None,
                        help="Path to a spectrogram image to classify")
    parser.add_argument("--benchmark_runs", type=int, default=100)
    args = parser.parse_args()
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    print(f"\n{'='*60}")
    print(f"  LOADING TRAINED MODEL")
    print(f"{'='*60}")
    print(f"  Device: {device}")
    
    model, classes, img_size = load_trained_model(args.weights, device)
    
    # Model size
    size_mb = os.path.getsize(args.weights) / 1e6
    print(f"  File Size: {size_mb:.1f} MB")
    
    # Benchmark
    benchmark(model, device, img_size, args.benchmark_runs)
    
    # Single prediction
    if args.image:
        predict_single(model, args.image, classes, img_size, device)
    
    print(f"\n{'='*60}\n")


if __name__ == "__main__":
    main()