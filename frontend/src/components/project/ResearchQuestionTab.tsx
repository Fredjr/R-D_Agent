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

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(() => import('@/components/reading/PDFViewer'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8">Loading PDF viewer...</div>
});

interface ResearchQuestionTabProps {
  project: any;
  onUpdateProject: (updates: any) => Promise<void>;
  onNavigateToTab?: (tab: string) => void;
  onOpenModal?: (modal: 'collection' | 'note' | 'report') => void;
}

export function ResearchQuestionTab({
  project,
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
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigateToTab?.('explore')}
            className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                <MagnifyingGlassIcon className="w-5 h-5 text-blue-600 group-hover:text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">Search Papers</span>
            </div>
            <p className="text-xs text-gray-600">Explore and discover research</p>
          </button>

          <button
            onClick={() => onOpenModal?.('collection')}
            className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-500 transition-colors">
                <PlusIcon className="w-5 h-5 text-green-600 group-hover:text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">New Collection</span>
            </div>
            <p className="text-xs text-gray-600">Organize your papers</p>
          </button>

          <button
            onClick={() => onOpenModal?.('note')}
            className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                <DocumentPlusIcon className="w-5 h-5 text-purple-600 group-hover:text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">Add Note</span>
            </div>
            <p className="text-xs text-gray-600">Capture your insights</p>
          </button>

          <button
            onClick={() => onOpenModal?.('report')}
            className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                <ChartBarIcon className="w-5 h-5 text-orange-600 group-hover:text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">Generate Report</span>
            </div>
            <p className="text-xs text-gray-600">Analyze your research</p>
          </button>
        </div>

        {/* Research Question Card */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Research Question</h2>
              <p className="text-sm text-gray-600">The core question driving this project</p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
              title="Edit research question"
              aria-label="Edit research question"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Research Question
              </label>
              <textarea
                value={researchQuestion}
                onChange={(e) => setResearchQuestion(e.target.value)}
                placeholder="What specific question are you trying to answer?"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setResearchQuestion(project.settings?.research_question || '');
                }}
                disabled={isSaving}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-lg text-gray-800 leading-relaxed">
            {researchQuestion || (
              <span className="text-gray-400 italic">
                Click edit to add your research question
              </span>
            )}
          </p>
        )}
      </div>

      {/* Project Description */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Project Description</h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              title="Edit description"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        {isEditing ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more context about your research goals..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        ) : (
          <p className="text-gray-700 leading-relaxed">
            {description || (
              <span className="text-gray-400 italic">
                No description yet. Click edit to add one.
              </span>
            )}
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <BeakerIcon className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Papers</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {project.total_papers || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total articles</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-green-300 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <FolderIcon className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Collections</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {project.collections?.length || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Organized groups</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Notes</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {project.annotations?.length || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Research notes</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-orange-300 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <DocumentTextIcon className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-600">Analyses</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {(project.reports?.length || 0) + (project.deep_dives?.length || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Reports & deep dives</p>
        </div>
      </div>

      {/* Seed Paper (if exists) */}
      {project.settings?.seed_paper_pmid && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🌱</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-green-900">Seed Paper</h3>
                  <span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs font-medium rounded-full">
                    Starting Point
                  </span>
                </div>
                <p className="text-base text-green-900 font-medium mb-2 leading-relaxed">
                  {project.settings.seed_paper_title || 'Starting point for your research'}
                </p>
                <p className="text-sm text-green-700 mb-4">
                  This paper was selected during onboarding as the foundation for your research exploration.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleViewSeedPaperPDF}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <BookOpenIcon className="w-4 h-4" />
                    Read PDF
                  </button>
                  <a
                    href={`https://pubmed.ncbi.nlm.nih.gov/${project.settings.seed_paper_pmid}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
                  >
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    View on PubMed
                  </a>
                  <button
                    onClick={() => onNavigateToTab?.('explore')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
                  >
                    <MagnifyingGlassIcon className="w-4 h-4" />
                    Explore Related Papers
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Metadata */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Created</p>
            <p className="text-sm font-medium text-gray-900">
              {project.created_at ? new Date(project.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Last Updated</p>
            <p className="text-sm font-medium text-gray-900">
              {project.updated_at ? new Date(project.updated_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Owner</p>
            <p className="text-sm font-medium text-gray-900">
              {project.owner_user_id || 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              project.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {project.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Research Topics (if exists) */}
      {project.tags && project.tags.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Research Topics</h3>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
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

