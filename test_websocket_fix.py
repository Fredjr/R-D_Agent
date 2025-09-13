#!/usr/bin/env python3
"""
Test script to verify WebSocket fixes are working correctly
"""
import asyncio
import websockets
import json
import sys

async def test_websocket_connection():
    """Test WebSocket connection and basic functionality"""
    project_id = "test-project-websocket-fix"
    
    # Test with Railway backend URL
    backend_url = "wss://r-dagent-production.up.railway.app"
    uri = f"{backend_url}/ws/project/{project_id}"
    
    print(f"🔌 Testing WebSocket connection to: {uri}")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully!")
            
            # Test 1: Wait for welcome message
            print("📥 Waiting for welcome message...")
            welcome_msg = await asyncio.wait_for(websocket.recv(), timeout=10.0)
            print(f"📥 Welcome message: {welcome_msg}")
            
            # Test 2: Send ping message
            ping_message = json.dumps({"type": "ping", "timestamp": "2025-01-08T20:00:00Z"})
            print(f"📤 Sending ping: {ping_message}")
            await websocket.send(ping_message)
            
            # Wait for pong response
            pong_response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            print(f"📥 Pong response: {pong_response}")
            
            # Test 3: Send test annotation message
            test_message = json.dumps({
                "type": "test_annotation",
                "content": "This is a test annotation",
                "timestamp": "2025-01-08T20:00:00Z"
            })
            print(f"📤 Sending test message: {test_message}")
            await websocket.send(test_message)
            
            # Wait for echo response
            echo_response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            print(f"📥 Echo response: {echo_response}")
            
            print("✅ All WebSocket tests passed!")
            return True
            
    except asyncio.TimeoutError:
        print("⏰ Timeout waiting for WebSocket response")
        return False
    except websockets.exceptions.ConnectionClosed as e:
        print(f"🔌 WebSocket connection closed: {e}")
        return False
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")
        return False

async def test_local_websocket():
    """Test WebSocket connection to local development server"""
    project_id = "test-project-local"
    uri = f"ws://localhost:8000/ws/project/{project_id}"
    
    print(f"🔌 Testing local WebSocket connection to: {uri}")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Local WebSocket connected successfully!")
            
            # Send simple test message
            await websocket.send("Hello local WebSocket!")
            response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            print(f"📥 Local response: {response}")
            
            return True
            
    except Exception as e:
        print(f"❌ Local WebSocket test failed: {e}")
        return False

async def main():
    """Run all WebSocket tests"""
    print("🚀 Starting WebSocket functionality tests...\n")
    
    # Test Railway production backend
    print("=== Testing Railway Production Backend ===")
    production_success = await test_websocket_connection()
    
    print("\n=== Testing Local Development Server ===")
    local_success = await test_local_websocket()
    
    print("\n=== Test Results ===")
    print(f"Production WebSocket: {'✅ PASS' if production_success else '❌ FAIL'}")
    print(f"Local WebSocket: {'✅ PASS' if local_success else '❌ FAIL'}")
    
    if production_success:
        print("\n🎉 WebSocket infrastructure is working correctly!")
        print("✅ Real-time features should now work in the frontend")
    else:
        print("\n⚠️ WebSocket issues detected. Check backend deployment.")
    
    return production_success

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted by user")
        sys.exit(1)
