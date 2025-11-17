'use client';

import React, { useState } from 'react';
import {
  PencilIcon,
  BeakerIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  DocumentPlusIcon,
  ChartBarIcon,
  ArrowTopRightOnSquareIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import {
  SpotifyTabSection,
  SpotifyTabGrid,
  SpotifyTabCard,
  SpotifyTabCardHeader,
  SpotifyTabCardContent,
  SpotifyTabStatCard,
  SpotifyTabButton,
  SpotifyTabIconButton,
  SpotifyTabQuickAction
} from './shared';
import { QuestionsTreeSection } from './questions';

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(() => import('@/components/reading/PDFViewer'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8">Loading PDF viewer...</div>
});

interface ResearchQuestionTabProps {
  project: any;
  user?: any;
  totalPapers?: number;
  collectionsCount?: number;
  onUpdateProject: (updates: any) => Promise<void>;
  onNavigateToTab?: (tab: string) => void;
  onOpenModal?: (modal: 'collection' | 'note' | 'report') => void;
}

export function ResearchQuestionTab({
  project,
  user,
  totalPapers = 0,
  collectionsCount = 0,
  onUpdateProject,
  onNavigateToTab,
  onOpenModal
}: ResearchQuestionTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [researchQuestion, setResearchQuestion] = useState(
    project.settings?.research_question || ''
  );
  const [description, setDescription] = useState(project.description || '');
  const [isSaving, setIsSaving] = useState(false);

  // PDF Viewer state for seed paper
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [selectedPMID, setSelectedPMID] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateProject({
        description,
        settings: {
          ...project.settings,
          research_question: researchQuestion
        }
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update project:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewSeedPaperPDF = () => {
    if (project.settings?.seed_paper_pmid) {
      setSelectedPMID(project.settings.seed_paper_pmid);
      setSelectedTitle(project.settings.seed_paper_title || 'Seed Paper');
      setShowPDFViewer(true);
    }
  };

  return (
    <>
      <div id="research-question-section">
        <SpotifyTabSection>
          {/* Research Question Card */}
        <SpotifyTabCard variant="gradient" gradient="from-blue-500/10 to-purple-500/10">
          <SpotifyTabCardHeader
            icon="🎯"
            title="Research Question"
            description="The core question driving this project"
            action={
              !isEditing && (
                <SpotifyTabIconButton
                  icon={<PencilIcon />}
                  onClick={() => setIsEditing(true)}
                  title="Edit research question"
                  aria-label="Edit research question"
                />
              )
            }
          />
          <SpotifyTabCardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--spotify-light-text)] mb-2">
                    Research Question
                  </label>
                  <textarea
                    value={researchQuestion}
                    onChange={(e) => setResearchQuestion(e.target.value)}
                    placeholder="What specific question are you trying to answer?"
                    rows={3}
                    className="w-full px-4 py-3 bg-[var(--spotify-dark-gray)] text-[var(--spotify-white)] border-2 border-[var(--spotify-border-gray)] rounded-lg focus:border-[var(--spotify-green)] focus:outline-none placeholder:text-[var(--spotify-light-text)]"
                  />
                </div>
                <div className="flex gap-2">
                  <SpotifyTabButton
                    onClick={handleSave}
                    disabled={isSaving}
                    variant="primary"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </SpotifyTabButton>
                  <SpotifyTabButton
                    onClick={() => {
                      setIsEditing(false);
                      setResearchQuestion(project.settings?.research_question || '');
                    }}
                    disabled={isSaving}
                    variant="ghost"
                  >
                    Cancel
                  </SpotifyTabButton>
                </div>
              </div>
            ) : (
              <p className="text-lg text-[var(--spotify-white)] leading-relaxed">
                {researchQuestion || (
                  <span className="text-[var(--spotify-light-text)] italic">
                    Click edit to add your research question
                  </span>
                )}
              </p>
            )}
          </SpotifyTabCardContent>
        </SpotifyTabCard>

        {/* Project Description */}
        <SpotifyTabCard>
          <SpotifyTabCardHeader
            title="Project Description"
            action={
              !isEditing && (
                <SpotifyTabIconButton
                  icon={<PencilIcon />}
                  onClick={() => setIsEditing(true)}
                  title="Edit description"
                  size="sm"
                />
              )
            }
          />
          <SpotifyTabCardContent>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more context about your research goals..."
                rows={4}
                className="w-full px-4 py-3 bg-[var(--spotify-dark-gray)] text-[var(--spotify-white)] border-2 border-[var(--spotify-border-gray)] rounded-lg focus:border-[var(--spotify-green)] focus:outline-none placeholder:text-[var(--spotify-light-text)]"
              />
            ) : (
              <p className="text-[var(--spotify-white)] leading-relaxed">
                {description || (
                  <span className="text-[var(--spotify-light-text)] italic">
                    No description yet. Click edit to add one.
                  </span>
                )}
              </p>
            )}
          </SpotifyTabCardContent>
        </SpotifyTabCard>

        {/* Quick Stats */}
        <SpotifyTabGrid columns={4}>
          <SpotifyTabStatCard
            icon={<BeakerIcon />}
            label="Papers"
            value={totalPapers}
            subtext="Total articles"
            color="blue"
            onClick={() => onNavigateToTab?.('explore')}
          />
          <SpotifyTabStatCard
            icon={<FolderIcon />}
            label="Collections"
            value={collectionsCount}
            subtext="Organized groups"
            color="green"
            onClick={() => onNavigateToTab?.('collections')}
          />
          <SpotifyTabStatCard
            icon={<ChatBubbleLeftRightIcon />}
            label="Notes"
            value={project.annotations_count || project.annotations?.length || 0}
            subtext="Research notes"
            color="purple"
            onClick={() => onNavigateToTab?.('notes')}
          />
          <SpotifyTabStatCard
            icon={<DocumentTextIcon />}
            label="Analyses"
            value={(project.reports_count || project.reports?.length || 0) + (project.deep_dive_analyses_count || project.deep_dive_analyses?.length || 0)}
            subtext="Reports & deep dives"
            color="orange"
            onClick={() => onNavigateToTab?.('analysis')}
          />
        </SpotifyTabGrid>

        {/* Seed Paper (if exists) */}
        {project.settings?.seed_paper_pmid && (
          <SpotifyTabCard variant="gradient" gradient="from-green-500/10 to-emerald-500/10" className="border-[var(--spotify-green)]">
            <SpotifyTabCardHeader
              icon="🌱"
              title="Seed Paper"
              description="This paper was selected during onboarding as the foundation for your research exploration."
            />
            <SpotifyTabCardContent>
              <p className="text-base text-[var(--spotify-white)] font-medium mb-4 leading-relaxed">
                {project.settings.seed_paper_title || 'Starting point for your research'}
              </p>
              <div className="flex flex-wrap gap-2">
                <SpotifyTabButton
                  onClick={handleViewSeedPaperPDF}
                  icon={<BookOpenIcon />}
                  variant="primary"
                  size="sm"
                >
                  Read PDF
                </SpotifyTabButton>
                <a
                  href={`https://pubmed.ncbi.nlm.nih.gov/${project.settings.seed_paper_pmid}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SpotifyTabButton
                    icon={<ArrowTopRightOnSquareIcon />}
                    variant="secondary"
                    size="sm"
                  >
                    View on PubMed
                  </SpotifyTabButton>
                </a>
                <SpotifyTabButton
                  onClick={() => onNavigateToTab?.('explore')}
                  icon={<MagnifyingGlassIcon />}
                  variant="secondary"
                  size="sm"
                >
                  Explore Related Papers
                </SpotifyTabButton>
              </div>
            </SpotifyTabCardContent>
          </SpotifyTabCard>
        )}

        {/* Project Metadata */}
        <SpotifyTabCard>
          <SpotifyTabCardHeader
            title="Project Information"
          />
          <SpotifyTabCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[var(--spotify-light-text)] mb-1">Created</p>
                <p className="text-sm font-medium text-[var(--spotify-white)]">
                  {project.created_at ? new Date(project.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--spotify-light-text)] mb-1">Last Updated</p>
                <p className="text-sm font-medium text-[var(--spotify-white)]">
                  {project.updated_at ? new Date(project.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--spotify-light-text)] mb-1">Owner</p>
                <p className="text-sm font-medium text-[var(--spotify-white)]">
                  {project.owner_user_id || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--spotify-light-text)] mb-1">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  project.is_active
                    ? 'bg-[var(--spotify-green)]/20 text-[var(--spotify-green)] border border-[var(--spotify-green)]/30'
                    : 'bg-[var(--spotify-dark-gray)] text-[var(--spotify-light-text)] border border-[var(--spotify-border-gray)]'
                }`}>
                  {project.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </SpotifyTabCardContent>
        </SpotifyTabCard>

        {/* Research Questions Tree - NEW FEATURE */}
        {user && (
          <QuestionsTreeSection
            projectId={project.project_id}
            userId={user.email || user.user_id}
          />
        )}
        </SpotifyTabSection>
      </div>

      {/* PDF Viewer Modal for Seed Paper */}
      {showPDFViewer && selectedPMID && (
        <PDFViewer
          pmid={selectedPMID}
          title={selectedTitle || 'Seed Paper'}
          onClose={() => {
            setShowPDFViewer(false);
            setSelectedPMID(null);
            setSelectedTitle(null);
          }}
          projectId={project.project_id}
        />
      )}
    </>
  );
}

export default ResearchQuestionTab;

