'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, SparklesIcon, DocumentChartBarIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

interface Project {
  project_id: string;
  project_name: string;
}

interface Collection {
  collection_id: string;
  collection_name: string;
  article_count: number;
}

interface ErythosAnalyzeModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection?: Collection;  // Pre-selected collection (when analyzing from collection card)
  onSuccess?: (result: { type: string; projectId?: string }) => void;
}

type AnalysisType = 'report' | 'deep-dive' | 'insights';

export function ErythosAnalyzeModal({ isOpen, onClose, collection, onSuccess }: ErythosAnalyzeModalProps) {
  const { user } = useAuth();
  const [analysisType, setAnalysisType] = useState<AnalysisType>('report');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Report-specific fields
  const [reportTitle, setReportTitle] = useState('');
  const [reportObjective, setReportObjective] = useState('');
  const [molecule, setMolecule] = useState('');

  // Fetch projects on mount
  useEffect(() => {
    if (isOpen && user?.email) {
      fetchProjects();
    }
  }, [isOpen, user?.email]);

  // Set default title based on collection
  useEffect(() => {
    if (collection) {
      setReportTitle(`Analysis of ${collection.collection_name}`);
    }
  }, [collection]);

  const fetchProjects = async () => {
    if (!user?.email) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/proxy/projects', {
        headers: { 'User-ID': user.email }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    setIsSubmitting(true);
    try {
      if (analysisType === 'report') {
        // Create a report via generate-review API
        const response = await fetch('/api/proxy/generate-review', {
          method: 'POST',
          headers: {
            'User-ID': user.email,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            objective: reportObjective,
            molecule: molecule,
            project_id: selectedProjectId || undefined,
            collection_id: collection?.collection_id,
            preference: 'precision'
          })
        });

        if (response.ok) {
          const result = await response.json();
          onSuccess?.({ type: 'report', projectId: selectedProjectId });
          onClose();
        } else {
          throw new Error('Failed to start analysis');
        }
      } else if (analysisType === 'insights') {
        // Navigate to project insights if project selected
        if (selectedProjectId) {
          onSuccess?.({ type: 'insights', projectId: selectedProjectId });
          window.location.href = `/project/${selectedProjectId}?tab=insights`;
        }
        onClose();
      }
    } catch (error) {
      console.error('Error starting analysis:', error);
      alert('Failed to start analysis. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <SparklesIcon className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Analyze Collection</h2>
              {collection && (
                <p className="text-sm text-gray-400">{collection.collection_name} • {collection.article_count} papers</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Analysis Type Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">Analysis Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAnalysisType('report')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  analysisType === 'report'
                    ? 'border-purple-500 bg-purple-500/10 text-white'
                    : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                }`}
              >
                <DocumentChartBarIcon className="w-6 h-6 mb-2" />
                <div className="font-medium">Generate Report</div>
                <p className="text-xs text-gray-500 mt-1">AI-powered literature review</p>
              </button>
              <button
                type="button"
                onClick={() => setAnalysisType('insights')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  analysisType === 'insights'
                    ? 'border-purple-500 bg-purple-500/10 text-white'
                    : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                }`}
              >
                <SparklesIcon className="w-6 h-6 mb-2" />
                <div className="font-medium">AI Insights</div>
                <p className="text-xs text-gray-500 mt-1">View patterns & connections</p>
              </button>
            </div>
          </div>

          {/* Project Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Save to Project <span className="text-gray-500">(optional)</span>
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
              disabled={isLoading}
            >
              <option value="">No project (standalone analysis)</option>
              {projects.map((project) => (
                <option key={project.project_id} value={project.project_id}>
                  {project.project_name}
                </option>
              ))}
            </select>
          </div>

          {/* Report-specific fields */}
          {analysisType === 'report' && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Research Objective *</label>
                <textarea
                  value={reportObjective}
                  onChange={(e) => setReportObjective(e.target.value)}
                  placeholder="What do you want to learn from this collection?"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Molecule / Drug Name *</label>
                <input
                  type="text"
                  value={molecule}
                  onChange={(e) => setMolecule(e.target.value)}
                  placeholder="e.g., finerenone, metformin"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (analysisType === 'report' && (!reportObjective || !molecule))}
              className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  <span>Start Analysis</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ErythosAnalyzeModal;

