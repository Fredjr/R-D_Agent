import { useEffect, useRef, useCallback } from 'react';
import type { Annotation } from '../lib/api/annotations';

interface UseAnnotationWebSocketOptions {
  projectId: string;
  userId?: string;
  onNewAnnotation?: (annotation: Annotation) => void;
  onUpdateAnnotation?: (annotation: Annotation) => void;
  onDeleteAnnotation?: (annotationId: string) => void;
  enabled?: boolean;
}

interface WebSocketMessage {
  type: 'new_annotation' | 'update_annotation' | 'delete_annotation' | 'connection_established' | 'pong' | 'echo' | 'error';
  annotation?: Annotation;
  annotation_id?: string;
  project_id?: string;
  timestamp?: string;
  message?: string;
}

export function useAnnotationWebSocket({
  projectId,
  userId,
  onNewAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  enabled = true,
}: UseAnnotationWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!enabled || !projectId) return;

    try {
      // WebSocket connections MUST use direct backend URL (cannot go through proxy)
      // Always use production Railway URL for WebSocket
      const backendUrl = 'https://r-dagent-production.up.railway.app';
      const wsUrl = backendUrl.replace(/^https?:\/\//, (match) =>
        match === 'https://' ? 'wss://' : 'ws://'
      );
      const websocketUrl = `${wsUrl}/ws/project/${projectId}`;

      console.log('🔌 Connecting to annotation WebSocket:', websocketUrl);

      const ws = new WebSocket(websocketUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Annotation WebSocket connected');
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📥 Annotation WebSocket message:', message);

          switch (message.type) {
            case 'connection_established':
              console.log('✅ WebSocket connection established:', message.message);
              break;

            case 'new_annotation':
              if (message.annotation && onNewAnnotation) {
                onNewAnnotation(message.annotation);
              }
              break;

            case 'update_annotation':
              if (message.annotation && onUpdateAnnotation) {
                onUpdateAnnotation(message.annotation);
              }
              break;

            case 'delete_annotation':
              if (message.annotation_id && onDeleteAnnotation) {
                onDeleteAnnotation(message.annotation_id);
              }
              break;

            case 'pong':
              // Heartbeat response - connection is alive
              break;

            case 'echo':
              // Echo response - for testing
              break;

            case 'error':
              console.error('❌ WebSocket error message:', message.message);
              break;

            default:
              console.log('⚠️ Unknown WebSocket message type:', message.type);
          }
        } catch (err) {
          console.error('❌ Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 Annotation WebSocket disconnected:', event.code, event.reason);
        wsRef.current = null;

        // Attempt to reconnect if not a normal closure
        if (
          event.code !== 1000 &&
          enabled &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Annotation WebSocket error:', error);
      };
    } catch (err) {
      console.error('❌ Failed to create WebSocket connection:', err);
    }
  }, [projectId, enabled, onNewAnnotation, onUpdateAnnotation, onDeleteAnnotation]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounted');
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connected: wsRef.current?.readyState === WebSocket.OPEN,
    reconnect: connect,
    disconnect,
  };
}

