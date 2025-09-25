/**
 * Phase 2A.2: Semantic Analysis Filters
 * Filter components for semantic analysis features
 */

'use client';

import React from 'react';
import { AdjustmentsHorizontalIcon, FunnelIcon } from '@heroicons/react/24/outline';

export interface SemanticFilters {
  methodology?: string[];
  complexityRange?: [number, number]; // [min, max] 0.0-1.0
  noveltyTypes?: string[];
  researchDomains?: string[];
  minConfidence?: number; // 0.0-1.0
}

interface SemanticFiltersProps {
  filters: SemanticFilters;
  onFiltersChange: (filters: SemanticFilters) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function SemanticFiltersPanel({ filters, onFiltersChange, isOpen, onToggle }: SemanticFiltersProps) {
  const methodologies = [
    { value: 'experimental', label: 'Experimental', icon: '🧪' },
    { value: 'theoretical', label: 'Theoretical', icon: '🧮' },
    { value: 'computational', label: 'Computational', icon: '💻' },
    { value: 'review', label: 'Review', icon: '📚' },
    { value: 'meta_analysis', label: 'Meta-Analysis', icon: '📊' },
    { value: 'case_study', label: 'Case Study', icon: '🔍' },
    { value: 'survey', label: 'Survey', icon: '📋' },
  ];

  const noveltyTypes = [
    { value: 'breakthrough', label: 'Breakthrough', icon: '🚀' },
    { value: 'incremental', label: 'Incremental', icon: '📈' },
    { value: 'replication', label: 'Replication', icon: '🔄' },
    { value: 'review', label: 'Review', icon: '📖' },
  ];

  const researchDomains = [
    { value: 'machine_learning', label: 'Machine Learning', icon: '🤖' },
    { value: 'biology', label: 'Biology', icon: '🧬' },
    { value: 'chemistry', label: 'Chemistry', icon: '⚗️' },
    { value: 'physics', label: 'Physics', icon: '⚛️' },
    { value: 'medicine', label: 'Medicine', icon: '🏥' },
    { value: 'engineering', label: 'Engineering', icon: '⚙️' },
    { value: 'computer_science', label: 'Computer Science', icon: '💻' },
    { value: 'mathematics', label: 'Mathematics', icon: '📐' },
  ];

  const handleMethodologyChange = (methodology: string, checked: boolean) => {
    const current = filters.methodology || [];
    const updated = checked
      ? [...current, methodology]
      : current.filter(m => m !== methodology);
    onFiltersChange({ ...filters, methodology: updated });
  };

  const handleNoveltyChange = (novelty: string, checked: boolean) => {
    const current = filters.noveltyTypes || [];
    const updated = checked
      ? [...current, novelty]
      : current.filter(n => n !== novelty);
    onFiltersChange({ ...filters, noveltyTypes: updated });
  };

  const handleDomainChange = (domain: string, checked: boolean) => {
    const current = filters.researchDomains || [];
    const updated = checked
      ? [...current, domain]
      : current.filter(d => d !== domain);
    onFiltersChange({ ...filters, researchDomains: updated });
  };

  const handleComplexityRangeChange = (min: number, max: number) => {
    onFiltersChange({ ...filters, complexityRange: [min, max] });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    Array.isArray(value) ? value.length > 0 : value !== undefined
  );

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
          hasActiveFilters
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <FunnelIcon className="w-4 h-4" />
        <span className="font-medium">Semantic Filters</span>
        {hasActiveFilters && (
          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
            Active
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">🧠 Semantic Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Methodology Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Research Methodology</h4>
              <div className="grid grid-cols-2 gap-2">
                {methodologies.map((method) => (
                  <label key={method.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.methodology?.includes(method.value) || false}
                      onChange={(e) => handleMethodologyChange(method.value, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{method.icon}</span>
                    <span>{method.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Complexity Range Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Technical Complexity</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-600">Min:</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={filters.complexityRange?.[0] || 0}
                    onChange={(e) => handleComplexityRangeChange(
                      parseFloat(e.target.value),
                      filters.complexityRange?.[1] || 1
                    )}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-12">
                    {((filters.complexityRange?.[0] || 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-600">Max:</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={filters.complexityRange?.[1] || 1}
                    onChange={(e) => handleComplexityRangeChange(
                      filters.complexityRange?.[0] || 0,
                      parseFloat(e.target.value)
                    )}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-12">
                    {((filters.complexityRange?.[1] || 1) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Novelty Type Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Novelty Type</h4>
              <div className="grid grid-cols-2 gap-2">
                {noveltyTypes.map((novelty) => (
                  <label key={novelty.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.noveltyTypes?.includes(novelty.value) || false}
                      onChange={(e) => handleNoveltyChange(novelty.value, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{novelty.icon}</span>
                    <span>{novelty.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Research Domains Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Research Domains</h4>
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                {researchDomains.map((domain) => (
                  <label key={domain.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.researchDomains?.includes(domain.value) || false}
                      onChange={(e) => handleDomainChange(domain.value, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{domain.icon}</span>
                    <span>{domain.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Confidence Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Minimum Confidence</h4>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={filters.minConfidence || 0}
                  onChange={(e) => onFiltersChange({ ...filters, minConfidence: parseFloat(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-12">
                  {((filters.minConfidence || 0) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
