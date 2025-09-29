/**
 * Network Session Manager Component
 * Manages collection network exploration sessions with user-friendly interface
 */

import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, Edit3, Plus, Clock, Network } from 'lucide-react';
import { useNetworkSession, NetworkSession, NetworkState } from '../hooks/useNetworkSession';

interface NetworkSessionManagerProps {
  collectionId: string;
  currentNetworkState?: NetworkState;
  onSessionLoad?: (session: NetworkSession) => void;
  onSessionSave?: (sessionId: string) => void;
  className?: string;
}

export function NetworkSessionManager({
  collectionId,
  currentNetworkState,
  onSessionLoad,
  onSessionSave,
  className = ''
}: NetworkSessionManagerProps) {
  const {
    currentSession,
    availableSessions,
    isLoading,
    createSession,
    updateSession,
    loadSession,
    deleteSession,
    renameSession,
    getCollectionSessions,
    autoSave,
    setAutoSave
  } = useNetworkSession(collectionId);

  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Load collection sessions on mount
  useEffect(() => {
    if (collectionId) {
      getCollectionSessions(collectionId);
    }
  }, [collectionId, getCollectionSessions]);

  const handleCreateSession = async () => {
    if (!currentNetworkState || !sessionName.trim()) return;

    const sessionId = await createSession(
      collectionId,
      currentNetworkState,
      sessionName.trim(),
      sessionDescription.trim() || undefined
    );

    if (sessionId) {
      setShowSessionDialog(false);
      setSessionName('');
      setSessionDescription('');
      onSessionSave?.(sessionId);
      
      // Refresh sessions list
      getCollectionSessions(collectionId);
    }
  };

  const handleLoadSession = async (session: NetworkSession) => {
    const loadedSession = await loadSession(session.session_id);
    if (loadedSession) {
      onSessionLoad?.(loadedSession);
    }
  };

  const handleSaveCurrentSession = async () => {
    if (!currentSession || !currentNetworkState) return;

    const success = await updateSession(currentSession.session_id, currentNetworkState);
    if (success) {
      onSessionSave?.(currentSession.session_id);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this network session?')) {
      const success = await deleteSession(sessionId);
      if (success) {
        // Refresh sessions list
        getCollectionSessions(collectionId);
      }
    }
  };

  const handleRenameSession = async (sessionId: string) => {
    if (!editingName.trim()) return;

    const success = await renameSession(sessionId, editingName.trim());
    if (success) {
      setEditingSessionId(null);
      setEditingName('');
      // Refresh sessions list
      getCollectionSessions(collectionId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getSessionPreview = (session: NetworkSession) => {
    const nodeCount = session.network_state.nodes.length;
    const edgeCount = session.network_state.edges.length;
    const expandedCount = session.network_state.expanded_nodes.length;
    
    return `${nodeCount} nodes, ${edgeCount} connections, ${expandedCount} expanded`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Network className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Network Sessions</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Auto-save toggle */}
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              className="mr-2"
            />
            Auto-save
          </label>
          
          {/* Save current session */}
          {currentSession && currentNetworkState && (
            <button
              onClick={handleSaveCurrentSession}
              disabled={isLoading}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
          )}
          
          {/* Create new session */}
          <button
            onClick={() => setShowSessionDialog(true)}
            disabled={!currentNetworkState}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Current Session Info */}
      {currentSession && (
        <div className="p-4 bg-blue-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900">{currentSession.name}</p>
              <p className="text-sm text-blue-700">
                Current session • {getSessionPreview(currentSession)}
              </p>
            </div>
            <div className="text-xs text-blue-600">
              Updated: {formatDate(currentSession.updated_at)}
            </div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="max-h-64 overflow-y-auto">
        {availableSessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No saved network sessions</p>
            <p className="text-sm mt-1">
              Create a session to save your network exploration
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {availableSessions.map((session) => (
              <div
                key={session.session_id}
                className={`p-4 hover:bg-gray-50 ${
                  currentSession?.session_id === session.session_id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {editingSessionId === session.session_id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameSession(session.session_id);
                            } else if (e.key === 'Escape') {
                              setEditingSessionId(null);
                              setEditingName('');
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleRenameSession(session.session_id)}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingSessionId(null);
                            setEditingName('');
                          }}
                          className="px-2 py-1 text-xs bg-gray-400 text-white rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-gray-900 truncate">
                          {session.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {getSessionPreview(session)}
                        </p>
                        {session.description && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {session.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatDate(session.updated_at)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-4">
                    {/* Load session */}
                    <button
                      onClick={() => handleLoadSession(session)}
                      disabled={isLoading || currentSession?.session_id === session.session_id}
                      className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                      title="Load session"
                    >
                      <FolderOpen className="w-4 h-4" />
                    </button>
                    
                    {/* Rename session */}
                    <button
                      onClick={() => {
                        setEditingSessionId(session.session_id);
                        setEditingName(session.name);
                      }}
                      className="p-1 text-gray-400 hover:text-yellow-600"
                      title="Rename session"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    
                    {/* Delete session */}
                    <button
                      onClick={() => handleDeleteSession(session.session_id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Session Dialog */}
      {showSessionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Save Network Session
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Name *
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g., COVID-19 Research Network"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  placeholder="Brief description of this network exploration..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSessionDialog(false);
                  setSessionName('');
                  setSessionDescription('');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSession}
                disabled={!sessionName.trim() || isLoading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
