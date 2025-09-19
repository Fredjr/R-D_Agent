import React, { memo, useMemo } from 'react';

// Data source types and their visual properties
export interface DataSource {
  type: 'backend' | 'pubmed' | 'collection' | 'report' | 'analysis';
  subtype?: string;
  confidence?: number;
  lastUpdated?: string;
}

interface SourceConfig {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

const SOURCE_CONFIGS: Record<string, SourceConfig> = {
  backend: {
    icon: '🏢',
    label: 'Backend',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    description: 'Data from internal database'
  },
  pubmed: {
    icon: '🧬',
    label: 'PubMed',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    description: 'Real-time data from PubMed database'
  },
  collection: {
    icon: '📁',
    label: 'Collection',
    color: 'text-purple-800',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    description: 'Curated collection data'
  },
  report: {
    icon: '📊',
    label: 'Report',
    color: 'text-orange-800',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
    description: 'Generated from analysis reports'
  },
  analysis: {
    icon: '🔬',
    label: 'Analysis',
    color: 'text-indigo-800',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-200',
    description: 'AI-generated analysis data'
  }
};

// Basic source indicator badge
interface SourceBadgeProps {
  source: DataSource;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export const SourceBadge = memo<SourceBadgeProps>(({
  source,
  size = 'md',
  showLabel = true,
  showTooltip = true,
  className = ''
}) => {
  const config = SOURCE_CONFIGS[source.type] || SOURCE_CONFIGS.backend;
  
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  const badge = (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${config.bgColor} ${config.color} ${config.borderColor}
        ${sizeClasses[size]} ${className}
        border transition-all duration-200 hover:shadow-sm
      `}
    >
      <span className="mr-1">{config.icon}</span>
      {showLabel && config.label}
      {source.subtype && (
        <span className="ml-1 opacity-75">({source.subtype})</span>
      )}
    </span>
  );

  if (!showTooltip) return badge;

  return (
    <div className="group relative">
      {badge}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        <div className="font-medium">{config.label}</div>
        <div className="text-gray-300">{config.description}</div>
        {source.lastUpdated && (
          <div className="text-gray-400 text-xs mt-1">
            Updated: {new Date(source.lastUpdated).toLocaleDateString()}
          </div>
        )}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
});

SourceBadge.displayName = 'SourceBadge';

// Confidence indicator
interface ConfidenceIndicatorProps {
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
}

export const ConfidenceIndicator = memo<ConfidenceIndicatorProps>(({
  confidence,
  size = 'md',
  showPercentage = false
}) => {
  const confidenceColor = useMemo(() => {
    if (confidence >= 90) return 'text-green-600 bg-green-100';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-100';
    if (confidence >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  }, [confidence]);

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const bars = Math.ceil(confidence / 25);

  return (
    <div className="flex items-center space-x-1">
      <div className="flex space-x-0.5">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`
              ${sizeClasses[size]} rounded-sm
              ${bar <= bars ? confidenceColor : 'bg-gray-200'}
            `}
          />
        ))}
      </div>
      {showPercentage && (
        <span className={`text-xs font-medium ${confidenceColor.split(' ')[0]}`}>
          {confidence}%
        </span>
      )}
    </div>
  );
});

ConfidenceIndicator.displayName = 'ConfidenceIndicator';

// Network node source overlay
interface NodeSourceOverlayProps {
  source: DataSource;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showConfidence?: boolean;
}

export const NodeSourceOverlay = memo<NodeSourceOverlayProps>(({
  source,
  position = 'top-right',
  showConfidence = false
}) => {
  const config = SOURCE_CONFIGS[source.type] || SOURCE_CONFIGS.backend;
  
  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2'
  };

  return (
    <div className={`absolute ${positionClasses[position]} z-10`}>
      <div className="flex items-center space-x-1">
        <div
          className={`
            w-6 h-6 rounded-full flex items-center justify-center text-xs
            ${config.bgColor} ${config.borderColor} border-2
            shadow-sm backdrop-blur-sm
          `}
          title={`${config.label}: ${config.description}`}
        >
          {config.icon}
        </div>
        {showConfidence && source.confidence && (
          <ConfidenceIndicator confidence={source.confidence} size="sm" />
        )}
      </div>
    </div>
  );
});

NodeSourceOverlay.displayName = 'NodeSourceOverlay';

// Data freshness indicator
interface FreshnessIndicatorProps {
  lastUpdated: string;
  maxAge?: number; // in hours
}

export const FreshnessIndicator = memo<FreshnessIndicatorProps>(({
  lastUpdated,
  maxAge = 24
}) => {
  const { status, color, icon, message } = useMemo(() => {
    const now = new Date();
    const updated = new Date(lastUpdated);
    const hoursOld = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);

    if (hoursOld < 1) {
      return {
        status: 'fresh',
        color: 'text-green-600 bg-green-100',
        icon: '🟢',
        message: 'Just updated'
      };
    } else if (hoursOld < maxAge) {
      return {
        status: 'recent',
        color: 'text-blue-600 bg-blue-100',
        icon: '🔵',
        message: `${Math.round(hoursOld)}h ago`
      };
    } else if (hoursOld < maxAge * 7) {
      return {
        status: 'stale',
        color: 'text-yellow-600 bg-yellow-100',
        icon: '🟡',
        message: `${Math.round(hoursOld / 24)}d ago`
      };
    } else {
      return {
        status: 'old',
        color: 'text-red-600 bg-red-100',
        icon: '🔴',
        message: 'Outdated'
      };
    }
  }, [lastUpdated, maxAge]);

  return (
    <div className="group relative">
      <span
        className={`
          inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
          ${color} transition-all duration-200 hover:shadow-sm cursor-help
        `}
      >
        <span className="mr-1">{icon}</span>
        {message}
      </span>
      
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        <div className="font-medium">Last Updated</div>
        <div className="text-gray-300">{new Date(lastUpdated).toLocaleString()}</div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
});

FreshnessIndicator.displayName = 'FreshnessIndicator';

// Combined source information panel
interface SourceInfoPanelProps {
  sources: DataSource[];
  className?: string;
}

export const SourceInfoPanel = memo<SourceInfoPanelProps>(({
  sources,
  className = ''
}) => {
  const sourceCounts = useMemo(() => {
    return sources.reduce((acc, source) => {
      acc[source.type] = (acc[source.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [sources]);

  const totalSources = sources.length;
  const avgConfidence = useMemo(() => {
    const confidences = sources.filter(s => s.confidence).map(s => s.confidence!);
    return confidences.length > 0 
      ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
      : null;
  }, [sources]);

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Data Sources</h3>
      
      <div className="space-y-3">
        {Object.entries(sourceCounts).map(([type, count]) => {
          const config = SOURCE_CONFIGS[type];
          const percentage = (count / totalSources) * 100;
          
          return (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm">{config.icon}</span>
                <span className="text-sm font-medium text-gray-700">
                  {config.label}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${config.bgColor.replace('bg-', 'bg-opacity-60 bg-')}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-8 text-right">
                  {count}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {avgConfidence && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Avg. Confidence</span>
            <ConfidenceIndicator 
              confidence={Math.round(avgConfidence)} 
              showPercentage 
            />
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Total: {totalSources} data points
        </div>
      </div>
    </div>
  );
});

SourceInfoPanel.displayName = 'SourceInfoPanel';

// Hook for managing data source information
export const useDataSources = () => {
  const [sources, setSources] = React.useState<DataSource[]>([]);

  const addSource = React.useCallback((source: DataSource) => {
    setSources(prev => [...prev, source]);
  }, []);

  const removeSource = React.useCallback((index: number) => {
    setSources(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateSource = React.useCallback((index: number, updates: Partial<DataSource>) => {
    setSources(prev => prev.map((source, i) => 
      i === index ? { ...source, ...updates } : source
    ));
  }, []);

  const clearSources = React.useCallback(() => {
    setSources([]);
  }, []);

  const getSourcesByType = React.useCallback((type: string) => {
    return sources.filter(source => source.type === type);
  }, [sources]);

  return {
    sources,
    addSource,
    removeSource,
    updateSource,
    clearSources,
    getSourcesByType
  };
};
