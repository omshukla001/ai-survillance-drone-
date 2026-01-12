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
  timeRange: 'all' | '1h' | '24h' | '7d';
}

export interface DetectionStats {
  totalDetections: number;
  totalPeople: number;
  mostRecent: Date | null;
}
