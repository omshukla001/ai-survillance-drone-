import dotenv from 'dotenv';
import app from './app';
import prisma from './prisma/client';

dotenv.config();

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 Detections API: http://localhost:${PORT}/api/detections`);
  console.log(`🔄 SSE Stream: http://localhost:${PORT}/api/stream`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('✅ Server closed');
    process.exit(0);
  });
});
