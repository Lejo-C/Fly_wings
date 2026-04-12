# Flying Wings Track 3: Drone RF Detection

This repository contains a full-stack solution for realistic simulation and real-time detection of drone RF signals using synthetic spectrograms. 

It includes the machine learning models, a Node.js backend, and a React frontend to visualize detections. 

## Table of Contents
- [Requirements](#requirements)
- [Project Structure](#project-structure)
- [1. Data Generation & Model Training](#1-data-generation--model-training)
- [2. Live RF Detection Simulation](#2-live-rf-detection-simulation)
- [3. Running the Web App](#3-running-the-web-app)

## Requirements

The core ML code relies on Python 3 and PyTorch.
To install the required Python packages:

```bash
pip install -r requirement.txt
```

For the web application, you will also need [Node.js](https://nodejs.org/) installed to run the frontend and backend.

## Project Structure

- `generate_dataset.py`: Generates synthetic drone RF spectrograms and background noise for training.
- `download_all_models.py`: Downloads ImageNet pretrained weights (EfficientNet, MobileNet, ResNet) for offline training.
- `train.py`: Trains the RF classifier on the synthetic dataset.
- `predict.py`: Standalone inference script for classifying single images or running a simulated scan.
- `main.py`: Simulates a continuously running real-time drone RF monitoring engine and stores detections into an SQLite DB (`logs/detections.sqlite`).
- `backend/`: Node.js Express server to expose the database and detection logs.
- `frontend/`: React frontend (Vite) to display real-time visual alerts and drone statistics.

## 1. Data Generation & Model Training

Follow these steps to train your drone detector:

**Step 1. Download Pretrained Weights** (Run once)
```bash
python download_all_models.py
```

**Step 2. Generate the Dataset**
Produces simulated raw spectrograms without needing SDR hardware:
```bash
python generate_dataset.py --train_per_class 5000 --val_per_class 1000
```
*(This places image data into the `dataset/` directory)*

**Step 3. Train the Model**
You can customize the model architecture (`efficientnet` [default], `mobilenet`, `resnet`, `lstm`), epochs, and batch size:
```bash
python train.py --model efficientnet --epochs 10
```
This will save your trained model to `saved_models/drone_classifier_final.pth`.

## 2. Live RF Detection Simulation

You can test the trained model practically on "simulated live data". The script runs continuously to classify RF signals and logs the results to SQLite.

```bash
python main.py
```
*(Optional arguments: `--interval 1.0` (Seconds between scans), `--duration 30.0` (Total time in seconds))*

If you want to just run a quick manual single test inference, use the prediction script:
```bash
python predict.py --mode simulate

# Alternatively, test a specific image:
python predict.py --mode single --image dataset/val/drone/drone_00000.png
```

## 3. Running the Web App

The project contains a dashboard to monitor live drone detection visually. You should start both the backend and frontend servers in separate terminals.

**Start the Node Backend:**
```bash
cd backend
npm install
node server.js
```

**Start the React Frontend:**
```bash
cd frontend
npm install
npm run dev
```
