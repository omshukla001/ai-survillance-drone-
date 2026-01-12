/**
 * API Integration Layer
 * Functions for communicating with the backend
 */

import { Detection, DroneStatusData } from './types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export async function fetchDetections(filters?: {
  from?: string;
  to?: string;
  minPeople?: number;
  maxPeople?: number;
}): Promise<Detection[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.minPeople !== undefined) params.append('minPeople', String(filters.minPeople));
    if (filters?.maxPeople !== undefined) params.append('maxPeople', String(filters.maxPeople));

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/detections${query}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch detections: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching detections:', error);
    return [];
  }
}

// Mock drone status data
const mockDroneStatus: Record<string, DroneStatusData> = {
  drone_1: {
    id: 'drone_1',
    lastSeen: new Date().toISOString(),
    status: 'online',
    batteryLevel: Math.floor(Math.random() * 30) + 70, // 70-100%
    lastLocation: {
      latitude: 12.9716 + (Math.random() - 0.5) * 0.1,
      longitude: 77.5946 + (Math.random() - 0.5) * 0.1,
      altitude: Math.floor(Math.random() * 100) + 50 // 50-150m
    },
    speed: Math.random() * 10 + 5, // 5-15 m/s
    heading: Math.floor(Math.random() * 360) // 0-359 degrees
  },
  drone_2: {
    id: 'drone_2',
    lastSeen: new Date().toISOString(),
    status: 'online',
    batteryLevel: Math.floor(Math.random() * 50) + 50, // 50-100%
    lastLocation: {
      latitude: 12.9352 + (Math.random() - 0.5) * 0.1,
      longitude: 77.6245 + (Math.random() - 0.5) * 0.1,
      altitude: Math.floor(Math.random() * 100) + 30 // 30-130m
    },
    speed: Math.random() * 8 + 3, // 3-11 m/s
    heading: Math.floor(Math.random() * 360) // 0-359 degrees
  }
};

export async function fetchDroneStatus(): Promise<Record<string, DroneStatusData>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/drones/status`);
    if (!response.ok) {
      throw new Error(`Failed to fetch drone status: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.log('Using mock drone status data');
    // Update the mock data with new random values
    Object.values(mockDroneStatus).forEach(drone => {
      drone.batteryLevel = Math.max(0, drone.batteryLevel - 1);
      if (drone.batteryLevel < 20) {
        drone.status = 'warning';
      } else if (drone.batteryLevel < 5) {
        drone.status = 'offline';
      }
      drone.lastLocation.latitude += (Math.random() - 0.5) * 0.001;
      drone.lastLocation.longitude += (Math.random() - 0.5) * 0.001;
      drone.lastSeen = new Date().toISOString();
    });
    return mockDroneStatus;
  }
}

export async function createDetection(detection: Omit<Detection, 'id' | 'createdAt'>): Promise<Detection | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/detections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(detection),
    });

    if (!response.ok) {
      throw new Error(`Failed to create detection: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating detection:', error);
    return null;
  }
}

export function connectToStream(onDetection: (detection: Detection) => void): WebSocket | null {
  try {
    const wsUrl = 'ws://localhost:8765';
    console.log(`[WebSocket] Connecting to ${wsUrl}...`);
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('[WebSocket] Connected successfully');
    };
    
    ws.onmessage = (event) => {
      try {
        console.log('[WebSocket] Message received:', event.data);
        const message = JSON.parse(event.data);
        
        if (message.type === 'coordinates' && message.data) {
          console.log('[WebSocket] Processing coordinates:', message.data);
          
          // Transform the data to match the Detection type
          const detection: Detection = {
            id: Date.now(),
            latitude: parseFloat(message.data.latitude),
            longitude: parseFloat(message.data.longitude),
            peopleCount: parseInt(message.data.count || '1', 10),
            timestamp: message.data.timestamp || new Date().toISOString(),
            source: 'lora',
            createdAt: new Date().toISOString(),
          };
          
          console.log('[WebSocket] Emitting detection:', detection);
          onDetection(detection);
        } else {
          console.log('[WebSocket] Unknown message type or missing data:', message);
        }
      } catch (error) {
        console.error('[WebSocket] Error processing message:', error, 'Raw data:', event.data);
      }
    };
    
    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
    };
    
    ws.onclose = (event) => {
      console.log(`[WebSocket] Connection closed. Code: ${event.code}, Reason: ${event.reason}`);
    };
    
    return ws;
  } catch (error) {
    console.error('Error connecting to WebSocket:', error);
    return null;
  }
}

export function startMockStream(onDetection: (detection: Detection) => void, intervalMs: number = 5000): () => void {
  let id = 1;
  const droneLocations = [
    { latitude: 12.9716, longitude: 77.5946, source: 'drone_1' },
    { latitude: 12.9352, longitude: 77.6245, source: 'drone_2' },
  ];

  const interval = setInterval(() => {
    const location = droneLocations[Math.floor(Math.random() * droneLocations.length)];
    const detection: Detection = {
      id: id++,
      latitude: location.latitude + (Math.random() - 0.5) * 0.01,
      longitude: location.longitude + (Math.random() - 0.5) * 0.01,
      peopleCount: Math.floor(Math.random() * 10) + 1,
      timestamp: new Date().toISOString(),
      source: location.source,
      createdAt: new Date().toISOString(),
    };
    onDetection(detection);
  }, intervalMs);

  return () => clearInterval(interval);
}

export async function clearDetections(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/detections`, { method: 'DELETE' });
    if (!response.ok) {
      console.error('Failed to clear detections:', response.status, response.statusText);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error clearing detections:', error);
    return false;
  }
}

// Video Stream URL configuration
let videoStreamUrl = 'http://localhost:8000/stream/drone_1';

export const setVideoStreamUrl = (url: string) => {
  videoStreamUrl = url;
};

export const getVideoStreamUrl = () => {
  return videoStreamUrl;
};
