'use client';

import React from 'react';
import { ErythosButton } from '../ErythosButton';

interface ProjectScore {
  project_id: string;
  project_name: string;
  relevance_score: number;
  reasoning: string;
}

interface CollectionScore {
  collection_id: string;
  collection_name: string;
  relevance_score: number;
  reasoning: string;
}

interface BestMatch {
  id: string;
  name: string;
  score: number;
  type: 'project' | 'collection';
}

interface MultiProjectRelevanceMatrixProps {
  articlePmid: string;
  articleTitle?: string;
  projectScores: ProjectScore[];
  collectionScores: CollectionScore[];
  bestMatch?: BestMatch;
  overallRelevance: number;
  onAddToProject?: (projectId: string) => void;
  onAddToCollection?: (collectionId: string) => void;
  onClose?: () => void;
}

export function MultiProjectRelevanceMatrix({
  articlePmid,
  articleTitle,
  projectScores,
  collectionScores,
  bestMatch,
  overallRelevance,
  onAddToProject,
  onAddToCollection,
  onClose
}: MultiProjectRelevanceMatrixProps) {

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 70) return '🔴'; // Must read
    if (score >= 40) return '🟡'; // Nice to know
    return '⚪'; // Ignore
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-green-500/10 border-green-500/30';
    if (score >= 40) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-gray-500/10 border-gray-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-1">
          Multi-Project Relevance Assessment
        </h3>
        <p className="text-sm text-gray-400">
          {articleTitle ? articleTitle.slice(0, 80) + '...' : `PMID: ${articlePmid}`}
        </p>
      </div>

      {/* Best Match Highlight */}
      {bestMatch && bestMatch.score >= 40 && (
        <div className={`p-4 rounded-lg border ${getScoreBg(bestMatch.score)}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400 mb-1">🏆 Best Match</div>
              <div className="text-white font-medium">{bestMatch.name}</div>
              <div className="text-xs text-gray-500">
                {bestMatch.type === 'project' ? '📁 Project' : '📚 Collection'}
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getScoreColor(bestMatch.score)}`}>
                {bestMatch.score}
              </div>
              <div className="text-xs text-gray-400">/100</div>
            </div>
          </div>
          {bestMatch.type === 'project' && onAddToProject && (
            <ErythosButton
              variant="primary"
              size="sm"
              onClick={() => onAddToProject(bestMatch.id)}
              className="mt-3 w-full"
            >
              Add to {bestMatch.name}
            </ErythosButton>
          )}
          {bestMatch.type === 'collection' && onAddToCollection && (
            <ErythosButton
              variant="primary"
              size="sm"
              onClick={() => onAddToCollection(bestMatch.id)}
              className="mt-3 w-full"
            >
              Add to {bestMatch.name}
            </ErythosButton>
          )}
        </div>
      )}

      {/* Project Scores */}
      {projectScores.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">📁 Projects</h4>
          <div className="space-y-2">
            {projectScores
              .sort((a, b) => b.relevance_score - a.relevance_score)
              .map((project) => (
                <div
                  key={project.project_id}
                  className={`p-3 rounded-lg border ${getScoreBg(project.relevance_score)} flex items-center justify-between`}
                >
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">
                      {getScoreEmoji(project.relevance_score)} {project.project_name}
                    </div>
                    {project.reasoning && (
                      <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {project.reasoning}
                      </div>
                    )}
                  </div>
                  <div className={`text-xl font-bold ${getScoreColor(project.relevance_score)} ml-4`}>
                    {project.relevance_score}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Collection Scores */}
      {collectionScores.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">📚 Collections</h4>
          <div className="space-y-2">
            {collectionScores
              .sort((a, b) => b.relevance_score - a.relevance_score)
              .map((collection) => (
                <div
                  key={collection.collection_id}
                  className={`p-3 rounded-lg border ${getScoreBg(collection.relevance_score)} flex items-center justify-between`}
                >
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">
                      {getScoreEmoji(collection.relevance_score)} {collection.collection_name}
                    </div>
                    {collection.reasoning && (
                      <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {collection.reasoning}
                      </div>
                    )}
                  </div>
                  <div className={`text-xl font-bold ${getScoreColor(collection.relevance_score)} ml-4`}>
                    {collection.relevance_score}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* No Matches */}
      {projectScores.length === 0 && collectionScores.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🤷</div>
          <p>No projects or collections with research questions to compare against.</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-4 border-t border-gray-800">
        <span>🔴 Must Read (70+)</span>
        <span>🟡 Nice to Know (40-69)</span>
        <span>⚪ Low Relevance (&lt;40)</span>
      </div>

      {/* Close Button */}
      {onClose && (
        <div className="flex justify-center pt-2">
          <ErythosButton variant="ghost" onClick={onClose}>
            Close
          </ErythosButton>
        </div>
      )}
    </div>
  );
}

