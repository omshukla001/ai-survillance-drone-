# AI Surveillance Drone 🛸

<p align="center">
  <img src="./DRONE/WhatsApp%20Image%202026-06-27%20at%2010.57.52%20AM.jpeg" alt="Drone Image" width="600"/>
</p>

An end-to-end drone surveillance system featuring a real-time web frontend and an API backend, designed to track drone detections and stream data. 

## 📁 Project Structure

```text
ai-survillance-drone-
├── drone-backend/        # Backend server and data processing
│   ├── api_server.py     # FastAPI backend API
│   ├── websocket_server.py # Real-time streaming WebSocket server
│   ├── lora_receiver_simple.py # Scripts for LoRa hardware communication
│   ├── requirements.txt  # Python dependencies
│   ├── prisma/           # Database schema and ORM setup
│   ├── src/              # Additional backend source code
│   └── scripts/          # Helper and mock scripts
├── drone-frontend/       # Interactive Web UI (React + TypeScript)
│   ├── package.json      # Node.js dependencies
│   ├── public/           # Static assets
│   ├── src/              # React frontend source code (components, hooks, pages)
│   └── bun.lock          # Package lockfile
├── DRONE/                # Drone Media Assets
│   ├── Videos            # Real footage of the drone prototype in action
│   └── Images            # Images of the drone
├── requirements.txt      # Root level requirements
└── README.md             # This file
```

## 🚀 Features

* **Real-Time Data Streaming:** Uses WebSockets to relay live drone data to the dashboard.
* **Interactive Map Dashboard:** Built with React and Leaflet for geospatial tracking of the drone's position and detection events.
* **Hardware Integration:** Includes Python scripts for LoRa receivers to communicate with the physical drone over radio frequencies.
* **Modern UI:** Responsive, map-based interface built with React, `framer-motion`, and `lucide-react`.

## 🛠️ Tech Stack

* **Programming & AI:** Python, OpenCV, YOLOv8 (Computer Vision), NumPy
* **Drone & Embedded Systems:** Raspberry Pi 4, Pixhawk 2.4.8 / APM 2.5, Servo Motor Control
* **Flight Control & Communication:** MAVLink, ArduPilot, Mission Planner, Telemetry, LoRa Communication
* **Sensors & Hardware:** GPS Module, Camera Module, LiPo Battery Management, ESC + BLDC Motors
* **Core Concepts:** Autonomous Navigation, Human Detection, Real-Time Surveillance, Payload Delivery System, Disaster Response Automation

## 📄 Resume Project Entry (Recommended)

**Autonomous Dual Drone System for Disaster Management**

**Tech Stack:** Python, OpenCV, YOLOv8, Raspberry Pi, Pixhawk/APM, ArduPilot, MAVLink, Mission Planner, GPS, LoRa

- Built an AI-powered autonomous dual-drone system for disaster management with separate scout and delivery drones.
- Implemented real-time AI-based human detection using an onboard camera and YOLOv8 for victim identification.
- Integrated GPS and telemetry to transmit real-time victim coordinates to the Ground Control Station via LoRa and MAVLink.
- Developed a servo-based payload delivery mechanism for automated food and medical supply drops.

## 🔧 Getting Started

### 1. Running the Backend
1. Navigate to the `drone-backend/` directory.
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the API Server / WebSocket server as instructed in `drone-backend/QUICKSTART.md`.

### 2. Running the Frontend
1. Navigate to the `drone-frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
4. Access the dashboard at `http://localhost:3000`.

## 📷 Media

The `DRONE/` directory contains footage and photos of the surveillance drone prototype in action.
