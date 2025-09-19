import React, { memo, useEffect, useState } from 'react';

// Network loading skeleton
export const NetworkLoadingSkeleton = memo(() => {
  return (
    <div className="w-full h-full bg-gray-50 rounded-lg p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
        <div className="h-8 bg-gray-200 rounded w-32"></div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="flex justify-between">
              <div className="h-3 bg-gray-200 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-12"></div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center">
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  );
});

NetworkLoadingSkeleton.displayName = 'NetworkLoadingSkeleton';

// Progress bar component
interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'purple' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const ProgressBar = memo<ProgressBarProps>(({
  progress,
  label,
  showPercentage = true,
  color = 'blue',
  size = 'md',
  animated = true
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm text-gray-500">{Math.round(displayProgress)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-500 ease-out ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${Math.min(displayProgress, 100)}%` }}
        />
      </div>
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

// Loading spinner with customizable size and color
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'gray';
  label?: string;
}

export const LoadingSpinner = memo<LoadingSpinnerProps>(({
  size = 'md',
  color = 'blue',
  label
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    orange: 'text-orange-500',
    gray: 'text-gray-500'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <svg
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {label && <span className="text-sm text-gray-600">{label}</span>}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

// Network data loading progress
interface NetworkLoadingProgressProps {
  stage: 'fetching' | 'processing' | 'rendering' | 'complete';
  progress: number;
  details?: string;
  nodesLoaded?: number;
  totalNodes?: number;
}

export const NetworkLoadingProgress = memo<NetworkLoadingProgressProps>(({
  stage,
  progress,
  details,
  nodesLoaded = 0,
  totalNodes = 0
}) => {
  const stageLabels = {
    fetching: 'Fetching network data...',
    processing: 'Processing relationships...',
    rendering: 'Rendering network...',
    complete: 'Complete!'
  };

  const stageIcons = {
    fetching: '🔄',
    processing: '⚙️',
    rendering: '🎨',
    complete: '✅'
  };

  return (
    <div className="bg-white rounded-lg border p-6 max-w-md mx-auto">
      <div className="text-center mb-4">
        <div className="text-2xl mb-2">{stageIcons[stage]}</div>
        <h3 className="text-lg font-semibold text-gray-900">
          {stageLabels[stage]}
        </h3>
        {details && (
          <p className="text-sm text-gray-600 mt-1">{details}</p>
        )}
      </div>

      <ProgressBar
        progress={progress}
        color={stage === 'complete' ? 'green' : 'blue'}
        animated={stage !== 'complete'}
      />

      {totalNodes > 0 && (
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-600">
            Loaded {nodesLoaded} of {totalNodes} nodes
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {totalNodes - nodesLoaded} remaining
          </div>
        </div>
      )}

      {stage === 'complete' && (
        <div className="mt-4 text-center">
          <div className="text-sm text-green-600 font-medium">
            Network ready for exploration!
          </div>
        </div>
      )}
    </div>
  );
});

NetworkLoadingProgress.displayName = 'NetworkLoadingProgress';

// Collection loading states
export const CollectionLoadingSkeleton = memo(() => {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
});

CollectionLoadingSkeleton.displayName = 'CollectionLoadingSkeleton';

// Article loading skeleton
export const ArticleLoadingSkeleton = memo(() => {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
          <div className="space-y-3">
            <div className="h-5 bg-gray-200 rounded w-4/5"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="flex justify-between items-center">
              <div className="h-3 bg-gray-200 rounded w-24"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

ArticleLoadingSkeleton.displayName = 'ArticleLoadingSkeleton';

// Inline loading indicator for buttons
interface InlineLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  size?: 'sm' | 'md';
}

export const InlineLoading = memo<InlineLoadingProps>(({
  loading,
  children,
  loadingText = 'Loading...',
  size = 'sm'
}) => {
  if (!loading) return <>{children}</>;

  return (
    <div className="flex items-center space-x-2">
      <LoadingSpinner size={size} color="gray" />
      <span>{loadingText}</span>
    </div>
  );
});

InlineLoading.displayName = 'InlineLoading';

// Loading overlay for full-screen loading
interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  progress?: number;
  onCancel?: () => void;
}

export const LoadingOverlay = memo<LoadingOverlayProps>(({
  visible,
  message = 'Loading...',
  progress,
  onCancel
}) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
        <div className="text-center">
          <LoadingSpinner size="xl" color="blue" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            {message}
          </h3>
          
          {progress !== undefined && (
            <div className="mt-4">
              <ProgressBar progress={progress} showPercentage />
            </div>
          )}
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="mt-6 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

LoadingOverlay.displayName = 'LoadingOverlay';

// Hook for managing loading states
export const useLoadingState = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const startLoading = (initialStage = '') => {
    setLoading(true);
    setProgress(0);
    setStage(initialStage);
    setError(null);
  };

  const updateProgress = (newProgress: number, newStage?: string) => {
    setProgress(Math.min(Math.max(newProgress, 0), 100));
    if (newStage) setStage(newStage);
  };

  const finishLoading = () => {
    setProgress(100);
    setTimeout(() => {
      setLoading(false);
      setProgress(0);
      setStage('');
    }, 500);
  };

  const setLoadingError = (errorMessage: string) => {
    setError(errorMessage);
    setLoading(false);
  };

  return {
    loading,
    progress,
    stage,
    error,
    startLoading,
    updateProgress,
    finishLoading,
    setLoadingError
  };
};
