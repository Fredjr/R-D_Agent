'use client';

/**
 * Alerts Panel Component
 * 
 * Slide-out panel for displaying project alerts with:
 * - Alert statistics
 * - Filter controls (by type, severity, dismissed status)
 * - Alert list with cards
 * - Batch actions (dismiss all, clear all)
 * - Real-time updates
 * 
 * Week 14: Project Alerts Frontend UI
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ProjectAlert, 
  AlertStats,
  getProjectAlerts, 
  getAlertStats,
  dismissAlert,
  dismissAlertsBatch
} from '@/lib/api';
import { AlertCard } from './AlertCard';
import { 
  X, 
  Bell, 
  Filter,
  CheckCircle,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface AlertsPanelProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onViewPaper?: (pmid: string) => void;
}

export function AlertsPanel({ projectId, isOpen, onClose, onViewPaper }: AlertsPanelProps) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<ProjectAlert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [showDismissed, setShowDismissed] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  // Load alerts and stats
  const loadAlerts = async () => {
    if (!user?.email) return;

    setLoading(true);
    setError(null);

    try {
      const filters: any = {
        limit: 50,
        offset: 0
      };

      if (!showDismissed) {
        filters.dismissed = false;
      }

      if (filterType !== 'all') {
        filters.alert_type = filterType;
      }

      if (filterSeverity !== 'all') {
        filters.severity = filterSeverity;
      }

      const [alertsData, statsData] = await Promise.all([
        getProjectAlerts(projectId, user.email, filters),
        getAlertStats(projectId, user.email)
      ]);

      setAlerts(alertsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading alerts:', err);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  // Load alerts when panel opens or filters change
  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }
  }, [isOpen, projectId, user?.email, showDismissed, filterType, filterSeverity]);

  // Handle dismiss single alert
  const handleDismiss = async (alertId: string) => {
    if (!user?.email) return;

    try {
      await dismissAlert(alertId, user.email);
      // Reload alerts
      await loadAlerts();
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  };

  // Handle dismiss all alerts
  const handleDismissAll = async () => {
    if (!user?.email || alerts.length === 0) return;

    const undismissedAlerts = alerts.filter(a => !a.dismissed);
    if (undismissedAlerts.length === 0) return;

    if (!confirm(`Dismiss all ${undismissedAlerts.length} alerts?`)) return;

    try {
      const alertIds = undismissedAlerts.map(a => a.alert_id);
      await dismissAlertsBatch(alertIds, user.email);
      // Reload alerts
      await loadAlerts();
    } catch (err) {
      console.error('Error dismissing all alerts:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-[#121212] border-l border-gray-800 z-50 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Alerts</h2>
              {stats && (
                <p className="text-sm text-gray-400">
                  {stats.unread_alerts} unread • {stats.action_required_count} action required
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-4 gap-2 p-4 bg-white/5 border-b border-gray-800">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.total_alerts}</div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.unread_alerts}</div>
              <div className="text-xs text-gray-400">Unread</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{stats.action_required_count}</div>
              <div className="text-xs text-gray-400">Action</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {stats.by_severity.critical || 0}
              </div>
              <div className="text-xs text-gray-400">Critical</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="p-4 border-b border-gray-800 space-y-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Filters</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Type Filter */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="high_impact_paper">High Impact</option>
                <option value="contradicting_evidence">Contradiction</option>
                <option value="gap_identified">Research Gap</option>
                <option value="new_paper">New Paper</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Severity</label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Show Dismissed Toggle */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showDismissed}
              onChange={(e) => setShowDismissed(e.target.checked)}
              className="w-4 h-4 rounded border-gray-700 bg-white/5 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-300">Show dismissed alerts</span>
          </label>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <button
            onClick={loadAlerts}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>

          <button
            onClick={handleDismissAll}
            disabled={loading || alerts.filter(a => !a.dismissed).length === 0}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Dismiss All</span>
          </button>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && alerts.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                <p className="text-gray-400">Loading alerts...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-400 mb-2">{error}</p>
                <button
                  onClick={loadAlerts}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg font-medium mb-2">No alerts</p>
                <p className="text-gray-500 text-sm">
                  {showDismissed
                    ? 'No alerts found with current filters'
                    : 'You\'re all caught up! 🎉'
                  }
                </p>
              </div>
            </div>
          ) : (
            alerts.map((alert) => (
              <AlertCard
                key={alert.alert_id}
                alert={alert}
                onDismiss={handleDismiss}
                onViewPaper={onViewPaper}
                className={alert.dismissed ? 'opacity-50' : ''}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

