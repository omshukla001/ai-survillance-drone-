#!/usr/bin/env python3
"""
Backend API server for the drone application.
Handles detections, drone status, and real-time updates.
"""

import json
import time
import random
import asyncio
import uvicorn
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional

app = FastAPI(title="Drone API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for detections
detections = []

# Mock drone status
drone_status = {
    "drone_1": {
        "id": "drone_1",
        "status": "online",
        "batteryLevel": 85,
        "lastLocation": {
            "latitude": 12.9716,
            "longitude": 77.5946,
            "altitude": 100.0
        },
        "speed": 8.5,
        "heading": 180,
        "lastSeen": datetime.utcnow().isoformat()
    },
    "drone_2": {
        "id": "drone_2",
        "status": "online",
        "batteryLevel": 65,
        "lastLocation": {
            "latitude": 12.9352,
            "longitude": 77.6245,
            "altitude": 80.0
        },
        "speed": 5.5,
        "heading": 90,
        "lastSeen": datetime.utcnow().isoformat()
    }
}

class Detection(BaseModel):
    latitude: float
    longitude: float
    count: int
    timestamp: Optional[str] = None
    accuracy: float = 0.0

@app.get("/")
async def root():
    return {"message": "Drone API Server is running"}

@app.get("/api/detections")
async def get_detections(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    min_people: Optional[int] = None,
    max_people: Optional[int] = None
):
    """Get all detections with optional filtering"""
    filtered = detections.copy()
    
    if from_date:
        from_dt = datetime.fromisoformat(from_date)
        filtered = [d for d in filtered if datetime.fromisoformat(d['timestamp']) >= from_dt]
    
    if to_date:
        to_dt = datetime.fromisoformat(to_date)
        filtered = [d for d in filtered if datetime.fromisoformat(d['timestamp']) <= to_dt]
    
    if min_people is not None:
        filtered = [d for d in filtered if d['count'] >= min_people]
    
    if max_people is not None:
        filtered = [d for d in filtered if d['count'] <= max_people]
    
    return filtered

@app.post("/api/detections")
async def create_detection(detection: Detection):
    """Create a new detection"""
    detection_dict = detection.dict()
    detection_dict['id'] = len(detections) + 1
    detection_dict['timestamp'] = detection_dict.get('timestamp') or datetime.utcnow().isoformat()
    detections.append(detection_dict)
    return detection_dict

@app.get("/api/drones/status")
async def get_drone_status():
    """Get current status of all drones"""
    # Update drone status with some random variations
    for drone in drone_status.values():
        # Randomly adjust battery level
        drone['batteryLevel'] = max(0, min(100, drone['batteryLevel'] + random.uniform(-2, 1)))
        
        # Update status based on battery
        if drone['batteryLevel'] < 20:
            drone['status'] = 'warning'
        elif drone['batteryLevel'] < 5:
            drone['status'] = 'offline'
        else:
            drone['status'] = 'online'
        
        # Update position slightly
        drone['lastLocation']['latitude'] += random.uniform(-0.001, 0.001)
        drone['lastLocation']['longitude'] += random.uniform(-0.001, 0.001)
        drone['lastSeen'] = datetime.utcnow().isoformat()
    
    return drone_status

async def event_generator():
    """Generate server-sent events with detection updates"""
    try:
        while True:
            # Send a keep-alive comment every 30 seconds
            yield ":keep-alive\n\n"
            
            # Check for new detections
            if detections:
                latest = detections[-1]
                yield f"event: detection\ndata: {json.dumps(latest)}\n\n"
            
            # Send drone status every 5 seconds
            status = await get_drone_status()
            yield f"event: drone_status\ndata: {json.dumps(status)}\n\n"
            
            await asyncio.sleep(5)
    except asyncio.CancelledError:
        print("Client disconnected from SSE stream")
    except Exception as e:
        print(f"Error in event generator: {e}")
        raise

@app.get("/api/stream")
async def stream():
    """Server-sent events stream for real-time updates"""
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )

if __name__ == "__main__":
    print("Starting API server on http://localhost:4000")
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=4000,
        reload=True,
        log_level="info"
    )
