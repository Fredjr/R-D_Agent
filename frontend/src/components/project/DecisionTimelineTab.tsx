"use client";

import React, { useState, useEffect } from 'react';
import {
  getDecisionTimeline,
  getProjectDecisions,
  deleteDecision,
  DecisionData,
  TimelineGrouping
} from '@/lib/api';
import DecisionCard from './DecisionCard';
import AddDecisionModal from './AddDecisionModal';

// User type from AuthContext
interface User {
  user_id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  category?: string;
  role?: string;
  institution?: string;
  subject_area?: string;
  created_at: string;
}

interface DecisionTimelineTabProps {
  projectId: string;
  user: User | null;
}

export default function DecisionTimelineTab({ projectId, user }: DecisionTimelineTabProps) {
  const [timelineData, setTimelineData] = useState<TimelineGrouping[]>([]);
  const [allDecisions, setAllDecisions] = useState<DecisionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [grouping, setGrouping] = useState<'month' | 'quarter' | 'year'>('month');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDecision, setEditingDecision] = useState<DecisionData | null>(null);

  // Load timeline data
  const loadTimeline = async () => {
    if (!user?.user_id) return;
    
    try {
      setLoading(true);
      const timeline = await getDecisionTimeline(projectId, user.user_id, grouping);
      setTimelineData(timeline);
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load all decisions (for list view)
  const loadAllDecisions = async () => {
    if (!user?.user_id) return;
    
    try {
      setLoading(true);
      const decisions = await getProjectDecisions(projectId, user.user_id, {
        decision_type: filterType === 'all' ? undefined : filterType,
        sort_by: 'date',
        order: 'desc',
      });
      setAllDecisions(decisions);
    } catch (error) {
      console.error('Error loading decisions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'timeline') {
      loadTimeline();
    } else {
      loadAllDecisions();
    }
  }, [projectId, user, viewMode, grouping, filterType]);

  const handleDelete = async (decisionId: string) => {
    if (!user?.user_id) return;
    
    if (!confirm('Are you sure you want to delete this decision?')) return;
    
    try {
      await deleteDecision(decisionId, user.user_id);
      console.log('✅ Decision deleted');
      
      // Reload data
      if (viewMode === 'timeline') {
        loadTimeline();
      } else {
        loadAllDecisions();
      }
    } catch (error) {
      console.error('Error deleting decision:', error);
    }
  };

  const handleEdit = (decision: DecisionData) => {
    setEditingDecision(decision);
    setShowAddModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setEditingDecision(null);
    
    // Reload data
    if (viewMode === 'timeline') {
      loadTimeline();
    } else {
      loadAllDecisions();
    }
  };

  // Get decision type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pivot': return '🔄';
      case 'methodology': return '🔬';
      case 'scope': return '🎯';
      case 'hypothesis': return '💡';
      default: return '📋';
    }
  };

  // Get decision type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pivot': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'methodology': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'scope': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'hypothesis': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Format period label
  const formatPeriod = (period: string) => {
    if (period.includes('Q')) {
      return period; // "2025-Q4"
    } else if (period.length === 4) {
      return period; // "2025"
    } else {
      // "2025-11" -> "November 2025"
      const [year, month] = period.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Decision Timeline</h2>
          <p className="text-gray-400 mt-1">Track research pivots, methodology changes, and key decisions</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium"
        >
          + Add Decision
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">View:</span>
          <div className="flex bg-black/40 rounded-lg p-1">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 rounded text-sm transition-all ${
                viewMode === 'timeline'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📅 Timeline
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm transition-all ${
                viewMode === 'list'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📋 List
            </button>
          </div>
        </div>

        {/* Grouping (Timeline only) */}
        {viewMode === 'timeline' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Group by:</span>
            <select
              value={grouping}
              onChange={(e) => setGrouping(e.target.value as 'month' | 'quarter' | 'year')}
              className="bg-black/40 border border-gray-700 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
              <option value="year">Year</option>
            </select>
          </div>
        )}

        {/* Filter by Type */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-black/40 border border-gray-700 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Types</option>
            <option value="pivot">🔄 Pivot</option>
            <option value="methodology">🔬 Methodology</option>
            <option value="scope">🎯 Scope</option>
            <option value="hypothesis">💡 Hypothesis</option>
            <option value="other">📋 Other</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      )}

      {/* Timeline View */}
      {!loading && viewMode === 'timeline' && (
        <div className="space-y-8">
          {timelineData.length === 0 ? (
            <div className="text-center py-12 bg-[#1a1a1a] border border-gray-800 rounded-lg">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Decisions Yet</h3>
              <p className="text-gray-400 mb-4">Start tracking your research decisions and pivots</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Your First Decision
              </button>
            </div>
          ) : (
            timelineData.map((group) => (
              <div key={group.period} className="space-y-4">
                {/* Period Header */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-full">
                    <span className="text-sm font-semibold text-purple-400">
                      {formatPeriod(group.period)}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({group.count} {group.count === 1 ? 'decision' : 'decisions'})
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                </div>

                {/* Decisions in this period */}
                <div className="space-y-4 pl-8 border-l-2 border-gray-800">
                  {group.decisions.map((decision) => (
                    <DecisionCard
                      key={decision.decision_id}
                      decision={decision}
                      onEdit={() => handleEdit(decision)}
                      onDelete={() => handleDelete(decision.decision_id)}
                      getTypeIcon={getTypeIcon}
                      getTypeColor={getTypeColor}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* List View */}
      {!loading && viewMode === 'list' && (
        <div className="space-y-4">
          {allDecisions.length === 0 ? (
            <div className="text-center py-12 bg-[#1a1a1a] border border-gray-800 rounded-lg">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Decisions Yet</h3>
              <p className="text-gray-400 mb-4">Start tracking your research decisions and pivots</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Your First Decision
              </button>
            </div>
          ) : (
            allDecisions.map((decision) => (
              <DecisionCard
                key={decision.decision_id}
                decision={decision}
                onEdit={() => handleEdit(decision)}
                onDelete={() => handleDelete(decision.decision_id)}
                getTypeIcon={getTypeIcon}
                getTypeColor={getTypeColor}
              />
            ))
          )}
        </div>
      )}

      {/* Add/Edit Decision Modal */}
      {showAddModal && (
        <AddDecisionModal
          projectId={projectId}
          user={user}
          decision={editingDecision}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

