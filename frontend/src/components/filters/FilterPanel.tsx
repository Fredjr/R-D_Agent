'use client';

import React from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface FilterOption {
  id: string;
  label: string;
  value: string | number | boolean | string[] | number[];
  type: 'select' | 'range' | 'checkbox' | 'multi-select';
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
}

export interface FilterSection {
  title: string;
  filters: FilterOption[];
}

interface FilterPanelProps {
  sections: FilterSection[];
  activeFilters: Record<string, any>;
  onFilterChange: (filterId: string, value: any) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

/**
 * Reusable Filter Panel Component
 * 
 * Features:
 * - Multiple filter sections
 * - Support for select, range, checkbox, multi-select
 * - Active filter chips
 * - Clear all filters button
 * - Collapsible panel
 * 
 * @example
 * <FilterPanel
 *   sections={[
 *     {
 *       title: "Papers",
 *       filters: [
 *         { id: "year", label: "Year", type: "range", min: 2000, max: 2024 },
 *         { id: "collection", label: "Collection", type: "select", options: [...] }
 *       ]
 *     }
 *   ]}
 *   activeFilters={{ year: [2020, 2024], collection: "abc123" }}
 *   onFilterChange={(id, value) => setFilters({ ...filters, [id]: value })}
 *   onClearAll={() => setFilters({})}
 *   isOpen={showFilters}
 *   onToggle={() => setShowFilters(!showFilters)}
 * />
 */
export default function FilterPanel({
  sections,
  activeFilters,
  onFilterChange,
  onClearAll,
  isOpen,
  onToggle,
  className = ''
}: FilterPanelProps) {
  // Count active filters
  const activeFilterCount = Object.keys(activeFilters).filter(
    key => activeFilters[key] !== null && activeFilters[key] !== undefined && activeFilters[key] !== 'all'
  ).length;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
          data-testid="filter-toggle-button"
        >
          <FunnelIcon className="w-5 h-5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={onClearAll}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            data-testid="clear-all-filters-button"
          >
            <XMarkIcon className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      {/* Filter Content */}
      {isOpen && (
        <div className="p-4 space-y-6" data-testid="filter-panel-content">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-4">
              {/* Section Title */}
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                {section.title}
              </h3>

              {/* Section Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.filters.map((filter) => (
                  <div key={filter.id} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {filter.label}
                    </label>

                    {/* Select Filter */}
                    {filter.type === 'select' && (
                      <select
                        value={activeFilters[filter.id] || 'all'}
                        onChange={(e) => onFilterChange(filter.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        data-testid={`filter-${filter.id}`}
                      >
                        <option value="all">All</option>
                        {filter.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Range Filter */}
                    {filter.type === 'range' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={filter.min}
                            max={filter.max}
                            step={filter.step || 1}
                            value={activeFilters[filter.id]?.[0] || filter.min}
                            onChange={(e) => onFilterChange(filter.id, [
                              parseInt(e.target.value),
                              activeFilters[filter.id]?.[1] || filter.max
                            ])}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Min"
                          />
                          <span className="text-gray-500">-</span>
                          <input
                            type="number"
                            min={filter.min}
                            max={filter.max}
                            step={filter.step || 1}
                            value={activeFilters[filter.id]?.[1] || filter.max}
                            onChange={(e) => onFilterChange(filter.id, [
                              activeFilters[filter.id]?.[0] || filter.min,
                              parseInt(e.target.value)
                            ])}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Max"
                          />
                        </div>
                        <input
                          type="range"
                          min={filter.min}
                          max={filter.max}
                          step={filter.step || 1}
                          value={activeFilters[filter.id]?.[1] || filter.max}
                          onChange={(e) => onFilterChange(filter.id, [
                            activeFilters[filter.id]?.[0] || filter.min,
                            parseInt(e.target.value)
                          ])}
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* Checkbox Filter */}
                    {filter.type === 'checkbox' && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeFilters[filter.id] || false}
                          onChange={(e) => onFilterChange(filter.id, e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          data-testid={`filter-${filter.id}`}
                        />
                        <span className="text-sm text-gray-700">{filter.label}</span>
                      </label>
                    )}

                    {/* Multi-Select Filter */}
                    {filter.type === 'multi-select' && (
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                        {filter.options?.map((option) => (
                          <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(activeFilters[filter.id] || []).includes(option.value)}
                              onChange={(e) => {
                                const current = activeFilters[filter.id] || [];
                                const updated = e.target.checked
                                  ? [...current, option.value]
                                  : current.filter((v: string) => v !== option.value);
                                onFilterChange(filter.id, updated);
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {Object.entries(activeFilters).map(([key, value]) => {
                  if (value === null || value === undefined || value === 'all') return null;
                  
                  const filter = sections
                    .flatMap(s => s.filters)
                    .find(f => f.id === key);
                  
                  if (!filter) return null;

                  let displayValue = value;
                  if (Array.isArray(value)) {
                    displayValue = value.join(' - ');
                  } else if (typeof value === 'boolean') {
                    displayValue = value ? 'Yes' : 'No';
                  }

                  return (
                    <div
                      key={key}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      data-testid={`active-filter-chip-${key}`}
                    >
                      <span className="font-medium">{filter.label}:</span>
                      <span>{displayValue}</span>
                      <button
                        onClick={() => onFilterChange(key, null)}
                        className="ml-1 hover:text-blue-900"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

