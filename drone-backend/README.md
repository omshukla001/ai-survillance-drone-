# Drone Monitoring Backend API

A complete backend API for a drone monitoring system built with Node.js, TypeScript, Express, and PostgreSQL.

## Features

- ✅ RESTful API for drone detection records
- ✅ Real-time updates via Server-Sent Events (SSE)
- ✅ PostgreSQL database with Prisma ORM
- ✅ Input validation with Zod
- ✅ CORS enabled for frontend integration
- ✅ TypeScript for type safety
- ✅ Mock data sender for testing

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v12 or higher)

## Installation

### 1. Clone and Install Dependencies

```bash
cd drone-backend
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root:

```env
PORT=4000
DATABASE_URL="postgresql://user:password@localhost:5432/drone_db?schema=public"
NODE_ENV=development
```

**Replace `user` and `password` with your PostgreSQL credentials.**

### 3. Create PostgreSQL Database

```bash
createdb drone_db
```

### 4. Run Prisma Migrations

```bash
npm run prisma:migrate
```

This will:
- Create the `Detection` table
- Set up indexes on `timestamp` and `source`
- Generate the Prisma client

### 5. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:4000`

```
🚀 Server running on http://localhost:4000
📊 Health check: http://localhost:4000/health
📡 Detections API: http://localhost:4000/api/detections
🔄 SSE Stream: http://localhost:4000/api/stream
```

## API Endpoints

### 1. POST /api/detections

Create a new detection record.

**Request:**
```bash
curl -X POST http://localhost:4000/api/detections \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 12.9716,
    "longitude": 77.5946,
    "peopleCount": 5,
    "timestamp": "2025-01-01T10:00:00.000Z",
    "source": "drone_1"
  }'
```

**Response (201 Created):**
```json
{
  "id": 1,
  "latitude": 12.9716,
  "longitude": 77.5946,
  "peopleCount": 5,
  "timestamp": "2025-01-01T10:00:00.000Z",
  "source": "drone_1",
  "createdAt": "2025-01-01T10:00:00.000Z"
}
```

**Validation Errors (400):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_type",
      "expected": "number",
      "received": "string",
      "path": ["latitude"],
      "message": "Expected number, received string"
    }
  ]
}
```

### 2. GET /api/detections

Retrieve detections with optional filters.

**Query Parameters:**
- `from` (ISO timestamp) - Filter detections from this date onwards
- `to` (ISO timestamp) - Filter detections up to this date
- `minPeople` (integer) - Minimum people count
- `maxPeople` (integer) - Maximum people count

**Examples:**

Get all detections:
```bash
curl http://localhost:4000/api/detections
```

Get detections from a specific date range:
```bash
curl "http://localhost:4000/api/detections?from=2025-01-01T00:00:00Z&to=2025-01-02T00:00:00Z"
```

Get detections with 5-10 people:
```bash
curl "http://localhost:4000/api/detections?minPeople=5&maxPeople=10"
```

Combine filters:
```bash
curl "http://localhost:4000/api/detections?from=2025-01-01T00:00:00Z&minPeople=3&maxPeople=20"
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "latitude": 12.9716,
    "longitude": 77.5946,
    "peopleCount": 5,
    "timestamp": "2025-01-01T10:00:00.000Z",
    "source": "drone_1",
    "createdAt": "2025-01-01T10:00:00.000Z"
  },
  {
    "id": 2,
    "latitude": 12.9352,
    "longitude": 77.6245,
    "peopleCount": 8,
    "timestamp": "2025-01-01T10:05:00.000Z",
    "source": "drone_2",
    "createdAt": "2025-01-01T10:05:00.000Z"
  }
]
```

### 3. GET /api/stream

Real-time Server-Sent Events endpoint for detection updates.

**How it works:**
1. Client connects to `/api/stream`
2. Server sends `connected` event
3. Whenever a new detection is created via POST, all connected clients receive a `new_detection` event
4. Connection stays open until client disconnects

**Example with curl:**
```bash
curl http://localhost:4000/api/stream
```

**Example with JavaScript:**
```javascript
const eventSource = new EventSource('http://localhost:4000/api/stream');

eventSource.addEventListener('connected', (event) => {
  console.log('Connected to stream:', JSON.parse(event.data));
});

eventSource.addEventListener('new_detection', (event) => {
  const detection = JSON.parse(event.data);
  console.log('New detection:', detection);
});

