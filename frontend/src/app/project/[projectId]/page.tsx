'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AnnotationsFeed from '@/components/AnnotationsFeed';
import ActivityFeed from '@/components/ActivityFeed';
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
  tags: string[];
  settings: Record<string, any>;
  reports: Array<{
    report_id: string;
    title: string;
    objective: string;
    created_at: string;
    created_by: string;
    status: string;
    article_count: number;
  }>;
  collaborators: Array<{
    user_id: string;
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

export default function ProjectWorkspace() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  
  // Handle dynamic route parameter safely for Next.js 15
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId as string;
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 ProjectWorkspace component loaded:', {
      projectId,
      params,
      pathname: window.location.pathname,
      user: user?.user_id
    });
  }, [projectId, params, user]);

  // Early return if no projectId
  if (!projectId) {
    console.error('❌ No projectId found in params:', params);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invalid Project</h1>
          <p className="text-gray-600 mt-2">Project ID not found in URL</p>
          <p className="text-sm text-gray-500 mt-1">Params: {JSON.stringify(params)}</p>
          <a href="/dashboard" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg">
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);
  
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [addingAnnotation, setAddingAnnotation] = useState(false);

  useEffect(() => {
    if (projectId && user && !authLoading) {
      fetchProjectDetails();
    }
  }, [projectId, user, authLoading]);

  const fetchProjectDetails = async () => {
    try {
      console.log('🔄 Fetching project details from database for project:', projectId);
      
      const user_id = user?.user_id || 'default_user';
      const response = await fetch(`/api/proxy/projects/${projectId}`, {
        headers: {
          'User-ID': user_id,
          'Content-Type': 'application/json',
        },
      });
      
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
      console.log('✅ Project details loaded:', data.project_name);
      setProject(data);
    } catch (err) {
      console.error('❌ Error fetching project details:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
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
            {authLoading ? 'Authenticating...' : 'Loading project from database...'}
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
          <h1 className="text-2xl font-bold text-red-600">Error Loading Project</h1>
          <p className="text-gray-600 mt-2">{error}</p>
          <div className="mt-4 space-x-4">
            <button
              onClick={() => fetchProjectDetails()}
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
            <Link
              href="/dashboard"
              className="inline-block bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Project Not Found</h1>
          <p className="text-gray-600 mt-2">The requested project could not be found.</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.project_name}</h1>
                {project.description && (
                  <p className="text-gray-600 text-sm">{project.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={startNewResearch}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Research
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                <ShareIcon className="h-5 w-5 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Project Overview */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Project Details Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Overview</h2>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 w-24">Owner:</span>
                  <span className="text-gray-900">{project.owner_user_id}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 w-24">Created:</span>
                  <span className="text-gray-900">{formatDate(project.created_at)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 w-24">Updated:</span>
                  <span className="text-gray-900">{formatDate(project.updated_at)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 w-24">Reports:</span>
                  <span className="text-gray-900">{project.reports.length}</span>
                </div>
              </div>
              
              {project.tags && project.tags.length > 0 && (
                <div className="mt-4">
                  <span className="text-gray-500 text-sm">Tags:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {project.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Research Reports */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Research Reports</h2>
                <button
                  onClick={startNewResearch}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  New Report
                </button>
              </div>
              
              {project.reports.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
                  <p className="text-gray-600 mb-4">Start your first research analysis</p>
                  <button
                    onClick={startNewResearch}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create First Report
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {project.reports.map((report) => (
                    <div
                      key={report.report_id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{report.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{report.objective}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Created {formatDate(report.created_at)}</span>
                            <span>By {report.created_by}</span>
                            <span>{report.article_count} articles</span>
                            <span className={`px-2 py-1 rounded-full ${
                              report.status === 'completed' ? 'bg-green-100 text-green-800' :
                              report.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {report.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-gray-600">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600">
                            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={startNewResearch}
                  className="w-full flex items-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <BeakerIcon className="h-5 w-5 mr-3" />
                  Generate Research Report
                </button>
                <button
                  onClick={goToResearchPage}
                  className="w-full flex items-center px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-3" />
                  Go to Research Page
                </button>
              </div>
            </div>

            {/* Collaborators */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Team</h3>
                <button className="text-blue-600 hover:text-blue-700">
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
              
              {project.collaborators.length === 0 ? (
                <div className="text-center py-4">
                  <UserGroupIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No collaborators yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {project.collaborators.map((collaborator) => (
                    <div key={collaborator.user_id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{collaborator.user_id}</p>
                        <p className="text-xs text-gray-500">{collaborator.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Real-time Annotations Feed */}
            <div className="bg-white rounded-lg shadow">
              <AnnotationsFeed 
                projectId={projectId}
                className="h-96"
              />
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-lg shadow">
              <ActivityFeed 
                projectId={projectId}
                limit={15}
                className="h-96"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
