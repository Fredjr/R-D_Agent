/**
 * React hook for managing real-time notifications via WebSocket
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface NotificationData {
  id: string;
  user_id: string;
  type: 'job_completion' | 'progress_update' | 'error';
  title: string;
  message: string;
  data: {
    job_id: string;
    job_type?: string;
    result_id?: string;
    project_id?: string;
    progress?: number;
  };
  timestamp: string;
  action_url?: string;
  read: boolean;
}

export interface UseNotificationsReturn {
  notifications: NotificationData[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (notificationId: string) => void;
  clearAll: () => void;
  handleNotificationClick: (notification: NotificationData) => void;
}

const WEBSOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'wss://r-dagent-production.up.railway.app/ws'
  : 'ws://localhost:8000/ws';

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!user?.email) {
      return;
    }

    const userEmail = user.email;
    const wsUrl = `${WEBSOCKET_URL}/${encodeURIComponent(userEmail)}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔗 WebSocket connected for notifications');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Send ping to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          } else {
            clearInterval(pingInterval);
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'notification') {
            const notificationData: NotificationData = message.data;
            
            setNotifications(prev => {
              // Check if notification already exists
              const exists = prev.some(n => n.id === notificationData.id);
              if (exists) {
                return prev;
              }
              
              // Add new notification at the beginning
              return [notificationData, ...prev];
            });
            
            // Show browser notification if permission granted
            if (Notification.permission === 'granted') {
              new Notification(notificationData.title, {
                body: notificationData.message,
                icon: '/favicon.ico',
                tag: notificationData.id
              });
            }
          } else if (message.type === 'pong') {
            // Handle pong response
            console.log('📡 WebSocket pong received');
          }
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`🔄 Attempting to reconnect in ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
  }, [user]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );

    // Send read status to server
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'mark_read',
        notification_id: notificationId
      }));
    }
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const handleNotificationClick = useCallback((notification: NotificationData) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Navigate to the action URL if available
    if (notification.action_url) {
      // Store current location for potential restoration
      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;
      
      // Check if we're in a collection network view
      if (currentPath.includes('/collections/') && currentPath.includes('/network')) {
        // Store network navigation state
        sessionStorage.setItem('network_return_path', currentPath + currentSearch);
        sessionStorage.setItem('network_return_timestamp', Date.now().toString());
      }
      
      // Navigate to the notification target
      window.location.href = notification.action_url;
    }
  }, [markAsRead]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Notification permission:', permission);
      });
    }
  }, []);

  // Connect/disconnect WebSocket based on user authentication
  useEffect(() => {
    if (user?.email) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    clearAll,
    handleNotificationClick
  };
}

// Hook for managing background job status
export function useBackgroundJob(jobId: string | null) {
  const [jobStatus, setJobStatus] = useState<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    result_data?: any;
    error_message?: string;
  } | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/proxy/background-jobs/${jobId}/status`, {
          headers: {
            'User-ID': 'current-user-email' // This should be replaced with actual user email
          }
        });

        if (response.ok) {
          const data = await response.json();
          setJobStatus({
            status: data.status,
            progress: data.progress,
            result_data: data.result_data,
            error_message: data.error_message
          });
        }
      } catch (error) {
        console.error('Failed to check job status:', error);
      }
    };

    // Check status immediately
    checkStatus();

    // Poll for status updates every 5 seconds until completed
    const interval = setInterval(() => {
      checkStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [jobId]);

  return jobStatus;
}
