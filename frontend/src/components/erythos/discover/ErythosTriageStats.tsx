'use client';

import React from 'react';

interface TriageStatsProps {
  total: number;
  mustRead: number;
  niceToKnow: number;
  ignored: number;
  activeFilter: 'all' | 'must_read' | 'nice_to_know' | 'ignore';
  onFilterChange: (filter: 'all' | 'must_read' | 'nice_to_know' | 'ignore') => void;
}

export function ErythosTriageStats({
  total,
  mustRead,
  niceToKnow,
  ignored,
  activeFilter,
  onFilterChange
}: TriageStatsProps) {
  const stats = [
    { id: 'all', label: 'Total', value: total, color: 'from-gray-600/30 to-gray-700/30', textColor: 'text-gray-300', borderColor: 'border-gray-500' },
    { id: 'must_read', label: 'Must Read', value: mustRead, color: 'from-red-600/30 to-red-700/30', textColor: 'text-red-400', borderColor: 'border-red-500' },
    { id: 'nice_to_know', label: 'Nice to Know', value: niceToKnow, color: 'from-yellow-600/30 to-yellow-700/30', textColor: 'text-yellow-400', borderColor: 'border-yellow-500' },
    { id: 'ignore', label: 'Ignored', value: ignored, color: 'from-gray-500/30 to-gray-600/30', textColor: 'text-gray-400', borderColor: 'border-gray-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <button
          key={stat.id}
          onClick={() => onFilterChange(stat.id as any)}
          className={`
            relative p-4 rounded-xl border-2 transition-all duration-200
            bg-gradient-to-br ${stat.color}
            ${activeFilter === stat.id 
              ? `${stat.borderColor} ring-2 ring-offset-2 ring-offset-[#121212] ring-opacity-50 scale-[1.02]`
              : 'border-gray-700/50 hover:border-gray-600'
            }
            hover:scale-[1.02] cursor-pointer
          `}
        >
          <div className={`text-sm font-medium ${stat.textColor} mb-1`}>
            {stat.label}
          </div>
          <div className="text-3xl font-bold text-white">
            {stat.value}
          </div>
          {activeFilter === stat.id && (
            <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${stat.borderColor.replace('border-', 'bg-')}`} />
          )}
        </button>
      ))}
    </div>
  );
}

