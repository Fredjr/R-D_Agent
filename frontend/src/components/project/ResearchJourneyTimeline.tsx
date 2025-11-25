'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, HelpCircle, Lightbulb, FileText, TestTube, Beaker, Zap, ChevronDown, ChevronRight, BarChart3 } from 'lucide-react';

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'question' | 'hypothesis' | 'paper' | 'protocol' | 'experiment' | 'decision' | 'result';
  title: string;
  description?: string;
  status?: string;
  rationale?: string;
  score?: number;
  confidence?: number;
  supports_hypothesis?: boolean | null;
  confidence_change?: number | null;
  interpretation?: string;
  metadata?: Record<string, any>;
}

interface TimelineGroup {
  date: string;
  displayDate: string;
  events: TimelineEvent[];
}

interface ResearchJourneyTimelineProps {
  events: TimelineEvent[];
  onEventClick?: (eventId: string, eventType: string) => void;
}

const EVENT_CONFIG = {
  question: {
    icon: HelpCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500',
    label: 'Question'
  },
  hypothesis: {
    icon: Lightbulb,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500',
    label: 'Hypothesis'
  },
  paper: {
    icon: FileText,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500',
    label: 'Paper'
  },
  protocol: {
    icon: TestTube,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500',
    label: 'Protocol'
  },
  experiment: {
    icon: Beaker,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500',
    label: 'Experiment'
  },
  result: {
    icon: BarChart3,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500',
    label: 'Result'
  },
  decision: {
    icon: Zap,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500',
    label: 'Decision'
  }
};

export default function ResearchJourneyTimeline({ events, onEventClick }: ResearchJourneyTimelineProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [filterTypes, setFilterTypes] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleExpanded = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const toggleFilter = (type: string) => {
    const newFilters = new Set(filterTypes);
    if (newFilters.has(type)) {
      newFilters.delete(type);
    } else {
      newFilters.add(type);
    }
    setFilterTypes(newFilters);
  };

  const toggleGroupCollapse = (dateKey: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(dateKey)) {
      newCollapsed.delete(dateKey);
    } else {
      newCollapsed.add(dateKey);
    }
    setCollapsedGroups(newCollapsed);
  };

  const filteredEvents = filterTypes.size === 0
    ? events
    : events.filter(event => filterTypes.has(event.type));

  // Group events by date
  const timelineGroups = useMemo(() => {
    const groups: { [key: string]: TimelineGroup } = {};

    // Sort events by timestamp (newest first)
    const sortedEvents = [...filteredEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    sortedEvents.forEach((event) => {
      const date = new Date(event.timestamp);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          displayDate: formatDateHeader(date),
          events: [],
        };
      }

      groups[dateKey].events.push(event);
    });

    return Object.values(groups);
  }, [filteredEvents]);

  const formatDateHeader = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateStr = date.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';

    // Check if within last 7 days
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }

    // Check if this year
    if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    }

    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return timestamp;
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(EVENT_CONFIG).map(([type, config]) => {
          const Icon = config.icon;
          const isActive = filterTypes.size === 0 || filterTypes.has(type);
          
          return (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                isActive
                  ? `${config.bgColor} ${config.borderColor} ${config.color}`
                  : 'bg-gray-800/50 border-gray-700 text-gray-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{config.label}</span>
              <span className="text-xs opacity-70">
                ({events.filter(e => e.type === type).length})
              </span>
            </button>
          );
        })}
      </div>

      {/* Timeline with Date Groups */}
      <div className="space-y-8">
        {timelineGroups.map((group, groupIndex) => {
          const isCollapsed = collapsedGroups.has(group.date);

          return (
            <div key={group.date} className="relative">
              {/* Date Header - Collapsible */}
              <button
                onClick={() => toggleGroupCollapse(group.date)}
                className="flex items-center gap-4 mb-6 w-full hover:opacity-80 transition-opacity group"
              >
                <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{group.displayDate}</h3>
                    {isCollapsed ? (
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    {group.events.length} event{group.events.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </button>

              {/* Events for this date - Collapsible */}
              {!isCollapsed && (
                <div className="ml-6 pl-10 border-l-2 border-gray-700 space-y-4">
                  {group.events.map((event, index) => {
                    const config = EVENT_CONFIG[event.type];
                    const Icon = config.icon;
                    const isExpanded = expandedEvents.has(event.id);
                    const hasDetails = event.description || event.rationale || event.metadata;

                    return (
                      <div key={event.id} className="relative">
                        {/* Timeline Connector */}
                        <div className="absolute -left-10 top-6 w-8 h-0.5 bg-gray-700" />

                        {/* Icon */}
                        <div className={`absolute -left-[52px] top-4 w-8 h-8 rounded-full ${config.bgColor} ${config.borderColor} border-2 flex items-center justify-center shadow-md`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>

                        {/* Time Badge */}
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-400">
                            {formatTime(event.timestamp)}
                          </span>
                        </div>

                        {/* Content Card */}
                        <div
                          className={`bg-gray-800/50 border ${config.borderColor} rounded-lg p-4 hover:bg-gray-800/70 transition-all ${hasDetails ? 'cursor-pointer' : ''}`}
                          onClick={() => hasDetails && toggleExpanded(event.id)}
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                                {event.status && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-200">
                                    {event.status}
                                  </span>
                                )}
                                {event.score !== undefined && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    event.score >= 80 ? 'bg-green-500/20 text-green-300' :
                                    event.score >= 50 ? 'bg-yellow-500/20 text-yellow-300' :
                                    'bg-red-500/20 text-red-300'
                                  }`}>
                                    Score: {event.score}
                                  </span>
                                )}
                                {event.confidence !== undefined && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                                    {event.confidence}% confidence
                                  </span>
                                )}
                                {event.supports_hypothesis !== undefined && event.supports_hypothesis !== null && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    event.supports_hypothesis ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                                  }`}>
                                    {event.supports_hypothesis ? '✓ Supports' : '✗ Refutes'}
                                  </span>
                                )}
                                {event.confidence_change !== undefined && event.confidence_change !== null && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    event.confidence_change > 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                                  }`}>
                                    {event.confidence_change > 0 ? '+' : ''}{event.confidence_change}%
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-medium text-white">{event.title}</h4>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {hasDetails && (
                                isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && hasDetails && (
                            <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                              {event.description && (
                                <p className="text-sm text-gray-300 leading-relaxed">{event.description}</p>
                              )}
                              {event.rationale && (
                                <div className="bg-gray-900/50 rounded-lg p-3">
                                  <p className="text-xs font-medium text-gray-400 mb-1">Rationale:</p>
                                  <p className="text-sm text-gray-200 leading-relaxed">{event.rationale}</p>
                                </div>
                              )}
                              {event.interpretation && (
                                <div className="bg-gray-900/50 rounded-lg p-3">
                                  <p className="text-xs font-medium text-gray-400 mb-1">Interpretation:</p>
                                  <p className="text-sm text-gray-200 leading-relaxed">{event.interpretation}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {timelineGroups.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400">No events match the selected filters</p>
        </div>
      )}
    </div>
  );
}