eventSource.addEventListener('error', (event) => {
  console.error('Stream error:', event);
  eventSource.close();
});
```

## Testing with Mock Sender

The project includes a mock sender script that generates random detections every 5 seconds.

### Start the Mock Sender

In a separate terminal:
```bash
npm run mock:send
```

This will:
- Send random detections from 3 simulated drones
- Log each request and response
- Help you test the entire pipeline

**Output:**
```
🚀 Mock Detection Sender Started
📍 Target: http://localhost:4000/api/detections
Sending random detections every 5 seconds...

📤 Sending detection: {
  latitude: 12.975,
  longitude: 77.591,
  peopleCount: 23,
  timestamp: '2025-01-01T10:00:00.000Z',
  source: 'drone_1'
}
✅ Response (201): { id: 1, ... }
```

## Database Schema

### Detection Table

```sql
CREATE TABLE "Detection" (
  id SERIAL PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  "peopleCount" INTEGER NOT NULL,
  timestamp TIMESTAMP(3) NOT NULL,
  source VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_timestamp (timestamp),
  INDEX idx_source (source)
);
```

## Project Structure

```
drone-backend/
├── src/
│   ├── index.ts              # Server bootstrap
│   ├── app.ts                # Express app configuration
│   ├── routes/
│   │   └── detections.ts     # Detection routes & SSE
│   ├── services/
│   │   └── detectionService.ts  # Business logic
│   └── prisma/
│       └── client.ts         # Prisma client
├── prisma/
│   └── schema.prisma         # Database schema
├── scripts/
│   └── mockSender.ts         # Mock data generator
├── package.json
├── tsconfig.json
├── .env
└── README.md
```

## Available npm Scripts

```bash
npm run dev              # Start dev server with hot reload
npm run build           # Compile TypeScript to JavaScript
npm run start           # Run compiled server
npm run prisma:migrate  # Run database migrations
npm run prisma:generate # Generate Prisma client
npm run mock:send       # Start mock detection sender
```

## Error Handling

The API returns appropriate HTTP status codes:

- **200 OK** - Successful GET request
- **201 Created** - Successful POST request
- **400 Bad Request** - Validation error or invalid query parameters
- **404 Not Found** - Endpoint not found
- **500 Internal Server Error** - Server error

All error responses include a JSON body with an `error` field.

## CORS Configuration

The server is configured to accept requests from:
- `http://localhost:3000` (Next.js frontend)
- `http://localhost:4000` (Same origin)

To add more origins, edit `src/app.ts`:

```typescript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:4000', 'https://yourdomain.com'],
  credentials: true,
}));
```

## Logging

The server logs:
- Incoming requests with timestamp and method
- Detection creation with ID
- SSE client connections and disconnections
- Errors with full stack traces

Example logs:
```
[2025-01-01T10:00:00.000Z] POST /api/detections
[POST /api/detections] Created detection: 1
[SSE] Broadcasted detection to 2 clients
[GET /api/stream] New SSE client connected
```

## Development Tips

### Reset Database

```bash
npx prisma migrate reset
```

### View Database

```bash
npx prisma studio
```

Opens an interactive database browser at `http://localhost:5555`

### Debug Mode

Set `DEBUG=*` before running:
```bash
DEBUG=* npm run dev
```

## Troubleshooting

### "Cannot connect to database"
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify database exists: `psql -l`

### "Port 4000 already in use"
- Change `PORT` in `.env`
- Or kill the process: `lsof -ti:4000 | xargs kill -9`

### "Prisma client not generated"
- Run: `npm run prisma:generate`

## Production Deployment

For production:

1. Build the project:
   ```bash
   npm run build
   ```

2. Set environment variables on your server

3. Run migrations:
   ```bash
   npm run prisma:migrate
   ```

4. Start the server:
   ```bash
   npm run start
   ```

## Frontend Integration

The backend provides a complete API for your React frontend. See [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) for detailed integration instructions.

### Quick Integration Steps

1. Copy API files to your frontend:
   ```bash
   cp src/lib/api.ts your-frontend/src/lib/
   cp src/lib/types.ts your-frontend/src/lib/
   cp src/lib/utils.ts your-frontend/src/lib/
   ```

2. Add to your frontend `.env`:
   ```env
   REACT_APP_API_URL=http://localhost:4000
   ```

3. Use in your components:
   ```typescript
   import { fetchDetections, connectToStream } from '@/lib/api';
   import { Detection } from '@/lib/types';
   ```

See [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) for complete examples and troubleshooting.

## License

ISC
