/**
 * Enhanced WebSocket Manager v1.0
 * 
 * Comprehensive real-time features implementation:
 * - WebSocket connection management with auto-reconnect
 * - Live progress updates for PhD analysis
 * - Real-time notifications system
 * - Background job status monitoring
 * - Connection health monitoring
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { 
  WifiIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ClockIcon,
  BellIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// =============================================================================
// Types and Interfaces
// =============================================================================

interface WebSocketMessage {
  type: 'progress' | 'notification' | 'job_status' | 'error' | 'ping' | 'pong';
  data: any;
  timestamp: string;
  project_id?: string;
  user_id?: string;
}

interface ConnectionStatus {
  connected: boolean;
  connecting: boolean;
  lastConnected?: Date;
  reconnectAttempts: number;
  latency?: number;
}

interface ProgressUpdate {
  job_id: string;
  job_type: string;
  progress: number;
  stage: string;
  estimated_completion?: string;
  project_id: string;
}

interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  project_id?: string;
  action_url?: string;
  auto_dismiss?: boolean;
}

interface WebSocketContextType {
  connectionStatus: ConnectionStatus;
  notifications: NotificationData[];
  progressUpdates: Map<string, ProgressUpdate>;
  connect: (projectId: string, userId: string) => void;
  disconnect: () => void;
  sendMessage: (message: WebSocketMessage) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

// =============================================================================
// WebSocket Context
// =============================================================================

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// =============================================================================
// WebSocket Provider Component
// =============================================================================

interface WebSocketProviderProps {
  children: React.ReactNode;
  backendUrl?: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  backendUrl = 'wss://r-dagent-production.up.railway.app'
}) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    connecting: false,
    reconnectAttempts: 0
  });
  
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [progressUpdates, setProgressUpdates] = useState<Map<string, ProgressUpdate>>(new Map());
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentProjectId = useRef<string>('');
  const currentUserId = useRef<string>('');

  // =============================================================================
  // Connection Management
  // =============================================================================

  const connect = useCallback((projectId: string, userId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    currentProjectId.current = projectId;
    currentUserId.current = userId;

    setConnectionStatus(prev => ({ ...prev, connecting: true }));

    try {
      const wsUrl = `${backendUrl}/ws/projects/${projectId}?user_id=${userId}`;
      console.log('🔗 Connecting to WebSocket:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setConnectionStatus({
          connected: true,
          connecting: false,
          lastConnected: new Date(),
          reconnectAttempts: 0
        });

        // Start ping/pong for connection health
        startPingPong();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus(prev => ({
          ...prev,
          connected: false,
          connecting: false
        }));

        stopPingPong();

        // Auto-reconnect if not a clean close
        if (event.code !== 1000 && currentProjectId.current) {
          scheduleReconnect();
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus(prev => ({
          ...prev,
          connected: false,
          connecting: false
        }));
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setConnectionStatus(prev => ({
        ...prev,
        connecting: false,
        reconnectAttempts: prev.reconnectAttempts + 1
      }));
    }
  }, [backendUrl]);

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting WebSocket');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopPingPong();

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    currentProjectId.current = '';
    currentUserId.current = '';
    
    setConnectionStatus({
      connected: false,
      connecting: false,
      reconnectAttempts: 0
    });
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) return;

    const delay = Math.min(1000 * Math.pow(2, connectionStatus.reconnectAttempts), 30000);
    console.log(`🔄 Scheduling reconnect in ${delay}ms`);

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      if (currentProjectId.current && currentUserId.current) {
        setConnectionStatus(prev => ({
          ...prev,
          reconnectAttempts: prev.reconnectAttempts + 1
        }));
        connect(currentProjectId.current, currentUserId.current);
      }
    }, delay);
  }, [connect, connectionStatus.reconnectAttempts]);

  // =============================================================================
  // Ping/Pong for Connection Health
  // =============================================================================

  const startPingPong = useCallback(() => {
    if (pingIntervalRef.current) return;

    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const pingTime = Date.now();
        sendMessage({
          type: 'ping',
          data: { timestamp: pingTime },
          timestamp: new Date().toISOString()
        });
      }
    }, 30000); // Ping every 30 seconds
  }, []);

  const stopPingPong = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // =============================================================================
  // Message Handling
  // =============================================================================

  const handleMessage = useCallback((message: WebSocketMessage) => {
    console.log('📨 WebSocket message received:', message.type);

    switch (message.type) {
      case 'progress':
        handleProgressUpdate(message.data);
        break;
      
      case 'notification':
        handleNotification(message.data);
        break;
      
      case 'job_status':
        handleJobStatus(message.data);
        break;
      
      case 'pong':
        handlePong(message.data);
        break;
      
      case 'error':
        handleError(message.data);
        break;
      
      default:
        console.log('🤷 Unknown message type:', message.type);
    }
  }, []);

  const handleProgressUpdate = useCallback((data: ProgressUpdate) => {
    setProgressUpdates(prev => {
      const updated = new Map(prev);
      updated.set(data.job_id, data);
      return updated;
    });

    // Auto-remove completed jobs after 30 seconds
    if (data.progress >= 100) {
      setTimeout(() => {
        setProgressUpdates(prev => {
          const updated = new Map(prev);
          updated.delete(data.job_id);
          return updated;
        });
      }, 30000);
    }
  }, []);

  const handleNotification = useCallback((data: NotificationData) => {
    setNotifications(prev => [data, ...prev]);

    // Auto-dismiss notifications if specified
    if (data.auto_dismiss !== false) {
      setTimeout(() => {
        dismissNotification(data.id);
      }, 5000);
    }
  }, []);

  const handleJobStatus = useCallback((data: any) => {
    // Handle job status updates
    console.log('📊 Job status update:', data);
  }, []);

  const handlePong = useCallback((data: { timestamp: number }) => {
    const latency = Date.now() - data.timestamp;
    setConnectionStatus(prev => ({ ...prev, latency }));
  }, []);

  const handleError = useCallback((data: any) => {
    console.error('❌ WebSocket error message:', data);
    
    const errorNotification: NotificationData = {
      id: `error-${Date.now()}`,
      type: 'error',
      title: 'Connection Error',
      message: data.message || 'An error occurred with the real-time connection',
      timestamp: new Date().toISOString(),
      auto_dismiss: false
    };
    
    handleNotification(errorNotification);
  }, []);

  // =============================================================================
  // Public Methods
  // =============================================================================

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ Cannot send message: WebSocket not connected');
    }
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // =============================================================================
  // Cleanup
  // =============================================================================

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // =============================================================================
  // Context Value
  // =============================================================================

  const contextValue: WebSocketContextType = {
    connectionStatus,
    notifications,
    progressUpdates,
    connect,
    disconnect,
    sendMessage,
    dismissNotification,
    clearAllNotifications
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// =============================================================================
// Connection Status Indicator Component
// =============================================================================

export const WebSocketStatusIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { connectionStatus } = useWebSocket();

  const getStatusConfig = () => {
    if (connectionStatus.connected) {
      return {
        icon: WifiIcon,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        label: 'Connected',
        detail: connectionStatus.latency ? `${connectionStatus.latency}ms` : ''
      };
    } else if (connectionStatus.connecting) {
      return {
        icon: ClockIcon,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        label: 'Connecting...',
        detail: connectionStatus.reconnectAttempts > 0 ? `Attempt ${connectionStatus.reconnectAttempts}` : ''
      };
    } else {
      return {
        icon: ExclamationTriangleIcon,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        label: 'Disconnected',
        detail: connectionStatus.lastConnected ? 'Lost connection' : 'Not connected'
      };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-md ${config.bgColor} ${className}`}>
      <Icon className={`w-4 h-4 ${config.color} mr-1`} />
      <span className={`text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
      {config.detail && (
        <span className={`text-xs ${config.color} opacity-75 ml-1`}>
          ({config.detail})
        </span>
      )}
    </div>
  );
};
