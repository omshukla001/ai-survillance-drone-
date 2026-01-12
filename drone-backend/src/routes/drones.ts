import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get status of all drones
router.get('/status', async (req, res) => {
  try {
    // Get the most recent status for each drone
    const drones = await prisma.$queryRaw`
      WITH latest_status AS (
        SELECT 
          "droneId",
          MAX(timestamp) as latest_timestamp
        FROM "Detection"
        WHERE timestamp > NOW() - INTERVAL '5 minutes'
        GROUP BY "droneId"
      )
      SELECT 
        d.*,
        d.timestamp as last_updated
      FROM "Detection" d
      JOIN latest_status ls ON d."droneId" = ls."droneId" AND d.timestamp = ls.latest_timestamp
      ORDER BY d.timestamp DESC
    `;

    res.json(drones);
  } catch (error) {
    console.error('Error fetching drone status:', error);
    res.status(500).json({ error: 'Failed to fetch drone status' });
  }
});

export default router;
