#!/usr/bin/env python3
"""
Trains any of the 4 models on the spectrogram dataset.

Usage:
    python train.py                                    # trains EfficientNet-B0 (default)
    python train.py --model mobilenet --epochs 15
    python train.py --model resnet
    python train.py --model lstm --lr 0.0005
"""

import os
import sys
import json
import time
import argparse
from datetime import datetime

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from tqdm import tqdm

from models import get_model

# ─────────────────────── CONFIG ───────────────────────
DEFAULT_CONFIG = {
    "model": "efficientnet",
    "epochs": 10,
    "batch_size": 32,
    "lr": 0.001,
    "img_size": 224,
    "num_workers": 4,
    "dataset_dir": "dataset",
    "save_dir": "saved_models",
    "device": "auto",
}


def get_transforms(img_size: int):
    train_transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])
    
    return train_transform, val_transform


def train_one_epoch(model, loader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    pbar = tqdm(loader, desc="  Train", leave=False)
    for images, labels in pbar:
        images, labels = images.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item() * images.size(0)
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()
        
        pbar.set_postfix(loss=f"{loss.item():.4f}", acc=f"{100.*correct/total:.1f}%")
    
    epoch_loss = running_loss / total
    epoch_acc = 100.0 * correct / total
    return epoch_loss, epoch_acc


@torch.no_grad()
def validate(model, loader, criterion, device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    
    for images, labels in tqdm(loader, desc="  Val  ", leave=False):
        images, labels = images.to(device), labels.to(device)
        outputs = model(images)
        loss = criterion(outputs, labels)
        
        running_loss += loss.item() * images.size(0)
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()
    
    epoch_loss = running_loss / total
    epoch_acc = 100.0 * correct / total
    return epoch_loss, epoch_acc


def main():
    parser = argparse.ArgumentParser(description="Train drone RF classifier")
    parser.add_argument("--model", type=str, default=DEFAULT_CONFIG["model"],
                        choices=["efficientnet", "mobilenet", "resnet", "lstm"])
    parser.add_argument("--epochs", type=int, default=DEFAULT_CONFIG["epochs"])
    parser.add_argument("--batch_size", type=int, default=DEFAULT_CONFIG["batch_size"])
    parser.add_argument("--lr", type=float, default=DEFAULT_CONFIG["lr"])
    parser.add_argument("--img_size", type=int, default=DEFAULT_CONFIG["img_size"])
    parser.add_argument("--dataset_dir", type=str, default=DEFAULT_CONFIG["dataset_dir"])
    parser.add_argument("--save_dir", type=str, default=DEFAULT_CONFIG["save_dir"])
    args = parser.parse_args()
    
    # ── Device ──
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n{'='*60}")
    print(f"  DRONE RF CLASSIFIER — TRAINING")
    print(f"{'='*60}")
    print(f"  Model:      {args.model}")
    print(f"  Device:     {device}")
    print(f"  Epochs:     {args.epochs}")
    print(f"  Batch Size: {args.batch_size}")
    print(f"  LR:         {args.lr}")
    print(f"{'='*60}\n")
    
    # ── Data ──
    train_transform, val_transform = get_transforms(args.img_size)
    
    train_dir = os.path.join(args.dataset_dir, "train")
    val_dir = os.path.join(args.dataset_dir, "val")
    
    if not os.path.isdir(train_dir):
        print(f"❌ Dataset not found at '{train_dir}'")
        print(f"   Run:  python generate_dataset.py")
        sys.exit(1)
    
    train_dataset = datasets.ImageFolder(train_dir, transform=train_transform)
    val_dataset = datasets.ImageFolder(val_dir, transform=val_transform)
    
    print(f"  Classes: {train_dataset.classes}")
    print(f"  Train samples: {len(train_dataset)}")
    print(f"  Val samples:   {len(val_dataset)}\n")
    
    train_loader = DataLoader(train_dataset, batch_size=args.batch_size,
                              shuffle=True, num_workers=args.num_workers
                              if hasattr(args, 'num_workers') else 4,
                              pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size,
                            shuffle=False, num_workers=4, pin_memory=True)
    
    # ── Model ──
    model = get_model(args.model, num_classes=len(train_dataset.classes), pretrained=True)
    model = model.to(device)
    
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"  Total params:     {total_params:,}")
    print(f"  Trainable params: {trainable_params:,}\n")
    
    # ── Loss / Optimizer / Scheduler ──
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=5, gamma=0.5)
    
    # ── Training Loop ──
    best_val_acc = 0.0
    history = []
    
    for epoch in range(1, args.epochs + 1):
        print(f"Epoch {epoch}/{args.epochs}")
        
        t0 = time.time()
        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc = validate(model, val_loader, criterion, device)
        scheduler.step()
        elapsed = time.time() - t0
        
        print(f"  Train Loss: {train_loss:.4f}  Acc: {train_acc:.2f}%")
        print(f"  Val   Loss: {val_loss:.4f}  Acc: {val_acc:.2f}%")
        print(f"  Time: {elapsed:.1f}s  LR: {scheduler.get_last_lr()[0]:.6f}\n")
        
        history.append({
            "epoch": epoch,
            "train_loss": train_loss,
            "train_acc": train_acc,
            "val_loss": val_loss,
            "val_acc": val_acc,
            "time": elapsed,
        })
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            os.makedirs(args.save_dir, exist_ok=True)
            save_path = os.path.join(args.save_dir, "drone_classifier_final.pth")
            torch.save({
                "model_name": args.model,
                "model_state_dict": model.state_dict(),
                "classes": train_dataset.classes,
                "val_acc": val_acc,
                "epoch": epoch,
                "img_size": args.img_size,
            }, save_path)
            print(f"  ✅ Best model saved → {save_path} (acc: {val_acc:.2f}%)\n")
    
    # ── Save training log ──
    os.makedirs("logs", exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_path = os.path.join("logs", f"session_{timestamp}.json")
    with open(log_path, "w") as f:
        json.dump({
            "model": args.model,
            "best_val_acc": best_val_acc,
            "config": vars(args),
            "history": history,
        }, f, indent=2)
    
    print(f"{'='*60}")
    print(f"  TRAINING COMPLETE")
    print(f"  Best Validation Accuracy: {best_val_acc:.2f}%")
    print(f"  Model saved to: saved_models/drone_classifier_final.pth")
    print(f"  Log saved to:   {log_path}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()