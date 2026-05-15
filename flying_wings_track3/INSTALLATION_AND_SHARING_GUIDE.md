# Drone RF Detection - Complete Installation Guide

This guide explains how to install, configure, and run the Drone RF Detection project on a completely new Windows laptop. Since the project uses Docker, you do NOT need to install Node.js or Python manually!

## 1. Prerequisites
Before starting, ensure the new laptop has the following installed:
1. **[Git](https://git-scm.com/downloads)** (To download the code).
2. **[Docker Desktop](https://www.docker.com/products/docker-desktop)** (To run the application).
3. **An RTL-SDR Dongle** (Plugged into a USB port).

---

## 2. Download the Project
Open a terminal (PowerShell or Command Prompt) and run:
```bash
git clone https://github.com/Lejo-C/Fly_wings.git
cd Fly_wings/model/flying_wings_track3
```

---

## 3. Configure RTL-SDR USB Pass-through (Windows Only)
Docker Desktop on Windows isolates USB ports by default. To allow the Docker container to access the physical RTL-SDR hardware to scan the airwaves, you must install `usbipd-win`.

### Step 3A: Install `usbipd-win`
1. Open **PowerShell as Administrator**.
2. Run the following command to install the USB IP tool:
   ```powershell
   winget install usbipd
   ```
3. After installation completes, **close and reopen** the Administrator PowerShell window.

### Step 3B: Bind and Attach the SDR
1. Plug in your RTL-SDR USB dongle.
2. In your Administrator PowerShell, list all connected USB devices:
   ```powershell
   usbipd list
   ```
3. Look for your device (usually named something like `Realtek Semiconductor Corp., RTL2838 DVB-T` or `Bulk-In, Interface`). Note the **BUSID** next to it (for example, `2-1` or `1-9`).
4. Bind the device so it can be shared:
   ```powershell
   usbipd bind --busid <YOUR-BUSID>
   ```
   *(Replace `<YOUR-BUSID>` with the actual ID, e.g., `usbipd bind --busid 1-9`)*
5. Attach the device to Docker's internal WSL environment:
   ```powershell
   usbipd attach --wsl --busid <YOUR-BUSID>
   ```
> **Note:** You must run the `attach` command every time you unplug and re-plug the USB, or when you restart your computer!

---

## 4. Run the Project
With the USB securely attached to Docker, you can now start the entire project.

1. Open a terminal in the project folder (`flying_wings_track3`).
2. Run the following command:
   ```bash
   docker-compose up --build
   ```
   *(This will download Python, PyTorch, Node.js, and configure the Linux drivers automatically. It will take a few minutes the very first time).*

3. Once the terminal shows that both `frontend-1` and `backend-1` are ready, open your web browser and navigate to:
   👉 **http://localhost:5173**

---

## 5. Stopping the Server
To stop the application, simply press `Ctrl + C` in the terminal where it is running. 

Next time you want to run it, as long as you've attached the USB (`usbipd attach`), you can start it instantly without rebuilding by just typing:
```bash
docker-compose up
```
