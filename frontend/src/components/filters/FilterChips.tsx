'use client';

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface FilterChip {
  id: string;
  label: string;
  value: string | number | boolean | any[];
  displayValue?: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onRemove: (chipId: string) => void;
  onClearAll?: () => void;
  className?: string;
}

/**
 * Filter Chips Component
 * 
 * Displays active filters as removable chips
 * 
 * @example
 * <FilterChips
 *   chips={[
 *     { id: "year", label: "Year", value: [2020, 2024], displayValue: "2020 - 2024" },
 *     { id: "collection", label: "Collection", value: "abc123", displayValue: "My Collection" }
 *   ]}
 *   onRemove={(id) => removeFilter(id)}
 *   onClearAll={() => clearAllFilters()}
 * />
 */
export default function FilterChips({
  chips,
  onRemove,
  onClearAll,
  className = ''
}: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} data-testid="filter-chips-container">
      <span className="text-sm text-gray-600 font-medium">Active filters:</span>
      
      {chips.map((chip) => {
        let displayValue = chip.displayValue || chip.value;
        
        // Format display value
        if (Array.isArray(chip.value)) {
          displayValue = chip.value.join(' - ');
        } else if (typeof chip.value === 'boolean') {
          displayValue = chip.value ? 'Yes' : 'No';
        }

        return (
          <div
            key={chip.id}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium transition-colors hover:bg-blue-200"
            data-testid={`filter-chip-${chip.id}`}
          >
            <span className="font-semibold">{chip.label}:</span>
            <span>{displayValue}</span>
            <button
              onClick={() => onRemove(chip.id)}
              className="ml-1 hover:text-blue-900 transition-colors"
              aria-label={`Remove ${chip.label} filter`}
              data-testid={`remove-filter-chip-${chip.id}`}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        );
      })}

      {onClearAll && chips.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium underline"
          data-testid="clear-all-filter-chips"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

