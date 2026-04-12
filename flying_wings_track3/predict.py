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
        if result["prediction"] == "drone":
            result["detection_method"] = "signal"
        else:
            result["detection_method"] = "none"

        return result

    def sdr_scan(self, center_freq=915e6, sample_rate=2.0e6) -> dict:
        """Capture from real RTL-SDR and predict."""
        try:
            import scipy.signal
            if sys.platform == 'win32' and hasattr(os, 'add_dll_directory'):
                os.add_dll_directory(os.getcwd())
            from rtlsdr import RtlSdr
            
            sdr = RtlSdr()
            try:
                sdr.sample_rate = sample_rate
                sdr.center_freq = center_freq
                sdr.gain = 'auto'
                
                # Read samples
                samples = sdr.read_samples(256*1024)
                
                # Compute spectrogram
                f, t, Sxx = scipy.signal.spectrogram(
                    samples, fs=sample_rate, window='hamming', 
                    nperseg=256, noverlap=128, return_onesided=False
                )
                
                # Format and normalize
                Sxx = np.fft.fftshift(Sxx, axes=0)
                Sxx = 10 * np.log10(Sxx + 1e-10)
                Sxx_norm = (Sxx - Sxx.min()) / (Sxx.max() - Sxx.min() + 1e-6)
                Sxx_norm = (Sxx_norm * 255).astype(np.uint8)
                
                # Resize
                img = Image.fromarray(Sxx_norm)
                img_resized = img.resize((self.img_size, self.img_size), Image.Resampling.LANCZOS)
                spec = np.array(img_resized)
                
                result = self.predict_array(spec)
                result["detection_method"] = "signal"
                return result

            finally:
                sdr.close()
                
        except Exception as e:
            return {"error": f"SDR Connection failed: {str(e)}", "fallback": "simulation"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["single", "simulate", "sdr", "health"], default="simulate")
    parser.add_argument("--image", type=str, default=None)
    parser.add_argument("--freq", type=float, default=915e6)
    parser.add_argument("--rate", type=float, default=2.0e6)
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
        elif args.mode == "sdr":
            result = predictor.sdr_scan(center_freq=args.freq, sample_rate=args.rate)
            # If SDR fails, we could fallback to simulation here if desired, 
            # but usually it's better to report the error so user knows hardware isn't working.
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