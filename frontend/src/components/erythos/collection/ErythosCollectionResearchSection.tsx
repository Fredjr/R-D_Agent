'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, LinkIcon, XMarkIcon, LightBulbIcon, BeakerIcon, FolderIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface Question {
  question_id: string;
  question_text: string;
  question_type: string;
  status: string;
  priority?: string;
  description?: string;
  project_id?: string;
  project_name?: string;
  source?: 'collection' | 'project';
}

interface Hypothesis {
  hypothesis_id: string;
  hypothesis_text: string;
  hypothesis_type?: string;
  status: string;
  confidence_level?: number;
  description?: string;
  question_id?: string;
  project_id?: string;
  project_name?: string;
  source?: 'collection' | 'project';
}

interface LinkedProject {
  project_id: string;
  project_name: string;
}

interface CollectionResearchData {
  collection_id: string;
  collection_name: string;
  primary_project_id: string;
  linked_projects: LinkedProject[];
  // Collection-specific Q&H (created directly on this collection)
  collection_questions: Question[];
  collection_hypotheses: Hypothesis[];
  // Linked project Q&H (from linked projects)
  linked_project_questions: Question[];
  linked_project_hypotheses: Hypothesis[];
  // All available for linking (from all linked projects)
  all_available_questions: Question[];
  all_available_hypotheses: Hypothesis[];
}

interface ErythosCollectionResearchSectionProps {
  collectionId: string;
  collectionName: string;
  projectId: string;
  userId: string;
  onRefresh?: () => void;
}

