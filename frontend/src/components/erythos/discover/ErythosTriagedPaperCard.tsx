'use client';

import React, { useState } from 'react';
import {
  BookmarkIcon,
  DocumentTextIcon,
  BeakerIcon,
  ShareIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LightBulbIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';

interface EvidenceExcerpt {
  quote: string;
  relevance: string;
}

interface RelevanceScore {
  score: number;
  reasoning: string;
  evidence?: string;
  support_type?: string;
}

interface CollectionSuggestion {
  collection_id: string;
  collection_name: string;
  reason: string;
  confidence: number;
  matching_hypothesis_count?: number;
}

// Rich evidence link with full context
interface RichEvidenceLink {
  id: string;
  type: 'question' | 'hypothesis';
  text: string; // Full question/hypothesis text
  score?: number;
  reasoning?: string;
  evidence?: string; // Extracted evidence from paper
  support_type?: string; // For hypotheses
}

interface TriagedPaperCardProps {
  id: string;
  title: string;
  authors?: string[];
  year?: number;
  journal?: string;
  pmid: string;
  abstract?: string;
  triageStatus: 'must_read' | 'nice_to_know' | 'ignore';
  relevanceScore: number;
  // Full AI triage details
  impactAssessment?: string;
  aiReasoning?: string;
  evidenceExcerpts?: EvidenceExcerpt[];
  questionScores?: Record<string, RelevanceScore>;
  hypothesisScores?: Record<string, RelevanceScore>;
  collectionSuggestions?: CollectionSuggestion[];
  confidenceScore?: number;
  // Rich evidence links with full details
  richEvidenceLinks?: RichEvidenceLink[];
  // Legacy evidence links (IDs only)
  evidenceLinks?: Array<{
    type: 'question' | 'hypothesis';
    text: string;
  }>;
  isSelected?: boolean;
  isFocused?: boolean;
  batchMode?: boolean;
  onSelect?: () => void;
  onSave?: () => void;
  onReadPdf?: () => void;
  onDeepDive?: () => void;
  onNetworkView?: () => void;
  onExtractProtocol?: () => void;
  onAddToCollection?: (collectionId: string, collectionName: string) => void;
}

const statusConfig = {
  must_read: { label: 'MUST READ', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  nice_to_know: { label: 'NICE TO KNOW', bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  ignore: { label: 'IGNORED', bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
};

export function ErythosTriagedPaperCard({
  id,
  title,
  authors = [],
  year,
  journal,
  pmid,
  abstract,
  triageStatus,
  relevanceScore,
  impactAssessment,
  aiReasoning,
  evidenceExcerpts = [],
  questionScores = {},
  hypothesisScores = {},
  collectionSuggestions = [],
  confidenceScore,
  richEvidenceLinks = [],
  evidenceLinks = [],
  isSelected = false,
  isFocused = false,
  batchMode = false,
  onSelect,
  onSave,
  onReadPdf,
  onDeepDive,
  onNetworkView,
  onExtractProtocol,
  onAddToCollection
}: TriagedPaperCardProps) {
  const status = statusConfig[triageStatus];
  const [expanded, setExpanded] = useState(false);
  const [addingToCollection, setAddingToCollection] = useState<string | null>(null);

  // Check if we have rich AI triage details
  const hasRichDetails = impactAssessment || aiReasoning || evidenceExcerpts.length > 0 ||
    Object.keys(questionScores).length > 0 || Object.keys(hypothesisScores).length > 0 ||
    collectionSuggestions.length > 0 || richEvidenceLinks.length > 0;

  return (
    <div
      className={`
        relative p-4 rounded-xl border transition-all duration-200
        bg-gradient-to-br from-gray-800/50 to-gray-900/50
        ${isFocused ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-gray-700/50 hover:border-gray-600'}
        ${isSelected ? 'bg-orange-500/10' : ''}
      `}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 mb-3">
        {/* Checkbox for batch mode */}
        {batchMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="mt-1.5 w-4 h-4 rounded border-gray-500 bg-gray-700 text-orange-500 focus:ring-orange-500"
          />
        )}

        {/* Title and status */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium leading-tight line-clamp-2 hover:text-orange-400 transition-colors cursor-pointer">
            {title}
          </h3>
        </div>

        {/* Triage badge */}
        <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-semibold ${status.bg} ${status.text} ${status.border} border`}>
          {status.label}
        </div>

        {/* Relevance score */}
        <div className="flex-shrink-0 text-right">
          <span className={`text-2xl font-bold ${getScoreColor(relevanceScore)}`}>
            {relevanceScore}
          </span>
          <span className="text-sm text-gray-500">/100</span>
        </div>
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mb-3">
        {authors.length > 0 && (
          <span>{authors.slice(0, 3).join(', ')}{authors.length > 3 ? ' et al.' : ''}</span>
        )}
        {year && <span>• {year}</span>}
        {journal && <span>• {journal}</span>}
        <span className="text-orange-400">• PMID: {pmid}</span>
      </div>

      {/* Abstract */}
      {abstract && (
        <p className="text-sm text-gray-300 line-clamp-3 mb-3">
          {abstract}
        </p>
      )}

      {/* Rich Evidence Links - Full details with extracted evidence */}
      {(richEvidenceLinks.length > 0 || evidenceLinks.length > 0 || Object.keys(hypothesisScores).length > 0 || Object.keys(questionScores).length > 0) && (
        <div className="mb-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 text-purple-400 text-sm font-medium mb-3">
            <span>🔗</span>
            <span>Evidence Links</span>
            <span className="text-xs text-gray-500">
              ({richEvidenceLinks.length || Object.keys(hypothesisScores).length + Object.keys(questionScores).length} items)
            </span>
          </div>
          <div className="space-y-3">
            {/* Rich evidence links with full context */}
            {richEvidenceLinks.map((link, i) => (
              <div key={link.id || i} className="p-2 rounded bg-gray-800/50 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className={link.type === 'hypothesis' ? 'text-purple-400' : 'text-cyan-400'}>
                    {link.type === 'hypothesis' ? '📊' : '❓'}
                  </span>
                  <span className="text-sm text-white font-medium flex-1">{link.text}</span>
                  {link.score !== undefined && (
                    <span className={`text-sm font-bold ${getScoreColor(link.score)}`}>{link.score}/100</span>
                  )}
                  {link.support_type && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase
                      ${link.support_type === 'supports' ? 'bg-green-500/20 text-green-400' :
                        link.support_type === 'contradicts' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-400'}`}>
                      {link.support_type}
                    </span>
                  )}
                </div>
                {link.reasoning && (
                  <p className="text-xs text-gray-400 mt-1 pl-6">
                    <span className="text-orange-400 font-medium">Why relevant:</span> {link.reasoning}
                  </p>
                )}
                {link.evidence && (
                  <div className="mt-2 pl-6 border-l-2 border-green-500/30">
                    <p className="text-xs text-gray-500 mb-1">📝 Extracted evidence:</p>
                    <p className="text-xs text-green-300 italic">&ldquo;{link.evidence}&rdquo;</p>
                  </div>
                )}
              </div>
            ))}
            {/* Fallback: Show hypothesis/question scores if no rich links */}
            {richEvidenceLinks.length === 0 && Object.entries(hypothesisScores).map(([hId, score]) => (
              <div key={hId} className="p-2 rounded bg-gray-800/50 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-purple-400">📊</span>
                  <span className="text-xs text-gray-400 font-mono">{hId}</span>
                  <span className={`text-sm font-bold ml-auto ${getScoreColor(score.score)}`}>{score.score}/100</span>
                  {score.support_type && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase
                      ${score.support_type === 'supports' ? 'bg-green-500/20 text-green-400' :
                        score.support_type === 'contradicts' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-400'}`}>
                      {score.support_type}
                    </span>
                  )}
                </div>
                {score.reasoning && (
                  <p className="text-xs text-gray-400 pl-6">
                    <span className="text-orange-400">Why:</span> {score.reasoning}
                  </p>
                )}
                {score.evidence && (
                  <div className="mt-1 pl-6 border-l-2 border-green-500/30">
                    <p className="text-xs text-green-300 italic">&ldquo;{score.evidence}&rdquo;</p>
                  </div>
                )}
              </div>
            ))}
            {richEvidenceLinks.length === 0 && Object.entries(questionScores).map(([qId, score]) => (
              <div key={qId} className="p-2 rounded bg-gray-800/50 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-cyan-400">❓</span>
                  <span className="text-xs text-gray-400 font-mono">{qId}</span>
                  <span className={`text-sm font-bold ml-auto ${getScoreColor(score.score)}`}>{score.score}/100</span>
                </div>
                {score.reasoning && (
                  <p className="text-xs text-gray-400 pl-6">
                    <span className="text-orange-400">Why:</span> {score.reasoning}
                  </p>
                )}
                {score.evidence && (
                  <div className="mt-1 pl-6 border-l-2 border-green-500/30">
                    <p className="text-xs text-green-300 italic">&ldquo;{score.evidence}&rdquo;</p>
                  </div>
                )}
              </div>
            ))}
            {/* Legacy fallback */}
            {richEvidenceLinks.length === 0 && Object.keys(hypothesisScores).length === 0 && Object.keys(questionScores).length === 0 &&
              evidenceLinks.map((link, i) => (
                <div key={i} className="text-xs text-purple-300">
                  {link.type === 'hypothesis' ? '📊' : '❓'} {link.text}
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Expandable AI Triage Details */}
      {hasRichDetails && (
        <div className="mb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition-colors"
          >
            {expanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
            <LightBulbIcon className="w-4 h-4" />
            <span>{expanded ? 'Hide' : 'Show'} AI Triage Details</span>
            {confidenceScore && (
              <span className="text-xs text-gray-500 ml-2">(Confidence: {Math.round(confidenceScore * 100)}%)</span>
            )}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3">
              {/* Impact Assessment */}
              {impactAssessment && (
                <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-2 text-orange-400 text-sm font-medium mb-2">
                    <span>💡</span>
                    <span>Impact Assessment</span>
                  </div>
                  <p className="text-sm text-gray-300">{impactAssessment}</p>
                </div>
              )}

              {/* AI Reasoning */}
              {aiReasoning && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">
                    <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
                    <span>AI Reasoning</span>
                  </div>
                  <p className="text-sm text-gray-300">{aiReasoning}</p>
                </div>
              )}

              {/* Evidence Excerpts */}
              {evidenceExcerpts.length > 0 && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-2">
                    <span>📝</span>
                    <span>Key Evidence Excerpts</span>
                  </div>
                  <div className="space-y-2">
                    {evidenceExcerpts.map((excerpt, i) => (
                      <div key={i} className="pl-3 border-l-2 border-green-500/30">
                        <p className="text-sm text-gray-200 italic">&ldquo;{excerpt.quote}&rdquo;</p>
                        <p className="text-xs text-green-400 mt-1">→ {excerpt.relevance}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hypothesis Relevance Details */}
              {Object.keys(hypothesisScores).length > 0 && (
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2 text-purple-400 text-sm font-medium mb-2">
                    <span>📊</span>
                    <span>Hypothesis Analysis</span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(hypothesisScores).map(([hId, score]) => (
                      <div key={hId} className="text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <span className="font-mono text-xs">{hId.slice(0, 8)}...</span>
                          <span className={`font-semibold ${getScoreColor(score.score)}`}>{score.score}/100</span>
                          {score.support_type && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase
                              ${score.support_type === 'supports' ? 'bg-green-500/20 text-green-400' :
                                score.support_type === 'contradicts' ? 'bg-red-500/20 text-red-400' :
                                'bg-blue-500/20 text-blue-400'}`}>
                              {score.support_type}
                            </span>
                          )}
                        </div>
                        {score.reasoning && (
                          <p className="text-xs text-gray-400 mt-1">{score.reasoning}</p>
                        )}
                        {score.evidence && (
                          <p className="text-xs text-gray-500 mt-1 italic">&ldquo;{score.evidence}&rdquo;</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Question Relevance Details */}
              {Object.keys(questionScores).length > 0 && (
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium mb-2">
                    <span>❓</span>
                    <span>Research Question Analysis</span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(questionScores).map(([qId, score]) => (
                      <div key={qId} className="text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <span className="font-mono text-xs">{qId.slice(0, 8)}...</span>
                          <span className={`font-semibold ${getScoreColor(score.score)}`}>{score.score}/100</span>
                        </div>
                        {score.reasoning && (
                          <p className="text-xs text-gray-400 mt-1">{score.reasoning}</p>
                        )}
                        {score.evidence && (
                          <p className="text-xs text-gray-500 mt-1 italic">&ldquo;{score.evidence}&rdquo;</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Collection Suggestions - with full reasoning and add button */}
              {collectionSuggestions.length > 0 && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-3">
                    <span>📁</span>
                    <span>Suggested Collections</span>
                    <span className="text-xs text-gray-500">Click to add paper</span>
                  </div>
                  <div className="space-y-3">
                    {collectionSuggestions.map((suggestion) => (
                      <div key={suggestion.collection_id}
                        className="p-3 rounded bg-gray-800/50 border border-yellow-500/20 hover:border-yellow-500/40 transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-300 font-medium">{suggestion.collection_name}</span>
                            <span className={`text-sm font-bold ${getScoreColor(Math.round(suggestion.confidence * 100))}`}>
                              {Math.round(suggestion.confidence * 100)}%
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              if (onAddToCollection) {
                                setAddingToCollection(suggestion.collection_id);
                                onAddToCollection(suggestion.collection_id, suggestion.collection_name);
                                setTimeout(() => setAddingToCollection(null), 2000);
                              }
                            }}
                            disabled={addingToCollection === suggestion.collection_id}
                            className={`px-3 py-1 text-xs font-medium rounded transition-all
                              ${addingToCollection === suggestion.collection_id
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30'}`}
                          >
                            {addingToCollection === suggestion.collection_id ? '✓ Added!' : '+ Add to Collection'}
                          </button>
                        </div>
                        <p className="text-xs text-gray-400">
                          <span className="text-orange-400 font-medium">Why:</span> {suggestion.reason}
                        </p>
                        {suggestion.matching_hypothesis_count && suggestion.matching_hypothesis_count > 0 && (
                          <p className="text-xs text-purple-400 mt-1">
                            📊 Matches {suggestion.matching_hypothesis_count} hypothesis{suggestion.matching_hypothesis_count > 1 ? 'es' : ''} in this collection
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <ActionButton icon={BookmarkIcon} label="Save" onClick={onSave} />
        <ActionButton icon={DocumentTextIcon} label="PDF" onClick={onReadPdf} />
        <ActionButton icon={EyeIcon} label="Deep Dive" onClick={onDeepDive} />
        <ActionButton icon={ShareIcon} label="Network" onClick={onNetworkView} />
        <ActionButton icon={BeakerIcon} label="Protocol" onClick={onExtractProtocol} />
      </div>
    </div>
  );
}

function ActionButton({ 
  icon: Icon, 
  label, 
  onClick 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  onClick?: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 
        bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 hover:border-gray-500
        rounded-lg transition-all duration-200"
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

