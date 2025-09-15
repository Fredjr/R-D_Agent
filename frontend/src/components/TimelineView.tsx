'use client';

import React, { useState, useEffect } from 'react';

interface TimelineViewProps {
  pmid?: string;
  projectId?: string;
  className?: string;
}

interface TimelineData {
  periods: Array<{
    period_label: string;
    start_year: number;
    end_year: number;
    total_articles: number;
    average_citations: number;
  }>;
  total_articles: number;
  average_citations: number;
  unique_authors: number;
  time_span: string;
}

const TimelineView: React.FC<TimelineViewProps> = ({ 
  pmid, 
  projectId, 
  className = '' 
}) => {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodStrategy, setPeriodStrategy] = useState<'lustrum' | 'decade'>('lustrum');

  useEffect(() => {
    const fetchTimeline = async () => {
      if (!pmid && !projectId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const endpoint = pmid 
          ? `/api/proxy/articles/${pmid}/timeline`
          : `/api/proxy/projects/${projectId}/timeline`;
        
        const params = new URLSearchParams({
          period_strategy: periodStrategy,
          min_articles: '2'
        });
        
        const response = await fetch(`${endpoint}?${params}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch timeline: ${response.statusText}`);
        }
        
        const data = await response.json();
        setTimelineData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load timeline');
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [pmid, projectId, periodStrategy]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span>Loading timeline...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">Timeline Error</div>
          <div className="text-sm text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!timelineData || timelineData.periods.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-2">📅</div>
          <div className="text-gray-600">No timeline data available</div>
          <div className="text-sm text-gray-500">Try adjusting the period strategy or adding more articles</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`timeline-view w-full h-full bg-white ${className}`}>
      {/* Header */}
      <div className="mb-6 p-4 border rounded-lg bg-white shadow-sm">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">🕒</span>
              <h2 className="text-xl font-semibold">Research Timeline</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPeriodStrategy(periodStrategy === 'lustrum' ? 'decade' : 'lustrum')}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              >
                🔍 {periodStrategy === 'lustrum' ? '5-Year' : '10-Year'} View
              </button>
              <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                {timelineData.periods.length} periods
              </span>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600">📚</span>
            <div>
              <div className="text-sm text-gray-500">Total Articles</div>
              <div className="font-semibold">{timelineData.total_articles || 0}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-600">📈</span>
            <div>
              <div className="text-sm text-gray-500">Avg Citations</div>
              <div className="font-semibold">{timelineData.average_citations?.toFixed(1) || '0.0'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-600">👥</span>
            <div>
              <div className="text-sm text-gray-500">Unique Authors</div>
              <div className="font-semibold">{timelineData.unique_authors || 0}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-orange-600">📅</span>
            <div>
              <div className="text-sm text-gray-500">Time Span</div>
              <div className="font-semibold">{timelineData.time_span || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Periods */}
      <div className="space-y-4">
        {timelineData.periods.map((period, index) => (
          <div key={index} className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{period.period_label}</h3>
              <div className="text-sm text-gray-500">
                {period.start_year} - {period.end_year}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Articles:</span>
                <span className="ml-2 font-medium">{period.total_articles}</span>
              </div>
              <div>
                <span className="text-gray-600">Avg Citations:</span>
                <span className="ml-2 font-medium">{period.average_citations?.toFixed(1) || '0.0'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineView;
