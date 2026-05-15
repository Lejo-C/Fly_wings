# Drone RF Detection - Docker Setup Guide

Dockerizing this project allows you to run the **Node.js Backend**, **Python Machine Learning models**, and **React Frontend** seamlessly on any laptop or operating system without manually installing dependencies.

This guide provides the exact configuration needed, especially addressing the complexity of passing physical RTL-SDR USB devices into a Docker container.

---

## 1. Directory Structure Setup

To effectively use Docker, you should create three new files in your project. I have provided the exact code for each below.

Create these files in your root directory (`d:\Fly Wings\model\flying_wings_track3`):
1. `backend.Dockerfile`
2. `frontend.Dockerfile`
3. `docker-compose.yml`

---

## 2. The Configuration Files

### File 1: `backend.Dockerfile`
Because the backend runs Express.js but simultaneously executes heavy Python/PyTorch scripts, we start with a Python image and install Node.js alongside the Linux RTL-SDR drivers.

```dockerfile
# backend.Dockerfile
FROM python:3.10-slim

# Install system dependencies, RTL-SDR Linux drivers, and Node.js
RUN apt-get update && apt-get install -y \
    curl \
    librtlsdr-dev \
    rtl-sdr \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies (including the newly added ones)
COPY requirement.txt .
RUN pip install --no-cache-dir -r requirement.txt
RUN pip install pyrtlsdr scipy

# Install Node.js backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy all project files
COPY . .

# Start the Express server
WORKDIR /app/backend
CMD ["node", "server.js"]
```

### File 2: `frontend.Dockerfile`
This sets up the React Vite environment.

```dockerfile
# frontend.Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source code
COPY frontend/ ./

# Expose Vite's default port
EXPOSE 5173

# Run Vite and expose to host network
CMD ["npm", "run", "dev", "--", "--host"]
```

### File 3: `docker-compose.yml`
This file orchestrates both containers to run together and ensures the USB SDR device is passed through.

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: 
      context: .
      dockerfile: backend.Dockerfile
    ports:
      - "5000:5000"
    volumes:
      # Persist the database and captures so they aren't lost when container stops
      - ./captures:/app/captures
    devices:
      # ⚠️ CRITICAL: This allows the Docker container to access the physical RTL-SDR USB
      - "/dev/bus/usb:/dev/bus/usb"
    privileged: true

  frontend:
    build:
      context: .
      dockerfile: frontend.Dockerfile
    ports:
      - "5173:5173"
    depends_on:
      - backend
```

---

## 3. How to Run It Anywhere

Once you have those three files in your project root, follow these steps on **any laptop**:

### Step 1: Install Docker
Make sure [Docker Desktop](https://www.docker.com/products/docker-desktop) is installed and running on the laptop.

### Step 2: Build and Start
Open a terminal in the root directory and run:
```bash
docker-compose up --build
```
*Docker will now automatically download Python, Node.js, install PyTorch, install the SDR drivers, and boot up both servers.*

### Step 3: Access the App
Once the terminal says the servers are running, open a browser and go to:
**http://localhost:5173**

---

## ⚠️ Important Note About RTL-SDR on Docker for Windows/Mac
Docker runs inside a lightweight Linux virtual machine. 
* **Linux Hosts:** The `devices: ["/dev/bus/usb:/dev/bus/usb"]` rule works flawlessly out-of-the-box.
* **Windows/Mac Hosts:** Docker Desktop natively isolates USB ports. To allow the container to see the RTL-SDR dongle on Windows/Mac, you must use a tool like [usbipd-win](https://github.com/dorssel/usbipd-win) to attach the USB device to the WSL2 backend that Docker uses. 

### USB Passthrough for Windows (usbipd-win)
If you are running this Docker container on a Windows machine:
1. Open PowerShell as Administrator.
2. Install `usbipd`: `winget install usbipd`
3. List USB devices: `usbipd list`
4. Find the RTL-SDR (usually Bulk-In, Interface) and note its BUSID (e.g., `2-1`).
5. Attach it to Docker: `usbipd bind --busid 2-1` followed by `usbipd attach --wsl --busid 2-1`

The Docker backend will now have full access to the live RF signal!


to run docker server:

docker-compose up

to run in BG without terminal access opened:

docker-compose up -d
