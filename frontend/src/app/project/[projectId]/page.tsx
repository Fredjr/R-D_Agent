'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AnnotationsFeed from '@/components/AnnotationsFeed';
import ActivityFeed from '@/components/ActivityFeed';
import ResultsList from '@/components/ResultsList';
import NetworkViewWithSidebar from '@/components/NetworkViewWithSidebar';
import Collections from '@/components/Collections';

interface Project {
  project_id: string;
  project_name: string;
  description?: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
  reports: Array<{
    report_id: string;
    title: string;
    objective: string;
    created_at: string;
    created_by: string;
  }>;
  collaborators: Array<{
    user_id: string;
    username: string;
    role: string;
    invited_at: string;
  }>;
  annotations: Array<{
    annotation_id: string;
    content: string;
    author_id: string;
    created_at: string;
    article_pmid?: string;
    report_id?: string;
  }>;
  deep_dive_analyses: Array<{
    analysis_id: string;
    article_title: string;
    article_pmid?: string;
    article_url?: string;
    processing_status: string;
    created_at: string;
    created_by: string;
  }>;
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

  const [showDeepDiveModal, setShowDeepDiveModal] = useState(false);
  const [deepDiveData, setDeepDiveData] = useState({
    article_title: '',
    article_pmid: '',
    article_url: '',
    objective: ''
  });
  const [creatingDeepDive, setCreatingDeepDive] = useState(false);
  const [creatingReport, setCreatingReport] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'viewer'
  });
  const [sendingInvite, setSendingInvite] = useState(false);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'overview' | 'collections' | 'network' | 'activity'>('overview');

  // Report generation results (same as Welcome Page)
  const [reportResults, setReportResults] = useState<any[]>([]);
  const [reportDiagnostics, setReportDiagnostics] = useState<any | null>(null);
  const [reportQueries, setReportQueries] = useState<string[] | null>(null);
  const [reportTitle, setReportTitle] = useState<string>('');
  const [reportObjective, setReportObjective] = useState<string>('');
  const [generatingReport, setGeneratingReport] = useState(false);

  // Comprehensive project summary state
  const [comprehensiveSummary, setComprehensiveSummary] = useState<any>(null);
  const [generatingComprehensiveSummary, setGeneratingComprehensiveSummary] = useState(false);

  useEffect(() => {
    if (projectId && user) {
      fetchProjectData();
    }
  }, [projectId, user]);

  const fetchProjectData = async () => {
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}`, {
        headers: {
          'User-ID': user?.email || 'default_user',
        },
      });

      if (response.status === 403) {
        setError('Access denied. You do not have permission to view this project. Please check if you are logged in with the correct account or if you have been granted access to this project.');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
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
    if (!reportData.title.trim() || !reportData.objective.trim() || !reportData.molecule.trim()) {
      alert('Please fill in all required fields (Title, Research Objective, and Molecule)');
      return;
    }
    
    setCreatingReport(true);

    // Store report data for background processing
    const reportToGenerate = {
      molecule: reportData.molecule.trim(),
      objective: reportData.objective.trim(),
      title: reportData.title.trim(),
      projectId: projectId,
      clinicalMode: reportData.clinical_mode,
      dagMode: reportData.dag_mode,
      fullTextOnly: reportData.full_text_only,
      preference: reportData.preference,
    };

    try {
      // Reset form and close modal immediately
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
      setCreatingReport(false);

      // Show user-friendly message
      // Use the same endpoint and approach as Welcome Page
      setGeneratingReport(true);

      try {
        const response = await fetch('/api/proxy/generate-review', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': user?.email || 'default_user',
          },
          body: JSON.stringify({
            molecule: reportToGenerate.molecule,
            objective: reportToGenerate.objective,
            projectId: projectId, // Include projectId to save to database
            clinicalMode: reportToGenerate.clinicalMode,
            dagMode: reportToGenerate.dagMode,
            fullTextOnly: reportToGenerate.fullTextOnly,
            preference: reportToGenerate.preference
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to generate report: ${errorText}`);
        }

        const data = await response.json();

        // Set the results to display them immediately (same as Welcome Page)
        const arr = Array.isArray(data?.results) ? data.results : [];
        const enriched = arr.map((it: any) => ({ ...it, _objective: reportToGenerate.objective, query: reportToGenerate.objective }));

        setReportResults(enriched);
        setReportDiagnostics(data?.diagnostics ?? null);
        setReportQueries(Array.isArray(data?.queries) ? data.queries : null);
        setReportTitle(reportToGenerate.title);
        setReportObjective(reportToGenerate.objective);

        // Show success message
        alert(`✅ Report "${reportToGenerate.title}" generated successfully!\n\nResults are displayed below and saved to the project.`);

        // Refresh project data to show the new report in the list
        fetchProjectData();

      } catch (error: any) {
        console.error('Error generating report:', error);
        alert(`❌ Failed to generate report: ${error.message || 'Unknown error'}. Please try again.`);
      } finally {
        setGeneratingReport(false);
      }

    } catch (err) {
      console.error('Error starting report generation:', err);
      alert('Failed to start report generation. Please try again.');
      setCreatingReport(false);
    }
  };

  const handleCreateDeepDive = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that at least one identifier is provided
    const hasTitle = deepDiveData.article_title.trim();
    const hasPmid = deepDiveData.article_pmid.trim();
    const hasUrl = deepDiveData.article_url.trim();

    if (!hasTitle && !hasPmid && !hasUrl) {
      alert('Please provide at least one of: Article Title, PMID, or Article URL');
      return;
    }

    if (!deepDiveData.objective.trim()) {
      alert('Please provide a research objective');
      return;
    }

    setCreatingDeepDive(true);
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/deep-dive-analyses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
        body: JSON.stringify({
          article_title: deepDiveData.article_title.trim(),
          objective: deepDiveData.objective.trim(),
          article_pmid: deepDiveData.article_pmid.trim() || null,
          article_url: deepDiveData.article_url.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create deep dive analysis');
      }

      // Reset form and close modal
      setDeepDiveData({
        article_title: '',
        article_pmid: '',
        article_url: '',
        objective: ''
      });
      setShowDeepDiveModal(false);
      
      // Note: The ActivityFeed component will automatically update via WebSocket
    } catch (err) {
      console.error('Error creating deep dive analysis:', err);
      alert('Failed to start deep dive analysis. Please try again.');
    } finally {
      setCreatingDeepDive(false);
    }
  };

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      // Generate project-linked summary report using new endpoint
      const summaryData = {
        molecule: project?.project_name || 'project-summary',
        objective: `Comprehensive summary of project: ${project?.project_name}`,
        preference: 'precision'
      };

      const response = await fetch(`/api/proxy/projects/${projectId}/generate-summary-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
        body: JSON.stringify(summaryData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary report');
      }

      setShowSummaryModal(false);
      
      // Refresh project data to show new report
      fetchProjectData();
      
      alert('Summary report generated successfully!');
    } catch (err) {
      console.error('Error generating summary:', err);
      alert('Failed to generate summary report. Please try again.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleGenerateComprehensiveSummary = async () => {
    setGeneratingComprehensiveSummary(true);
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/generate-comprehensive-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate comprehensive summary');
      }

      const data = await response.json();
      setComprehensiveSummary(data);
      alert('✅ Comprehensive project summary generated successfully!');
    } catch (error: any) {
      console.error('Error generating comprehensive summary:', error);
      alert(`❌ Failed to generate comprehensive summary: ${error.message}`);
    } finally {
      setGeneratingComprehensiveSummary(false);
    }
  };

  const handleInviteCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData.email.trim()) return;
    
    setSendingInvite(true);
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
        body: JSON.stringify({
          email: inviteData.email.trim(),
          role: inviteData.role,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send invitation');
      }

      // Reset form and close modal
      setInviteData({
        email: '',
        role: 'viewer'
      });
      setShowInviteModal(false);
      
      alert(`Invitation sent successfully to ${inviteData.email}!`);
      
      // Note: The ActivityFeed component will automatically update via WebSocket
    } catch (err) {
      console.error('Error sending invitation:', err);
      alert('Failed to send invitation. Please try again.');
    } finally {
      setSendingInvite(false);
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
              onClick={() => setShowDeepDiveModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Start Deep Dive Analysis
            </button>
            <button
              onClick={() => setShowSummaryModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Generate Summary Report
            </button>
            <button
              onClick={handleGenerateComprehensiveSummary}
              disabled={generatingComprehensiveSummary}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {generatingComprehensiveSummary ? 'Analyzing...' : 'Comprehensive Analysis'}
            </button>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Invite Collaborators
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('collections')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'collections'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Collections
              </button>
              <button
                onClick={() => setActiveTab('network')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'network'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Network View
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'activity'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Activity & Notes
              </button>
            </nav>
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
                    disabled={generatingReport}
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
                    disabled={generatingReport}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Molecule *</label>
                  <input
                    type="text"
                    value={reportData.molecule}
                    onChange={(e) => setReportData(prev => ({ ...prev, molecule: e.target.value }))}
                    placeholder="Enter molecule name (e.g., finerenone, metformin)..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={generatingReport}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Preference</label>
                    <select
                      value={reportData.preference}
                      onChange={(e) => setReportData(prev => ({ ...prev, preference: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={generatingReport}
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
                        disabled={generatingReport}
                      />
                      <span className="text-sm text-gray-700">Clinical Mode</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportData.dag_mode}
                        onChange={(e) => setReportData(prev => ({ ...prev, dag_mode: e.target.checked }))}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={generatingReport}
                      />
                      <span className="text-sm text-gray-700">DAG Mode</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportData.full_text_only}
                        onChange={(e) => setReportData(prev => ({ ...prev, full_text_only: e.target.checked }))}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={generatingReport}
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
                    disabled={generatingReport}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!reportData.title.trim() || !reportData.objective.trim() || !reportData.molecule.trim() || generatingReport}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {generatingReport ? 'Generating...' : 'Generate Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Deep Dive Analysis Modal */}
        {showDeepDiveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Start Deep Dive Analysis</h3>
              <form onSubmit={handleCreateDeepDive} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Article Title</label>
                  <input
                    type="text"
                    value={deepDiveData.article_title}
                    onChange={(e) => setDeepDiveData(prev => ({ ...prev, article_title: e.target.value }))}
                    placeholder="Enter article title..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={creatingDeepDive}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Research Objective *</label>
                  <textarea
                    value={deepDiveData.objective}
                    onChange={(e) => setDeepDiveData(prev => ({ ...prev, objective: e.target.value }))}
                    placeholder="Describe what you want to analyze about this article..."
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={creatingDeepDive}
                    required
                  />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-blue-700 font-medium mb-1">Article Identification</p>
                  <p className="text-xs text-blue-600">Provide at least one of the following to identify the article:</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PMID</label>
                    <input
                      type="text"
                      value={deepDiveData.article_pmid}
                      onChange={(e) => setDeepDiveData(prev => ({ ...prev, article_pmid: e.target.value }))}
                      placeholder="Enter PubMed ID..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={creatingDeepDive}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Article URL</label>
                    <input
                      type="url"
                      value={deepDiveData.article_url}
                      onChange={(e) => setDeepDiveData(prev => ({ ...prev, article_url: e.target.value }))}
                      placeholder="Enter article URL..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={creatingDeepDive}
                    />
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-700">
                    <strong>Deep Dive Analysis</strong> will perform comprehensive analysis including:
                  </p>
                  <ul className="text-sm text-purple-600 mt-2 ml-4 list-disc">
                    <li>Scientific model evaluation</li>
                    <li>Experimental methods assessment</li>
                    <li>Results interpretation analysis</li>
                  </ul>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeepDiveModal(false);
                      setDeepDiveData({
                        article_title: '',
                        article_pmid: '',
                        article_url: '',
                        objective: ''
                      });
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={creatingDeepDive}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!deepDiveData.article_title.trim() || !deepDiveData.objective.trim() || creatingDeepDive}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {creatingDeepDive ? 'Starting Analysis...' : 'Start Analysis'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Summary Report Modal */}
        {showSummaryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Summary Report</h3>
              <div className="space-y-4">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-sm text-indigo-700 mb-2">
                    <strong>Project Summary</strong> will generate a comprehensive overview including:
                  </p>
                  <ul className="text-sm text-indigo-600 ml-4 list-disc space-y-1">
                    <li>Project objectives and scope</li>
                    <li>All reports and their key findings</li>
                    <li>Deep dive analyses performed</li>
                    <li>Annotations and collaborative insights</li>
                    <li>Activity timeline and progress</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Project:</span>
                    <span className="font-medium text-gray-900">{project?.project_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-600">Created:</span>
                    <span className="text-gray-900">{project?.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowSummaryModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={generatingSummary}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateSummary}
                    disabled={generatingSummary}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {generatingSummary ? 'Generating...' : 'Generate Summary'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invite Collaborators Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Collaborator</h3>
              <form onSubmit={handleInviteCollaborator} className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-700 mb-2">
                    <strong>Invite a collaborator</strong> to join this project and contribute to research.
                  </p>
                  <ul className="text-sm text-orange-600 ml-4 list-disc space-y-1">
                    <li>Viewer: Can view project content and annotations</li>
                    <li>Editor: Can add notes, create reports, and collaborate</li>
                    <li>Admin: Full project management access</li>
                  </ul>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="colleague@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    value={inviteData.role}
                    onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={sendingInvite}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingInvite || !inviteData.email.trim()}
                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {sendingInvite ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Project Data Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 mb-8">
          {/* Reports Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports ({project.reports?.length || 0})</h3>
            {project.reports && project.reports.length > 0 ? (
              <div className="space-y-3">
                {project.reports.map((report) => (
                  <div 
                    key={report.report_id} 
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => window.open(`/report/${report.report_id}`, '_blank')}
                  >
                    <h4 className="font-medium text-gray-900 mb-1">{report.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{report.objective}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>By {report.created_by}</span>
                      <span>{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No reports yet. Create your first report to get started.</p>
            )}
          </div>

          {/* Report Iterations Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Iterations</h3>
            {project.reports && project.reports.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-3">
                  Track how your research evolves with each report iteration
                </div>
                {project.reports
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((report, index) => (
                  <div
                    key={report.report_id}
                    className="border border-gray-200 rounded-lg p-3 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer relative"
                    onClick={() => window.open(`/report/${report.report_id}`, '_blank')}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                        v{project.reports.length - index}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">{report.title}</h4>
                    <p className="text-xs text-gray-600 line-clamp-2">{report.objective}</p>
                    {index === 0 && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800">
                          Latest
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Iteration Insights</span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    Each report builds on previous research. Compare versions to see how your understanding evolves with new analyses and data.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-sm">No report iterations yet.</p>
                <p className="text-gray-400 text-xs mt-1">Create multiple reports to track research evolution</p>
              </div>
            )}
          </div>

          {/* Deep Dive Analyses Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deep Dive Analyses ({project.deep_dive_analyses?.length || 0})</h3>
            {project.deep_dive_analyses && project.deep_dive_analyses.length > 0 ? (
              <div className="space-y-3">
                {project.deep_dive_analyses.map((analysis) => (
                  <div 
                    key={analysis.analysis_id} 
                    className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => window.open(`/analysis/${analysis.analysis_id}`, '_blank')}
                  >
                    <h4 className="font-medium text-gray-900 mb-1">{analysis.article_title}</h4>
                    {analysis.article_pmid && (
                      <p className="text-sm text-blue-600 mb-1">PMID: {analysis.article_pmid}</p>
                    )}
                    <div className="flex justify-between items-center mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        analysis.processing_status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : analysis.processing_status === 'processing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {analysis.processing_status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>By {analysis.created_by}</span>
                      <span>{new Date(analysis.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No deep dive analyses yet. Start your first analysis to explore articles in detail.</p>
            )}
          </div>

          {/* Collaborators Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Collaborators ({project.collaborators?.length || 0})</h3>
            {project.collaborators && project.collaborators.length > 0 ? (
              <div className="space-y-3">
                {project.collaborators.map((collaborator) => (
                  <div key={collaborator.user_id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{collaborator.username}</p>
                      <p className="text-sm text-gray-600 capitalize">{collaborator.role}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(collaborator.invited_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No collaborators yet. Invite team members to collaborate on this project.</p>
            )}
          </div>
        </div>

        {/* Comprehensive Summary Results */}
        {comprehensiveSummary && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Comprehensive Project Analysis</h2>
              <p className="text-gray-600 mb-4">Generated on {new Date(comprehensiveSummary.generated_at).toLocaleDateString()}</p>

              {/* Executive Summary */}
              {comprehensiveSummary.analysis_results?.synthesis?.executive_summary && (
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">Executive Summary</h3>
                  <p className="text-blue-800 text-sm leading-relaxed">
                    {comprehensiveSummary.analysis_results.synthesis.executive_summary}
                  </p>
                </div>
              )}

              {/* Key Achievements */}
              {comprehensiveSummary.analysis_results?.synthesis?.key_achievements && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Key Achievements</h3>
                  <ul className="space-y-2">
                    {comprehensiveSummary.analysis_results.synthesis.key_achievements.map((achievement: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-gray-700 text-sm">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Strategic Recommendations */}
              {comprehensiveSummary.analysis_results?.synthesis?.strategic_recommendations && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Strategic Recommendations</h3>
                  <ul className="space-y-2">
                    {comprehensiveSummary.analysis_results.synthesis.strategic_recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-blue-500 mr-2">→</span>
                        <span className="text-gray-700 text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Project Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{comprehensiveSummary.metadata?.total_reports || 0}</div>
                  <div className="text-sm text-gray-600">Reports</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{comprehensiveSummary.metadata?.total_deep_dives || 0}</div>
                  <div className="text-sm text-gray-600">Deep Dives</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{comprehensiveSummary.metadata?.total_annotations || 0}</div>
                  <div className="text-sm text-gray-600">Annotations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{comprehensiveSummary.metadata?.project_duration_days || 0}</div>
                  <div className="text-sm text-gray-600">Days Active</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Results Section (same as Welcome Page) */}
        {reportResults.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{reportTitle}</h2>
              <p className="text-gray-600 mb-4">{reportObjective}</p>

              {/* Diagnostics (same as Welcome Page) */}
              {reportDiagnostics && (
                <div className="p-3 sm:p-4 rounded-md bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm mb-6">
                  <div className="font-medium mb-2">Run details</div>
                  <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm">
                    <span>Pool: {reportDiagnostics.pool_size || 0}</span>
                    <span>Shortlist: {reportDiagnostics.shortlist_size || 0}</span>
                    <span>Deep-dive: {reportDiagnostics.deep_dive_count || 0}</span>
                    {reportDiagnostics.timings_ms && (
                      <>
                        <span>Plan: {reportDiagnostics.timings_ms.plan_ms || 0}ms</span>
                        <span>Harvest: {reportDiagnostics.timings_ms.harvest_ms || 0}ms</span>
                        <span>Deep-dive: {reportDiagnostics.timings_ms.deepdive_ms || 0}ms</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Results List (same as Welcome Page) */}
            <ResultsList results={reportResults} />
          </div>
        )}

            </>
        )}

        {/* Collections Tab */}
        {activeTab === 'collections' && (
          <div className="mb-8">
            <Collections
              projectId={projectId}
              onRefresh={fetchProjectData}
            />
          </div>
        )}

        {/* Network View Tab */}
        {activeTab === 'network' && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Citation Network</h2>
                <p className="text-gray-600">
                  Explore the relationships between articles in this project through citation networks.
                  Click on nodes to see article details and discover related research.
                </p>
              </div>
              <div className="h-[600px]">
                <NetworkViewWithSidebar
                  sourceType="project"
                  sourceId={projectId}
                  projectId={projectId}
                  onDeepDiveCreated={fetchProjectData}
                  onArticleSaved={fetchProjectData}
                />
              </div>
            </div>
          </div>
        )}

        {/* Activity & Notes Tab */}
        {activeTab === 'activity' && (
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
        )}
      </div>
    </div>
  );
}