export function ErythosCollectionResearchSection({
  collectionId,
  collectionName,
  projectId,
  userId,
  onRefresh
}: ErythosCollectionResearchSectionProps) {
  const [data, setData] = useState<CollectionResearchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState<'question' | 'hypothesis' | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<'question' | 'hypothesis' | null>(null);
  const [linkingIds, setLinkingIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchResearchData();
  }, [collectionId]);

  const fetchResearchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/proxy/collections/${collectionId}/research`, {
        headers: { 'User-ID': userId }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch research data');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (type: 'question' | 'hypothesis', id: string) => {
    try {
      const body = type === 'question' 
        ? { question_ids: [id] }
        : { hypothesis_ids: [id] };
      
      const response = await fetch(`/api/proxy/collections/${collectionId}/research/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error('Failed to link');
      }
      
      await fetchResearchData();
      onRefresh?.();
    } catch (err) {
      console.error('Error linking:', err);
    }
  };

  const handleUnlink = async (type: 'question' | 'hypothesis', id: string) => {
    try {
      const body = type === 'question'
        ? { question_ids: [id] }
        : { hypothesis_ids: [id] };
      
      const response = await fetch(`/api/proxy/collections/${collectionId}/research/unlink`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error('Failed to unlink');
      }
      
      await fetchResearchData();
      onRefresh?.();
    } catch (err) {
      console.error('Error unlinking:', err);
    }
  };

  const handleCreateCollectionQuestion = async (questionText: string, questionType: string) => {
    try {
      setCreating(true);
      const response = await fetch(`/api/proxy/collections/${collectionId}/research/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId
        },
        body: JSON.stringify({
          question_text: questionText,
          question_type: questionType,
          priority: 'medium'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create question');
      }

      await fetchResearchData();
      onRefresh?.();
      setShowCreateModal(null);
    } catch (err) {
      console.error('Error creating question:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateCollectionHypothesis = async (hypothesisText: string) => {
    try {
      setCreating(true);
      const response = await fetch(`/api/proxy/collections/${collectionId}/research/hypotheses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId
        },
        body: JSON.stringify({
          hypothesis_text: hypothesisText,
          confidence_level: 0.5,
          status: 'untested'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create hypothesis');
      }

      await fetchResearchData();
      onRefresh?.();
      setShowCreateModal(null);
    } catch (err) {
      console.error('Error creating hypothesis:', err);
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      exploring: 'bg-blue-500/20 text-blue-400',
      investigating: 'bg-yellow-500/20 text-yellow-400',
      answered: 'bg-green-500/20 text-green-400',
      parked: 'bg-gray-500/20 text-gray-400',
      proposed: 'bg-purple-500/20 text-purple-400',
      testing: 'bg-orange-500/20 text-orange-400',
      supported: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400',
      inconclusive: 'bg-gray-500/20 text-gray-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
        <div className="text-red-400 text-center py-4">{error}</div>
      </div>
    );
  }

  // Get unlinked items for the link modal (from all available project Q&H)
  const linkedQuestionIds = new Set(data?.linked_project_questions.map(q => q.question_id) || []);
  const linkedHypothesisIds = new Set(data?.linked_project_hypotheses.map(h => h.hypothesis_id) || []);
  const unlinkedQuestions = data?.all_available_questions.filter(q => !linkedQuestionIds.has(q.question_id)) || [];
  const unlinkedHypotheses = data?.all_available_hypotheses.filter(h => !linkedHypothesisIds.has(h.hypothesis_id)) || [];

  // Combined counts
  const totalQuestions = (data?.collection_questions.length || 0) + (data?.linked_project_questions.length || 0);
  const totalHypotheses = (data?.collection_hypotheses.length || 0) + (data?.linked_project_hypotheses.length || 0);
  const linkedProjectCount = data?.linked_projects.length || 0;

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <BeakerIcon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Research Questions & Hypotheses</h3>
              <p className="text-sm text-gray-400">
                {linkedProjectCount > 1
                  ? `Linked to ${linkedProjectCount} projects`
                  : linkedProjectCount === 1
                    ? `From ${data?.linked_projects[0]?.project_name || 'project'}`
                    : 'Collection-specific research'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowCreateModal('question')}
              className="flex items-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm"
            >
              <PlusIcon className="w-4 h-4" />
              New Question
            </button>
            <button
              onClick={() => setShowCreateModal('hypothesis')}
              className="flex items-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm"
            >
              <PlusIcon className="w-4 h-4" />
              New Hypothesis
            </button>
            {linkedProjectCount > 0 && (
              <>
                <button
                  onClick={() => setShowLinkModal('question')}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm"
                >
                  <LinkIcon className="w-4 h-4" />
                  Link from Project
                </button>
                <button
                  onClick={() => setShowLinkModal('hypothesis')}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors text-sm"
                >
                  <LinkIcon className="w-4 h-4" />
                  Link Hypothesis
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Research Questions Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <span className="text-blue-400">❓</span> Research Questions ({totalQuestions})
          </h4>

          {totalQuestions === 0 ? (
            <div className="text-gray-500 text-sm py-4 text-center border border-dashed border-gray-700 rounded-lg">
              No questions yet. Click &quot;New Question&quot; to create one.
            </div>
          ) : (
            <div className="space-y-2">
              {/* Collection-specific questions */}
              {data?.collection_questions.map((question) => (
                <div
                  key={question.question_id}
                  className="flex items-start justify-between p-3 bg-[#242424] rounded-lg border border-green-700/50 group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">Collection</span>
                    </div>
                    <p className="text-white text-sm">{question.question_text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn("px-2 py-0.5 rounded text-xs", getStatusColor(question.status))}>
                        {question.status}
                      </span>
                      <span className="text-gray-500 text-xs">{question.question_type}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Linked project questions */}
              {data?.linked_project_questions.map((question) => (
                <div
                  key={question.question_id}
                  className="flex items-start justify-between p-3 bg-[#242424] rounded-lg border border-gray-700 group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FolderIcon className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-500 text-xs">{question.project_name}</span>
                    </div>
                    <p className="text-white text-sm">{question.question_text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn("px-2 py-0.5 rounded text-xs", getStatusColor(question.status))}>
                        {question.status}
                      </span>
                      <span className="text-gray-500 text-xs">{question.question_type}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnlink('question', question.question_id)}
                    className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    title="Unlink from collection"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hypotheses Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <span className="text-purple-400">💡</span> Hypotheses ({totalHypotheses})
          </h4>

          {totalHypotheses === 0 ? (
            <div className="text-gray-500 text-sm py-4 text-center border border-dashed border-gray-700 rounded-lg">
              No hypotheses yet. Click &quot;New Hypothesis&quot; to create one.
            </div>
          ) : (
            <div className="space-y-2">
              {/* Collection-specific hypotheses */}
              {data?.collection_hypotheses.map((hypothesis) => (
                <div
                  key={hypothesis.hypothesis_id}
                  className="flex items-start justify-between p-3 bg-[#242424] rounded-lg border border-green-700/50 group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">Collection</span>
                    </div>
                    <p className="text-white text-sm">{hypothesis.hypothesis_text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn("px-2 py-0.5 rounded text-xs", getStatusColor(hypothesis.status))}>
                        {hypothesis.status}
                      </span>
                      {hypothesis.confidence_level !== undefined && (
                        <span className="text-gray-500 text-xs">
                          {Math.round(hypothesis.confidence_level * 100)}% confidence
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Linked project hypotheses */}
              {data?.linked_project_hypotheses.map((hypothesis) => (
                <div
                  key={hypothesis.hypothesis_id}
                  className="flex items-start justify-between p-3 bg-[#242424] rounded-lg border border-gray-700 group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FolderIcon className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-500 text-xs">{hypothesis.project_name}</span>
                    </div>
                    <p className="text-white text-sm">{hypothesis.hypothesis_text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn("px-2 py-0.5 rounded text-xs", getStatusColor(hypothesis.status))}>
                        {hypothesis.status}
                      </span>
                      {hypothesis.hypothesis_type && (
                        <span className="text-gray-500 text-xs">{hypothesis.hypothesis_type}</span>
                      )}
                      {hypothesis.confidence_level !== undefined && (
                        <span className="text-gray-500 text-xs">
                          {hypothesis.confidence_level}% confidence
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnlink('hypothesis', hypothesis.hypothesis_id)}
                    className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    title="Unlink from collection"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <LinkResearchModal
          type={showLinkModal}
          unlinkedQuestions={unlinkedQuestions}
          unlinkedHypotheses={unlinkedHypotheses}
          onLink={handleLink}
          onClose={() => setShowLinkModal(null)}
          getStatusColor={getStatusColor}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateResearchModal
          type={showCreateModal}
          onCreateQuestion={handleCreateCollectionQuestion}
          onCreateHypothesis={handleCreateCollectionHypothesis}
          onClose={() => setShowCreateModal(null)}
          creating={creating}
        />
      )}
    </div>
  );
}

// Separate modal component to keep main component cleaner
function LinkResearchModal({
  type,
  unlinkedQuestions,
  unlinkedHypotheses,
  onLink,
  onClose,
  getStatusColor
}: {
  type: 'question' | 'hypothesis';
  unlinkedQuestions: Question[];
  unlinkedHypotheses: Hypothesis[];
  onLink: (type: 'question' | 'hypothesis', id: string) => void;
  onClose: () => void;
  getStatusColor: (status: string) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-lg bg-[#1a1a1a] rounded-xl border border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">
            Link {type === 'question' ? 'Research Question' : 'Hypothesis'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {type === 'question' ? (
            unlinkedQuestions.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                All project questions are already linked to this collection.
                <br />
                <span className="text-sm">Create new questions in the Project workspace or use &quot;New Question&quot; to create collection-specific ones.</span>
              </p>
            ) : (
              <div className="space-y-2">
                {unlinkedQuestions.map((q) => (
                  <button
                    key={q.question_id}
                    onClick={() => {
                      onLink('question', q.question_id);
                      onClose();
                    }}
                    className="w-full text-left p-3 bg-[#242424] hover:bg-[#2a2a2a] rounded-lg border border-gray-700 hover:border-blue-500/50 transition-all"
                  >
                    {q.project_name && (
                      <div className="flex items-center gap-1 mb-1">
                        <FolderIcon className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-500 text-xs">{q.project_name}</span>
                      </div>
                    )}
                    <p className="text-white text-sm">{q.question_text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("px-2 py-0.5 rounded text-xs", getStatusColor(q.status))}>
                        {q.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : (
            unlinkedHypotheses.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                All project hypotheses are already linked to this collection.
                <br />
                <span className="text-sm">Create new hypotheses in the Project workspace or use &quot;New Hypothesis&quot; to create collection-specific ones.</span>
              </p>
            ) : (
              <div className="space-y-2">
                {unlinkedHypotheses.map((h) => (
                  <button
                    key={h.hypothesis_id}
                    onClick={() => {
                      onLink('hypothesis', h.hypothesis_id);
                      onClose();
                    }}
                    className="w-full text-left p-3 bg-[#242424] hover:bg-[#2a2a2a] rounded-lg border border-gray-700 hover:border-purple-500/50 transition-all"
                  >
                    {h.project_name && (
                      <div className="flex items-center gap-1 mb-1">
                        <FolderIcon className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-500 text-xs">{h.project_name}</span>
                      </div>
                    )}
                    <p className="text-white text-sm">{h.hypothesis_text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("px-2 py-0.5 rounded text-xs", getStatusColor(h.status))}>
                        {h.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// Create modal for collection-specific Q&H
function CreateResearchModal({
  type,
  onCreateQuestion,
  onCreateHypothesis,
  onClose,
  creating
}: {
  type: 'question' | 'hypothesis';
  onCreateQuestion: (text: string, questionType: string) => void;
  onCreateHypothesis: (text: string) => void;
  onClose: () => void;
  creating: boolean;
}) {
  const [text, setText] = useState('');
  const [questionType, setQuestionType] = useState('exploratory');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (type === 'question') {
      onCreateQuestion(text.trim(), questionType);
    } else {
      onCreateHypothesis(text.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-lg bg-[#1a1a1a] rounded-xl border border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">
            Create {type === 'question' ? 'Research Question' : 'Hypothesis'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {type === 'question' ? 'Question' : 'Hypothesis'}
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={type === 'question'
                ? 'What research question do you want to explore?'
                : 'What hypothesis do you want to test?'}
              className="w-full px-3 py-2 bg-[#242424] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
              rows={3}
              autoFocus
            />
          </div>

          {type === 'question' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Question Type
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full px-3 py-2 bg-[#242424] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              >
                <option value="exploratory">Exploratory</option>
                <option value="descriptive">Descriptive</option>
                <option value="causal">Causal</option>
                <option value="comparative">Comparative</option>
                <option value="evaluative">Evaluative</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim() || creating}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <PlusIcon className="w-4 h-4" />
                  Create
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}