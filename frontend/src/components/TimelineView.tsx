'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart3,
  Zap
} from 'lucide-react';

interface TimelineArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  citation_count: number;
  url: string;
}

interface TimelinePeriod {
  start_year: number;
  end_year: number;
  label: string;
  total_articles: number;
  avg_citations: number;
  top_journals: string[];
  key_authors: string[];
  research_trends: string[];
  articles: TimelineArticle[];
}

interface TimelineData {
  periods: TimelinePeriod[];
  total_articles: number;
  year_range: [number, number];
  citation_trends: Record<number, number>;
  research_evolution: Record<string, Record<number, number>>;
  key_milestones: Array<{
    type: string;
    year: number;
    title?: string;
    pmid?: string;
    citation_count?: number;
    description: string;
  }>;
}

interface TimelineViewProps {
  pmid?: string;
  projectId?: string;
  onArticleSelect?: (article: TimelineArticle) => void;
  className?: string;
}

export default function TimelineView({ 
  pmid, 
  projectId, 
  onArticleSelect,
  className = "" 
}: TimelineViewProps) {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimelinePeriod | null>(null);
  const [periodStrategy, setPeriodStrategy] = useState<'decade' | 'lustrum' | 'triennium' | 'annual'>('lustrum');
  const [showMilestones, setShowMilestones] = useState(true);
  const [currentPeriodIndex, setCurrentPeriodIndex] = useState(0);

  // Fetch timeline data
  useEffect(() => {
    const fetchTimelineData = async () => {
      if (!pmid && !projectId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const endpoint = pmid 
          ? `/api/proxy/articles/${pmid}/timeline`
          : `/api/proxy/projects/${projectId}/timeline`;
        
        const params = new URLSearchParams({
          period_strategy: periodStrategy,
          min_articles: pmid ? '1' : '2'
        });
        
        const response = await fetch(`${endpoint}?${params}`, {
          headers: {
            'User-ID': 'timeline_user',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch timeline data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setTimelineData(data.timeline_data);
        
        // Auto-select first period if available
        if (data.timeline_data.periods.length > 0) {
          setSelectedPeriod(data.timeline_data.periods[0]);
          setCurrentPeriodIndex(0);
        }
        
      } catch (err) {
        console.error('Timeline fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load timeline data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimelineData();
  }, [pmid, projectId, periodStrategy]);

  // Navigate between periods
  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (!timelineData?.periods) return;
    
    const newIndex = direction === 'prev' 
      ? Math.max(0, currentPeriodIndex - 1)
      : Math.min(timelineData.periods.length - 1, currentPeriodIndex + 1);
    
    setCurrentPeriodIndex(newIndex);
    setSelectedPeriod(timelineData.periods[newIndex]);
  };

  // Calculate period width for visualization
  const periodWidths = useMemo(() => {
    if (!timelineData?.periods) return [];
    
    const maxArticles = Math.max(...timelineData.periods.map(p => p.total_articles));
    return timelineData.periods.map(period => ({
      ...period,
      width: Math.max(20, (period.total_articles / maxArticles) * 100)
    }));
  }, [timelineData]);

  // Get milestone for year
  const getMilestonesForYear = (year: number) => {
    return timelineData?.key_milestones.filter(m => m.year === year) || [];
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 animate-spin" />
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
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <div className="text-gray-600">No timeline data available</div>
          <div className="text-sm text-gray-500">Try adjusting the period strategy or adding more articles</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Timeline Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Research Timeline</span>
              <Badge variant="secondary">
                {timelineData.total_articles} articles
              </Badge>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMilestones(!showMilestones)}
                title={showMilestones ? "Hide milestones" : "Show milestones"}
              >
                <Zap className="h-4 w-4 mr-1" />
                Milestones
              </Button>
              
              <select
                value={periodStrategy}
                onChange={(e) => setPeriodStrategy(e.target.value as any)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="decade">Decades</option>
                <option value="lustrum">5 Years</option>
                <option value="triennium">3 Years</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Timeline Visualization */}
          <div className="relative">
            {/* Timeline Bar */}
            <div className="flex items-center space-x-1 mb-4 overflow-x-auto pb-2">
              {periodWidths.map((period, index) => (
                <div
                  key={period.label}
                  className={`relative cursor-pointer transition-all duration-200 ${
                    selectedPeriod?.label === period.label
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  style={{ 
                    width: `${period.width}px`,
                    minWidth: '40px',
                    height: '40px'
                  }}
                  onClick={() => {
                    setSelectedPeriod(period);
                    setCurrentPeriodIndex(index);
                  }}
                  title={`View ${period.label} period (${period.total_articles} articles)`}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-xs">
                    <div className="font-medium">{period.label}</div>
                    <div className="text-xs opacity-75">{period.total_articles}</div>
                  </div>
                  
                  {/* Milestones indicators */}
                  {showMilestones && getMilestonesForYear(period.start_year).length > 0 && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <Zap className="h-3 w-3 text-yellow-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Period Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigatePeriod('prev')}
                disabled={currentPeriodIndex === 0}
                title="Navigate to previous time period"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="text-center">
                <div className="font-medium">{selectedPeriod?.label}</div>
                <div className="text-sm text-gray-600">
                  {selectedPeriod?.total_articles} articles • Avg {selectedPeriod?.avg_citations.toFixed(1)} citations
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigatePeriod('next')}
                disabled={currentPeriodIndex === timelineData.periods.length - 1}
                title="Navigate to next time period"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Period Details */}
      {selectedPeriod && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Period Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Period Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Research Trends</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedPeriod.research_trends.slice(0, 5).map((trend, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {trend}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600">Top Journals</div>
                <div className="space-y-1 mt-1">
                  {selectedPeriod.top_journals.slice(0, 3).map((journal, index) => (
                    <div key={index} className="text-sm">{journal}</div>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600">Key Authors</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedPeriod.key_authors.slice(0, 4).map((author, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {author}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Articles List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Articles ({selectedPeriod.total_articles})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {selectedPeriod.articles.map((article, index) => (
                    <div
                      key={article.pmid}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => onArticleSelect?.(article)}
                      title={`Select article: ${article.title}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1 line-clamp-2">
                            {article.title}
                          </div>
                          <div className="text-xs text-gray-600 mb-2">
                            {article.authors.slice(0, 3).join(', ')}
                            {article.authors.length > 3 && ` +${article.authors.length - 3} more`}
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span>{article.journal}</span>
                            <span>{article.year}</span>
                            <span>{article.citation_count} citations</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {article.year}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Key Milestones */}
      {showMilestones && timelineData.key_milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Key Milestones</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timelineData.key_milestones.map((milestone, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Badge variant="secondary">{milestone.year}</Badge>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{milestone.description}</div>
                    {milestone.title && (
                      <div className="text-xs text-gray-600 mt-1">{milestone.title}</div>
                    )}
                    {milestone.citation_count && (
                      <div className="text-xs text-gray-500 mt-1">
                        {milestone.citation_count} citations
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
