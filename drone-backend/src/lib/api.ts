/**
 * API Integration Layer
 * This file contains helper functions for frontend integration
 * Copy this to your frontend project at: src/lib/api.ts
 */

import { Detection } from './types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

/**
 * Fetch all detections from the backend
 */
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

/**
 * Create a new detection
 */
export async function createDetection(detection: Omit<Detection, 'id' | 'createdAt'>): Promise<Detection | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/detections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

/**
 * Connect to the SSE stream for real-time updates
 * Returns an EventSource object or null if connection fails
 */
export function connectToStream(onDetection: (detection: Detection) => void): EventSource | null {
  try {
    const eventSource = new EventSource(`${API_BASE_URL}/api/stream`);

    eventSource.addEventListener('connected', (event) => {
      console.log('Connected to detection stream');
    });

    eventSource.addEventListener('new_detection', (event) => {
      try {
        const detection = JSON.parse(event.data);
        onDetection(detection);
      } catch (error) {
        console.error('Error parsing detection data:', error);
      }
    });

    eventSource.addEventListener('error', (event) => {
      console.error('Stream error:', event);
      eventSource.close();
    });

    return eventSource;
  } catch (error) {
    console.error('Error connecting to stream:', error);
    return null;
  }
}

/**
 * Mock stream for testing (when backend is not available)
 * Generates random detections
 */
export function startMockStream(
  onDetection: (detection: Detection) => void,
  intervalMs: number = 5000
): () => void {
  let id = 1;
  const droneLocations = [
    { latitude: 12.9716, longitude: 77.5946, source: 'drone_1' },
    { latitude: 12.9352, longitude: 77.6245, source: 'drone_2' },
    { latitude: 13.0827, longitude: 80.2707, source: 'drone_3' },
  ];

  const interval = setInterval(() => {
    const location = droneLocations[Math.floor(Math.random() * droneLocations.length)];
    const detection: Detection = {
      id: id++,
      latitude: location.latitude + (Math.random() - 0.5) * 0.01,
      longitude: location.longitude + (Math.random() - 0.5) * 0.01,
      peopleCount: Math.floor(Math.random() * 50) + 1,
      timestamp: new Date().toISOString(),
      source: location.source,
      createdAt: new Date().toISOString(),
    };
    onDetection(detection);
  }, intervalMs);

  return () => clearInterval(interval);
}
