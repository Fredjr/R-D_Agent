'use client';

import React from 'react';
import {
  PlayIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import {
  PlayIcon as PlayIconSolid,
} from '@heroicons/react/24/solid';

interface Project {
  project_id: string;
  project_name: string;
  description?: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
  reports?: Array<any>;
  collaborators?: Array<any>;
}

interface ResearchStats {
  questionsCount: number;
  hypothesesCount: number;
  evidenceCount: number;
  answeredCount: number;
}

interface EnhancedSpotifyProjectHeaderProps {
  project: Project;
  researchStats?: ResearchStats;
  onPlay?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
  onInvite?: () => void;
  onAlerts?: () => void;
  alertsCount?: number;
  isPlaying?: boolean;
}

export function EnhancedSpotifyProjectHeader({
  project,
  researchStats,
  onPlay,
  onShare,
  onSettings,
  onInvite,
  onAlerts,
  alertsCount = 0,
  isPlaying = false
}: EnhancedSpotifyProjectHeaderProps) {
  // Generate a visual representation for the project
  const getProjectVisual = () => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-teal-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-pink-500 to-rose-500'
    ];
    
    const colorIndex = project.project_id.charCodeAt(0) % colors.length;
    const gradient = colors[colorIndex];
    
    return (
      <div className={`w-full h-full bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center relative overflow-hidden`}>
        {/* Abstract pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-4 w-12 h-12 border-2 border-white rounded-full"></div>
          <div className="absolute top-8 right-6 w-6 h-6 border border-white rounded"></div>
          <div className="absolute bottom-6 left-6 w-16 h-2 bg-white rounded"></div>
          <div className="absolute bottom-10 left-6 w-12 h-2 bg-white rounded"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <DocumentTextIcon className="w-16 h-16 text-white opacity-30" />
          </div>
        </div>
        
        {/* Project type indicator */}
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/30 rounded text-white text-xs font-medium">
          Project
        </div>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const collaboratorCount = project.collaborators?.length || 0;
  const reportCount = project.reports?.length || 0;

  // Calculate completion percentage
  const completionPercentage = researchStats 
    ? Math.round((researchStats.answeredCount / Math.max(researchStats.questionsCount, 1)) * 100)
    : 0;

  return (
    <div className="w-full">
      {/* Mobile Header */}
      <div className="block lg:hidden">
        <div className="flex flex-col items-center text-center p-6">
          {/* Project Cover */}
          <div className="w-48 h-48 mb-4 shadow-2xl">
            {getProjectVisual()}
          </div>
          
          {/* Project Info */}
          <div className="mb-4">
            <p className="text-[var(--spotify-light-text)] text-sm font-medium mb-1">PROJECT</p>
            <h1 className="text-2xl font-bold text-[var(--spotify-white)] mb-2 line-clamp-2">
              {project.project_name}
            </h1>
            {project.description && (
              <p className="text-[var(--spotify-light-text)] text-sm mb-3 line-clamp-3">
                {project.description}
              </p>
            )}
            
            {/* Research Stats - Mobile */}
            {researchStats && (
              <div className="grid grid-cols-2 gap-2 mb-3 w-full max-w-xs">
                <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-2">
                  <div className="text-2xl font-bold text-[var(--spotify-white)]">{researchStats.questionsCount}</div>
                  <div className="text-xs text-[var(--spotify-light-text)]">Questions</div>
                </div>
                <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-2">
                  <div className="text-2xl font-bold text-[var(--spotify-white)]">{researchStats.hypothesesCount}</div>
                  <div className="text-xs text-[var(--spotify-light-text)]">Hypotheses</div>
                </div>
                <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-2">
                  <div className="text-2xl font-bold text-[var(--spotify-white)]">{researchStats.evidenceCount}</div>
                  <div className="text-xs text-[var(--spotify-light-text)]">Evidence</div>
                </div>
                <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-2">
                  <div className="text-2xl font-bold text-[var(--spotify-green)]">{completionPercentage}%</div>
                  <div className="text-xs text-[var(--spotify-light-text)]">Complete</div>
                </div>
              </div>
            )}
            
            {/* Project Stats */}
            <div className="flex items-center justify-center space-x-4 text-[var(--spotify-light-text)] text-sm">
              {collaboratorCount > 0 && (
                <div className="flex items-center space-x-1">
                  <UserGroupIcon className="w-4 h-4" />
                  <span>{collaboratorCount}</span>
                </div>
              )}
              {reportCount > 0 && (
                <div className="flex items-center space-x-1">
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>{reportCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 w-full">
            <button
              onClick={onPlay}
              className="flex-1 bg-[var(--spotify-green)] text-black py-3 rounded-full font-semibold hover:scale-105 transition-transform flex items-center justify-center space-x-2"
            >
              {isPlaying ? (
                <PlayIconSolid className="w-5 h-5" />
              ) : (
                <PlayIcon className="w-5 h-5" />
              )}
              <span>{isPlaying ? 'Playing' : 'Open'}</span>
            </button>

            <button
              onClick={onAlerts}
              className="relative p-3 text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] transition-colors"
            >
              <BellIcon className="w-6 h-6" />
              {alertsCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {alertsCount > 9 ? '9+' : alertsCount}
                </span>
              )}
            </button>

            <button
              onClick={onShare}
              className="p-3 text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] transition-colors"
            >
              <ShareIcon className="w-6 h-6" />
            </button>

            <button
              onClick={onSettings}
              className="p-3 text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] transition-colors"
            >
              <EllipsisHorizontalIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block">
        <div className="flex items-end space-x-6 p-6">
          {/* Project Cover */}
          <div className="w-60 h-60 flex-shrink-0 shadow-2xl">
            {getProjectVisual()}
          </div>

          {/* Project Info */}
          <div className="flex-1 min-w-0 pb-4">
            <p className="text-[var(--spotify-light-text)] text-sm font-medium mb-2">PROJECT</p>
            <h1 className="text-4xl lg:text-5xl font-bold text-[var(--spotify-white)] mb-4 line-clamp-2">
              {project.project_name}
            </h1>

            {project.description && (
              <p className="text-[var(--spotify-light-text)] text-base mb-4 line-clamp-2 max-w-2xl">
                {project.description}
              </p>
            )}

            {/* Research Stats - Desktop */}
            {researchStats && (
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <div className="text-lg font-bold text-[var(--spotify-white)]">{researchStats.questionsCount}</div>
                    <div className="text-xs text-[var(--spotify-light-text)]">Questions</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">💡</span>
                  <div>
                    <div className="text-lg font-bold text-[var(--spotify-white)]">{researchStats.hypothesesCount}</div>
                    <div className="text-xs text-[var(--spotify-light-text)]">Hypotheses</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">📄</span>
                  <div>
                    <div className="text-lg font-bold text-[var(--spotify-white)]">{researchStats.evidenceCount}</div>
                    <div className="text-xs text-[var(--spotify-light-text)]">Evidence</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">✅</span>
                  <div>
                    <div className="text-lg font-bold text-[var(--spotify-green)]">{completionPercentage}%</div>
                    <div className="text-xs text-[var(--spotify-light-text)]">Complete</div>
                  </div>
                </div>
              </div>
            )}

            {/* Project Metadata */}
            <div className="flex items-center space-x-6 text-[var(--spotify-light-text)] text-sm">
              <div className="flex items-center space-x-1">
                <CalendarIcon className="w-4 h-4" />
                <span>Created {formatDate(project.created_at)}</span>
              </div>

              {collaboratorCount > 0 && (
                <div className="flex items-center space-x-1">
                  <UserGroupIcon className="w-4 h-4" />
                  <span>{collaboratorCount} collaborator{collaboratorCount !== 1 ? 's' : ''}</span>
                </div>
              )}

              {reportCount > 0 && (
                <div className="flex items-center space-x-1">
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>{reportCount} report{reportCount !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Action Buttons */}
        <div className="flex items-center space-x-6 px-6 pb-6">
          <button
            onClick={onPlay}
            className="w-14 h-14 bg-[var(--spotify-green)] rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
          >
            {isPlaying ? (
              <PlayIconSolid className="w-6 h-6 text-black" />
            ) : (
              <PlayIcon className="w-6 h-6 text-black ml-0.5" />
            )}
          </button>

          <button
            onClick={onInvite}
            className="text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] transition-colors"
          >
            <UserGroupIcon className="w-8 h-8" />
          </button>

          <button
            onClick={onAlerts}
            className="relative text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] transition-colors"
          >
            <BellIcon className="w-8 h-8" />
            {alertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                {alertsCount > 9 ? '9+' : alertsCount}
              </span>
            )}
          </button>

          <button
            onClick={onShare}
            className="text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] transition-colors"
          >
            <ShareIcon className="w-8 h-8" />
          </button>

          <button
            onClick={onSettings}
            className="text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] transition-colors"
          >
            <EllipsisHorizontalIcon className="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default EnhancedSpotifyProjectHeader;
