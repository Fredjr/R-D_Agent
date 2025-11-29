'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, LinkIcon, XMarkIcon, LightBulbIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface Question {
  question_id: string;
  question_text: string;
  question_type: string;
  status: string;
  priority?: string;
  description?: string;
  project_id?: string;
}

interface Hypothesis {
  hypothesis_id: string;
  hypothesis_text: string;
  hypothesis_type: string;
  status: string;
  confidence_level?: number;
  description?: string;
  question_id?: string;
  project_id?: string;
}

interface CollectionResearchData {
  collection_id: string;
  collection_name: string;
  project_id: string;
  linked_questions: Question[];
  linked_hypotheses: Hypothesis[];
  all_project_questions: Question[];
  all_project_hypotheses: Hypothesis[];
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
  const [linkingIds, setLinkingIds] = useState<Set<string>>(new Set());

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

  // Get unlinked items for the link modal
  const linkedQuestionIds = new Set(data?.linked_questions.map(q => q.question_id) || []);
  const linkedHypothesisIds = new Set(data?.linked_hypotheses.map(h => h.hypothesis_id) || []);
  const unlinkedQuestions = data?.all_project_questions.filter(q => !linkedQuestionIds.has(q.question_id)) || [];
  const unlinkedHypotheses = data?.all_project_hypotheses.filter(h => !linkedHypothesisIds.has(h.hypothesis_id)) || [];

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <BeakerIcon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Research Questions & Hypotheses</h3>
              <p className="text-sm text-gray-400">Link research to this collection</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLinkModal('question')}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm"
            >
              <LinkIcon className="w-4 h-4" />
              Link Question
            </button>
            <button
              onClick={() => setShowLinkModal('hypothesis')}
              className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors text-sm"
            >
              <LinkIcon className="w-4 h-4" />
              Link Hypothesis
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Linked Questions */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <span className="text-blue-400">❓</span> Research Questions ({data?.linked_questions.length || 0})
          </h4>
          {data?.linked_questions.length === 0 ? (
            <div className="text-gray-500 text-sm py-4 text-center border border-dashed border-gray-700 rounded-lg">
              No questions linked yet. Click &quot;Link Question&quot; to add one.
            </div>
          ) : (
            <div className="space-y-2">
              {data?.linked_questions.map((question) => (
                <div
                  key={question.question_id}
                  className="flex items-start justify-between p-3 bg-[#242424] rounded-lg border border-gray-700 group"
                >
                  <div className="flex-1">
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

        {/* Linked Hypotheses */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <span className="text-purple-400">💡</span> Hypotheses ({data?.linked_hypotheses.length || 0})
          </h4>
          {data?.linked_hypotheses.length === 0 ? (
            <div className="text-gray-500 text-sm py-4 text-center border border-dashed border-gray-700 rounded-lg">
              No hypotheses linked yet. Click &quot;Link Hypothesis&quot; to add one.
            </div>
          ) : (
            <div className="space-y-2">
              {data?.linked_hypotheses.map((hypothesis) => (
                <div
                  key={hypothesis.hypothesis_id}
                  className="flex items-start justify-between p-3 bg-[#242424] rounded-lg border border-gray-700 group"
                >
                  <div className="flex-1">
                    <p className="text-white text-sm">{hypothesis.hypothesis_text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn("px-2 py-0.5 rounded text-xs", getStatusColor(hypothesis.status))}>
                        {hypothesis.status}
                      </span>
                      <span className="text-gray-500 text-xs">{hypothesis.hypothesis_type}</span>
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
                <span className="text-sm">Create new questions in the Project workspace.</span>
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
                <span className="text-sm">Create new hypotheses in the Project workspace.</span>
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
