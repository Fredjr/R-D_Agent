'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ErythosButton } from '../ErythosButton';

interface Project {
  project_id: string;
  project_name: string;
  collections?: Collection[];
}

interface Collection {
  collection_id: string;
  collection_name: string;
  hypotheses?: Hypothesis[];
}

interface Hypothesis {
  hypothesis_id: string;
  hypothesis_text: string;
  status?: string;
  support_score?: number;
}

interface HypothesisInfo {
  hypothesis: Hypothesis;
  papersCount: number;
  relevantPercent: number;
  status: string;
  statusScore: number;
}

export function ErythosExploreTab() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Cascade selection state
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<string>('');
  
  // Hypothesis info
  const [hypothesisInfo, setHypothesisInfo] = useState<HypothesisInfo | null>(null);

  // Load projects with collections and hypotheses
  const loadHierarchy = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      // Fetch projects
      const projectsRes = await fetch('/api/proxy/projects', {
        headers: { 'User-ID': user.email }
      });
      
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        
        // For each project, fetch collections and hypotheses
        const enrichedProjects = await Promise.all(
          projectsData.map(async (project: Project) => {
            // Fetch collections for project
            const collectionsRes = await fetch(`/api/proxy/projects/${project.project_id}/collections`, {
              headers: { 'User-ID': user.email }
            });
            const collections = collectionsRes.ok ? await collectionsRes.json() : [];

            // Fetch hypotheses for project
            const hypothesesRes = await fetch(`/api/proxy/projects/${project.project_id}/hypotheses`, {
              headers: { 'User-ID': user.email }
            });
            const hypotheses = hypothesesRes.ok ? await hypothesesRes.json() : [];

            return {
              ...project,
              collections: collections.map((c: Collection) => ({
                ...c,
                hypotheses: hypotheses.filter((h: any) => h.collection_id === c.collection_id || !h.collection_id)
              }))
            };
          })
        );
        
        setProjects(enrichedProjects);
      }
    } catch (error) {
      console.error('Error loading hierarchy:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    loadHierarchy();
  }, [loadHierarchy]);

  // Get selected entities
  const selectedProject = projects.find(p => p.project_id === selectedProjectId);
  const selectedCollection = selectedProject?.collections?.find(c => c.collection_id === selectedCollectionId);
  const selectedHypothesis = selectedCollection?.hypotheses?.find(h => h.hypothesis_id === selectedHypothesisId);

  // Update hypothesis info when selection changes
  useEffect(() => {
    if (selectedHypothesis) {
      setHypothesisInfo({
        hypothesis: selectedHypothesis,
        papersCount: 24, // TODO: Fetch from API
        relevantPercent: 68,
        status: selectedHypothesis.status || 'Strongly Supported',
        statusScore: selectedHypothesis.support_score || 92
      });
    } else {
      setHypothesisInfo(null);
    }
  }, [selectedHypothesis]);

  const handleFindPapers = () => {
    if (selectedHypothesisId) {
      router.push(`/discover?tab=all-papers&hypothesis=${selectedHypothesisId}`);
    }
  };

  const handleGenerateReport = () => {
    if (selectedProjectId && selectedHypothesisId) {
      router.push(`/project/${selectedProjectId}/reports/new?hypothesis=${selectedHypothesisId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="ml-3 text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hypothesis Cascade */}
      <div className="p-6 bg-gradient-to-br from-purple-900/20 to-purple-800/10 rounded-xl border border-purple-500/20">
        <h3 className="text-lg font-semibold text-white mb-4">🔬 Hypothesis Cascade</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Project selector */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">PROJECT</label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedCollectionId('');
                setSelectedHypothesisId('');
              }}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            >
              <option value="">Select Project...</option>
              {projects.map(p => (
                <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
              ))}
            </select>
          </div>

          {/* Collection selector */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">COLLECTION</label>
            <select
              value={selectedCollectionId}
              onChange={(e) => {
                setSelectedCollectionId(e.target.value);
                setSelectedHypothesisId('');
              }}
              disabled={!selectedProjectId}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
            >
              <option value="">Select Collection...</option>
              {selectedProject?.collections?.map(c => (
                <option key={c.collection_id} value={c.collection_id}>{c.collection_name}</option>
              ))}
            </select>
          </div>

          {/* Hypothesis selector */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">SUB-HYPOTHESIS</label>
            <select
              value={selectedHypothesisId}
              onChange={(e) => setSelectedHypothesisId(e.target.value)}
              disabled={!selectedCollectionId}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
            >
              <option value="">Select Hypothesis...</option>
              {selectedCollection?.hypotheses?.map(h => (
                <option key={h.hypothesis_id} value={h.hypothesis_id}>
                  {h.hypothesis_text.length > 60 ? h.hypothesis_text.slice(0, 60) + '...' : h.hypothesis_text}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Hypothesis Info Box */}
      {hypothesisInfo && (
        <div className="p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Hypothesis Info</h3>

          {/* Hypothesis text */}
          <div className="mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <p className="text-gray-200">{hypothesisInfo.hypothesis.hypothesis_text}</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold text-white">{hypothesisInfo.papersCount}</div>
              <div className="text-sm text-gray-400">Papers in collection</div>
            </div>
            <div className="text-center p-3 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">{hypothesisInfo.relevantPercent}%</div>
              <div className="text-sm text-gray-400">Relevant</div>
            </div>
            <div className="text-center p-3 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{hypothesisInfo.statusScore}%</div>
              <div className="text-sm text-gray-400">{hypothesisInfo.status}</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <ErythosButton variant="primary" onClick={handleFindPapers}>
              🔍 Find Papers
            </ErythosButton>
            <ErythosButton variant="secondary" onClick={handleGenerateReport}>
              📄 Generate Report
            </ErythosButton>
          </div>
        </div>
      )}

      {/* Empty state when no hypothesis selected */}
      {!hypothesisInfo && !loading && (
        <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <div className="text-6xl mb-4">🔬</div>
          <h3 className="text-xl font-semibold text-white mb-2">Select a Hypothesis</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Use the cascade above to select a project, collection, and hypothesis to explore.
          </p>
        </div>
      )}
    </div>
  );
}

