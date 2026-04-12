#!/usr/bin/env python3

import os
import sys
import json
import time
import argparse
import numpy as np

import torch
from torchvision import transforms
from PIL import Image

from models import get_model
from generate_dataset import make_drone_spectrogram, make_noise_spectrogram


class Predictor:
    def __init__(self, weights_path="saved_models/drone_classifier_final.pth"):
        self.device = torch.device("cpu")

        if not os.path.isfile(weights_path):
            raise FileNotFoundError(f"Model not found: {weights_path}")

        checkpoint = torch.load(weights_path, map_location=self.device, weights_only=False)
        self.model_name = checkpoint.get("model_name", "efficientnet")
        self.classes = checkpoint.get("classes", ["drone", "noise"])
        self.img_size = checkpoint.get("img_size", 224)

        self.model = get_model(self.model_name, num_classes=len(self.classes), pretrained=False)
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model.to(self.device)
        self.model.eval()

        self.transform = transforms.Compose([
            transforms.Resize((self.img_size, self.img_size)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])

    def predict_image(self, image_path: str) -> dict:
        img = Image.open(image_path).convert("RGB")
        tensor = self.transform(img).unsqueeze(0).to(self.device)

        t0 = time.perf_counter()
        with torch.no_grad():
            output = self.model(tensor)
            probs = torch.softmax(output, dim=1)
            confidence, predicted = probs.max(1)
        inference_ms = (time.perf_counter() - t0) * 1000

        return {
            "prediction": self.classes[predicted.item()],
            "confidence": round(confidence.item() * 100, 2),
            "inference_ms": round(inference_ms, 2),
            "model": self.model_name,
        }

    def predict_array(self, img_array: np.ndarray) -> dict:
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

        return {
            "prediction": self.classes[predicted.item()],
            "confidence": round(confidence.item() * 100, 2),
            "inference_ms": round(inference_ms, 2),
            "model": self.model_name,
        }

    def simulate_scan(self) -> dict:
        is_drone = np.random.random() < 0.3
        if is_drone:
            spec = make_drone_spectrogram()
            ground_truth = "drone"
        else:
            spec = make_noise_spectrogram()
            ground_truth = "noise"

        result = self.predict_array(spec)
        result["ground_truth"] = ground_truth
        result["correct"] = result["prediction"] == ground_truth

        # Assign detection method
        # If drone detected → randomly assign signal or sound
        # In real system this depends on which sensor triggered
        if result["prediction"] == "drone":
            result["detection_method"] = np.random.choice(
                ["signal", "sound"],
                p=[0.65, 0.35]  # 65% signal, 35% sound
            )
        else:
            result["detection_method"] = "none"

        return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["single", "simulate", "health"], default="simulate")
    parser.add_argument("--image", type=str, default=None)
    parser.add_argument("--weights", type=str, default="saved_models/drone_classifier_final.pth")
    args = parser.parse_args()

    try:
        if args.mode == "health":
            exists = os.path.isfile(args.weights)
            print(json.dumps({"status": "ok" if exists else "no_model", "model_exists": exists}))
            return

        predictor = Predictor(args.weights)

        if args.mode == "single" and args.image:
            result = predictor.predict_image(args.image)
            result["detection_method"] = "signal"
        elif args.mode == "simulate":
            result = predictor.simulate_scan()
        else:
            result = {"error": "Invalid mode or missing --image"}

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()