'use client';

import React, { useState } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { RESEARCH_TOPICS, CAREER_STAGES, getTopicColorClasses } from '@/lib/research-topics';

interface ResearchInterestsData {
  topics: string[];
  keywords: string[];
  careerStage: string;
}

interface Step2ResearchInterestsProps {
  data: ResearchInterestsData;
  onChange: (data: ResearchInterestsData) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2ResearchInterests({ data, onChange, onNext, onBack }: Step2ResearchInterestsProps) {
  const [keywordInput, setKeywordInput] = useState('');

  const toggleTopic = (topicId: string) => {
    const newTopics = data.topics.includes(topicId)
      ? data.topics.filter(id => id !== topicId)
      : [...data.topics, topicId];
    
    onChange({ ...data, topics: newTopics });
  };

  const addKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !data.keywords.includes(keyword)) {
      onChange({ ...data, keywords: [...data.keywords, keyword] });
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    onChange({ ...data, keywords: data.keywords.filter(k => k !== keyword) });
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const canProceed = data.topics.length > 0 && data.careerStage;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What are you researching?
        </h2>
        <p className="text-gray-600">
          Help us personalize your experience and recommend relevant papers
        </p>
      </div>

      {/* Research Topics */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Research Topics <span className="text-red-500">*</span>
          <span className="text-gray-500 font-normal ml-2">(select all that apply)</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {RESEARCH_TOPICS.map((topic) => {
            const isSelected = data.topics.includes(topic.id);
            const colors = getTopicColorClasses(topic.color, isSelected);

            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => toggleTopic(topic.id)}
                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-200
                  hover:shadow-md hover:scale-105
                  ${colors.bg} ${colors.border} ${colors.text}
                  ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                `}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-3 h-3 text-white" />
                  </div>
                )}

                {/* Icon */}
                <div className="text-3xl mb-2">{topic.icon}</div>

                {/* Name */}
                <div className="text-sm font-semibold mb-1">{topic.name}</div>

                {/* Description */}
                <div className="text-xs opacity-75 line-clamp-2">
                  {topic.description}
                </div>
              </button>
            );
          })}
        </div>
        {data.topics.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">
            Please select at least one research topic
          </p>
        )}
      </div>

      {/* Keywords */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Keywords <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <p className="text-sm text-gray-500 mb-3">
          Add specific keywords to refine your recommendations
        </p>

        {/* Keyword Input */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyPress={handleKeywordKeyPress}
            placeholder="e.g., CRISPR, immunotherapy, deep learning"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={addKeyword}
            disabled={!keywordInput.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>

        {/* Keyword Tags */}
        {data.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.keywords.map((keyword) => (
              <span
                key={keyword}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => removeKeyword(keyword)}
                  className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Career Stage */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Career Stage <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CAREER_STAGES.map((stage) => {
            const isSelected = data.careerStage === stage.value;

            return (
              <button
                key={stage.value}
                type="button"
                onClick={() => onChange({ ...data, careerStage: stage.value })}
                className={`
                  p-4 rounded-lg border-2 text-left transition-all duration-200
                  hover:shadow-md
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-offset-2'
                    : 'border-gray-300 bg-white hover:border-blue-300'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className={`font-semibold mb-1 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {stage.label}
                    </div>
                    <div className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                      {stage.description}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
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
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Continue →
        </button>
      </div>

      {/* Help Text */}
      {!canProceed && (
        <p className="text-sm text-center text-gray-500">
          Please select at least one research topic and your career stage to continue
        </p>
      )}
    </div>
  );
}

