import prisma from '../prisma/client';
import { Detection } from '@prisma/client';

export interface CreateDetectionInput {
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  batteryLevel?: number;
  status?: string;
  peopleCount: number;
  timestamp: Date;
  source: string;
  droneId: string;
}

export interface DroneStatus {
  id: string;
  lastSeen: Date;
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

export interface GetDetectionsFilters {
  from?: Date;
  to?: Date;
  minPeople?: number;
  maxPeople?: number;
}

export class DetectionService {
  private droneStatus: Record<string, DroneStatus> = {
    drone_1: {
      id: 'drone_1',
      lastSeen: new Date(0),
      status: 'offline',
      batteryLevel: 0,
      lastLocation: { latitude: 0, longitude: 0, altitude: 0 },
      speed: 0,
      heading: 0
    },
    drone_2: {
      id: 'drone_2',
      lastSeen: new Date(0),
      status: 'offline',
      batteryLevel: 0,
      lastLocation: { latitude: 0, longitude: 0, altitude: 0 },
      speed: 0,
      heading: 0
    }
  };

  async createDetection(input: CreateDetectionInput): Promise<Detection> {
    // Update drone status
    if (input.droneId === 'drone_1' || input.droneId === 'drone_2') {
      this.droneStatus[input.droneId] = {
        ...this.droneStatus[input.droneId],
        lastSeen: new Date(),
        status: 'online',
        batteryLevel: input.batteryLevel ?? this.droneStatus[input.droneId]?.batteryLevel ?? 0,
        lastLocation: {
          latitude: input.latitude,
          longitude: input.longitude,
          altitude: input.altitude ?? this.droneStatus[input.droneId]?.lastLocation?.altitude ?? 0
        },
        speed: input.speed ?? this.droneStatus[input.droneId]?.speed ?? 0,
        heading: input.heading ?? this.droneStatus[input.droneId]?.heading ?? 0
      };
    }

    const AGGREGATION_WINDOW_SECONDS = 300; // 5 minutes
    const COORDINATE_PRECISION = 5; // Number of decimal places to match for lat/lon

    const now = new Date();
    const windowStart = new Date(now.getTime() - AGGREGATION_WINDOW_SECONDS * 1000);

    // Find a recent detection at nearly the same location
    const existingDetection = await prisma.detection.findFirst({
      where: {
        latitude: {
          gte: parseFloat(input.latitude.toFixed(COORDINATE_PRECISION)),
          lt: parseFloat((input.latitude + 0.00001).toFixed(COORDINATE_PRECISION))
        },
        longitude: {
          gte: parseFloat(input.longitude.toFixed(COORDINATE_PRECISION)),
          lt: parseFloat((input.longitude + 0.00001).toFixed(COORDINATE_PRECISION))
        },
        droneId: input.droneId,
        timestamp: {
          gte: windowStart,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    if (existingDetection) {
      // Update the existing detection with the new people count and latest telemetry
      return prisma.detection.update({
        where: {
          id: existingDetection.id,
        },
        data: {
          peopleCount: existingDetection.peopleCount + input.peopleCount,
          timestamp: now, // Refresh the timestamp
          batteryLevel: input.batteryLevel,
          status: input.status,
          speed: input.speed,
          heading: input.heading,
        },
      });
    } else {
      // Create a new detection record
      return prisma.detection.create({
        data: {
          latitude: input.latitude,
          longitude: input.longitude,
          altitude: input.altitude,
          speed: input.speed,
          heading: input.heading,
          batteryLevel: input.batteryLevel,
          status: input.status,
          peopleCount: input.peopleCount,
          timestamp: input.timestamp,
          source: input.source,
          droneId: input.droneId,
        },
      });
    }
  }

  getDroneStatus(droneId: string): DroneStatus | null {
    return this.droneStatus[droneId] || null;
  }

  getAllDronesStatus(): Record<string, DroneStatus> {
    // Update status based on last seen time
    const now = new Date();
    Object.values(this.droneStatus).forEach(drone => {
      const secondsSinceLastSeen = (now.getTime() - drone.lastSeen.getTime()) / 1000;
      if (secondsSinceLastSeen > 5) { // 5 seconds threshold for offline
        drone.status = 'offline';
      } else if (secondsSinceLastSeen > 2) { // 2 seconds threshold for warning
        drone.status = 'warning';
      }
    });
    
    return { ...this.droneStatus };
  }

  async getDetections(filters: GetDetectionsFilters): Promise<Detection[]> {
    const where: any = {};

    if (filters.from) {
      where.timestamp = { ...where.timestamp, gte: filters.from };
    }

    if (filters.to) {
      where.timestamp = { ...where.timestamp, lte: filters.to };
    }

    if (filters.minPeople !== undefined) {
      where.peopleCount = { ...where.peopleCount, gte: filters.minPeople };
    }

    if (filters.maxPeople !== undefined) {
      where.peopleCount = { ...where.peopleCount, lte: filters.maxPeople };
    }

    return prisma.detection.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  async clearDetections(): Promise<void> {
    await prisma.detection.deleteMany();
  }
}

export const detectionService = new DetectionService();
