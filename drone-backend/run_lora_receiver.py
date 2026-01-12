#!/usr/bin/env python3
import asyncio
import json
import serial
import websockets
import logging
from datetime import datetime
from typing import Set
from websockets.server import WebSocketServerProtocol

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lora_receiver")

# Store connected clients
connected: Set[WebSocketServerProtocol] = set()

async def broadcast_coordinates(data):
    """Broadcast coordinates to all connected clients."""
    if connected:
        message = json.dumps({
            'type': 'coordinates',
            'data': data
        })
        await asyncio.gather(
            *[client.send(message) for client in connected],
            return_exceptions=True
        )

async def register(websocket: WebSocketServerProtocol):
    """Register a WebSocket client connection."""
    connected.add(websocket)
    logger.info(f"New client connected. Total clients: {len(connected)}")
    try:
        await websocket.wait_closed()
    finally:
        connected.remove(websocket)
        logger.info(f"Client disconnected. Total clients: {len(connected)}")

# Configuration
SERIAL_PORT = "/dev/cu.usbserial-0001"  # Using the specified port
BAUD_RATE = 9600
WEBSOCKET_URI = "ws://localhost:8765"

print(f"[CONFIG] Using port: {SERIAL_PORT} @ {BAUD_RATE} baud")

def parse_lora_message(text):
    """Parse LORA message in format: CNT:x,LAT:y,LON:z"""
    try:
        if not text.startswith("CNT:"):
            return None
            
        data = {}
        for part in text.split(","):
            if ":" in part:
                k, v = part.split(":", 1)
                data[k] = v

        if 'LAT' in data and 'LON' in data:
            return {
                'latitude': float(data['LAT']),
                'longitude': float(data['LON']),
                'count': int(data.get('CNT', 0)),
                'timestamp': datetime.utcnow().isoformat(),
                'accuracy': 0
            }
    except Exception as e:
        print(f"Error parsing message: {e}")
    return None

async def handle_serial(ser):
    """Handle incoming serial data"""
    while True:
        line = ser.readline().decode('utf-8', errors='replace').strip()
        if line:
            print(f"[{datetime.now()}] RAW → {line}")
            data = parse_lora_message(line)
            if data:
                print(f"    👤 Humans : {data['count']}")
                print(f"    📍 GPS    : {data['latitude']}, {data['longitude']}")
                await broadcast_coordinates(data)
        await asyncio.sleep(0.1)  # Small delay to prevent busy-waiting

async def main():
    # Start WebSocket server
    server = await websockets.serve(
        register,
        '0.0.0.0',  # Listen on all interfaces
        8765,        # WebSocket port
        ping_interval=20,
        ping_timeout=20,
        close_timeout=10
    )
    print(f"✅ WebSocket server started on ws://0.0.0.0:8765")

    # Open serial connection
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        print(f"✅ LoRa receiver listening on {SERIAL_PORT} @ {BAUD_RATE}")
        
        # Run serial handler in the background
        serial_task = asyncio.create_task(handle_serial(ser))
        
        # Keep the server running
        await asyncio.Future()
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if 'ser' in locals() and ser.is_open:
            ser.close()
        if 'serial_task' in locals():
            serial_task.cancel()
        server.close()
        await server.wait_closed()
        print("✅ Cleanup complete")

if __name__ == "__main__":
    asyncio.run(main())
