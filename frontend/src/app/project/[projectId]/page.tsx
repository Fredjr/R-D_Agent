'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  DocumentTextIcon, 
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  BeakerIcon,
  CalendarIcon,
  EyeIcon,
  ShareIcon,
  TrashIcon,
  BookmarkIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

interface ProjectDetail {
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
}

interface Annotation {
  annotation_id: string;
  content: string;
  author_id: string;
  author_username: string;
  created_at: string;
  article_pmid?: string;
  report_id?: string;
  analysis_id?: string;
}

export default function ProjectWorkspace() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);
  
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [addingAnnotation, setAddingAnnotation] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('viewer');
  const [inviting, setInviting] = useState(false);
  const [pinnedArticles, setPinnedArticles] = useState<any[]>([]);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
      fetchAnnotations();
      loadPinnedArticles();
    }
  }, [projectId]);

  const loadPinnedArticles = () => {
    if (projectId) {
      const pinnedKey = `pinned_articles_${projectId}`;
      const existing = JSON.parse(localStorage.getItem(pinnedKey) || '[]');
      setPinnedArticles(existing);
    }
  };

  // Refresh pinned articles when page regains focus (user returns from research page)
  useEffect(() => {
    const handleFocus = () => {
      loadPinnedArticles();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Project not found');
        }
        if (response.status === 403) {
          throw new Error('Access denied');
        }
        throw new Error('Failed to fetch project details');
      }
      const data = await response.json();
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnotations = async () => {
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/annotations`);
      if (response.ok) {
        const data = await response.json();
        setAnnotations(data.annotations || []);
      }
    } catch (err) {
      console.error('Failed to fetch annotations:', err);
    }
  };

  const addAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnotation.trim()) return;

    setAddingAnnotation(true);
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/annotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newAnnotation.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add annotation');
      }

      setNewAnnotation('');
      fetchAnnotations(); // Refresh annotations
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add annotation');
    } finally {
      setAddingAnnotation(false);
    }
  };

  const inviteCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to invite collaborator');
      }

      setInviteEmail('');
      setInviteRole('viewer');
      fetchProjectDetails(); // Refresh project details to show new collaborator
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite collaborator');
    } finally {
      setInviting(false);
    }
  };

  const removeCollaborator = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) return;

    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/collaborators/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove collaborator');
      }

      fetchProjectDetails(); // Refresh project details
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove collaborator');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const startNewResearch = () => {
    router.push(`/?projectId=${projectId}`);
  };

  const goToResearchPage = () => {
    router.push('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Authenticating...' : 'Loading project...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render project workspace if not authenticated
  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.project_name}</h1>
              {project.description && (
                <p className="mt-2 text-gray-600">{project.description}</p>
              )}
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Created {formatDate(project.created_at)}
                </span>
                <span className="flex items-center">
                  <UserGroupIcon className="h-4 w-4 mr-1" />
                  {project.collaborators.length + 1} member{project.collaborators.length !== 0 ? 's' : ''}
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowCollaborators(!showCollaborators)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <ShareIcon className="h-5 w-5 mr-2" />
                Collaborate
              </button>
              <button
                onClick={goToResearchPage}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <BeakerIcon className="h-5 w-5 mr-2" />
                Research Hub
              </button>
              <button
                onClick={startNewResearch}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <BeakerIcon className="h-5 w-5 mr-2" />
                New Research
              </button>
            </div>
          </div>
        </div>

        {/* Collaborators Panel */}
        {showCollaborators && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Collaborators</h3>
            <div className="space-y-3">
              {/* Owner */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">{project.owner_user_id}</span>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Owner</span>
                </div>
              </div>
              
              {/* Collaborators */}
              {project.collaborators.map((collaborator) => (
                <div key={collaborator.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{collaborator.username}</span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      collaborator.role === 'editor' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {collaborator.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      Joined {formatDate(collaborator.invited_at)}
                    </span>
                    <button
                      onClick={() => removeCollaborator(collaborator.user_id)}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      title="Remove collaborator"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Invite Collaborator Form */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-3">Invite New Collaborator</h4>
              <form onSubmit={inviteCollaborator}>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <select 
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'viewer' | 'editor')}
                    className="px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button 
                    type="submit"
                    disabled={inviting || !inviteEmail.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {inviting ? 'Inviting...' : 'Invite'}
                  </button>
                </div>
              </form>
              <p className="text-xs text-blue-700 mt-2">
                Viewers can see project content. Editors can add reports and annotations.
              </p>
            </div>
          </div>
        )}

        {/* Pinned Articles Section */}
        {pinnedArticles.length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-6">
              <BookmarkIcon className="h-5 w-5 text-yellow-600" />
              <h2 className="text-xl font-semibold text-gray-900">Pinned Articles</h2>
              <span className="text-sm text-gray-500">{pinnedArticles.length} article{pinnedArticles.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pinnedArticles.map((article, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{article.title}</h3>
                    <button
                      onClick={() => {
                        const filtered = pinnedArticles.filter((_, i) => i !== index);
                        setPinnedArticles(filtered);
                        const pinnedKey = `pinned_articles_${projectId}`;
                        localStorage.setItem(pinnedKey, JSON.stringify(filtered));
                      }}
                      className="ml-2 p-1 text-gray-400 hover:text-red-600"
                      title="Remove from pinned"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-3">{article.summary}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex gap-2">
                      <span>Score: {article.publication_score}</span>
                      <span>Confidence: {article.confidence_score}</span>
                    </div>
                    {article.url && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <ArrowTopRightOnSquareIcon className="h-3 w-3 mr-1" />
                        View
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Reports Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Research Reports</h2>
                <span className="text-sm text-gray-500">{project.reports.length} report{project.reports.length !== 1 ? 's' : ''}</span>
              </div>
              
              {project.reports.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start your first research analysis for this project
                  </p>
                  <button
                    onClick={startNewResearch}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <BeakerIcon className="h-5 w-5 mr-2" />
                    Start Research
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {project.reports.map((report) => (
                    <div key={report.report_id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">{report.title}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{report.objective}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {formatDate(report.created_at)}
                            </span>
                            <span>By {report.created_by}</span>
                          </div>
                        </div>
                        <button className="ml-4 p-2 text-gray-400 hover:text-gray-600">
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Annotations Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-6">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Team Notes</h2>
              </div>
              
              {/* Add Annotation Form */}
              <form onSubmit={addAnnotation} className="mb-6">
                <textarea
                  value={newAnnotation}
                  onChange={(e) => setNewAnnotation(e.target.value)}
                  placeholder="Add a note or comment..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <button
                  type="submit"
                  disabled={addingAnnotation || !newAnnotation.trim()}
                  className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingAnnotation ? 'Adding...' : 'Add Note'}
                </button>
              </form>
              
              {/* Annotations List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {annotations.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No notes yet. Add the first one above!
                  </p>
                ) : (
                  annotations.map((annotation) => (
                    <div key={annotation.annotation_id} className="border-l-4 border-blue-200 pl-4 py-2">
                      <p className="text-sm text-gray-800 mb-2">{annotation.content}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{annotation.author_username || annotation.author_id}</span>
                        <span>{formatDate(annotation.created_at)}</span>
                      </div>
                      {annotation.article_pmid && (
                        <div className="mt-1">
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            PMID: {annotation.article_pmid}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
