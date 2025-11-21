'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Link, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResearchQuestion, Hypothesis } from '@/lib/types/questions';

interface LinkResearchContextModalProps {
  planId: string;
  projectId: string;
  currentQuestions: string[];
  currentHypotheses: string[];
  userId: string;
  onSave: (linkedQuestions: string[], linkedHypotheses: string[]) => void;
  onClose: () => void;
}

export default function LinkResearchContextModal({
  planId,
  projectId,
  currentQuestions,
  currentHypotheses,
  userId,
  onSave,
  onClose
}: LinkResearchContextModalProps) {
  const [questions, setQuestions] = useState<ResearchQuestion[]>([]);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set(currentQuestions));
  const [selectedHypotheses, setSelectedHypotheses] = useState<Set<string>>(new Set(currentHypotheses));
  const [questionSearch, setQuestionSearch] = useState('');
  const [hypothesisSearch, setHypothesisSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all questions for the project
        const questionsResponse = await fetch(`/api/research-questions/project/${projectId}`, {
          headers: { 'Content-Type': 'application/json' }
        });
        if (!questionsResponse.ok) throw new Error('Failed to fetch questions');
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData);
        
        // Fetch all hypotheses for the project
        const hypothesesResponse = await fetch(`/api/hypotheses/project/${projectId}`, {
          headers: { 'Content-Type': 'application/json' }
        });
        if (!hypothesesResponse.ok) throw new Error('Failed to fetch hypotheses');
        const hypothesesData = await hypothesesResponse.json();
        setHypotheses(hypothesesData);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/experiment-plans/${planId}/research-links`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId
        },
        body: JSON.stringify({
          linked_questions: Array.from(selectedQuestions),
          linked_hypotheses: Array.from(selectedHypotheses)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update research links');
      }

      onSave(Array.from(selectedQuestions), Array.from(selectedHypotheses));
      onClose();
    } catch (err) {
      console.error('Error saving links:', err);
      setError(err instanceof Error ? err.message : 'Failed to save links');
    } finally {
      setSaving(false);
    }
  };

  const toggleQuestion = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const toggleHypothesis = (hypothesisId: string) => {
    const newSelected = new Set(selectedHypotheses);
    if (newSelected.has(hypothesisId)) {
      newSelected.delete(hypothesisId);
    } else {
      newSelected.add(hypothesisId);
    }
    setSelectedHypotheses(newSelected);
  };

  const filteredQuestions = questions.filter(q =>
    q.question_text.toLowerCase().includes(questionSearch.toLowerCase())
  );

  const filteredHypotheses = hypotheses.filter(h =>
    h.hypothesis_text.toLowerCase().includes(hypothesisSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link className="w-6 h-6 text-green-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Link Research Context</h2>
              <p className="text-sm text-gray-400 mt-1">
                Select research questions and hypotheses to link to this experiment plan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
              <p className="text-gray-400 mt-2">Loading...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Research Questions Section */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  ❓ Research Questions ({selectedQuestions.size} selected)
                </h3>

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    placeholder="Search questions..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Questions List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredQuestions.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No questions found</p>
                  ) : (
                    filteredQuestions.map((question) => (
                      <label
                        key={question.question_id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                          selectedQuestions.has(question.question_id)
                            ? "bg-green-500/10 border-green-500/30"
                            : "bg-gray-800/30 border-gray-700 hover:border-gray-600"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedQuestions.has(question.question_id)}
                          onChange={() => toggleQuestion(question.question_id)}
                          className="mt-1 w-4 h-4 rounded border-gray-600 text-green-500 focus:ring-green-500 focus:ring-offset-gray-900"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white">{question.question_text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">Status: {question.status}</span>
                            <span className="text-xs text-gray-400">Priority: {question.priority}</span>
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Hypotheses Section */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  💡 Hypotheses ({selectedHypotheses.size} selected)
                </h3>

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={hypothesisSearch}
                    onChange={(e) => setHypothesisSearch(e.target.value)}
                    placeholder="Search hypotheses..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Hypotheses List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredHypotheses.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No hypotheses found</p>
                  ) : (
                    filteredHypotheses.map((hypothesis) => (
                      <label
                        key={hypothesis.hypothesis_id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                          selectedHypotheses.has(hypothesis.hypothesis_id)
                            ? "bg-green-500/10 border-green-500/30"
                            : "bg-gray-800/30 border-gray-700 hover:border-gray-600"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedHypotheses.has(hypothesis.hypothesis_id)}
                          onChange={() => toggleHypothesis(hypothesis.hypothesis_id)}
                          className="mt-1 w-4 h-4 rounded border-gray-600 text-green-500 focus:ring-green-500 focus:ring-offset-gray-900"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white">{hypothesis.hypothesis_text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">Status: {hypothesis.status}</span>
                            <span className="text-xs text-gray-400">Confidence: {hypothesis.confidence_level}%</span>
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {selectedQuestions.size} question{selectedQuestions.size !== 1 ? 's' : ''} and{' '}
            {selectedHypotheses.size} hypothes{selectedHypotheses.size !== 1 ? 'es' : 'is'} selected
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Links'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

