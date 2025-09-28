import React from 'react';
import { AcademicCapIcon, BeakerIcon, ChartBarIcon, LinkIcon } from '@heroicons/react/24/outline';

interface FactAnchor {
  claim: string;
  evidence: {
    title: string;
    year?: number;
    pmid?: string;
    quote: string;
  };
}

interface ScientificModelData {
  model_type: string;
  study_design: string;
  population_description: string;
  protocol_summary: string;
  model_rationale: string;
  bias_assessment: string;
  strengths: string;
  limitations: string;
  // Enhanced fields from new backend
  translational_relevance?: string;
  sample_size_power?: string;
  randomization_blinding?: string;
  // Legacy fields for backward compatibility
  model_type_taxonomy?: string;
  study_design_taxonomy?: string;
  sample_size?: string;
  arms_groups?: string;
  blinding_randomization?: string;
  control_type?: string;
  collection_timepoints?: string;
  justification?: string;
  link_to_objective?: string;
  fact_anchors: FactAnchor[];
}

interface ScientificModelCardProps {
  data: ScientificModelData;
  className?: string;
}

export default function ScientificModelCard({ data, className = '' }: ScientificModelCardProps) {
  // Robust data handling
  const safeData = data || {};

  const splitStringToArray = (str: string): string[] => {
    if (!str) return [];
    // Try to split by common delimiters
    return str.split(/[;,\n]/).map(s => s.trim()).filter(s => s.length > 0);
  };

  // Helper function to safely get values
  const getValue = (key: keyof ScientificModelData, fallback: string = 'Not specified') => {
    const value = safeData[key];
    if (value === null || value === undefined || value === '') return fallback;
    return String(value);
  };

  // Helper function to safely get arrays
  const getArray = (key: keyof ScientificModelData): any[] => {
    const value = safeData[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return splitStringToArray(value);
      }
    }
    return [];
  };

  // Check if we have any meaningful data
  const hasData = Object.values(safeData).some(value =>
    value !== null && value !== undefined && value !== ''
  );

  if (!hasData) {
    return (
      <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
        <div className="p-6 text-center">
          <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No scientific model data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <AcademicCapIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Scientific Model Analysis</h3>
            <p className="text-sm text-gray-600">Study design and methodology assessment</p>
          </div>
        </div>

        {/* Study Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model Type</label>
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-sm">
                {getValue('model_type')}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Study Design</label>
              <p className="text-sm text-gray-900">{getValue('study_design')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sample Size</label>
              <p className="text-sm text-gray-900">{getValue('sample_size')}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Control Type</label>
              <span className="inline-block px-3 py-1 bg-green-50 text-green-800 rounded-full text-sm">
                {data.control_type || 'Not specified'}
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blinding/Randomization</label>
              <p className="text-sm text-gray-900">{data.blinding_randomization || 'Not specified'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Arms/Groups</label>
              <p className="text-sm text-gray-900">{data.arms_groups || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Population Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Population Description</label>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-900">{data.population_description}</p>
          </div>
        </div>

        {/* Protocol Summary */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Protocol Summary</label>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-900">{data.protocol_summary}</p>
          </div>
        </div>

        {/* Model Rationale */}
        {data.model_rationale && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Model Rationale</label>
            <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
              <p className="text-sm text-gray-900">{data.model_rationale}</p>
            </div>
          </div>
        )}

        {/* Enhanced Fields from New Backend */}
        {/* Translational Relevance */}
        {data.translational_relevance && data.translational_relevance !== 'Not evaluated' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Translational Relevance</label>
            <div className="p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-400">
              <p className="text-sm text-gray-900">{data.translational_relevance}</p>
            </div>
          </div>
        )}

        {/* Sample Size & Statistical Power */}
        {data.sample_size_power && data.sample_size_power !== 'Not reported' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sample Size & Statistical Power</label>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-900">{data.sample_size_power}</p>
            </div>
          </div>
        )}

        {/* Enhanced Randomization & Blinding */}
        {data.randomization_blinding && data.randomization_blinding !== 'Not specified' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Randomization & Blinding Procedures</label>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-900">{data.randomization_blinding}</p>
            </div>
          </div>
        )}

        {/* Link to Objective */}
        {data.link_to_objective && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon className="h-5 w-5 text-blue-600" />
              <label className="block text-sm font-medium text-gray-700">Link to Objective</label>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-900">{data.link_to_objective}</p>
            </div>
          </div>
        )}

        {/* Strengths and Limitations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ChartBarIcon className="h-5 w-5 text-green-600" />
              <label className="block text-sm font-medium text-gray-700">Strengths</label>
            </div>
            <div className="space-y-2">
              {splitStringToArray(data.strengths).map((strength, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">{strength}</span>
                </div>
              ))}
              {splitStringToArray(data.strengths).length === 0 && (
                <p className="text-sm text-gray-500 italic">No specific strengths identified</p>
              )}
            </div>
          </div>

          {/* Limitations */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BeakerIcon className="h-5 w-5 text-red-600" />
              <label className="block text-sm font-medium text-gray-700">Limitations</label>
            </div>
            <div className="space-y-2">
              {splitStringToArray(data.limitations).map((limitation, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">{limitation}</span>
                </div>
              ))}
              {splitStringToArray(data.limitations).length === 0 && (
                <p className="text-sm text-gray-500 italic">No specific limitations identified</p>
              )}
            </div>
          </div>
        </div>

        {/* Bias Assessment */}
        {data.bias_assessment && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <BeakerIcon className="h-5 w-5 text-yellow-600" />
              <label className="block text-sm font-medium text-gray-700">Bias Assessment</label>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
              <p className="text-sm text-gray-900">{data.bias_assessment}</p>
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
      </div>
    </div>
  );
}