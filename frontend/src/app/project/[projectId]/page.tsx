'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AnnotationsFeed from '@/components/AnnotationsFeed';
import ActivityFeed from '@/components/ActivityFeed';

interface Project {
  project_id: string;
  project_name: string;
  description?: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [creatingNote, setCreatingNote] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({
    title: '',
    objective: '',
    molecule: '',
    clinical_mode: false,
    dag_mode: false,
    full_text_only: false,
    preference: 'precision'
  });
  const [creatingReport, setCreatingReport] = useState(false);

  useEffect(() => {
    if (projectId && user) {
      fetchProject();
    }
  }, [projectId, user]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      const projectData = await response.json();
      setProject(projectData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!noteContent.trim()) return;
    
    setCreatingNote(true);
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/annotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
        body: JSON.stringify({
          content: noteContent.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create note');
      }

      // Reset form and close modal
      setNoteContent('');
      setShowNoteModal(false);
      
      // Note: The AnnotationsFeed component will automatically update via WebSocket
    } catch (err) {
      console.error('Error creating note:', err);
      alert('Failed to create note. Please try again.');
    } finally {
      setCreatingNote(false);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportData.title.trim() || !reportData.objective.trim()) return;
    
    setCreatingReport(true);
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
        body: JSON.stringify({
          title: reportData.title.trim(),
          objective: reportData.objective.trim(),
          molecule: reportData.molecule.trim() || null,
          clinical_mode: reportData.clinical_mode,
          dag_mode: reportData.dag_mode,
          full_text_only: reportData.full_text_only,
          preference: reportData.preference,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create report');
      }

      // Reset form and close modal
      setReportData({
        title: '',
        objective: '',
        molecule: '',
        clinical_mode: false,
        dag_mode: false,
        full_text_only: false,
        preference: 'precision'
      });
      setShowReportModal(false);
      
      // Note: The ActivityFeed component will automatically update via WebSocket
    } catch (err) {
      console.error('Error creating report:', err);
      alert('Failed to create report. Please try again.');
    } finally {
      setCreatingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Project not found'}</p>
          <a href="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <a
              href="/dashboard"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 text-sm"
            >
              ← Back to Projects
            </a>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{project.project_name}</h1>
          {project.description && (
            <p className="mt-2 text-gray-600">{project.description}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap gap-4">
          <button 
            onClick={() => setShowReportModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            New Report
          </button>
          <button 
            onClick={() => setShowNoteModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add Note
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => alert('Deep Dive Analysis functionality coming soon!')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Start Deep Dive Analysis
            </button>
            <button 
              onClick={() => alert('Summary Report functionality coming soon!')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Generate Summary Report
            </button>
            <button 
              onClick={() => alert('Invite Collaborators functionality coming soon!')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Invite Collaborators
            </button>
          </div>
        </div>

        {/* Add Note Modal */}
        {showNoteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Note</h3>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter your note..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={creatingNote}
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowNoteModal(false);
                    setNoteContent('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={creatingNote}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNote}
                  disabled={!noteContent.trim() || creatingNote}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {creatingNote ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Report</h3>
              <form onSubmit={handleCreateReport} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={reportData.title}
                    onChange={(e) => setReportData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter report title..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={creatingReport}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Research Objective *</label>
                  <textarea
                    value={reportData.objective}
                    onChange={(e) => setReportData(prev => ({ ...prev, objective: e.target.value }))}
                    placeholder="Describe the research objective..."
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={creatingReport}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Molecule (Optional)</label>
                  <input
                    type="text"
                    value={reportData.molecule}
                    onChange={(e) => setReportData(prev => ({ ...prev, molecule: e.target.value }))}
                    placeholder="Enter molecule name..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={creatingReport}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Preference</label>
                    <select
                      value={reportData.preference}
                      onChange={(e) => setReportData(prev => ({ ...prev, preference: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={creatingReport}
                    >
                      <option value="precision">Precision</option>
                      <option value="recall">Recall</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Options</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportData.clinical_mode}
                        onChange={(e) => setReportData(prev => ({ ...prev, clinical_mode: e.target.checked }))}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={creatingReport}
                      />
                      <span className="text-sm text-gray-700">Clinical Mode</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportData.dag_mode}
                        onChange={(e) => setReportData(prev => ({ ...prev, dag_mode: e.target.checked }))}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={creatingReport}
                      />
                      <span className="text-sm text-gray-700">DAG Mode</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportData.full_text_only}
                        onChange={(e) => setReportData(prev => ({ ...prev, full_text_only: e.target.checked }))}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={creatingReport}
                      />
                      <span className="text-sm text-gray-700">Full Text Only</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReportModal(false);
                      setReportData({
                        title: '',
                        objective: '',
                        molecule: '',
                        clinical_mode: false,
                        dag_mode: false,
                        full_text_only: false,
                        preference: 'precision'
                      });
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={creatingReport}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!reportData.title.trim() || !reportData.objective.trim() || creatingReport}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {creatingReport ? 'Creating...' : 'Create Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Annotations</h2>
            <AnnotationsFeed projectId={projectId} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity</h2>
            <ActivityFeed projectId={projectId} />
          </div>
        </div>
      </div>
    </div>
  );
}