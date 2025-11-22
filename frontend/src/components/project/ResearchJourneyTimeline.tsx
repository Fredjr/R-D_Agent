'use client';

import React, { useState } from 'react';
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

  const filteredEvents = filterTypes.size === 0
    ? events
    : events.filter(event => filterTypes.has(event.type));

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

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-700" />

        {/* Events */}
        <div className="space-y-4">
          {filteredEvents.map((event, index) => {
            const config = EVENT_CONFIG[event.type];
            const Icon = config.icon;
            const isExpanded = expandedEvents.has(event.id);
            const hasDetails = event.description || event.rationale || event.metadata;

            return (
              <div key={event.id} className="relative pl-16">
                {/* Icon */}
                <div className={`absolute left-3 w-6 h-6 rounded-full ${config.bgColor} ${config.borderColor} border-2 flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                </div>

                {/* Content Card */}
                <div className={`bg-gray-800/50 border ${config.borderColor} rounded-lg p-4 hover:bg-gray-800/70 transition-all cursor-pointer`}
                     onClick={() => hasDetails && toggleExpanded(event.id)}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                        {event.status && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                            {event.status}
                          </span>
                        )}
                        {event.score !== undefined && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            event.score >= 80 ? 'bg-green-500/20 text-green-400' :
                            event.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            Score: {event.score}
                          </span>
                        )}
                        {event.confidence !== undefined && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                            {event.confidence}% confidence
                          </span>
                        )}
                        {event.supports_hypothesis !== undefined && event.supports_hypothesis !== null && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            event.supports_hypothesis ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {event.supports_hypothesis ? '✓ Supports' : '✗ Refutes'}
                          </span>
                        )}
                        {event.confidence_change !== undefined && event.confidence_change !== null && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            event.confidence_change > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {event.confidence_change > 0 ? '+' : ''}{event.confidence_change}%
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-medium text-white truncate">{event.title}</h4>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-gray-400">{formatDate(event.timestamp)}</div>
                        <div className="text-xs text-gray-500">{formatTime(event.timestamp)}</div>
                      </div>
                      {hasDetails && (
                        isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && hasDetails && (
                    <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                      {event.description && (
                        <p className="text-sm text-gray-300">{event.description}</p>
                      )}
                      {event.rationale && (
                        <div className="bg-gray-900/50 rounded p-2">
                          <p className="text-xs text-gray-400 mb-1">Rationale:</p>
                          <p className="text-sm text-gray-300">{event.rationale}</p>
                        </div>
                      )}
                      {event.interpretation && (
                        <div className="bg-gray-900/50 rounded p-2">
                          <p className="text-xs text-gray-400 mb-1">Interpretation:</p>
                          <p className="text-sm text-gray-300">{event.interpretation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No events match the selected filters</p>
        </div>
      )}
    </div>
  );
}

