'use client';

/**
 * Notification Center Component
 * Displays real-time notifications with clickable actions
 */

import React, { useState } from 'react';
import { Bell, X, CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { useNotifications, NotificationData } from '../hooks/useNotifications';

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const { 
    notifications, 
    unreadCount, 
    isConnected, 
    markAsRead, 
    clearAll, 
    handleNotificationClick 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: string, jobType?: string) => {
    switch (type) {
      case 'job_completion':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'progress_update':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationItemClick = (notification: NotificationData) => {
    handleNotificationClick(notification);
    setIsOpen(false); // Close the notification center
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="w-6 h-6" />
        
        {/* Connection Status Indicator */}
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-400' : 'bg-red-400'
        }`} />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-sm text-gray-500">
                  ({unreadCount} unread)
                </span>
              )}
            </h3>
            
            <div className="flex items-center space-x-2">
              {/* Connection Status */}
              <div className={`flex items-center text-xs ${
                isConnected ? 'text-green-600' : 'text-red-600'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-1 ${
                  isConnected ? 'bg-green-400' : 'bg-red-400'
                }`} />
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
              
              {/* Clear All Button */}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </button>
              )}
              
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No notifications yet</p>
                <p className="text-sm mt-1">
                  You'll see updates about your analyses here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleNotificationItemClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type, notification.data.job_type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          
                          {notification.action_url && (
                            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        
                        {/* Progress Bar for Progress Updates */}
                        {notification.type === 'progress_update' && notification.data.progress && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${notification.data.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.data.progress}% complete
                            </p>
                          </div>
                        )}
                        
                        {/* Job Type Badge */}
                        {notification.data.job_type && (
                          <div className="mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              notification.data.job_type === 'generate_review' 
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {notification.data.job_type === 'generate_review' ? 'Review' : 'Deep Dive'}
                            </span>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-2">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                      
                      {/* Unread Indicator */}
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Notification Toast Component for Inline Notifications
export function NotificationToast({ 
  notification, 
  onClose, 
  onClick 
}: { 
  notification: NotificationData;
  onClose: () => void;
  onClick: () => void;
}) {
  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm z-50 animate-slide-in-right">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {notification.type === 'job_completion' ? (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : (
            <Bell className="w-6 h-6 text-blue-500" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {notification.title}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {notification.message}
          </p>
          
          {notification.action_url && (
            <button
              onClick={onClick}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View Result →
            </button>
          )}
        </div>
        
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
