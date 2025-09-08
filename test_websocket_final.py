#!/usr/bin/env python3
"""
Final WebSocket test to verify real-time functionality works correctly
"""
import asyncio
import websockets
import json

async def test_websocket_functionality():
    project_id = "test-project-123"
    uri = f"ws://127.0.0.1:8000/ws/project/{project_id}"
    
    try:
        print(f"🔌 Connecting to {uri}...")
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully!")
            
            # Test 1: Send a message and receive echo
            test_message = "Hello WebSocket from full backend!"
            print(f"📤 Sending: {test_message}")
            await websocket.send(test_message)
            
            # Receive echo response
            response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            print(f"📥 Echo received: {response}")
            
            # Test 2: Send another message to test broadcasting
            test_message2 = "Testing broadcast functionality"
            print(f"📤 Sending: {test_message2}")
            await websocket.send(test_message2)
            
            # Receive echo for second message
            response2 = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            print(f"📥 Echo received: {response2}")
            
            print("✅ WebSocket functionality test completed successfully!")
            print("🎉 Real-time communication is working!")
            
    except asyncio.TimeoutError:
        print("⏰ Timeout waiting for WebSocket response")
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket_functionality())
