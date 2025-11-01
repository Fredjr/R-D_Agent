'use client';

// CACHE BUSTER: Force new bundle hash - v2.0.1 - 2025-11-01T14:40:00Z
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { AnnotationList } from './annotations';

interface Annotation {
  annotation_id: string;
  content: string;
  author_id: string;
  created_at: string;
  article_pmid?: string;
  report_id?: string;
  analysis_id?: string;
}

interface AnnotationsFeedProps {
  projectId: string;
  articlePmid?: string;
  reportId?: string;
  analysisId?: string;
  className?: string;
  // NEW: Option to use enhanced contextual notes
  useEnhancedNotes?: boolean;
}

export default function AnnotationsFeed({
  projectId,
  articlePmid,
  reportId,
  analysisId,
  className = '',
  useEnhancedNotes = false
}: AnnotationsFeedProps) {
  const { user } = useAuth();

  // If enhanced notes are enabled, use the new AnnotationList component
  if (useEnhancedNotes) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Contextual Notes</h3>
          </div>
          <div className="text-xs text-gray-500">
            Enhanced with types, priorities & threads
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <AnnotationList
            projectId={projectId}
            userId={user?.email} // CRITICAL FIX: Must use user.email, not user.user_id
            articlePmid={articlePmid}
            reportId={reportId}
            analysisId={analysisId}
            showForm={true}
            compact={false}
          />
        </div>
      </div>
    );
  }

  // Legacy annotations feed (backward compatibility)
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new annotations arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [annotations]);

  // Fetch initial annotations
  useEffect(() => {
    if (projectId) {
      fetchAnnotations();
    }
  }, [projectId, articlePmid, reportId, analysisId]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!projectId || !user) return;

    const connectWebSocket = () => {
      try {
        // Use the backend URL from environment or default to localhost
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        // Use the correct backend URL and convert HTTP/HTTPS to WS/WSS for WebSocket connection
        const wsUrl = backendUrl.replace(/^https?:\/\//, (match) => match === 'https://' ? 'wss://' : 'ws://');
        const websocketUrl = `${wsUrl}/ws/project/${projectId}`;
        
        console.log('🔌 Connecting to WebSocket:', websocketUrl);
        
        const ws = new WebSocket(websocketUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('✅ WebSocket connected');
          setWsConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📥 WebSocket message received:', message);
            
            if (message.type === 'new_annotation') {
              const newAnnotation = message.annotation;
              
              // Check if this annotation matches our current context
              const matchesContext = 
                (!articlePmid || newAnnotation.article_pmid === articlePmid) &&
                (!reportId || newAnnotation.report_id === reportId) &&
                (!analysisId || newAnnotation.analysis_id === analysisId);
              
              if (matchesContext) {
                setAnnotations(prev => {
                  // Avoid duplicates
                  if (prev.some(a => a.annotation_id === newAnnotation.annotation_id)) {
                    return prev;
                  }
                  return [...prev, newAnnotation];
                });
              }
            }
          } catch (err) {
            console.error('❌ Error parsing WebSocket message:', err);
          }
        };

        ws.onclose = (event) => {
          console.log('🔌 AnnotationsFeed WebSocket disconnected:', event.code, event.reason);
          setWsConnected(false);

          // Only attempt to reconnect if not a normal closure and we have valid context
          if (event.code !== 1000 && projectId && user) {
            console.log('🔄 AnnotationsFeed will attempt to reconnect in 5 seconds...');
            setTimeout(() => {
              if (projectId && user) {
                connectWebSocket();
              }
            }, 5000); // Increased delay to reduce load
          } else {
            console.log('🚫 AnnotationsFeed WebSocket reconnection disabled');
          }
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          setWsConnected(false);
          setError('Real-time connection failed');
        };
      } catch (err) {
        console.error('❌ Failed to create WebSocket connection:', err);
        setError('Failed to establish real-time connection');
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [projectId, user, articlePmid, reportId, analysisId]);

  const fetchAnnotations = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (articlePmid) params.append('article_pmid', articlePmid);
      if (reportId) params.append('report_id', reportId);
      if (analysisId) params.append('analysis_id', analysisId);

      const queryString = params.toString();
      const url = `/api/proxy/projects/${projectId}/annotations${queryString ? `?${queryString}` : ''}`;

      console.log('📡 AnnotationsFeed fetching with User-ID:', user?.email); // DEBUG: Verify correct header
      const response = await fetch(url, {
        headers: {
          'User-ID': user?.email || 'anonymous', // CRITICAL: Must use user.email, not user.user_id
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Gracefully handle API errors - show empty state instead of error
        console.warn(`⚠️ Annotations API unavailable (${response.status}), showing empty state`);
        setAnnotations([]);
        return;
      }

      const data = await response.json();
      setAnnotations(data.annotations || []);
    } catch (err) {
      console.error('❌ Error fetching annotations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load annotations');
    } finally {
      setLoading(false);
    }
  };

  const submitAnnotation = async () => {
    if (!newAnnotation.trim() || !user || submitting) return;

    try {
      setSubmitting(true);
      setError(null);

      const annotationData = {
        content: newAnnotation.trim(),
        article_pmid: articlePmid || null,
        report_id: reportId || null,
        analysis_id: analysisId || null,
      };

      const response = await fetch(`/api/proxy/projects/${projectId}/annotations`, {
        method: 'POST',
        headers: {
          'User-ID': user.email,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(annotationData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create annotation: ${response.status}`);
      }

      const result = await response.json();
      
      // Add the new annotation to local state immediately for better UX
      setAnnotations(prev => [...prev, result]);
      setNewAnnotation('');
      
      console.log('✅ Annotation created successfully');
    } catch (err) {
      console.error('❌ Error creating annotation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create annotation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitAnnotation();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getContextLabel = () => {
    if (articlePmid) return `Article PMID: ${articlePmid}`;
    if (reportId) return `Report: ${reportId}`;
    if (analysisId) return `Analysis: ${analysisId}`;
    return 'Project Discussion';
  };

  return (
    <div className={`bg-white rounded-lg shadow border border-gray-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-900">Annotations</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">{getContextLabel()}</span>
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'}`} 
                 title={wsConnected ? 'Real-time connected' : 'Real-time disconnected'} />
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading annotations...</span>
          </div>
        ) : annotations.length === 0 ? (
          <div className="text-center py-8">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">No annotations yet</p>
            <p className="text-gray-500 text-xs mt-1">Start the discussion by adding your thoughts</p>
          </div>
        ) : (
          <>
            {annotations.map((annotation) => (
              <div key={annotation.annotation_id} className="flex space-x-3">
                <div className="flex-shrink-0">
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {annotation.author_id === user?.user_id ? 'You' : annotation.author_id}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(annotation.created_at)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {annotation.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex space-x-3">
          <div className="flex-1">
            <textarea
              value={newAnnotation}
              onChange={(e) => setNewAnnotation(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add your annotation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              rows={2}
              disabled={submitting || !user}
            />
          </div>
          <button
            onClick={submitAnnotation}
            disabled={!newAnnotation.trim() || submitting || !user}
            className="flex-shrink-0 inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <PaperAirplaneIcon className="h-4 w-4" />
            )}
          </button>
        </div>
        {!wsConnected && (
          <p className="text-xs text-amber-600 mt-2">
            ⚠️ Real-time updates unavailable. Refresh to see new annotations.
          </p>
        )}
      </div>
    </div>
  );
}
