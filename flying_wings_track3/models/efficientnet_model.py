"""
EfficientNet-B0 for Drone RF Spectrogram Classification
- Size: 5.3 MB
- Inference: ~80ms CPU
- Pre-trained on ImageNet → fine-tuned on spectrograms
"""

import torch
import torch.nn as nn
from torchvision import models
from torchvision.models import EfficientNet_B0_Weights


class DroneEfficientNet(nn.Module):
    def __init__(self, num_classes: int = 2, pretrained: bool = True):
        super().__init__()
        
        if pretrained:
            weights = EfficientNet_B0_Weights.IMAGENET1K_V1
            self.base = models.efficientnet_b0(weights=weights)
        else:
            self.base = models.efficientnet_b0(weights=None)
        
        # Replace the classifier head
        in_features = self.base.classifier[1].in_features  # 1280
        self.base.classifier = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(in_features, 128),
            nn.ReLU(),
            nn.Dropout(p=0.2),
            nn.Linear(128, num_classes),
        )
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.base(x)
    
    @staticmethod
    def name() -> str:
        return "EfficientNet-B0"