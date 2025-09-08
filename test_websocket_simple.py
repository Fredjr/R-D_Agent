#!/usr/bin/env python3
"""
Simple WebSocket client to test the minimal backend
"""
import asyncio
import websockets
import json

async def test_websocket():
    project_id = "test-project-123"
    uri = f"ws://127.0.0.1:8001/ws/project/{project_id}"
    
    try:
        print(f"Connecting to {uri}...")
        async with websockets.connect(uri) as websocket:
            print("✅ Connected successfully!")
            
            # Send a test message
            test_message = "Hello WebSocket!"
            print(f"📤 Sending: {test_message}")
            await websocket.send(test_message)
            
            # Wait for echo response
            response = await websocket.recv()
            print(f"📥 Received: {response}")
            
            # Send another message to test broadcasting
            test_message2 = "Testing broadcast functionality"
            print(f"📤 Sending: {test_message2}")
            await websocket.send(test_message2)
            
            # Wait for responses
            response2 = await websocket.recv()
            print(f"📥 Received: {response2}")
            
            # Try to receive broadcast message
            try:
                broadcast = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                print(f"📡 Broadcast received: {broadcast}")
            except asyncio.TimeoutError:
                print("⏰ No broadcast message received (timeout)")
            
            print("✅ WebSocket test completed successfully!")
            
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())
