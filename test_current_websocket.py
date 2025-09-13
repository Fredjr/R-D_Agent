#!/usr/bin/env python3
"""
Test current WebSocket functionality on deployed backend
"""
import asyncio
import websockets
import json

async def test_current_websocket():
    """Test current WebSocket implementation"""
    project_id = "test-project-current"
    uri = f"wss://r-dagent-production.up.railway.app/ws/project/{project_id}"
    
    print(f"🔌 Testing current WebSocket: {uri}")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected!")
            
            # Send simple message (current implementation expects text)
            test_message = "Hello WebSocket!"
            print(f"📤 Sending: {test_message}")
            await websocket.send(test_message)
            
            # Wait for echo response
            response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
            print(f"📥 Received: {response}")
            
            # Test another message
            test_message2 = "Testing broadcast"
            print(f"📤 Sending: {test_message2}")
            await websocket.send(test_message2)
            
            response2 = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            print(f"📥 Received: {response2}")
            
            print("✅ Current WebSocket is working!")
            return True
            
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_current_websocket())
    if success:
        print("🎉 WebSocket infrastructure is functional!")
    else:
        print("⚠️ WebSocket needs fixes")
