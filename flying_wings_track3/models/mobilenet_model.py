"""
MobileNetV3-Small for Drone RF Spectrogram Classification
- Size: 2.5 MB
- Inference: ~45ms CPU
- Ultra lightweight — best for real-time on weak hardware
"""

import torch
import torch.nn as nn
from torchvision import models
from torchvision.models import MobileNet_V3_Small_Weights


class DroneMobileNet(nn.Module):
    def __init__(self, num_classes: int = 2, pretrained: bool = True):
        super().__init__()
        
        if pretrained:
            weights = MobileNet_V3_Small_Weights.IMAGENET1K_V1
            self.base = models.mobilenet_v3_small(weights=weights)
        else:
            self.base = models.mobilenet_v3_small(weights=None)
        
        # Replace classifier
        in_features = self.base.classifier[3].in_features  # 1024
        self.base.classifier[3] = nn.Linear(in_features, num_classes)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.base(x)
    
    @staticmethod
    def name() -> str:
        return "MobileNetV3-Small"