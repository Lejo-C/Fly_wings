"""
ResNet-18 for Drone RF Spectrogram Classification
- Size: 44 MB
- Inference: ~120ms CPU
- Most studied architecture — very stable training
"""

import torch
import torch.nn as nn
from torchvision import models
from torchvision.models import ResNet18_Weights


class DroneResNet(nn.Module):
    def __init__(self, num_classes: int = 2, pretrained: bool = True):
        super().__init__()
        
        if pretrained:
            weights = ResNet18_Weights.IMAGENET1K_V1
            self.base = models.resnet18(weights=weights)
        else:
            self.base = models.resnet18(weights=None)
        
        # Replace final FC layer
        in_features = self.base.fc.in_features  # 512
        self.base.fc = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(in_features, 128),
            nn.ReLU(),
            nn.Linear(128, num_classes),
        )
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.base(x)
    
    @staticmethod
    def name() -> str:
        return "ResNet-18"