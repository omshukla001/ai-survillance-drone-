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

* **Frontend:** React, TypeScript, Leaflet (react-leaflet), Framer Motion, Lucide React
* **Backend:** Python (FastAPI, WebSockets, PySerial) & Node.js (Prisma ORM)
* **Hardware Communication:** LoRa Modules via Serial (PySerial)
* **Database:** PostgreSQL (managed via Prisma)

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
