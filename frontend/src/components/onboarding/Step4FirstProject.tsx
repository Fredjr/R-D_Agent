'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';

interface Step4FirstProjectProps {
  researchInterests: string[];
  onBack: () => void;
  onNext: (projectData: {
    name: string;
    description: string;
    researchQuestion: string;
  }) => void;
}

// Generate project name suggestions based on research interests
function generateProjectNameSuggestions(interests: string[]): string[] {
  if (interests.length === 0) {
    return ['My Research Project', 'Literature Review Project', 'Research Study'];
  }

  const suggestions: string[] = [];
  const primaryInterest = interests[0];

  // Add primary interest-based suggestions
  suggestions.push(`${primaryInterest} Research`);
  suggestions.push(`${primaryInterest} Literature Review`);
  suggestions.push(`${primaryInterest} Study`);

  // If multiple interests, add combined suggestion
  if (interests.length > 1) {
    suggestions.push(`${interests.slice(0, 2).join(' & ')} Project`);
  }

  return suggestions.slice(0, 4);
}

// Generate research question examples based on interests
function generateQuestionExamples(interests: string[]): string[] {
  if (interests.length === 0) {
    return [
      'What are the latest advances in my field?',
      'How can I improve my research methodology?',
      'What are the key challenges in this area?',
    ];
  }

  const primaryInterest = interests[0];
  return [
    `What are the latest advances in ${primaryInterest}?`,
    `What are the key challenges in ${primaryInterest} research?`,
    `How can ${primaryInterest} be applied to solve real-world problems?`,
    `What are the emerging trends in ${primaryInterest}?`,
  ];
}

export default function Step4FirstProject({
  researchInterests,
  onBack,
  onNext,
}: Step4FirstProjectProps) {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [researchQuestion, setResearchQuestion] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const nameSuggestions = generateProjectNameSuggestions(researchInterests);
  const questionExamples = generateQuestionExamples(researchInterests);

  // Pre-fill project name with first suggestion
  useEffect(() => {
    if (nameSuggestions.length > 0 && !projectName) {
      setProjectName(nameSuggestions[0]);
    }
  }, [nameSuggestions, projectName]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    } else if (projectName.trim().length < 3) {
      newErrors.projectName = 'Project name must be at least 3 characters';
    } else if (projectName.trim().length > 100) {
      newErrors.projectName = 'Project name must be less than 100 characters';
    }

    if (!researchQuestion.trim()) {
      newErrors.researchQuestion = 'Research question is required';
    } else if (researchQuestion.trim().length < 20) {
      newErrors.researchQuestion = 'Research question must be at least 20 characters';
    } else if (researchQuestion.trim().length > 500) {
      newErrors.researchQuestion = 'Research question must be less than 500 characters';
    }

    if (description.trim().length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext({
        name: projectName.trim(),
        description: description.trim(),
        researchQuestion: researchQuestion.trim(),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Create Your First Project
        </h2>
        <p className="text-gray-600">
          Projects help you organize your research around a specific goal or question
        </p>
      </div>

      {/* Project Name */}
      <div>
        <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
          Project Name <span className="text-red-500">*</span>
        </label>
        <input
          id="projectName"
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Enter project name"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.projectName ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.projectName && (
          <p className="mt-1 text-sm text-red-600">{errors.projectName}</p>
        )}

        {/* Name Suggestions */}
        {nameSuggestions.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">Suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {nameSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setProjectName(suggestion)}
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Research Question */}
      <div>
        <label htmlFor="researchQuestion" className="block text-sm font-medium text-gray-700 mb-2">
          Research Question <span className="text-red-500">*</span>
        </label>
        <textarea
          id="researchQuestion"
          value={researchQuestion}
          onChange={(e) => setResearchQuestion(e.target.value)}
          placeholder="What question are you trying to answer?"
          rows={4}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
            errors.researchQuestion ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <div className="mt-1 flex justify-between items-center">
          <div>
            {errors.researchQuestion && (
              <p className="text-sm text-red-600">{errors.researchQuestion}</p>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {researchQuestion.length}/500 characters
          </p>
        </div>

        {/* Question Examples */}
        {questionExamples.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">Examples:</p>
            <div className="space-y-1">
              {questionExamples.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setResearchQuestion(example)}
                  className="block w-full text-left px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Description (Optional) */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Project Description <span className="text-gray-400">(Optional)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide additional context about your project..."
          rows={3}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <div className="mt-1 flex justify-between items-center">
          <div>
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {description.length}/1000 characters
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Why create a project?
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Organize papers around a specific research goal</li>
                <li>Track your progress and insights</li>
                <li>Collaborate with team members</li>
                <li>Generate literature reviews and reports</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="px-6"
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          className="px-6"
        >
          Create Project
        </Button>
      </div>
    </div>
  );
}

