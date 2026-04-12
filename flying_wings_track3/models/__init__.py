from .efficientnet_model import DroneEfficientNet
from .mobilenet_model import DroneMobileNet
from .resnet_model import DroneResNet
from .lstm_model import DroneLSTM

MODEL_REGISTRY = {
    "efficientnet": DroneEfficientNet,
    "mobilenet": DroneMobileNet,
    "resnet": DroneResNet,
    "lstm": DroneLSTM,
}

def get_model(name: str, num_classes: int = 2, pretrained: bool = True):
    """Factory function — returns the requested model ready for training."""
    name = name.lower()
    if name not in MODEL_REGISTRY:
        raise ValueError(f"Unknown model '{name}'. Choose from {list(MODEL_REGISTRY.keys())}")
    return MODEL_REGISTRY[name](num_classes=num_classes, pretrained=pretrained)