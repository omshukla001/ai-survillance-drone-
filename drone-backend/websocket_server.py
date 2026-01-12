import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Set
import websockets
from websockets.server import WebSocketServerProtocol

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("websockets.server")
logger.setLevel(logging.INFO)

# Store connected clients
connected: Set[WebSocketServerProtocol] = set()

# Store the latest coordinates
latest_coordinates = {
    'latitude': None,
    'longitude': None,
    'timestamp': None,
    'accuracy': 0
}

async def broadcast_coordinates():
    """Broadcast latest coordinates to all connected clients."""
    if connected:
        message = json.dumps({
            'type': 'coordinates',
            'data': latest_coordinates
        })
        await asyncio.gather(
            *[client.send(message) for client in connected],
            return_exceptions=True
        )

async def register(websocket: WebSocketServerProtocol):
    """Register a WebSocket client connection."""
    connected.add(websocket)
    logger.info(f"New client connected. Total clients: {len(connected)}")
    
    # Send latest coordinates to newly connected client
    if latest_coordinates['latitude'] is not None:
        await websocket.send(json.dumps({
            'type': 'coordinates',
            'data': latest_coordinates
        }))
    
    try:
        await websocket.wait_closed()
    finally:
        connected.remove(websocket)
        logger.info(f"Client disconnected. Total clients: {len(connected)}")

async def update_coordinates(lat: float, lng: float, accuracy: float = 0):
    """Update coordinates and broadcast to all clients."""
    global latest_coordinates
    latest_coordinates = {
        'latitude': lat,
        'longitude': lng,
        'timestamp': datetime.utcnow().isoformat(),
        'accuracy': accuracy
    }
    await broadcast_coordinates()

async def start_websocket_server(host: str = '0.0.0.0', port: int = 8764):
    """Start the WebSocket server."""
    server = await websockets.serve(
        register,
        host,
        port,
        ping_interval=20,
        ping_timeout=20,
        close_timeout=10
    )
    logger.info(f"WebSocket server started on ws://{host}:{port}")
    return server

if __name__ == "__main__":
    # Example usage
    async def main():
        server = await start_websocket_server()
        
        # Keep the server running
        try:
            await asyncio.Future()
        except asyncio.CancelledError:
            server.close()
            await server.wait_closed()
    
    asyncio.run(main())
