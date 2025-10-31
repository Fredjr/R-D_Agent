'use client';

import React from 'react';
import {
  MagnifyingGlassIcon,
  DocumentPlusIcon,
  FireIcon,
  FolderPlusIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export type FirstActionType = 'search' | 'import' | 'trending' | 'project' | 'skip';

interface FirstActionOption {
  id: FirstActionType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  recommended?: boolean;
}

interface Step3FirstActionProps {
  selectedAction: FirstActionType | null;
  onSelectAction: (action: FirstActionType) => void;
  onBack: () => void;
  onComplete: () => void;
  hasTopics: boolean;
}

export function Step3FirstAction({
  selectedAction,
  onSelectAction,
  onBack,
  onComplete,
  hasTopics
}: Step3FirstActionProps) {
  const actions: FirstActionOption[] = [
    {
      id: 'search',
      title: 'Search for Papers',
      description: 'Find papers in your research area using PubMed search',
      icon: <MagnifyingGlassIcon className="w-8 h-8" />,
      color: 'blue',
      recommended: hasTopics
    },
    {
      id: 'import',
      title: 'Import from PubMed',
      description: 'Add papers you\'re already working with by PMID',
      icon: <DocumentPlusIcon className="w-8 h-8" />,
      color: 'green'
    },
    {
      id: 'trending',
      title: 'Browse Trending Papers',
      description: 'Explore what\'s popular and highly cited in your field',
      icon: <FireIcon className="w-8 h-8" />,
      color: 'orange',
      recommended: !hasTopics
    },
    {
      id: 'project',
      title: 'Create a Project',
      description: 'Organize your research from the start with a project workspace',
      icon: <FolderPlusIcon className="w-8 h-8" />,
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colorMap: Record<string, { border: string; bg: string; text: string; selectedBorder: string; selectedBg: string; selectedText: string; icon: string }> = {
      blue: {
        border: 'border-blue-200',
        bg: 'bg-blue-50',
        text: 'text-blue-900',
        selectedBorder: 'border-blue-500',
        selectedBg: 'bg-blue-100',
        selectedText: 'text-blue-900',
        icon: 'text-blue-600'
      },
      green: {
        border: 'border-green-200',
        bg: 'bg-green-50',
        text: 'text-green-900',
        selectedBorder: 'border-green-500',
        selectedBg: 'bg-green-100',
        selectedText: 'text-green-900',
        icon: 'text-green-600'
      },
      orange: {
        border: 'border-orange-200',
        bg: 'bg-orange-50',
        text: 'text-orange-900',
        selectedBorder: 'border-orange-500',
        selectedBg: 'bg-orange-100',
        selectedText: 'text-orange-900',
        icon: 'text-orange-600'
      },
      purple: {
        border: 'border-purple-200',
        bg: 'bg-purple-50',
        text: 'text-purple-900',
        selectedBorder: 'border-purple-500',
        selectedBg: 'bg-purple-100',
        selectedText: 'text-purple-900',
        icon: 'text-purple-600'
      }
    };

    const colors = colorMap[color] || colorMap.blue;
    
    if (isSelected) {
      return {
        border: colors.selectedBorder,
        bg: colors.selectedBg,
        text: colors.selectedText,
        icon: colors.icon
      };
    }
    
    return {
      border: colors.border,
      bg: colors.bg,
      text: colors.text,
      icon: colors.icon
    };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          How would you like to start?
        </h2>
        <p className="text-gray-600">
          Choose your first action to begin exploring research papers
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action) => {
          const isSelected = selectedAction === action.id;
          const colors = getColorClasses(action.color, isSelected);

          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onSelectAction(action.id)}
              className={`
                relative p-6 rounded-xl border-2 text-left transition-all duration-200
                hover:shadow-lg hover:scale-105
                ${colors.border} ${colors.bg}
                ${isSelected ? 'ring-4 ring-blue-500 ring-offset-2' : ''}
              `}
            >
              {/* Recommended Badge */}
              {action.recommended && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                  <SparklesIcon className="w-3 h-3" />
                  Recommended
                </div>
              )}

              {/* Icon */}
              <div className={`mb-4 ${colors.icon}`}>
                {action.icon}
              </div>

              {/* Title */}
              <h3 className={`text-lg font-semibold mb-2 ${colors.text}`}>
                {action.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600">
                {action.description}
              </p>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute bottom-4 right-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Skip Option */}
      <div className="text-center pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => onSelectAction('skip')}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Skip for now, I'll explore on my own
        </button>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={!selectedAction}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {selectedAction === 'skip' ? 'Complete Setup' : 'Get Started →'}
        </button>
      </div>

      {/* Help Text */}
      {!selectedAction && (
        <p className="text-sm text-center text-gray-500">
          Please select an action to continue
        </p>
      )}
    </div>
  );
}

