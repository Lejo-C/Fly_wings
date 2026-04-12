"""
Custom LSTM for Drone RF Time-Series Classification
- Size: ~1 MB
- Inference: ~20ms CPU
- Works on raw IQ / power vectors (not images)
- Medium difficulty: requires different data pipeline
"""

import torch
import torch.nn as nn


class DroneLSTM(nn.Module):
    def __init__(
        self,
        num_classes: int = 2,
        input_size: int = 128,    # frequency bins per time step
        hidden_size: int = 128,
        num_layers: int = 2,
        pretrained: bool = False,  # no pretrained weights for custom LSTM
    ):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.3,
            bidirectional=True,
        )
        
        self.classifier = nn.Sequential(
            nn.Linear(hidden_size * 2, 64),   # *2 for bidirectional
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, num_classes),
        )
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        x shape: (batch, seq_len, input_size)
        If x is an image (batch, C, H, W), we squeeze and treat H as seq_len, W as features.
        """
        if x.dim() == 4:
            # Convert spectrogram image → sequence
            # (B, C, H, W) → (B, H, W) by averaging channels
            x = x.mean(dim=1)  # (B, H, W)
        
        lstm_out, _ = self.lstm(x)          # (B, seq_len, hidden*2)
        last_hidden = lstm_out[:, -1, :]    # take last time step
        return self.classifier(last_hidden)
    
    @staticmethod
    def name() -> str:
        return "Custom-LSTM"