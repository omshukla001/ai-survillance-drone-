import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { detectionService } from '../services/detectionService';

const router = Router();

// Store connected SSE clients
const sseClients: Set<Response> = new Set();

// Validation schema for POST /api/detections
const CreateDetectionSchema = z.object({
  latitude: z.number().finite(),
  longitude: z.number().finite(),
  altitude: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  batteryLevel: z.number().int().min(0).max(100).optional(),
  status: z.string().optional(),
  peopleCount: z.number().int().nonnegative(),
  timestamp: z.string().datetime(),
  source: z.string().min(1),
  droneId: z.enum(['drone_1', 'drone_2']).default('drone_1'),
});

type CreateDetectionRequest = z.infer<typeof CreateDetectionSchema>;

/**
 * POST /api/detections
 * Create a new detection record
 */
router.post('/detections', async (req: Request, res: Response) => {
  try {
    const parsed = CreateDetectionSchema.safeParse(req.body);

    if (!parsed.success) {
      console.log('Validation error:', parsed.error.errors);
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.errors,
      });
    }

    const data: CreateDetectionRequest = parsed.data;

    const detection = await detectionService.createDetection({
      latitude: data.latitude,
      longitude: data.longitude,
      altitude: data.altitude,
      speed: data.speed,
      heading: data.heading,
      batteryLevel: data.batteryLevel,
      status: data.status,
      peopleCount: data.peopleCount,
      timestamp: new Date(data.timestamp),
      source: data.source,
      droneId: data.droneId,
    });

    console.log(`[POST /api/detections] Created detection: ${detection.id}`);

    // Notify all connected SSE clients
    broadcastToSSEClients(detection);

    res.status(201).json(detection);
  } catch (error) {
    console.error('[POST /api/detections] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/detections
 * Retrieve detections with optional filters
 * Query params: from, to, minPeople, maxPeople
 */
router.get('/detections', async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    if (req.query.from) {
      const fromDate = new Date(req.query.from as string);
      if (isNaN(fromDate.getTime())) {
        return res.status(400).json({ error: 'Invalid "from" date format' });
      }
      filters.from = fromDate;
    }

    if (req.query.to) {
      const toDate = new Date(req.query.to as string);
      if (isNaN(toDate.getTime())) {
        return res.status(400).json({ error: 'Invalid "to" date format' });
      }
      filters.to = toDate;
    }

    if (req.query.minPeople) {
      const minPeople = parseInt(req.query.minPeople as string, 10);
      if (isNaN(minPeople)) {
        return res.status(400).json({ error: 'Invalid "minPeople" format' });
      }
      filters.minPeople = minPeople;
    }

    if (req.query.maxPeople) {
      const maxPeople = parseInt(req.query.maxPeople as string, 10);
      if (isNaN(maxPeople)) {
        return res.status(400).json({ error: 'Invalid "maxPeople" format' });
      }
      filters.maxPeople = maxPeople;
    }

    const detections = await detectionService.getDetections(filters);

    console.log(`[GET /api/detections] Retrieved ${detections.length} detections`);

    res.json(detections);
  } catch (error) {
    console.error('[GET /api/detections] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/detections
 * Clear all detection records
 */
router.delete('/detections', async (req: Request, res: Response) => {
  try {
    await detectionService.clearDetections();
    console.log('[DELETE /api/detections] Cleared all detections');
    res.status(204).send();
  } catch (error) {
    console.error('[DELETE /api/detections] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/stream
 * Server-Sent Events endpoint for real-time detection updates
 */
router.get('/stream', (req: Request, res: Response) => {
  console.log('[GET /api/stream] New SSE client connected');

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Add client to the set
  sseClients.add(res);

  // Send initial connection message
  res.write('event: connected\ndata: {"message":"Connected to detection stream"}\n\n');

  // Handle client disconnect
  req.on('close', () => {
    console.log('[GET /api/stream] SSE client disconnected');
    sseClients.delete(res);
    res.end();
  });

  req.on('error', () => {
    console.log('[GET /api/stream] SSE client error');
    sseClients.delete(res);
    res.end();
  });
});

/**
 * Broadcast a new detection to all connected SSE clients (optimized for low latency)
 */
function broadcastToSSEClients(detection: any): void {
  const startTime = Date.now();
  const message = `event: new_detection\ndata: ${JSON.stringify(detection)}\n\n`;
  let successCount = 0;
  let failCount = 0;

  sseClients.forEach((client) => {
    try {
      client.write(message);
      successCount++;
    } catch (error) {
      console.error('[SSE] Error writing to client:', error);
      sseClients.delete(client);
      failCount++;
    }
  });

  const latency = Date.now() - startTime;
  console.log(`[SSE] Broadcasted to ${successCount} clients in ${latency}ms (${failCount} failed)`);
}

export default router;
