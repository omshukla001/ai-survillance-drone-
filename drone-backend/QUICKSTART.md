# Quick Start Guide

Get the drone backend running in 5 minutes.

## Prerequisites
- Node.js v16+
- PostgreSQL running locally

## Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Database
```bash
createdb drone_db
```

### 3. Configure Environment
Update `.env` with your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/drone_db?schema=public"
```

### 4. Run Migrations
```bash
npm run prisma:migrate
```

Press Enter when prompted to create the initial migration.

### 5. Start Server
```bash
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:4000
```

## Test It

### Terminal 1: Start Mock Sender
```bash
npm run mock:send
```

### Terminal 2: Listen to SSE Stream
```bash
curl http://localhost:4000/api/stream
```

### Terminal 3: Query Detections
```bash
curl http://localhost:4000/api/detections
```

## Next Steps

- Read the full [README.md](./README.md) for detailed API documentation
- Check `src/` for the implementation
- Modify `.env` for production settings
- Connect your frontend to `http://localhost:4000`

## Troubleshooting

**"Cannot connect to database"**
```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Verify database exists
psql -l | grep drone_db
```

**"Port 4000 already in use"**
```bash
# Kill the process using port 4000
lsof -ti:4000 | xargs kill -9
```

**"Module not found" errors**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

Done! 🎉
