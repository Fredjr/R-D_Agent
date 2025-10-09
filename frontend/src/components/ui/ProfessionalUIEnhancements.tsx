/**
 * Professional UI Enhancements v1.0
 * 
 * Comprehensive professional UI components addressing integration test findings:
 * - Enhanced loading states with skeleton animations
 * - Professional error handling with retry buttons
 * - Responsive design components
 * - Interactive elements with smooth animations
 * - PhD-level quality indicators
 */

import React, { useState, useEffect, memo } from 'react';
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SparklesIcon,
  AcademicCapIcon,
  BeakerIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

// =============================================================================
// Enhanced Loading States with Beautiful Skeleton Animations
// =============================================================================

interface SkeletonProps {
  className?: string;
  animated?: boolean;
}

const ProfessionalSkeleton = memo<SkeletonProps>(({ className = '', animated = true }) => (
  <div
    className={`bg-gray-200 rounded ${animated ? 'animate-pulse' : ''} ${className}`}
    style={{ minHeight: '1rem' }}
  />
));

ProfessionalSkeleton.displayName = 'ProfessionalSkeleton';

const PhDAnalysisLoadingSkeleton = memo(() => (
  <div className="w-full space-y-6 p-6 bg-white rounded-lg border border-gray-200">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <ProfessionalSkeleton className="w-8 h-8 rounded-full" />
        <ProfessionalSkeleton className="w-48 h-6" />
      </div>
      <ProfessionalSkeleton className="w-24 h-8 rounded-md" />
    </div>

    {/* Progress indicator */}
    <div className="space-y-2">
      <div className="flex justify-between">
        <ProfessionalSkeleton className="w-32 h-4" />
        <ProfessionalSkeleton className="w-16 h-4" />
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '45%' }} />
      </div>
    </div>

    {/* Content sections */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-4 border border-gray-100 rounded-lg space-y-3">
          <ProfessionalSkeleton className="w-3/4 h-5" />
          <ProfessionalSkeleton className="w-full h-4" />
          <ProfessionalSkeleton className="w-5/6 h-4" />
          <div className="flex justify-between items-center">
            <ProfessionalSkeleton className="w-20 h-6 rounded-full" />
            <ProfessionalSkeleton className="w-16 h-4" />
          </div>
        </div>
      ))}
    </div>

    {/* Action buttons */}
    <div className="flex justify-center space-x-3">
      <ProfessionalSkeleton className="w-32 h-10 rounded-md" />
      <ProfessionalSkeleton className="w-28 h-10 rounded-md" />
    </div>
  </div>
));

PhDAnalysisLoadingSkeleton.displayName = 'PhDAnalysisLoadingSkeleton';

// =============================================================================
// Professional Error Handling with Retry Buttons
// =============================================================================

interface ErrorDisplayProps {
  error: string | Error;
  onRetry?: () => void;
  retryLabel?: string;
  showDetails?: boolean;
  className?: string;
  type?: 'error' | 'warning' | 'info';
}

