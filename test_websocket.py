#!/usr/bin/env python3
"""
Simple WebSocket test client to verify real-time functionality
"""
import asyncio
import websockets
import json

async def test_websocket(project_id):
    uri = f"ws://127.0.0.1:8000/ws/project/{project_id}"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WebSocket")
            
            # Send a test message
            test_message = "Hello from test client!"
            await websocket.send(test_message)
            print(f"Sent: {test_message}")
            
            # Wait for response
            response = await websocket.recv()
            print(f"Received: {response}")
            
            # Keep connection alive for a bit to test broadcasts
            print("Waiting for broadcasts... (Press Ctrl+C to exit)")
            while True:
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                    print(f"Broadcast received: {message}")
                except asyncio.TimeoutError:
                    # Send periodic ping to keep connection alive
                    await websocket.send("ping")
                    
    except Exception as e:
        print(f"Connection failed: {e}")
        print("Make sure the backend server is running on localhost:8000")

if __name__ == "__main__":
    asyncio.run(test_websocket("test-project-123"))
