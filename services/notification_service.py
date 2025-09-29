"""
Real-time Notification Service
Handles WebSocket connections for real-time job completion notifications
"""

import json
import asyncio
import logging
from typing import Dict, Set, Any, Optional
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

@dataclass
class NotificationMessage:
    """Structure for notification messages"""
    id: str
    user_id: str
    type: str  # 'job_completion', 'progress_update', 'error'
    title: str
    message: str
    data: Dict[str, Any]
    timestamp: str
    action_url: Optional[str] = None  # URL to navigate to when clicked
    read: bool = False

class NotificationManager:
    """Manages WebSocket connections and notifications"""
    
    def __init__(self):
        # Active WebSocket connections per user
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Unread notifications per user
        self.user_notifications: Dict[str, list[NotificationMessage]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept WebSocket connection and add to active connections"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        logger.info(f"WebSocket connected for user {user_id}")
        
        # Send any pending notifications
        await self._send_pending_notifications(user_id, websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove WebSocket connection"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        logger.info(f"WebSocket disconnected for user {user_id}")
    
    async def send_job_completion_notification(self, notification_data: Dict[str, Any]):
        """Send job completion notification to user"""
        user_id = notification_data["user_id"]
        job_type = notification_data["type"]
        result_id = notification_data["result_id"]
        
        # Create action URL based on job type
        if job_type == "generate_review":
            action_url = f"/projects/{notification_data.get('project_id', '')}/reports/{result_id}"
            title = "Review Generated!"
            message = "Your generate review analysis is complete. Click to view the report."
        elif job_type == "deep_dive":
            action_url = f"/projects/{notification_data.get('project_id', '')}/deep-dive/{result_id}"
            title = "Deep Dive Complete!"
            message = "Your deep dive analysis is complete. Click to view the analysis."
        else:
            action_url = f"/projects/{notification_data.get('project_id', '')}"
            title = "Processing Complete!"
            message = "Your analysis is complete."
        
        notification = NotificationMessage(
            id=notification_data["job_id"],
            user_id=user_id,
            type="job_completion",
            title=title,
            message=message,
            data={
                "job_id": notification_data["job_id"],
                "job_type": job_type,
                "result_id": result_id,
                "project_id": notification_data.get("project_id")
            },
            timestamp=notification_data["timestamp"],
            action_url=action_url
        )
        
        await self._send_notification_to_user(user_id, notification)
    
    async def send_progress_update(self, user_id: str, job_id: str, progress: int, message: str):
        """Send progress update notification"""
        notification = NotificationMessage(
            id=f"{job_id}_progress",
            user_id=user_id,
            type="progress_update",
            title="Processing...",
            message=message,
            data={
                "job_id": job_id,
                "progress": progress
            },
            timestamp=datetime.utcnow().isoformat()
        )
        
        await self._send_notification_to_user(user_id, notification)
    
    async def _send_notification_to_user(self, user_id: str, notification: NotificationMessage):
        """Send notification to specific user via WebSocket"""
        # Store notification for offline users
        if user_id not in self.user_notifications:
            self.user_notifications[user_id] = []
        
        self.user_notifications[user_id].append(notification)
        
        # Send to active connections
        if user_id in self.active_connections:
            message = json.dumps({
                "type": "notification",
                "data": asdict(notification)
            })
            
            # Send to all active connections for this user
            disconnected_connections = set()
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_text(message)
                except Exception as e:
                    logger.error(f"Failed to send notification to {user_id}: {str(e)}")
                    disconnected_connections.add(websocket)
            
            # Clean up disconnected connections
            for websocket in disconnected_connections:
                self.active_connections[user_id].discard(websocket)
    
    async def _send_pending_notifications(self, user_id: str, websocket: WebSocket):
        """Send pending notifications to newly connected user"""
        if user_id in self.user_notifications:
            for notification in self.user_notifications[user_id]:
                if not notification.read:
                    try:
                        message = json.dumps({
                            "type": "notification",
                            "data": asdict(notification)
                        })
                        await websocket.send_text(message)
                    except Exception as e:
                        logger.error(f"Failed to send pending notification: {str(e)}")
    
    def mark_notification_read(self, user_id: str, notification_id: str):
        """Mark notification as read"""
        if user_id in self.user_notifications:
            for notification in self.user_notifications[user_id]:
                if notification.id == notification_id:
                    notification.read = True
                    break
    
    def get_user_notifications(self, user_id: str, unread_only: bool = False) -> list[NotificationMessage]:
        """Get notifications for user"""
        if user_id not in self.user_notifications:
            return []
        
        notifications = self.user_notifications[user_id]
        if unread_only:
            notifications = [n for n in notifications if not n.read]
        
        return notifications
    
    def clear_user_notifications(self, user_id: str):
        """Clear all notifications for user"""
        if user_id in self.user_notifications:
            del self.user_notifications[user_id]

# Global notification manager instance
notification_manager = NotificationManager()

# WebSocket endpoint handler
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time notifications"""
    await notification_manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "mark_read":
                notification_id = message.get("notification_id")
                if notification_id:
                    notification_manager.mark_notification_read(user_id, notification_id)
            
            elif message.get("type") == "ping":
                # Respond to ping to keep connection alive
                await websocket.send_text(json.dumps({"type": "pong"}))
    
    except WebSocketDisconnect:
        notification_manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {str(e)}")
        notification_manager.disconnect(websocket, user_id)

# Callback function for background processor
async def background_job_notification_callback(notification_data: Dict[str, Any]):
    """Callback function to handle background job completion notifications"""
    await notification_manager.send_job_completion_notification(notification_data)