const ProfessionalErrorDisplay = memo<ErrorDisplayProps>(({
  error,
  onRetry,
  retryLabel = 'Try Again',
  showDetails = false,
  className = '',
  type = 'error'
}) => {
  const [showFullError, setShowFullError] = useState(false);
  
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'object' ? error.stack : undefined;
  
  const typeConfig = {
    error: {
      icon: XCircleIcon,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-500',
      textColor: 'text-red-800',
      buttonColor: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-500',
      textColor: 'text-yellow-800',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
    },
    info: {
      icon: InformationCircleIcon,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-500',
      textColor: 'text-blue-800',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    }
  };
  
  const config = typeConfig[type];
  const Icon = config.icon;
  
  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-6 ${className}`}>
      <div className="flex items-start space-x-3">
        <Icon className={`w-6 h-6 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium ${config.textColor}`}>
            {type === 'error' ? 'Something went wrong' : 
             type === 'warning' ? 'Warning' : 'Information'}
          </h3>
          <p className={`mt-1 text-sm ${config.textColor} opacity-90`}>
            {errorMessage}
          </p>
          
          {showDetails && errorStack && (
            <div className="mt-3">
              <button
                onClick={() => setShowFullError(!showFullError)}
                className={`text-xs ${config.textColor} hover:underline flex items-center`}
              >
                {showFullError ? <ChevronDownIcon className="w-3 h-3 mr-1" /> : <ChevronRightIcon className="w-3 h-3 mr-1" />}
                {showFullError ? 'Hide' : 'Show'} technical details
              </button>
              
              {showFullError && (
                <pre className={`mt-2 text-xs ${config.textColor} opacity-75 bg-white bg-opacity-50 p-2 rounded overflow-x-auto`}>
                  {errorStack}
                </pre>
              )}
            </div>
          )}
          
          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium text-white ${config.buttonColor} rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50`}
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                {retryLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ProfessionalErrorDisplay.displayName = 'ProfessionalErrorDisplay';

// =============================================================================
// Responsive Design Components
// =============================================================================

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const ResponsiveContainer = memo<ResponsiveContainerProps>(({
  children,
  className = '',
  maxWidth = 'xl',
  padding = 'md'
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };
  
  const paddingClasses = {
    none: '',
    sm: 'px-2 sm:px-4',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12'
  };
  
  return (
    <div className={`w-full ${maxWidthClasses[maxWidth]} mx-auto ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
});

ResponsiveContainer.displayName = 'ResponsiveContainer';

// =============================================================================
// Interactive Elements with Smooth Animations
// =============================================================================

interface ExpandableCardProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  className?: string;
}

const ExpandableCard = memo<ExpandableCardProps>(({
  title,
  children,
  defaultExpanded = false,
  icon: Icon,
  badge,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
      >
        <div className="flex items-center space-x-3">
          {Icon && <Icon className="w-5 h-5 text-gray-500" />}
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {badge && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {badge}
            </span>
          )}
        </div>
        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        </div>
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
});

ExpandableCard.displayName = 'ExpandableCard';

// =============================================================================
// PhD-Level Quality Indicators
// =============================================================================

interface QualityIndicatorProps {
  score: number;
  maxScore?: number;
  label?: string;
  showDetails?: boolean;
  className?: string;
}

const PhDQualityIndicator = memo<QualityIndicatorProps>(({
  score,
  maxScore = 10,
  label = 'Quality Score',
  showDetails = true,
  className = ''
}) => {
  const percentage = (score / maxScore) * 100;
  const isPhDLevel = score >= 8.0;
  const isExcellent = score >= 9.0;
  
  const getQualityColor = () => {
    if (isExcellent) return 'text-green-600 bg-green-100';
    if (isPhDLevel) return 'text-blue-600 bg-blue-100';
    if (score >= 7.0) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };
  
  const getQualityLabel = () => {
    if (isExcellent) return 'Exceptional';
    if (isPhDLevel) return 'PhD-Level';
    if (score >= 7.0) return 'Good';
    if (score >= 5.0) return 'Developing';
    return 'Needs Work';
  };
  
  return (
    <div className={`p-4 bg-white border border-gray-200 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center space-x-2">
          {isPhDLevel && <AcademicCapIcon className="w-4 h-4 text-blue-600" />}
          <span className="text-lg font-bold text-gray-900">{score.toFixed(1)}/{maxScore}</span>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${
            isExcellent ? 'bg-green-500' : 
            isPhDLevel ? 'bg-blue-500' : 
            score >= 7.0 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {showDetails && (
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getQualityColor()}`}>
            {getQualityLabel()}
          </span>
          <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
});

PhDQualityIndicator.displayName = 'PhDQualityIndicator';

// =============================================================================
// Professional Status Indicators
// =============================================================================

interface StatusIndicatorProps {
  status: 'loading' | 'success' | 'error' | 'warning' | 'processing';
  message?: string;
  showIcon?: boolean;
  className?: string;
}

const ProfessionalStatusIndicator = memo<StatusIndicatorProps>(({
  status,
  message,
  showIcon = true,
  className = ''
}) => {
  const statusConfig = {
    loading: {
      icon: SparklesIcon,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      message: message || 'Processing...'
    },
    success: {
      icon: CheckCircleIcon,
      color: 'text-green-600 bg-green-50 border-green-200',
      message: message || 'Completed successfully'
    },
    error: {
      icon: XCircleIcon,
      color: 'text-red-600 bg-red-50 border-red-200',
      message: message || 'An error occurred'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      message: message || 'Warning'
    },
    processing: {
      icon: BeakerIcon,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      message: message || 'Processing with AI...'
    }
  };
  
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <div className={`inline-flex items-center px-3 py-2 rounded-md border ${config.color} ${className}`}>
      {showIcon && (
        <Icon className={`w-4 h-4 mr-2 ${status === 'loading' || status === 'processing' ? 'animate-spin' : ''}`} />
      )}
      <span className="text-sm font-medium">{config.message}</span>
    </div>
  );
});

ProfessionalStatusIndicator.displayName = 'ProfessionalStatusIndicator';

// Export all components
export {
  ProfessionalSkeleton,
  PhDAnalysisLoadingSkeleton,
  ProfessionalErrorDisplay,
  ResponsiveContainer,
  ExpandableCard,
  PhDQualityIndicator,
  ProfessionalStatusIndicator
};
