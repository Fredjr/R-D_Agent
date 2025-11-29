'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ErythosButton } from '../ErythosButton';
import { ErythosModal } from '../ErythosModal';

interface Project {
  project_id: string;
  project_name: string;
}

interface Collection {
  id: string;
  name: string;
  has_qh?: boolean; // has questions or hypotheses
}

interface TriageContextSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContext: (context: TriageContext) => void;
  searchQuery?: string;
  articlePmid: string;
  articleTitle?: string;
}

export interface TriageContext {
  type: 'search_query' | 'project' | 'collection' | 'ad_hoc' | 'multi_project';
  searchQuery?: string;
  projectId?: string;
  collectionId?: string;
  adHocQuestion?: string;
  displayName?: string;
}

export function TriageContextSelector({
  isOpen,
  onClose,
  onSelectContext,
  searchQuery,
  articlePmid,
  articleTitle
}: TriageContextSelectorProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [adHocQuestion, setAdHocQuestion] = useState('');
  const [selectedTab, setSelectedTab] = useState<'quick' | 'targeted' | 'multi'>('quick');

  // Fetch user's projects and collections
  useEffect(() => {
    if (isOpen && user?.email) {
      fetchProjectsAndCollections();
    }
  }, [isOpen, user?.email]);

  const fetchProjectsAndCollections = async () => {
    if (!user?.email) return;
    setLoading(true);

    try {
      // Fetch projects
      const projectsRes = await fetch('/api/proxy/projects', {
        headers: { 'User-ID': user.email }
      });
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.projects || data || []);
      }

      // Fetch collections
      const collectionsRes = await fetch('/api/proxy/collections', {
        headers: { 'User-ID': user.email }
      });
      if (collectionsRes.ok) {
        const data = await collectionsRes.json();
        // Filter to only show collections with Q&H
        const collectionsWithQH = (data.collections || data || []).filter(
          (c: any) => c.questions_count > 0 || c.hypotheses_count > 0
        );
        setCollections(collectionsWithQH);
      }
    } catch (error) {
      console.error('Error fetching projects/collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTriage = () => {
    if (!searchQuery) {
      alert('No search query available for quick triage');
      return;
    }
    onSelectContext({
      type: 'search_query',
      searchQuery,
      displayName: `Search: "${searchQuery}"`
    });
  };

  const handleProjectTriage = (project: Project) => {
    onSelectContext({
      type: 'project',
      projectId: project.project_id,
      displayName: project.project_name
    });
  };

  const handleCollectionTriage = (collection: Collection) => {
    onSelectContext({
      type: 'collection',
      collectionId: collection.id,
      displayName: collection.name
    });
  };

  const handleAdHocTriage = () => {
    if (!adHocQuestion.trim()) {
      alert('Please enter a research question');
      return;
    }
    onSelectContext({
      type: 'ad_hoc',
      adHocQuestion: adHocQuestion.trim(),
      displayName: `Custom: "${adHocQuestion.trim().slice(0, 30)}..."`
    });
  };

  const handleMultiProjectTriage = () => {
    onSelectContext({
      type: 'multi_project',
      displayName: 'All Projects & Collections'
    });
  };

  const hasProjectsOrCollections = projects.length > 0 || collections.length > 0;

  return (
    <ErythosModal
      isOpen={isOpen}
      onClose={onClose}
      title="🤖 AI Triage Options"
      subtitle={articleTitle ? `Analyzing: ${articleTitle.slice(0, 60)}...` : `PMID: ${articlePmid}`}
    >
      <div className="space-y-4">
        {/* Tab Selection */}
        <div className="flex gap-2 border-b border-gray-700 pb-2">
          <button
            onClick={() => setSelectedTab('quick')}
            className={`px-3 py-2 rounded-t text-sm font-medium transition-colors ${
              selectedTab === 'quick'
                ? 'bg-orange-500/20 text-orange-400 border-b-2 border-orange-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ⚡ Quick
          </button>
          <button
            onClick={() => setSelectedTab('targeted')}
            className={`px-3 py-2 rounded-t text-sm font-medium transition-colors ${
              selectedTab === 'targeted'
                ? 'bg-orange-500/20 text-orange-400 border-b-2 border-orange-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🎯 Targeted
          </button>
          {hasProjectsOrCollections && (
            <button
              onClick={() => setSelectedTab('multi')}
              className={`px-3 py-2 rounded-t text-sm font-medium transition-colors ${
                selectedTab === 'multi'
                  ? 'bg-orange-500/20 text-orange-400 border-b-2 border-orange-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🔬 Multi-Project
            </button>
          )}
        </div>

        {/* Tab Content */}
        {selectedTab === 'quick' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Fast relevance check based on your search query.
            </p>

            {/* Search Query Option */}
            {searchQuery && (
              <div
                onClick={handleQuickTriage}
                className="p-4 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-lg border border-orange-500/30 cursor-pointer hover:border-orange-500/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">⚡</div>
                  <div>
                    <h4 className="font-medium text-white">Quick Triage</h4>
                    <p className="text-sm text-gray-400">
                      Based on: &quot;{searchQuery}&quot;
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Ad-hoc Question */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <h4 className="font-medium text-white mb-2">✏️ Custom Research Question</h4>
              <textarea
                value={adHocQuestion}
                onChange={(e) => setAdHocQuestion(e.target.value)}
                placeholder="Enter your research question..."
                className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:border-orange-500 focus:outline-none"
                rows={2}
              />
              <ErythosButton
                variant="primary"
                size="sm"
                onClick={handleAdHocTriage}
                disabled={!adHocQuestion.trim()}
                className="mt-2"
              >
                Analyze with Custom Question
              </ErythosButton>
            </div>
          </div>
        )}

        {selectedTab === 'targeted' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Analyze against specific project or collection research questions.
            </p>

            {loading ? (
              <div className="text-center py-4 text-gray-400">Loading...</div>
            ) : (
              <>
                {/* Projects */}
                {projects.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">📁 Projects</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {projects.map((project) => (
                        <div
                          key={project.project_id}
                          onClick={() => handleProjectTriage(project)}
                          className="p-3 bg-gray-800/50 rounded border border-gray-700 cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
                        >
                          <span className="text-white">{project.project_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Collections with Q&H */}
                {collections.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">📚 Collections with Q&H</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {collections.map((collection) => (
                        <div
                          key={collection.id}
                          onClick={() => handleCollectionTriage(collection)}
                          className="p-3 bg-gray-800/50 rounded border border-gray-700 cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all"
                        >
                          <span className="text-white">{collection.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {projects.length === 0 && collections.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No projects or collections with research questions found.
                    <br />
                    <span className="text-sm">Create a project first or add Q&H to a collection.</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {selectedTab === 'multi' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Score this paper against ALL your projects and collections to see where it fits best.
            </p>

            <div
              onClick={handleMultiProjectTriage}
              className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/30 cursor-pointer hover:border-purple-500/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🔬</div>
                <div>
                  <h4 className="font-medium text-white">Multi-Project Assessment</h4>
                  <p className="text-sm text-gray-400">
                    Compare relevance across {projects.length} projects and {collections.length} collections
                  </p>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 bg-gray-800/50 p-3 rounded">
              💡 This will show a relevance matrix comparing how this paper fits each of your research contexts.
            </div>
          </div>
        )}
      </div>
    </ErythosModal>
  );
}

