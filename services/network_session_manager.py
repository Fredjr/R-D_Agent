"""
Collection Network Session Management
Handles persistent navigation state for collection network explorations
"""

import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from sqlalchemy.orm import Session
from database import get_db
import logging

logger = logging.getLogger(__name__)

@dataclass
class NetworkNode:
    """Represents a node in the network"""
    id: str
    pmid: str
    title: str
    authors: List[str]
    x: float
    y: float
    size: int
    color: str
    is_expanded: bool = False
    depth: int = 0

@dataclass
class NetworkEdge:
    """Represents an edge in the network"""
    source: str
    target: str
    weight: float
    type: str  # 'citation', 'similarity', 'co_author'

@dataclass
class NetworkState:
    """Complete state of a network exploration"""
    nodes: List[NetworkNode]
    edges: List[NetworkEdge]
    center_node: str
    zoom_level: float
    pan_x: float
    pan_y: float
    expanded_nodes: List[str]
    selected_node: Optional[str] = None
    filter_settings: Dict[str, Any] = None

@dataclass
class NetworkSession:
    """A saved network exploration session"""
    session_id: str
    collection_id: str
    user_id: str
    name: str
    description: str
    network_state: NetworkState
    created_at: datetime
    updated_at: datetime
    is_active: bool = True
    tags: List[str] = None

class NetworkSessionManager:
    """Manages collection network exploration sessions"""
    
    def __init__(self):
        # In-memory cache for active sessions
        self.active_sessions: Dict[str, NetworkSession] = {}
        # Session storage (in production, this would be in database)
        self.session_storage: Dict[str, NetworkSession] = {}
    
    def create_session(
        self, 
        collection_id: str, 
        user_id: str, 
        initial_state: NetworkState,
        name: Optional[str] = None,
        description: Optional[str] = None
    ) -> str:
        """Create a new network exploration session"""
        session_id = str(uuid.uuid4())
        
        if not name:
            name = f"Network Exploration {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        
        session = NetworkSession(
            session_id=session_id,
            collection_id=collection_id,
            user_id=user_id,
            name=name,
            description=description or "",
            network_state=initial_state,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            tags=[]
        )
        
        self.session_storage[session_id] = session
        self.active_sessions[session_id] = session
        
        logger.info(f"Created network session {session_id} for user {user_id} in collection {collection_id}")
        return session_id
    
    def update_session_state(self, session_id: str, new_state: NetworkState) -> bool:
        """Update the network state of an existing session"""
        if session_id not in self.session_storage:
            return False
        
        session = self.session_storage[session_id]
        session.network_state = new_state
        session.updated_at = datetime.utcnow()
        
        # Update active session cache
        if session_id in self.active_sessions:
            self.active_sessions[session_id] = session
        
        logger.info(f"Updated network session {session_id}")
        return True
    
    def get_session(self, session_id: str) -> Optional[NetworkSession]:
        """Get a network session by ID"""
        return self.session_storage.get(session_id)
    
    def get_user_sessions(
        self, 
        user_id: str, 
        collection_id: Optional[str] = None,
        active_only: bool = False
    ) -> List[NetworkSession]:
        """Get all sessions for a user, optionally filtered by collection"""
        sessions = []
        
        for session in self.session_storage.values():
            if session.user_id != user_id:
                continue
            
            if collection_id and session.collection_id != collection_id:
                continue
            
            if active_only and not session.is_active:
                continue
            
            sessions.append(session)
        
        # Sort by updated_at descending
        sessions.sort(key=lambda s: s.updated_at, reverse=True)
        return sessions
    
    def get_collection_sessions(
        self, 
        collection_id: str, 
        user_id: str,
        limit: int = 10
    ) -> List[NetworkSession]:
        """Get recent sessions for a collection"""
        sessions = self.get_user_sessions(user_id, collection_id, active_only=True)
        return sessions[:limit]
    
    def archive_session(self, session_id: str) -> bool:
        """Archive a session (mark as inactive)"""
        if session_id not in self.session_storage:
            return False
        
        self.session_storage[session_id].is_active = False
        self.session_storage[session_id].updated_at = datetime.utcnow()
        
        # Remove from active sessions
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
        
        logger.info(f"Archived network session {session_id}")
        return True
    
    def delete_session(self, session_id: str, user_id: str) -> bool:
        """Delete a session (only by owner)"""
        if session_id not in self.session_storage:
            return False
        
        session = self.session_storage[session_id]
        if session.user_id != user_id:
            return False  # Only owner can delete
        
        del self.session_storage[session_id]
        
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
        
        logger.info(f"Deleted network session {session_id}")
        return True
    
    def rename_session(self, session_id: str, user_id: str, new_name: str) -> bool:
        """Rename a session"""
        if session_id not in self.session_storage:
            return False
        
        session = self.session_storage[session_id]
        if session.user_id != user_id:
            return False
        
        session.name = new_name
        session.updated_at = datetime.utcnow()
        
        logger.info(f"Renamed network session {session_id} to '{new_name}'")
        return True
    
    def add_session_tag(self, session_id: str, user_id: str, tag: str) -> bool:
        """Add a tag to a session"""
        if session_id not in self.session_storage:
            return False
        
        session = self.session_storage[session_id]
        if session.user_id != user_id:
            return False
        
        if not session.tags:
            session.tags = []
        
        if tag not in session.tags:
            session.tags.append(tag)
            session.updated_at = datetime.utcnow()
        
        return True
    
    def get_session_for_restoration(
        self, 
        user_id: str, 
        collection_id: str,
        prefer_recent: bool = True
    ) -> Optional[NetworkSession]:
        """Get the best session to restore for a user returning to a collection"""
        sessions = self.get_user_sessions(user_id, collection_id, active_only=True)
        
        if not sessions:
            return None
        
        if prefer_recent:
            # Return most recently updated session
            return sessions[0]
        else:
            # Return most recently created session
            return max(sessions, key=lambda s: s.created_at)
    
    def cleanup_old_sessions(self, days_old: int = 30):
        """Clean up old inactive sessions"""
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        sessions_to_delete = []
        
        for session_id, session in self.session_storage.items():
            if not session.is_active and session.updated_at < cutoff_date:
                sessions_to_delete.append(session_id)
        
        for session_id in sessions_to_delete:
            del self.session_storage[session_id]
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]
        
        logger.info(f"Cleaned up {len(sessions_to_delete)} old network sessions")
        return len(sessions_to_delete)
    
    def export_session(self, session_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Export session data for backup/sharing"""
        session = self.get_session(session_id)
        if not session or session.user_id != user_id:
            return None
        
        return asdict(session)
    
    def import_session(self, session_data: Dict[str, Any], user_id: str) -> Optional[str]:
        """Import session data"""
        try:
            # Create new session ID to avoid conflicts
            new_session_id = str(uuid.uuid4())
            session_data['session_id'] = new_session_id
            session_data['user_id'] = user_id
            session_data['created_at'] = datetime.utcnow()
            session_data['updated_at'] = datetime.utcnow()
            
            # Convert dict back to NetworkSession
            network_state = NetworkState(**session_data['network_state'])
            session_data['network_state'] = network_state
            
            session = NetworkSession(**session_data)
            self.session_storage[new_session_id] = session
            
            logger.info(f"Imported network session {new_session_id}")
            return new_session_id
        
        except Exception as e:
            logger.error(f"Failed to import session: {str(e)}")
            return None

# Global network session manager instance
network_session_manager = NetworkSessionManager()
