/**
 * Shared Types
 * Use this in both frontend and backend
 */

export interface Detection {
  id: number;
  latitude: number;
  longitude: number;
  peopleCount: number;
  timestamp: string; // ISO 8601 format
  source: string;
  createdAt: string; // ISO 8601 format
}

export interface FilterState {
  minPeopleCount: number;
  timeRange: TimeRange;
}

export type TimeRange = '10min' | '1hr' | '24hr' | 'all';

export interface DetectionStats {
  totalDetections: number;
  totalPeople: number;
  mostRecent: Date | null;
}

export interface DroneStatusData {
  id: string;
  lastSeen: string;
  status: 'online' | 'offline' | 'warning';
  batteryLevel: number;
  lastLocation: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
  speed: number;
  heading: number;
}

export interface CoordinateData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string; // ISO 8601 format
}
