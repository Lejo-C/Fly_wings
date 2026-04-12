# Drone RF Detection System: How It Works

This document provides a detailed technical breakdown of how the **Drone RF Detection System** operates, from raw input to visual output.

---

## 🏗 System Architecture Overview

The system is divided into three main layers:
1.  **Input Layer**: Hardware (SDR) or simulated signal generation.
2.  **Processing Layer**: Signal processing and Deep Learning classification.
3.  **Output Layer**: Real-time web dashboard and persistent storage.

---

## 1. Input: How it takes data
The system supports two modes of input:

### A. Real-World RTL-SDR Input
*   **Hardware**: Connects to an RTL-SDR (Software Defined Radio) dongle. (Run "python main.py --sdr" to start the SDR)
*   **Capture**: The `rtlsdr` library captures raw I/Q (In-phase and Quadrature) samples from the air.
*   **Frequency**: It tunes to specific frequencies (e.g., 915 MHz or 2.4 GHz) where drone control signals and telemetry are typically found.

### B. Simulated Input
*   **Generation**: For testing without hardware, `generate_dataset.py` creates artificial RF signals.
*   **Noise vs. Signal**: It generates random Gaussian noise and overlays "drone-like" patterns (pips, bursts, or continuous surges) to train and test the model.

---

## 2. Processing: How it analyzes data
Once the raw signal is received, it goes through a multi-stage pipeline:

### Step 1: Spectrogram Generation
Raw RF signals are invisible to a standard AI model. We convert them into a **visual format**:
*   **Short-Time Fourier Transform (STFT)**: We use `scipy.signal.spectrogram` to calculate frequency intensity over time.
*   **Log-Scaling**: The raw intensity is converted to Decibels (dB) to highlight subtle signal patterns.
*   **Normalization**: The data is scaled between 0 and 255 to create a standard grayscale or RGB image.

### Step 2: Deep Learning Inference
*   **Model**: We use **EfficientNet**, a state-of-the-art Convolutional Neural Network (CNN).
*   **Input Image**: The spectrogram image (224x224 pixels) is fed into the model.
*   **Classification**: The model analyzes "visual features" in the spectrogram (like signal width, repetition, and intensity) to decide if it is a **Drone** or just **Noise**.
*   **Confidence**: The model outputs a percentage (e.g., "98% Drone").

### Step 3: Backend Logging
*   The results (timestamp, prediction, confidence, inference time) are sent to the **Node.js Backend**.
*   The backend saves this data into a **SQLite Database** (`detections.db`) for long-term history.

---

## 3. Output: How it displays data
The frontend (React) communicates with the backend to show the results to the user.

### A. Real-Time Tracking (Socket.IO)
*   As soon as a detection happens, the backend emits a WebSocket event.
*   The **Dashboard** updates instantly, showing the latest spectrogram and an alert if a drone is detected.

### Visual Components
*   **Signal Analytics**: Detailed breakdown of drone threat rates and signal reliability.
*   **Line Charts**: Track signal intensity and detection frequency over time.
*   **Detection History**: A searchable list of all past threats with timestamps and confidence levels.

---

## 🔄 The Full Loop (Summary)
1.  **Antenna** picks up raw radio waves.
2.  **Python Script** converts waves into a "Signature Image" (Spectrogram).
3.  **AI Model** looks at the image and says "That's a Drone!".
4.  **Backend** saves the event and sends it to the browser.
5.  **User UI** shows the threat signature and system status.

---

*Acoustic and ambient noise filtering is active. Detection is performed purely via RF spectrum analysis.*

*Document generated for the Flying Wings Project team.*
