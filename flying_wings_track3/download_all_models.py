#!/usr/bin/env python3
"""
Downloads all pretrained ImageNet weights so training works offline.
Run this ONCE before training.

Usage:
    python download_all_models.py
"""

import os
import torch
from torchvision import models
from torchvision.models import (
    EfficientNet_B0_Weights,
    MobileNet_V3_Small_Weights,
    ResNet18_Weights,
)

SAVE_DIR = os.path.join("saved_models", "pretrained")
os.makedirs(SAVE_DIR, exist_ok=True)


def download_and_save():
    print("=" * 60)
    print("  DOWNLOADING PRETRAINED IMAGENET WEIGHTS")
    print("=" * 60)
    
    # ── EfficientNet-B0 ──
    print("\n[1/3] EfficientNet-B0 ...")
    eff = models.efficientnet_b0(weights=EfficientNet_B0_Weights.IMAGENET1K_V1)
    path = os.path.join(SAVE_DIR, "efficientnet_b0_imagenet.pth")
    torch.save(eff.state_dict(), path)
    size_mb = os.path.getsize(path) / 1e6
    print(f"       Saved → {path}  ({size_mb:.1f} MB)")
    
    # ── MobileNetV3-Small ──
    print("\n[2/3] MobileNetV3-Small ...")
    mob = models.mobilenet_v3_small(weights=MobileNet_V3_Small_Weights.IMAGENET1K_V1)
    path = os.path.join(SAVE_DIR, "mobilenet_v3_small_imagenet.pth")
    torch.save(mob.state_dict(), path)
    size_mb = os.path.getsize(path) / 1e6
    print(f"       Saved → {path}  ({size_mb:.1f} MB)")
    
    # ── ResNet-18 ──
    print("\n[3/3] ResNet-18 ...")
    res = models.resnet18(weights=ResNet18_Weights.IMAGENET1K_V1)
    path = os.path.join(SAVE_DIR, "resnet18_imagenet.pth")
    torch.save(res.state_dict(), path)
    size_mb = os.path.getsize(path) / 1e6
    print(f"       Saved → {path}  ({size_mb:.1f} MB)")
    
    print("\n" + "=" * 60)
    print("  ALL WEIGHTS DOWNLOADED SUCCESSFULLY")
    print("=" * 60)


if __name__ == "__main__":
    download_and_save()