#!/usr/bin/env node
/**
 * loraReceiver.ts
 * LoRa serial receiver that parses data and sends to backend API
 * 
 * Usage: ts-node scripts/loraReceiver.ts
 * 
 * This script:
 * 1. Simulates two drones with random movement and people detection
 * 2. Sends to backend API via POST /api/detections
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:4000/api/detections';

interface DroneTelemetry {
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  batteryLevel: number;
  status: 'flying' | 'idle' | 'returning';
  peopleCount: number;
  droneId: 'drone_1' | 'drone_2';
}

async function sendDetection(telemetry: DroneTelemetry) {
  try {
    const payload = {
      ...telemetry,
      timestamp: new Date().toISOString(),
      source: 'lora_simulation',
    };
    await axios.post(API_URL, payload);
    console.log(`Sent detection for ${telemetry.droneId} at ${telemetry.latitude.toFixed(4)}, ${telemetry.longitude.toFixed(4)}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error sending detection for ${telemetry.droneId}:`, errorMessage);
  }
}

function simulateDrone(droneId: 'drone_1' | 'drone_2') {
  // Start at different points near Bangalore
  let lat = droneId === 'drone_1' ? 12.9716 : 12.9816;
  let lon = droneId === 'drone_1' ? 77.5946 : 77.6046;

  setInterval(() => {
    // Simulate more realistic movement
    lat += (Math.random() - 0.5) * 0.0005;
    lon += (Math.random() - 0.5) * 0.0005;

    const telemetry: DroneTelemetry = {
      latitude: lat,
      longitude: lon,
      altitude: 50 + (Math.random() - 0.5) * 10, // 45-55m
      speed: 15 + (Math.random() - 0.5) * 5, // 12.5-17.5 m/s
      heading: Math.random() * 360,
      batteryLevel: 85 - Math.floor(Math.random() * 10), // 75-85%
      status: 'flying',
      peopleCount: Math.floor(Math.random() * 5), // 0-4 people detected
      droneId: droneId,
    };

    sendDetection(telemetry);
  }, 1000); // Update every second
}

function main() {
  console.log('Starting drone simulation for drone_1 and drone_2...');
  simulateDrone('drone_1');
  simulateDrone('drone_2');
}

main();
