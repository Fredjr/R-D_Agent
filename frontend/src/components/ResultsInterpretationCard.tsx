import React from 'react';
import { ChartBarIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface FactAnchor {
  claim: string;
  evidence: {
    title: string;
    year?: number;
    pmid?: string;
    quote: string;
  };
}

interface StatisticalResult {
  metric: string;
  value: string;
  unit: string;
  effect_size: string;
  p_value: string;
  fdr: string;
  ci: string;
  direction: string;
  figure_table_ref: string;
}

interface ResultsInterpretationData {
  hypothesis_alignment: string;
  key_results: StatisticalResult[];
  limitations_biases_in_results: string[];
  // Enhanced fields from new backend
  clinical_significance?: string;
  reproducibility_assessment?: string;
  fact_anchors: FactAnchor[];
}

interface ResultsInterpretationCardProps {
  data: ResultsInterpretationData;
  className?: string;
}

export default function ResultsInterpretationCard({ data, className = '' }: ResultsInterpretationCardProps) {
  const getAlignmentColor = (alignment: string) => {
    const lower = alignment.toLowerCase();
    if (lower.includes('confirm')) {
      return 'bg-green-100 text-green-800';
    }
    if (lower.includes('contradict')) {
      return 'bg-red-100 text-red-800';
    }
    if (lower.includes('partial')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <ChartBarIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Results Interpretation</h3>
            <p className="text-sm text-gray-600">Statistical analysis and hypothesis alignment</p>
          </div>
        </div>

        {/* Hypothesis Alignment */}
        {data.hypothesis_alignment && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Hypothesis Alignment</label>
            <div className="p-4 bg-gray-50 rounded-lg">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${getAlignmentColor(data.hypothesis_alignment)}`}>
                {data.hypothesis_alignment.split(':')[0] || data.hypothesis_alignment}
              </span>
              {data.hypothesis_alignment.includes(':') && (
                <p className="text-sm text-gray-900 mt-2">
                  {data.hypothesis_alignment.split(':').slice(1).join(':').trim()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Statistical Results Table */}
        {data.key_results && data.key_results.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Key Statistical Results</label>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-2 px-3 font-medium text-gray-900">Metric</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900">Value</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900">P-value</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900">CI</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900">Effect Size</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {data.key_results.map((result, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-medium text-gray-900">{result.metric || 'N/A'}</td>
                      <td className="py-2 px-3 text-gray-700">
                        {result.value || 'N/A'} {result.unit}
                      </td>
                      <td className="py-2 px-3 text-gray-700">{result.p_value || 'N/A'}</td>
                      <td className="py-2 px-3 text-gray-700">{result.ci || 'N/A'}</td>
                      <td className="py-2 px-3 text-gray-700">{result.effect_size || 'N/A'}</td>
                      <td className="py-2 px-3 text-gray-700">{result.figure_table_ref || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Enhanced Fields from New Backend */}
        {/* Clinical Significance */}
        {data.clinical_significance && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircleIcon className="h-5 w-5 text-blue-600" />
              <label className="block text-sm font-medium text-gray-700">Clinical Significance</label>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <p className="text-sm text-gray-900">{data.clinical_significance}</p>
            </div>
          </div>
        )}

        {/* Reproducibility Assessment */}
        {data.reproducibility_assessment && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <ChartBarIcon className="h-5 w-5 text-purple-600" />
              <label className="block text-sm font-medium text-gray-700">Reproducibility Assessment</label>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
              <p className="text-sm text-gray-900">{data.reproducibility_assessment}</p>
            </div>
          </div>
        )}

        {/* Limitations and Biases */}
        {data.limitations_biases_in_results && data.limitations_biases_in_results.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
              <label className="block text-sm font-medium text-gray-700">Limitations & Biases in Results</label>
            </div>
            <div className="space-y-2">
              {data.limitations_biases_in_results.map((limitation, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">{limitation}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fact Anchors */}
        {data.fact_anchors && data.fact_anchors.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Supporting Evidence</label>
            <div className="space-y-3">
              {data.fact_anchors.map((anchor, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-2">{anchor.claim}</p>
                  <div className="text-xs text-gray-600">
                    {anchor.evidence.title && (
                      <p><strong>Title:</strong> {anchor.evidence.title}</p>
                    )}
                    {anchor.evidence.year && (
                      <p><strong>Year:</strong> {anchor.evidence.year}</p>
                    )}
                    {anchor.evidence.pmid && (
                      <p><strong>PMID:</strong> {anchor.evidence.pmid}</p>
                    )}
                    {anchor.evidence.quote && (
                      <p className="mt-1 italic">"{anchor.evidence.quote}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!data.key_results || data.key_results.length === 0) && 
         (!data.limitations_biases_in_results || data.limitations_biases_in_results.length === 0) &&
         (!data.fact_anchors || data.fact_anchors.length === 0) && 
         !data.hypothesis_alignment && (
          <div className="text-center py-8">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No results interpretation data available</p>
          </div>
        )}
      </div>
    </div>
  );
}