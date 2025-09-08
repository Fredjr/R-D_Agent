#!/usr/bin/env python3
"""
Minimal FastAPI server to test WebSocket functionality without external dependencies
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import asyncio

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, project_id: str):
        await websocket.accept()
        if project_id not in self.active_connections:
            self.active_connections[project_id] = []
        self.active_connections[project_id].append(websocket)
        print(f"Client connected to project {project_id}. Total connections: {len(self.active_connections[project_id])}")
    
    def disconnect(self, websocket: WebSocket, project_id: str):
        if project_id in self.active_connections:
            if websocket in self.active_connections[project_id]:
                self.active_connections[project_id].remove(websocket)
                print(f"Client disconnected from project {project_id}. Remaining connections: {len(self.active_connections[project_id])}")
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            print(f"Error sending personal message: {e}")
    
    async def broadcast_to_project(self, message: str, project_id: str):
        if project_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[project_id]:
                try:
                    await connection.send_text(message)
                    print(f"Broadcasted message to project {project_id}: {message}")
                except Exception as e:
                    print(f"Error broadcasting to connection: {e}")
                    disconnected.append(connection)
            
            # Remove disconnected connections
            for conn in disconnected:
                self.active_connections[project_id].remove(conn)

manager = ConnectionManager()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "websocket_connections": len(manager.active_connections)}

@app.websocket("/ws/project/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: str):
    await manager.connect(websocket, project_id)
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received message in project {project_id}: {data}")
            
            # Echo back to sender
            await manager.send_personal_message(f"Echo: {data}", websocket)
            
            # Also broadcast to all other clients in the project
            broadcast_message = {
                "type": "message",
                "project_id": project_id,
                "content": data,
                "timestamp": "2025-01-08T19:12:31Z"
            }
            await manager.broadcast_to_project(json.dumps(broadcast_message), project_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, project_id)
        print(f"WebSocket disconnected for project {project_id}")

if __name__ == "__main__":
    import uvicorn
    print("Starting minimal WebSocket test server...")
    uvicorn.run(app, host="127.0.0.1", port=8001)
