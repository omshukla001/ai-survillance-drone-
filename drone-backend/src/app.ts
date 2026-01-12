import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import detectionsRouter from './routes/detections';
import dronesRouter from './routes/drones';

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:4000'],
  credentials: true,
}));

app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/detections', detectionsRouter);
app.use('/api/drones', dronesRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
