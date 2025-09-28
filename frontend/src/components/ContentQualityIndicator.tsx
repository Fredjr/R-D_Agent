import React from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

interface ContentQualityData {
  content_quality?: string;
  grounding_source?: string;
  grounding?: string;
  ingested_chars?: number;
  user_notice?: string;
  content_quality_score?: number;
  quality_issues?: string[];
}

interface ContentQualityIndicatorProps {
  data: ContentQualityData;
  className?: string;
}

export default function ContentQualityIndicator({ data, className = '' }: ContentQualityIndicatorProps) {
  if (!data) return null;

  const getQualityColor = (quality: string) => {
    switch (quality?.toLowerCase()) {
      case 'full_text':
      case 'excellent':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'good':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair':
      case 'abstract_only':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'unusable':
      case 'none':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getQualityIcon = (quality: string) => {
    switch (quality?.toLowerCase()) {
      case 'full_text':
      case 'excellent':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'good':
      case 'fair':
      case 'abstract_only':
        return <InformationCircleIcon className="h-4 w-4" />;
      case 'poor':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'unusable':
      case 'none':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <InformationCircleIcon className="h-4 w-4" />;
    }
  };

  const quality = data.content_quality || data.grounding || 'unknown';
  const qualityColorClass = getQualityColor(quality);
  const qualityIcon = getQualityIcon(quality);

  return (
    <div className={`${className}`}>
      {/* Main Quality Indicator */}
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${qualityColorClass}`}>
        {qualityIcon}
        <span>
          {quality === 'full_text' ? 'Full Text Analysis' : 
           quality === 'abstract_only' ? 'Abstract Only' :
           quality === 'excellent' ? 'Excellent Quality' :
           quality === 'good' ? 'Good Quality' :
           quality === 'fair' ? 'Fair Quality' :
           quality === 'poor' ? 'Poor Quality' :
           quality === 'unusable' ? 'Unusable Content' :
           'Unknown Quality'}
        </span>
        
        {/* Source indicator */}
        {data.grounding_source && (
          <span className="text-xs opacity-75">
            · {data.grounding_source.toUpperCase()}
          </span>
        )}
      </div>

      {/* Additional Details */}
      <div className="mt-2 space-y-1">
        {/* Content Length */}
        {data.ingested_chars && (
          <div className="text-xs text-gray-600">
            Content: {data.ingested_chars.toLocaleString()} characters
          </div>
        )}

        {/* Quality Score */}
        {data.content_quality_score !== undefined && (
          <div className="text-xs text-gray-600">
            Quality Score: {data.content_quality_score}/100
          </div>
        )}

        {/* User Notice */}
        {data.user_notice && (
          <div className="text-xs text-gray-700 bg-gray-100 rounded px-2 py-1">
            {data.user_notice}
          </div>
        )}

        {/* Quality Issues */}
        {data.quality_issues && data.quality_issues.length > 0 && (
          <div className="text-xs">
            <div className="text-gray-600 mb-1">Issues detected:</div>
            <ul className="space-y-1">
              {data.quality_issues.map((issue, index) => (
                <li key={index} className="text-red-600 flex items-start gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
